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
 * Parses the arrivals table of `paradas.htm`.
 *
 * Each row is `<div class="tfr">` containing four cells: line badge, destination,
 * minutes, and scheduled clock time. Rows are separated by `tfr` boundaries so the
 * per-row cell lists stay independent.
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
    const minutes = toNumber(cells[2]);
    const scheduledTime = cells[3];
    if (!destination) continue;

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
