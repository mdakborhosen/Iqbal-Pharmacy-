import type { MedicineCatalogItem } from '../types.ts';

export const MEDEX_BASE_URL = 'https://medex.com.bd';

export interface MedexFetchFn {
  (url: string, timeoutMs?: number): Promise<string>;
}

export interface MedexBrandFetchResult {
  item: MedicineCatalogItem;
  siblingUrls: string[];
}

interface SearchRowPreview {
  url: string;
  brandId: string;
  brandName: string;
  strength: string;
  dosageForm: string;
  genericName: string;
  companyName: string;
}

export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&times;/g, '×')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(String(html || '').replace(/<[^>]+>/g, ' '));
}

export function normalizeMedexCompanyName(raw: string): string {
  if (!raw) return 'Unknown Pharma';
  let clean = decodeHtmlEntities(raw)
    .replace(/\s*\(See [^)]+\)\s*/gi, ' ')
    .replace(/\s*\(\s*(?:Mfg\.?|Manufactured|Marketed|Mkt\.?)\s*by:?\s*([^)]+?)\s*\)\s*/gi, ' $1 ')
    .replace(/^\s*(?:Mfg\.?|Manufactured|Marketed|Mkt\.?)\s*by:?\s*/gi, '')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s+/g, '(')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip stray wrapping parentheses left after prefix removal
  if (clean.startsWith('(') && clean.endsWith(')') && clean.indexOf('(', 1) === -1) {
    clean = clean.slice(1, -1).trim();
  }
  if (!clean.includes('(') && clean.endsWith(')')) {
    clean = clean.slice(0, -1).trim();
  }

  // Standardize PLC. -> PLC while keeping Ltd. intact
  clean = clean.replace(/\bPLC\.$/i, 'PLC');
  clean = clean.replace(/^The\s+IBN\s+SINA\s+Pharmaceutical\s+PLC$/i, 'IBN SINA Pharmaceutical Industry PLC');

  return clean || 'Unknown Pharma';
}

export function mapMedexDosageForm(
  rawForm: string,
  brandHint = ''
): MedicineCatalogItem['dosageForm'] {
  const f = (rawForm || '').toLowerCase().trim();
  const b = (brandHint || '').toLowerCase().trim();
  const hasWord = (text: string, kw: string) => new RegExp(`\\b${kw}\\b`, 'i').test(text);

  if (f.includes('eye') && (f.includes('drop') || f.includes('gel') || f.includes('oint'))) return 'Eye Drop';
  if (f.includes('ear') && f.includes('drop')) return 'Ear Drop';
  if (f.includes('nasal') && (f.includes('drop') || f.includes('spray'))) return 'Nasal Drop';
  if (f.includes('ophthalmic') || f.includes('eye')) return 'Eye Drop';
  if (f.includes('otic') || f.includes('ear drop')) return 'Ear Drop';
  if (f.includes('pediatric drop') || f.includes('paediatric drop') || f.includes('oral drop') || f.includes('drop')) return 'Drops';
  if (
    f.includes('nebuliser') ||
    f.includes('nebulizer') ||
    f.includes('respirator solution') ||
    f.includes('inhaler') ||
    f.includes('evohaler') ||
    f.includes('rotacap') ||
    f.includes('cozycap') ||
    f.includes('aerocap') ||
    f.includes('dpi') ||
    f.includes('mdi')
  ) {
    return 'Inhaler';
  }
  if (f.includes('capsule') || f.includes('softgel')) return 'Capsule';
  if (f.includes('suppository') || f.includes('pessary')) return 'Suppository';
  if (f.includes('suspension')) return 'Suspension';
  if (
    f.includes('sachet') ||
    f.includes('oral powder') ||
    f.includes('powder for oral') ||
    f.includes('effervescent powder')
  ) {
    return 'Sachet';
  }
  if (
    f.includes('syrup') ||
    f.includes('oral solution') ||
    f.includes('elixir') ||
    f.includes('linctus') ||
    f.includes('mouthwash') ||
    f.includes('gargle')
  ) {
    return 'Syrup';
  }
  if (
    f.includes('injection') ||
    f.includes('infusion') ||
    f.includes('prefilled syringe') ||
    f.includes('pre-filled syringe') ||
    f.includes('penfill') ||
    f.includes('sc inj') ||
    f.includes('iv ') ||
    f.includes('im ')
  ) {
    return 'Injection';
  }
  if (
    f.includes('gel') ||
    f.includes('cream') ||
    f.includes('ointment') ||
    f.includes('lotion') ||
    f.includes('shampoo') ||
    f.includes('topical') ||
    f.includes('emulsion') ||
    f.includes('soap')
  ) {
    return 'Gel';
  }
  if (f.includes('tablet') || f.includes('mups')) return 'Tablet';
  if (f.includes('solution')) return 'Syrup';

  // Word-boundary fallback on brandHint only when rawForm didn't specify a dosage form
  if (!f && b) {
    if (hasWord(b, 'eye drop') || hasWord(b, 'ophthalmic')) return 'Eye Drop';
    if (hasWord(b, 'ear drop')) return 'Ear Drop';
    if (hasWord(b, 'nasal') || hasWord(b, 'spray')) return 'Nasal Drop';
    if (hasWord(b, 'drops')) return 'Drops';
    if (hasWord(b, 'inhaler') || hasWord(b, 'evohaler') || hasWord(b, 'rotacap')) return 'Inhaler';
    if (hasWord(b, 'capsule') || hasWord(b, 'cap')) return 'Capsule';
    if (hasWord(b, 'suppository') || hasWord(b, 'supp')) return 'Suppository';
    if (hasWord(b, 'suspension') || hasWord(b, 'susp')) return 'Suspension';
    if (hasWord(b, 'sachet')) return 'Sachet';
    if (hasWord(b, 'syrup') || hasWord(b, 'syp')) return 'Syrup';
    if (hasWord(b, 'injection') || hasWord(b, 'inj') || hasWord(b, 'penfill') || hasWord(b, 'flexpen')) return 'Injection';
    if (hasWord(b, 'gel') || hasWord(b, 'cream') || hasWord(b, 'ointment') || hasWord(b, 'lotion')) return 'Gel';
  }
  return 'Tablet';
}

export async function defaultMedexFetchHtml(url: string, timeoutMs = 7000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
        Referer: `${MEDEX_BASE_URL}/`,
      },
    });
    if (!resp.ok) {
      throw new Error(`MedEx HTTP ${resp.status}`);
    }
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

export function parseMedexBrandDetailHtml(
  html: string,
  url: string
): MedicineCatalogItem | null {
  const idMatch = url.match(/\/brands\/(\d+)/);
  const medexBrandId = idMatch ? idMatch[1] : '';
  const nowMs = Date.now();

  const h1Match = html.match(/<h1[^>]*class="[^"]*page-heading-1-l[^"]*brand[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Inner = h1Match ? h1Match[1] : '';
  const subtitleMatch = h1Inner.match(/<small[^>]*>([\s\S]*?)<\/small>/i);
  const rawDosageForm = subtitleMatch ? stripHtmlTags(subtitleMatch[1]) : '';
  const brandName = stripHtmlTags(h1Inner.replace(/<small[\s\S]*?<\/small>/gi, ''));

  if (!brandName) return null;

  const genericMatch = html.match(/<div[^>]*title="Generic Name"[^>]*>([\s\S]*?)<\/div>/i);
  const genericName = genericMatch ? stripHtmlTags(genericMatch[1]) : brandName;

  const strengthMatch = html.match(/<div[^>]*title="Strength"[^>]*>([\s\S]*?)<\/div>/i);
  let strength = strengthMatch ? stripHtmlTags(strengthMatch[1]) : '';

  // <div title="Marketed by"> on MedEx can wrap a nested <div title="Manufactured by">,
  // so extract direct company anchor BEFORE the nested Manufactured by block when Marketed by is present.
  let preferredRawCompany = '';
  const mktIdx = html.search(/<div[^>]*title="Marketed by"[^>]*>/i);
  if (mktIdx >= 0) {
    const mktSlice = html.slice(mktIdx, mktIdx + 700).split(/<div[^>]*title="Manufactured by"/i)[0] || '';
    const mktAnchor = mktSlice.match(/<a[^>]*\/companies\/[^>]*>([\s\S]*?)<\/a>/i);
    preferredRawCompany = stripHtmlTags(mktAnchor ? mktAnchor[1] : mktSlice);
  }
  if (!preferredRawCompany || /^unknown/i.test(preferredRawCompany)) {
    const mfgIdx = html.search(/<div[^>]*title="Manufactured by"[^>]*>/i);
    if (mfgIdx >= 0) {
      const mfgSlice = html.slice(mfgIdx, mfgIdx + 500).split(/<div[^>]*class="[^"]*packages-wrapper/i)[0] || '';
      const mfgAnchor = mfgSlice.match(/<a[^>]*\/companies\/[^>]*>([\s\S]*?)<\/a>/i);
      preferredRawCompany = stripHtmlTags(mfgAnchor ? mfgAnchor[1] : mfgSlice);
    }
  }
  const companyName = normalizeMedexCompanyName(preferredRawCompany || 'Unknown Pharma');

  const dosageForm = mapMedexDosageForm(rawDosageForm, brandName);

  let unitPrice = 0;
  let stripPrice = 0;
  let unitsPerStrip = dosageForm === 'Tablet' || dosageForm === 'Capsule' ? 10 : 1;
  let packSize = '';

  const pkgSectionMatch = html.match(/class="[^"]*packages-wrapper[^"]*"([\s\S]{0,6000})/i);
  const rawPkgChunk = pkgSectionMatch ? pkgSectionMatch[1] : '';
  const pkgChunk =
    rawPkgChunk.split(
      /Also available as:|Alternate Brands|id="indications"|class="[^"]*brand-indications|<div[^>]*class="[^"]*rx-warning/i
    )[0] || '';

  if (pkgChunk) {
    const containerBlocks = pkgChunk
      .split(/<div[^>]*class="[^"]*package-container[^"]*"[^>]*>/i)
      .slice(1);
    const containerTexts = containerBlocks
      .map((blk) =>
        stripHtmlTags(
          blk.split(/<div[^>]*class="[^"]*(?:col-xs-12|alternate-brands|rx-warning)/i)[0]
        )
      )
      .filter(Boolean);
    const fullPkgText =
      containerTexts.length > 0 ? containerTexts.join(' | ') : stripHtmlTags(pkgChunk);

    const unitMatch = fullPkgText.match(
      /Unit\s*Price:\s*(?:৳|Tk\.?|BDT)?\s*([0-9,]+(?:\.[0-9]+)?)/i
    );
    if (unitMatch) {
      unitPrice = parseFloat(unitMatch[1].replace(/,/g, '')) || 0;
    }

    const stripMatch = fullPkgText.match(
      /Strip\s*Price:\s*(?:৳|Tk\.?|BDT)?\s*([0-9,]+(?:\.[0-9]+)?)/i
    );
    if (stripMatch) {
      stripPrice = parseFloat(stripMatch[1].replace(/,/g, '')) || 0;
    }

    const packInfoMatch = fullPkgText.match(
      /\((\d+)\s*[x×]\s*(\d+)\s*:\s*(?:৳|Tk\.?|BDT)?\s*([0-9,.]+)\)/i
    );
    if (packInfoMatch) {
      const boxes = parseInt(packInfoMatch[1], 10) || 1;
      const perStrip = parseInt(packInfoMatch[2], 10) || 10;
      const boxTotalPrice = parseFloat(packInfoMatch[3].replace(/,/g, '')) || 0;
      const totalPcs = boxes * perStrip;
      unitsPerStrip = perStrip;
      packSize = `${boxes} × ${perStrip} (${totalPcs} pcs)`;
      if (unitPrice <= 0 && boxTotalPrice > 0 && totalPcs > 0) {
        unitPrice = Number((boxTotalPrice / totalPcs).toFixed(2));
      }
    }

    const sPackMatch = fullPkgText.match(
      /\((\d+)'s\s*pack:\s*(?:৳|Tk\.?|BDT)?\s*([0-9,.]+)\)/i
    );

    // Syrups / Drops / Inhalers / Bottles / Tubes / Injections / Sachets
    if (unitPrice <= 0) {
      for (const cText of containerTexts) {
        const bottleMatch = cText.match(
          /^([^:|]+):\s*(?:৳|Tk\.?|BDT)?\s*([0-9,]+(?:\.[0-9]+)?)/i
        );
        if (bottleMatch) {
          const label = bottleMatch[1].trim();
          const price = parseFloat(bottleMatch[2].replace(/,/g, '')) || 0;
          if (price > 0 && !/price unavailable/i.test(cText)) {
            const packCountInLabel = label.match(/^(\d+)(?:'s)?\s*pack$/i);
            if (packCountInLabel) {
              const cnt = parseInt(packCountInLabel[1], 10) || 1;
              unitPrice = Number((price / cnt).toFixed(2));
              stripPrice = price;
              unitsPerStrip = cnt;
              if (!packSize) packSize = label;
            } else {
              unitPrice = price;
              stripPrice = price;
              unitsPerStrip = 1;
              if (!packSize) {
                packSize = sPackMatch ? `${label} (${sPackMatch[1]}'s pack)` : label;
              }
            }
            if (!strength) {
              const volMatch = label.match(/(\d+(?:\.\d+)?\s*(?:ml|mg|gm|g|mcg))/i);
              if (volMatch) strength = volMatch[1];
            }
            break;
          }
        }
      }
    }

    // Fallback: if still zero and (N's pack: ৳X) was parsed
    if (unitPrice <= 0 && sPackMatch) {
      const cnt = parseInt(sPackMatch[1], 10) || 1;
      const tot = parseFloat(sPackMatch[2].replace(/,/g, '')) || 0;
      if (tot > 0) {
        unitPrice = Number((tot / cnt).toFixed(2));
        stripPrice = tot;
        unitsPerStrip = cnt;
        if (!packSize) packSize = `${cnt}'s pack`;
      }
    }
  }

  if (unitPrice > 0 && stripPrice <= 0) {
    if (
      unitsPerStrip > 1 &&
      (dosageForm === 'Tablet' || dosageForm === 'Capsule' || dosageForm === 'Suppository')
    ) {
      stripPrice = Number((unitPrice * unitsPerStrip).toFixed(2));
    } else {
      stripPrice = unitPrice;
    }
  } else if (stripPrice > 0 && unitPrice <= 0 && unitsPerStrip > 0) {
    unitPrice = Number((stripPrice / unitsPerStrip).toFixed(2));
  }

  if (unitPrice > 0 && stripPrice > 0 && unitPrice !== stripPrice) {
    const ratio = Math.round(stripPrice / unitPrice);
    if (ratio >= 2 && ratio <= 50) {
      unitsPerStrip = ratio;
    }
  }

  if (!packSize) {
    packSize =
      dosageForm === 'Tablet' || dosageForm === 'Capsule'
        ? `10 × ${unitsPerStrip} (${10 * unitsPerStrip} pcs)`
        : '1 Pack / Bottle';
  }
  if (!strength) {
    strength = 'Standard';
  }

  let indication = 'চিকিৎসকের পরামর্শ অনুযায়ী সেব্য';
  const indMatch = html.match(
    /id="indications"[\s\S]{0,600}<div[^>]*class="[^"]*ac-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (indMatch) {
    const cleaned = stripHtmlTags(indMatch[1]);
    if (cleaned) {
      indication = cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
    }
  }

  return {
    id: medexBrandId
      ? `medex_${medexBrandId}`
      : `medex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    brandName,
    genericName,
    companyName,
    strength,
    dosageForm,
    packSize,
    unitsPerStrip,
    unitPrice: Number(unitPrice.toFixed(2)),
    stripPrice: Number(stripPrice.toFixed(2)),
    purchasePrice: unitPrice > 0 ? Number((unitPrice * 0.88).toFixed(2)) : 0,
    therapeuticClass: rawDosageForm || 'MedEx Verified Medicine',
    indication,
    darNo: medexBrandId ? `MEDEX-${medexBrandId}` : 'MEDEX-BD',
    medexBrandId,
    medexUrl: url,
    medexLastSyncedMs: nowMs,
    source: 'medex' as const,
  };
}

export function extractSiblingBrandUrlsFromHtml(html: string): string[] {
  const urls = new Set<string>();
  const anchorMatches = html.matchAll(/<a\b[^>]*btn-sibling-brands[^>]*>/gi);
  for (const m of anchorMatches) {
    const tag = m[0];
    const hrefMatch = tag.match(/href=["']([^"'#]+)["']/i);
    if (hrefMatch) {
      const raw = hrefMatch[1].split('?')[0];
      if (/\/brands\/\d+\//i.test(raw)) {
        const full = raw.startsWith('http')
          ? raw
          : `${MEDEX_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
        urls.add(full);
      }
    }
  }
  return Array.from(urls);
}

export function extractBrandUrlsFromHtml(html: string): string[] {
  const urls = new Set<string>();
  const matches = html.matchAll(
    /href=["'](https?:\/\/medex\.com\.bd\/brands\/\d+\/[^"'#?]+|\/brands\/\d+\/[^"'#?]+)["']/gi
  );
  for (const m of matches) {
    const raw = m[1].split('?')[0];
    const full = raw.startsWith('http') ? raw : `${MEDEX_BASE_URL}${raw}`;
    urls.add(full);
  }
  return Array.from(urls);
}

export function extractSearchRowPreviews(html: string): SearchRowPreview[] {
  const rows: SearchRowPreview[] = [];
  // Ignore sponsored .ad rows; match search-result-row blocks safely even with nested divs
  const chunks = html.split(/<div\s+class=["']search-result-row(["']|\s+[^"']*["'])/gi);
  for (let i = 1; i < chunks.length; i += 2) {
    const classTail = chunks[i] || '';
    if (/\bad\b/i.test(classTail)) continue;
    const body = (chunks[i + 1] || '').slice(0, 1500);
    const anchorMatch = body.match(
      /<a\s+[^>]*href=["']([^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/i
    );
    if (!anchorMatch) continue;
    const rawUrl = anchorMatch[1].split('?')[0];
    if (!/\/brands\/\d+\//i.test(rawUrl)) continue;
    const fullUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `${MEDEX_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    const brandId = fullUrl.match(/\/brands\/(\d+)/)?.[1] || '';
    const titleText = stripHtmlTags(anchorMatch[2]);
    const formMatch = titleText.match(/\(([^)]+)\)\s*$/);
    const rawForm = formMatch ? formMatch[1].trim() : '';
    const withoutForm = formMatch ? titleText.slice(0, formMatch.index).trim() : titleText;
    const descMatch = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const descBlock = descMatch ? descMatch[1] : '';
    const genMatch = descBlock.match(/<i>\(([\s\S]*?)\)<\/i>/i);
    const genericName = genMatch ? stripHtmlTags(genMatch[1]) : withoutForm;
    const mfgText = stripHtmlTags(descBlock);
    const mfgAfter = mfgText.match(/is\s+manufactured\s+by\s+(.+)$/i);
    const companyName = normalizeMedexCompanyName(mfgAfter ? mfgAfter[1] : '');

    rows.push({
      url: fullUrl,
      brandId,
      brandName: withoutForm,
      strength: '',
      dosageForm: mapMedexDosageForm(rawForm, withoutForm),
      genericName,
      companyName,
    });
  }
  return rows;
}

export function extractAjaxSearchPreviews(html: string): SearchRowPreview[] {
  const rows: SearchRowPreview[] = [];
  const anchorMatches = html.matchAll(
    /<a\b[^>]*href=["']([^"'#?]+)["'][^>]*class=["'][^"']*\blsri\b([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  );
  for (const m of anchorMatches) {
    const classTail = m[2] || '';
    if (/\bad\b/i.test(classTail)) continue;
    const rawUrl = (m[1] || '').split('?')[0];
    if (!/\/brands\/\d+\//i.test(rawUrl)) continue;
    const fullUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `${MEDEX_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    const brandId = fullUrl.match(/\/brands\/(\d+)/)?.[1] || '';
    const inner = m[3] || '';
    const titleMatch = inner.match(/<li[^>]*title=["']([^"']*)["']/i);
    const rawForm = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
    const strengthMatch = inner.match(/<span[^>]*class=["'][^"']*sr-strength[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const strength = strengthMatch ? stripHtmlTags(strengthMatch[1]) : '';
    const brandName = stripHtmlTags(
      inner.replace(/<span[^>]*class=["'][^"']*sr-strength[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '')
    );
    if (!brandName) continue;

    rows.push({
      url: fullUrl,
      brandId,
      brandName,
      strength,
      dosageForm: mapMedexDosageForm(rawForm, brandName),
      genericName: '',
      companyName: '',
    });
  }
  return rows;
}

export function extractGenericBrandListUrls(
  html: string,
  queryLower = ''
): Array<{ listUrl: string; isExactGenericMatch: boolean }> {
  const seen = new Set<string>();
  const results: Array<{ listUrl: string; isExactGenericMatch: boolean }> = [];
  const matches = html.matchAll(
    /<a\b[^>]*href=["'](https?:\/\/medex\.com\.bd\/generics\/\d+\/[^"'#?]+|\/generics\/\d+\/[^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi
  );
  const qClean = queryLower.trim().toLowerCase();

  for (const m of matches) {
    const raw = m[1].split('?')[0];
    const full = raw.startsWith('http') ? raw : `${MEDEX_BASE_URL}${raw}`;
    const listUrl = full.endsWith('/brand-names') ? full : `${full}/brand-names`;
    if (seen.has(listUrl)) continue;
    seen.add(listUrl);

    const anchorText = stripHtmlTags(m[2]).toLowerCase();
    const slug = full.split('/').pop()?.toLowerCase() || '';
    const isExactGenericMatch =
      Boolean(qClean) &&
      (anchorText === qClean ||
        anchorText.startsWith(`${qClean} `) ||
        anchorText.startsWith(`${qClean}+`) ||
        slug === qClean.replace(/\s+/g, '-') ||
        slug.startsWith(`${qClean.replace(/\s+/g, '-')}-`));
    results.push({ listUrl, isExactGenericMatch });
  }
  results.sort((a, b) => Number(b.isExactGenericMatch) - Number(a.isExactGenericMatch));
  return results;
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = new Array(items.length);
  let nextIdx = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIdx < items.length) {
        const current = nextIdx++;
        try {
          const val = await fn(items[current]);
          results[current] = { status: 'fulfilled', value: val };
        } catch (reason) {
          results[current] = { status: 'rejected', reason };
        }
      }
    })
  );
  return results;
}

export async function searchMedexLiveUsingFetcher(
  query: string,
  options: {
    limit?: number;
    maxFetches?: number;
    concurrency?: number;
    bypassCache?: boolean;
    fetchHtml?: MedexFetchFn;
    brandCache?: Map<string, { fetchedAtMs: number; data: MedexBrandFetchResult }>;
    searchCache?: Map<string, { fetchedAtMs: number; items: MedicineCatalogItem[] }>;
    brandCacheTtlMs?: number;
    searchCacheTtlMs?: number;
  } = {}
): Promise<MedicineCatalogItem[]> {
  const cleanQ = query.trim();
  if (cleanQ.length < 2) return [];

  const baseFetchHtml = options.fetchHtml || defaultMedexFetchHtml;
  const safeLimit = Math.min(Math.max(options.limit ?? 20, 1), 28);
  const maxFetches = Math.max(options.maxFetches ?? 32, 6);
  const concurrency = Math.max(options.concurrency ?? 6, 1);
  const bypassCache = Boolean(options.bypassCache);
  const brandCacheTtlMs = options.brandCacheTtlMs ?? 5 * 60 * 1000;
  const searchCacheTtlMs = options.searchCacheTtlMs ?? 3 * 60 * 1000;
  const cacheKey = `${cleanQ.toLowerCase()}::${safeLimit}`;

  if (!bypassCache && options.searchCache) {
    const cached = options.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAtMs < searchCacheTtlMs) {
      return cached.items;
    }
  }

  let fetchCount = 0;
  const budgetedFetchHtml = async (url: string, timeoutMs?: number): Promise<string> => {
    if (fetchCount >= maxFetches) {
      throw new Error('Subrequest budget reached');
    }
    fetchCount++;
    return baseFetchHtml(url, timeoutMs);
  };

  const brandUrlSet = new Set<string>();
  const previewByUrl = new Map<string, SearchRowPreview>();

  const ingestHtml = (html: string) => {
    if (!html) return;
    for (const preview of extractAjaxSearchPreviews(html)) {
      brandUrlSet.add(preview.url);
      if (!previewByUrl.has(preview.url)) {
        previewByUrl.set(preview.url, preview);
      }
    }
    for (const preview of extractSearchRowPreviews(html)) {
      brandUrlSet.add(preview.url);
      const existing = previewByUrl.get(preview.url);
      if (!existing) {
        previewByUrl.set(preview.url, preview);
      } else {
        previewByUrl.set(preview.url, {
          ...existing,
          genericName: existing.genericName || preview.genericName,
          companyName: existing.companyName || preview.companyName,
          strength: existing.strength || preview.strength,
        });
      }
    }
    for (const u of extractBrandUrlsFromHtml(html)) {
      brandUrlSet.add(u);
    }
  };

  const normalizedRoot = cleanQ
    .replace(/[-_/]+/g, ' ')
    .replace(
      /\b(\d+(?:\.\d+)?\s*(?:mg|ml|gm|g|mcg|iu|%|tab|tablet|cap|capsule|syr|syrup|susp|suspension|inj|injection|drop|drops|gel|cream|ointment|mups|xr|sr|cr|ds|plus|extra))\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Fetch brands search + ajax live autocomplete in parallel (and general search if budget allows)
  const initialQueries: Array<Promise<string>> = [
    budgetedFetchHtml(`${MEDEX_BASE_URL}/search?search=${encodeURIComponent(cleanQ)}&type=brands`, 7500),
    budgetedFetchHtml(
      `${MEDEX_BASE_URL}/ajax/search?searchtype=brands&searchkey=${encodeURIComponent(cleanQ)}`,
      6500
    ),
  ];
  if (maxFetches >= 14) {
    initialQueries.push(
      budgetedFetchHtml(`${MEDEX_BASE_URL}/search?search=${encodeURIComponent(cleanQ)}&type=search`, 7500)
    );
  }

  const initialSettled = await Promise.allSettled(initialQueries);
  const brandsHtml = initialSettled[0]?.status === 'fulfilled' ? initialSettled[0].value : '';
  const ajaxHtml = initialSettled[1]?.status === 'fulfilled' ? initialSettled[1].value : '';
  const generalHtml = initialSettled[2]?.status === 'fulfilled' ? initialSettled[2].value : '';

  ingestHtml(brandsHtml);
  ingestHtml(ajaxHtml);
  ingestHtml(generalHtml);

  // 2. If pagination (?page=2) or exact generic brand list exists and budget permits, fetch in parallel
  const secondaryFetches: Array<Promise<string>> = [];
  const remainingBudget = () => maxFetches - fetchCount;

  if (brandsHtml && /page=2\b/i.test(brandsHtml) && remainingBudget() > 6) {
    secondaryFetches.push(
      budgetedFetchHtml(
        `${MEDEX_BASE_URL}/search?search=${encodeURIComponent(cleanQ)}&type=brands&page=2`,
        6500
      )
    );
  }

  if (generalHtml && remainingBudget() > 5) {
    const genericEntries = extractGenericBrandListUrls(generalHtml, cleanQ.toLowerCase());
    const exactGenerics = genericEntries.filter((g) => g.isExactGenericMatch);
    const targetGenerics =
      exactGenerics.length > 0
        ? exactGenerics.slice(0, 1)
        : brandUrlSet.size < 6
        ? genericEntries.slice(0, 1)
        : [];
    for (const g of targetGenerics) {
      secondaryFetches.push(budgetedFetchHtml(g.listUrl, 6500));
    }
  }

  if (secondaryFetches.length > 0) {
    const settledSecondary = await Promise.allSettled(secondaryFetches);
    for (const r of settledSecondary) {
      if (r.status === 'fulfilled' && r.value) {
        ingestHtml(r.value);
      }
    }
  }

  // 3. Fallback query on normalized root / first token (e.g. "Seclo 20" -> "Seclo", "Calbo-D 500" -> "Calbo")
  if (
    normalizedRoot.length >= 2 &&
    normalizedRoot.toLowerCase() !== cleanQ.toLowerCase() &&
    brandUrlSet.size < 8 &&
    remainingBudget() > 4
  ) {
    try {
      const rootHtml = await budgetedFetchHtml(
        `${MEDEX_BASE_URL}/search?search=${encodeURIComponent(normalizedRoot)}&type=brands`,
        6500
      );
      ingestHtml(rootHtml);
    } catch {
      // ignore
    }
  }

  const firstWord = normalizedRoot.split(' ')[0] || cleanQ.split(/\s+/)[0] || '';
  if (
    firstWord.length >= 3 &&
    firstWord.toLowerCase() !== cleanQ.toLowerCase() &&
    brandUrlSet.size < 5 &&
    remainingBudget() > 4
  ) {
    try {
      const fwHtml = await budgetedFetchHtml(
        `${MEDEX_BASE_URL}/ajax/search?searchtype=brands&searchkey=${encodeURIComponent(firstWord)}`,
        6000
      );
      ingestHtml(fwHtml);
    } catch {
      // ignore
    }
  }

  const qLower = cleanQ.toLowerCase();
  const qTokens = qLower.split(/[\s\-+]+/).filter((t) => t.length >= 2);
  const qTokenLower = (normalizedRoot || cleanQ).toLowerCase().split(' ')[0] || '';

  const scoreCandidateUrl = (url: string): number => {
    const preview = previewByUrl.get(url);
    const bLow = preview?.brandName.toLowerCase() || '';
    const sLow = preview?.strength.toLowerCase() || '';
    const gLow = preview?.genericName.toLowerCase() || '';
    const slug = url.split('/').pop()?.toLowerCase() || '';
    const combined = `${bLow} ${sLow} ${slug.replace(/-/g, ' ')}`.trim();

    if (bLow === qLower) return 120;
    if (qTokens.length > 1 && qTokens.every((t) => combined.includes(t))) return 110;
    if (bLow.startsWith(`${qLower} `) || bLow.startsWith(`${qLower}-`)) return 95;
    if (bLow.startsWith(qLower)) return 85;
    if (qTokenLower && (bLow.startsWith(qTokenLower) || slug.startsWith(qTokenLower))) return 70;
    if (gLow === qLower || gLow.startsWith(`${qLower} `)) return 60;
    if (bLow.includes(qLower) || (qTokenLower && slug.includes(qTokenLower))) return 40;
    return 10;
  };

  const rankedUrls = Array.from(brandUrlSet).sort((a, b) => scoreCandidateUrl(b) - scoreCandidateUrl(a));
  const detailCap = Math.min(safeLimit, Math.max(4, remainingBudget()));
  const initialBatch = rankedUrls.slice(0, detailCap);
  if (initialBatch.length === 0) {
    return [];
  }

  const fetchBrandDetail = async (url: string): Promise<MedexBrandFetchResult | null> => {
    const cleanUrl = (
      url.startsWith('http') ? url : `${MEDEX_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
    ).split('?')[0];
    if (!bypassCache && options.brandCache) {
      const cached = options.brandCache.get(cleanUrl);
      if (cached && Date.now() - cached.fetchedAtMs < brandCacheTtlMs) {
        return cached.data;
      }
    }
    const html = await budgetedFetchHtml(cleanUrl, 6500);
    const parsed = parseMedexBrandDetailHtml(html, cleanUrl);
    if (!parsed) return null;
    const siblingUrls = extractSiblingBrandUrlsFromHtml(html);
    const result: MedexBrandFetchResult = { item: parsed, siblingUrls };
    options.brandCache?.set(cleanUrl, { fetchedAtMs: Date.now(), data: result });
    return result;
  };

  const fetchedMap = new Map<string, MedicineCatalogItem>();
  const discoveredSiblings = new Set<string>();

  const firstSettled = await runWithConcurrency(initialBatch, concurrency, fetchBrandDetail);
  for (let i = 0; i < initialBatch.length; i++) {
    const r = firstSettled[i];
    if (r.status === 'fulfilled' && r.value?.item) {
      const item = r.value.item;
      fetchedMap.set(String(item.id || initialBatch[i]), item);
      for (const sibUrl of r.value.siblingUrls || []) {
        if (!brandUrlSet.has(sibUrl)) {
          discoveredSiblings.add(sibUrl);
        }
      }
    }
  }

  // 4. Fetch sibling variants ("Also available as:") if budget still allows
  const sibSlotsLeft = Math.min(safeLimit - fetchedMap.size, remainingBudget());
  if (discoveredSiblings.size > 0 && sibSlotsLeft > 0) {
    const siblingList = Array.from(discoveredSiblings)
      .filter((u) => {
        if (!qTokenLower) return true;
        const slug = u.split('/').pop()?.toLowerCase() || '';
        return slug.includes(qTokenLower) || fetchedMap.size < 8;
      })
      .slice(0, sibSlotsLeft);

    if (siblingList.length > 0) {
      const sibSettled = await runWithConcurrency(siblingList, concurrency, fetchBrandDetail);
      for (let i = 0; i < siblingList.length; i++) {
        const r = sibSettled[i];
        if (r.status === 'fulfilled' && r.value?.item) {
          const item = r.value.item;
          fetchedMap.set(String(item.id || siblingList[i]), item);
        }
      }
    }
  }

  const items = Array.from(fetchedMap.values());
  if (items.length > 0 && options.searchCache) {
    options.searchCache.set(cacheKey, { fetchedAtMs: Date.now(), items });
  }
  return items;
}

