import { MedicineCatalogItem } from '../types';
import { getApiBaseUrl } from './persistentStorage';
import {
  parseMedexBrandDetailHtml,
  searchMedexLiveUsingFetcher,
  MedexBrandFetchResult,
} from './medexEngine';

export interface MedexSearchResponse {
  ok: boolean;
  source?: string;
  query?: string;
  fetchedAtMs?: number;
  items?: MedicineCatalogItem[];
  error?: string;
}

export interface MedexSyncResponse {
  ok: boolean;
  source?: string;
  fetchedAtMs?: number;
  updatedItems?: Array<MedicineCatalogItem & { targetCatalogId?: string }>;
  error?: string;
}

const clientBrandCache = new Map<string, { fetchedAtMs: number; data: MedexBrandFetchResult }>();
const clientSearchCache = new Map<string, { fetchedAtMs: number; items: MedicineCatalogItem[] }>();

function combineSignals(
  external?: AbortSignal,
  timeoutMs = 12000
): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (external) {
        external.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}

async function tryFetchJsonEndpoint<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<T | null> {
  const { signal, cleanup } = combineSignals(externalSignal, timeoutMs);
  try {
    const resp = await fetch(url, { ...init, signal });
    if (!resp.ok) return null;
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    // Critical on Cloudflare Pages / SPA hosts: reject text/html (e.g. index.html fallback or 302 cookie gate)
    if (ct && !ct.includes('json') && !ct.includes('javascript')) {
      return null;
    }
    const text = await resp.text();
    if (!text || text.trim().startsWith('<')) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  } finally {
    cleanup();
  }
}

const LOCAL_MEDEX_SEARCH_CACHE_KEY = 'medex_live_search_cache_v2';

function readPersistedSearchCache(queryKey: string): MedicineCatalogItem[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LOCAL_MEDEX_SEARCH_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, { fetchedAtMs: number; items: MedicineCatalogItem[] }>;
    const hit = map?.[queryKey];
    if (hit && Array.isArray(hit.items) && Date.now() - hit.fetchedAtMs < 15 * 60 * 1000) {
      return hit.items;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writePersistedSearchCache(queryKey: string, items: MedicineCatalogItem[]): void {
  if (!items || items.length === 0) return;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem(LOCAL_MEDEX_SEARCH_CACHE_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<
      string,
      { fetchedAtMs: number; items: MedicineCatalogItem[] }
    >;
    const now = Date.now();
    // Prune expired or oversized entries
    const keys = Object.keys(map);
    if (keys.length > 40) {
      keys
        .sort((a, b) => (map[a]?.fetchedAtMs || 0) - (map[b]?.fetchedAtMs || 0))
        .slice(0, keys.length - 30)
        .forEach((k) => delete map[k]);
    }
    map[queryKey] = { fetchedAtMs: now, items };
    window.localStorage.setItem(LOCAL_MEDEX_SEARCH_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

async function fetchMedexViaBrowserCorsProxy(
  targetUrl: string,
  timeoutMs = 8000,
  externalSignal?: AbortSignal
): Promise<string> {
  const attempts: Array<() => Promise<string | null>> = [
    // 1. r.jina.ai raw HTML mode (supports CORS on iqbal-pharmacy.pages.dev and returns full MedEx HTML)
    async () => {
      const { signal, cleanup } = combineSignals(externalSignal, timeoutMs);
      try {
        const resp = await fetch(`https://r.jina.ai/${targetUrl}`, {
          method: 'GET',
          headers: { 'X-Return-Format': 'html' },
          signal,
        });
        if (!resp.ok) return null;
        const html = await resp.text();
        if (
          html &&
          (html.includes('medex.com.bd') ||
            html.includes('page-heading-1-l') ||
            html.includes('search-result') ||
            html.includes('lsri'))
        ) {
          return html;
        }
        return null;
      } finally {
        cleanup();
      }
    },
    // 2. allorigins JSON wrapper fallback
    async () => {
      const { signal, cleanup } = combineSignals(externalSignal, Math.min(timeoutMs, 6500));
      try {
        const resp = await fetch(
          `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
          { method: 'GET', signal }
        );
        if (!resp.ok) return null;
        const data = (await resp.json()) as { contents?: string };
        const html = data?.contents || '';
        if (
          html &&
          (html.includes('medex.com.bd') ||
            html.includes('page-heading-1-l') ||
            html.includes('search-result') ||
            html.includes('lsri'))
        ) {
          return html;
        }
        return null;
      } finally {
        cleanup();
      }
    },
    // 3. codetabs raw proxy fallback
    async () => {
      const { signal, cleanup } = combineSignals(externalSignal, Math.min(timeoutMs, 6000));
      try {
        const resp = await fetch(
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
          { method: 'GET', signal }
        );
        if (!resp.ok) return null;
        const html = await resp.text();
        if (
          html &&
          (html.includes('medex.com.bd') ||
            html.includes('page-heading-1-l') ||
            html.includes('search-result') ||
            html.includes('lsri'))
        ) {
          return html;
        }
        return null;
      } finally {
        cleanup();
      }
    },
  ];

  for (const run of attempts) {
    if (externalSignal?.aborted) throw new Error('Aborted');
    try {
      const html = await run();
      if (html) return html;
    } catch {
      // try next relay
    }
  }
  throw new Error('MedEx proxy unavailable');
}

export async function searchMedexLiveFromApi(
  query: string,
  options: { limit?: number; refresh?: boolean; signal?: AbortSignal } = {}
): Promise<MedicineCatalogItem[]> {
  const cleanQ = query.trim();
  if (cleanQ.length < 2) return [];

  const cacheKey = cleanQ.toLowerCase();
  if (!options.refresh) {
    const persisted = readPersistedSearchCache(cacheKey);
    if (persisted && persisted.length > 0) {
      return persisted;
    }
  }

  const limit = options.limit ?? 20;
  const refreshParam = options.refresh ? '&refresh=1' : '';
  const path = `/api/medex/search?q=${encodeURIComponent(cleanQ)}&limit=${limit}${refreshParam}`;

  // 1. Try same-origin API first (works on localhost, .run.app, AND Cloudflare Pages Functions)
  const sameOriginData = await tryFetchJsonEndpoint<MedexSearchResponse>(
    path,
    { method: 'GET' },
    14000,
    options.signal
  );
  if (sameOriginData?.ok && Array.isArray(sameOriginData.items)) {
    writePersistedSearchCache(cacheKey, sameOriginData.items);
    return sameOriginData.items;
  }

  // 2. Try configured remote API base if distinct and returns real JSON (skips auth HTML gates)
  const remoteBase = getApiBaseUrl();
  if (remoteBase) {
    const remoteData = await tryFetchJsonEndpoint<MedexSearchResponse>(
      `${remoteBase}${path}`,
      { method: 'GET' },
      7000,
      options.signal
    );
    if (remoteData?.ok && Array.isArray(remoteData.items)) {
      writePersistedSearchCache(cacheKey, remoteData.items);
      return remoteData.items;
    }
  }

  // 3. Browser-side verified HTML relay fallback (rate-safe budget so r.jina.ai stays fast and under 20 req/min)
  if (options.signal?.aborted) return [];
  try {
    const items = await searchMedexLiveUsingFetcher(cleanQ, {
      limit: Math.min(limit, 8),
      maxFetches: 10,
      concurrency: 3,
      bypassCache: Boolean(options.refresh),
      fetchHtml: (url, ms) => fetchMedexViaBrowserCorsProxy(url, ms || 8000, options.signal),
      brandCache: clientBrandCache,
      searchCache: clientSearchCache,
    });
    writePersistedSearchCache(cacheKey, items);
    return items;
  } catch {
    return [];
  }
}

export async function syncMedexPricesFromApi(
  items: Array<{
    id: string;
    medexUrl?: string;
    medexBrandId?: string;
    brandName: string;
    strength?: string;
    dosageForm?: string;
  }>,
  externalSignal?: AbortSignal
): Promise<Array<MedicineCatalogItem & { targetCatalogId?: string }>> {
  if (!Array.isArray(items) || items.length === 0) return [];

  const payload = JSON.stringify({ items: items.slice(0, 12) });
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  };

  // 1. Try same-origin /api/medex/sync-prices first
  const sameOriginData = await tryFetchJsonEndpoint<MedexSyncResponse>(
    '/api/medex/sync-prices',
    init,
    12000,
    externalSignal
  );
  if (sameOriginData?.ok && Array.isArray(sameOriginData.updatedItems)) {
    return sameOriginData.updatedItems;
  }

  // 2. Try remote API base if distinct
  const remoteBase = getApiBaseUrl();
  if (remoteBase) {
    const remoteData = await tryFetchJsonEndpoint<MedexSyncResponse>(
      `${remoteBase}/api/medex/sync-prices`,
      init,
      9000,
      externalSignal
    );
    if (remoteData?.ok && Array.isArray(remoteData.updatedItems)) {
      return remoteData.updatedItems;
    }
  }

  // 3. Browser-side CORS relay fallback for direct brand URLs
  const directItems = items.filter((i) => i.medexUrl && i.medexUrl.includes('medex.com.bd/brands/')).slice(0, 6);
  if (directItems.length === 0) return [];
  const settled = await Promise.allSettled(
    directItems.map(async (entry) => {
      const cleanUrl = entry.medexUrl!.split('?')[0];
      const html = await fetchMedexViaBrowserCorsProxy(cleanUrl, 6500, externalSignal);
      const parsed = parseMedexBrandDetailHtml(html, cleanUrl);
      return parsed ? { ...parsed, targetCatalogId: entry.id } : null;
    })
  );
  return settled
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && Boolean(r.value))
    .map((r) => r.value);
}
