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

export interface GlobalCloudUser {
  id: string;
  shopId?: string;
  staffId?: string;
  ownerId?: string;
  phone: string;
  email: string;
  name: string;
  ownerName?: string;
  password?: string;
  shopName?: string;
  role?: string;
  roleTitle?: string;
  updatedAtMs: number;
}

const IDB_NAME = 'iqbal_pharmacy_idb_v1';
const IDB_STORE = 'snapshots';
const IDB_KEY = 'latest_pharmacy_state';

// Universal Cross-Device Cloud Sync Endpoints (Works on any device, IP, and domain like iqbal-pharmacy.pages.dev)
const GLOBAL_CLOUD_OBJ_ID = 'ff808181a09d98f701a1b66f2a8d5cf6';
const GLOBAL_CLOUD_URL = `https://api.restful-api.dev/objects/${GLOBAL_CLOUD_OBJ_ID}`;

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.run.app')) {
    return '';
  }
  return 'https://ais-pre-gftser6y7eip7eqqokrgd4-145385287677.asia-southeast1.run.app';
}

export function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 1500);
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve(req.result);
        }
      };
      req.onerror = () => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve(null);
        }
      };
      req.onblocked = () => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve(null);
        }
      };
    } catch {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }
  });
}

export async function saveIndexedDbSnapshot(state: PharmacyPersistentState): Promise<void> {
  try {
    const db = await openIdb();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), 1500);
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(state, IDB_KEY);
        tx.oncomplete = () => {
          clearTimeout(timer);
          resolve();
        };
        tx.onerror = () => {
          clearTimeout(timer);
          resolve();
        };
        tx.onabort = () => {
          clearTimeout(timer);
          resolve();
        };
      } catch {
        clearTimeout(timer);
        resolve();
      }
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
      const timer = setTimeout(() => resolve(null), 1500);
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const getReq = store.get(IDB_KEY);
        getReq.onsuccess = () => {
          clearTimeout(timer);
          const res = getReq.result as PharmacyPersistentState | undefined;
          resolve(res && typeof res === 'object' ? res : null);
        };
        getReq.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
      } catch {
        clearTimeout(timer);
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Fetch all registered users from the multi-device global cloud database
 */
export async function fetchGlobalCloudUsers(): Promise<GlobalCloudUser[]> {
  // 1. Prioritize persistent backend server
  try {
    const srvRes = await fetchWithTimeout(`${getApiBaseUrl()}/api/auth/users`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }, 2500);
    if (srvRes.ok) {
      const srvJson = await srvRes.json();
      if (srvJson?.ok && Array.isArray(srvJson.users) && srvJson.users.length > 0) {
        return srvJson.users as GlobalCloudUser[];
      }
    }
  } catch {}

  // 2. Fallback to external global cloud mirror
  try {
    const res = await fetchWithTimeout(GLOBAL_CLOUD_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }, 2500);
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data;
    if (data && Array.isArray(data.users)) {
      return data.users as GlobalCloudUser[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Register or update a user in the multi-device global cloud database
 */
export async function registerGlobalCloudUser(newUser: GlobalCloudUser): Promise<boolean> {
  // 1. Always persist to our primary backend server first
  try {
    const srvUrl = `${getApiBaseUrl()}/api/auth/register`;
    await fetchWithTimeout(srvUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId: newUser.shopId,
        phone: newUser.phone,
        email: newUser.email,
        password: newUser.password,
        name: newUser.name || newUser.ownerName,
        shopName: newUser.shopName,
        role: newUser.role || 'owner',
      }),
    }, 2500).catch(() => {});
  } catch {}

  // 2. Also persist to global cloud mirror as backup
  try {
    const currentUsers = await fetchGlobalCloudUsers();
    const cleanDigits = newUser.phone.replace(/[^0-9]/g, '');
    const cleanEmail = (newUser.email || '').toLowerCase().trim();

    const existingIdx = currentUsers.findIndex((u) => {
      const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').toLowerCase().trim();
      return (
        (cleanDigits.length >= 6 && (uDigits === cleanDigits || uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits))) ||
        (cleanEmail && uEmail && uEmail === cleanEmail) ||
        (newUser.id && u.id === newUser.id)
      );
    });

    if (existingIdx >= 0) {
      currentUsers[existingIdx] = { ...currentUsers[existingIdx], ...newUser };
    } else {
      currentUsers.push(newUser);
    }

    let existingData: Record<string, any> = {};
    try {
      const gRes = await fetchWithTimeout(GLOBAL_CLOUD_URL, { cache: 'no-store' }, 2500);
      if (gRes.ok) {
        const gJson = await gRes.json();
        existingData = gJson?.data || {};
      }
    } catch {}

    const payload = {
      name: 'iqbal_pharmacy_global_db_v1',
      data: {
        ...existingData,
        users: currentUsers,
        updatedAtMs: Date.now(),
      },
    };

    const putRes = await fetchWithTimeout(GLOBAL_CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 2500);

    return putRes.ok;
  } catch (err) {
    console.warn('registerGlobalCloudUser error:', err);
    return false;
  }
}

/**
 * Direct backend authentication across devices & IPs
 */
export async function loginViaServerApi(ident: string, password: string): Promise<GlobalCloudUser | null> {
  try {
    const url = `${getApiBaseUrl()}/api/auth/login`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ident, password }),
    }, 2500);
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      if (res.status === 401) {
        throw new Error(errData?.error || 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
      }
      return null;
    }
    const json = await res.json();
    return (json?.user as GlobalCloudUser) || null;
  } catch (err) {
    if (err instanceof Error && err.message.includes('ভুল পাসওয়ার্ড')) {
      throw err;
    }
    return null;
  }
}

/**
 * Fetches the unified persistent state across devices.
 * Checks both the universal global cloud DB and the local server.
 */
export async function fetchServerPharmacyState(): Promise<{
  hasData: boolean;
  updatedAtMs: number;
  state: PharmacyPersistentState | null;
}> {
  let globalCloudState: PharmacyPersistentState | null = null;
  let globalUpdatedAtMs = 0;

  // 1. Fetch from universal multi-device cloud database
  try {
    const cloudRes = await fetchWithTimeout(GLOBAL_CLOUD_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }, 2500);
    if (cloudRes.ok) {
      const cloudJson = await cloudRes.json();
      const cData = cloudJson?.data;
      if (cData && cData.state && Array.isArray(cData.state.inventory)) {
        globalCloudState = cData.state as PharmacyPersistentState;
        globalUpdatedAtMs = cData.updatedAtMs || globalCloudState.updatedAtMs || Date.now();
      }
    }
  } catch (e) {
    console.warn('Global cloud fetch notice:', e);
  }

  // 2. Fetch from Express server route (with base URL fallback if on external domain)
  let serverState: PharmacyPersistentState | null = null;
  let serverUpdatedAtMs = 0;
  try {
    const serverUrl = `${getApiBaseUrl()}/api/pharmacy-state`;
    const res = await fetchWithTimeout(serverUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }, 2500);
    if (res.ok) {
      const data = await res.json();
      if (data && data.hasData && data.state) {
        serverState = data.state as PharmacyPersistentState;
        serverUpdatedAtMs = data.updatedAtMs || 0;
      }
    }
  } catch {
    // ignore
  }

  // Pick the freshest valid snapshot between global cloud and server
  if (globalCloudState && (!serverState || globalUpdatedAtMs >= serverUpdatedAtMs)) {
    return {
      hasData: true,
      updatedAtMs: globalUpdatedAtMs,
      state: globalCloudState,
    };
  }

  if (serverState) {
    return {
      hasData: true,
      updatedAtMs: serverUpdatedAtMs,
      state: serverState,
    };
  }

  return { hasData: false, updatedAtMs: 0, state: null };
}

/**
 * Push persistent state across devices.
 * Writes to BOTH the universal multi-device cloud DB and the server DB.
 */
export async function pushServerPharmacyState(
  state: PharmacyPersistentState,
  mode: 'merge' | 'overwrite' = 'merge',
  unmarkedIds: string[] = []
): Promise<PharmacyPersistentState | null> {
  const payloadState = { ...state, cloudSession: null };

  // 1. Write to universal multi-device cloud database in background with strict timeout
  (async () => {
    try {
      let existingUsers: any[] = [];
      try {
        const curRes = await fetchWithTimeout(GLOBAL_CLOUD_URL, { cache: 'no-store' }, 2000);
        if (curRes.ok) {
          const curJson = await curRes.json();
          existingUsers = curJson?.data?.users || [];
        }
      } catch {}

      const cloudPayload = {
        name: 'iqbal_pharmacy_global_db_v1',
        data: {
          state: payloadState,
          users: existingUsers,
          updatedAtMs: Date.now(),
        },
      };

      await fetchWithTimeout(GLOBAL_CLOUD_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudPayload),
      }, 2500).catch(() => {});
    } catch (err) {
      console.warn('Global cloud push notice:', err);
    }
  })();

  // 2. Write to Express server endpoint with strict timeout
  try {
    const serverUrl = `${getApiBaseUrl()}/api/pharmacy-state`;
    const res = await fetchWithTimeout(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: payloadState,
        mode,
        unmarkedIds,
      }),
    }, 2500);
    if (res.ok) {
      const data = await res.json();
      return data?.state ? (data.state as PharmacyPersistentState) : payloadState;
    }
  } catch {
    // ignore
  }

  return payloadState;
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
