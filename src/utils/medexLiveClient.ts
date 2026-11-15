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

async function fetchMedexViaBrowserCorsProxy(
  targetUrl: string,
  timeoutMs = 7000,
  externalSignal?: AbortSignal
): Promise<string> {
  const proxyBuilders = [
    (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  for (const build of proxyBuilders) {
    if (externalSignal?.aborted) throw new Error('Aborted');
    const { signal, cleanup } = combineSignals(externalSignal, timeoutMs);
    try {
      const resp = await fetch(build(targetUrl), { method: 'GET', signal });
      if (!resp.ok) continue;
      const html = await resp.text();
      if (html && (html.includes('medex.com.bd') || html.includes('page-heading-1-l') || html.includes('search-result'))) {
        return html;
      }
    } catch {
      // try next proxy
    } finally {
      cleanup();
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

  const limit = options.limit ?? 24;
  const refreshParam = options.refresh ? '&refresh=1' : '';
  const path = `/api/medex/search?q=${encodeURIComponent(cleanQ)}&limit=${limit}${refreshParam}`;

  // 1. Always try same-origin API first (works on localhost, .run.app, AND Cloudflare Pages Functions on iqbal-pharmacy.pages.dev!)
  const sameOriginData = await tryFetchJsonEndpoint<MedexSearchResponse>(
    path,
    { method: 'GET' },
    15000,
    options.signal
  );
  if (sameOriginData?.ok && Array.isArray(sameOriginData.items)) {
    return sameOriginData.items;
  }

  // 2. Try configured remote API base if distinct and returns real JSON (skips AI Studio 302 HTML cookie gate cleanly)
  const remoteBase = getApiBaseUrl();
  if (remoteBase) {
    const remoteData = await tryFetchJsonEndpoint<MedexSearchResponse>(
      `${remoteBase}${path}`,
      { method: 'GET' },
      9000,
      options.signal
    );
    if (remoteData?.ok && Array.isArray(remoteData.items)) {
      return remoteData.items;
    }
  }

  // 3. Browser-side CORS relay fallback (guarantees MedEx live search even on pure static hosts)
  if (options.signal?.aborted) return [];
  try {
    return await searchMedexLiveUsingFetcher(cleanQ, {
      limit: Math.min(limit, 18),
      bypassCache: Boolean(options.refresh),
      fetchHtml: (url, ms) => fetchMedexViaBrowserCorsProxy(url, ms || 7000, options.signal),
      brandCache: clientBrandCache,
      searchCache: clientSearchCache,
    });
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
