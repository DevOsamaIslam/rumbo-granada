import { describe, it, expect } from 'vitest';
import { GTFSService } from './gtfs';

/**
 * Guards the runtime crash caused by PapaParse's `dynamicTyping`: GTFS declares
 * `stop_code` as a string, but `dynamicTyping` turned a numeric code into a number,
 * so `stopCode.trim()` in the live API client threw
 * `TypeError: undefined is not a function`.
 *
 * `papaparse` is deliberately NOT mocked here, so the real parser runs.
 */
describe('GTFSService CSV typing', () => {
  it('keeps stop_code as a string but leaves numeric columns as numbers', async () => {
    const csv = [
      'stop_id,stop_code,stop_name,stop_lat,stop_lon',
      'a164fda3-a663-412d-9042-21edc335cc95,9,Avda. Sierra Nevada 97,37.157368,-3.5297508',
    ].join('\n');

    const service = new GTFSService();
    const rows = await (
      service as unknown as {
        parseCsvText<T>(text: string, source: string): Promise<T[]>;
      }
    ).parseCsvText<{ stop_code: unknown; stop_lat: unknown }[]>(csv, 'stops.txt');

    expect(rows[0].stop_code).toBe('9');
    expect(typeof rows[0].stop_code).toBe('string');
    expect(rows[0].stop_lat).toBe(37.157368);
    expect(typeof rows[0].stop_lat).toBe('number');
  });

  it('keeps all-digit route colours as strings', async () => {
    // `525252` is a real route colour; coerced to a number it would make
    // `getBadgeBackgroundColor` throw on `.trim()` while rendering a line badge.
    const csv = [
      'route_id,route_short_name,route_color,route_text_color',
      'b4ab663b,111,525252,000000',
      '5f388836,F2,FF0000,FFFFFF',
    ].join('\n');

    const service = new GTFSService();
    const rows = await (
      service as unknown as {
        parseCsvText<T>(text: string, source: string): Promise<T[]>;
      }
    ).parseCsvText<
      { route_color: unknown; route_text_color: unknown }[]
    >(csv, 'routes.txt');

    expect(rows[0].route_color).toBe('525252');
    expect(typeof rows[0].route_color).toBe('string');
    expect(rows[0].route_text_color).toBe('000000');
    // Non-numeric colours are untouched.
    expect(rows[1].route_color).toBe('FF0000');
  });

  it('keeps all-digit route_short_name values as strings', async () => {
    // The stop screen keys its colour map by `route_short_name` and looks it up with
    // the string line code from the live API. If the short name were numeric, the map
    // key would be the number 33 and `get('33')` would miss — which is exactly why
    // every arrivals badge fell back to the indigo default.
    const csv = [
      'route_id,route_short_name,route_color',
      'b4ab663b,33,E5097A',
      '5f388836,N6,8D297B',
    ].join('\n');

    const service = new GTFSService();
    const rows = await (
      service as unknown as {
        parseCsvText<T>(text: string, source: string): Promise<T[]>;
      }
    ).parseCsvText<{ route_short_name: unknown }[]>(csv, 'routes.txt');

    expect(rows[0].route_short_name).toBe('33');
    expect(typeof rows[0].route_short_name).toBe('string');

    // The lookup the stop screen performs must resolve.
    const map = new Map(rows.map((r) => [String(r.route_short_name), 'x']));
    expect(map.get('33')).toBe('x');
  });
});