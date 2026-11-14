// Live API client for transportesrober.com.
//
// The site has no JSON API: `paradas.htm` renders an HTML table of upcoming
// arrivals for a stop code. This client posts the form, keeps the session cookie
// the site expects, caches the last good response in MMKV, and retries transient
// failures with a short backoff.
import { CONFIG } from '@/constants/config';
import type { Arrival, LiveApiLineStopsResponse, LiveApiStop, StopSearchResult } from '@/types/api';
import {
  isStopNotFoundError,
  parseStopArrivalsHtml,
  parseStopSearchHtml,
} from '@/utils/liveApi';

import { getSafeMMKV, type KeyValueStorage } from './mmkv';

const CACHE_ID = 'api-cache';

function getCache(): KeyValueStorage {
  return getSafeMMKV({ id: CACHE_ID });
}

const BASE_URL = 'https://www.transportesrober.com/flotamovimiento';
const ARRIVALS_URL = `${BASE_URL}/paradas.htm`;
const SESSION_COOKIE_KEY = 'rober-session';
const ARRIVALS_CACHE_PREFIX = 'rober-arrivals:';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

/**
 * Normalises a stop code to the string the live API expects.
 *
 * GTFS `stop_code` is declared as a string, but PapaParse runs with
 * `dynamicTyping: true`, so a numeric code like `9` arrives as the number `9`.
 * Calling `.trim()` on it throws `TypeError: undefined is not a function`, which is
 * exactly how this surfaced at runtime. Coerce here so every entry point is safe.
 */
function toStopCode(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export class LiveApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'not-found' | 'parse' = 'network',
  ) {
    super(message);
    this.name = 'LiveApiError';
  }
}

export interface LiveApiClientOptions {
  /** Base backoff between retries in ms (doubles each attempt). Default 500. */
  retryDelayMs?: number;
  /** Max retries after the first attempt. Default 2. */
  maxRetries?: number;
  /** Request timeout in ms. Default 15000. */
  timeoutMs?: number;
}

export class LiveApiClient {
  private sessionCookie: string | null = null;
  private cookieExpiry: number = 0;
  private readonly retryDelayMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options: LiveApiClientOptions = {}) {
    this.sessionCookie = getCache().getString(SESSION_COOKIE_KEY) ?? null;
    this.retryDelayMs = options.retryDelayMs ?? 500;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  }

  /**
   * Fetches the next arrivals for a stop.
   *
   * `stopCode` is the GTFS `stop_code` (the number printed on the bus stop), not
   * the internal `stop_id`.
   */
  async getStopArrivals(stopCode: string | number): Promise<Arrival[]> {
    const code = toStopCode(stopCode);
    if (!code) return [];

    const html = await this.postForm(ARRIVALS_URL, {
      excel: '',
      parada: code,
    });

    if (isStopNotFoundError(html)) {
      throw new LiveApiError(`Stop ${code} was not found`, 'not-found');
    }

    const arrivals = parseStopArrivalsHtml(html);
    this.cacheArrivals(code, arrivals);
    return arrivals;
  }

  /**
   * Resolves a partial stop name to stop codes (the site's own search box).
   * Returns an empty array when the query is empty.
   */
  async searchStops(query: string): Promise<StopSearchResult[]> {
    const term = String(query ?? '').trim();
    if (!term) return [];

    const html = await this.postForm(ARRIVALS_URL, {
      excel: '',
      parada: term,
    });

    if (isStopNotFoundError(html)) return [];
    return parseStopSearchHtml(html);
  }

  /** Retrieves all stops for a given line code by posting to `linea_paradas.php`. */
  async getLineStops(lineCode: string): Promise<LiveApiStop[]> {
    const code = lineCode.trim();
    if (!code) return [];

    const html = await this.postForm(`${BASE_URL}/linea_paradas.php`, {
      linea: code,
    });

    if (isStopNotFoundError(html)) return [];

    // Parse the HTML response to extract stop information.
    // The response contains hidden inputs with stop details inside table rows.
    const stopPattern = /<input[^>]*name=\"parada\"[^>]*value=\"([^\"]*)\"[^>]*>\s*<div class=\"tfccs\"[^>]*>([\\s\\S]*?)<\/div>/gi;
    const stops: LiveApiStop[] = [];

    let match: RegExpExecArray | null;
    while ((match = stopPattern.exec(html)) !== null) {
      const stopId = match[1].trim();
      const stopNameRaw = match[2];
      const stopName = stopRaw
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&/gi, '&')
        .replace(/"/gi, '\"')
        .replace(/&#0?39;|&apos;/gi, "'")
        .replace(/</gi, '<')
        .replace(/>/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();

      if (!stopId) continue;

      stops.push({
        stopId,
        stopName,
        lat: 0,
        lon: 0,
        order: stops.length,
      });
    }

    return stops;
  }


  /** Returns the last cached arrivals for a stop, if any. */
  getCachedArrivals(stopCode: string | number): Arrival[] | null {
    const code = toStopCode(stopCode);
    if (!code) return null;
    const raw = getCache().getString(`${ARRIVALS_CACHE_PREFIX}${code}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Arrival[];
    } catch {
      return null;
    }
  }

  private cacheArrivals(stopCode: string, arrivals: Arrival[]): void {
    try {
      getCache().set(`${ARRIVALS_CACHE_PREFIX}${stopCode}`, JSON.stringify(arrivals));
    } catch {
      // Caching is best-effort; a failed write must not fail the request.
    }
  }

  private async postForm(
    url: string,
    fields: Record<string, string>,
  ): Promise<string> {
    let lastError: unknown;

    // Refresh session cookie if needed before making the request
    await this.refreshSessionIfNeeded();

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const body = new URLSearchParams(fields).toString();
        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html,application/xhtml+xml',
            Referer: `${BASE_URL}/paradas.htm`,
            ...(this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
          },
          body,
        });

        this.rememberSessionCookie(response);

        if (!response.ok) {
          throw new LiveApiError(`Live API responded with ${response.status}`);
        }

        const html = await response.text();

        // An empty body means the WAF intercepted the request; it is retryable.
        if (!html) {
          throw new LiveApiError('Live API returned an empty response');
        }

        return html;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await delay(this.retryDelayMs * 2 ** attempt);
        }
      }
    }

    if (lastError instanceof LiveApiError) throw lastError;
    throw new LiveApiError(
      `Live API request failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    );
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private rememberSessionCookie(response: Response): void {
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) return;
    const cookie = setCookie.split(';')[0];
    if (!cookie) return;
    this.sessionCookie = cookie;
    // Parse expiry date from the cookie to track when it expires
    const expiryMatch = setCookie.match(/expires=([^;]+)/i);
    if (expiryMatch) {
      const expiryDate = new Date(expiryMatch[1]).getTime();
      if (!isNaN(expiryDate)) {
        this.cookieExpiry = expiryDate;
      }
    }
    try {
      getCache().set(SESSION_COOKIE_KEY, cookie);
    } catch {
      // Best-effort: the cookie still works for this session.
    }
  }

  /** Checks if the stored session cookie is close to expiry and refreshes it if needed. */
  private async refreshSessionIfNeeded(): Promise<boolean> {
    const now = Date.now();
    // Refresh if cookie expires within the next 5 minutes or has already expired
    if (this.cookieExpiry > 0 && now >= this.cookieExpiry - 5 * 60 * 1000) {
      // Clear the old cookie and try to get a new one from the site
      this.sessionCookie = null;
      this.cookieExpiry = 0;
      try {
        // Fetch the main page to get a fresh session cookie
        const response = await this.fetchWithTimeout(`${BASE_URL}/paradas.htm`, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
            'Referer': `${BASE_URL}/paradas.htm`,
          },
        });
        if (response.ok) {
          this.rememberSessionCookie(response);
          return true;
        }
      } catch {
        // Ignore errors during refresh; the current session may still work
      }
    }
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const liveApiClient = new LiveApiClient();

export const LIVE_API_CONFIG = {
  baseUrl: BASE_URL,
  arrivalsUrl: ARRIVALS_URL,
  refetchIntervalMs: CONFIG.NOTIFICATION_CHECK_INTERVAL_MS,
} as const;
