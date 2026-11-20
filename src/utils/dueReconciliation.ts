import { computePurchaseItemMetrics } from '../data/bdMedicines';
import { parseTxDateMs, ReconciledInvoiceRef, Transaction } from '../types';
import { isDueEntryItem } from './whatsappShare';

export interface SupplierDueSummary {
  normalizedKey: string;
  displayName: string;
  phone: string;
  totalDue: number;
  invoiceCount: number;
  invoices: Transaction[];
}

export interface CustomerDueSummary {
  totalDueFromInvoices: number;
  ledgerDue: number;
  suggestedDue: number;
  invoices: Transaction[];
}

export function normalizeSupplierPartyName(name: string): string {
  return (name || '')
    .replace(/(\s*\(ডিপো চালান\)\s*)+$/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function stripSupplierDepotSuffix(name: string): string {
  return (name || '')
    .replace(/(\s*\(ডিপো চালান\)\s*)+$/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function getCanonicalDocIdSimple(rawId: string, shopId = ''): string {
  if (!rawId) return '';
  if (shopId && rawId.startsWith(`${shopId}__`)) {
    return rawId.slice(shopId.length + 2);
  }
  return rawId;
}

export function getUnpaidPurchaseInvoicesForSupplier(
  transactions: Transaction[],
  supplierName: string,
  excludeTxId?: string,
  shopId = ''
): Transaction[] {
  const targetKey = normalizeSupplierPartyName(supplierName);
  if (!targetKey || targetKey === 'সকল কোম্পানি' || targetKey === 'all companies') {
    return [];
  }
  const exCanon = excludeTxId ? getCanonicalDocIdSimple(excludeTxId, shopId) : '';
  return transactions
    .filter((tx) => {
      if (tx.txType !== 'purchase') return false;
      if ((tx.dueAmount || 0) <= 0.009) return false;
      if (exCanon && getCanonicalDocIdSimple(tx.id, shopId) === exCanon) return false;
      return normalizeSupplierPartyName(tx.partyName) === targetKey;
    })
    .sort((a, b) => {
      const dateCmp = parseTxDateMs(a.dateStr) - parseTxDateMs(b.dateStr);
      if (dateCmp !== 0) return dateCmp;
      return (a.updatedAtMs || 0) - (b.updatedAtMs || 0);
    });
}

export function getAllSupplierDueSummaries(
  transactions: Transaction[],
  excludeTxId?: string,
  shopId = ''
): SupplierDueSummary[] {
  const exCanon = excludeTxId ? getCanonicalDocIdSimple(excludeTxId, shopId) : '';
  const map = new Map<string, SupplierDueSummary>();

  for (const tx of transactions) {
    if (tx.txType !== 'purchase') continue;
    if ((tx.dueAmount || 0) <= 0.009) continue;
    if (exCanon && getCanonicalDocIdSimple(tx.id, shopId) === exCanon) continue;

    const norm = normalizeSupplierPartyName(tx.partyName);
    if (!norm) continue;
    const cleanName = stripSupplierDepotSuffix(tx.partyName);

    const existing = map.get(norm);
    if (existing) {
      existing.totalDue = Number((existing.totalDue + (tx.dueAmount || 0)).toFixed(2));
      existing.invoiceCount += 1;
      existing.invoices.push(tx);
      if (!existing.phone && tx.partyPhone && tx.partyPhone !== 'কোম্পানি ডিপো') {
        existing.phone = tx.partyPhone;
      }
    } else {
      map.set(norm, {
        normalizedKey: norm,
        displayName: cleanName,
        phone: tx.partyPhone && tx.partyPhone !== 'কোম্পানি ডিপো' ? tx.partyPhone : '',
        totalDue: Number((tx.dueAmount || 0).toFixed(2)),
        invoiceCount: 1,
        invoices: [tx],
      });
    }
  }

  const results = Array.from(map.values());
  for (const summary of results) {
    summary.invoices.sort((a, b) => {
      const d = parseTxDateMs(a.dateStr) - parseTxDateMs(b.dateStr);
      if (d !== 0) return d;
      return (a.updatedAtMs || 0) - (b.updatedAtMs || 0);
    });
  }
  return results.sort((a, b) => b.totalDue - a.totalDue);
}

export function matchesSaleInvoiceParty(
  tx: Transaction,
  opts: { customerId?: string; customerName?: string; customerPhone?: string },
  shopId = ''
): boolean {
  const cId = opts.customerId ? getCanonicalDocIdSimple(opts.customerId, shopId) : '';
  const txPartyId = tx.partyId ? getCanonicalDocIdSimple(tx.partyId, shopId) : '';
  if (cId && cId !== 'walk-in' && txPartyId === cId) {
    return true;
  }

  const cPhoneDigits = (opts.customerPhone || '').replace(/[^0-9]/g, '');
  const txPhoneDigits = (tx.partyPhone || '').replace(/[^0-9]/g, '');
  if (cPhoneDigits.length >= 6 && txPhoneDigits === cPhoneDigits) {
    return true;
  }

  const cNameNorm = (opts.customerName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const txNameNorm = (tx.partyName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (
    cNameNorm &&
    cNameNorm !== 'সাধারণ ক্রেতা' &&
    cNameNorm !== 'সাধারণ ক্রেতা (walk-in)' &&
    cNameNorm !== 'সরাসরি ক্যাশ কাস্টমার' &&
    cNameNorm !== 'walk-in' &&
    txNameNorm === cNameNorm
  ) {
    return true;
  }

  return false;
}

export function getUnpaidSaleInvoicesForCustomer(
  transactions: Transaction[],
  opts: { customerId?: string; customerName?: string; customerPhone?: string },
  excludeTxId?: string,
  shopId = ''
): Transaction[] {
  const exCanon = excludeTxId ? getCanonicalDocIdSimple(excludeTxId, shopId) : '';
  return transactions
    .filter((tx) => {
      if (tx.txType !== 'sale') return false;
      if ((tx.dueAmount || 0) <= 0.009) return false;
      if (exCanon && getCanonicalDocIdSimple(tx.id, shopId) === exCanon) return false;
      return matchesSaleInvoiceParty(tx, opts, shopId);
    })
    .sort((a, b) => {
      const dateCmp = parseTxDateMs(a.dateStr) - parseTxDateMs(b.dateStr);
      if (dateCmp !== 0) return dateCmp;
      return (a.updatedAtMs || 0) - (b.updatedAtMs || 0);
    });
}

export function getCustomerDueSummary(
  transactions: Transaction[],
  opts: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    ledgerTotalDue?: number;
  },
  excludeTxId?: string,
  shopId = ''
): CustomerDueSummary {
  const invoices = getUnpaidSaleInvoicesForCustomer(transactions, opts, excludeTxId, shopId);
  const totalDueFromInvoices = Number(
    invoices.reduce((sum, tx) => sum + (tx.dueAmount || 0), 0).toFixed(2)
  );
  const ledgerDue = Math.max(0, Number((opts.ledgerTotalDue || 0).toFixed(2)));
  const suggestedDue =
    totalDueFromInvoices > 0 ? Math.max(totalDueFromInvoices, ledgerDue) : ledgerDue;
  return {
    totalDueFromInvoices,
    ledgerDue,
    suggestedDue,
    invoices,
  };
}

export interface ReconcileInvoiceResult {
  reconciledTotal: number;
  reconciledRefs: ReconciledInvoiceRef[];
  nextTransactions: Transaction[];
  modifiedOldInvoices: Transaction[];
}

/**
 * Reconciles Due cart items in a new/edited Purchase or Sale invoice against earlier unpaid invoices
 * of the same supplier/customer (FIFO, prioritizing explicit reconcileInvoiceIds).
 *
 * IMPORTANT: Never mutates oldTx.paidAmount (so daily cash-flow metrics never double-count)!
 * Instead, reduces oldTx.dueAmount and links oldTx.reconciledIntoInvoiceNo -> newInvoiceNo.
 */
export function reconcilePreviousInvoicesForOrder(params: {
  transactions: Transaction[];
  dueCartItems: Array<{
    brandName?: string;
    dosageForm?: string;
    medicineId?: string;
    unitPrice?: number;
    purchasePrice?: number;
    qty?: number;
    packRate?: number;
    packUnit?: string;
    packCount?: number;
    unitsPerPack?: number;
    customLineTotal?: number;
    reconcilePreviousInvoices?: boolean;
    reconcileInvoiceIds?: string[];
  }>;
  targetType: 'purchase' | 'sale';
  newTxId: string;
  newInvoiceNo: string;
  partyMatcher: (tx: Transaction) => boolean;
  existingEditedTx?: Transaction;
  shopId?: string;
  nowMs?: number;
}): ReconcileInvoiceResult {
  const {
    transactions,
    dueCartItems,
    targetType,
    newTxId,
    newInvoiceNo,
    partyMatcher,
    existingEditedTx,
    shopId = '',
    nowMs = Date.now(),
  } = params;

  const newCanonId = getCanonicalDocIdSimple(newTxId, shopId);
  const cloned = transactions.map((t) => ({ ...t }));
  const modifiedMap = new Map<string, Transaction>();

  // 1. If editing an existing invoice that previously reconciled older invoices, restore those old dues first
  if (existingEditedTx?.reconciledFromInvoices?.length) {
    for (const ref of existingEditedTx.reconciledFromInvoices) {
      const refCanonId = getCanonicalDocIdSimple(ref.txId, shopId);
      const oldTarget = cloned.find((t) => getCanonicalDocIdSimple(t.id, shopId) === refCanonId);
      if (oldTarget && ref.amount > 0) {
        const maxRestorable = Math.max(0, (oldTarget.grandTotal || 0) - (oldTarget.paidAmount || 0));
        const restoredDue = Math.min(
          maxRestorable > 0 ? maxRestorable : oldTarget.dueAmount + ref.amount,
          Number(((oldTarget.dueAmount || 0) + ref.amount).toFixed(2))
        );
        const remainingReconciledAmt = Math.max(
          0,
          Number(((oldTarget.reconciledDueAmount || 0) - ref.amount).toFixed(2))
        );
        oldTarget.dueAmount = restoredDue;
        oldTarget.reconciledDueAmount = remainingReconciledAmt > 0 ? remainingReconciledAmt : undefined;
        if (remainingReconciledAmt <= 0 || oldTarget.reconciledIntoTxId === newCanonId) {
          oldTarget.reconciledIntoInvoiceNo = undefined;
          oldTarget.reconciledIntoTxId = undefined;
        }
        oldTarget.updatedAtMs = nowMs;
        modifiedMap.set(getCanonicalDocIdSimple(oldTarget.id, shopId), oldTarget);
      }
    }
  }

  // 2. Compute total due budget to reconcile from active Due items in the cart
  let remainingBudget = 0;
  const preferredIds: string[] = [];

  for (const item of dueCartItems) {
    if (!isDueEntryItem(item)) continue;
    if (item.reconcilePreviousInvoices === false) continue;
    const itemAmount =
      targetType === 'purchase'
        ? computePurchaseItemMetrics(item as any).lineTotal
        : Number(((Number(item.unitPrice) || 0) * Math.max(1, Number(item.qty) || 1)).toFixed(2));
    if (itemAmount > 0) {
      remainingBudget = Number((remainingBudget + itemAmount).toFixed(2));
    }
    if (Array.isArray(item.reconcileInvoiceIds)) {
      for (const rid of item.reconcileInvoiceIds) {
        const cRid = getCanonicalDocIdSimple(rid, shopId);
        if (cRid && !preferredIds.includes(cRid)) {
          preferredIds.push(cRid);
        }
      }
    }
  }

  const reconciledRefs: ReconciledInvoiceRef[] = [];
  let reconciledTotal = 0;

  if (remainingBudget > 0) {
    const preferredIdSet = new Set(preferredIds);
    // Gather eligible unpaid invoices (explicitly selected IDs OR matching party)
    const eligible = cloned.filter((tx) => {
      if (tx.txType !== targetType) return false;
      if ((tx.dueAmount || 0) <= 0.009) return false;
      const txCanon = getCanonicalDocIdSimple(tx.id, shopId);
      if (txCanon === newCanonId) return false;
      return preferredIdSet.has(txCanon) || partyMatcher(tx);
    });

    // Prioritize explicitly selected invoice IDs first, then remaining oldest-first (FIFO)
    const prefRank = new Map<string, number>();
    preferredIds.forEach((id, idx) => prefRank.set(id, idx));

    eligible.sort((a, b) => {
      const aCanon = getCanonicalDocIdSimple(a.id, shopId);
      const bCanon = getCanonicalDocIdSimple(b.id, shopId);
      const aPref = prefRank.has(aCanon) ? prefRank.get(aCanon)! : Number.MAX_SAFE_INTEGER;
      const bPref = prefRank.has(bCanon) ? prefRank.get(bCanon)! : Number.MAX_SAFE_INTEGER;
      if (aPref !== bPref) return aPref - bPref;
      const d = parseTxDateMs(a.dateStr) - parseTxDateMs(b.dateStr);
      if (d !== 0) return d;
      return (a.updatedAtMs || 0) - (b.updatedAtMs || 0);
    });

    for (const oldTx of eligible) {
      if (remainingBudget <= 0.009) break;
      const availDue = Number((oldTx.dueAmount || 0).toFixed(2));
      if (availDue <= 0) continue;

      const deduct = Number(Math.min(remainingBudget, availDue).toFixed(2));
      if (deduct <= 0) continue;

      const nextDueRaw = Number((availDue - deduct).toFixed(2));
      oldTx.dueAmount = nextDueRaw < 0.01 ? 0 : nextDueRaw;
      oldTx.reconciledDueAmount = Number(((oldTx.reconciledDueAmount || 0) + deduct).toFixed(2));
      oldTx.reconciledIntoInvoiceNo = newInvoiceNo;
      oldTx.reconciledIntoTxId = newCanonId;
      oldTx.updatedAtMs = nowMs;

      const oldCanonId = getCanonicalDocIdSimple(oldTx.id, shopId);
      modifiedMap.set(oldCanonId, oldTx);
      reconciledRefs.push({
        txId: oldCanonId,
        invoiceNo: oldTx.invoiceNo,
        amount: deduct,
      });

      reconciledTotal = Number((reconciledTotal + deduct).toFixed(2));
      remainingBudget = Number((remainingBudget - deduct).toFixed(2));
    }
  }

  return {
    reconciledTotal,
    reconciledRefs,
    nextTransactions: cloned,
    modifiedOldInvoices: Array.from(modifiedMap.values()),
  };
}

/**
 * Restores dueAmount on previously reconciled source invoices when a consolidated invoice is deleted.
 */
export function restoreReconciledInvoicesOnDelete(params: {
  transactions: Transaction[];
  deletedTx: Transaction;
  shopId?: string;
  nowMs?: number;
}): {
  nextTransactions: Transaction[];
  modifiedSourceInvoices: Transaction[];
} {
  const { transactions, deletedTx, shopId = '', nowMs = Date.now() } = params;
  const deletedCanonId = getCanonicalDocIdSimple(deletedTx.id, shopId);
  const refs = deletedTx.reconciledFromInvoices || [];
  if (refs.length === 0) {
    return {
      nextTransactions: transactions.filter(
        (t) => getCanonicalDocIdSimple(t.id, shopId) !== deletedCanonId
      ),
      modifiedSourceInvoices: [],
    };
  }

  const modifiedSourceInvoices: Transaction[] = [];
  const nextTransactions = transactions
    .filter((t) => getCanonicalDocIdSimple(t.id, shopId) !== deletedCanonId)
    .map((t) => {
      const tCanon = getCanonicalDocIdSimple(t.id, shopId);
      const ref = refs.find((r) => getCanonicalDocIdSimple(r.txId, shopId) === tCanon);
      if (!ref || ref.amount <= 0) return t;

      const maxRestorable = Math.max(0, (t.grandTotal || 0) - (t.paidAmount || 0));
      const restoredDue = Math.min(
        maxRestorable > 0 ? maxRestorable : t.dueAmount + ref.amount,
        Number(((t.dueAmount || 0) + ref.amount).toFixed(2))
      );
      const remainingRec = Math.max(
        0,
        Number(((t.reconciledDueAmount || 0) - ref.amount).toFixed(2))
      );
      const updatedOld: Transaction = {
        ...t,
        dueAmount: restoredDue,
        reconciledDueAmount: remainingRec > 0 ? remainingRec : undefined,
        reconciledIntoInvoiceNo:
          remainingRec > 0 && t.reconciledIntoTxId !== deletedCanonId
            ? t.reconciledIntoInvoiceNo
            : undefined,
        reconciledIntoTxId:
          remainingRec > 0 && t.reconciledIntoTxId !== deletedCanonId
            ? t.reconciledIntoTxId
            : undefined,
        updatedAtMs: nowMs,
      };
      modifiedSourceInvoices.push(updatedOld);
      return updatedOld;
    });

  return { nextTransactions, modifiedSourceInvoices };
}
