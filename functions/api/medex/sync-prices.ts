import {
  defaultMedexFetchHtml,
  parseMedexBrandDetailHtml,
  searchMedexLiveUsingFetcher,
} from '../../../src/utils/medexEngine';

interface CfPagesContext {
  request: Request;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: CfPagesContext): Promise<Response> {
  try {
    const body = (await context.request.json().catch(() => ({}))) as {
      items?: Array<{
        id?: string;
        medexUrl?: string;
        brandName?: string;
        strength?: string;
      }>;
    };
    const rawItems = Array.isArray(body?.items) ? body.items.slice(0, 12) : [];
    if (rawItems.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, fetchedAtMs: Date.now(), updatedItems: [] }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const settled = await Promise.allSettled(
      rawItems.map(async (entry) => {
        if (!entry) return null;
        if (
          entry.medexUrl &&
          typeof entry.medexUrl === 'string' &&
          entry.medexUrl.includes('medex.com.bd/brands/')
        ) {
          const cleanUrl = entry.medexUrl.split('?')[0];
          const html = await defaultMedexFetchHtml(cleanUrl, 6500);
          const detail = parseMedexBrandDetailHtml(html, cleanUrl);
          return detail ? { ...detail, targetCatalogId: entry.id } : null;
        }
        const q = `${entry.brandName || ''} ${entry.strength || ''}`.trim();
        if (q.length < 2) return null;
        const found = await searchMedexLiveUsingFetcher(q, {
          limit: 6,
          bypassCache: true,
        });
        const normBrand = String(entry.brandName || '').trim().toLowerCase();
        const normStr = String(entry.strength || '').trim().toLowerCase();
        const matched =
          found.find(
            (f) =>
              f.brandName.toLowerCase() === normBrand &&
              (!normStr || f.strength.toLowerCase() === normStr)
          ) || found[0];
        return matched ? { ...matched, targetCatalogId: entry.id } : null;
      })
    );

    const updatedItems = settled
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && Boolean(r.value))
      .map((r) => r.value);

    return new Response(
      JSON.stringify({
        ok: true,
        source: 'medex.com.bd',
        fetchedAtMs: Date.now(),
        updatedItems,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err?.message || 'MedEx price sync failed',
        updatedItems: [],
      }),
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
