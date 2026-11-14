import { MedicineCatalogItem } from '../types';
import { getApiBaseUrl } from './persistentStorage';

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

function combineSignals(external?: AbortSignal, timeoutMs = 10000): {
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

export async function searchMedexLiveFromApi(
  query: string,
  options: { limit?: number; refresh?: boolean; signal?: AbortSignal } = {}
): Promise<MedicineCatalogItem[]> {
  const cleanQ = query.trim();
  if (cleanQ.length < 2) return [];

  const limit = options.limit ?? 8;
  const refreshParam = options.refresh ? '&refresh=1' : '';
  const url = `${getApiBaseUrl()}/api/medex/search?q=${encodeURIComponent(cleanQ)}&limit=${limit}${refreshParam}`;

  const { signal, cleanup } = combineSignals(options.signal, 11000);
  try {
    const resp = await fetch(url, {
      method: 'GET',
      signal,
    });
    if (!resp.ok) {
      throw new Error(`MedEx search HTTP ${resp.status}`);
    }
    const data = (await resp.json()) as MedexSearchResponse;
    if (!data.ok || !Array.isArray(data.items)) {
      return [];
    }
    return data.items;
  } finally {
    cleanup();
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

  const url = `${getApiBaseUrl()}/api/medex/sync-prices`;
  const { signal, cleanup } = combineSignals(externalSignal, 12000);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.slice(0, 12) }),
      signal,
    });
    if (!resp.ok) {
      throw new Error(`MedEx sync HTTP ${resp.status}`);
    }
    const data = (await resp.json()) as MedexSyncResponse;
    if (!data.ok || !Array.isArray(data.updatedItems)) {
      return [];
    }
    return data.updatedItems;
  } finally {
    cleanup();
  }
}
