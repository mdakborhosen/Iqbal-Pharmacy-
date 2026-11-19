import {
  computePurchaseCartTotals,
  computePurchaseItemMetrics,
  dosageFormFromInvoicePrefix,
  formatCleanMoney,
  getInvoiceFormPrefix,
  parseTransactionItemsDetailed,
} from '../data/bdMedicines';
import {
  MedicineCatalogItem,
  PurchaseCartItem,
  Transaction,
} from '../types';

const BENGALI_TO_ENG_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function normalizeDigitsToEnglish(input: string): string {
  return (input || '').replace(/[০-৯]/g, (ch) => BENGALI_TO_ENG_DIGITS[ch] || ch);
}

export function isDueEntryItem(item: {
  brandName?: string;
  dosageForm?: string;
  medicineId?: string;
  formPrefix?: string;
}): boolean {
  const b = (item.brandName || '').trim().toLowerCase();
  const f = (item.dosageForm || '').trim().toLowerCase();
  const id = (item.medicineId || '').trim().toLowerCase();
  const fp = (item.formPrefix || '').trim().toLowerCase();
  if (f === 'due' || fp === 'due' || id.startsWith('due_') || id.startsWith('due-')) {
    return true;
  }
  return /^(due|previous\s*due|prev\s*due|বকেয়া|পূর্বের\s*বকেয়া)$/i.test(b);
}

/**
 * Returns strict display/print sort priority for cart & invoice items:
 * 1: Syrup / Suspension / Oral Liquid / Solution / Elixir
 * 2: Drops (Eye / Ear / Nasal / Pediatric / Oral Drops)
 * 3: Tablet / Capsule
 * 4: All other dosage forms (Injection, Suppository, Gel, Cream, Inhaler, Sachet, etc.)
 * 5: Due (বকেয়া) — always strictly the very last item
 */
export function getDosageFormSortRank(item: {
  brandName?: string;
  dosageForm?: string;
  medicineId?: string;
  formPrefix?: string;
}): number {
  if (isDueEntryItem(item)) return 5;

  const fp = (item.formPrefix || '').trim().toLowerCase();
  const df = (item.dosageForm || '').trim().toLowerCase();
  const combined = `${fp} ${df}`.trim();
  const normalizedPrefix = df ? getInvoiceFormPrefix(df) : fp;

  // 1. সিরাপ (Syrup / Suspension / Oral Solution / Elixir)
  if (
    normalizedPrefix === 'syp' ||
    normalizedPrefix === 'susp' ||
    /\b(syp|susp|syrup|suspension|elixir|solution|linctus|emulsion|oral\s*liquid)\b/i.test(combined)
  ) {
    return 1;
  }

  // 2. ড্রপ (Drops)
  if (
    normalizedPrefix === 'drops' ||
    normalizedPrefix === 'eye drop' ||
    normalizedPrefix === 'ear drop' ||
    normalizedPrefix === 'nasal drop' ||
    /\b(drops?|eye\s*drop|ear\s*drop|nasal\s*drop|oral\s*drop|pediatric\s*drop|paediatric\s*drop)\b/i.test(
      combined
    )
  ) {
    return 2;
  }

  // 3. ট্যাবলেট / ক্যাপসুল (Tablet / Capsule)
  if (
    normalizedPrefix === 'tab' ||
    normalizedPrefix === 'cap' ||
    /\b(tab|tablet|cap|capsule|softgel|bolus)\b/i.test(combined)
  ) {
    return 3;
  }

  // 4. অন্যান্য সব প্রোডাক্ট (Injection, Suppository, Gel, Inhaler, Sachet, etc.)
  return 4;
}

/**
 * Stably sorts cart/invoice items strictly in the order:
 * সিরাপ -> ড্রপ -> ট্যাবলেট/ক্যাপসুল -> অন্যান্য -> Due (বকেয়া একদম নিচে)
 */
export function orderCartItemsWithDueLast<
  T extends {
    brandName?: string;
    dosageForm?: string;
    medicineId?: string;
    formPrefix?: string;
  }
>(items: T[]): T[] {
  return items
    .map((item, idx) => ({ item, idx, rank: getDosageFormSortRank(item) }))
    .sort((a, b) => a.rank - b.rank || a.idx - b.idx)
    .map((entry) => entry.item);
}

/**
 * Converts dosageForm or invoice prefix into a clean label prefix like "Tab.", "Cap.", "Supp.", "Syp."
 */
export function formatDosagePrefixLabel(formOrPrefix?: string): string {
  const raw = (formOrPrefix || '').trim();
  if (!raw || raw.toLowerCase() === 'due') return '';

  const p = getInvoiceFormPrefix(raw);
  if (!p || p === 'item' || p === 'due') return '';

  switch (p) {
    case 'tab':
      return 'Tab.';
    case 'cap':
      return 'Cap.';
    case 'syp':
      return 'Syp.';
    case 'susp':
      return 'Susp.';
    case 'supp':
      return 'Supp.';
    case 'inj':
      return 'Inj.';
    case 'drops':
      return 'Drops.';
    case 'eye drop':
      return 'Eye Drop.';
    case 'ear drop':
      return 'Ear Drop.';
    case 'nasal drop':
      return 'Nasal Drop.';
    case 'inhaler':
      return 'Inhaler.';
    case 'sachet':
      return 'Sachet.';
    case 'gel':
      return 'Gel.';
    default:
      return `${p.charAt(0).toUpperCase()}${p.slice(1)}.`;
  }
}

function normalizeStrengthToken(rawStrength: string): string {
  const cleaned = normalizeDigitsToEnglish(rawStrength || '').trim();
  if (!cleaned || /^standard$/i.test(cleaned)) return '';

  // Remove trailing words like "Bottle", "Vial", "Tube", "Ampoule" when attached to volume
  let token = cleaned
    .replace(/\b(bottle|vial|tube|ampoule|pack|jar|sachet)\b/gi, '')
    .trim()
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s*\/\s*/g, '/')
    .replace(/(\d)\s*mg\b/gi, '$1')
    .replace(/(\d)\s*(mcg|gm|g|ml|iu|%)\b/gi, (_, digit: string, unit: string) => {
      const lower = unit.toLowerCase();
      return `${digit}${lower === 'iu' ? 'IU' : lower}`;
    })
    .replace(/\s+/g, '');

  return token;
}

function extractLiquidVolumeMl(packSize?: string): string {
  if (!packSize) return '';
  const norm = normalizeDigitsToEnglish(packSize);
  const mlMatch = norm.match(/(\d+(?:\.\d+)?)\s*ml\b/i);
  return mlMatch ? `${mlMatch[1]}ml` : '';
}

function isLiquidDosageForm(dosageForm?: string): boolean {
  const f = (dosageForm || '').toLowerCase();
  return (
    f.includes('syp') ||
    f.includes('syrup') ||
    f.includes('susp') ||
    f.includes('drop') ||
    f.includes('solution') ||
    f.includes('elixir')
  );
}

/**
 * Formats medicine name concisely with optional dosage form prefix for WhatsApp sharing, e.g.:
 * - ("Napa Extra", "", "Tablet") -> "Tab. Napa Extra"
 * - ("Voltalin", "50 mg", "Suppository") -> "Supp. Voltalin-50"
 * - ("Omidon", "60 ml (10 mg/5 ml)", "Syrup") -> "Syp. Omidon-60ml(10/5ml)"
 * - ("Omidon", "10 mg/5 ml", "Syrup", "60 ml Bottle") -> "Syp. Omidon-60ml(10/5ml)"
 */
export function formatCompactProductName(
  brandOrCombined: string,
  strength?: string,
  dosageForm?: string,
  packSize?: string
): string {
  const rawBrand = (brandOrCombined || 'Custom Product').trim();
  const prefix = dosageForm ? formatDosagePrefixLabel(dosageForm) : '';

  let compactStr = strength !== undefined ? normalizeStrengthToken(strength) : '';
  let baseName = rawBrand;

  if (strength !== undefined) {
    const bLow = rawBrand.toLowerCase();
    const sLow = (strength || '').trim().toLowerCase();
    const cLow = compactStr.toLowerCase();

    if (
      compactStr &&
      (bLow.endsWith(`-${cLow}`) ||
        bLow.endsWith(` ${cLow}`) ||
        (sLow && (bLow.endsWith(sLow) || bLow.includes(sLow))))
    ) {
      // Split out already-included strength so we can apply liquid pack ml cleanly if needed
      const extracted = splitCombinedNameAndStrength(rawBrand);
      baseName = extracted.base;
      compactStr = extracted.strengthToken || compactStr;
    } else if (!compactStr) {
      const extracted = splitCombinedNameAndStrength(rawBrand);
      baseName = extracted.base;
      compactStr = extracted.strengthToken;
    }
  } else {
    const extracted = splitCombinedNameAndStrength(rawBrand);
    baseName = extracted.base;
    compactStr = extracted.strengthToken;
  }

  // For liquid forms (Syp/Susp/Drops), if bottle volume (e.g. 60ml) is in packSize and not yet in strength:
  if (isLiquidDosageForm(dosageForm)) {
    const volMl = extractLiquidVolumeMl(packSize);
    if (volMl) {
      const hasLeadingVolume = /^\d+(?:\.\d+)?ml\b/i.test(compactStr);
      if (!hasLeadingVolume) {
        if (compactStr) {
          const inner = compactStr.startsWith('(') && compactStr.endsWith(')')
            ? compactStr
            : `(${compactStr})`;
          compactStr = `${volMl}${inner}`;
        } else {
          compactStr = volMl;
        }
      }
    }
  }

  const nameWithStrength = compactStr ? `${baseName}-${compactStr}` : baseName;
  if (prefix && !nameWithStrength.toLowerCase().startsWith(prefix.toLowerCase())) {
    return `${prefix} ${nameWithStrength}`;
  }
  return nameWithStrength;
}

function splitCombinedNameAndStrength(rawName: string): {
  base: string;
  strengthToken: string;
} {
  const normRaw = normalizeDigitsToEnglish(rawName).trim();
  const match = normRaw.match(
    /^(.+?)[\s-]+(\d+(?:\.\d+)?(?:\s*(?:mg|mcg|gm|g|ml|iu|%)?(?:\s*[+/]\s*\d+(?:\.\d+)?\s*(?:mg|mcg|gm|g|ml|iu|%)?)*)(?:\s*\([^)]+\))?(?:\s*(?:bottle|vial|tube|ampoule))?)$/i
  );
  if (match) {
    const base = match[1].trim();
    const strengthToken = normalizeStrengthToken(match[2]);
    if (base && strengthToken) {
      return { base, strengthToken };
    }
  }
  return { base: rawName.trim(), strengthToken: '' };
}

export function formatMoneyTaka(amount: number): string {
  const safe = Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
  return `${formatCleanMoney(safe)} Taka`;
}

export function formatPurchaseQtyLabel(item: {
  qty?: number;
  packUnit?: string;
  packCount?: number;
}): string {
  if (item.packUnit && item.packUnit !== 'piece' && item.packCount && item.packCount > 0) {
    const unitLabel =
      item.packUnit === 'box'
        ? 'Box'
        : item.packUnit === 'strip'
        ? 'Strip'
        : item.packUnit === 'cartoon'
        ? 'Cartoon'
        : 'Pcs';
    return `${item.packCount} ${unitLabel}`;
  }
  const pcs = Math.max(1, Math.round(item.qty || 1));
  return `${pcs} Pcs`;
}

export function getWhatsAppShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Builds WhatsApp message for Purchase Cart:
 * Shows ONLY numbered Dosage Prefix + Product Name and Quantity (e.g. 1 Box / 10 Pcs).
 * Excludes Due / বকেয়া items completely so they are never copied in the order list.
 */
export function buildPurchaseCartWhatsAppText(
  purchaseCart: PurchaseCartItem[],
  _opts?: {
    shopName?: string;
    supplierCompany?: string;
    dateStr?: string;
  }
): string {
  const validItems = orderCartItemsWithDueLast(
    purchaseCart.filter((i) => i.brandName && i.brandName.trim().length > 0 && !isDueEntryItem(i))
  );
  if (validItems.length === 0) {
    return '';
  }

  return validItems
    .map((item, idx) => {
      const productName = formatCompactProductName(
        item.brandName,
        item.strength,
        item.dosageForm,
        item.packSize
      );
      const qtyLabel = formatPurchaseQtyLabel(item);
      return `${idx + 1}. ${productName} — ${qtyLabel}`;
    })
    .join('\n');
}

/**
 * Builds WhatsApp message for an active Purchase Invoice from Step 3 cart:
 * Shows Dosage Prefix + Product Name, Quantity, Price (Taka), Line Total (Taka),
 * followed by Due (if any), মোট, পরিশোধিত, বাকী.
 */
export function buildPurchaseInvoiceWhatsAppTextFromCart(
  purchaseCart: PurchaseCartItem[],
  opts: {
    shopName?: string;
    supplierCompany?: string;
    invoiceNo?: string;
    dateStr?: string;
    discount?: number;
    vatOverrideStr?: string;
    paidAmountStr?: string;
  }
): string {
  const validItems = orderCartItemsWithDueLast(
    purchaseCart.filter((i) => i.brandName && i.brandName.trim().length > 0)
  );
  const totals = computePurchaseCartTotals(validItems, {
    discount: opts.discount || 0,
    vatOverrideStr: opts.vatOverrideStr,
    paidAmountStr: opts.paidAmountStr,
  });

  const lines: string[] = [];
  const medicineItems = validItems.filter((i) => !isDueEntryItem(i));
  const dueItems = validItems.filter((i) => isDueEntryItem(i));

  medicineItems.forEach((item, idx) => {
    const m = computePurchaseItemMetrics(item);
    const productName = formatCompactProductName(
      item.brandName,
      item.strength,
      item.dosageForm,
      item.packSize
    );
    const qtyLabel = formatPurchaseQtyLabel(item);

    const isPackUnit =
      Boolean(item.packUnit) &&
      item.packUnit !== 'piece' &&
      Boolean(item.packCount) &&
      (item.packCount || 0) > 0;

    const unitPriceVal = isPackUnit
      ? item.packRate && item.packRate > 0
        ? item.packRate
        : Number((m.tp * (item.unitsPerPack || 1)).toFixed(2))
      : m.tp;

    lines.push(`${idx + 1}. ${productName}`);
    lines.push(
      `   পরিমাণ: ${qtyLabel} | দাম: ${formatMoneyTaka(unitPriceVal)} | মোট দাম: ${formatMoneyTaka(m.lineTotal)}`
    );
  });

  if (lines.length > 0) {
    lines.push('');
  }
  if (dueItems.length > 0) {
    const extraDueTotal = dueItems.reduce((acc, d) => acc + computePurchaseItemMetrics(d).lineTotal, 0);
    lines.push(`Due: ${formatMoneyTaka(extraDueTotal)}`);
  }
  if (totals.totalVat > 0) {
    lines.push(`ভ্যাট: ${formatMoneyTaka(totals.totalVat)}`);
  }
  if (totals.discount > 0) {
    lines.push(`ছাড়: ${formatMoneyTaka(totals.discount)}`);
  }
  lines.push(`মোট: ${formatMoneyTaka(totals.grandTotal)}`);
  lines.push(`পরিশোধিত: ${formatMoneyTaka(totals.paidAmount)}`);
  lines.push(`বাকী: ${formatMoneyTaka(totals.dueAmount)}`);

  return lines.join('\n');
}

/**
 * Builds WhatsApp message for a saved/previewed Transaction Invoice (Purchase or Sale):
 * Shows Dosage Prefix + Product Name, Quantity, Price (Taka), Line Total (Taka),
 * followed by Due (if any), মোট, পরিশোধিত, বাকী.
 */
export function buildTransactionInvoiceWhatsAppText(
  tx: Transaction,
  catalog: MedicineCatalogItem[],
  _opts?: {
    shopName?: string;
  }
): string {
  const parsedItems = parseTransactionItemsDetailed(tx.itemsSummary || '', catalog);
  const lines: string[] = [];

  const medicineItems = orderCartItemsWithDueLast(
    parsedItems
      .filter(
        (p) => !isDueEntryItem({ brandName: p.cleanName || p.brandAndStrength, formPrefix: p.formPrefix })
      )
      .map((p) => ({
        ...p,
        brandName: p.cleanName || p.brandAndStrength,
        dosageForm: p.formPrefix
          ? dosageFormFromInvoicePrefix(p.formPrefix)
          : p.matchedMedicine?.dosageForm,
      }))
  );
  const dueItems = parsedItems.filter((p) =>
    isDueEntryItem({ brandName: p.cleanName || p.brandAndStrength, formPrefix: p.formPrefix })
  );

  medicineItems.forEach((pItem, idx) => {
    const rawName = pItem.cleanName || pItem.brandAndStrength;
    const dosageForm = pItem.formPrefix
      ? dosageFormFromInvoicePrefix(pItem.formPrefix)
      : pItem.matchedMedicine?.dosageForm;
    const productName = formatCompactProductName(
      rawName,
      undefined,
      pItem.formPrefix === 'item' ? undefined : dosageForm,
      pItem.matchedMedicine?.packSize
    );

    let qtyLabel = `${Math.max(1, pItem.qty || 1)} Pcs`;
    let unitPriceVal =
      pItem.unitPrice > 0
        ? pItem.unitPrice
        : Number((pItem.lineTotal / Math.max(1, pItem.qty || 1)).toFixed(2));

    if (pItem.packDetail) {
      const normalizedDetail = normalizeDigitsToEnglish(pItem.packDetail);
      const packMatch = normalizedDetail.match(
        /(\d+(?:\.\d+)?)\s*(বক্স|পাতা|কার্টুন|পিস|box|strip|cartoon|pcs)/i
      );
      if (packMatch) {
        const count = parseFloat(packMatch[1]) || 1;
        const rawUnit = packMatch[2].toLowerCase();
        const mappedUnit =
          rawUnit === 'বক্স' || rawUnit === 'box'
            ? 'Box'
            : rawUnit === 'পাতা' || rawUnit === 'strip'
            ? 'Strip'
            : rawUnit === 'কার্টুন' || rawUnit === 'cartoon'
            ? 'Cartoon'
            : 'Pcs';

        if (mappedUnit !== 'Pcs') {
          qtyLabel = `${formatCleanMoney(count)} ${mappedUnit}`;
          const rateMatch = normalizedDetail.match(/@৳?\s*([\d.]+)\s*\/?\s*(?:দর|rate)?/i);
          if (rateMatch && parseFloat(rateMatch[1]) > 0) {
            unitPriceVal = parseFloat(rateMatch[1]);
          } else if (count > 0 && pItem.lineTotal > 0) {
            unitPriceVal = Number((pItem.lineTotal / count).toFixed(2));
          }
        } else {
          qtyLabel = `${Math.max(1, pItem.qty || count)} Pcs`;
        }
      }
    }

    lines.push(`${idx + 1}. ${productName}`);
    lines.push(
      `   পরিমাণ: ${qtyLabel} | দাম: ${formatMoneyTaka(unitPriceVal)} | মোট দাম: ${formatMoneyTaka(pItem.lineTotal)}`
    );
  });

  if (lines.length > 0) {
    lines.push('');
  }
  if (dueItems.length > 0) {
    const extraDueTotal = dueItems.reduce((acc, d) => acc + (d.lineTotal || 0), 0);
    lines.push(`Due: ${formatMoneyTaka(extraDueTotal)}`);
  }
  if (tx.vat !== undefined && tx.vat > 0) {
    lines.push(`ভ্যাট: ${formatMoneyTaka(tx.vat)}`);
  }
  if (tx.discount > 0) {
    lines.push(`ছাড়: ${formatMoneyTaka(tx.discount)}`);
  }
  lines.push(`মোট: ${formatMoneyTaka(tx.grandTotal)}`);
  lines.push(`পরিশোধিত: ${formatMoneyTaka(tx.paidAmount)}`);
  lines.push(`বাকী: ${formatMoneyTaka(tx.dueAmount)}`);

  return lines.join('\n');
}
