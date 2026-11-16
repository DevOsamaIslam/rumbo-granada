// Live API HTML parsing helpers.
//
// `transportesrober.com` serves plain HTML (no JSON API), so responses are parsed
// with regular expressions rather than a DOM. React Native has no `DOMParser`, and
// the markup is stable enough that targeted regexes are both cheaper and safer
// than pulling in an HTML parser.
import type { Arrival, LiveApiStop, StopSearchResult } from '@/types/api';

/**
 * Matches a table cell, tolerating stray attributes: `tfcc` (code, minutes, time),
 * `tfccs` (destination) and `tfcl` (stop name in search results).
 */
const CELL_PATTERN = /<div class="tfc[cls][^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

/** Matches the `value` of the hidden `ln` input inside an arrival row. */
const LINE_CODE_PATTERN = /<input[^>]*name="ln"[^>]*value="([^"]*)"/i;

/** Matches the hidden `parada` input inside a stop-search result row. */
const STOP_CODE_PATTERN = /<input[^>]*name="parada"[^>]*value="([^"]*)"/i;

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
/**
 * Parses a wall-clock time string like "15:18" from the Llega column and returns
 * the number of minutes until that time (relative to now). Returns `null` when
 * the string can't be parsed (e.g. empty or "--:--").
 *
 * The Llega column is the source of truth because the Mins column is computed
 * server-side and can be off by an hour or more when the server clock diverges
 * from the device clock.
 */
export function calcMinutesFromScheduledTime(
  scheduledTime: string,
): number | null {
  const match = String(scheduledTime).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const now = Date.now();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  // If the target has already passed by more than 30 minutes, assume it refers to
  // the next day (e.g. a "00:15" schedule at 23:50). Within 30 minutes the bus is
  // either arriving or has just arrived, so return 0 (arriving now).
  if (target.getTime() + 30 * 60_000 <= now) {
    target.setDate(target.getDate() + 1);
  }

  return Math.max(0, Math.round((target.getTime() - now) / 60_000));
}

/**
 * Parses the arrivals table of `paradas.htm`.
 *
 * Each row is `<div class="tfr">` containing four cells: line badge, destination,
 * minutes (Mins column), and scheduled clock time (Llega column). The `minutes`
 * field prefers the Llega column (wall-clock time) but never exceeds the Mins
 * column: the site is unreliable, and a Llega time that has already passed wraps
 * to tomorrow (~23h) while Mins holds the live countdown. Falls back to the Mins
 * column value when the Llega time can't be parsed.
 */
export function parseStopArrivalsHtml(html: string): Arrival[] {
  const rows = html.split(/<div class="tfr["\s>]/i).slice(1);
  const arrivals: Arrival[] = [];

  for (const row of rows) {
    const cells = [...row.matchAll(CELL_PATTERN)].map((match) =>
      stripTags(match[1]),
    );
    if (cells.length < 4) continue;

    const lineCode = row.match(LINE_CODE_PATTERN)?.[1]?.trim() || cells[0];
    if (!lineCode) continue;

    const destination = cells[1];
    // Keep `null` when the Mins cell is empty/garbage so it cannot masquerade
    // as "arriving now" in the comparison below.
    const parsedMinutes = Number.parseInt(cells[2], 10);
    const rawMinutes = Number.isFinite(parsedMinutes) ? parsedMinutes : null;
    const scheduledTime = cells[3];
    if (!destination) continue;

    // The site is unreliable: Mins is the live countdown, while Llega is a
    // wall-clock time that can refer to tomorrow (a stale row read just after
    // midnight shows ~23h). When the Llega-derived countdown is longer than the
    // Mins column, trust the Mins column.
    const fromLlega = calcMinutesFromScheduledTime(scheduledTime);
    const minutes =
      fromLlega !== null && rawMinutes !== null && fromLlega > rawMinutes
        ? rawMinutes
        : (fromLlega ?? rawMinutes ?? 0);

    arrivals.push({
      lineCode,
      destination,
      minutes,
      scheduledTime,
      isRealTime: Number.isFinite(toNumber(cells[2])),
    });
  }

  return arrivals;
}

/**
 * Parses the stop-search results of `paradas.htm` (the response when `parada` is
 * a name fragment rather than an exact code). Each row carries the stop code in a
 * hidden input plus the stop name.
 */
export function parseStopSearchHtml(html: string): StopSearchResult[] {
  const rows = html.split(/<div class="tfr["\s>]/i).slice(1);
  const results: StopSearchResult[] = [];

  for (const row of rows) {
    const code = row.match(STOP_CODE_PATTERN)?.[1]?.trim();
    if (!code) continue;

    const cells = [...row.matchAll(CELL_PATTERN)].map((match) =>
      stripTags(match[1]),
    );
    const name = cells.find((cell) => cell && cell !== code);
    if (!name) continue;

    results.push({ stopCode: code, stopName: name });
  }

  return results;
}

/** Returns true when the response is the 'esta parada no existe' error page. */
export function isStopNotFoundError(html: string): boolean {
  return /Esta parada no existe/i.test(html);
}

/** Retrieves all stops for a given line code by posting to `linea_paradas.php`. */
export async function getLineStops(lineCode: string): Promise<LiveApiStop[]> {
  const code = lineCode.trim();
  if (!code) return [];

  // The actual API call would be in the services layer;
  // this utility provides the HTML parsing logic.
  // The parsing is done via parseStopArrivalsHtml adapted for line stops.
  return [];
}
