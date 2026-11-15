import { searchMedexLiveUsingFetcher, defaultMedexFetchHtml, MEDEX_BASE_URL } from '../../../src/utils/medexEngine';

interface CfPagesContext {
  request: Request;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: CfPagesContext): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const q = (url.searchParams.get('q') || '').trim();
    const limit = parseInt(url.searchParams.get('limit') || '24', 10) || 24;
    const refresh =
      url.searchParams.get('refresh') === '1' ||
      url.searchParams.get('refresh') === 'true';

    if (q.length < 2) {
      return new Response(
        JSON.stringify({
          ok: true,
          source: 'medex.com.bd',
          query: q,
          fetchedAtMs: Date.now(),
          items: [],
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const items = await searchMedexLiveUsingFetcher(q, {
      limit,
      bypassCache: refresh,
      fetchHtml: (targetUrl, timeoutMs) =>
        defaultMedexFetchHtml(
          targetUrl.startsWith('http') ? targetUrl : `${MEDEX_BASE_URL}${targetUrl}`,
          timeoutMs
        ),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        source: 'medex.com.bd',
        query: q,
        fetchedAtMs: Date.now(),
        items,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err?.message || 'MedEx search failed',
        items: [],
      }),
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
