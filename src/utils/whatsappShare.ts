import {
  computePurchaseCartTotals,
  computePurchaseItemMetrics,
  formatCleanMoney,
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

function normalizeStrengthToken(rawStrength: string): string {
  const cleaned = normalizeDigitsToEnglish(rawStrength || '').trim();
  if (!cleaned || /^standard$/i.test(cleaned)) return '';

  // Remove "mg" directly following a number so "20 mg" -> "20" and "500mg+65mg" -> "500+65"
  let token = cleaned
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

/**
 * Formats medicine name concisely for WhatsApp sharing, e.g. ("Seclo", "20 mg") -> "Seclo-20",
 * ("Napa", "500 mg") -> "Napa-500", ("Seclo 20 mg") -> "Seclo-20".
 */
export function formatCompactProductName(
  brandOrCombined: string,
  strength?: string
): string {
  const rawBrand = (brandOrCombined || 'Custom Product').trim();
  const explicitStrength = strength !== undefined ? normalizeStrengthToken(strength) : '';

  if (explicitStrength) {
    const bLow = rawBrand.toLowerCase();
    const sLow = (strength || '').trim().toLowerCase();
    const compactLow = explicitStrength.toLowerCase();
    if (
      bLow.endsWith(`-${compactLow}`) ||
      bLow.endsWith(` ${compactLow}`) ||
      (sLow && (bLow.endsWith(sLow) || bLow.includes(sLow)))
    ) {
      // Normalize trailing "Brand 20 mg" -> "Brand-20"
      return formatCompactProductName(rawBrand);
    }
    return `${rawBrand}-${explicitStrength}`;
  }

  // Single combined string like "Seclo 20 mg", "Napa 500 mg", "Cef-3 200 mg", "Seclo-20"
  const normRaw = normalizeDigitsToEnglish(rawBrand).trim();
  const match = normRaw.match(
    /^(.+?)[\s-]+(\d+(?:\.\d+)?(?:\s*(?:mg|mcg|gm|g|ml|iu|%)?(?:\s*[+/]\s*\d+(?:\.\d+)?\s*(?:mg|mcg|gm|g|ml|iu|%)?)*))$/i
  );
  if (match) {
    const base = match[1].trim();
    const strToken = normalizeStrengthToken(match[2]);
    if (base && strToken) {
      return `${base}-${strToken}`;
    }
  }
  return rawBrand;
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
 * Shows ONLY numbered Product Name (e.g. Seclo-20) and Quantity (e.g. 1 Box / 1 Pcs).
 */
export function buildPurchaseCartWhatsAppText(
  purchaseCart: PurchaseCartItem[],
  _opts?: {
    shopName?: string;
    supplierCompany?: string;
    dateStr?: string;
  }
): string {
  const validItems = purchaseCart.filter((i) => i.brandName && i.brandName.trim().length > 0);
  if (validItems.length === 0) {
    return '(কার্টে কোনো প্রোডাক্ট নেই)';
  }

  return validItems
    .map((item, idx) => {
      const productName = formatCompactProductName(item.brandName, item.strength);
      const qtyLabel = formatPurchaseQtyLabel(item);
      return `${idx + 1}. ${productName} — ${qtyLabel}`;
    })
    .join('\n');
}

/**
 * Builds WhatsApp message for an active Purchase Invoice from Step 3 cart:
 * Shows Product Name (Seclo-20), Quantity (1 Box / 1 Pcs), Price (520 Taka), Line Total (520 Taka).
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
  const validItems = purchaseCart.filter((i) => i.brandName && i.brandName.trim().length > 0);
  const totals = computePurchaseCartTotals(validItems, {
    discount: opts.discount || 0,
    vatOverrideStr: opts.vatOverrideStr,
    paidAmountStr: opts.paidAmountStr,
  });

  const lines: string[] = [];
  lines.push('*ক্রয় ইনভয়েস (Purchase Invoice)*');
  if (opts.shopName?.trim()) {
    lines.push(`প্রতিষ্ঠান: ${opts.shopName.trim()}`);
  }
  if (opts.invoiceNo?.trim()) {
    lines.push(`ইনভয়েস নং: ${opts.invoiceNo.trim()}`);
  }
  if (opts.dateStr?.trim()) {
    lines.push(`তারিখ: ${opts.dateStr.trim()}`);
  }
  if (opts.supplierCompany?.trim() && opts.supplierCompany.trim() !== 'সকল কোম্পানি') {
    lines.push(`কোম্পানি: ${opts.supplierCompany.trim()}`);
  }

  lines.push('');

  validItems.forEach((item, idx) => {
    const m = computePurchaseItemMetrics(item);
    const productName = formatCompactProductName(item.brandName, item.strength);
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

  lines.push('');
  lines.push(`মোট: ${formatMoneyTaka(totals.subTotalTp)}`);
  if (totals.totalVat > 0) {
    lines.push(`ভ্যাট: ${formatMoneyTaka(totals.totalVat)}`);
  }
  if (totals.discount > 0) {
    lines.push(`ছাড়: ${formatMoneyTaka(totals.discount)}`);
  }
  lines.push(`সর্বমোট: ${formatMoneyTaka(totals.grandTotal)}`);
  lines.push(`পরিশোধিত: ${formatMoneyTaka(totals.paidAmount)}`);
  if (totals.dueAmount > 0) {
    lines.push(`বাকি: ${formatMoneyTaka(totals.dueAmount)}`);
  }

  return lines.join('\n');
}

/**
 * Builds WhatsApp message for a saved/previewed Transaction Invoice (Purchase or Sale):
 * Shows Product Name (Seclo-20), Quantity (1 Box / 1 Pcs), Price (520 Taka), Line Total (520 Taka).
 */
export function buildTransactionInvoiceWhatsAppText(
  tx: Transaction,
  catalog: MedicineCatalogItem[],
  opts?: {
    shopName?: string;
  }
): string {
  const parsedItems = parseTransactionItemsDetailed(tx.itemsSummary || '', catalog);
  const lines: string[] = [];

  const title =
    tx.txType === 'purchase'
      ? '*ক্রয় ইনভয়েস (Purchase Invoice)*'
      : tx.txType === 'sale'
      ? '*বিক্রয় ইনভয়েস (Sales Invoice)*'
      : '*ইনভয়েস / রশিদ*';

  lines.push(title);
  if (opts?.shopName?.trim()) {
    lines.push(`প্রতিষ্ঠান: ${opts.shopName.trim()}`);
  }
  if (tx.invoiceNo?.trim()) {
    lines.push(`ইনভয়েস নং: ${tx.invoiceNo.trim()}`);
  }
  if (tx.dateStr?.trim()) {
    lines.push(`তারিখ: ${tx.dateStr.trim()}`);
  }
  if (tx.partyName?.trim()) {
    lines.push(
      `${tx.txType === 'purchase' ? 'কোম্পানি' : 'ক্রেতা'}: ${tx.partyName.trim()}`
    );
  }

  lines.push('');

  parsedItems.forEach((pItem, idx) => {
    const rawName = pItem.cleanName || pItem.brandAndStrength;
    const productName = formatCompactProductName(rawName);

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

  lines.push('');
  lines.push(`মোট: ${formatMoneyTaka(tx.subTotal ?? tx.grandTotal)}`);
  if (tx.vat !== undefined && tx.vat > 0) {
    lines.push(`ভ্যাট: ${formatMoneyTaka(tx.vat)}`);
  }
  if (tx.discount > 0) {
    lines.push(`ছাড়: ${formatMoneyTaka(tx.discount)}`);
  }
  lines.push(`সর্বমোট: ${formatMoneyTaka(tx.grandTotal)}`);
  lines.push(`পরিশোধিত: ${formatMoneyTaka(tx.paidAmount)}`);
  if (tx.dueAmount > 0) {
    lines.push(`বাকি: ${formatMoneyTaka(tx.dueAmount)}`);
  }

  return lines.join('\n');
}
