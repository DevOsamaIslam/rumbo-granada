# 08 — Live API Integration

## Overview

Scrapes real-time bus data from `transportesrober.com/flotamovimiento/`:
- **Line stops** → `linea_paradas.php?ln={lineCode}` — ordered stops with live bus positions
- **Stop arrivals** → `paradas.htm` (POST form) — next buses arriving at a stop

## API Types (`src/types/api.ts`)

```ts
export interface LiveStop {
  stopId: string;
  stopCode: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  buses: LiveBus[];
}

export interface LiveBus {
  id: string;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  lastUpdate: number;
  lineCode: string;
  destination: string;
}

export interface Arrival {
  lineCode: string;
  lineName: string;
  destination: string;
  minutes: number;
  distance: number;
  isRealTime: boolean;
  busId?: string;
}
## Live API Client (`src/services/liveApi.ts`)

```ts
import { MMKV } from 'react-native-mmkv';
import type { LiveStop, LiveBus, Arrival } from '@/types/api';

const mmkv = new MMKV({ id: 'api-cache' });
const BASE_URL = 'https://www.transportesrober.com/flotamovimiento';
const SESSION_COOKIE_KEY = 'rober-session';

export class LiveApiClient {
  private sessionCookie: string | null = null;

  constructor() {
    this.sessionCookie = mmkv.getString(SESSION_COOKIE_KEY);
  }

  private async fetchWithSession(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set('Cookie', this.sessionCookie ?? '');
    headers.set('User-Agent', 'Mozilla/5.0 (Linux; Android 14) Rumbo Granada/1.0');
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    headers.set('Referer', BASE_URL + '/');

    const response = await fetch(url, { ...options, headers, credentials: 'include' });
    
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.sessionCookie = setCookie.split(';')[0];
      mmkv.set(SESSION_COOKIE_KEY, this.sessionCookie);
    }
    
    return response;
  }

  async getLineStops(lineCode: string): Promise<LiveStop[]> {
    const url = `${BASE_URL}/linea_paradas.php?ln=${encodeURIComponent(lineCode)}`;
    const response = await this.fetchWithSession(url);
    const html = await response.text();
    return this.parseLineStops(html, lineCode);
  }

  async getStopArrivals(stopCode: string): Promise<Arrival[]> {
    const url = `${BASE_URL}/paradas.htm`;
    const formData = new FormData();
    formData.append('parada', stopCode);
    
    const response = await this.fetchWithSession(url, {
      method: 'POST',
      body: formData,
    });
    const html = await response.text();
    return this.parseArrivals(html);
  }

  private parseLineStops(html: string, lineCode: string): LiveStop[] {
    const stops: LiveStop[] = [];
    // Parse HTML table from linea_paradas.php
    return stops;
  }

  private parseArrivals(html: string): Arrival[] {
    const arrivals: Arrival[] = [];
    // Parse HTML from paradas.htm
    return arrivals;
  }
}

export const liveApiClient = new LiveApiClient();
```
## React Query Hooks (`src/hooks/useStops.ts`)

```tsx
import { useQuery } from '@tanstack/react-query';
import { liveApiClient } from '@/services/liveApi';
import { gtfsService } from '@/services/gtfs';

export function useLineStops(lineCode: string) {
  return useQuery({
    queryKey: ['lineStops', lineCode],
    queryFn: () => liveApiClient.getLineStops(lineCode),
    enabled: !!lineCode,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export function useStopArrivals(stopCode: string) {
  return useQuery({
    queryKey: ['arrivals', stopCode],
    queryFn: () => liveApiClient.getStopArrivals(stopCode),
    enabled: !!stopCode,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useBusPosition(busId: string) {
  return useQuery({
    queryKey: ['busPosition', busId],
    queryFn: async () => null,
    enabled: !!busId,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}
```

## HTML Parsing Helpers (`src/utils/liveApi.ts`)

```ts
export function parseLineStopsTable(html: string, lineCode: string): LiveStop[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return [];

  const stops: LiveStop[] = [];
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return;
    const cells = row.querySelectorAll('td');
    if (cells.length < 5) return;

    const stopCode = cells[1].textContent?.trim() ?? '';
    const name = cells[2].textContent?.trim() ?? '';
    const lat = parseFloat(cells[3].textContent?.trim() ?? '0');
    const lon = parseFloat(cells[4].textContent?.trim() ?? '0');
    
    const gtfsStop = gtfsService.getStopsForRoute(lineCode).find(s => s.stop_code === stopCode);
    
    stops.push({
      stopId: gtfsStop?.stop_id ?? '',
      stopCode,
      name,
      latitude: lat,
      longitude: lon,
      order: index,
      buses: [],
    });
  });

  return stops;
}

export function parseArrivalsTable(html: string): Arrival[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return [];

  const arrivals: Arrival[] = [];
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return;
    const cells = row.querySelectorAll('td');
    if (cells.length < 4) return;

    const lineInfo = cells[0].textContent?.trim() ?? '';
    const destination = cells[1].textContent?.trim() ?? '';
    const minutesText = cells[2].textContent?.trim() ?? '';
    const distanceText = cells[3].textContent?.trim() ?? '';

    const [lineCode, lineName] = lineInfo.split(' - ');
    const minutes = parseMinutes(minutesText);
    const distance = parseDistance(distanceText);
    const isRealTime = !minutesText.includes('~');

    arrivals.push({
      lineCode: lineCode.trim(),
      lineName: lineName.trim(),
      destination: destination.trim(),
      minutes,
      distance,
      isRealTime,
    });
  });

  return arrivals;
}

function parseMinutes(text: string): number {
  const match = text.match(/(\d+)\s*min/);
  return match ? parseInt(match[1], 10) : 999;
}

function parseDistance(text: string): number {
  const match = text.match(/(\d+)\s*m/);
  return match ? parseInt(match[1], 10) : 999999;
}
```

## Error Handling & Retry

```ts
private async fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  try {
    return await this.fetchWithSession(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
      return this.fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}
```

## Rate Limiting

- Minimum 15s between requests for same resource
- React Query `staleTime` + `refetchInterval` handles this
- Cache responses in MMKV for offline fallback
```