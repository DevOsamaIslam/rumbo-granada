import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveApiClient, LiveApiError } from './liveApi';
import { __resetSafeMMKVForTests } from './mmkv';

const ARRIVALS_HTML = `
<div class="tfr">
<div class="tfcc"><input type="hidden" name="ln" value="33"></div>
<div class="tfccs">33 CENES DE LA VEGA - ESTACIÓN AUTOBUSES</div>
<div class="tfcc">4</div>
<div class="tfcc">14:47</div>
</div>
`;

const SEARCH_HTML = `
<div class="tfr">
<div class="tfcc"><input type="hidden" name="parada" value="10"></div>
<div class="tfcl">Ctra de Sierra Nevada - Los Pinillos</div>
</div>
`;

const NOT_FOUND_HTML = '<div class="message">Esta parada no existe.</div>';

function response(
  body: string,
  { ok = true, status = 200, headers = {} as Record<string, string> } = {},
) {
  return {
    ok,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    text: async () => body,
  } as unknown as Response;
}

describe('LiveApiClient cache resilience', () => {
  afterEach(() => {
    vi.doUnmock('react-native-mmkv');
    __resetSafeMMKVForTests();
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not throw when MMKV returns an object without methods (Nitro web)', async () => {
    // Reproduces the real failure: `createMMKV()` succeeds but the HybridObject has
    // no methods installed, so `mmkv.getString` is undefined at call time.
    vi.resetModules();
    vi.doMock('react-native-mmkv', () => ({
      createMMKV: () => ({ id: 'api-cache' }),
    }));
    __resetSafeMMKVForTests();

    const { LiveApiClient: Reloaded } = await import('./liveApi');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response(ARRIVALS_HTML)),
    );

    const client = new Reloaded({ retryDelayMs: 1 });
    await expect(client.getStopArrivals('9')).resolves.toHaveLength(1);
    // Degrades to an in-memory cache instead of crashing; the read path still works.
    expect(client.getCachedArrivals('9')).toHaveLength(1);
  });

  it('does not throw when createMMKV itself throws', async () => {
    vi.resetModules();
    vi.doMock('react-native-mmkv', () => ({
      createMMKV: () => {
        throw new Error('Nitro module not installed');
      },
    }));
    __resetSafeMMKVForTests();

    const { LiveApiClient: Reloaded } = await import('./liveApi');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response(ARRIVALS_HTML)),
    );

    const client = new Reloaded({ retryDelayMs: 1 });
    await expect(client.getStopArrivals('9')).resolves.toHaveLength(1);
  });

  it('reuses a real MMKV when it is available', async () => {
    const store = new Map<string, string>();
    vi.resetModules();
    vi.doMock('react-native-mmkv', () => ({
      createMMKV: () => ({
        getString: (key: string) => store.get(key),
        set: (key: string, value: string) => store.set(key, value),
        remove: (key: string) => store.delete(key),
      }),
    }));
    __resetSafeMMKVForTests();

    const { LiveApiClient: Reloaded } = await import('./liveApi');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(ARRIVALS_HTML, {
          headers: { 'set-cookie': 'us_par=1021; Path=/' },
        }),
      ),
    );

    const client = new Reloaded({ retryDelayMs: 1 });
    await client.getStopArrivals('9');

    // Arrivals were cached and the session cookie was persisted.
    expect(client.getCachedArrivals('9')).toHaveLength(1);
    expect(store.get('rober-session')).toBe('us_par=1021');
  });
});

describe('LiveApiClient', () => {
  let client: LiveApiClient;

  beforeEach(() => {
    // Keep retry backoff tiny so failure-path tests stay fast.
    client = new LiveApiClient({ retryDelayMs: 1 });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a numeric stop code (GTFS dynamicTyping quirk)', async () => {
    // PapaParse with dynamicTyping can hand back stop_code as a number; the client
    // must coerce it rather than calling .trim() on a number.
    const fetchMock = vi.fn().mockResolvedValue(response(ARRIVALS_HTML));
    vi.stubGlobal('fetch', fetchMock);

    const arrivals = await client.getStopArrivals(9 as unknown as string);

    expect(arrivals).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('parada=9');
  });

  it('returns an empty array for a null-ish stop code', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.getStopArrivals(null as unknown as string)).resolves.toEqual([]);
    await expect(client.getStopArrivals(undefined as unknown as string)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads cached arrivals for a numeric stop code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(ARRIVALS_HTML)));
    await client.getStopArrivals('9');

    expect(client.getCachedArrivals(9 as unknown as string)).toHaveLength(1);
  });

  it('returns parsed arrivals for a stop code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(ARRIVALS_HTML));
    vi.stubGlobal('fetch', fetchMock);

    const arrivals = await client.getStopArrivals('9');

    expect(arrivals).toEqual([
      {
        lineCode: '33',
        destination: '33 CENES DE LA VEGA - ESTACIÓN AUTOBUSES',
        minutes: 4,
        scheduledTime: '14:47',
        isRealTime: true,
      },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('paradas.htm');
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain('parada=9');
  });

  it('throws a not-found error when the site reports the stop does not exist', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(NOT_FOUND_HTML));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.getStopArrivals('9999')).rejects.toMatchObject({
      kind: 'not-found',
    });
    // A missing stop is a definitive answer: do not retry it.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array for a blank stop code without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.getStopArrivals('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the session cookie and stores the one it receives', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response(ARRIVALS_HTML, {
          headers: { 'set-cookie': 'us_par=1021; Path=/' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await client.getStopArrivals('9');
    await client.getStopArrivals('9');

    // First call has no cookie yet; the second reuses the stored one.
    expect(fetchMock.mock.calls[0][1].headers.Cookie).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].headers.Cookie).toBe('us_par=1021');
  });

  it('retries a transient failure and then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(response(ARRIVALS_HTML));
    vi.stubGlobal('fetch', fetchMock);

    const arrivals = await client.getStopArrivals('9');

    expect(arrivals).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after the configured retries', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.getStopArrivals('9')).rejects.toBeInstanceOf(
      LiveApiError,
    );
    // Initial attempt + 2 retries.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('treats an empty body as retryable', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(''));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.getStopArrivals('9')).rejects.toBeInstanceOf(
      LiveApiError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns an empty arrival list when the page has no rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response('<div class="tf"></div>')),
    );

    await expect(client.getStopArrivals('9')).resolves.toEqual([]);
  });

  it('searches stops by partial name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(SEARCH_HTML)));

    const results = await client.searchStops('Sierra');

    expect(results).toEqual([
      { stopCode: '10', stopName: 'Ctra de Sierra Nevada - Los Pinillos' },
    ]);
  });

  it('skips the search request for a blank query', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.searchStops('  ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns cached arrivals after a successful fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(ARRIVALS_HTML)));

    await client.getStopArrivals('9');

    expect(client.getCachedArrivals('9')).toHaveLength(1);
    expect(client.getCachedArrivals('404')).toBeNull();
  });
});

describe('LiveApiClient.getLineStops (linea_paradas.php)', () => {
  let lineClient: LiveApiClient;

  beforeEach(() => {
    lineClient = new LiveApiClient({ retryDelayMs: 1 });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Realistic `linea_paradas.php` HTML: hidden `parada` input + `tfcl` stop name per row (matches the live site). */
  const LINEA_PARADAS_HTML = `
<div class="tf" style="max-width:580px;">
  <div class="tfr">
    <input type="hidden" name="parada" value="10">
    <div class="tfcl">Ctra de Sierra Nevada - Los Pinillos</div>
  </div>
  <div class="tfr">
    <input type="hidden" name="parada" value="11">
    <div class="tfcl">Avda. Sierra Nevada 140</div>
  </div>
  <div class="tfr">
    <input type="hidden" name="parada" value="12">
    <div class="tfcl">Centro - Gran V\u00eda</div>
  </div>
</div>
`;

  it('parses stop code and name pairs from linea_paradas.php HTML', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(LINEA_PARADAS_HTML));
    vi.stubGlobal('fetch', fetchMock);

    const stops = await lineClient.getLineStops('33');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('linea_paradas.php');
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain('linea=33');

    expect(stops).toEqual([
      { stopId: '10', stopName: 'Ctra de Sierra Nevada - Los Pinillos', lat: 0, lon: 0, order: 0 },
      { stopId: '11', stopName: 'Avda. Sierra Nevada 140', lat: 0, lon: 0, order: 1 },
      { stopId: '12', stopName: 'Centro - Gran Vía', lat: 0, lon: 0, order: 2 },
    ]);
  });

  it('returns an empty array for an empty line code without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const stops = await lineClient.getLineStops('');

    expect(stops).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an empty array when the site reports the stop does not exist', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(NOT_FOUND_HTML));
    vi.stubGlobal('fetch', fetchMock);

    const stops = await lineClient.getLineStops('999');
    expect(stops).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when the page has no matching stop rows', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response('<div class="tf">no rows here</div>'));
    vi.stubGlobal('fetch', fetchMock);

    const stops = await lineClient.getLineStops('33');
    expect(stops).toEqual([]);
  });
});
