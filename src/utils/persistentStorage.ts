import { ShopCloudSession } from '../firebase';
import {
  CartItem,
  Customer,
  CustomMedicine,
  InventoryItem,
  PriceAlert,
  PriceWatch,
  PurchaseCartItem,
  ShopProfile,
  StaffMember,
  Transaction,
} from '../types';

export interface PharmacyPersistentState {
  shopProfile: ShopProfile;
  inventory: InventoryItem[];
  customers: Customer[];
  transactions: Transaction[];
  staffList: StaffMember[];
  customMedicines: CustomMedicine[];
  priceWatches: PriceWatch[];
  priceAlerts: PriceAlert[];
  deletedIds: string[];
  posCart: CartItem[];
  purchaseCart: PurchaseCartItem[];
  cloudSession?: ShopCloudSession | null;
  updatedAtMs: number;
}

const IDB_NAME = 'iqbal_pharmacy_idb_v1';
const IDB_STORE = 'snapshots';
const IDB_KEY = 'latest_pharmacy_state';

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveIndexedDbSnapshot(state: PharmacyPersistentState): Promise<void> {
  try {
    const db = await openIdb();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(state, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore IDB errors
  }
}

export async function loadIndexedDbSnapshot(): Promise<PharmacyPersistentState | null> {
  try {
    const db = await openIdb();
    if (!db) return null;
    return await new Promise<PharmacyPersistentState | null>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(IDB_KEY);
      getReq.onsuccess = () => {
        const res = getReq.result as PharmacyPersistentState | undefined;
        resolve(res && typeof res === 'object' ? res : null);
      };
      getReq.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function fetchServerPharmacyState(): Promise<{
  hasData: boolean;
  updatedAtMs: number;
  state: PharmacyPersistentState | null;
}> {
  try {
    const res = await fetch('/api/pharmacy-state', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { hasData: false, updatedAtMs: 0, state: null };
    }
    const data = await res.json();
    if (data && data.hasData && data.state) {
      return {
        hasData: true,
        updatedAtMs: data.updatedAtMs || Date.now(),
        state: data.state as PharmacyPersistentState,
      };
    }
    return { hasData: false, updatedAtMs: 0, state: null };
  } catch {
    return { hasData: false, updatedAtMs: 0, state: null };
  }
}

export async function pushServerPharmacyState(
  state: PharmacyPersistentState,
  mode: 'merge' | 'overwrite' = 'merge',
  unmarkedIds: string[] = []
): Promise<PharmacyPersistentState | null> {
  try {
    const res = await fetch('/api/pharmacy-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state,
        mode,
        unmarkedIds,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.state ? (data.state as PharmacyPersistentState) : null;
  } catch {
    return null;
  }
}

export function downloadPharmacyBackupJson(state: PharmacyPersistentState): void {
  const payload = {
    app: 'ইকবাল ফার্মেসী (Iqbal Pharmacy)',
    exportedAt: new Date().toISOString(),
    version: 3,
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `iqbal-pharmacy-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parsePharmacyBackupJson(rawText: string): PharmacyPersistentState | null {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;
    if (
      Array.isArray(candidate.inventory) &&
      Array.isArray(candidate.transactions) &&
      Array.isArray(candidate.customers)
    ) {
      return {
        shopProfile: candidate.shopProfile,
        inventory: candidate.inventory,
        customers: candidate.customers,
        transactions: candidate.transactions,
        staffList: Array.isArray(candidate.staffList) ? candidate.staffList : [],
        customMedicines: Array.isArray(candidate.customMedicines) ? candidate.customMedicines : [],
        priceWatches: Array.isArray(candidate.priceWatches) ? candidate.priceWatches : [],
        priceAlerts: Array.isArray(candidate.priceAlerts) ? candidate.priceAlerts : [],
        deletedIds: Array.isArray(candidate.deletedIds) ? candidate.deletedIds : [],
        posCart: Array.isArray(candidate.posCart) ? candidate.posCart : [],
        purchaseCart: Array.isArray(candidate.purchaseCart) ? candidate.purchaseCart : [],
        cloudSession: candidate.cloudSession || null,
        updatedAtMs: Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}
