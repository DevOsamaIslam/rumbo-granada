import { describe, it, expect } from 'vitest';
import {
  getLineStops,
  isStopNotFoundError,
  parseStopArrivalsHtml,
  parseStopSearchHtml,
} from './liveApi';

/** Two arrivals for line 33 at stop 73, trimmed from the real response. */
const ARRIVALS_HTML = `
<div class="tf" style="max-width:580px;">
<div class="tfh" style="height:50px;">
<div class="tfcc" style="color:#006699;">Línea</div>
<div class="tfcc" style="color:#006699;">Trayecto</div>
<div class="tfcc" style="color:#006699;">Mins</div>
<div class="tfcc" style="color:#006699;">Llega</div>
</div>
<div class="tfr">
<div class="tfcc" ;">
<form action="/flotamovimiento/linea_paradas.php" method="post" cellspacing=0 cellpadding=0>
<input type="hidden" name="ln" value="33">
<button type="submit" style="border:none;background-color:#fff;"><div class="form_white" style="background-color:#E5097A;width:34px;border-radius:8px;">33</div></button>
</form>
</div>
<div class="tfccs" >33 CENES DE LA VEGA - ESTACIÓN AUTOBUSES</div>
<div class="tfcc" >1</div>
<div class="tfcc" >15:15</div>
</div>
<div class="tfr">
<div class="tfcc"  style="background-color:#eee;;">
<form action="/flotamovimiento/linea_paradas.php" method="post" cellspacing=0 cellpadding=0>
<input type="hidden" name="ln" value="33">
<button type="submit" style="border:none;background-color:#eee;"><div class="form_white" style="background-color:#E5097A;width:34px;border-radius:8px;">33</div></button>
</form>
</div>
<div class="tfccs" style="background-color:#eee;">33 CENES DE LA VEGA - ESTACIÓN AUTOBUSES</div>
<div class="tfcc" style="background-color:#eee;">28</div>
<div class="tfcc" style="background-color:#eee;">15:42</div>
</div>
</div>
`;

const SEARCH_HTML = `
<div class="tf" style="max-width:580px;">
<div class="tfh" style="height:50px">
<div class="tfcc">Código</div>
<div class="tfcc">Nombre de Parada</div>
</div>
<div class="tfr">
<div class="tfcc" style="background-color:#eee;background-color:#fefefe;">
<form method="post" cellspacing=0 cellpadding=0>
<input type="hidden" name="parada" value="10">
<button type="submit" style="border:none;background-color:#fff;">
<div class="form_black" style="border-bottom:2px solid #006699;color:#006699;" >10</div>
</button></form></div>
<div class="tfcl" style="background-color:#eee;background-color:#fefefe;">Ctra de Sierra Nevada - Los Pinillos</div>
</div>
<div class="tfr">
<div class="tfcc" style="background-color:#eee;;">
<form method="post" cellspacing=0 cellpadding=0>
<input type="hidden" name="parada" value="11">
<button type="submit" style="border:none;background-color:#eee;">
<div class="form_black" style="border-bottom:2px solid #006699;color:#006699;" >11</div>
</button></form></div>
<div class="tfcl" style="background-color:#eee;;">Avda. Sierra Nevada 140</div>
</div>
</div>
`;

const NOT_FOUND_HTML =
  '<div class="message"><br />Esta parada no existe.<br /><br /></div>';

describe('parseStopArrivalsHtml', () => {
  it('parses every arrival row', () => {
    const arrivals = parseStopArrivalsHtml(ARRIVALS_HTML);

    expect(arrivals).toHaveLength(2);
    expect(arrivals[0]).toEqual({
      lineCode: '33',
      destination: '33 CENES DE LA VEGA - ESTACIÓN AUTOBUSES',
      minutes: 1,
      scheduledTime: '15:15',
      isRealTime: true,
    });
    expect(arrivals[1]).toMatchObject({ minutes: 28, scheduledTime: '15:42' });
  });

  it('ignores the header row (it has no line input)', () => {
    const arrivals = parseStopArrivalsHtml(ARRIVALS_HTML);
    expect(arrivals.every((arrival) => arrival.lineCode === '33')).toBe(true);
  });

  it('returns an empty array when the stop does not exist', () => {
    expect(parseStopArrivalsHtml(NOT_FOUND_HTML)).toEqual([]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseStopArrivalsHtml('')).toEqual([]);
  });
});

describe('parseStopSearchHtml', () => {
  it('parses code and name pairs', () => {
    const results = parseStopSearchHtml(SEARCH_HTML);

    expect(results).toEqual([
      { stopCode: '10', stopName: 'Ctra de Sierra Nevada - Los Pinillos' },
      { stopCode: '11', stopName: 'Avda. Sierra Nevada 140' },
    ]);
  });

  it('returns an empty array when there are no results', () => {
    expect(parseStopSearchHtml(NOT_FOUND_HTML)).toEqual([]);
  });
});

describe('isStopNotFoundError', () => {
  it('detects the "esta parada no existe" page', () => {
    expect(isStopNotFoundError(NOT_FOUND_HTML)).toBe(true);
  });

  it('returns false for an arrivals page', () => {
    expect(isStopNotFoundError(ARRIVALS_HTML)).toBe(false);
  });
});

/** Tests for getLineStops HTML parsing. */
describe('getLineStops', () => {
  it('returns empty array for empty line code', async () => {
    const stops = await getLineStops('');
    expect(stops).toEqual([]);
  });

  it('handles HTML with no matching stops', async () => {
    const stops = await getLineStops('999');
    expect(stops).toEqual([]);
  });
});
