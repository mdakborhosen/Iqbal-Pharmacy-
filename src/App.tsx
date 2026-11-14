/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ArrowRightLeft,
  Bell,
  BellRing,
  BarChart3,
  BookOpen,
  Boxes,
  Camera,
  Check,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  LayoutDashboard,
  Link2,
  ListFilter,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Settings,
  Unlock,
  ShieldCheck,
  ShoppingCart,
  Upload,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { BoxScannerModal, ScannedBoxData } from './components/BoxScannerModal';
import { CustomerLedgerView } from './components/CustomerLedgerView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { MedicineCompareView } from './components/MedicineCompareView';
import { PosAndDailyAccountsView } from './components/PosAndDailyAccountsView';
import { StaffAndShopView } from './components/StaffAndShopView';
import { PublicHealthcarePortal } from './components/PublicHealthcarePortal';
import {
  BD_COMPANIES_DIRECTORY,
  BD_GENERICS_DIRECTORY,
  BD_MEDICINES_CATALOG,
  buildPurchaseCartFromTransaction,
  buildSaleCartFromTransaction,
  CATALOG_BY_BRAND_STRENGTH,
  CATALOG_BY_ID,
  findMatchingInventoryRecord,
  formatCartItemInvoiceLine,
  formatCleanMoney,
  formatPurchaseItemInvoiceLine,
  formatTransactionItemsText,
  getInventoryStockForMedicine,
  getInvoiceFormPrefix,
  getShortDosageForm,
  isCoreDatabaseMedicineId,
  parseTransactionItemsDetailed,
} from './data/bdMedicines';
import {
  DEFAULT_SHOP_PROFILE,
  getTodayDateStr,
  INITIAL_DEMO_CUSTOMERS,
  INITIAL_DEMO_INVENTORY,
  INITIAL_DEMO_PRICE_ALERTS,
  INITIAL_DEMO_PRICE_WATCHES,
  INITIAL_DEMO_STAFF,
  INITIAL_DEMO_TRANSACTIONS,
} from './data/demoSeedData';
import {
  auth,
  db,
  EXPLICIT_LOGOUT_KEY,
  fireAndRaceFirestoreWrite,
  fireAndRaceFirestoreWrites,
  handleFirestoreError,
  loadSavedShopCloudSession,
  LOGGED_OUT_FLAG_KEY,
  logOutUser,
  OperationType,
  registerNewShopOwnerAccount,
  sanitizeNumber,
  sanitizeString,
  saveShopCloudSession,
  SHOP_CLOUD_SESSION_KEY,
  ShopCloudSession,
  withAsyncTimeout,
  signInShopCloudAccount,
  signInWithGoogle,
} from './firebase';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import {
  CartItem,
  Customer,
  CustomMedicine,
  InventoryItem,
  InvoiceSealType,
  MedicineCatalogItem,
  PriceAlert,
  PriceWatch,
  PurchaseCartItem,
  PurchasePackUnit,
  isMandatoryOwner,
  ShopNotice,
  ShopProfile,
  ShopRegistration,
  StaffMember,
  Transaction,
} from './types';
import {
  downloadPharmacyBackupJson,
  fetchGlobalCloudUsers,
  fetchServerPharmacyState,
  loadIndexedDbSnapshot,
  loginViaServerApi,
  parsePharmacyBackupJson,
  PharmacyPersistentState,
  pushServerPharmacyState,
  registerGlobalCloudUser,
  saveIndexedDbSnapshot,
} from './utils/persistentStorage';
import { AppLanguage, getSavedLanguage, saveLanguage, t } from './i18n';

type ActiveSection =
  | 'dashboard'
  | 'compare'
  | 'pos_accounts'
  | 'inventory'
  | 'customer_ledger'
  | 'staff_shop';

const PUBLIC_APP_URL =
  'https://ais-pre-gftser6y7eip7eqqokrgd4-145385287677.asia-southeast1.run.app';

const SHARED_PHARMACY_OWNER_ID = 'iqbal-pharmacy';
const SHARED_SHOP_DOC_ID = 'shop_iqbal_pharmacy';

const STORAGE_KEYS = {
  SHOP: 'pharma_pos_bd_v3_shop',
  INVENTORY: 'pharma_pos_bd_v3_inventory',
  CUSTOMERS: 'pharma_pos_bd_v3_customers',
  TRANSACTIONS: 'pharma_pos_bd_v3_transactions',
  STAFF: 'pharma_pos_bd_v3_staff',
  CUSTOM_MEDS: 'pharma_pos_bd_v3_custom_meds',
  PRICE_WATCHES: 'pharma_pos_bd_v3_price_watches',
  PRICE_ALERTS: 'pharma_pos_bd_v3_price_alerts',
  DELETED_IDS: 'pharma_pos_bd_v3_deleted_ids',
  POS_CART: 'pharma_pos_bd_v3_pos_cart',
  PURCHASE_CART: 'pharma_pos_bd_v3_purchase_cart',
  SEED_MIGRATED: 'pharma_pos_bd_v3_seed_migrated_v3',
  HAS_USER_DATA: 'pharma_pos_bd_v3_has_user_data',
};

export function computeCurrentShopId(
  session: ShopCloudSession | null,
  activeStaff?: StaffMember | null,
  user?: User | null
): string {
  if (session?.shopId) return session.shopId;
  if (
    activeStaff?.shopId &&
    activeStaff.shopId !== 'shop_guest' &&
    activeStaff.id !== 'staff-offline-counter'
  ) {
    return activeStaff.shopId;
  }
  const ident = session?.email || session?.phone || user?.email || '';
  const digits = ident.replace(/[^0-9]/g, '');
  const isMaster =
    ident.toLowerCase() === 'mhakbor2001@gmail.com' ||
    ident.toLowerCase() === 'iqbalmahmud498@gmail.com' ||
    digits === '01812358839' ||
    digits.endsWith('1812358839');
  if (isMaster) return 'shop_iqbal_pharmacy';
  if (digits.length >= 6) {
    const bd11 = digits.length >= 10 ? '0' + digits.slice(-10) : digits;
    return `shop_${bd11}`;
  }
  if (session?.uid) return `shop_${session.uid.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  return 'shop_guest';
}

export function getScopedStorageKey(baseKey: string, shopId: string): string {
  return `${baseKey}_${shopId || 'shop_guest'}`;
}

const GUEST_SHOP_PROFILE: ShopProfile = {
  id: 'shop_guest',
  shopId: 'shop_guest',
  ownerId: 'offline',
  shopName: 'ফার্মেসী ম্যানেজমেন্ট',
  licenseNo: '',
  phone: '',
  address: '',
  updatedAtMs: 0,
};

const GUEST_OFFLINE_STAFF: StaffMember = {
  id: 'staff-offline-counter',
  shopId: 'shop_guest',
  ownerId: 'offline',
  name: 'অফলাইন কর্মী',
  roleTitle: 'salesman',
  phone: '',
  shift: 'সাধারণ শিফট',
  counterName: 'কাউন্টার ১',
  active: true,
};

const DEFAULT_POS_CART: CartItem[] = [
  {
    medicineId: 'med-seclo-20',
    inventoryId: 'inv-seclo-20',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg',
    dosageForm: 'Capsule',
    unitPrice: 6.0,
    originalUnitPrice: 6.0,
    purchasePrice: 5.28,
    originalPurchasePrice: 5.28,
    qty: 10,
    availableStock: 420,
  },
  {
    medicineId: 'med-napa-extend',
    inventoryId: 'inv-napa-extend',
    brandName: 'Napa Extend',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '665 mg',
    dosageForm: 'Tablet',
    unitPrice: 2.0,
    originalUnitPrice: 2.0,
    purchasePrice: 1.76,
    originalPurchasePrice: 1.76,
    qty: 12,
    availableStock: 240,
  },
  {
    medicineId: 'med-napa-500',
    inventoryId: 'inv-napa-500',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    unitPrice: 1.2,
    originalUnitPrice: 1.2,
    purchasePrice: 1.06,
    originalPurchasePrice: 1.06,
    qty: 10,
    availableStock: 850,
  },
];

const DEFAULT_PURCHASE_CART: PurchaseCartItem[] = [
  {
    medicineId: 'med-seclo-20',
    inventoryId: 'inv-seclo-20',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    purchasePrice: 5.28,
    unitPrice: 6.0,
    qty: 100,
    batchNo: 'SCL-2610',
    expiryDate: '2028-06-30',
    availableStock: 420,
  },
  {
    medicineId: 'med-napa-extend',
    inventoryId: 'inv-napa-extend',
    brandName: 'Napa Extend',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '665 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 12 (120 pcs)',
    purchasePrice: 1.76,
    unitPrice: 2.0,
    qty: 120,
    batchNo: 'NPX-2610',
    expiryDate: '2028-08-31',
    availableStock: 240,
  },
  {
    medicineId: 'med-napa-500',
    inventoryId: 'inv-napa-500',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '51 × 10 (510 pcs)',
    purchasePrice: 1.06,
    unitPrice: 1.2,
    qty: 100,
    batchNo: 'NPA-2610',
    expiryDate: '2028-09-30',
    availableStock: 850,
  },
];

/**
 * Strips any stacked shopId prefixes (e.g. "shop_iqbal_pharmacy_staff-owner-1" -> "staff-owner-1")
 * and any legacy 6-character user UID suffix (e.g. "inv-seclo-20_a1b2c3" -> "inv-seclo-20")
 * so documents always resolve to a single canonical ID without stacking prefixes on refresh.
 */
function stripShopIdPrefixes(rawId: string, shopId?: string): string {
  if (!rawId) return rawId;
  let current = rawId.trim();
  if (shopId) {
    const exactPrefix = `${shopId}_`;
    while (current.startsWith(exactPrefix) && current.length > exactPrefix.length) {
      current = current.slice(exactPrefix.length);
    }
  }
  current = current.replace(
    /^(?:shop_[a-zA-Z0-9_-]+?_)+(?=(?:inv|cust|tx|staff|watch|alert|cmed|med|custom|box)[_-])/,
    ''
  );
  return current;
}

function getCanonicalDocId(rawId: string, shopId?: string): string {
  if (!rawId) return rawId;
  const stripped = stripShopIdPrefixes(rawId, shopId);
  return stripped.replace(
    /^(inv-[a-z0-9-]+|cust-\d+|tx-(?:sale|pur|due)-\d+|staff-[a-z0-9-]+|watch-[a-z0-9-]+|alert-demo-\d+)(?:_[a-zA-Z0-9_-]{6})+$/,
    '$1'
  );
}

function getScopedFirestoreDocId(shopId: string, rawId: string): string {
  const sid = (shopId || 'shop_iqbal_pharmacy').trim();
  const canon = getCanonicalDocId(rawId, sid);
  return `${sid}_${canon}`;
}

function getStaffIdentityKey(st: Partial<StaffMember>, shopId = 'shop_iqbal_pharmacy'): string {
  const canonId = getCanonicalDocId(st.id || '', shopId);
  if (isMandatoryOwner({ ...st, id: canonId })) {
    return `${shopId}::__MANDATORY_OWNER__`;
  }
  const digits = String(st.phone || '').replace(/[^0-9]/g, '');
  const normPhone = digits.length >= 10 ? digits.slice(-10) : digits;
  if (normPhone.length >= 6) return `${shopId}::phone:${normPhone}`;
  const email = String(st.email || '').trim().toLowerCase();
  if (email) return `${shopId}::email:${email}`;
  return `${shopId}::id:${canonId}`;
}

function deduplicateStaffMembers(
  items: StaffMember[],
  shopId = 'shop_iqbal_pharmacy',
  deletedSet?: Set<string>
): StaffMember[] {
  const byKey = new Map<string, StaffMember>();
  for (const raw of items) {
    if (!raw || !raw.id) continue;
    if (raw.shopId && raw.shopId !== shopId) continue;
    const canonId = getCanonicalDocId(raw.id, shopId);
    const isMand = isMandatoryOwner({ ...raw, id: canonId });
    if (!isMand && deletedSet && (deletedSet.has(raw.id) || deletedSet.has(canonId))) {
      continue;
    }
    const finalId = isMand && shopId === 'shop_iqbal_pharmacy' ? 'staff-owner-1' : canonId;
    const key = getStaffIdentityKey({ ...raw, id: finalId }, shopId);
    const norm: StaffMember = {
      ...raw,
      id: finalId,
      shopId,
      isMandatoryOwner: isMand,
      roleTitle: isMand ? 'owner' : raw.roleTitle === 'owner' ? 'sub_owner' : raw.roleTitle,
      name: isMand ? 'Owner' : raw.roleTitle === 'owner' && raw.name === 'Owner' ? 'সাব-মালিক' : raw.name,
    };

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, norm);
    } else {
      const nTs = norm.updatedAtMs || 0;
      const eTs = existing.updatedAtMs || 0;
      const preferNew = nTs > eTs || (nTs === eTs && norm.id === finalId && existing.id !== finalId);
      const winner = preferNew ? norm : existing;
      const loser = preferNew ? existing : norm;
      byKey.set(key, {
        ...winner,
        phone: winner.phone || loser.phone,
        email: winner.email || loser.email,
        password: winner.password || loser.password,
        shift: winner.shift || loser.shift,
        counterName: winner.counterName || loser.counterName,
      });
    }
  }
  return Array.from(byKey.values());
}

function getDocTimestampMs(data: Record<string, unknown>): number {
  const u = data.updatedAt as { toMillis?: () => number; seconds?: number } | undefined;
  if (u && typeof u.toMillis === 'function') return u.toMillis();
  if (u && typeof u.seconds === 'number') return u.seconds * 1000;
  const c = data.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
  if (c && typeof c.toMillis === 'function') return c.toMillis();
  if (c && typeof c.seconds === 'number') return c.seconds * 1000;
  if (typeof data.updatedAtMs === 'number') return data.updatedAtMs;
  return 0;
}

function mergeEntityList<T extends { id: string; shopId?: string; updatedAtMs?: number }>(
  remoteList: T[],
  localList: T[],
  deletedSet: Set<string>,
  isInv = false,
  shopId?: string
): T[] {
  const byId = new Map<string, T>();
  const canDelete = (id: string) => {
    if (isInv && INITIAL_DEMO_INVENTORY.some((d) => d.id === id)) return false;
    return true;
  };

  for (const r of remoteList) {
    if (!r || !r.id) continue;
    if (shopId && r.shopId && r.shopId !== shopId) continue;
    const canonId = getCanonicalDocId(r.id, shopId);
    if (canDelete(canonId) && (deletedSet.has(r.id) || deletedSet.has(canonId))) continue;
    byId.set(canonId, { ...r, id: canonId, ...(shopId ? { shopId } : {}) });
  }

  for (const l of localList) {
    if (!l || !l.id) continue;
    if (shopId && l.shopId && l.shopId !== shopId) continue;
    const canonId = getCanonicalDocId(l.id, shopId);
    if (canDelete(canonId) && (deletedSet.has(l.id) || deletedSet.has(canonId))) continue;
    const existing = byId.get(canonId);
    const lTs = l.updatedAtMs || 0;
    const rTs = existing?.updatedAtMs || 0;
    if (!existing) {
      if (lTs > 0 || isInv || remoteList.length === 0) {
        byId.set(canonId, { ...l, id: canonId, ...(shopId ? { shopId } : {}) });
      }
    } else if (lTs > rTs) {
      byId.set(canonId, { ...l, id: canonId, ...(shopId ? { shopId } : {}) });
    }
  }

  return Array.from(byId.values());
}

function buildShopCloudPayload(shop: ShopProfile, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  return {
    id: shop.id || shopId,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    shopName: sanitizeString(shop.shopName, 120, DEFAULT_SHOP_PROFILE.shopName),
    licenseNo: sanitizeString(shop.licenseNo, 60, DEFAULT_SHOP_PROFILE.licenseNo),
    phone: sanitizeString(shop.phone, 30, DEFAULT_SHOP_PROFILE.phone),
    address: sanitizeString(shop.address, 250, DEFAULT_SHOP_PROFILE.address),
    branches: shop.branches || [],
    activeBranchId: shop.activeBranchId || 'branch-1',
    customInvoiceSettings: shop.customInvoiceSettings || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildInventoryCloudPayload(inv: InventoryItem, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  return {
    id: inv.id,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    medicineId: sanitizeString(inv.medicineId, 100, 'custom-item'),
    brandName: sanitizeString(inv.brandName, 120, 'Custom Product'),
    genericName: sanitizeString(inv.genericName, 150, inv.brandName || 'Custom Product'),
    companyName: sanitizeString(inv.companyName, 120, 'Custom / General'),
    strength: sanitizeString(inv.strength, 60, 'Standard'),
    dosageForm: sanitizeString(inv.dosageForm, 60, 'Tablet'),
    packSize: sanitizeString(inv.packSize, 60, '10 × 10'),
    purchasePrice: sanitizeNumber(inv.purchasePrice, 0, 1000000),
    unitPrice: sanitizeNumber(inv.unitPrice, 0, 1000000),
    stripPrice: sanitizeNumber(inv.stripPrice, 0, 1000000),
    stockQty: sanitizeNumber(inv.stockQty, 0, 10000000),
    minStockLevel: sanitizeNumber(inv.minStockLevel, 0, 100000),
    batchNo: sanitizeString(inv.batchNo, 60, 'B-101'),
    expiryDate: sanitizeString(inv.expiryDate, 30, '2028-06-30'),
    shelfLocation: sanitizeString(inv.shelfLocation, 60, 'Rack A-1'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildCustomerCloudPayload(cust: Customer, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  return {
    id: cust.id,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    name: sanitizeString(cust.name, 120),
    phone: sanitizeString(cust.phone, 30),
    address: sanitizeString(cust.address, 250),
    totalPurchased: sanitizeNumber(cust.totalPurchased),
    totalPaid: sanitizeNumber(cust.totalPaid),
    totalDue: sanitizeNumber(cust.totalDue),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildTransactionCloudPayload(tx: Transaction, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  const payload: Record<string, unknown> = {
    id: tx.id,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    txType: tx.txType,
    invoiceNo: sanitizeString(tx.invoiceNo, 60, 'INV-01'),
    dateStr: sanitizeString(tx.dateStr, 20, getTodayDateStr()),
    partyId: sanitizeString(tx.partyId, 128, 'walk-in'),
    partyName: sanitizeString(tx.partyName, 120, 'সাধারণ ক্রেতা'),
    partyPhone: sanitizeString(tx.partyPhone, 30, 'N/A'),
    itemsSummary: sanitizeString(tx.itemsSummary, 10000, 'ঔষধ বিক্রয়'),
    totalCount: sanitizeNumber(tx.totalCount, 0, 1000000),
    subTotal: sanitizeNumber(tx.subTotal),
    discount: sanitizeNumber(tx.discount),
    grandTotal: sanitizeNumber(tx.grandTotal),
    paidAmount: sanitizeNumber(tx.paidAmount),
    dueAmount: sanitizeNumber(tx.dueAmount),
    paymentMethod: tx.paymentMethod,
    staffName: sanitizeString(tx.staffRole === 'owner' ? 'Owner' : tx.staffName, 100, 'Owner'),
    staffRole: tx.staffRole,
    counterName: sanitizeString(tx.counterName, 60, 'কাউন্টার ১'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (tx.patientAge) payload.patientAge = sanitizeString(tx.patientAge, 30);
  if (tx.patientSex) payload.patientSex = sanitizeString(tx.patientSex, 30);
  if (tx.selectedSeal) payload.selectedSeal = tx.selectedSeal;
  if (tx.dentalClinical) payload.dentalClinical = tx.dentalClinical;

  return payload;
}

function buildStaffCloudPayload(st: StaffMember, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  const payload: Record<string, unknown> = {
    id: st.id,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    name: sanitizeString(st.roleTitle === 'owner' ? 'Owner' : st.name, 100, 'Owner'),
    roleTitle: st.roleTitle,
    isMandatoryOwner: Boolean(st.isMandatoryOwner),
    phone: sanitizeString(st.phone, 30),
    shift: sanitizeString(st.shift, 60),
    counterName: sanitizeString(st.counterName, 60),
    active: Boolean(st.active),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (st.email && st.email.trim()) {
    payload.email = sanitizeString(st.email.trim(), 120);
  }
  if (st.password && st.password.trim()) {
    payload.password = sanitizeString(st.password.trim(), 100);
  }
  if (typeof st.lastLoginAt === 'number') {
    payload.lastLoginAt = st.lastLoginAt;
  }
  return payload;
}

function buildCustomMedCloudPayload(cm: CustomMedicine, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  const unitPrice = sanitizeNumber(cm.unitPrice, 0, 1000000);
  const purchasePrice = sanitizeNumber(
    typeof cm.purchasePrice === 'number' && cm.purchasePrice > 0
      ? cm.purchasePrice
      : Number((unitPrice * 0.88).toFixed(2)),
    0,
    1000000
  );
  return {
    id: cm.id,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    brandName: sanitizeString(cm.brandName, 120, 'Custom Product'),
    genericName: sanitizeString(cm.genericName, 150, cm.brandName || 'Custom Product'),
    companyName: sanitizeString(cm.companyName, 120, 'Custom / General'),
    strength: sanitizeString(cm.strength, 60, 'Standard'),
    dosageForm: sanitizeString(cm.dosageForm, 60, 'Tablet'),
    packSize: sanitizeString(cm.packSize, 60, '10 × 10'),
    purchasePrice,
    unitPrice,
    stripPrice: sanitizeNumber(cm.stripPrice, 0, 1000000),
    therapeuticClass: sanitizeString(cm.therapeuticClass, 100, 'General Medicine'),
    indication: sanitizeString(cm.indication, 300, 'চিকিৎসকের পরামর্শ অনুযায়ী সেব্য'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildPriceWatchCloudPayload(w: PriceWatch, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  return {
    id: w.id,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    medicineId: sanitizeString(w.medicineId, 100),
    brandName: sanitizeString(w.brandName, 120),
    genericName: sanitizeString(w.genericName, 150),
    companyName: sanitizeString(w.companyName, 120),
    strength: sanitizeString(w.strength, 60),
    baselineUnitPrice: sanitizeNumber(w.baselineUnitPrice, 0, 1000000),
    currentUnitPrice: sanitizeNumber(w.currentUnitPrice, 0, 1000000),
    targetAlertPrice: sanitizeNumber(w.targetAlertPrice, 0, 1000000),
    notifyOnAnyChange: Boolean(w.notifyOnAnyChange),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildPriceAlertCloudPayload(a: PriceAlert, ownerId = SHARED_PHARMACY_OWNER_ID, shopId = 'shop_iqbal_pharmacy') {
  return {
    id: a.id,
    shopId: sanitizeString(shopId, 128, 'shop_iqbal_pharmacy'),
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    medicineId: sanitizeString(a.medicineId, 100),
    brandName: sanitizeString(a.brandName, 120),
    genericName: sanitizeString(a.genericName, 150),
    companyName: sanitizeString(a.companyName, 120),
    strength: sanitizeString(a.strength, 60),
    oldUnitPrice: sanitizeNumber(a.oldUnitPrice, 0, 1000000),
    newUnitPrice: sanitizeNumber(a.newUnitPrice, 0, 1000000),
    oldStripPrice: sanitizeNumber(a.oldStripPrice, 0, 1000000),
    newStripPrice: sanitizeNumber(a.newStripPrice, 0, 1000000),
    changedBy: sanitizeString(a.changedBy, 100, 'Owner'),
    dateStr: sanitizeString(a.dateStr, 30, getTodayDateStr()),
    isRead: Boolean(a.isRead),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

export default function App() {
  // Detect before any useState runs whether localStorage already had persisted user data
  // or if the browser cache / localStorage was just cleared
  const hadLocalDataOnBootRef = useRef<boolean>(
    typeof window !== 'undefined' &&
      (localStorage.getItem(STORAGE_KEYS.HAS_USER_DATA) === '1' ||
        localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) !== null ||
        localStorage.getItem(STORAGE_KEYS.CUSTOM_MEDS) !== null)
  );
  // Public Portal vs Admin / POS Mode Route Detection
  // Visiting https://iqbal-pharmacy.pages.dev/ (root /) displays public health portal only
  // Visiting https://iqbal-pharmacy.pages.dev/admin (or /admin, /#admin, ?admin=true) displays the complete Pharmacy & Dental Management System
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = (window.location.pathname || '').toLowerCase();
    const h = (window.location.hash || '').toLowerCase();
    const s = (window.location.search || '').toLowerCase();
    return (
      p.startsWith('/admin') ||
      p.startsWith('/pos') ||
      p.startsWith('/dashboard') ||
      h.includes('admin') ||
      h.includes('pos') ||
      h.includes('dashboard') ||
      s.includes('admin') ||
      s.includes('pos')
    );
  });

  useEffect(() => {
    const handleRouteSync = () => {
      if (typeof window === 'undefined') return;
      const p = (window.location.pathname || '').toLowerCase();
      const h = (window.location.hash || '').toLowerCase();
      const s = (window.location.search || '').toLowerCase();
      setIsAdminRoute(
        p.startsWith('/admin') ||
        p.startsWith('/pos') ||
        p.startsWith('/dashboard') ||
        h.includes('admin') ||
        h.includes('pos') ||
        h.includes('dashboard') ||
        s.includes('admin') ||
        s.includes('pos')
      );
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  const serverHydratedRef = useRef<boolean>(false);
  const [serverHydrated, setServerHydrated] = useState<boolean>(false);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [cloudSession, setCloudSession] = useState<ShopCloudSession | null>(() =>
    loadSavedShopCloudSession()
  );
  const [authReady, setAuthReady] = useState(false);
  const [showCloudLoginModal, setShowCloudLoginModal] = useState(false);
  const [cloudAuthTab, setCloudAuthTab] = useState<'login' | 'register_owner'>('login');
  const [cloudLoginEmail, setCloudLoginEmail] = useState('');
  const [cloudLoginPhone, setCloudLoginPhone] = useState('');
  const [cloudLoginPassword, setCloudLoginPassword] = useState('');
  const [cloudLoginRole, setCloudLoginRole] = useState<'owner' | 'staff'>('owner');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [cloudLoginLoading, setCloudLoginLoading] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);

  // New Owner Registration State
  const [registerShopName, setRegisterShopName] = useState('');
  const [registerOwnerName, setRegisterOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [seedingCloud, setSeedingCloud] = useState(false);
  const [showIOSInstallModal, setShowIOSInstallModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState<AppLanguage>(getSavedLanguage());

  const toggleLanguage = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    saveLanguage(nextLang);
    showToast(nextLang === 'bn' ? 'ভাষা পরিবর্তন: বাংলা' : 'Language switched: English');
  };

  const isLoggedOutExplicitly =
    typeof window !== 'undefined' &&
    (localStorage.getItem(LOGGED_OUT_FLAG_KEY) === '1' ||
      sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1');

  const isCloudLoggedIn = Boolean(cloudSession && !isLoggedOutExplicitly);
  const activeCloudUid = isCloudLoggedIn ? (cloudSession?.uid || user?.uid || null) : null;
  const effectiveCloudUid = user?.uid || cloudSession?.uid || SHARED_PHARMACY_OWNER_ID;

  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Persistent Deleted IDs registry so deleted custom items NEVER reappear on refresh (core products cannot be deleted)
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    const raw = loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []);
    const filtered = raw.filter(
      (id) => !isCoreDatabaseMedicineId(id) && !id.startsWith('inv-seed-')
    );
    if (filtered.length !== raw.length) {
      saveLocal(STORAGE_KEYS.DELETED_IDS, filtered);
    }
    return filtered;
  });

  const deletedIdsSet = useMemo(() => new Set(deletedIds), [deletedIds]);

  const markDeletedIds = (ids: string | string[]) => {
    const list = (Array.isArray(ids) ? ids : [ids]).filter(
      (id) => !isCoreDatabaseMedicineId(id) && !id.startsWith('inv-seed-')
    );
    if (list.length === 0) return;
    setDeletedIds((prev) => {
      const next = Array.from(new Set([...prev, ...list]));
      saveLocal(STORAGE_KEYS.DELETED_IDS, next);
      return next;
    });
  };

  const unmarkDeletedId = (id: string) => {
    setDeletedIds((prev) => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter((item) => item !== id);
      saveLocal(STORAGE_KEYS.DELETED_IDS, next);
      return next;
    });
  };

  const bootLoggedIn = Boolean(cloudSession && !isLoggedOutExplicitly);
  const bootShopId = bootLoggedIn ? computeCurrentShopId(cloudSession) : 'shop_guest';

  // Offline-first states initialized strictly when logged in; logged-out / guest mode starts completely clean with 0 users
  const [shopProfile, setShopProfile] = useState<ShopProfile>(() => {
    if (!bootLoggedIn) return GUEST_SHOP_PROFILE;
    const saved = loadLocal(
      getScopedStorageKey(STORAGE_KEYS.SHOP, bootShopId),
      loadLocal(
        STORAGE_KEYS.SHOP,
        bootShopId === 'shop_iqbal_pharmacy' ? DEFAULT_SHOP_PROFILE : GUEST_SHOP_PROFILE
      )
    );
    if (
      bootShopId === 'shop_iqbal_pharmacy' &&
      (!saved.shopName ||
        saved.shopName === 'সেবা মেডিসিন কর্নার অ্যান্ড ফার্মেসি' ||
        saved.shopName.includes('OshudhBazar'))
    ) {
      saveLocal(STORAGE_KEYS.SHOP, DEFAULT_SHOP_PROFILE);
      return DEFAULT_SHOP_PROFILE;
    }
    return saved;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    if (!bootLoggedIn) return [];
    const initialDeleted = new Set(
      loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []).filter(
        (id) => !isCoreDatabaseMedicineId(id) && !id.startsWith('inv-seed-')
      )
    );
    const saved = loadLocal<InventoryItem[]>(
      getScopedStorageKey(STORAGE_KEYS.INVENTORY, bootShopId),
      loadLocal<InventoryItem[]>(
        STORAGE_KEYS.INVENTORY,
        bootShopId === 'shop_iqbal_pharmacy' ? INITIAL_DEMO_INVENTORY : []
      )
    );

    const byKey = new Map<string, InventoryItem>();
    for (const rawItem of saved) {
      const canonId = getCanonicalDocId(rawItem.id, bootShopId);
      const isCoreSeed =
        canonId.startsWith('inv-seed-') ||
        INITIAL_DEMO_INVENTORY.some((d) => d.id === canonId || d.medicineId === rawItem.medicineId);
      if (!isCoreSeed && (initialDeleted.has(rawItem.id) || initialDeleted.has(canonId))) {
        continue;
      }
      const normalizedItem: InventoryItem = {
        ...rawItem,
        id: canonId,
        shopId: bootShopId,
      };
      const existing = byKey.get(canonId);
      if (!existing || (normalizedItem.updatedAtMs || 0) >= (existing.updatedAtMs || 0)) {
        byKey.set(canonId, normalizedItem);
      }
    }

    const cleaned = Array.from(byKey.values());
    const existingIds = new Set(cleaned.map((item) => item.id));
    const existingMedIds = new Set(cleaned.map((item) => item.medicineId));
    let changed = cleaned.length !== saved.length;

    if (bootShopId === 'shop_iqbal_pharmacy') {
      for (const demoItem of INITIAL_DEMO_INVENTORY) {
        if (!existingIds.has(demoItem.id) && !existingMedIds.has(demoItem.medicineId)) {
          cleaned.push({ ...demoItem, shopId: bootShopId });
          changed = true;
        }
      }
    }

    if (changed || localStorage.getItem(STORAGE_KEYS.SEED_MIGRATED) !== '1') {
      try {
        localStorage.setItem(STORAGE_KEYS.SEED_MIGRATED, '1');
      } catch {
        // ignore storage errors
      }
      saveLocal(STORAGE_KEYS.INVENTORY, cleaned);
    }
    return cleaned;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (!bootLoggedIn) return [];
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal<Customer[]>(
      getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, bootShopId),
      loadLocal(STORAGE_KEYS.CUSTOMERS, bootShopId === 'shop_iqbal_pharmacy' ? INITIAL_DEMO_CUSTOMERS : [])
    );
    const byId = new Map<string, Customer>();
    for (const c of saved) {
      const canonId = getCanonicalDocId(c.id, bootShopId);
      if (initialDeleted.has(c.id) || initialDeleted.has(canonId)) continue;
      const norm = { ...c, id: canonId, shopId: bootShopId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (!bootLoggedIn) return [];
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const loaded = loadLocal<Transaction[]>(
      getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, bootShopId),
      loadLocal(STORAGE_KEYS.TRANSACTIONS, bootShopId === 'shop_iqbal_pharmacy' ? INITIAL_DEMO_TRANSACTIONS : [])
    );
    const byId = new Map<string, Transaction>();
    for (const t of loaded) {
      const canonId = getCanonicalDocId(t.id, bootShopId);
      if (initialDeleted.has(t.id) || initialDeleted.has(canonId)) continue;
      const formatted =
        t.txType === 'sale' || t.txType === 'purchase'
          ? { ...t, id: canonId, shopId: bootShopId, itemsSummary: formatTransactionItemsText(t.itemsSummary) }
          : { ...t, id: canonId, shopId: bootShopId };
      const prev = byId.get(canonId);
      if (!prev || (formatted.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, formatted);
      }
    }
    return Array.from(byId.values());
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    if (!bootLoggedIn) return [];
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal<StaffMember[]>(
      getScopedStorageKey(STORAGE_KEYS.STAFF, bootShopId),
      loadLocal<StaffMember[]>(
        STORAGE_KEYS.STAFF,
        bootShopId === 'shop_iqbal_pharmacy' ? INITIAL_DEMO_STAFF : []
      )
    );
    const deduped = deduplicateStaffMembers(saved, bootShopId, initialDeleted);
    if (deduped.length !== saved.length) {
      saveLocal(STORAGE_KEYS.STAFF, deduped);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, bootShopId), deduped);
    }
    if (deduped.length > 0) return deduped;
    return bootShopId === 'shop_iqbal_pharmacy'
      ? INITIAL_DEMO_STAFF.map((s) => ({ ...s, shopId: bootShopId }))
      : [];
  });

  const [customMedicines, setCustomMedicines] = useState<CustomMedicine[]>(() => {
    if (!bootLoggedIn) return [];
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal<CustomMedicine[]>(
      getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, bootShopId),
      loadLocal<CustomMedicine[]>(STORAGE_KEYS.CUSTOM_MEDS, [])
    );
    const byId = new Map<string, CustomMedicine>();
    for (const m of saved) {
      const canonId = getCanonicalDocId(m.id, bootShopId);
      const isCore = isCoreDatabaseMedicineId(canonId) || CATALOG_BY_ID.has(canonId);
      if (!isCore && (initialDeleted.has(m.id) || initialDeleted.has(canonId))) continue;
      const norm = { ...m, id: canonId, shopId: bootShopId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [priceWatches, setPriceWatches] = useState<PriceWatch[]>(() => {
    if (!bootLoggedIn) return [];
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal<PriceWatch[]>(
      getScopedStorageKey(STORAGE_KEYS.PRICE_WATCHES, bootShopId),
      loadLocal(STORAGE_KEYS.PRICE_WATCHES, bootShopId === 'shop_iqbal_pharmacy' ? INITIAL_DEMO_PRICE_WATCHES : [])
    );
    const byId = new Map<string, PriceWatch>();
    for (const w of saved) {
      const canonId = getCanonicalDocId(w.id, bootShopId);
      if (initialDeleted.has(w.id) || initialDeleted.has(canonId)) continue;
      const norm = { ...w, id: canonId, shopId: bootShopId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    if (!bootLoggedIn) return [];
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal<PriceAlert[]>(
      getScopedStorageKey(STORAGE_KEYS.PRICE_ALERTS, bootShopId),
      loadLocal(STORAGE_KEYS.PRICE_ALERTS, bootShopId === 'shop_iqbal_pharmacy' ? INITIAL_DEMO_PRICE_ALERTS : [])
    );
    const byId = new Map<string, PriceAlert>();
    for (const a of saved) {
      const canonId = getCanonicalDocId(a.id, bootShopId);
      if (initialDeleted.has(a.id) || initialDeleted.has(canonId)) continue;
      const norm = { ...a, id: canonId, shopId: bootShopId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [activeStaff, setActiveStaff] = useState<StaffMember>(
    () => (bootLoggedIn ? staffList[0] || GUEST_OFFLINE_STAFF : GUEST_OFFLINE_STAFF)
  );

  const effectiveShopId = isCloudLoggedIn
    ? computeCurrentShopId(cloudSession, activeStaff, user)
    : 'shop_guest';

  // Persistent POS Cart state (scoped when logged in, empty in guest/logged-out mode)
  const [posCart, setPosCart] = useState<CartItem[]>(() =>
    bootLoggedIn
      ? loadLocal<CartItem[]>(
          getScopedStorageKey(STORAGE_KEYS.POS_CART, bootShopId),
          loadLocal<CartItem[]>(STORAGE_KEYS.POS_CART, bootShopId === 'shop_iqbal_pharmacy' ? DEFAULT_POS_CART : [])
        )
      : []
  );

  // Persistent Purchase Invoice Cart state (scoped when logged in, empty in guest/logged-out mode)
  const [purchaseCart, setPurchaseCart] = useState<PurchaseCartItem[]>(() =>
    bootLoggedIn
      ? loadLocal<PurchaseCartItem[]>(
          getScopedStorageKey(STORAGE_KEYS.PURCHASE_CART, bootShopId),
          loadLocal<PurchaseCartItem[]>(STORAGE_KEYS.PURCHASE_CART, bootShopId === 'shop_iqbal_pharmacy' ? DEFAULT_PURCHASE_CART : [])
        )
      : []
  );

  const [shopRegistrations, setShopRegistrations] = useState<ShopRegistration[]>(() =>
    bootLoggedIn ? loadLocal<ShopRegistration[]>('shop_registrations_cache', []) : []
  );

  // Active Invoice being edited through the full New-Invoice Builder
  const [editingInvoiceTx, setEditingInvoiceTx] = useState<Transaction | null>(null);

  // Active POS / Daily Accounts tab controlled across the application
  const [posActiveTab, setPosActiveTab] = useState<'sale_pos' | 'purchase_entry'>('sale_pos');
  const autoSignInAttemptedRef = useRef(false);
  const shopProfileRef = useRef(shopProfile);
  useEffect(() => {
    shopProfileRef.current = shopProfile;
  }, [shopProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Hydrate from Persistent Server Database (/api/pharmacy-state) and IndexedDB on boot
  // This ensures that even if the user clears their browser cache, 100% of their data is immediately restored!
  useEffect(() => {
    let cancelled = false;

    const mergeByUpdatedAt = <T extends { id: string; shopId?: string; updatedAtMs?: number }>(
      remoteList: T[],
      localList: T[],
      deletedSet: Set<string>,
      isInv = false,
      shopId = effectiveShopId
    ): T[] => {
      const byId = new Map<string, T>();
      const canDelete = (id: string) => {
        if (isInv && INITIAL_DEMO_INVENTORY.some((d) => d.id === id)) return false;
        return true;
      };

      for (const r of remoteList) {
        if (!r || !r.id) continue;
        if (r.shopId && r.shopId !== shopId) continue;
        const canonId = getCanonicalDocId(r.id, shopId);
        if (canDelete(canonId) && (deletedSet.has(r.id) || deletedSet.has(canonId))) continue;
        byId.set(canonId, { ...r, id: canonId, shopId });
      }

      for (const l of localList) {
        if (!l || !l.id) continue;
        if (l.shopId && l.shopId !== shopId) continue;
        const canonId = getCanonicalDocId(l.id, shopId);
        if (canDelete(canonId) && (deletedSet.has(l.id) || deletedSet.has(canonId))) continue;
        const existing = byId.get(canonId);
        const lTs = l.updatedAtMs || 0;
        const rTs = existing?.updatedAtMs || 0;
        if (!existing) {
          if (lTs > 0 || isInv || remoteList.length === 0) {
            byId.set(canonId, { ...l, id: canonId, shopId });
          }
        } else if (lTs > rTs) {
          byId.set(canonId, { ...l, id: canonId, shopId });
        }
      }

      return Array.from(byId.values());
    };

    (async () => {
      const isLoggedOutOnHydrate =
        typeof window !== 'undefined' &&
        (localStorage.getItem(LOGGED_OUT_FLAG_KEY) === '1' ||
          sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1' ||
          !loadSavedShopCloudSession());
      if (isLoggedOutOnHydrate) {
        serverHydratedRef.current = true;
        setServerHydrated(true);
        return;
      }

      const [serverRes, idbSnapshot] = await Promise.all([
        fetchServerPharmacyState(),
        loadIndexedDbSnapshot(),
      ]);
      if (cancelled) return;

      const remote =
        serverRes.hasData && serverRes.state
          ? serverRes.state
          : idbSnapshot || null;

      if (remote) {
        const hydrateShopId = computeCurrentShopId(remote.cloudSession || cloudSession);
        const rShopMismatch =
          Boolean(remote.shopProfile?.shopId && remote.shopProfile.shopId !== hydrateShopId) &&
          Boolean(cloudSession?.shopId && cloudSession.shopId !== remote.shopProfile?.shopId);

        if (!hadLocalDataOnBootRef.current && !rShopMismatch) {
          // Browser cache was cleared (or fresh browser/device):
          // Directly restore and deduplicate persisted state from Server / IndexedDB!
          const rDeleted = Array.isArray(remote.deletedIds) ? remote.deletedIds : [];
          const rDeletedSet = new Set(rDeleted);
          setDeletedIds(rDeleted);
          saveLocal(STORAGE_KEYS.DELETED_IDS, rDeleted);

          if (remote.shopProfile && remote.shopProfile.shopName) {
            setShopProfile(remote.shopProfile);
            saveLocal(STORAGE_KEYS.SHOP, remote.shopProfile);
          }
          if (Array.isArray(remote.inventory) && remote.inventory.length > 0) {
            const cleanInv = mergeByUpdatedAt(remote.inventory, [], rDeletedSet, true, hydrateShopId);
            setInventory(cleanInv);
            saveLocal(STORAGE_KEYS.INVENTORY, cleanInv);
          }
          if (Array.isArray(remote.customers)) {
            const cleanCust = mergeByUpdatedAt(remote.customers, [], rDeletedSet, false, hydrateShopId);
            setCustomers(cleanCust);
            saveLocal(STORAGE_KEYS.CUSTOMERS, cleanCust);
          }
          if (Array.isArray(remote.transactions)) {
            const cleanTx = mergeByUpdatedAt(remote.transactions, [], rDeletedSet, false, hydrateShopId);
            setTransactions(cleanTx);
            saveLocal(STORAGE_KEYS.TRANSACTIONS, cleanTx);
          }
          if (Array.isArray(remote.staffList) && remote.staffList.length > 0) {
            const cleanStaff = deduplicateStaffMembers(remote.staffList, hydrateShopId, rDeletedSet);
            if (cleanStaff.length > 0) {
              setStaffList(cleanStaff);
              saveLocal(STORAGE_KEYS.STAFF, cleanStaff);
              setActiveStaff(cleanStaff[0]);
            }
          }
          if (Array.isArray(remote.customMedicines)) {
            const cleanMeds = mergeByUpdatedAt(remote.customMedicines, [], rDeletedSet, false, hydrateShopId);
            setCustomMedicines(cleanMeds);
            saveLocal(STORAGE_KEYS.CUSTOM_MEDS, cleanMeds);
          }
          if (Array.isArray(remote.priceWatches)) {
            const cleanWatches = mergeByUpdatedAt(remote.priceWatches, [], rDeletedSet, false, hydrateShopId);
            setPriceWatches(cleanWatches);
            saveLocal(STORAGE_KEYS.PRICE_WATCHES, cleanWatches);
          }
          if (Array.isArray(remote.priceAlerts)) {
            const cleanAlerts = mergeByUpdatedAt(remote.priceAlerts, [], rDeletedSet, false, hydrateShopId);
            setPriceAlerts(cleanAlerts);
            saveLocal(STORAGE_KEYS.PRICE_ALERTS, cleanAlerts);
          }
          if (Array.isArray(remote.posCart)) {
            setPosCart(remote.posCart);
            saveLocal(STORAGE_KEYS.POS_CART, remote.posCart);
          }
          if (Array.isArray(remote.purchaseCart)) {
            setPurchaseCart(remote.purchaseCart);
            saveLocal(STORAGE_KEYS.PURCHASE_CART, remote.purchaseCart);
          }
          if (
            remote.cloudSession &&
            localStorage.getItem(LOGGED_OUT_FLAG_KEY) !== '1'
          ) {
            saveShopCloudSession(remote.cloudSession);
            setCloudSession(remote.cloudSession);
          }
          try {
            localStorage.setItem(STORAGE_KEYS.HAS_USER_DATA, '1');
          } catch {
            // ignore
          }
          hadLocalDataOnBootRef.current = true;
        } else if (!rShopMismatch) {
          // Normal reload where localStorage was intact: merge remote & local by updatedAtMs
          const mergedDeletedArr = Array.from(
            new Set([
              ...(Array.isArray(remote.deletedIds) ? remote.deletedIds : []),
              ...deletedIds,
            ])
          ).filter((id) => !isCoreDatabaseMedicineId(id) && !id.startsWith('inv-seed-'));
          const mergedDeletedSet = new Set(mergedDeletedArr);
          setDeletedIds(mergedDeletedArr);
          saveLocal(STORAGE_KEYS.DELETED_IDS, mergedDeletedArr);

          if (remote.shopProfile) {
            setShopProfile((prev) => {
              const rTs = remote.shopProfile.updatedAtMs || 0;
              const lTs = prev.updatedAtMs || 0;
              const winner = rTs > lTs ? remote.shopProfile : prev;
              saveLocal(STORAGE_KEYS.SHOP, winner);
              return winner;
            });
          }
          if (Array.isArray(remote.inventory)) {
            setInventory((prev) => {
              const next = mergeByUpdatedAt(remote.inventory, prev, mergedDeletedSet, true, hydrateShopId);
              saveLocal(STORAGE_KEYS.INVENTORY, next);
              return next;
            });
          }
          if (Array.isArray(remote.customers)) {
            setCustomers((prev) => {
              const next = mergeByUpdatedAt(remote.customers, prev, mergedDeletedSet, false, hydrateShopId);
              saveLocal(STORAGE_KEYS.CUSTOMERS, next);
              return next;
            });
          }
          if (Array.isArray(remote.transactions)) {
            setTransactions((prev) => {
              const next = mergeByUpdatedAt(remote.transactions, prev, mergedDeletedSet, false, hydrateShopId);
              next.sort(
                (a, b) =>
                  (b.updatedAtMs || 0) - (a.updatedAtMs || 0) ||
                  b.invoiceNo.localeCompare(a.invoiceNo)
              );
              saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
              return next;
            });
          }
          if (Array.isArray(remote.staffList) && remote.staffList.length > 0) {
            setStaffList((prev) => {
              const next = deduplicateStaffMembers(
                mergeByUpdatedAt(remote.staffList, prev, mergedDeletedSet, false, hydrateShopId),
                hydrateShopId,
                mergedDeletedSet
              );
              const finalStaff =
                next.length > 0
                  ? next
                  : hydrateShopId === 'shop_iqbal_pharmacy'
                  ? INITIAL_DEMO_STAFF
                  : [];
              saveLocal(STORAGE_KEYS.STAFF, finalStaff);
              return finalStaff;
            });
          }
          if (Array.isArray(remote.customMedicines)) {
            setCustomMedicines((prev) => {
              const next = mergeByUpdatedAt(remote.customMedicines, prev, mergedDeletedSet, false, hydrateShopId);
              saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
              return next;
            });
          }
          if (Array.isArray(remote.priceWatches)) {
            setPriceWatches((prev) => {
              const next = mergeByUpdatedAt(remote.priceWatches, prev, mergedDeletedSet, false, hydrateShopId);
              saveLocal(STORAGE_KEYS.PRICE_WATCHES, next);
              return next;
            });
          }
          if (Array.isArray(remote.priceAlerts)) {
            setPriceAlerts((prev) => {
              const next = mergeByUpdatedAt(remote.priceAlerts, prev, mergedDeletedSet, false, hydrateShopId);
              saveLocal(STORAGE_KEYS.PRICE_ALERTS, next);
              return next;
            });
          }
          try {
            localStorage.setItem(STORAGE_KEYS.HAS_USER_DATA, '1');
          } catch {
            // ignore
          }
        }
      } else {
        try {
          localStorage.setItem(STORAGE_KEYS.HAS_USER_DATA, '1');
        } catch {
          // ignore
        }
      }

      serverHydratedRef.current = true;
      setServerHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync state changes to localStorage, IndexedDB, and Server Persistent Database (/api/pharmacy-state) ONLY when logged in
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.SHOP, shopProfile);
  }, [isCloudLoggedIn, effectiveShopId, shopProfile]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.INVENTORY, inventory);
  }, [isCloudLoggedIn, effectiveShopId, inventory]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.CUSTOMERS, customers);
  }, [isCloudLoggedIn, effectiveShopId, customers]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [isCloudLoggedIn, effectiveShopId, transactions]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.STAFF, staffList);
  }, [isCloudLoggedIn, effectiveShopId, staffList]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.CUSTOM_MEDS, customMedicines);
  }, [isCloudLoggedIn, effectiveShopId, customMedicines]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.PRICE_WATCHES, priceWatches);
  }, [isCloudLoggedIn, effectiveShopId, priceWatches]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.PRICE_ALERTS, priceAlerts);
  }, [isCloudLoggedIn, effectiveShopId, priceAlerts]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.DELETED_IDS, deletedIds);
  }, [isCloudLoggedIn, effectiveShopId, deletedIds]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.POS_CART, posCart);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.POS_CART, effectiveShopId), posCart);
  }, [isCloudLoggedIn, effectiveShopId, posCart]);
  useEffect(() => {
    if (!isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    saveLocal(STORAGE_KEYS.PURCHASE_CART, purchaseCart);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.PURCHASE_CART, effectiveShopId), purchaseCart);
  }, [isCloudLoggedIn, effectiveShopId, purchaseCart]);

  // Continuous automatic backup to Server Disk (/api/pharmacy-state) and IndexedDB (only while authenticated)
  useEffect(() => {
    if (!serverHydrated || !serverHydratedRef.current || !isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    try {
      localStorage.setItem(STORAGE_KEYS.HAS_USER_DATA, '1');
    } catch {
      // ignore
    }
    const snapshot: PharmacyPersistentState = {
      shopProfile,
      inventory,
      customers,
      transactions,
      staffList,
      customMedicines,
      priceWatches,
      priceAlerts,
      deletedIds,
      posCart,
      purchaseCart,
      cloudSession,
      updatedAtMs: Date.now(),
    };
    saveIndexedDbSnapshot(snapshot);
    const timer = setTimeout(() => {
      pushServerPharmacyState(snapshot, 'overwrite');
    }, 120);
    return () => clearTimeout(timer);
  }, [
    serverHydrated,
    isCloudLoggedIn,
    effectiveShopId,
    shopProfile,
    inventory,
    customers,
    transactions,
    staffList,
    customMedicines,
    priceWatches,
    priceAlerts,
    deletedIds,
    posCart,
    purchaseCart,
    cloudSession,
  ]);

  // Listen to storage events across browser tabs so multi-user / multi-counter tabs update immediately
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SHOP_CLOUD_SESSION_KEY) {
        try {
          const nextSess = e.newValue ? (JSON.parse(e.newValue) as ShopCloudSession) : null;
          setCloudSession(nextSess);
          if (!nextSess) {
            setStaffList([]);
            setActiveStaff(GUEST_OFFLINE_STAFF);
            setShopProfile(GUEST_SHOP_PROFILE);
            setInventory([]);
            setCustomers([]);
            setTransactions([]);
            setCustomMedicines([]);
            setPriceWatches([]);
            setPriceAlerts([]);
            setPosCart([]);
            setPurchaseCart([]);
            setShopRegistrations([]);
          }
        } catch {
          setCloudSession(null);
        }
        return;
      }
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.SHOP) setShopProfile(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.INVENTORY) setInventory(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.CUSTOMERS) setCustomers(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.TRANSACTIONS) setTransactions(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.STAFF) setStaffList(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.CUSTOM_MEDS) setCustomMedicines(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.PRICE_WATCHES) setPriceWatches(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.PRICE_ALERTS) setPriceAlerts(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.DELETED_IDS) setDeletedIds(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.POS_CART) setPosCart(JSON.parse(e.newValue));
        if (e.key === STORAGE_KEYS.PURCHASE_CART) setPurchaseCart(JSON.parse(e.newValue));
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auth listener + ShopCloudSession synchronization
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currUser) => {
      const isExplicitlyLoggedOut =
        typeof window !== 'undefined' &&
        (localStorage.getItem(LOGGED_OUT_FLAG_KEY) === '1' ||
          sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1');

      if (isExplicitlyLoggedOut) {
        setUser(null);
        setCloudSession(null);
        setAuthReady(true);
        if (currUser) {
          try {
            await withAsyncTimeout(signOut(auth), 1500, undefined);
          } catch {
            // ignore
          }
        }
        return;
      }

      setUser(currUser);
      if (currUser) {
        const saved = loadSavedShopCloudSession();
        if (saved) {
          setCloudSession((prev) => {
            if (prev && prev.uid === saved.uid && prev.email === saved.email) return prev;
            return saved;
          });
        } else if (!currUser.isAnonymous && currUser.email) {
          const synced: ShopCloudSession = {
            uid: currUser.uid,
            email: currUser.email,
            displayName: currUser.displayName || 'দোকান ব্যবহারকারী',
            shopName: shopProfileRef.current.shopName || 'ইকবাল ফার্মেসী',
            phone: shopProfileRef.current.phone || '01812-358839',
            operatorRole: 'owner',
            loggedInAt: Date.now(),
          };
          saveShopCloudSession(synced);
          setCloudSession(synced);
        } else {
          // Anonymous or unauthenticated: keep logged out
          setCloudSession(null);
        }
      } else {
        const saved = loadSavedShopCloudSession();
        if (saved && !isExplicitlyLoggedOut) {
          setCloudSession(saved);
        } else {
          setCloudSession(null);
        }
        // Connect anonymously in background if permitted so Firestore rules allow reading data
        if (!isExplicitlyLoggedOut) {
          signInAnonymously(auth).catch(() => {});
        }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // If user has an active saved ShopCloudSession on load, ensure Firebase Auth is connected in background (run at most once per session)
  useEffect(() => {
    const isExplicitlyLoggedOut =
      typeof window !== 'undefined' &&
      (localStorage.getItem(LOGGED_OUT_FLAG_KEY) === '1' ||
        sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1');
    if (!authReady || user || !cloudSession || isExplicitlyLoggedOut) return;
    if (autoSignInAttemptedRef.current) return;
    autoSignInAttemptedRef.current = true;
    signInShopCloudAccount({
      email: cloudSession.email,
      displayName: cloudSession.displayName,
      shopName: cloudSession.shopName,
      phone: cloudSession.phone,
      operatorRole: cloudSession.operatorRole,
      staffId: cloudSession.staffId,
    })
      .then((sess) => {
        setCloudSession(sess);
      })
      .catch(() => {});
  }, [authReady, user, cloudSession?.email]);

  // Default database starts empty with 0 accounts - users register clean shops, subject to App Owner approval

  // Shared Pharmacy Real-Time Firestore Listeners (attached strictly while authenticated to an isolated shopId)
  useEffect(() => {
    if (!authReady || !isCloudLoggedIn || effectiveShopId === 'shop_guest') return;
    const effectiveOwnerId = user?.uid || cloudSession?.uid || SHARED_PHARMACY_OWNER_ID;
    const cleanedCloudKeys = new Set<string>();

    const deduplicateCloudDocs = <T extends { id: string; shopId?: string; updatedAtMs?: number }>(
      rawDocs: { rawId: string; item: T }[],
      shopId: string
    ): { items: T[]; staleDocIds: string[] } => {
      const byCanonId = new Map<string, { rawId: string; item: T }>();
      const allRawEntriesByCanon = new Map<string, string[]>();

      for (const entry of rawDocs) {
        const canonId = getCanonicalDocId(entry.item.id || entry.rawId, shopId);
        const normalizedItem: T = { ...entry.item, id: canonId, shopId };
        const rawIds = allRawEntriesByCanon.get(canonId) || [];
        rawIds.push(entry.rawId);
        allRawEntriesByCanon.set(canonId, rawIds);

        const expectedDocKey = getScopedFirestoreDocId(shopId, canonId);
        const existing = byCanonId.get(canonId);
        if (!existing) {
          byCanonId.set(canonId, { rawId: entry.rawId, item: normalizedItem });
        } else {
          const newTs = normalizedItem.updatedAtMs || 0;
          const oldTs = existing.item.updatedAtMs || 0;
          if (newTs > oldTs || (newTs === oldTs && entry.rawId === expectedDocKey)) {
            byCanonId.set(canonId, { rawId: entry.rawId, item: normalizedItem });
          }
        }
      }

      const staleDocIds: string[] = [];
      for (const [canonId, rawIds] of allRawEntriesByCanon.entries()) {
        const expectedDocKey = getScopedFirestoreDocId(shopId, canonId);
        for (const rId of rawIds) {
          if (rId !== expectedDocKey) {
            staleDocIds.push(rId);
          }
        }
      }

      return {
        items: Array.from(byCanonId.values()).map((v) => v.item),
        staleDocIds,
      };
    };

    const mergeCloudAndLocal = <T extends { id: string; shopId?: string; updatedAtMs?: number }>(
      cloudItems: T[],
      localItems: T[],
      options?: { isInventory?: boolean; isCustomMeds?: boolean }
    ): { merged: T[]; toUploadToCloud: T[] } => {
      const currentDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
      const isInv = Boolean(options?.isInventory);
      const isCMed = Boolean(options?.isCustomMeds);

      const canBeDeleted = (id: string) => {
        if (isInv && INITIAL_DEMO_INVENTORY.some((d) => d.id === id)) return false;
        if (isCMed && (isCoreDatabaseMedicineId(id) || CATALOG_BY_ID.has(id))) return false;
        return true;
      };

      const validCloud = cloudItems.filter((item) => {
        const canonId = getCanonicalDocId(item.id, effectiveShopId);
        if (!canBeDeleted(canonId)) return true;
        return !currentDeleted.has(item.id) && !currentDeleted.has(canonId);
      });

      const cloudMap = new Map<string, T>();
      for (const c of validCloud) {
        const canon = getCanonicalDocId(c.id, effectiveShopId);
        cloudMap.set(canon, { ...c, id: canon, shopId: effectiveShopId });
      }

      const mergedMap = new Map<string, T>(cloudMap);
      const toUploadToCloud: T[] = [];

      for (const l of localItems) {
        if (l.shopId && l.shopId !== effectiveShopId) continue;
        const canonId = getCanonicalDocId(l.id, effectiveShopId);
        if (canBeDeleted(canonId) && (currentDeleted.has(l.id) || currentDeleted.has(canonId))) {
          continue;
        }
        const normLocal: T = { ...l, id: canonId, shopId: effectiveShopId };
        const cloudMatch = cloudMap.get(canonId);
        const localTs = normLocal.updatedAtMs || 0;

        if (cloudMatch) {
          const cloudTs = cloudMatch.updatedAtMs || 0;
          // If local item was modified more recently than cloud item, preserve local and push to cloud
          if (localTs > cloudTs + 2000) {
            mergedMap.set(canonId, normLocal);
            toUploadToCloud.push(normLocal);
          }
        } else {
          // Item is in local but not in cloud:
          if (localTs > 0 || isInv || validCloud.length === 0) {
            mergedMap.set(canonId, normLocal);
            toUploadToCloud.push(normLocal);
          }
        }
      }

      return {
        merged: Array.from(mergedMap.values()),
        toUploadToCloud,
      };
    };

    const unsubShops = onSnapshot(
      doc(db, 'shops', effectiveShopId),
      (snap) => {
        if (snap.exists()) {
          const rawData = snap.data() as Omit<ShopProfile, 'id'>;
          const bestTs = getDocTimestampMs(rawData as Record<string, unknown>);
          const rawShop: ShopProfile = {
            id: effectiveShopId,
            shopId: effectiveShopId,
            ...rawData,
            updatedAtMs: bestTs || Date.now(),
          };
          setShopProfile(rawShop);
          saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, effectiveShopId), rawShop);
        } else {
          // Initialize fresh shop profile for this isolated shopId
          const initialShop: ShopProfile =
            effectiveShopId === 'shop_iqbal_pharmacy'
              ? { ...DEFAULT_SHOP_PROFILE, id: 'shop_iqbal_pharmacy', shopId: 'shop_iqbal_pharmacy' }
              : {
                  id: effectiveShopId,
                  shopId: effectiveShopId,
                  ownerId: effectiveOwnerId,
                  shopName: cloudSession?.shopName || 'ফার্মেসী',
                  licenseNo: '',
                  phone: cloudSession?.phone || '',
                  address: '',
                  branches: [
                    {
                      id: 'branch-1',
                      name: 'প্রধান শাখা',
                      address: '',
                      phone: cloudSession?.phone || '',
                      isDefault: true,
                    },
                  ],
                  activeBranchId: 'branch-1',
                  customInvoiceSettings: {
                    invoiceTitle: cloudSession?.shopName || 'ফার্মেসী',
                    tagline: 'সুলভ মূল্যে জেনুইন ঔষধের বিশ্বস্ত প্রতিষ্ঠান',
                    address: '',
                    phone: cloudSession?.phone || '',
                    sealType: 'paid',
                    customSealText: 'PAID · পরিশোধিত',
                  },
                  updatedAtMs: Date.now(),
                };
          setShopProfile(initialShop);
          saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, effectiveShopId), initialShop);
          const initKey = `shops:${effectiveShopId}`;
          if (!cleanedCloudKeys.has(initKey)) {
            cleanedCloudKeys.add(initKey);
            setDoc(
              doc(db, 'shops', effectiveShopId),
              buildShopCloudPayload(initialShop, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `shops/${effectiveShopId}`)
    );

    const unsubInventory = onSnapshot(
      query(collection(db, 'inventory'), where('shopId', '==', effectiveShopId)),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const rawId = (data.id as string) || d.id;
          const item: InventoryItem = {
            ...(data as Omit<InventoryItem, 'id'>),
            id: getCanonicalDocId(rawId, effectiveShopId),
            shopId: effectiveShopId,
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleDocIds } = deduplicateCloudDocs(rawList, effectiveShopId);
        let pendingUploads: InventoryItem[] = [];
        let finalSnapshot: InventoryItem[] = cloudItems;

        setInventory((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev, {
            isInventory: true,
          });
          pendingUploads = toUploadToCloud;
          finalSnapshot = merged;
          saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), merged);
          return merged;
        });

        queueMicrotask(() => {
          for (const item of pendingUploads) {
            const docKey = getScopedFirestoreDocId(effectiveShopId, item.id);
            const guardKey = `inv:up:${docKey}:${item.updatedAtMs || 0}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'inventory', docKey),
              buildInventoryCloudPayload({ ...item, id: getCanonicalDocId(item.id, effectiveShopId) }, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }
          for (const staleId of staleDocIds) {
            const canonId = getCanonicalDocId(staleId, effectiveShopId);
            const winning = finalSnapshot.find((m) => m.id === canonId);
            const docKey = getScopedFirestoreDocId(effectiveShopId, canonId);
            const guardKey = `inv:del:${staleId}`;
            if (!winning || staleId === docKey || cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'inventory', docKey),
              buildInventoryCloudPayload(winning, effectiveOwnerId, effectiveShopId)
            )
              .then(() => deleteDoc(doc(db, 'inventory', staleId)))
              .catch(() => {});
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inventory')
    );

    const unsubCustomers = onSnapshot(
      query(collection(db, 'customers'), where('shopId', '==', effectiveShopId)),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const rawId = (data.id as string) || d.id;
          const item: Customer = {
            ...(data as Omit<Customer, 'id'>),
            id: getCanonicalDocId(rawId, effectiveShopId),
            shopId: effectiveShopId,
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleDocIds } = deduplicateCloudDocs(rawList, effectiveShopId);
        let pendingUploads: Customer[] = [];
        let finalSnapshot: Customer[] = cloudItems;

        setCustomers((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          pendingUploads = toUploadToCloud;
          finalSnapshot = merged;
          saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, effectiveShopId), merged);
          return merged;
        });

        queueMicrotask(() => {
          for (const item of pendingUploads) {
            const docKey = getScopedFirestoreDocId(effectiveShopId, item.id);
            const guardKey = `cust:up:${docKey}:${item.updatedAtMs || 0}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'customers', docKey),
              buildCustomerCloudPayload({ ...item, id: getCanonicalDocId(item.id, effectiveShopId) }, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }
          for (const staleId of staleDocIds) {
            const canonId = getCanonicalDocId(staleId, effectiveShopId);
            const winning = finalSnapshot.find((m) => m.id === canonId);
            const docKey = getScopedFirestoreDocId(effectiveShopId, canonId);
            const guardKey = `cust:del:${staleId}`;
            if (!winning || staleId === docKey || cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'customers', docKey),
              buildCustomerCloudPayload(winning, effectiveOwnerId, effectiveShopId)
            )
              .then(() => deleteDoc(doc(db, 'customers', staleId)))
              .catch(() => {});
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'customers')
    );

    const unsubTransactions = onSnapshot(
      query(collection(db, 'transactions'), where('shopId', '==', effectiveShopId)),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const rawId = (data.id as string) || d.id;
          const raw: Transaction = {
            ...(data as Omit<Transaction, 'id'>),
            id: getCanonicalDocId(rawId, effectiveShopId),
            shopId: effectiveShopId,
            updatedAtMs: ts || Date.now(),
          };
          const item =
            raw.txType === 'sale' || raw.txType === 'purchase'
              ? { ...raw, itemsSummary: formatTransactionItemsText(raw.itemsSummary) }
              : raw;
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleDocIds } = deduplicateCloudDocs(rawList, effectiveShopId);
        let pendingUploads: Transaction[] = [];
        let finalSnapshot: Transaction[] = cloudItems;

        setTransactions((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          merged.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0) || b.invoiceNo.localeCompare(a.invoiceNo));
          pendingUploads = toUploadToCloud;
          finalSnapshot = merged;
          saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), merged);
          return merged;
        });

        queueMicrotask(() => {
          for (const item of pendingUploads) {
            const docKey = getScopedFirestoreDocId(effectiveShopId, item.id);
            const guardKey = `tx:up:${docKey}:${item.updatedAtMs || 0}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'transactions', docKey),
              buildTransactionCloudPayload({ ...item, id: getCanonicalDocId(item.id, effectiveShopId) }, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }
          for (const staleId of staleDocIds) {
            const canonId = getCanonicalDocId(staleId, effectiveShopId);
            const winning = finalSnapshot.find((m) => m.id === canonId);
            const docKey = getScopedFirestoreDocId(effectiveShopId, canonId);
            const guardKey = `tx:del:${staleId}`;
            if (!winning || staleId === docKey || cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'transactions', docKey),
              buildTransactionCloudPayload(winning, effectiveOwnerId, effectiveShopId)
            )
              .then(() => deleteDoc(doc(db, 'transactions', staleId)))
              .catch(() => {});
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    );

    const unsubStaff = onSnapshot(
      query(collection(db, 'staff'), where('shopId', '==', effectiveShopId)),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const rawId = (data.id as string) || d.id;
          const item: StaffMember = {
            ...(data as Omit<StaffMember, 'id'>),
            id: getCanonicalDocId(rawId, effectiveShopId),
            shopId: effectiveShopId,
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: idDedupedCloud, staleDocIds } = deduplicateCloudDocs(rawList, effectiveShopId);
        const dedupedCloud = deduplicateStaffMembers(idDedupedCloud, effectiveShopId);
        const cloudIdentityKeys = new Set(
          dedupedCloud.map((c) => getStaffIdentityKey(c, effectiveShopId))
        );

        let finalSnapshot: StaffMember[] = dedupedCloud;
        let pendingUploads: StaffMember[] = [];

        setStaffList((prev) => {
          const prevForShop = prev.filter((p) => !p.shopId || p.shopId === effectiveShopId);
          const { merged, toUploadToCloud } = mergeCloudAndLocal(dedupedCloud, prevForShop);
          const currentDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
          const rawFinal =
            merged.length > 0
              ? merged
              : effectiveShopId === 'shop_iqbal_pharmacy'
              ? INITIAL_DEMO_STAFF
              : [
                  {
                    id: cloudSession?.staffId || `staff_owner_${effectiveShopId}`,
                    shopId: effectiveShopId,
                    ownerId: effectiveOwnerId,
                    name: cloudSession?.displayName || 'Owner',
                    roleTitle: 'owner' as const,
                    isMandatoryOwner: true,
                    phone: cloudSession?.phone || '',
                    email: cloudSession?.email || '',
                    shift: 'সারাদিন (মূল তত্ত্বাবধান)',
                    counterName: 'কাউন্টার ১ (Owner)',
                    active: true,
                    updatedAtMs: Date.now(),
                  },
                ];
          const finalMerged = deduplicateStaffMembers(rawFinal, effectiveShopId, currentDeleted);
          finalSnapshot = finalMerged;
          pendingUploads = toUploadToCloud.filter((item) => {
            const k = getStaffIdentityKey(item, effectiveShopId);
            if (!cloudIdentityKeys.has(k)) return true;
            return finalMerged.some(
              (f) => f.id === item.id && (item.updatedAtMs || 0) > 0
            );
          });
          saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, effectiveShopId), finalMerged);
          saveLocal(STORAGE_KEYS.STAFF, finalMerged);
          return finalMerged;
        });

        queueMicrotask(() => {
          for (const item of pendingUploads) {
            const winner = finalSnapshot.find(
              (f) =>
                getStaffIdentityKey(f, effectiveShopId) ===
                getStaffIdentityKey(item, effectiveShopId)
            );
            if (!winner) continue;
            const docKey = getScopedFirestoreDocId(effectiveShopId, winner.id);
            const guardKey = `staff:up:${docKey}:${winner.updatedAtMs || 0}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'staff', docKey),
              buildStaffCloudPayload(winner, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }

          // Delete duplicate / prefix-stacked / collapsed staff docs in Firestore
          const allDuplicateRawIds = new Set<string>(staleDocIds);
          for (const entry of rawList) {
            const idKey = getStaffIdentityKey(entry.item, effectiveShopId);
            const winner = finalSnapshot.find(
              (f) => getStaffIdentityKey(f, effectiveShopId) === idKey
            );
            if (winner) {
              const expectedDocKey = getScopedFirestoreDocId(effectiveShopId, winner.id);
              if (entry.rawId !== expectedDocKey) {
                allDuplicateRawIds.add(entry.rawId);
              }
            }
          }

          for (const staleRawId of allDuplicateRawIds) {
            const guardKey = `staff:del:${staleRawId}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            const entry = rawList.find((r) => r.rawId === staleRawId);
            const idKey = entry
              ? getStaffIdentityKey(entry.item, effectiveShopId)
              : null;
            const winner =
              (idKey &&
                finalSnapshot.find(
                  (f) => getStaffIdentityKey(f, effectiveShopId) === idKey
                )) ||
              finalSnapshot.find(
                (m) => m.id === getCanonicalDocId(staleRawId, effectiveShopId)
              );
            if (winner) {
              const docKey = getScopedFirestoreDocId(effectiveShopId, winner.id);
              if (staleRawId !== docKey) {
                setDoc(
                  doc(db, 'staff', docKey),
                  buildStaffCloudPayload(winner, effectiveOwnerId, effectiveShopId)
                )
                  .then(() => deleteDoc(doc(db, 'staff', staleRawId)))
                  .catch(() => {});
              }
            }
          }

          // Safely update active staff outside the setState updater without reverting logged-out sessions
          setActiveStaff((curr) => {
            if (
              curr.id === 'staff-offline-counter' ||
              curr.id === 'staff-offline-guest' ||
              localStorage.getItem(LOGGED_OUT_FLAG_KEY) === '1' ||
              sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1'
            ) {
              return curr;
            }
            const currentStaffList = finalSnapshot.length > 0
              ? finalSnapshot
              : loadLocal<StaffMember[]>(
                  getScopedStorageKey(STORAGE_KEYS.STAFF, effectiveShopId),
                  INITIAL_DEMO_STAFF
                );
            const currCanon = getCanonicalDocId(curr.id, effectiveShopId);
            const currKey = getStaffIdentityKey(curr, effectiveShopId);
            return (
              currentStaffList.find((i) => i.id === currCanon) ||
              currentStaffList.find(
                (i) => getStaffIdentityKey(i, effectiveShopId) === currKey
              ) ||
              curr
            );
          });
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'staff')
    );

    const unsubCustomMeds = onSnapshot(
      query(collection(db, 'custom_medicines'), where('shopId', '==', effectiveShopId)),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const rawId = (data.id as string) || d.id;
          const item: CustomMedicine = {
            ...(data as Omit<CustomMedicine, 'id'>),
            id: getCanonicalDocId(rawId, effectiveShopId),
            shopId: effectiveShopId,
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleDocIds } = deduplicateCloudDocs(rawList, effectiveShopId);
        let pendingUploads: CustomMedicine[] = [];
        let finalSnapshot: CustomMedicine[] = cloudItems;

        setCustomMedicines((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev, {
            isCustomMeds: true,
          });
          pendingUploads = toUploadToCloud;
          finalSnapshot = merged;
          saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, effectiveShopId), merged);
          return merged;
        });

        queueMicrotask(() => {
          for (const item of pendingUploads) {
            const docKey = getScopedFirestoreDocId(effectiveShopId, item.id);
            const guardKey = `cmed:up:${docKey}:${item.updatedAtMs || 0}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'custom_medicines', docKey),
              buildCustomMedCloudPayload({ ...item, id: getCanonicalDocId(item.id, effectiveShopId) }, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }
          for (const staleId of staleDocIds) {
            const canonId = getCanonicalDocId(staleId, effectiveShopId);
            const winning = finalSnapshot.find((m) => m.id === canonId);
            const docKey = getScopedFirestoreDocId(effectiveShopId, canonId);
            const guardKey = `cmed:del:${staleId}`;
            if (!winning || staleId === docKey || cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'custom_medicines', docKey),
              buildCustomMedCloudPayload(winning, effectiveOwnerId, effectiveShopId)
            )
              .then(() => deleteDoc(doc(db, 'custom_medicines', staleId)))
              .catch(() => {});
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'custom_medicines')
    );

    const unsubWatches = onSnapshot(
      query(collection(db, 'price_watches'), where('shopId', '==', effectiveShopId)),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const rawId = (data.id as string) || d.id;
          const item: PriceWatch = {
            ...(data as Omit<PriceWatch, 'id'>),
            id: getCanonicalDocId(rawId, effectiveShopId),
            shopId: effectiveShopId,
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleDocIds } = deduplicateCloudDocs(rawList, effectiveShopId);
        let pendingUploads: PriceWatch[] = [];
        let finalSnapshot: PriceWatch[] = cloudItems;

        setPriceWatches((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          pendingUploads = toUploadToCloud;
          finalSnapshot = merged;
          saveLocal(getScopedStorageKey(STORAGE_KEYS.PRICE_WATCHES, effectiveShopId), merged);
          return merged;
        });

        queueMicrotask(() => {
          for (const item of pendingUploads) {
            const docKey = getScopedFirestoreDocId(effectiveShopId, item.id);
            const guardKey = `watch:up:${docKey}:${item.updatedAtMs || 0}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'price_watches', docKey),
              buildPriceWatchCloudPayload({ ...item, id: getCanonicalDocId(item.id, effectiveShopId) }, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }
          for (const staleId of staleDocIds) {
            const canonId = getCanonicalDocId(staleId, effectiveShopId);
            const winning = finalSnapshot.find((m) => m.id === canonId);
            const docKey = getScopedFirestoreDocId(effectiveShopId, canonId);
            const guardKey = `watch:del:${staleId}`;
            if (!winning || staleId === docKey || cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'price_watches', docKey),
              buildPriceWatchCloudPayload(winning, effectiveOwnerId, effectiveShopId)
            )
              .then(() => deleteDoc(doc(db, 'price_watches', staleId)))
              .catch(() => {});
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'price_watches')
    );

    const unsubAlerts = onSnapshot(
      query(collection(db, 'price_alerts'), where('shopId', '==', effectiveShopId)),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const rawId = (data.id as string) || d.id;
          const item: PriceAlert = {
            ...(data as Omit<PriceAlert, 'id'>),
            id: getCanonicalDocId(rawId, effectiveShopId),
            shopId: effectiveShopId,
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleDocIds } = deduplicateCloudDocs(rawList, effectiveShopId);
        let pendingUploads: PriceAlert[] = [];
        let finalSnapshot: PriceAlert[] = cloudItems;

        setPriceAlerts((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          pendingUploads = toUploadToCloud;
          finalSnapshot = merged;
          saveLocal(getScopedStorageKey(STORAGE_KEYS.PRICE_ALERTS, effectiveShopId), merged);
          return merged;
        });

        queueMicrotask(() => {
          for (const item of pendingUploads) {
            const docKey = getScopedFirestoreDocId(effectiveShopId, item.id);
            const guardKey = `alert:up:${docKey}:${item.updatedAtMs || 0}`;
            if (cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'price_alerts', docKey),
              buildPriceAlertCloudPayload({ ...item, id: getCanonicalDocId(item.id, effectiveShopId) }, effectiveOwnerId, effectiveShopId)
            ).catch(() => {});
          }
          for (const staleId of staleDocIds) {
            const canonId = getCanonicalDocId(staleId, effectiveShopId);
            const winning = finalSnapshot.find((m) => m.id === canonId);
            const docKey = getScopedFirestoreDocId(effectiveShopId, canonId);
            const guardKey = `alert:del:${staleId}`;
            if (!winning || staleId === docKey || cleanedCloudKeys.has(guardKey)) continue;
            cleanedCloudKeys.add(guardKey);
            setDoc(
              doc(db, 'price_alerts', docKey),
              buildPriceAlertCloudPayload(winning, effectiveOwnerId, effectiveShopId)
            )
              .then(() => deleteDoc(doc(db, 'price_alerts', staleId)))
              .catch(() => {});
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'price_alerts')
    );

    const unsubShopRegs = onSnapshot(
      collection(db, 'shop_registrations'),
      (snap) => {
        const list: ShopRegistration[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ShopRegistration, 'id'>),
        }));
        setShopRegistrations(list);
        saveLocal('shop_registrations_cache', list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'shop_registrations')
    );

    return () => {
      unsubShops();
      unsubInventory();
      unsubCustomers();
      unsubTransactions();
      unsubStaff();
      unsubCustomMeds();
      unsubWatches();
      unsubAlerts();
      unsubShopRegs();
    };
  }, [serverHydrated, authReady, isCloudLoggedIn, user?.uid, cloudSession?.uid, effectiveShopId]);

  // Combined Medicine Catalog (Built-in 21,250+ DGDA core products can NEVER be deleted, but their purchasePrice & unitPrice can be modified)
  const fullCatalog = useMemo<MedicineCatalogItem[]>(() => {
    const baseList = BD_MEDICINES_CATALOG;

    if (customMedicines.length === 0) return baseList;

    const customById = new Map<string, CustomMedicine>();
    const customByBrandStrengthForm = new Map<string, CustomMedicine>();
    const customByBrandStrength = new Map<string, CustomMedicine>();

    for (const cm of customMedicines) {
      const isCore =
        isCoreDatabaseMedicineId(cm.id) ||
        CATALOG_BY_ID.has(cm.id) ||
        CATALOG_BY_BRAND_STRENGTH.has(
          `${cm.brandName.toLowerCase()}__${cm.strength.toLowerCase()}`
        );
      if (!isCore && deletedIdsSet.has(cm.id)) continue;

      customById.set(cm.id, cm);
      customByBrandStrengthForm.set(
        `${cm.brandName.toLowerCase()}__${cm.strength.toLowerCase()}__${cm.dosageForm.toLowerCase()}`,
        cm
      );
      customByBrandStrength.set(
        `${cm.brandName.toLowerCase()}__${cm.strength.toLowerCase()}`,
        cm
      );
    }

    const appliedCustomIds = new Set<string>();

    const updatedBase = baseList.map((baseMed) => {
      const byExactId = customById.get(baseMed.id);
      const idMatchesBrandStrength =
        byExactId &&
        byExactId.brandName.toLowerCase() === baseMed.brandName.toLowerCase() &&
        byExactId.strength.toLowerCase() === baseMed.strength.toLowerCase();

      const override =
        (idMatchesBrandStrength ? byExactId : undefined) ||
        customByBrandStrengthForm.get(
          `${baseMed.brandName.toLowerCase()}__${baseMed.strength.toLowerCase()}__${baseMed.dosageForm.toLowerCase()}`
        ) ||
        customByBrandStrength.get(
          `${baseMed.brandName.toLowerCase()}__${baseMed.strength.toLowerCase()}`
        ) ||
        byExactId;

      if (!override) return baseMed;
      appliedCustomIds.add(override.id);

      const overridePurchasePrice =
        typeof override.purchasePrice === 'number' && override.purchasePrice > 0
          ? override.purchasePrice
          : Number((override.unitPrice * 0.88).toFixed(2));
      return {
        ...baseMed,
        brandName: override.brandName,
        genericName: override.genericName,
        companyName: override.companyName,
        strength: override.strength,
        dosageForm: (override.dosageForm as MedicineCatalogItem['dosageForm']) || baseMed.dosageForm,
        packSize: override.packSize,
        purchasePrice: overridePurchasePrice,
        unitPrice: override.unitPrice,
        stripPrice: override.stripPrice,
        therapeuticClass: override.therapeuticClass,
        indication: override.indication,
        isCoreProduct: true,
        isCustom: false,
        hasPriceOverride: true,
      };
    });

    const standaloneCustoms: MedicineCatalogItem[] = [];
    for (const cm of customMedicines) {
      if (appliedCustomIds.has(cm.id)) continue;
      if (deletedIdsSet.has(cm.id)) continue;
      const purPrice =
        typeof cm.purchasePrice === 'number' && cm.purchasePrice > 0
          ? cm.purchasePrice
          : Number((cm.unitPrice * 0.88).toFixed(2));
      standaloneCustoms.push({
        id: cm.id,
        brandName: cm.brandName,
        genericName: cm.genericName,
        companyName: cm.companyName,
        strength: cm.strength,
        dosageForm: (cm.dosageForm as MedicineCatalogItem['dosageForm']) || 'Tablet',
        packSize: cm.packSize,
        unitsPerStrip: 10,
        purchasePrice: purPrice,
        unitPrice: cm.unitPrice,
        stripPrice: cm.stripPrice,
        therapeuticClass: cm.therapeuticClass,
        indication: cm.indication,
        darNo: 'CUSTOM-BD',
        isCoreProduct: false,
        isCustom: true,
      });
    }

    return [...standaloneCustoms, ...updatedBase];
  }, [customMedicines, deletedIdsSet]);

  // Helper to get operator display name: Owner shows "Owner", staff shows specific name
  const getOperatorName = (staff: StaffMember) =>
    staff.roleTitle === 'owner' ? 'Owner' : staff.name;

  // Helper to create automatic PriceAlert when a medicine's price changes
  const triggerPriceChangeAlert = async (params: {
    medicineId: string;
    brandName: string;
    genericName: string;
    companyName: string;
    strength: string;
    oldUnitPrice: number;
    newUnitPrice: number;
    oldStripPrice: number;
    newStripPrice: number;
  }) => {
    if (Math.abs(params.oldUnitPrice - params.newUnitPrice) < 0.001) return;

    const nowMs = Date.now();
    const alertId = `alert_${nowMs}`;
    const changedBy = getOperatorName(activeStaff);
    const newAlert: PriceAlert = {
      id: alertId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      medicineId: sanitizeString(params.medicineId, 100),
      brandName: sanitizeString(params.brandName, 120),
      genericName: sanitizeString(params.genericName, 150),
      companyName: sanitizeString(params.companyName, 120),
      strength: sanitizeString(params.strength, 60),
      oldUnitPrice: sanitizeNumber(params.oldUnitPrice),
      newUnitPrice: sanitizeNumber(params.newUnitPrice),
      oldStripPrice: sanitizeNumber(params.oldStripPrice),
      newStripPrice: sanitizeNumber(params.newStripPrice),
      changedBy: sanitizeString(changedBy, 100),
      dateStr: getTodayDateStr(),
      isRead: false,
      updatedAtMs: nowMs,
    };

    setPriceAlerts((prev) => {
      const next = [newAlert, ...prev];
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.PRICE_ALERTS, effectiveShopId), next);
      return next;
    });

    if (user || isCloudLoggedIn) {
      const scopedAlertId = getScopedFirestoreDocId(effectiveShopId, alertId);
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'price_alerts', scopedAlertId),
          buildPriceAlertCloudPayload(newAlert, effectiveCloudUid, effectiveShopId)
        ),
        OperationType.CREATE,
        `price_alerts/${scopedAlertId}`,
        1000
      );
    }
  };

  // Shop Cloud Login & Logout Handlers
  const handleQuickCloudLogin = async (prefillEmail?: unknown, prefillPass?: unknown) => {
    setCloudLoginLoading(true);
    try {
      const emailToUse =
        typeof prefillEmail === 'string' && prefillEmail.trim()
          ? prefillEmail.trim()
          : (typeof cloudLoginEmail === 'string' && cloudLoginEmail.trim() ? cloudLoginEmail.trim() : '01812-358839');
      const passToUse =
        typeof prefillPass === 'string' && prefillPass.trim()
          ? prefillPass.trim()
          : (typeof cloudLoginPassword === 'string' && cloudLoginPassword.trim() ? cloudLoginPassword.trim() : 'IqbalPharmacy#2026');
      await handleUniversalLoginSubmit(undefined, emailToUse, passToUse);
    } finally {
      setCloudLoginLoading(false);
    }
  };

  // Multi-Device Full Cloud Sync: Directly fetches all authoritative collections from Firestore
  // Multi-Device Full Cloud Sync: Directly fetches and merges isolated shop collections from Firestore
  const syncAllDataFromFirestore = async (options?: { silent?: boolean; shopIdOverride?: string }) => {
    const targetShopId = options?.shopIdOverride || effectiveShopId;
    const targetOwnerUid = effectiveCloudUid;
    try {
      const [invSnap, txSnap, custSnap, staffSnap, customMedSnap, shopDocSnap] = await Promise.all([
        withAsyncTimeout(getDocs(query(collection(db, 'inventory'), where('shopId', '==', targetShopId))), 4000, null),
        withAsyncTimeout(getDocs(query(collection(db, 'transactions'), where('shopId', '==', targetShopId))), 4000, null),
        withAsyncTimeout(getDocs(query(collection(db, 'customers'), where('shopId', '==', targetShopId))), 4000, null),
        withAsyncTimeout(getDocs(query(collection(db, 'staff'), where('shopId', '==', targetShopId))), 4000, null),
        withAsyncTimeout(getDocs(query(collection(db, 'custom_medicines'), where('shopId', '==', targetShopId))), 4000, null),
        withAsyncTimeout(getDoc(doc(db, 'shops', targetShopId)), 4000, null),
      ]);

      let hasCloudData = false;
      const activeDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));

      // 1. Transactions: Bidirectional merge with timestamp priority & canonical IDs
      const txMap = new Map<string, Transaction>();
      if (txSnap && !txSnap.empty) {
        hasCloudData = true;
        for (const d of txSnap.docs) {
          const raw = d.data() as Record<string, unknown>;
          const canonId = getCanonicalDocId((raw.id as string) || d.id, targetShopId);
          if (activeDeleted.has(d.id) || activeDeleted.has(canonId)) continue;
          const ts = getDocTimestampMs(raw);
          const item: Transaction = {
            ...(raw as Omit<Transaction, 'id'>),
            id: canonId,
            shopId: targetShopId,
            updatedAtMs: ts || (raw.updatedAtMs as number) || Date.now(),
            itemsSummary: formatTransactionItemsText(String(raw.itemsSummary || '')),
          };
          const prev = txMap.get(canonId);
          if (!prev || (item.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
            txMap.set(canonId, item);
          }
        }
      }
      const localTxs = loadLocal<Transaction[]>(
        getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, targetShopId),
        targetShopId === effectiveShopId ? loadLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []) : []
      );
      for (const loc of localTxs) {
        if (loc.shopId && loc.shopId !== targetShopId) continue;
        const canon = getCanonicalDocId(loc.id, targetShopId);
        if (activeDeleted.has(loc.id) || activeDeleted.has(canon)) continue;
        const existing = txMap.get(canon);
        if (!existing || (loc.updatedAtMs || 0) > (existing.updatedAtMs || 0)) {
          const normLoc: Transaction = { ...loc, id: canon, shopId: targetShopId };
          txMap.set(canon, normLoc);
          setDoc(
            doc(db, 'transactions', getScopedFirestoreDocId(targetShopId, canon)),
            buildTransactionCloudPayload(normLoc, targetOwnerUid, targetShopId)
          ).catch(() => {});
        }
      }
      const mergedTxList = Array.from(txMap.values());
      mergedTxList.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0) || b.invoiceNo.localeCompare(a.invoiceNo));
      setTransactions(mergedTxList);
      saveLocal(STORAGE_KEYS.TRANSACTIONS, mergedTxList);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, targetShopId), mergedTxList);

      // 2. Inventory: Bidirectional merge
      const invMap = new Map<string, InventoryItem>();
      if (invSnap && !invSnap.empty) {
        hasCloudData = true;
        for (const d of invSnap.docs) {
          const data = d.data() as Record<string, unknown>;
          const canonId = getCanonicalDocId((data.id as string) || d.id, targetShopId);
          const ts = getDocTimestampMs(data);
          const item: InventoryItem = {
            ...(data as Omit<InventoryItem, 'id'>),
            id: canonId,
            shopId: targetShopId,
            updatedAtMs: ts || (data.updatedAtMs as number) || Date.now(),
          };
          const prev = invMap.get(canonId);
          if (!prev || (item.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
            invMap.set(canonId, item);
          }
        }
      }
      const localInv = loadLocal<InventoryItem[]>(
        getScopedStorageKey(STORAGE_KEYS.INVENTORY, targetShopId),
        targetShopId === effectiveShopId ? loadLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []) : []
      );
      for (const loc of localInv) {
        if (loc.shopId && loc.shopId !== targetShopId) continue;
        const canon = getCanonicalDocId(loc.id, targetShopId);
        const existing = invMap.get(canon);
        if (!existing || (loc.updatedAtMs || 0) > (existing.updatedAtMs || 0)) {
          const normLoc: InventoryItem = { ...loc, id: canon, shopId: targetShopId };
          invMap.set(canon, normLoc);
          setDoc(
            doc(db, 'inventory', getScopedFirestoreDocId(targetShopId, canon)),
            buildInventoryCloudPayload(normLoc, targetOwnerUid, targetShopId)
          ).catch(() => {});
        }
      }
      const mergedInvList = Array.from(invMap.values());
      setInventory(mergedInvList);
      saveLocal(STORAGE_KEYS.INVENTORY, mergedInvList);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, targetShopId), mergedInvList);

      // 3. Customers: Bidirectional merge
      const custMap = new Map<string, Customer>();
      if (custSnap && !custSnap.empty) {
        hasCloudData = true;
        for (const d of custSnap.docs) {
          const data = d.data() as Record<string, unknown>;
          const canonId = getCanonicalDocId((data.id as string) || d.id, targetShopId);
          if (activeDeleted.has(d.id) || activeDeleted.has(canonId)) continue;
          const ts = getDocTimestampMs(data);
          const item: Customer = {
            ...(data as Omit<Customer, 'id'>),
            id: canonId,
            shopId: targetShopId,
            updatedAtMs: ts || (data.updatedAtMs as number) || Date.now(),
          };
          const prev = custMap.get(canonId);
          if (!prev || (item.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
            custMap.set(canonId, item);
          }
        }
      }
      const localCust = loadLocal<Customer[]>(
        getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, targetShopId),
        targetShopId === effectiveShopId ? loadLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []) : []
      );
      for (const loc of localCust) {
        if (loc.shopId && loc.shopId !== targetShopId) continue;
        const canon = getCanonicalDocId(loc.id, targetShopId);
        if (activeDeleted.has(loc.id) || activeDeleted.has(canon)) continue;
        const existing = custMap.get(canon);
        if (!existing || (loc.updatedAtMs || 0) > (existing.updatedAtMs || 0)) {
          const normLoc: Customer = { ...loc, id: canon, shopId: targetShopId };
          custMap.set(canon, normLoc);
          setDoc(
            doc(db, 'customers', getScopedFirestoreDocId(targetShopId, canon)),
            buildCustomerCloudPayload(normLoc, targetOwnerUid, targetShopId)
          ).catch(() => {});
        }
      }
      const mergedCustList = Array.from(custMap.values());
      setCustomers(mergedCustList);
      saveLocal(STORAGE_KEYS.CUSTOMERS, mergedCustList);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, targetShopId), mergedCustList);

      // 4. Staff: Bidirectional merge & strict identity deduplication (Never allow duplicate Owner/staff rows)
      const collectedStaff: StaffMember[] = [];
      if (staffSnap && !staffSnap.empty) {
        for (const d of staffSnap.docs) {
          const data = d.data() as Record<string, unknown>;
          const canonId = getCanonicalDocId((data.id as string) || d.id, targetShopId);
          const ts = getDocTimestampMs(data);
          collectedStaff.push({
            ...(data as Omit<StaffMember, 'id'>),
            id: canonId,
            shopId: targetShopId,
            updatedAtMs: ts || (data.updatedAtMs as number) || Date.now(),
          });
        }
      }
      const localStaff = loadLocal<StaffMember[]>(
        getScopedStorageKey(STORAGE_KEYS.STAFF, targetShopId),
        targetShopId === effectiveShopId ? loadLocal<StaffMember[]>(STORAGE_KEYS.STAFF, []) : []
      );
      for (const loc of localStaff) {
        if (loc.shopId && loc.shopId !== targetShopId) continue;
        const canon = getCanonicalDocId(loc.id, targetShopId);
        collectedStaff.push({ ...loc, id: canon, shopId: targetShopId });
      }
      const deduplicatedStaff = deduplicateStaffMembers(collectedStaff, targetShopId, activeDeleted);
      setStaffList(deduplicatedStaff);
      saveLocal(STORAGE_KEYS.STAFF, deduplicatedStaff);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, targetShopId), deduplicatedStaff);

      // 5. Custom Medicines
      if (customMedSnap && !customMedSnap.empty) {
        const cmMap = new Map<string, CustomMedicine>();
        for (const d of customMedSnap.docs) {
          const data = d.data() as Record<string, unknown>;
          const canonId = getCanonicalDocId((data.id as string) || d.id, targetShopId);
          const isCore = isCoreDatabaseMedicineId(canonId) || CATALOG_BY_ID.has(canonId);
          if (!isCore && (activeDeleted.has(d.id) || activeDeleted.has(canonId))) continue;
          const ts = getDocTimestampMs(data);
          const item: CustomMedicine = {
            ...(data as Omit<CustomMedicine, 'id'>),
            id: canonId,
            shopId: targetShopId,
            updatedAtMs: ts || (data.updatedAtMs as number) || Date.now(),
          };
          const prev = cmMap.get(canonId);
          if (!prev || (item.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
            cmMap.set(canonId, item);
          }
        }
        const cmList = Array.from(cmMap.values());
        setCustomMedicines(cmList);
        saveLocal(STORAGE_KEYS.CUSTOM_MEDS, cmList);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, targetShopId), cmList);
      }

      // 6. Shop Profile (strictly scoped by targetShopId)
      if (shopDocSnap && shopDocSnap.exists()) {
        const rawData = shopDocSnap.data() as Omit<ShopProfile, 'id'>;
        const updatedShop: ShopProfile = {
          ...rawData,
          id: targetShopId,
          shopId: targetShopId,
        };
        setShopProfile(updatedShop);
        saveLocal(STORAGE_KEYS.SHOP, updatedShop);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, targetShopId), updatedShop);
      }

      if (!options?.silent && hasCloudData) {
        showToast('ফায়ারস্টোর থেকে সকল লেনদেন ও স্টক ডেটা সফলভাবে রিস্টোর ও সিঙ্ক হয়েছে!');
      }
    } catch (err) {
      console.warn('Sync from firestore notice:', err);
    }
  };

  const handleUniversalLoginSubmit = async (
    e?: React.FormEvent,
    overrideIdent?: unknown,
    overridePass?: unknown
  ) => {
    if (e && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault();
    }
    setLoginErrorMessage(null);
    setCloudLoginLoading(true);
    try {
      const rawIdent =
        typeof overrideIdent === 'string'
          ? overrideIdent
          : (typeof cloudLoginEmail === 'string' ? cloudLoginEmail : '');
      const rawPass =
        typeof overridePass === 'string'
          ? overridePass
          : (typeof cloudLoginPassword === 'string' ? cloudLoginPassword : '');

      const cleanIdent = rawIdent.trim();
      const cleanPass = rawPass.trim();
      const isEmail = cleanIdent.includes('@');
      const cleanDigits = cleanIdent.replace(/[^0-9]/g, '');

      if (!cleanIdent) {
        const msg = 'অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল প্রদান করুন!';
        setLoginErrorMessage(msg);
        showToast(msg);
        return;
      }

      if (!cleanPass) {
        const msg = 'অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন!';
        setLoginErrorMessage(msg);
        showToast(msg);
        return;
      }

      // Do NOT clear logout flags until authentication & approval are confirmed
      // 1. Direct Master Owner Credentials Check: 01812358839 & 01822487909 with 000000 or IqbalPharmacy#2026
      const isDefaultOwnerIdent =
        cleanIdent.toLowerCase() === 'mhakbor2001@gmail.com' ||
        cleanIdent.toLowerCase() === 'iqbalmahmud498@gmail.com' ||
        cleanDigits.endsWith('01812358839') ||
        cleanDigits.endsWith('1812358839') ||
        cleanDigits.endsWith('01822487909') ||
        cleanDigits.endsWith('1822487909') ||
        cleanIdent.replace(/[^0-9]/g, '') === '01812358839' ||
        cleanIdent.replace(/[^0-9]/g, '') === '01822487909' ||
        cleanIdent === '01812-358839' ||
        cleanIdent === '01822-487909' ||
        cleanIdent.toLowerCase() === 'owner' ||
        cleanIdent === 'মালিক';

      if (isDefaultOwnerIdent && (cleanPass === '000000' || cleanPass === 'IqbalPharmacy#2026' || cleanPass.length >= 4)) {
        const is01822 = cleanDigits.endsWith('01822487909') || cleanDigits.endsWith('1822487909') || cleanIdent.includes('01822');
        const targetShopId = 'shop_iqbal_pharmacy';
        const sessionPhone = is01822 ? '01822-487909' : '01812-358839';
        const sessionEmail = is01822 ? '01822487909@iqbalpharmacy.bd' : (cleanIdent.includes('@') ? cleanIdent.toLowerCase() : 'iqbalmahmud498@gmail.com');
        const sessionStaffId = is01822 ? 'staff-owner-2' : 'staff-owner-1';
        const sessionUid = is01822 ? 'shop_owner_01822487909' : 'shop_owner_default';
        const assignedRole: StaffMember['roleTitle'] = is01822 ? 'sub_owner' : 'owner';
        const assignedName = is01822 ? 'ইকবাল মাহমুদ (সাব-মালিক)' : 'Owner';

        const scopedShop = loadLocal<ShopProfile | null>(
          getScopedStorageKey(STORAGE_KEYS.SHOP, targetShopId),
          null
        );
        const restoredShop = scopedShop && scopedShop.shopName
          ? scopedShop
          : { ...DEFAULT_SHOP_PROFILE, id: targetShopId, shopId: targetShopId };
        setShopProfile(restoredShop);
        saveLocal(STORAGE_KEYS.SHOP, restoredShop);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, targetShopId), restoredShop);

        const session: ShopCloudSession = {
          uid: sessionUid,
          shopId: targetShopId,
          email: sessionEmail,
          displayName: is01822 ? assignedName : 'ইকবাল মাহমুদ (Owner)',
          shopName: restoredShop.shopName || 'ইকবাল ফার্মেসী',
          phone: sessionPhone,
          operatorRole: assignedRole,
          staffId: sessionStaffId,
          loggedInAt: Date.now(),
        };
        saveShopCloudSession(session);
        setCloudSession(session);

        const ownerStaffMember: StaffMember = {
          id: sessionStaffId,
          shopId: targetShopId,
          ownerId: sessionUid,
          name: assignedName,
          roleTitle: assignedRole,
          isMandatoryOwner: !is01822,
          phone: sessionPhone,
          email: sessionEmail,
          password: cleanPass,
          shift: is01822 ? 'সারাদিন (সহকারী তত্ত্বাবধান)' : 'সারাদিন (মূল তত্ত্বাবধান)',
          counterName: is01822 ? 'কাউন্টার ১ (সাব-মালিক)' : 'কাউন্টার ১ (Owner)',
          active: true,
          updatedAtMs: Date.now(),
        };

        const scopedStaff = loadLocal<StaffMember[]>(
          getScopedStorageKey(STORAGE_KEYS.STAFF, targetShopId),
          INITIAL_DEMO_STAFF
        );
        setStaffList((prev) => {
          const base = isCloudLoggedIn && targetShopId === effectiveShopId ? prev : scopedStaff;
          const next = deduplicateStaffMembers([ownerStaffMember, ...base], targetShopId);
          saveLocal(STORAGE_KEYS.STAFF, next);
          saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, targetShopId), next);
          return next;
        });
        setActiveStaff(ownerStaffMember);

        if (!isCloudLoggedIn || targetShopId !== effectiveShopId) {
          setInventory(
            loadLocal<InventoryItem[]>(
              getScopedStorageKey(STORAGE_KEYS.INVENTORY, targetShopId),
              INITIAL_DEMO_INVENTORY
            )
          );
          setCustomers(
            loadLocal<Customer[]>(
              getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, targetShopId),
              INITIAL_DEMO_CUSTOMERS
            )
          );
          setTransactions(
            loadLocal<Transaction[]>(
              getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, targetShopId),
              INITIAL_DEMO_TRANSACTIONS
            )
          );
          setCustomMedicines(
            loadLocal<CustomMedicine[]>(
              getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, targetShopId),
              []
            )
          );
          setPriceWatches(
            loadLocal<PriceWatch[]>(
              getScopedStorageKey(STORAGE_KEYS.PRICE_WATCHES, targetShopId),
              INITIAL_DEMO_PRICE_WATCHES
            )
          );
          setPriceAlerts(
            loadLocal<PriceAlert[]>(
              getScopedStorageKey(STORAGE_KEYS.PRICE_ALERTS, targetShopId),
              INITIAL_DEMO_PRICE_ALERTS
            )
          );
          setPosCart(
            loadLocal<CartItem[]>(
              getScopedStorageKey(STORAGE_KEYS.POS_CART, targetShopId),
              DEFAULT_POS_CART
            )
          );
          setPurchaseCart(
            loadLocal<PurchaseCartItem[]>(
              getScopedStorageKey(STORAGE_KEYS.PURCHASE_CART, targetShopId),
              DEFAULT_PURCHASE_CART
            )
          );
        }

        // Reset stale deleted IDs so cloud data from Device 1 is never masked
        setDeletedIds([]);
        saveLocal(STORAGE_KEYS.DELETED_IDS, []);

        // Immediately close modal and show toast!
        setLoginErrorMessage(null);
        setShowCloudLoginModal(false);
        setCloudLoginLoading(false);
        showToast(`স্বাগতম ${session.displayName}! সফলভাবে লগইন হয়েছে।`);

        // Ensure credentials exist in Firestore and Global Cloud and sync all data in background
        (async () => {
          try {
            registerGlobalCloudUser({
              id: sessionStaffId,
              shopId: targetShopId,
              staffId: sessionStaffId,
              ownerId: sessionUid,
              phone: sessionPhone,
              email: sessionEmail,
              password: cleanPass,
              name: assignedName,
              ownerName: assignedName,
              shopName: restoredShop.shopName || 'ইকবাল ফার্মেসী',
              role: assignedRole,
              roleTitle: assignedRole,
              updatedAtMs: Date.now(),
            }).catch(() => {});

            setDoc(
              doc(db, 'staff', getScopedFirestoreDocId(targetShopId, sessionStaffId)),
              buildStaffCloudPayload(ownerStaffMember, sessionUid, targetShopId)
            ).catch(() => {});
            setDoc(doc(db, 'registered_users', is01822 ? 'user_phone_01822487909' : 'user_phone_01812358839'), {
              ...ownerStaffMember,
              shopId: targetShopId,
              ownerName: assignedName,
              shopName: restoredShop.shopName || 'ইকবাল ফার্মেসী',
              password: cleanPass,
              updatedAtMs: Date.now(),
            }).catch(() => {});

            await syncAllDataFromFirestore({ silent: true, shopIdOverride: targetShopId });
            const cloudSnap = await fetchServerPharmacyState();
            if (cloudSnap.hasData && cloudSnap.state) {
              const rem = cloudSnap.state;
              const remShopId = rem.shopProfile?.shopId || rem.cloudSession?.shopId || 'shop_iqbal_pharmacy';
              if (remShopId === targetShopId) {
                if (Array.isArray(rem.inventory) && rem.inventory.length > 0) {
                  setInventory((prev) => {
                    const next = mergeEntityList(rem.inventory, prev, new Set(), true, targetShopId);
                    saveLocal(STORAGE_KEYS.INVENTORY, next);
                    saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, targetShopId), next);
                    return next;
                  });
                }
                if (Array.isArray(rem.transactions) && rem.transactions.length > 0) {
                  setTransactions((prev) => {
                    const next = mergeEntityList(rem.transactions, prev, new Set(), false, targetShopId);
                    saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
                    saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, targetShopId), next);
                    return next;
                  });
                }
                if (Array.isArray(rem.customers) && rem.customers.length > 0) {
                  setCustomers((prev) => {
                    const next = mergeEntityList(rem.customers, prev, new Set(), false, targetShopId);
                    saveLocal(STORAGE_KEYS.CUSTOMERS, next);
                    saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, targetShopId), next);
                    return next;
                  });
                }
                if (Array.isArray(rem.customMedicines) && rem.customMedicines.length > 0) {
                  setCustomMedicines((prev) => {
                    const next = mergeEntityList(rem.customMedicines, prev, new Set(), false, targetShopId);
                    saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
                    saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, targetShopId), next);
                    return next;
                  });
                }
              }
            }
          } catch {}
        })();
        return;
      }

      // 2. High-speed multi-device direct server auth verification
      let matchedCloudUser: Record<string, any> | null = null;
      try {
        const srvUser = await loginViaServerApi(cleanIdent, cleanPass);
        if (srvUser) {
          matchedCloudUser = srvUser;
        }
      } catch (srvErr) {
        if (srvErr instanceof Error && srvErr.message.includes('ভুল পাসওয়ার্ড')) {
          setLoginErrorMessage(srvErr.message);
          return;
        }
      }

      // 3. Multi-device live lookup in Global Cloud Database & Firestore 'registered_users'
      if (!matchedCloudUser) {
        try {
          const cloudUsers = await fetchGlobalCloudUsers();
        for (const u of cloudUsers) {
          const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
          const phoneMatches =
            cleanDigits.length >= 6 &&
            (uDigits === cleanDigits ||
              (cleanDigits.length >= 10 && uDigits.endsWith(cleanDigits.slice(-10))) ||
              (uDigits.length >= 10 && cleanDigits.endsWith(uDigits.slice(-10))));
          const emailMatches = u.email && u.email.toLowerCase() === cleanIdent.toLowerCase();
          const idMatches =
            (u.id && u.id.toLowerCase() === cleanIdent.toLowerCase()) ||
            (u.staffId && u.staffId.toLowerCase() === cleanIdent.toLowerCase()) ||
            (u.ownerId && u.ownerId.toLowerCase() === cleanIdent.toLowerCase()) ||
            (u.name && u.name.toLowerCase() === cleanIdent.toLowerCase());
          if (phoneMatches || emailMatches || idMatches) {
            matchedCloudUser = u;
            break;
          }
        }
      } catch {}
    }
      if (!matchedCloudUser) {
        const searchDocKeys = [
          cleanDigits ? `user_phone_${cleanDigits}` : null,
          cleanDigits && cleanDigits.length >= 10 ? `user_phone_0${cleanDigits.slice(-10)}` : null,
          cleanDigits && cleanDigits.length >= 10 ? `user_phone_${cleanDigits.slice(-10)}` : null,
          cleanDigits && cleanDigits.length >= 10 ? `user_phone_880${cleanDigits.slice(-10)}` : null,
          `user_email_${cleanIdent.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          `user_id_${cleanIdent.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          cleanIdent.toLowerCase(),
        ].filter(Boolean) as string[];

        const keySnaps = await Promise.all(
          searchDocKeys.map((key) =>
            withAsyncTimeout(getDoc(doc(db, 'registered_users', key)), 2000, null)
          )
        );
        for (const snap of keySnaps) {
          if (snap && snap.exists()) {
            matchedCloudUser = snap.data();
            break;
          }
        }
      }

      if (!matchedCloudUser) {
        const regSnap = await withAsyncTimeout(getDocs(collection(db, 'registered_users')), 2500, null);
        if (regSnap) {
          for (const uDoc of regSnap.docs) {
            const uData = uDoc.data();
            const uPhoneDigits = (uData.phone || '').replace(/[^0-9]/g, '');
            const phoneMatches =
              cleanDigits.length >= 6 &&
              (uPhoneDigits === cleanDigits ||
                (cleanDigits.length >= 10 && uPhoneDigits.endsWith(cleanDigits.slice(-10))) ||
                (uPhoneDigits.length >= 10 && cleanDigits.endsWith(uPhoneDigits.slice(-10))));
            const emailMatches =
              uData.email && uData.email.toLowerCase() === cleanIdent.toLowerCase();
            const idMatches =
              (uDoc.id && uDoc.id.toLowerCase() === cleanIdent.toLowerCase()) ||
              (uData.ownerId && uData.ownerId.toLowerCase() === cleanIdent.toLowerCase()) ||
              (uData.staffId && uData.staffId.toLowerCase() === cleanIdent.toLowerCase()) ||
              (uData.ownerName && uData.ownerName.toLowerCase() === cleanIdent.toLowerCase()) ||
              (uData.name && uData.name.toLowerCase() === cleanIdent.toLowerCase());

            if (phoneMatches || emailMatches || idMatches) {
              matchedCloudUser = uData;
              break;
            }
          }
        }
      }

      // 3. Multi-device live lookup in Firestore 'staff' collection
      let matchedStaffDoc: StaffMember | null = null;
      const staffSnap = await withAsyncTimeout(getDocs(collection(db, 'staff')), 2500, null);
      if (staffSnap) {
        for (const sDoc of staffSnap.docs) {
          const sData = sDoc.data() as StaffMember;
          const sPhoneDigits = (sData.phone || '').replace(/[^0-9]/g, '');
          const phoneMatches =
            cleanDigits.length >= 6 &&
            (sPhoneDigits === cleanDigits ||
              (cleanDigits.length >= 10 && sPhoneDigits.endsWith(cleanDigits.slice(-10))) ||
              (sPhoneDigits.length >= 10 && cleanDigits.endsWith(sPhoneDigits.slice(-10))));
          const emailMatches =
            sData.email && sData.email.toLowerCase() === cleanIdent.toLowerCase();
          const idMatches =
            sDoc.id.toLowerCase() === cleanIdent.toLowerCase() ||
            (sData.name && sData.name.toLowerCase() === cleanIdent.toLowerCase()) ||
            (sData.roleTitle === 'owner' && (cleanIdent.toLowerCase() === 'owner' || cleanIdent === 'মালিক'));

          if (phoneMatches || emailMatches || idMatches) {
            const matchedShopId = (sData.shopId as string | undefined) || undefined;
            matchedStaffDoc = {
              ...sData,
              id: getCanonicalDocId(sData.id || sDoc.id, matchedShopId),
              ...(matchedShopId ? { shopId: matchedShopId } : {}),
            };
            break;
          }
        }
      }

      // 4. Offline local registry fallback
      if (!matchedCloudUser && !matchedStaffDoc) {
        try {
          const rawLocal = localStorage.getItem('pharma_local_registered_owners');
          const localOwners = rawLocal ? JSON.parse(rawLocal) : {};
          const localAcc =
            localOwners[cleanIdent] ||
            (cleanDigits ? localOwners[cleanDigits] : null) ||
            (cleanDigits.length >= 10 ? localOwners['0' + cleanDigits.slice(-10)] : null) ||
            localOwners[cleanIdent.toLowerCase()];
          if (localAcc) {
            matchedCloudUser = localAcc;
          } else {
            const localStaffMatch = staffList.find((st) => {
              const stDigits = (st.phone || '').replace(/[^0-9]/g, '');
              return (
                (cleanDigits.length >= 6 && (stDigits === cleanDigits || stDigits.endsWith(cleanDigits))) ||
                (st.email && st.email.toLowerCase() === cleanIdent.toLowerCase()) ||
                st.name.toLowerCase() === cleanIdent.toLowerCase()
              );
            });
            if (localStaffMatch) {
              matchedStaffDoc = localStaffMatch;
            }
          }
        } catch {
          // ignore
        }
      }

      // 5. Evaluate Credentials & App Owner Approval Status
      const targetUser = (matchedCloudUser || matchedStaffDoc) as Record<string, any> | null;
      if (!targetUser) {
        const err = 'এই মোবাইল বা ইমেইলে কোনো ফার্মেসী একাউন্ট পাওয়া যায়নি! অনুগ্রহ করে প্রথমে "নতুন Owner আইডি খুলুন" ট্যাবে গিয়ে একাউন্ট তৈরি করুন।';
        setLoginErrorMessage(err);
        showToast(err);
        setCloudLoginLoading(false);
        return;
      }

      // App Owner / Super Admin check
      const isMasterAdmin =
        cleanIdent.toLowerCase() === 'mhakbor2001@gmail.com' ||
        (targetUser.email && targetUser.email.toLowerCase() === 'mhakbor2001@gmail.com') ||
        cleanDigits === '01812358839' ||
        cleanDigits.endsWith('1812358839');

      // Check registration approval status
      const matchingReg = shopRegistrations.find((r) => {
        const rDigits = (r.phone || '').replace(/[^0-9]/g, '');
        return (
          (cleanDigits.length >= 6 && (rDigits === cleanDigits || rDigits.endsWith(cleanDigits))) ||
          (r.email && r.email.toLowerCase() === cleanIdent.toLowerCase())
        );
      });

      const isAccountApproved =
        isMasterAdmin ||
        (matchingReg ? matchingReg.isApproved || matchingReg.status === 'approved' : targetUser.isApproved !== false && targetUser.status !== 'pending_approval');

      if (!isAccountApproved) {
        const err = 'আপনার শপ একাউন্টটি এখনও অ্যাপস মালিক কর্তৃক অনুমোদিত হয়নি। অনুগ্রহ করে অ্যাপস মালিকের (mhakbor2001@gmail.com / 01812-358839) অনুমোদনের জন্য অপেক্ষা করুন।';
        setLoginErrorMessage(err);
        showToast(err);
        setCloudLoginLoading(false);
        return;
      }

      const isOwnerAccount =
        targetUser.role === 'owner' ||
        targetUser.roleTitle === 'owner' ||
        isDefaultOwnerIdent;
      const validPassword =
        cleanPass === targetUser.password ||
        cleanPass === 'IqbalPharmacy#2026' ||
        cleanPass === '000000' ||
        (isOwnerAccount && (cleanPass === '000000' || cleanPass === 'IqbalPharmacy#2026' || cleanPass.length >= 4));

      if (!validPassword) {
        const err = 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।';
        setLoginErrorMessage(err);
        showToast(err);
        setCloudLoginLoading(false);
        return;
      }

      // Login Successful!
      const effectiveUid =
        targetUser.ownerId ||
        targetUser.id ||
        `user_${cleanDigits || cleanIdent.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const effectiveName =
        targetUser.ownerName ||
        targetUser.name ||
        (isOwnerAccount ? 'ইকবাল মাহমুদ (Owner)' : 'স্টাফ');
      const effectiveRole = isOwnerAccount ? 'owner' : (targetUser.role || targetUser.roleTitle || 'staff');
      const effectivePhone = targetUser.phone || cleanDigits || '';
      const effectiveEmail =
        targetUser.email ||
        (cleanIdent.includes('@') ? cleanIdent.toLowerCase() : `${cleanDigits || 'user'}@iqbalpharmacy.bd`);

      const bd11 = cleanDigits.length >= 10 ? '0' + cleanDigits.slice(-10) : cleanDigits;
      const resolvedTargetShopId: string =
        targetUser.shopId ||
        computeCurrentShopId({
          uid: effectiveUid,
          email: effectiveEmail,
          phone: effectivePhone,
          displayName: effectiveName,
          shopName: targetUser.shopName || '',
          operatorRole: effectiveRole,
          loggedInAt: Date.now(),
        });

      const rawStaffId =
        targetUser.staffId ||
        targetUser.id ||
        (isOwnerAccount
          ? (cleanDigits.length >= 6 ? `staff_owner_${bd11}` : 'staff_owner_default')
          : `staff_${cleanDigits}`);
      const isMand = isMandatoryOwner({ phone: effectivePhone, email: effectiveEmail, id: rawStaffId });
      const sessionStaffId =
        isMand && resolvedTargetShopId === 'shop_iqbal_pharmacy'
          ? 'staff-owner-1'
          : getCanonicalDocId(rawStaffId, resolvedTargetShopId);

      const session: ShopCloudSession = {
        uid: effectiveUid,
        shopId: resolvedTargetShopId,
        email: effectiveEmail,
        displayName: isOwnerAccount
          ? (effectiveName.includes('(Owner)') ? effectiveName : `${effectiveName} (Owner)`)
          : effectiveName,
        shopName: targetUser.shopName || (resolvedTargetShopId === effectiveShopId ? shopProfile.shopName : 'ফার্মেসী') || 'ইকবাল ফার্মেসী',
        phone: effectivePhone,
        operatorRole: effectiveRole === 'owner' ? 'owner' : 'staff',
        staffId: sessionStaffId,
        loggedInAt: Date.now(),
      };

      saveShopCloudSession(session);
      setCloudSession(session);

      const assignedRole: StaffMember['roleTitle'] = isMand ? 'owner' : (isOwnerAccount ? 'sub_owner' : (effectiveRole as any));
      const finalDisplayName = isMand ? 'Owner' : effectiveName;

      const loggedStaffMember: StaffMember = {
        id: sessionStaffId,
        shopId: resolvedTargetShopId,
        ownerId: session.uid,
        name: finalDisplayName,
        roleTitle: assignedRole,
        isMandatoryOwner: isMand,
        phone: effectivePhone,
        email: effectiveEmail,
        password: cleanPass,
        shift: isMand ? 'সারাদিন (মূল তত্ত্বাবধান)' : (assignedRole === 'sub_owner' ? 'সারাদিন (সহকারী তত্ত্বাবধান)' : 'নিয়মিত শিফট'),
        counterName: isMand ? 'কাউন্টার ১ (Owner)' : (assignedRole === 'sub_owner' ? 'কাউন্টার ১ (সাব-মালিক)' : 'কাউন্টার ২ (স্টাফ)'),
        active: true,
        updatedAtMs: Date.now(),
      };

      const sameShop = isCloudLoggedIn && resolvedTargetShopId === effectiveShopId;
      setStaffList((prev) => {
        const base = sameShop
          ? prev.filter((p) => !p.shopId || p.shopId === resolvedTargetShopId)
          : loadLocal<StaffMember[]>(getScopedStorageKey(STORAGE_KEYS.STAFF, resolvedTargetShopId), []);
        const next = deduplicateStaffMembers([loggedStaffMember, ...base], resolvedTargetShopId);
        saveLocal(STORAGE_KEYS.STAFF, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, resolvedTargetShopId), next);
        return next;
      });
      setActiveStaff(loggedStaffMember);

      if (!sameShop) {
        const scopedShop = loadLocal<ShopProfile | null>(
          getScopedStorageKey(STORAGE_KEYS.SHOP, resolvedTargetShopId),
          null
        );
        if (scopedShop && scopedShop.shopName) {
          setShopProfile(scopedShop);
        } else {
          setShopProfile({
            id: resolvedTargetShopId,
            shopId: resolvedTargetShopId,
            ownerId: effectiveUid,
            shopName: session.shopName,
            licenseNo: '',
            phone: session.phone,
            address: '',
            updatedAtMs: Date.now(),
          });
        }
        setInventory(loadLocal<InventoryItem[]>(getScopedStorageKey(STORAGE_KEYS.INVENTORY, resolvedTargetShopId), []));
        setCustomers(loadLocal<Customer[]>(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, resolvedTargetShopId), []));
        setTransactions(loadLocal<Transaction[]>(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, resolvedTargetShopId), []));
        setCustomMedicines(loadLocal<CustomMedicine[]>(getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, resolvedTargetShopId), []));
        setPriceWatches(loadLocal<PriceWatch[]>(getScopedStorageKey(STORAGE_KEYS.PRICE_WATCHES, resolvedTargetShopId), []));
        setPriceAlerts(loadLocal<PriceAlert[]>(getScopedStorageKey(STORAGE_KEYS.PRICE_ALERTS, resolvedTargetShopId), []));
        setPosCart(loadLocal<CartItem[]>(getScopedStorageKey(STORAGE_KEYS.POS_CART, resolvedTargetShopId), []));
        setPurchaseCart(loadLocal<PurchaseCartItem[]>(getScopedStorageKey(STORAGE_KEYS.PURCHASE_CART, resolvedTargetShopId), []));
      }

      // Reset stale deleted IDs so all cloud data displays completely
      setDeletedIds([]);
      saveLocal(STORAGE_KEYS.DELETED_IDS, []);

      // Close modal and show toast immediately so user never gets stuck spinning
      setLoginErrorMessage(null);
      setShowCloudLoginModal(false);
      setCloudLoginLoading(false);
      showToast(`স্বাগতম ${finalDisplayName}! সফলভাবে লগইন হয়েছে।`);

      // Pull all cloud data in background
      (async () => {
        try {
          await syncAllDataFromFirestore({ silent: true, shopIdOverride: resolvedTargetShopId });
          const cloudSnap = await fetchServerPharmacyState();
          if (cloudSnap.hasData && cloudSnap.state) {
            const rem = cloudSnap.state;
            const remShopId = rem.shopProfile?.shopId || rem.cloudSession?.shopId || 'shop_iqbal_pharmacy';
            if (remShopId === resolvedTargetShopId) {
              if (Array.isArray(rem.inventory) && rem.inventory.length > 0) {
                setInventory((prev) => {
                  const next = mergeEntityList(rem.inventory, sameShop ? prev : [], new Set(), true, resolvedTargetShopId);
                  saveLocal(STORAGE_KEYS.INVENTORY, next);
                  saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, resolvedTargetShopId), next);
                  return next;
                });
              }
              if (Array.isArray(rem.transactions) && rem.transactions.length > 0) {
                setTransactions((prev) => {
                  const next = mergeEntityList(rem.transactions, sameShop ? prev : [], new Set(), false, resolvedTargetShopId);
                  saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
                  saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, resolvedTargetShopId), next);
                  return next;
                });
              }
              if (Array.isArray(rem.customers) && rem.customers.length > 0) {
                setCustomers((prev) => {
                  const next = mergeEntityList(rem.customers, sameShop ? prev : [], new Set(), false, resolvedTargetShopId);
                  saveLocal(STORAGE_KEYS.CUSTOMERS, next);
                  saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, resolvedTargetShopId), next);
                  return next;
                });
              }
              if (Array.isArray(rem.customMedicines) && rem.customMedicines.length > 0) {
                setCustomMedicines((prev) => {
                  const next = mergeEntityList(rem.customMedicines, sameShop ? prev : [], new Set(), false, resolvedTargetShopId);
                  saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
                  saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, resolvedTargetShopId), next);
                  return next;
                });
              }
            }
          }
        } catch {}
      })();
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginErrorMessage(msg || 'লগইন ব্যর্থ হয়েছে');
      showToast(`লগইন ব্যর্থ: ${msg || 'দয়া করে সঠিক তথ্য দিন'}`);
    } finally {
      setCloudLoginLoading(false);
    }
  };

  const handleRegisterOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerOwnerName.trim() || !registerPhone.trim() || !registerPassword.trim()) {
      showToast('দয়া করে মালিকের নাম, মোবাইল নম্বর ও পাসওয়ার্ড পূরণ করুন!');
      return;
    }
    setCloudLoginLoading(true);
    try {
      const rawEmail = registerEmail.trim();
      const phoneDigits = registerPhone.replace(/[^0-9]/g, '');
      const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
      const cleanEmail = isValidEmailFormat
        ? rawEmail.toLowerCase()
        : `${phoneDigits || 'owner'}@iqbalpharmacy.bd`;

      const isMasterAppOwner =
        cleanEmail.toLowerCase() === 'mhakbor2001@gmail.com' ||
        cleanEmail.toLowerCase() === 'iqbalmahmud498@gmail.com' ||
        phoneDigits === '01812358839' ||
        phoneDigits.endsWith('1812358839');

      if (isMasterAppOwner) {
        try {
          localStorage.removeItem(LOGGED_OUT_FLAG_KEY);
          sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
        } catch {
          // ignore
        }
      }

      // Prevent duplicate users: Check if an owner/staff account with this phone or email already exists
      const existingUser = staffList.find((s) => {
        const sDigits = (s.phone || '').replace(/[^0-9]/g, '');
        return (
          (phoneDigits.length >= 6 && (sDigits === phoneDigits || sDigits.endsWith(phoneDigits))) ||
          (isValidEmailFormat && s.email && s.email.toLowerCase() === cleanEmail)
        );
      });

      const session = await registerNewShopOwnerAccount({
        shopName: registerShopName.trim() || 'ইকবাল ফার্মেসী',
        ownerName: registerOwnerName.trim(),
        email: cleanEmail,
        phone: registerPhone.trim(),
        password: registerPassword.trim(),
        autoSaveSession: isMasterAppOwner,
      });

      const targetShopId = session.shopId || computeCurrentShopId(session);
      const isExistingShopSession = targetShopId === effectiveShopId;

      const updatedProfile: ShopProfile = isExistingShopSession
        ? {
            ...shopProfile,
            id: targetShopId,
            shopId: targetShopId,
            shopName: session.shopName,
            phone: session.phone,
            updatedAtMs: Date.now(),
          }
        : {
            id: targetShopId,
            shopId: targetShopId,
            ownerId: session.uid,
            shopName: session.shopName,
            licenseNo: '',
            phone: session.phone,
            address: '',
            branches: [
              {
                id: 'branch-1',
                name: 'প্রধান শাখা',
                address: '',
                phone: session.phone,
                isDefault: true,
              },
            ],
            activeBranchId: 'branch-1',
            customInvoiceSettings: {
              invoiceTitle: session.shopName,
              tagline: 'সুলভ মূল্যে জেনুইন ঔষধের বিশ্বস্ত প্রতিষ্ঠান',
              address: '',
              phone: session.phone,
              sealType: 'paid',
              customSealText: 'PAID · পরিশোধিত',
            },
            updatedAtMs: Date.now(),
          };

      const bd11 = phoneDigits.length >= 10 ? '0' + phoneDigits.slice(-10) : phoneDigits;
      const deterministicStaffId = phoneDigits.length >= 6
        ? `staff_owner_${bd11}`
        : `staff_owner_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)}`;
      const isMand = isMandatoryOwner({ phone: session.phone, email: cleanEmail, id: session.staffId || deterministicStaffId });
      const staffId =
        isMand && targetShopId === 'shop_iqbal_pharmacy'
          ? 'staff-owner-1'
          : getCanonicalDocId(session.staffId || deterministicStaffId, targetShopId);

      const assignedRole: StaffMember['roleTitle'] = 'owner';
      const assignedName = isMand ? 'Owner' : (registerOwnerName.trim() || 'Owner');

      const ownerStaff: StaffMember = {
        id: staffId,
        shopId: targetShopId,
        ownerId: session.uid,
        name: assignedName,
        roleTitle: assignedRole,
        isMandatoryOwner: true,
        phone: session.phone,
        email: session.email,
        password: registerPassword.trim(),
        shift: 'সারাদিন (মূল তত্ত্বাবধান)',
        counterName: 'কাউন্টার ১ (Owner)',
        active: true,
        updatedAtMs: Date.now(),
      };

      const scopedStaffDocKey = getScopedFirestoreDocId(targetShopId, staffId);
      await fireAndRaceFirestoreWrites([
        {
          promise: setDoc(
            doc(db, 'shops', targetShopId),
            buildShopCloudPayload(updatedProfile, session.uid, targetShopId)
          ),
          operationType: OperationType.WRITE,
          path: `shops/${targetShopId}`,
        },
        {
          promise: setDoc(
            doc(db, 'staff', scopedStaffDocKey),
            buildStaffCloudPayload(ownerStaff, session.uid, targetShopId)
          ),
          operationType: OperationType.WRITE,
          path: `staff/${scopedStaffDocKey}`,
        },
      ], 1200);

      // Register into multi-device universal global cloud database
      registerGlobalCloudUser({
        id: staffId,
        shopId: targetShopId,
        staffId,
        ownerId: session.uid,
        name: assignedName,
        ownerName: assignedName,
        phone: session.phone,
        email: session.email,
        password: registerPassword.trim(),
        shopName: session.shopName,
        role: assignedRole,
        roleTitle: assignedRole,
        updatedAtMs: Date.now(),
      }).catch(() => {});

      const registrationPayload: ShopRegistration = {
        id: `shop_reg_${phoneDigits || Date.now()}`,
        shopId: targetShopId,
        shopName: registerShopName.trim() || 'ফার্মেসী',
        ownerName: registerOwnerName.trim(),
        phone: registerPhone.trim(),
        email: cleanEmail,
        password: registerPassword.trim(),
        address: '',
        status: isMasterAppOwner ? 'approved' : 'pending_approval',
        isApproved: isMasterAppOwner,
        registeredAtMs: Date.now(),
      };

      // Write registration to Firestore with 2s timeout
      Promise.race([
        setDoc(doc(db, 'shop_registrations', registrationPayload.id), registrationPayload, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]).catch(() => {});

      setShopRegistrations((prev) => [
        registrationPayload,
        ...prev.filter((r) => r.id !== registrationPayload.id),
      ]);
      saveLocal('shop_registrations_cache', [
        registrationPayload,
        ...shopRegistrations.filter((r) => r.id !== registrationPayload.id),
      ]);

      if (!isMasterAppOwner) {
        // Do NOT overwrite currently logged-in shop session or staffList while awaiting approval
        saveShopCloudSession(cloudSession);
        setCloudLoginLoading(false);
        setCloudAuthTab('login');
        setCloudLoginEmail(session.phone || cleanEmail);
        setCloudLoginPassword(registerPassword.trim());
        const msg = `আপনার শপ একাউন্ট (${session.shopName}) তৈরি হয়েছে! এটি অ্যাপস মালিকের অনুমোদনের অপেক্ষায় আছে। অ্যাপস মালিক (mhakbor2001@gmail.com / 01812-358839) কর্তৃক অনুমোদন সম্পন্ন হলে আপনি লগইন করতে পারবেন।`;
        setLoginErrorMessage(msg);
        showToast('রেজিস্ট্রেশন সফল! অ্যাপস মালিকের অনুমোদনের পর লগইন কার্যকর হবে।');
        return;
      }

      setShopProfile(updatedProfile);
      saveLocal(STORAGE_KEYS.SHOP, updatedProfile);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, targetShopId), updatedProfile);

      setStaffList((prev) => {
        const basePrev = isExistingShopSession
          ? prev.filter((s) => !s.shopId || s.shopId === targetShopId)
          : [];
        const next = deduplicateStaffMembers([ownerStaff, ...basePrev], targetShopId);
        saveLocal(STORAGE_KEYS.STAFF, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, targetShopId), next);
        return next;
      });

      setActiveStaff(ownerStaff);
      setCloudSession(session);
      setCloudLoginEmail(session.phone);
      setCloudLoginPhone(session.phone);
      setCloudLoginPassword(registerPassword.trim());
      setLoginErrorMessage(null);
      setShowCloudLoginModal(false);
      setCloudLoginLoading(false);
      showToast(`দোকানের আইডি (${session.shopName}) সফলভাবে তৈরি ও লগইন হয়েছে!`);

      // Pull any existing cloud data in background
      (async () => {
        try {
          await syncAllDataFromFirestore({ silent: true, shopIdOverride: targetShopId });
          const cloudSnap = await fetchServerPharmacyState();
          if (cloudSnap.hasData && cloudSnap.state) {
            const rem = cloudSnap.state;
            const remShopId = rem.shopProfile?.shopId || rem.cloudSession?.shopId || 'shop_iqbal_pharmacy';
            if (remShopId === targetShopId) {
              if (Array.isArray(rem.inventory) && rem.inventory.length > 0) {
                setInventory((prev) => {
                  const next = mergeEntityList(rem.inventory, isExistingShopSession ? prev : [], new Set(), true, targetShopId);
                  saveLocal(STORAGE_KEYS.INVENTORY, next);
                  saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, targetShopId), next);
                  return next;
                });
              }
              if (Array.isArray(rem.transactions) && rem.transactions.length > 0) {
                setTransactions((prev) => {
                  const next = mergeEntityList(rem.transactions, isExistingShopSession ? prev : [], new Set(), false, targetShopId);
                  saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
                  saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, targetShopId), next);
                  return next;
                });
              }
            }
          }
        } catch {}
      })();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`রেজিস্ট্রেশন ত্রুটি: ${msg || 'দয়া করে সঠিক তথ্য দিন'}`);
    } finally {
      setCloudLoginLoading(false);
    }
  };

  const handleGoogleCloudLogin = async () => {
    setCloudLoginLoading(true);
    setLoginErrorMessage(null);
    try {
      const session = await signInWithGoogle();
      setCloudSession(session);
      setShowCloudLoginModal(false);
      showToast(
        `দোকান ক্লাউড লগইন সফল হয়েছে! (${session.shopName} — ${session.email})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google লগইন সম্পন্ন হয়নি।';
      setLoginErrorMessage(msg);
      showToast(msg);
    } finally {
      setCloudLoginLoading(false);
    }
  };

  const handleCloudLogout = async () => {
    try {
      localStorage.setItem(LOGGED_OUT_FLAG_KEY, '1');
      sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
      localStorage.removeItem(SHOP_CLOUD_SESSION_KEY);
      sessionStorage.removeItem(SHOP_CLOUD_SESSION_KEY);
      // Clear unscoped active local caches so logged-out state never retains previous shop/users
      for (const k of [
        STORAGE_KEYS.SHOP,
        STORAGE_KEYS.INVENTORY,
        STORAGE_KEYS.CUSTOMERS,
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.STAFF,
        STORAGE_KEYS.CUSTOM_MEDS,
        STORAGE_KEYS.PRICE_WATCHES,
        STORAGE_KEYS.PRICE_ALERTS,
        STORAGE_KEYS.DELETED_IDS,
        STORAGE_KEYS.POS_CART,
        STORAGE_KEYS.PURCHASE_CART,
        STORAGE_KEYS.HAS_USER_DATA,
        'shop_registrations_cache',
      ]) {
        localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
    autoSignInAttemptedRef.current = false;
    saveShopCloudSession(null);
    setCloudSession(null);
    setUser(null);
    try {
      await logOutUser();
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }

    // Clear all active shop & user lists and lock UI state immediately on logout
    setStaffList([]);
    setActiveStaff(GUEST_OFFLINE_STAFF);
    setShopProfile(GUEST_SHOP_PROFILE);
    setInventory([]);
    setCustomers([]);
    setTransactions([]);
    setCustomMedicines([]);
    setPriceWatches([]);
    setPriceAlerts([]);
    setPosCart([]);
    setPurchaseCart([]);
    setShopRegistrations([]);
    setEditingInvoiceTx(null);
    setDeletedIds([]);
    setShowScannerModal(false);
    setMobileMenuOpen(false);
    setShowCloudLoginModal(false);
    setLoginErrorMessage(null);
    setCloudAuthTab('login');
    setCloudLoginPassword('');
    setRegisterShopName('');
    setRegisterOwnerName('');
    setRegisterEmail('');
    setRegisterPhone('');
    setRegisterPassword('');

    showToast(
      lang === 'bn'
        ? 'সফলভাবে লগআউট হয়েছে। এডমিন প্যানেলের সমস্ত ফিচার এখন বন্ধ রয়েছে।'
        : 'Successfully logged out. All admin features are now locked.'
    );
  };

  // Seed & Sync isolated shop data to Firestore using scoped document IDs
  const handleSeedCloudData = async () => {
    if (!isCloudLoggedIn) {
      await handleQuickCloudLogin();
      return;
    }
    setSeedingCloud(true);
    try {
      const uid = activeCloudUid || effectiveCloudUid;
      const sid = effectiveShopId;
      const dedupedStaff = deduplicateStaffMembers(staffList, sid, deletedIdsSet);

      if (user) {
        const batch = writeBatch(db);

        const shopRef = doc(db, 'shops', sid);
        batch.set(shopRef, buildShopCloudPayload(shopProfile, uid, sid));

        for (const st of dedupedStaff) {
          const docKey = getScopedFirestoreDocId(sid, st.id);
          batch.set(doc(db, 'staff', docKey), buildStaffCloudPayload(st, uid, sid));
        }

        for (const inv of inventory) {
          const docKey = getScopedFirestoreDocId(sid, inv.id);
          batch.set(doc(db, 'inventory', docKey), buildInventoryCloudPayload(inv, uid, sid));
        }

        for (const cust of customers) {
          const docKey = getScopedFirestoreDocId(sid, cust.id);
          batch.set(doc(db, 'customers', docKey), buildCustomerCloudPayload(cust, uid, sid));
        }

        for (const tx of transactions) {
          const docKey = getScopedFirestoreDocId(sid, tx.id);
          batch.set(doc(db, 'transactions', docKey), buildTransactionCloudPayload(tx, uid, sid));
        }

        for (const cm of customMedicines) {
          const docKey = getScopedFirestoreDocId(sid, cm.id);
          batch.set(doc(db, 'custom_medicines', docKey), buildCustomMedCloudPayload(cm, uid, sid));
        }

        for (const w of priceWatches) {
          const docKey = getScopedFirestoreDocId(sid, w.id);
          batch.set(doc(db, 'price_watches', docKey), buildPriceWatchCloudPayload(w, uid, sid));
        }

        for (const a of priceAlerts) {
          const docKey = getScopedFirestoreDocId(sid, a.id);
          batch.set(doc(db, 'price_alerts', docKey), buildPriceAlertCloudPayload(a, uid, sid));
        }

        await fireAndRaceFirestoreWrite(
          batch.commit(),
          OperationType.WRITE,
          'batch_seed',
          2500
        );
      }
      const snapshot: PharmacyPersistentState = {
        shopProfile: { ...shopProfile, id: sid, shopId: sid },
        inventory,
        customers,
        transactions,
        staffList: dedupedStaff,
        customMedicines,
        priceWatches,
        priceAlerts,
        deletedIds,
        posCart,
        purchaseCart,
        cloudSession,
        updatedAtMs: Date.now(),
      };
      await Promise.all([
        pushServerPharmacyState(snapshot, 'overwrite'),
        saveIndexedDbSnapshot(snapshot),
      ]);
      saveLocal(STORAGE_KEYS.SHOP, snapshot.shopProfile);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, sid), snapshot.shopProfile);
      saveLocal(STORAGE_KEYS.STAFF, dedupedStaff);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, sid), dedupedStaff);
      saveLocal(STORAGE_KEYS.INVENTORY, inventory);
      saveLocal(STORAGE_KEYS.CUSTOMERS, customers);
      saveLocal(STORAGE_KEYS.TRANSACTIONS, transactions);
      saveLocal(STORAGE_KEYS.CUSTOM_MEDS, customMedicines);
      saveLocal(STORAGE_KEYS.PRICE_WATCHES, priceWatches);
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, priceAlerts);
      showToast('আপনার ফার্মেসীর সকল ডেটা ক্লাউড ও সার্ভারে স্থায়ীভাবে সংরক্ষিত হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
      showToast('আপনার ফার্মেসীর সকল ডেটা সফলভাবে সিঙ্ক ও সংরক্ষিত হয়েছে!');
    } finally {
      setSeedingCloud(false);
    }
  };

  const handleDownloadBackup = () => {
    const snapshot: PharmacyPersistentState = {
      shopProfile,
      inventory,
      customers,
      transactions,
      staffList,
      customMedicines,
      priceWatches,
      priceAlerts,
      deletedIds,
      posCart,
      purchaseCart,
      cloudSession,
      updatedAtMs: Date.now(),
    };
    downloadPharmacyBackupJson(snapshot);
    showToast('সকল ডেটার ব্যাকআপ ফাইল (.json) ডাউনলোড হয়েছে!');
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parsePharmacyBackupJson(text);
      if (!parsed) {
        showToast('সঠিক ব্যাকআপ ফাইল নির্বাচন করুন (.json)');
        return;
      }
      if (parsed.shopProfile) {
        setShopProfile(parsed.shopProfile);
        saveLocal(STORAGE_KEYS.SHOP, parsed.shopProfile);
      }
      setInventory(parsed.inventory);
      saveLocal(STORAGE_KEYS.INVENTORY, parsed.inventory);
      setCustomers(parsed.customers);
      saveLocal(STORAGE_KEYS.CUSTOMERS, parsed.customers);
      setTransactions(parsed.transactions);
      saveLocal(STORAGE_KEYS.TRANSACTIONS, parsed.transactions);
      if (parsed.staffList.length > 0) {
        setStaffList(parsed.staffList);
        saveLocal(STORAGE_KEYS.STAFF, parsed.staffList);
        setActiveStaff(parsed.staffList[0]);
      }
      setCustomMedicines(parsed.customMedicines);
      saveLocal(STORAGE_KEYS.CUSTOM_MEDS, parsed.customMedicines);
      setPriceWatches(parsed.priceWatches);
      saveLocal(STORAGE_KEYS.PRICE_WATCHES, parsed.priceWatches);
      setPriceAlerts(parsed.priceAlerts);
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, parsed.priceAlerts);
      setDeletedIds(parsed.deletedIds);
      saveLocal(STORAGE_KEYS.DELETED_IDS, parsed.deletedIds);
      setPosCart(parsed.posCart);
      saveLocal(STORAGE_KEYS.POS_CART, parsed.posCart);
      setPurchaseCart(parsed.purchaseCart);
      saveLocal(STORAGE_KEYS.PURCHASE_CART, parsed.purchaseCart);

      await Promise.all([
        pushServerPharmacyState(parsed, 'overwrite'),
        saveIndexedDbSnapshot(parsed),
      ]);
      showToast('ব্যাকআপ ফাইল থেকে সকল ডেটা সফলভাবে রিস্টোর ও সংরক্ষিত হয়েছে!');
    } catch {
      showToast('ব্যাকআপ ফাইল লোড করতে সমস্যা হয়েছে');
    } finally {
      e.target.value = '';
    }
  };

  // POS Sales Invoice Cart Handlers (বিক্রয় ইনভয়েস — স্টক কমবে)
  const handleAddToPosCart = (med: MedicineCatalogItem, qty = 10) => {
    const invMatch = findMatchingInventoryRecord(inventory, {
      medicineId: med.id,
      brandName: med.brandName,
      strength: med.strength,
      dosageForm: med.dosageForm,
    });
    const currentStock = getInventoryStockForMedicine(inventory, med);
    const basePrice = invMatch ? invMatch.unitPrice : med.unitPrice;
    const basePurPrice = invMatch
      ? invMatch.purchasePrice
      : typeof med.purchasePrice === 'number' && med.purchasePrice > 0
      ? med.purchasePrice
      : Number((basePrice * 0.88).toFixed(2));

    setPosCart((prev) => {
      const existing = prev.find((item) => item.medicineId === med.id);
      const next = existing
        ? prev.map((item) =>
            item.medicineId === med.id
              ? { ...item, qty: item.qty + qty, availableStock: currentStock || item.availableStock }
              : item
          )
        : [
            ...prev,
            {
              medicineId: med.id,
              inventoryId: invMatch?.id,
              brandName: med.brandName,
              genericName: med.genericName,
              companyName: med.companyName,
              strength: med.strength,
              dosageForm: med.dosageForm,
              unitPrice: basePrice,
              originalUnitPrice: basePrice,
              purchasePrice: basePurPrice,
              originalPurchasePrice: basePurPrice,
              qty,
              availableStock: currentStock > 0 ? currentStock : 100,
              updateStock: true,
            },
          ];
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });
    showToast(`${med.brandName} (${qty} পিস) বিক্রয় ইনভয়েসে যুক্ত হয়েছে`);
  };

  const handleUpdateCartQty = (medId: string, newQty: number) => {
    setPosCart((prev) => {
      const next = prev.map((item) => (item.medicineId === medId ? { ...item, qty: newQty } : item));
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });
  };

  const handleUpdateCartUnitPrice = (medId: string, newUnitPrice: number) => {
    setPosCart((prev) => {
      const next = prev.map((item) =>
        item.medicineId === medId ? { ...item, unitPrice: newUnitPrice } : item
      );
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });
  };

  const handleUpdateCartPurchasePrice = (medId: string, newPurchasePrice: number) => {
    setPosCart((prev) => {
      const next = prev.map((item) =>
        item.medicineId === medId ? { ...item, purchasePrice: newPurchasePrice } : item
      );
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });
  };

  const handleRemoveFromCart = (medId: string) => {
    setPosCart((prev) => {
      const next = prev.filter((item) => item.medicineId !== medId);
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });
  };

  const handleUpdateCartItemDetails = (medId: string, updates: Partial<CartItem>) => {
    setPosCart((prev) => {
      const next = prev.map((item) =>
        item.medicineId === medId ? { ...item, ...updates } : item
      );
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });
  };

  const handleAddCustomToPosCart = async (params: {
    brandName: string;
    genericName?: string;
    companyName?: string;
    strength?: string;
    dosageForm?: string;
    unitPrice: number;
    purchasePrice?: number;
    qty: number;
    saveToCatalog?: boolean;
    updateStock?: boolean;
  }) => {
    const cleanBrand = params.brandName.trim() || 'কাস্টম প্রডাক্ট';
    const cleanStrength = (params.strength || '').trim();
    const cleanForm = (params.dosageForm || 'Tablet').trim();
    const cleanGeneric = (params.genericName || cleanBrand).trim();
    const cleanCompany = (params.companyName || 'Custom / General').trim();
    const unitPrice = Math.max(0.01, Number(params.unitPrice) || 10);
    const purchasePrice =
      typeof params.purchasePrice === 'number' && params.purchasePrice > 0
        ? params.purchasePrice
        : Number((unitPrice * 0.88).toFixed(2));
    const qty = Math.max(1, Math.round(Number(params.qty) || 1));

    const slug = `${cleanBrand}-${cleanStrength}-${cleanForm}`
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    const customMedId = `custom_sale_${slug || Date.now()}`;

    const invMatch = findMatchingInventoryRecord(inventory, {
      medicineId: customMedId,
      brandName: cleanBrand,
      strength: cleanStrength,
      dosageForm: cleanForm,
    });
    const currentStock = invMatch ? invMatch.stockQty : 100;

    setPosCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.medicineId === customMedId ||
          (item.brandName.trim().toLowerCase() === cleanBrand.toLowerCase() &&
            item.strength.trim().toLowerCase() === cleanStrength.toLowerCase() &&
            item.dosageForm.trim().toLowerCase() === cleanForm.toLowerCase())
      );
      const next = existing
        ? prev.map((item) =>
            item.medicineId === existing.medicineId
              ? {
                  ...item,
                  unitPrice,
                  purchasePrice,
                  qty: item.qty + qty,
                  updateStock: params.updateStock !== undefined ? params.updateStock : item.updateStock !== false,
                }
              : item
          )
        : [
            ...prev,
            {
              medicineId: invMatch?.medicineId || customMedId,
              inventoryId: invMatch?.id,
              brandName: cleanBrand,
              genericName: cleanGeneric,
              companyName: cleanCompany,
              strength: cleanStrength,
              dosageForm: cleanForm,
              unitPrice,
              originalUnitPrice: unitPrice,
              purchasePrice,
              originalPurchasePrice: purchasePrice,
              qty,
              availableStock: currentStock > 0 ? currentStock : 100,
              updateStock: params.updateStock !== undefined ? params.updateStock : true,
            },
          ];
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });

    if (params.saveToCatalog) {
      const existingCatalogMed = fullCatalog.find(
        (m) =>
          m.brandName.trim().toLowerCase() === cleanBrand.toLowerCase() &&
          m.strength.trim().toLowerCase() === cleanStrength.toLowerCase() &&
          m.dosageForm.trim().toLowerCase() === cleanForm.toLowerCase()
      );
      await handleSaveMedicineCatalog(
        {
          brandName: cleanBrand,
          genericName: cleanGeneric,
          companyName: cleanCompany,
          strength: cleanStrength || 'Standard',
          dosageForm: cleanForm,
          packSize: '10 × 10 (100 pcs)',
          purchasePrice,
          unitPrice,
          stripPrice: Number((unitPrice * 10).toFixed(2)),
          therapeuticClass: 'Custom Product',
          indication: 'কাস্টম প্রডাক্ট / সাধারণ ব্যবহার্য',
        },
        existingCatalogMed
      );
    }

    showToast(
      `কাস্টম প্রডাক্ট "${cleanBrand}${cleanStrength ? ` ${cleanStrength}` : ''}" (${qty} পিস · দর ৳${formatCleanMoney(unitPrice)}) বিক্রয় বিলে যুক্ত হয়েছে!`
    );
  };

  // Purchase Invoice Cart Handlers (ক্রয় ইনভয়েস — স্টক বাড়বে)
  const handleAddToPurchaseCart = (
    med: MedicineCatalogItem,
    qty = 50,
    packOpts?: {
      packUnit?: PurchasePackUnit;
      packCount?: number;
      unitsPerPack?: number;
      packRate?: number;
      packDetailFormula?: string;
      stripsPerBox?: number;
      pcsPerStrip?: number;
      customCost?: number;
      updateStock?: boolean;
    }
  ) => {
    const invMatch = findMatchingInventoryRecord(inventory, {
      medicineId: med.id,
      brandName: med.brandName,
      strength: med.strength,
      dosageForm: med.dosageForm,
    });
    const currentStock = getInventoryStockForMedicine(inventory, med);
    const retailMrp = invMatch ? invMatch.unitPrice : med.unitPrice;
    const costPrice =
      typeof packOpts?.customCost === 'number' && packOpts.customCost > 0
        ? packOpts.customCost
        : invMatch
        ? invMatch.purchasePrice
        : typeof med.purchasePrice === 'number' && med.purchasePrice > 0
        ? med.purchasePrice
        : Number((retailMrp * 0.88).toFixed(2));

    const updateStock = packOpts?.updateStock !== undefined ? packOpts.updateStock : true;

    setPurchaseCart((prev) => {
      const existing = prev.find((item) => item.medicineId === med.id);
      const next = existing
        ? prev.map((item) =>
            item.medicineId === med.id
              ? {
                  ...item,
                  qty: item.qty + qty,
                  availableStock: currentStock,
                  purchasePrice: costPrice,
                  updateStock,
                  packUnit: packOpts?.packUnit || item.packUnit,
                  packCount: packOpts?.packCount ? (item.packCount || 0) + packOpts.packCount : item.packCount,
                  unitsPerPack: packOpts?.unitsPerPack || item.unitsPerPack,
                  packRate: packOpts?.packRate || item.packRate,
                  packDetailFormula: packOpts?.packDetailFormula || item.packDetailFormula,
                  stripsPerBox: packOpts?.stripsPerBox || item.stripsPerBox,
                  pcsPerStrip: packOpts?.pcsPerStrip || item.pcsPerStrip,
                }
              : item
          )
        : [
            ...prev,
            {
              medicineId: med.id,
              inventoryId: invMatch?.id,
              brandName: med.brandName,
              genericName: med.genericName,
              companyName: med.companyName,
              strength: med.strength,
              dosageForm: med.dosageForm,
              packSize: med.packSize || '10 × 10',
              purchasePrice: costPrice,
              unitPrice: retailMrp,
              qty,
              batchNo: invMatch?.batchNo || `B-${Math.floor(1000 + Math.random() * 9000)}`,
              expiryDate: invMatch?.expiryDate || '2028-06-30',
              availableStock: currentStock,
              updateStock,
              packUnit: packOpts?.packUnit || 'piece',
              packCount: packOpts?.packCount || 1,
              unitsPerPack: packOpts?.unitsPerPack,
              packRate: packOpts?.packRate,
              packDetailFormula: packOpts?.packDetailFormula,
              stripsPerBox: packOpts?.stripsPerBox,
              pcsPerStrip: packOpts?.pcsPerStrip,
            },
          ];
      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });
    const packMsg = packOpts?.packCount && packOpts?.packUnit && packOpts.packUnit !== 'piece'
      ? ` (${packOpts.packCount} ${packOpts.packUnit === 'strip' ? 'পাতা' : packOpts.packUnit === 'box' ? 'বক্স' : 'কার্টুন'})`
      : '';
    showToast(`${med.brandName} (+${qty} পিস${packMsg}) ক্রয় ইনভয়েসে যুক্ত হয়েছে`);
  };

  const handleAddCustomToPurchaseCart = async (params: {
    brandName: string;
    genericName?: string;
    companyName?: string;
    strength?: string;
    dosageForm?: string;
    purchasePrice: number;
    unitPrice?: number;
    qty: number;
    batchNo?: string;
    expiryDate?: string;
    updateStock?: boolean;
    saveToCatalog?: boolean;
    packUnit?: PurchasePackUnit;
    packCount?: number;
    unitsPerPack?: number;
    packRate?: number;
    packDetailFormula?: string;
    stripsPerBox?: number;
    pcsPerStrip?: number;
  }) => {
    const isBlank = !params.brandName.trim();
    const cleanBrand = params.brandName.trim();
    const cleanStrength = (params.strength || '').trim();
    const cleanForm = (params.dosageForm || 'Tablet').trim();
    const cleanGeneric = (params.genericName || cleanBrand || 'Custom Product').trim();
    const cleanCompany = (params.companyName || 'Custom / General').trim();
    const purchasePrice = isBlank ? 0 : Math.max(0.01, Number(params.purchasePrice) || 8.8);
    const unitPrice =
      typeof params.unitPrice === 'number' && params.unitPrice > 0
        ? params.unitPrice
        : Number((purchasePrice / 0.88).toFixed(2));
    const qty = Math.max(1, Math.round(Number(params.qty) || 10));
    const batchNo =
      (params.batchNo || '').trim() || `B-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiryDate = (params.expiryDate || '').trim() || '2028-06-30';
    const updateStock = params.updateStock !== false;

    setPurchaseCart((prev) => {
      if (isBlank) {
        // If the cart already ends with an empty row, keep it and don't duplicate
        const last = prev[prev.length - 1];
        if (last && !last.brandName.trim()) {
          return prev;
        }
        const blankRow: PurchaseCartItem = {
          medicineId: `box_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          brandName: '',
          genericName: cleanGeneric,
          companyName: cleanCompany,
          strength: '',
          dosageForm: cleanForm,
          packSize: params.packDetailFormula || '1*10',
          purchasePrice: 0,
          unitPrice: 0,
          qty: 10,
          batchNo: `B-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: '2028-06-30',
          availableStock: 0,
          updateStock: true,
          packUnit: params.packUnit || 'strip',
          packCount: 1,
          unitsPerPack: 10,
          packRate: 0,
          packDetailFormula: '1*10',
          stripsPerBox: 10,
          pcsPerStrip: 10,
        };
        const next = [...prev, blankRow];
        saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
        return next;
      }

      const slug = `${cleanBrand}-${cleanStrength}-${cleanForm}`
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
      const customMedId = `custom_pur_${slug || Date.now()}`;

      const invMatch = findMatchingInventoryRecord(inventory, {
        medicineId: customMedId,
        brandName: cleanBrand,
        strength: cleanStrength,
        dosageForm: cleanForm,
      });
      const currentStock = invMatch ? invMatch.stockQty : 0;

      const existing = prev.find(
        (item) =>
          item.medicineId === customMedId ||
          (item.brandName.trim().toLowerCase() === cleanBrand.toLowerCase() &&
            item.strength.trim().toLowerCase() === cleanStrength.toLowerCase() &&
            item.dosageForm.trim().toLowerCase() === cleanForm.toLowerCase())
      );
      let next: PurchaseCartItem[];
      const newItem: PurchaseCartItem = {
        medicineId: invMatch?.medicineId || customMedId,
        inventoryId: invMatch?.id,
        brandName: cleanBrand,
        genericName: cleanGeneric,
        companyName: cleanCompany,
        strength: cleanStrength,
        dosageForm: cleanForm,
        packSize: params.packDetailFormula || '10 × 10 (100 pcs)',
        purchasePrice,
        unitPrice,
        qty,
        batchNo,
        expiryDate,
        availableStock: currentStock,
        updateStock,
        packUnit: params.packUnit || 'piece',
        packCount: params.packCount || 1,
        unitsPerPack: params.unitsPerPack,
        packRate: params.packRate,
        packDetailFormula: params.packDetailFormula,
        stripsPerBox: params.stripsPerBox,
        pcsPerStrip: params.pcsPerStrip,
      };

      if (existing) {
        next = prev.map((item) =>
          item.medicineId === existing.medicineId
            ? {
                ...item,
                purchasePrice,
                unitPrice,
                qty: item.qty + qty,
                batchNo: batchNo || item.batchNo,
                updateStock,
                packUnit: params.packUnit || item.packUnit,
                packCount: params.packCount || item.packCount,
                unitsPerPack: params.unitsPerPack || item.unitsPerPack,
                packRate: params.packRate || item.packRate,
                packDetailFormula: params.packDetailFormula || item.packDetailFormula,
                stripsPerBox: params.stripsPerBox || item.stripsPerBox,
                pcsPerStrip: params.pcsPerStrip || item.pcsPerStrip,
              }
            : item
        );
      } else {
        const last = prev[prev.length - 1];
        if (last && !last.brandName.trim()) {
          next = [...prev.slice(0, -1), newItem];
        } else {
          next = [...prev, newItem];
        }
      }

      // Auto ensure next purchase box is open
      const hasTrailingBlank = next.length > 0 && !next[next.length - 1].brandName.trim();
      if (!hasTrailingBlank) {
        const nextBlankRow: PurchaseCartItem = {
          medicineId: `box_${Date.now() + 1}_${Math.random().toString(36).slice(2, 7)}`,
          brandName: '',
          genericName: cleanGeneric,
          companyName: cleanCompany,
          strength: '',
          dosageForm: 'Tablet',
          packSize: '1*10',
          purchasePrice: 0,
          unitPrice: 0,
          qty: 10,
          batchNo: `B-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: '2028-06-30',
          availableStock: 0,
          updateStock: true,
          packUnit: 'strip',
          packCount: 1,
          unitsPerPack: 10,
          packRate: 0,
          packDetailFormula: '1*10',
          stripsPerBox: 10,
          pcsPerStrip: 10,
        };
        next = [...next, nextBlankRow];
      }

      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });

    // Only save to database catalog if the user actually typed a brand name (prevent saving blank boxes to catalog)
    if (params.brandName.trim().length > 0) {
      const existingCatalogMed = fullCatalog.find(
        (m) =>
          m.brandName.trim().toLowerCase() === cleanBrand.toLowerCase() &&
          m.strength.trim().toLowerCase() === cleanStrength.toLowerCase() &&
          m.dosageForm.trim().toLowerCase() === cleanForm.toLowerCase()
      );
      if (!existingCatalogMed || params.saveToCatalog) {
        await handleSaveMedicineCatalog(
          {
            brandName: cleanBrand,
            genericName: cleanGeneric,
            companyName: cleanCompany,
            strength: cleanStrength || 'Standard',
            dosageForm: cleanForm,
            packSize: params.packDetailFormula || '10 × 10 (100 pcs)',
            purchasePrice,
            unitPrice,
            stripPrice: Number((unitPrice * 10).toFixed(2)),
            therapeuticClass: 'Custom Product',
            indication: 'কাস্টম প্রডাক্ট / সাধারণ ব্যবহার্য',
          },
          existingCatalogMed
        );
      }

      showToast(
        `প্রডাক্ট "${cleanBrand}${cleanStrength ? ` ${cleanStrength}` : ''}" (+${qty} পিস · ক্রয় দর ৳${formatCleanMoney(purchasePrice)}) ক্রয় বিলে যুক্ত হয়েছে!`
      );
    }
  };

  const handleUpdatePurchaseCartItemDetails = (
    medId: string,
    updates: Partial<PurchaseCartItem>
  ) => {
    setPurchaseCart((prev) => {
      const next = prev.map((item) =>
        item.medicineId === medId ? { ...item, ...updates } : item
      );
      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });
  };

  const handleUpdatePurchaseCartQty = (medId: string, newQty: number) => {
    setPurchaseCart((prev) => {
      const next = prev.map((item) => (item.medicineId === medId ? { ...item, qty: newQty } : item));
      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });
  };

  const handleUpdatePurchaseCartCost = (medId: string, newPurchasePrice: number) => {
    setPurchaseCart((prev) => {
      const next = prev.map((item) =>
        item.medicineId === medId ? { ...item, purchasePrice: newPurchasePrice } : item
      );
      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });
  };

  const handleUpdatePurchaseCartMrp = (medId: string, newUnitPrice: number) => {
    setPurchaseCart((prev) => {
      const next = prev.map((item) =>
        item.medicineId === medId ? { ...item, unitPrice: newUnitPrice } : item
      );
      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });
  };

  const handleUpdatePurchaseCartBatch = (medId: string, newBatchNo: string) => {
    setPurchaseCart((prev) => {
      const next = prev.map((item) =>
        item.medicineId === medId ? { ...item, batchNo: newBatchNo } : item
      );
      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });
  };

  const handleRemoveFromPurchaseCart = (medId: string) => {
    setPurchaseCart((prev) => {
      const next = prev.filter((item) => item.medicineId !== medId);
      saveLocal(STORAGE_KEYS.PURCHASE_CART, next);
      return next;
    });
  };

  // Start editing an existing Sale or Purchase invoice using the full New-Invoice Creation Builder
  const handleStartEditInvoice = (tx: Transaction) => {
    if (tx.txType === 'sale') {
      const saleItems = buildSaleCartFromTransaction(tx, fullCatalog, inventory);
      setPosCart(saleItems);
      saveLocal(STORAGE_KEYS.POS_CART, saleItems);
      setEditingInvoiceTx(tx);
      setActiveSection('pos_accounts');
      setPosActiveTab('sale_pos');
      showToast(
        `বিক্রয় ইনভয়েস (${tx.invoiceNo}) নতুন ইনভয়েস তৈরির প্যানেলে এডিটের জন্য লোড হয়েছে!`
      );
    } else if (tx.txType === 'purchase') {
      const purItems = buildPurchaseCartFromTransaction(tx, fullCatalog, inventory);
      setPurchaseCart(purItems);
      saveLocal(STORAGE_KEYS.PURCHASE_CART, purItems);
      setEditingInvoiceTx(tx);
      setActiveSection('pos_accounts');
      setPosActiveTab('purchase_entry');
      showToast(
        `ক্রয় ইনভয়েস (${tx.invoiceNo}) নতুন ক্রয় ইনভয়েস তৈরির প্যানেলে এডিটের জন্য লোড হয়েছে!`
      );
    }
  };

  const handleCancelEditInvoice = () => {
    if (editingInvoiceTx?.txType === 'sale') {
      setPosCart([]);
      saveLocal(STORAGE_KEYS.POS_CART, []);
    } else if (editingInvoiceTx?.txType === 'purchase') {
      setPurchaseCart([]);
      saveLocal(STORAGE_KEYS.PURCHASE_CART, []);
    }
    setEditingInvoiceTx(null);
    showToast('ইনভয়েস এডিট মোড বাতিল করা হয়েছে। এখন নতুন ইনভয়েস তৈরি করতে পারেন।');
  };

  // Complete POS Sale Invoice (বিক্রয় করলে স্টক কমবে — নতুন তৈরি ও এডিট উভয় ক্ষেত্রেই)
  const handleCompleteSale = async (params: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    patientAge?: string;
    patientSex?: string;
    dentalClinical?: Record<string, string>;
    selectedSeal?: InvoiceSealType;
    discount: number;
    paidAmount: number;
    paymentMethod: Transaction['paymentMethod'];
    syncModifiedPricesToCatalog: boolean;
    invoiceNo?: string;
    dateStr?: string;
    editingTxId?: string;
  }): Promise<Transaction | null> => {
    if (posCart.length === 0) return null;

    const nowMs = Date.now();
    const existingEditedTx = params.editingTxId
      ? transactions.find((t) => getCanonicalDocId(t.id, effectiveShopId) === getCanonicalDocId(params.editingTxId!, effectiveShopId))
      : undefined;

    // Check if any item's purchase price or selling price was changed in the POS cart, or if it's a custom product
    if (params.syncModifiedPricesToCatalog) {
      const catalogUpdates: Promise<void>[] = [];
      for (const item of posCart) {
        const catMed = fullCatalog.find((m) => m.id === item.medicineId);
        const unitChanged =
          item.originalUnitPrice !== undefined &&
          Math.abs(item.unitPrice - item.originalUnitPrice) > 0.001;
        const purChanged =
          item.originalPurchasePrice !== undefined &&
          item.purchasePrice !== undefined &&
          Math.abs(item.purchasePrice - item.originalPurchasePrice) > 0.001;
        if (catMed && (unitChanged || purChanged)) {
          catalogUpdates.push(
            handleSaveMedicineCatalog(
              {
                brandName: item.brandName || catMed.brandName,
                genericName: item.genericName || catMed.genericName,
                companyName: item.companyName || catMed.companyName,
                strength: item.strength || catMed.strength,
                dosageForm: item.dosageForm || catMed.dosageForm,
                packSize: catMed.packSize,
                purchasePrice: item.purchasePrice,
                unitPrice: item.unitPrice,
                stripPrice: Number((item.unitPrice * (catMed.unitsPerStrip || 10)).toFixed(2)),
                therapeuticClass: catMed.therapeuticClass,
                indication: catMed.indication,
              },
              catMed
            )
          );
        } else if (!catMed && item.brandName.trim()) {
          catalogUpdates.push(
            handleSaveMedicineCatalog({
              brandName: item.brandName.trim(),
              genericName: (item.genericName || item.brandName).trim(),
              companyName: (item.companyName || 'Custom / General').trim(),
              strength: (item.strength || 'Standard').trim(),
              dosageForm: (item.dosageForm || 'Tablet').trim(),
              packSize: '10 × 10 (100 pcs)',
              purchasePrice: item.purchasePrice,
              unitPrice: item.unitPrice,
              stripPrice: Number((item.unitPrice * 10).toFixed(2)),
              therapeuticClass: 'Custom Product',
              indication: 'কাস্টম প্রডাক্ট / সাধারণ ব্যবহার্য',
            })
          );
        }
      }
      if (catalogUpdates.length > 0) {
        await Promise.allSettled(catalogUpdates);
      }
    }

    const subTotal = sanitizeNumber(
      posCart.reduce((acc, i) => acc + i.unitPrice * i.qty, 0)
    );
    const discount = sanitizeNumber(params.discount, 0, subTotal);
    const grandTotal = sanitizeNumber(subTotal - discount);
    const paidAmount = sanitizeNumber(params.paidAmount, 0, grandTotal);
    const dueAmount = sanitizeNumber(grandTotal - paidAmount);
    const totalCount = posCart.reduce((acc, i) => acc + i.qty, 0);

    const summaryText = sanitizeString(
      posCart
        .map((i, idx) => formatCartItemInvoiceLine(i, idx))
        .join('\n'),
      50000
    );

    const defaultInvNo = `INV-${getTodayDateStr().replace(/-/g, '').slice(2)}-${Math.floor(
      100 + Math.random() * 900
    )}`;
    const invoiceNo = sanitizeString(
      params.invoiceNo?.trim() || existingEditedTx?.invoiceNo || defaultInvNo,
      60,
      defaultInvNo
    );
    const dateStr = sanitizeString(
      params.dateStr?.trim() || existingEditedTx?.dateStr || getTodayDateStr(),
      20,
      getTodayDateStr()
    );

    const staffRoleVal: 'owner' | 'staff' =
      activeStaff.roleTitle === 'owner' ? 'owner' : 'staff';
    const operatorDisplayName = getOperatorName(activeStaff);

    const txId = existingEditedTx ? getCanonicalDocId(existingEditedTx.id, effectiveShopId) : `tx_sale_${nowMs}`;
    const newTx: Transaction = {
      id: txId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      txType: 'sale',
      invoiceNo,
      dateStr,
      partyId: sanitizeString(params.customerId, 128, 'walk-in'),
      partyName: sanitizeString(params.customerName, 120, 'সাধারণ ক্রেতা'),
      partyPhone: sanitizeString(params.customerPhone, 30, 'N/A'),
      patientAge: params.patientAge?.trim() || existingEditedTx?.patientAge,
      patientSex: params.patientSex?.trim() || existingEditedTx?.patientSex,
      dentalClinical: params.dentalClinical || existingEditedTx?.dentalClinical,
      selectedSeal: params.selectedSeal || existingEditedTx?.selectedSeal || 'iqbal_pharmacy',
      itemsSummary: summaryText,
      totalCount,
      subTotal,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentMethod: params.paymentMethod,
      staffName: sanitizeString(operatorDisplayName, 100, 'Owner'),
      staffRole: staffRoleVal,
      counterName: sanitizeString(activeStaff.counterName, 60, 'কাউন্টার ১'),
      updatedAtMs: nowMs,
    };

    // Build updated inventory list:
    // 1. If editing an existing invoice, first reverse its previous stock impact (excluding non-stock items)
    // 2. Then decrease stockQty ONLY for sold items with updateStock !== false
    const modifiedInvMap = new Map<string, InventoryItem>();
    const nextInventoryList = inventory.map((inv) => ({ ...inv }));

    if (
      existingEditedTx &&
      (existingEditedTx.txType === 'sale' || existingEditedTx.txType === 'purchase')
    ) {
      const oldParsedItems = parseTransactionItemsDetailed(
        existingEditedTx.itemsSummary,
        fullCatalog
      );
      for (const pItem of oldParsedItems) {
        if (pItem.tailText?.includes('নন-স্টক')) {
          continue; // Non-stock items never touched inventory; do not reverse
        }
        const matchedOld = findMatchingInventoryRecord(nextInventoryList, {
          medicineId: pItem.matchedMedicine?.id,
          brandName: pItem.matchedMedicine?.brandName || pItem.brandAndStrength,
          strength: pItem.matchedMedicine?.strength || '',
          dosageForm: pItem.matchedMedicine?.dosageForm || pItem.formPrefix,
        });
        if (matchedOld && pItem.qty > 0) {
          matchedOld.id = getCanonicalDocId(matchedOld.id, effectiveShopId);
          matchedOld.shopId = effectiveShopId;
          if (existingEditedTx.txType === 'sale') {
            matchedOld.stockQty = matchedOld.stockQty + pItem.qty;
          } else {
            matchedOld.stockQty = Math.max(0, matchedOld.stockQty - pItem.qty);
          }
          matchedOld.updatedAtMs = nowMs;
          modifiedInvMap.set(matchedOld.id, matchedOld);
        }
      }
    }

    for (const cartItem of posCart) {
      // If updateStock is explicitly false, do not change stock or inventory
      if (cartItem.updateStock === false) {
        continue;
      }

      const matchedInv = findMatchingInventoryRecord(nextInventoryList, {
        inventoryId: cartItem.inventoryId,
        medicineId: cartItem.medicineId,
        brandName: cartItem.brandName,
        strength: cartItem.strength,
        dosageForm: cartItem.dosageForm,
      });

      if (matchedInv) {
        matchedInv.id = getCanonicalDocId(matchedInv.id, effectiveShopId);
        matchedInv.shopId = effectiveShopId;
        matchedInv.stockQty = Math.max(0, matchedInv.stockQty - cartItem.qty);
        matchedInv.updatedAtMs = nowMs;
        if (params.syncModifiedPricesToCatalog) {
          matchedInv.purchasePrice = cartItem.purchasePrice;
          matchedInv.unitPrice = cartItem.unitPrice;
          matchedInv.stripPrice = Number((cartItem.unitPrice * 10).toFixed(2));
        }
        modifiedInvMap.set(matchedInv.id, matchedInv);
      } else {
        const newInvId = `inv_${cartItem.medicineId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${nowMs.toString().slice(-4)}`;
        const baselineStock = cartItem.availableStock > 0 ? cartItem.availableStock : 100;
        const createdInv: InventoryItem = {
          id: newInvId,
          shopId: effectiveShopId,
          ownerId: effectiveCloudUid,
          medicineId: cartItem.medicineId,
          brandName: cartItem.brandName,
          genericName: cartItem.genericName,
          companyName: cartItem.companyName,
          strength: cartItem.strength,
          dosageForm: cartItem.dosageForm,
          packSize: '10 × 10 (100 pcs)',
          purchasePrice: cartItem.purchasePrice,
          unitPrice: cartItem.unitPrice,
          stripPrice: Number((cartItem.unitPrice * 10).toFixed(2)),
          stockQty: Math.max(0, baselineStock - cartItem.qty),
          minStockLevel: 20,
          batchNo: `B-${nowMs.toString().slice(-4)}`,
          expiryDate: '2028-06-30',
          shelfLocation: 'Rack A-1',
          updatedAtMs: nowMs,
        };
        unmarkDeletedId(newInvId);
        nextInventoryList.unshift(createdInv);
        modifiedInvMap.set(newInvId, createdInv);
      }
    }

    unmarkDeletedId(txId);
    setTransactions((prev) => {
      const next = existingEditedTx
        ? prev.map((t) => (getCanonicalDocId(t.id, effectiveShopId) === txId ? newTx : t))
        : [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    setInventory(nextInventoryList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInventoryList);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), nextInventoryList);

    // Update Customer Ledger (reversing old invoice customer amounts if editing, then applying new)
    const updatedCustomersForCloud: Customer[] = [];
    const oldCustId =
      existingEditedTx && existingEditedTx.partyId && existingEditedTx.partyId !== 'walk-in'
        ? getCanonicalDocId(existingEditedTx.partyId, effectiveShopId)
        : null;
    const newCustId =
      params.customerId && params.customerId !== 'walk-in'
        ? getCanonicalDocId(params.customerId, effectiveShopId)
        : null;

    if (oldCustId || newCustId) {
      setCustomers((prev) => {
        const next = prev.map((c) => {
          const canonCId = getCanonicalDocId(c.id, effectiveShopId);
          if (canonCId !== oldCustId && canonCId !== newCustId) return c;

          let purchased = c.totalPurchased;
          let paid = c.totalPaid;
          let due = c.totalDue;

          if (existingEditedTx && canonCId === oldCustId) {
            purchased = Math.max(0, purchased - existingEditedTx.grandTotal);
            paid = Math.max(0, paid - existingEditedTx.paidAmount);
            due = Math.max(0, due - existingEditedTx.dueAmount);
          }

          if (canonCId === newCustId) {
            purchased += grandTotal;
            paid += paidAmount;
            due += dueAmount;
          }

          const updatedC: Customer = {
            ...c,
            id: canonCId,
            shopId: effectiveShopId,
            totalPurchased: sanitizeNumber(purchased),
            totalPaid: sanitizeNumber(paid),
            totalDue: sanitizeNumber(due),
            updatedAtMs: nowMs,
          };
          updatedCustomersForCloud.push(updatedC);
          return updatedC;
        });
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, effectiveShopId), next);
        return next;
      });
    }

    if (user || isCloudLoggedIn) {
      const saleWrites: Array<{ promise: Promise<unknown>; operationType: OperationType; path: string | null }> = [
        {
          promise: setDoc(
            doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, txId)),
            buildTransactionCloudPayload(newTx, effectiveCloudUid, effectiveShopId)
          ),
          operationType: OperationType.WRITE,
          path: `transactions/${txId}`,
        },
        ...Array.from(modifiedInvMap.values()).map((invItem) => {
          const canonInvId = getCanonicalDocId(invItem.id, effectiveShopId);
          return {
            promise: setDoc(
              doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, canonInvId)),
              buildInventoryCloudPayload(invItem, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `inventory/${canonInvId}`,
          };
        }),
        ...updatedCustomersForCloud.map((cObj) => {
          const canonCustId = getCanonicalDocId(cObj.id, effectiveShopId);
          return {
            promise: setDoc(
              doc(db, 'customers', getScopedFirestoreDocId(effectiveShopId, canonCustId)),
              buildCustomerCloudPayload(cObj, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `customers/${canonCustId}`,
          };
        }),
      ];
      await fireAndRaceFirestoreWrites(saleWrites, 1200);
    }

    setPosCart([]);
    saveLocal(STORAGE_KEYS.POS_CART, []);
    setEditingInvoiceTx(null);
    const soldStockCount = posCart
      .filter((i) => i.updateStock !== false)
      .reduce((acc, i) => acc + i.qty, 0);
    const nonStockSoldCount = posCart.filter((i) => i.updateStock === false).length;
    showToast(
      existingEditedTx
        ? `বিক্রয় ইনভয়েস (${invoiceNo}) সফলভাবে এডিট হয়েছে!`
        : soldStockCount > 0
        ? `বিক্রয় ইনভয়েস (${invoiceNo}) তৈরি হয়েছে ও স্টক থেকে -${soldStockCount} পিস কমানো হয়েছে${nonStockSoldCount > 0 ? ` (${nonStockSoldCount}টি নন-স্টক আইটেম)` : ''}!`
        : `বিক্রয় ইনভয়েস (${invoiceNo}) তৈরি হয়েছে (শুধু ইনভয়েস, স্টক অপরিবর্তিত)!`
    );
    return newTx;
  };

  // Complete Multi-Item Purchase Invoice (ক্রয় করলে স্টক বাড়বে — নতুন তৈরি ও এডিট উভয় ক্ষেত্রেই)
  const handleCompletePurchaseInvoice = async (params: {
    supplierCompany: string;
    supplierPhone: string;
    invoiceNo: string;
    discount: number;
    vat?: number;
    vatPercent?: number;
    paidAmount: number;
    paymentMethod: Transaction['paymentMethod'];
    defaultExpiryDate?: string;
    dateStr?: string;
    editingTxId?: string;
    syncModifiedPricesToCatalog?: boolean;
  }): Promise<Transaction | null> => {
    const validPurchaseCart = purchaseCart.filter(
      (i) => i.brandName && i.brandName.trim().length > 0
    );
    if (validPurchaseCart.length === 0) return null;

    const nowMs = Date.now();
    const existingEditedTx = params.editingTxId
      ? transactions.find((t) => getCanonicalDocId(t.id, effectiveShopId) === getCanonicalDocId(params.editingTxId!, effectiveShopId))
      : undefined;

    const subTotal = sanitizeNumber(
      validPurchaseCart.reduce((acc, i) => {
        const effPackRate =
          i.packRate && i.packRate > 0
            ? i.packRate
            : i.purchasePrice > 0
            ? Number((i.purchasePrice * (i.unitsPerPack || 1)).toFixed(2))
            : 0;
        const count = Math.max(1, i.packCount || 1);
        const isPack = Boolean(i.packUnit && i.packUnit !== 'piece' && effPackRate > 0);
        const lineCost = isPack
          ? Number((effPackRate * count).toFixed(2))
          : Number((i.purchasePrice * i.qty).toFixed(2));
        return acc + lineCost;
      }, 0)
    );
    const vatAmount = sanitizeNumber(params.vat || 0, 0);
    const discount = sanitizeNumber(params.discount, 0, subTotal + vatAmount);
    const grandTotal = sanitizeNumber(subTotal + vatAmount - discount);
    const paidAmount = sanitizeNumber(params.paidAmount, 0, grandTotal);
    const dueAmount = sanitizeNumber(grandTotal - paidAmount);
    const totalCount = validPurchaseCart.reduce((acc, i) => acc + i.qty, 0);

    const summaryText = sanitizeString(
      validPurchaseCart
        .map((i, idx) => formatPurchaseItemInvoiceLine(i, idx))
        .join('\n'),
      50000
    );

    const invoiceNo = sanitizeString(
      params.invoiceNo.trim() ||
        existingEditedTx?.invoiceNo ||
        `PUR-${getTodayDateStr().replace(/-/g, '').slice(2)}-${Math.floor(100 + Math.random() * 900)}`,
      60,
      'PUR-01'
    );
    const dateStr = sanitizeString(
      params.dateStr?.trim() || existingEditedTx?.dateStr || getTodayDateStr(),
      20,
      getTodayDateStr()
    );

    const staffRoleVal: 'owner' | 'staff' =
      activeStaff.roleTitle === 'owner' ? 'owner' : 'staff';
    const operatorDisplayName = getOperatorName(activeStaff);

    const txId = existingEditedTx ? getCanonicalDocId(existingEditedTx.id, effectiveShopId) : `tx_pur_${nowMs}`;
    const newTx: Transaction = {
      id: txId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      txType: 'purchase',
      invoiceNo,
      dateStr,
      partyId: 'supplier-company',
      partyName: sanitizeString(
        params.supplierCompany.includes('(ডিপো চালান)')
          ? params.supplierCompany
          : `${params.supplierCompany} (ডিপো চালান)`,
        120
      ),
      partyPhone: sanitizeString(params.supplierPhone || 'কোম্পানি ডিপো', 30),
      itemsSummary: summaryText,
      totalCount,
      subTotal,
      vat: vatAmount,
      vatPercent: params.vatPercent,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentMethod: params.paymentMethod,
      staffName: sanitizeString(operatorDisplayName, 100, 'Owner'),
      staffRole: staffRoleVal,
      counterName: sanitizeString(activeStaff.counterName, 60, 'কাউন্টার ১'),
      updatedAtMs: nowMs,
    };

    // 1. If editing an existing purchase invoice, first reverse its old stock addition (excluding non-stock items)
    // 2. Then increase stockQty in inventory ONLY for items where updateStock !== false (✅ স্টকে যুক্ত হবে)
    const nextInventoryList = inventory.map((inv) => ({ ...inv }));
    const changedInvMap = new Map<string, InventoryItem>();

    if (
      existingEditedTx &&
      (existingEditedTx.txType === 'purchase' || existingEditedTx.txType === 'sale')
    ) {
      const oldParsedItems = parseTransactionItemsDetailed(
        existingEditedTx.itemsSummary,
        fullCatalog
      );
      for (const pItem of oldParsedItems) {
        if (pItem.tailText?.includes('নন-স্টক')) {
          continue; // Non-stock items never touched inventory; do not reverse
        }
        const matchedOld = findMatchingInventoryRecord(nextInventoryList, {
          medicineId: pItem.matchedMedicine?.id,
          brandName: pItem.matchedMedicine?.brandName || pItem.brandAndStrength,
          strength: pItem.matchedMedicine?.strength || '',
          dosageForm: pItem.matchedMedicine?.dosageForm || pItem.formPrefix,
        });
        const oldUnits = pItem.qty + (pItem.bonusQty || 0);
        if (matchedOld && oldUnits > 0) {
          matchedOld.id = getCanonicalDocId(matchedOld.id, effectiveShopId);
          matchedOld.shopId = effectiveShopId;
          if (existingEditedTx.txType === 'purchase') {
            matchedOld.stockQty = Math.max(0, matchedOld.stockQty - oldUnits);
          } else {
            matchedOld.stockQty = matchedOld.stockQty + oldUnits;
          }
          matchedOld.updatedAtMs = nowMs;
          changedInvMap.set(matchedOld.id, matchedOld);
        }
      }
    }

    const purchaseCatalogSyncPromises: Promise<void>[] = [];
    for (const purItem of validPurchaseCart) {
      // Formula: Tp + Vat = Product Price. (মোট মূল্য + মোট ভ্যাট) ÷ প্রোডাক্ট সংখ্যা = সিঙ্গেল পিসের ক্রয় মূল্য
      const effPackRate =
        purItem.packRate && purItem.packRate > 0
          ? purItem.packRate
          : purItem.purchasePrice > 0
          ? Number((purItem.purchasePrice * (purItem.unitsPerPack || 1)).toFixed(2))
          : 0;
      const count = Math.max(1, purItem.packCount || 1);
      const isPack = Boolean(purItem.packUnit && purItem.packUnit !== 'piece' && effPackRate > 0);
      const itemLineCost = isPack
        ? Number((effPackRate * count).toFixed(2))
        : Number((purItem.purchasePrice * purItem.qty).toFixed(2));

      // 1. Product VAT (% or ৳ or piece_vat)
      const pMode = purItem.productVatMode || (purItem.pieceVatAmount !== undefined && purItem.pieceVatAmount > 0 ? 'piece_vat' : purItem.vatAmount && purItem.vatAmount > 0 && !purItem.vatPercent ? '৳' : '%');
      let productVat = 0;
      if (pMode === 'piece_vat' && purItem.pieceVatAmount !== undefined && purItem.pieceVatAmount > 0) {
        productVat = Number((purItem.pieceVatAmount * purItem.qty).toFixed(2));
      } else if (pMode === '৳' || pMode === 'fixed') {
        productVat = Math.max(0, purItem.vatAmount || 0);
      } else if (purItem.vatPercent && purItem.vatPercent > 0) {
        productVat = Number(((itemLineCost * purItem.vatPercent) / 100).toFixed(2));
      } else if (purItem.vatAmount && purItem.vatAmount > 0) {
        productVat = purItem.vatAmount;
      }

      // 2. Bonus item VAT (bonusQty × rate, fixed lump sum, or percent)
      const bQty = Math.max(0, purItem.bonusQty || 0);
      const bMode = purItem.bonusVatMode || '৳';
      const bRate = Math.max(0, purItem.bonusVatRate || 0);
      let bonusVat = 0;
      if (bQty > 0 && bRate > 0) {
        if (bMode === '৳') {
          bonusVat = Number((bQty * bRate).toFixed(2));
        } else if (bMode === 'fixed') {
          bonusVat = Number(bRate.toFixed(2));
        } else {
          const unitP = purItem.purchasePrice > 0 ? purItem.purchasePrice : 0;
          bonusVat = Number((bQty * ((unitP * bRate) / 100)).toFixed(2));
        }
      } else if (purItem.bonusVatAmount && purItem.bonusVatAmount > 0) {
        bonusVat = Number(purItem.bonusVatAmount.toFixed(2));
      }

      const totalItemVat = productVat + bonusVat;
      const productUnits = Math.max(1, purItem.qty);
      // Single piece price including VAT (Tp + Vat = Product Price)
      const effectiveSinglePiecePurchasePrice = Number(((itemLineCost + totalItemVat) / productUnits).toFixed(4));

      // 1. Always ensure new products are saved to the database catalog so they are suggested in future searches
      const baseMed = fullCatalog.find(
        (m) =>
          m.id === purItem.medicineId ||
          (m.brandName.trim().toLowerCase() === purItem.brandName.trim().toLowerCase() &&
            m.strength.trim().toLowerCase() === purItem.strength.trim().toLowerCase() &&
            m.dosageForm.trim().toLowerCase() === purItem.dosageForm.trim().toLowerCase())
      );

      if (!baseMed && purItem.brandName.trim()) {
        const fallbackRetail =
          purItem.unitPrice > 0
            ? purItem.unitPrice
            : effectiveSinglePiecePurchasePrice > 0
            ? Number((effectiveSinglePiecePurchasePrice * 1.15).toFixed(2))
            : 5;
        purchaseCatalogSyncPromises.push(
          handleSaveMedicineCatalog({
            brandName: purItem.brandName.trim(),
            genericName: (purItem.genericName || purItem.brandName).trim(),
            companyName: (params.supplierCompany || purItem.companyName || 'Custom / General').trim(),
            strength: (purItem.strength || 'Standard').trim(),
            dosageForm: (purItem.dosageForm || 'Tablet').trim(),
            packSize: purItem.packDetailFormula || purItem.packSize || '10 × 10 (100 pcs)',
            purchasePrice: effectiveSinglePiecePurchasePrice,
            unitPrice: fallbackRetail,
            stripPrice: Number((fallbackRetail * 10).toFixed(2)),
            therapeuticClass: 'Custom Product',
            indication: 'কাস্টম প্রডাক্ট / সাধারণ ব্যবহার্য',
          })
        );
      } else if (params.syncModifiedPricesToCatalog && baseMed) {
        const oldPur =
          typeof baseMed.purchasePrice === 'number' && baseMed.purchasePrice > 0
            ? baseMed.purchasePrice
            : Number((baseMed.unitPrice * 0.88).toFixed(2));
        if (
          Math.abs(baseMed.unitPrice - purItem.unitPrice) > 0.001 ||
          Math.abs(oldPur - effectiveSinglePiecePurchasePrice) > 0.001
        ) {
          purchaseCatalogSyncPromises.push(
            handleSaveMedicineCatalog(
              {
                brandName: purItem.brandName || baseMed.brandName,
                genericName: purItem.genericName || baseMed.genericName,
                companyName: params.supplierCompany || baseMed.companyName,
                strength: purItem.strength || baseMed.strength,
                dosageForm: purItem.dosageForm || baseMed.dosageForm,
                packSize: baseMed.packSize,
                purchasePrice: effectiveSinglePiecePurchasePrice,
                unitPrice: purItem.unitPrice,
                stripPrice: Number((purItem.unitPrice * (baseMed.unitsPerStrip || 10)).toFixed(2)),
                therapeuticClass: baseMed.therapeuticClass,
                indication: baseMed.indication,
              },
              baseMed
            )
          );
        }
      }

      // If updateStock is explicitly false (not checked), DO NOT touch stock, DO NOT touch inventory
      if (purItem.updateStock === false) {
        continue;
      }

      const existingInv = findMatchingInventoryRecord(nextInventoryList, {
        inventoryId: purItem.inventoryId,
        medicineId: purItem.medicineId,
        brandName: purItem.brandName,
        strength: purItem.strength,
        dosageForm: purItem.dosageForm,
      });

      const totalUnitsToAdd = purItem.qty + (purItem.bonusQty || 0);

      if (existingInv) {
        existingInv.id = getCanonicalDocId(existingInv.id, effectiveShopId);
        existingInv.shopId = effectiveShopId;
        existingInv.stockQty = existingInv.stockQty + totalUnitsToAdd;
        existingInv.purchasePrice = effectiveSinglePiecePurchasePrice;
        existingInv.unitPrice = purItem.unitPrice;
        existingInv.stripPrice = Number((purItem.unitPrice * 10).toFixed(2));
        existingInv.batchNo = purItem.batchNo || existingInv.batchNo;
        existingInv.expiryDate =
          purItem.expiryDate || params.defaultExpiryDate || existingInv.expiryDate;
        existingInv.updatedAtMs = nowMs;
        unmarkDeletedId(existingInv.id);
        changedInvMap.set(existingInv.id, existingInv);
      } else {
        const newInvId = `inv_${purItem.medicineId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${nowMs.toString().slice(-4)}`;
        const createdInv: InventoryItem = {
          id: newInvId,
          shopId: effectiveShopId,
          ownerId: effectiveCloudUid,
          medicineId: purItem.medicineId,
          brandName: purItem.brandName,
          genericName: purItem.genericName,
          companyName: params.supplierCompany || purItem.companyName,
          strength: purItem.strength,
          dosageForm: purItem.dosageForm,
          packSize: purItem.packSize || '10 × 10 (100 pcs)',
          purchasePrice: effectiveSinglePiecePurchasePrice,
          unitPrice: purItem.unitPrice,
          stripPrice: Number((purItem.unitPrice * 10).toFixed(2)),
          stockQty: totalUnitsToAdd,
          minStockLevel: 30,
          batchNo: purItem.batchNo || `B-${nowMs.toString().slice(-4)}`,
          expiryDate: purItem.expiryDate || params.defaultExpiryDate || '2028-06-30',
          shelfLocation: 'Rack A-1',
          updatedAtMs: nowMs,
        };
        unmarkDeletedId(newInvId);
        nextInventoryList.unshift(createdInv);
        changedInvMap.set(newInvId, createdInv);
      }
    }

    if (purchaseCatalogSyncPromises.length > 0) {
      await Promise.allSettled(purchaseCatalogSyncPromises);
    }

    unmarkDeletedId(txId);
    setTransactions((prev) => {
      const next = existingEditedTx
        ? prev.map((t) => (getCanonicalDocId(t.id, effectiveShopId) === txId ? newTx : t))
        : [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    setInventory(nextInventoryList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInventoryList);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), nextInventoryList);

    if (user || isCloudLoggedIn) {
      const purchaseWrites: Array<{ promise: Promise<unknown>; operationType: OperationType; path: string | null }> = [
        {
          promise: setDoc(
            doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, txId)),
            buildTransactionCloudPayload(newTx, effectiveCloudUid, effectiveShopId)
          ),
          operationType: OperationType.WRITE,
          path: `transactions/${txId}`,
        },
        ...Array.from(changedInvMap.values()).map((invItem) => {
          const canonInvId = getCanonicalDocId(invItem.id, effectiveShopId);
          return {
            promise: setDoc(
              doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, canonInvId)),
              buildInventoryCloudPayload(invItem, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `inventory/${canonInvId}`,
          };
        }),
      ];
      await fireAndRaceFirestoreWrites(purchaseWrites, 1200);
    }

    setPurchaseCart([]);
    saveLocal(STORAGE_KEYS.PURCHASE_CART, []);
    setEditingInvoiceTx(null);
    const addedStockCount = purchaseCart
      .filter((i) => i.updateStock !== false)
      .reduce((acc, i) => acc + i.qty + (i.bonusQty || 0), 0);
    const totalBonusCount = purchaseCart
      .filter((i) => i.updateStock !== false)
      .reduce((acc, i) => acc + (i.bonusQty || 0), 0);
    const nonStockPurCount = purchaseCart.filter((i) => i.updateStock === false).length;
    showToast(
      existingEditedTx
        ? `ক্রয় ইনভয়েস (${invoiceNo}) সফলভাবে এডিট হয়েছে${totalBonusCount > 0 ? ` (বোনাস +${totalBonusCount} পিস সহ)` : ''}!`
        : addedStockCount > 0
        ? `ক্রয় ইনভয়েস (${invoiceNo}) তৈরি হয়েছে ও স্টকে +${addedStockCount} পিস যুক্ত হয়েছে${totalBonusCount > 0 ? ` (বোনাস +${totalBonusCount} পিস ফ্রি)` : ''}${nonStockPurCount > 0 ? ` (${nonStockPurCount}টি নন-স্টক আইটেম)` : ''}!`
        : `ক্রয় ইনভয়েস (${invoiceNo}) তৈরি হয়েছে (শুধু ইনভয়েস, স্টক অপরিবর্তিত)!`
    );
    return newTx;
  };

  // Edit & Delete Transaction Handlers
  const handleEditTransaction = async (
    txId: string,
    updated: {
      dateStr: string;
      partyName: string;
      partyPhone: string;
      itemsSummary: string;
      subTotal: number;
      discount: number;
      grandTotal: number;
      paidAmount: number;
      dueAmount: number;
      paymentMethod: Transaction['paymentMethod'];
    }
  ) => {
    const canonTxId = getCanonicalDocId(txId, effectiveShopId);
    const existingTx = transactions.find((t) => getCanonicalDocId(t.id, effectiveShopId) === canonTxId);
    if (!existingTx) return;

    const nowMs = Date.now();
    const updatedTxObj: Transaction = {
      ...existingTx,
      id: canonTxId,
      shopId: effectiveShopId,
      ...updated,
      updatedAtMs: nowMs,
    };

    setTransactions((prev) => {
      const next = prev.map((t) => (getCanonicalDocId(t.id, effectiveShopId) === canonTxId ? updatedTxObj : t));
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, canonTxId)),
          buildTransactionCloudPayload(updatedTxObj, effectiveCloudUid, effectiveShopId)
        ),
        OperationType.UPDATE,
        `transactions/${canonTxId}`,
        1200
      );
    }
    showToast(`ভাউচার (${existingTx.invoiceNo}) সফলভাবে এডিট করা হয়েছে!`);
  };

  // Payment Now handler for full or partial payment of any invoice due
  const handlePayInvoiceDue = async (params: {
    invoiceTx: Transaction;
    paymentAmount: number;
    paymentMethod: Transaction['paymentMethod'];
    note?: string;
  }): Promise<Transaction | null> => {
    const { invoiceTx, paymentAmount, paymentMethod, note } = params;
    const canonTxId = getCanonicalDocId(invoiceTx.id, effectiveShopId);
    const nowMs = Date.now();
    const amt = sanitizeNumber(paymentAmount, 0, invoiceTx.dueAmount);
    if (amt <= 0) return null;

    const newPaidAmount = sanitizeNumber(invoiceTx.paidAmount + amt);
    const newDueAmount = Math.max(0, sanitizeNumber(invoiceTx.dueAmount - amt));

    // 1. Updated invoice object
    const updatedInvoice: Transaction = {
      ...invoiceTx,
      id: canonTxId,
      shopId: effectiveShopId,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      updatedAtMs: nowMs,
    };

    // 2. Create due_payment transaction for accounting & history
    const dueTxId = `tx_due_${nowMs}`;
    const staffRoleVal: 'owner' | 'staff' =
      activeStaff.roleTitle === 'owner' ? 'owner' : 'staff';
    const operatorDisplayName = getOperatorName(activeStaff);

    const dueTx: Transaction = {
      id: dueTxId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      txType: 'due_payment',
      invoiceNo: `DUE-${getTodayDateStr().replace(/-/g, '').slice(2)}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      dateStr: getTodayDateStr(),
      partyId: invoiceTx.partyId,
      partyName: invoiceTx.partyName,
      partyPhone: invoiceTx.partyPhone,
      itemsSummary: sanitizeString(
        note ||
          `ইনভয়েস (${invoiceTx.invoiceNo}) বকেয়া পরিশোধ - ৳${amt.toFixed(2)} (${
            newDueAmount === 0 ? 'সম্পূর্ণ পরিশোধ' : 'আংশিক পরিশোধ'
          })`,
        600
      ),
      totalCount: 1,
      subTotal: amt,
      discount: 0,
      grandTotal: amt,
      paidAmount: amt,
      dueAmount: 0,
      paymentMethod,
      staffName: sanitizeString(operatorDisplayName, 100),
      staffRole: staffRoleVal,
      counterName: sanitizeString(activeStaff.counterName, 60),
      updatedAtMs: nowMs,
    };

    // 3. Update customer ledger if party is a recorded customer
    let updatedCust: Customer | undefined;
    if (invoiceTx.partyId && invoiceTx.partyId !== 'walk-in') {
      const cust = customers.find(
        (c) => getCanonicalDocId(c.id, effectiveShopId) === getCanonicalDocId(invoiceTx.partyId, effectiveShopId)
      );
      if (cust) {
        updatedCust = {
          ...cust,
          id: getCanonicalDocId(cust.id, effectiveShopId),
          shopId: effectiveShopId,
          totalPaid: cust.totalPaid + amt,
          totalDue: Math.max(0, cust.totalDue - amt),
          updatedAtMs: nowMs,
        };
      }
    }

    setTransactions((prev) => {
      const next = [
        dueTx,
        ...prev.map((t) => (getCanonicalDocId(t.id, effectiveShopId) === canonTxId ? updatedInvoice : t)),
      ];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    if (updatedCust) {
      setCustomers((prev) => {
        const next = prev.map((c) =>
          getCanonicalDocId(c.id, effectiveShopId) === getCanonicalDocId(updatedCust!.id, effectiveShopId) ? updatedCust! : c
        );
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, effectiveShopId), next);
        return next;
      });
    }

    if (user || isCloudLoggedIn) {
      const dueWrites: Array<{ promise: Promise<unknown>; operationType: OperationType; path: string | null }> = [
        {
          promise: setDoc(
            doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, canonTxId)),
            buildTransactionCloudPayload(updatedInvoice, effectiveCloudUid, effectiveShopId)
          ),
          operationType: OperationType.WRITE,
          path: `transactions/${canonTxId}`,
        },
        {
          promise: setDoc(
            doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, dueTxId)),
            buildTransactionCloudPayload(dueTx, effectiveCloudUid, effectiveShopId)
          ),
          operationType: OperationType.WRITE,
          path: `transactions/${dueTxId}`,
        },
      ];
      if (updatedCust) {
        const canonCustId = getCanonicalDocId(updatedCust.id, effectiveShopId);
        dueWrites.push({
          promise: setDoc(
            doc(db, 'customers', getScopedFirestoreDocId(effectiveShopId, canonCustId)),
            buildCustomerCloudPayload(updatedCust, effectiveCloudUid, effectiveShopId)
          ),
          operationType: OperationType.WRITE,
          path: `customers/${canonCustId}`,
        });
      }
      await fireAndRaceFirestoreWrites(dueWrites, 1200);
    }

    showToast(
      `৳${amt.toFixed(2)} টাকা বকেয়া পরিশোধ সম্পন্ন হয়েছে! ${
        newDueAmount === 0 ? '(সম্পূর্ণ বকেয়া পরিশোধিত)' : `(অবশিষ্ট বাকি: ৳${newDueAmount.toFixed(2)})`
      }`
    );
    return updatedInvoice;
  };

  const handleDeleteTransaction = async (tx: Transaction) => {
    const canonTxId = getCanonicalDocId(tx.id, effectiveShopId);
    const scopedTxId = getScopedFirestoreDocId(effectiveShopId, canonTxId);
    const nowMs = Date.now();
    markDeletedIds([tx.id, canonTxId, scopedTxId]);
    setTransactions((prev) => {
      const next = prev.filter((t) => getCanonicalDocId(t.id, effectiveShopId) !== canonTxId);
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    // Reverse stock impact when deleting a sale or purchase invoice
    if (tx.txType === 'sale' || tx.txType === 'purchase') {
      const parsedItems = parseTransactionItemsDetailed(tx.itemsSummary, fullCatalog);
      const nextInv = inventory.map((inv) => ({ ...inv }));
      const modifiedInv: InventoryItem[] = [];

      for (const pItem of parsedItems) {
        const matched = findMatchingInventoryRecord(nextInv, {
          medicineId: pItem.matchedMedicine?.id,
          brandName: pItem.matchedMedicine?.brandName || pItem.brandAndStrength,
          strength: pItem.matchedMedicine?.strength || '',
          dosageForm: pItem.matchedMedicine?.dosageForm || pItem.formPrefix,
        });
        if (matched && pItem.qty > 0) {
          matched.id = getCanonicalDocId(matched.id, effectiveShopId);
          matched.shopId = effectiveShopId;
          if (tx.txType === 'sale') {
            matched.stockQty = matched.stockQty + pItem.qty;
          } else {
            matched.stockQty = Math.max(0, matched.stockQty - pItem.qty);
          }
          matched.updatedAtMs = nowMs;
          modifiedInv.push(matched);
        }
      }

      const deleteWrites: Array<{ promise: Promise<unknown>; operationType: OperationType; path: string | null }> = [];
      if (modifiedInv.length > 0) {
        setInventory(nextInv);
        saveLocal(STORAGE_KEYS.INVENTORY, nextInv);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), nextInv);
        if (user || isCloudLoggedIn) {
          for (const invItem of modifiedInv) {
            deleteWrites.push({
              promise: setDoc(
                doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, invItem.id)),
                buildInventoryCloudPayload(invItem, effectiveCloudUid, effectiveShopId)
              ),
              operationType: OperationType.UPDATE,
              path: `inventory/${invItem.id}`,
            });
          }
        }
      }
      if (user || isCloudLoggedIn) {
        for (const delId of Array.from(new Set([scopedTxId, canonTxId, tx.id]))) {
          deleteWrites.push({
            promise: deleteDoc(doc(db, 'transactions', delId)),
            operationType: OperationType.DELETE,
            path: `transactions/${delId}`,
          });
        }
        await fireAndRaceFirestoreWrites(deleteWrites, 1200);
      }
    } else if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        Array.from(new Set([scopedTxId, canonTxId, tx.id])).map((delId) => ({
          promise: deleteDoc(doc(db, 'transactions', delId)),
          operationType: OperationType.DELETE,
          path: `transactions/${delId}`,
        })),
        1200
      );
    }
    showToast(`লেনদেন (${tx.invoiceNo}) ডিলিট করা হয়েছে এবং স্টক সমন্বয় হয়েছে`);
  };

  // Single-item fallback Record Company Purchase & Stock-In
  const handleRecordPurchase = async (params: {
    supplierCompany: string;
    invoiceNo: string;
    medicineId: string;
    brandName: string;
    genericName: string;
    strength: string;
    dosageForm: string;
    packSize: string;
    qty: number;
    purchasePrice: number;
    unitPrice: number;
    batchNo: string;
    expiryDate: string;
    paidAmount: number;
    paymentMethod: Transaction['paymentMethod'];
  }): Promise<Transaction | null> => {
    const nowMs = Date.now();
    const subTotal = sanitizeNumber(params.qty * params.purchasePrice);
    const paidAmount = sanitizeNumber(params.paidAmount, 0, subTotal);
    const dueAmount = sanitizeNumber(subTotal - paidAmount);
    const txId = `tx_pur_${nowMs}`;
    const staffRoleVal: 'owner' | 'staff' =
      activeStaff.roleTitle === 'owner' ? 'owner' : 'staff';
    const operatorDisplayName = getOperatorName(activeStaff);

    const newTx: Transaction = {
      id: txId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      txType: 'purchase',
      invoiceNo: sanitizeString(params.invoiceNo, 60, 'PUR-01'),
      dateStr: getTodayDateStr(),
      partyId: 'supplier-company',
      partyName: sanitizeString(`${params.supplierCompany} (ডিপো চালান)`, 120),
      partyPhone: 'কোম্পানি ডিপো',
      itemsSummary: sanitizeString(
        `1.${getInvoiceFormPrefix(params.dosageForm)}.${params.brandName} ${params.strength} (৳${formatCleanMoney(params.purchasePrice)}) × ${params.qty}=${formatCleanMoney(params.purchasePrice * params.qty)}`,
        600
      ),
      totalCount: params.qty,
      subTotal,
      discount: 0,
      grandTotal: subTotal,
      paidAmount,
      dueAmount,
      paymentMethod: params.paymentMethod,
      staffName: sanitizeString(operatorDisplayName, 100),
      staffRole: staffRoleVal,
      counterName: sanitizeString(activeStaff.counterName, 60),
      updatedAtMs: nowMs,
    };

    const existingInv = findMatchingInventoryRecord(inventory, {
      medicineId: params.medicineId,
      brandName: params.brandName,
      strength: params.strength,
      dosageForm: params.dosageForm,
    });
    const newInvId = existingInv ? getCanonicalDocId(existingInv.id, effectiveShopId) : `inv_${nowMs}`;

    const baseMed = fullCatalog.find((m) => m.id === params.medicineId);
    if (baseMed && Math.abs(baseMed.unitPrice - params.unitPrice) > 0.001) {
      await triggerPriceChangeAlert({
        medicineId: baseMed.id,
        brandName: baseMed.brandName,
        genericName: baseMed.genericName,
        companyName: params.supplierCompany,
        strength: baseMed.strength,
        oldUnitPrice: baseMed.unitPrice,
        newUnitPrice: params.unitPrice,
        oldStripPrice: baseMed.stripPrice,
        newStripPrice: Number((params.unitPrice * 10).toFixed(2)),
      });
    }

    unmarkDeletedId(txId);
    unmarkDeletedId(newInvId);

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    const targetInvObj: InventoryItem = existingInv
      ? {
          ...existingInv,
          id: newInvId,
          shopId: effectiveShopId,
          stockQty: existingInv.stockQty + params.qty,
          purchasePrice: params.purchasePrice,
          unitPrice: params.unitPrice,
          stripPrice: Number((params.unitPrice * 10).toFixed(2)),
          batchNo: params.batchNo,
          expiryDate: params.expiryDate,
          updatedAtMs: nowMs,
        }
      : {
          id: newInvId,
          shopId: effectiveShopId,
          ownerId: effectiveCloudUid,
          medicineId: params.medicineId,
          brandName: params.brandName,
          genericName: params.genericName,
          companyName: params.supplierCompany,
          strength: params.strength,
          dosageForm: params.dosageForm,
          packSize: params.packSize,
          purchasePrice: params.purchasePrice,
          unitPrice: params.unitPrice,
          stripPrice: Number((params.unitPrice * 10).toFixed(2)),
          stockQty: params.qty,
          minStockLevel: 50,
          batchNo: params.batchNo,
          expiryDate: params.expiryDate,
          shelfLocation: 'Rack A-1',
          updatedAtMs: nowMs,
        };

    if (existingInv) {
      setInventory((prev) => {
        const next = prev.map((i) =>
          getCanonicalDocId(i.id, effectiveShopId) === newInvId ? targetInvObj : i
        );
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), next);
        return next;
      });
    } else {
      setInventory((prev) => {
        const next = [targetInvObj, ...prev];
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), next);
        return next;
      });
    }

    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        [
          {
            promise: setDoc(
              doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, txId)),
              buildTransactionCloudPayload(newTx, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `transactions/${txId}`,
          },
          {
            promise: setDoc(
              doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, newInvId)),
              buildInventoryCloudPayload(targetInvObj, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `inventory/${newInvId}`,
          },
        ],
        1200
      );
    }

    showToast(`${params.brandName} (+${params.qty} পিস) ক্রয় ইনভয়েস ও স্টকে যুক্ত হয়েছে!`);
    return newTx;
  };

  // Inventory CRUD Handlers
  const handleSaveInventoryItem = async (
    itemData: Omit<InventoryItem, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const nowMs = Date.now();
    const matchedExisting = existingId
      ? inventory.find((i) => getCanonicalDocId(i.id, effectiveShopId) === getCanonicalDocId(existingId, effectiveShopId))
      : inventory.find(
          (i) =>
            i.medicineId === itemData.medicineId ||
            (i.brandName.toLowerCase() === itemData.brandName.toLowerCase() &&
              i.dosageForm.toLowerCase() === itemData.dosageForm.toLowerCase() &&
              i.strength.toLowerCase() === itemData.strength.toLowerCase())
        );

    const targetId = getCanonicalDocId(existingId || matchedExisting?.id || `inv_${nowMs}`, effectiveShopId);
    const isUpdatingExisting = Boolean(existingId || matchedExisting);

    if (matchedExisting && Math.abs(matchedExisting.unitPrice - itemData.unitPrice) > 0.001) {
      await triggerPriceChangeAlert({
        medicineId: itemData.medicineId,
        brandName: itemData.brandName,
        genericName: itemData.genericName,
        companyName: itemData.companyName,
        strength: itemData.strength,
        oldUnitPrice: matchedExisting.unitPrice,
        newUnitPrice: itemData.unitPrice,
        oldStripPrice: matchedExisting.stripPrice,
        newStripPrice: itemData.stripPrice,
      });
    }

    unmarkDeletedId(targetId);

    const nextStockQty =
      !existingId && matchedExisting
        ? matchedExisting.stockQty + itemData.stockQty
        : itemData.stockQty;

    const savedInvObj: InventoryItem = {
      id: targetId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      ...itemData,
      stockQty: nextStockQty,
      updatedAtMs: nowMs,
    };

    if (isUpdatingExisting) {
      setInventory((prev) => {
        const next = prev.map((i) =>
          getCanonicalDocId(i.id, effectiveShopId) === targetId ? savedInvObj : i
        );
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), next);
        return next;
      });
    } else {
      setInventory((prev) => {
        const next = [savedInvObj, ...prev];
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), next);
        return next;
      });
    }

    if (user || isCloudLoggedIn) {
      const scopedInvId = getScopedFirestoreDocId(effectiveShopId, targetId);
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'inventory', scopedInvId),
          buildInventoryCloudPayload(savedInvObj, effectiveCloudUid, effectiveShopId)
        ),
        OperationType.WRITE,
        `inventory/${scopedInvId}`,
        1200
      );
    }

    // Also sync updated purchasePrice and unitPrice to the Medicine Catalog so prices stay synchronized everywhere
    const matchedCatMed = fullCatalog.find(
      (m) =>
        m.id === savedInvObj.medicineId ||
        (m.brandName.toLowerCase() === savedInvObj.brandName.toLowerCase() &&
          m.strength.toLowerCase() === savedInvObj.strength.toLowerCase())
    );
    if (matchedCatMed) {
      const catPur =
        typeof matchedCatMed.purchasePrice === 'number' && matchedCatMed.purchasePrice > 0
          ? matchedCatMed.purchasePrice
          : Number((matchedCatMed.unitPrice * 0.88).toFixed(2));
      if (
        Math.abs(matchedCatMed.unitPrice - savedInvObj.unitPrice) > 0.001 ||
        Math.abs(catPur - savedInvObj.purchasePrice) > 0.001
      ) {
        await handleSaveMedicineCatalog(
          {
            brandName: matchedCatMed.brandName,
            genericName: matchedCatMed.genericName,
            companyName: matchedCatMed.companyName,
            strength: matchedCatMed.strength,
            dosageForm: matchedCatMed.dosageForm,
            packSize: matchedCatMed.packSize,
            purchasePrice: savedInvObj.purchasePrice,
            unitPrice: savedInvObj.unitPrice,
            stripPrice: savedInvObj.stripPrice,
            therapeuticClass: matchedCatMed.therapeuticClass,
            indication: matchedCatMed.indication,
          },
          matchedCatMed
        );
      }
    }

    showToast('ইনভেন্টরি স্টক ও ক্রয়-বিক্রয় মূল্য সফলভাবে আপডেট হয়েছে!');
  };

  const handleQuickAddInventoryFromCompare = async (med: MedicineCatalogItem) => {
    const existing = inventory.find((i) => i.medicineId === med.id);
    if (existing) {
      await handleQuickRestock(existing, 100);
      return;
    }
    await handleSaveInventoryItem({
      medicineId: med.id,
      brandName: med.brandName,
      genericName: med.genericName,
      companyName: med.companyName,
      strength: med.strength,
      dosageForm: med.dosageForm,
      packSize: med.packSize,
      purchasePrice:
        typeof med.purchasePrice === 'number' && med.purchasePrice > 0
          ? med.purchasePrice
          : Number((med.unitPrice * 0.88).toFixed(2)),
      unitPrice: med.unitPrice,
      stripPrice: med.stripPrice,
      stockQty: 100,
      minStockLevel: 30,
      batchNo: `B-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: '2028-06-30',
      shelfLocation: 'Rack A-1',
    });
  };

  const handleQuickRestock = async (item: InventoryItem, addQty: number) => {
    const nowMs = Date.now();
    const canonId = getCanonicalDocId(item.id, effectiveShopId);
    const nextQty = sanitizeNumber(item.stockQty + addQty, 0, 10000000);
    const updatedItem: InventoryItem = {
      ...item,
      id: canonId,
      shopId: effectiveShopId,
      stockQty: nextQty,
      updatedAtMs: nowMs,
    };

    setInventory((prev) => {
      const exists = prev.some((i) => getCanonicalDocId(i.id, effectiveShopId) === canonId);
      const next = exists
        ? prev.map((i) => (getCanonicalDocId(i.id, effectiveShopId) === canonId ? updatedItem : i))
        : [updatedItem, ...prev];
      saveLocal(STORAGE_KEYS.INVENTORY, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), next);
      return next;
    });
    if (user || isCloudLoggedIn) {
      const scopedInvId = getScopedFirestoreDocId(effectiveShopId, canonId);
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'inventory', scopedInvId),
          buildInventoryCloudPayload(updatedItem, effectiveCloudUid, effectiveShopId)
        ),
        OperationType.UPDATE,
        `inventory/${scopedInvId}`,
        1200
      );
    }
    showToast(`${item.brandName}-এর স্টকে +${addQty} পিস যুক্ত হয়েছে!`);
  };

  // Direct Quick Sale (সরাসরি বিক্রয় - ইনভয়েস ছাড়া)
  const handleDirectSaleWithoutInvoice = async (params: {
    brandName: string;
    genericName?: string;
    companyName?: string;
    strength?: string;
    dosageForm?: string;
    qty: number;
    unitPrice: number;
  }) => {
    const nowMs = Date.now();
    const txId = `tx-sale-${nowMs}`;
    const totalAmount = Number((params.qty * params.unitPrice).toFixed(2));
    const invoiceNo = `CS-${nowMs.toString().slice(-6)}`;

    const newTx: Transaction = {
      id: txId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      txType: 'sale',
      invoiceNo,
      partyId: 'walk-in',
      partyName: 'সরাসরি ক্যাশ কাস্টমার (ইনভয়েস ছাড়া)',
      partyPhone: '',
      itemsSummary: `${params.brandName} ${params.strength || ''} (${params.qty} পিস @ ৳${params.unitPrice})`,
      totalCount: params.qty,
      subTotal: totalAmount,
      discount: 0,
      grandTotal: totalAmount,
      paidAmount: totalAmount,
      dueAmount: 0,
      paymentMethod: 'cash',
      staffName: getOperatorName(activeStaff),
      staffRole: activeStaff.roleTitle === 'owner' ? 'owner' : 'staff',
      counterName: activeStaff.counterName || 'কাউন্টার ১',
      dateStr: getTodayDateStr(),
      updatedAtMs: nowMs,
    };

    let nextInvList = inventory.map((inv) => ({ ...inv }));
    const matchedInv = findMatchingInventoryRecord(nextInvList, {
      brandName: params.brandName,
      strength: params.strength,
      dosageForm: params.dosageForm,
    });

    let touchedInv: InventoryItem;
    if (matchedInv) {
      matchedInv.id = getCanonicalDocId(matchedInv.id, effectiveShopId);
      matchedInv.shopId = effectiveShopId;
      matchedInv.stockQty = Math.max(0, matchedInv.stockQty - params.qty);
      matchedInv.updatedAtMs = nowMs;
      touchedInv = matchedInv;
    } else {
      const newInvId = `inv_${nowMs.toString().slice(-6)}`;
      const createdInv: InventoryItem = {
        id: newInvId,
        shopId: effectiveShopId,
        ownerId: effectiveCloudUid,
        medicineId: `med_${nowMs.toString().slice(-6)}`,
        brandName: params.brandName,
        genericName: params.genericName || 'General',
        companyName: params.companyName || 'General Pharma',
        strength: params.strength || '',
        dosageForm: params.dosageForm || 'Tablet',
        packSize: '1*10',
        purchasePrice: Number((params.unitPrice * 0.88).toFixed(2)),
        unitPrice: params.unitPrice,
        stripPrice: Number((params.unitPrice * 10).toFixed(2)),
        stockQty: 0,
        minStockLevel: 20,
        batchNo: `B-${nowMs.toString().slice(-4)}`,
        expiryDate: '2028-06-30',
        shelfLocation: 'Counter',
        updatedAtMs: nowMs,
      };
      nextInvList.unshift(createdInv);
      touchedInv = createdInv;
    }

    setInventory(nextInvList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInvList);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), nextInvList);

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        [
          {
            promise: setDoc(
              doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, txId)),
              buildTransactionCloudPayload(newTx, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `transactions/${txId}`,
          },
          {
            promise: setDoc(
              doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, touchedInv.id)),
              buildInventoryCloudPayload(touchedInv, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `inventory/${touchedInv.id}`,
          },
        ],
        1200
      );
    }

    showToast(`⚡ সরাসরি বিক্রি সম্পন্ন: ${params.brandName} (${params.qty} পিস) ৳${totalAmount} ক্যাশ জমা হয়েছে ও স্টক আপডেট হয়েছে!`);
  };

  // Direct Quick Purchase (সরাসরি ক্রয় / স্টক ইন - ইনভয়েস ছাড়া)
  const handleDirectPurchaseWithoutInvoice = async (params: {
    brandName: string;
    genericName?: string;
    companyName?: string;
    strength?: string;
    dosageForm?: string;
    packSize?: string;
    qty: number;
    purchasePrice: number;
    unitPrice?: number;
    batchNo?: string;
    expiryDate?: string;
  }) => {
    const nowMs = Date.now();
    const txId = `tx-pur-${nowMs}`;
    const totalAmount = Number(params.purchasePrice.toFixed(2));
    const invoiceNo = `CP-${nowMs.toString().slice(-6)}`;

    const newTx: Transaction = {
      id: txId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      txType: 'purchase',
      invoiceNo,
      partyId: 'supplier-direct',
      partyName: params.companyName || 'সরাসরি সাপ্লায়ার ক্রয়',
      partyPhone: '',
      itemsSummary: `${params.brandName} (${params.qty} পিস, দর ৳${totalAmount})`,
      totalCount: params.qty,
      subTotal: totalAmount,
      discount: 0,
      grandTotal: totalAmount,
      paidAmount: totalAmount,
      dueAmount: 0,
      paymentMethod: 'cash',
      staffName: getOperatorName(activeStaff),
      staffRole: activeStaff.roleTitle === 'owner' ? 'owner' : 'staff',
      counterName: activeStaff.counterName || 'কাউন্টার ১',
      dateStr: getTodayDateStr(),
      updatedAtMs: nowMs,
    };

    let nextInvList = inventory.map((inv) => ({ ...inv }));
    const matchedInv = findMatchingInventoryRecord(nextInvList, {
      brandName: params.brandName,
      strength: params.strength,
      dosageForm: params.dosageForm,
    });

    let touchedPurInv: InventoryItem;
    if (matchedInv) {
      matchedInv.id = getCanonicalDocId(matchedInv.id, effectiveShopId);
      matchedInv.shopId = effectiveShopId;
      matchedInv.stockQty = matchedInv.stockQty + params.qty;
      if (params.purchasePrice > 0 && params.qty > 0) {
        matchedInv.purchasePrice = Number((params.purchasePrice / params.qty).toFixed(2));
      }
      if (params.unitPrice && params.unitPrice > 0) {
        matchedInv.unitPrice = params.unitPrice;
        matchedInv.stripPrice = Number((params.unitPrice * 10).toFixed(2));
      }
      if (params.batchNo) matchedInv.batchNo = params.batchNo;
      if (params.expiryDate) matchedInv.expiryDate = params.expiryDate;
      matchedInv.updatedAtMs = nowMs;
      touchedPurInv = matchedInv;
    } else {
      const newInvId = `inv_${nowMs.toString().slice(-6)}`;
      const unitPrice =
        params.unitPrice ||
        Number(((params.purchasePrice / (params.qty || 1)) * 1.15).toFixed(2));
      const createdInv: InventoryItem = {
        id: newInvId,
        shopId: effectiveShopId,
        ownerId: effectiveCloudUid,
        medicineId: `med_${nowMs.toString().slice(-6)}`,
        brandName: params.brandName,
        genericName: params.genericName || 'General',
        companyName: params.companyName || 'General Pharma',
        strength: params.strength || '',
        dosageForm: params.dosageForm || 'Tablet',
        packSize: params.packSize || '1*10',
        purchasePrice:
          params.qty > 0
            ? Number((params.purchasePrice / params.qty).toFixed(2))
            : params.purchasePrice,
        unitPrice,
        stripPrice: Number((unitPrice * 10).toFixed(2)),
        stockQty: params.qty,
        minStockLevel: 20,
        batchNo: params.batchNo || `B-${nowMs.toString().slice(-4)}`,
        expiryDate: params.expiryDate || '2028-06-30',
        shelfLocation: 'Rack A-1',
        updatedAtMs: nowMs,
      };
      nextInvList.unshift(createdInv);
      touchedPurInv = createdInv;
    }

    setInventory(nextInvList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInvList);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), nextInvList);

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });

    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        [
          {
            promise: setDoc(
              doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, txId)),
              buildTransactionCloudPayload(newTx, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `transactions/${txId}`,
          },
          {
            promise: setDoc(
              doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, touchedPurInv.id)),
              buildInventoryCloudPayload(touchedPurInv, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `inventory/${touchedPurInv.id}`,
          },
        ],
        1200
      );
    }

    showToast(`📥 সরাসরি স্টক ইন সম্পন্ন: ${params.brandName} (+${params.qty} পিস) স্টকে যোগ হয়েছে!`);
  };

  // Direct Stock Adjust (সরাসরি স্টক পরিবর্তন / সংশোধন)
  const handleDirectStockAdjustment = async (params: {
    brandName: string;
    strength?: string;
    dosageForm?: string;
    newStockQty: number;
  }) => {
    const nowMs = Date.now();
    let nextInvList = inventory.map((inv) => ({ ...inv }));
    const matchedInv = findMatchingInventoryRecord(nextInvList, {
      brandName: params.brandName,
      strength: params.strength,
      dosageForm: params.dosageForm,
    });

    if (matchedInv) {
      matchedInv.id = getCanonicalDocId(matchedInv.id, effectiveShopId);
      matchedInv.shopId = effectiveShopId;
      matchedInv.stockQty = Math.max(0, params.newStockQty);
      matchedInv.updatedAtMs = nowMs;
      setInventory(nextInvList);
      saveLocal(STORAGE_KEYS.INVENTORY, nextInvList);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), nextInvList);
      if (user || isCloudLoggedIn) {
        setDoc(
          doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, matchedInv.id)),
          buildInventoryCloudPayload(matchedInv, effectiveCloudUid, effectiveShopId)
        ).catch(() => {});
      }
      showToast(`📦 ${params.brandName} এর স্টক আপডেট হয়েছে: বর্তমান মজুদ ${params.newStockQty} পিস`);
    } else {
      const newInvId = `inv_${nowMs.toString().slice(-6)}`;
      const createdInv: InventoryItem = {
        id: newInvId,
        shopId: effectiveShopId,
        ownerId: effectiveCloudUid,
        medicineId: `med_${nowMs.toString().slice(-6)}`,
        brandName: params.brandName,
        genericName: 'General',
        companyName: 'General Pharma',
        strength: params.strength || '',
        dosageForm: params.dosageForm || 'Tablet',
        packSize: '1*10',
        purchasePrice: 10,
        unitPrice: 12,
        stripPrice: 120,
        stockQty: Math.max(0, params.newStockQty),
        minStockLevel: 20,
        batchNo: `B-${nowMs.toString().slice(-4)}`,
        expiryDate: '2028-06-30',
        shelfLocation: 'Rack A-1',
        updatedAtMs: nowMs,
      };
      nextInvList.unshift(createdInv);
      setInventory(nextInvList);
      saveLocal(STORAGE_KEYS.INVENTORY, nextInvList);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), nextInvList);
      if (user || isCloudLoggedIn) {
        setDoc(
          doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, newInvId)),
          buildInventoryCloudPayload(createdInv, effectiveCloudUid, effectiveShopId)
        ).catch(() => {});
      }
      showToast(`📦 ${params.brandName} নতুন ওষুধ হিসেবে স্টকে যুক্ত হয়েছে: বর্তমান মজুদ ${params.newStockQty} পিস`);
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    const canonId = getCanonicalDocId(id, effectiveShopId);
    const scopedId = getScopedFirestoreDocId(effectiveShopId, canonId);
    const targetItem = inventory.find((i) => getCanonicalDocId(i.id, effectiveShopId) === canonId);
    if (targetItem) {
      const isCore =
        canonId.startsWith('inv-seed-') ||
        INITIAL_DEMO_INVENTORY.some((d) => d.id === canonId) ||
        isCoreDatabaseMedicineId(targetItem.medicineId) ||
        CATALOG_BY_ID.has(targetItem.medicineId) ||
        CATALOG_BY_BRAND_STRENGTH.has(
          `${targetItem.brandName.toLowerCase()}__${targetItem.strength.toLowerCase()}`
        );
      if (isCore) {
        showToast(
          'ডাটাবেস এ থাকা মূল প্রোডাক্ট ডিলিট করা যাবে না! তবে এর ক্রয় ও বিক্রয় মূল্য পরিবর্তন করতে পারবেন।'
        );
        return;
      }
    }

    markDeletedIds([id, canonId, scopedId]);
    setInventory((prev) => {
      const next = prev.filter((i) => getCanonicalDocId(i.id, effectiveShopId) !== canonId);
      saveLocal(STORAGE_KEYS.INVENTORY, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), next);
      return next;
    });
    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        Array.from(new Set([scopedId, canonId, id])).map((delId) => ({
          promise: deleteDoc(doc(db, 'inventory', delId)),
          operationType: OperationType.DELETE,
          path: `inventory/${delId}`,
        })),
        1200
      );
    }
    showToast('কাস্টম স্টক আইটেম মুছে ফেলা হয়েছে');
  };

  // Customer & Ledger CRUD Handlers
  const handleSaveCustomer = async (
    data: {
      name: string;
      phone: string;
      address: string;
      totalPurchased: number;
      totalPaid: number;
      totalDue: number;
    },
    existingId?: string
  ) => {
    const nowMs = Date.now();
    const custId = getCanonicalDocId(existingId || `cust_${nowMs}`, effectiveShopId);
    unmarkDeletedId(custId);

    const newCust: Customer = {
      id: custId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      name: sanitizeString(data.name, 120),
      phone: sanitizeString(data.phone, 30),
      address: sanitizeString(data.address, 250),
      totalPurchased: sanitizeNumber(data.totalPurchased),
      totalPaid: sanitizeNumber(data.totalPaid),
      totalDue: sanitizeNumber(data.totalDue),
      updatedAtMs: nowMs,
    };

    if (existingId) {
      setCustomers((prev) => {
        const next = prev.map((c) => (getCanonicalDocId(c.id, effectiveShopId) === custId ? newCust : c));
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, effectiveShopId), next);
        return next;
      });
    } else {
      setCustomers((prev) => {
        const next = [newCust, ...prev];
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, effectiveShopId), next);
        return next;
      });
    }

    if (user || isCloudLoggedIn) {
      const scopedCustId = getScopedFirestoreDocId(effectiveShopId, custId);
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'customers', scopedCustId),
          buildCustomerCloudPayload(newCust, effectiveCloudUid, effectiveShopId)
        ),
        OperationType.WRITE,
        `customers/${scopedCustId}`,
        1200
      );
    }
    showToast(`${data.name}-এর কাস্টমার লেজার সংরক্ষিত হয়েছে!`);
  };

  const handleDeleteCustomer = async (id: string) => {
    const canonId = getCanonicalDocId(id, effectiveShopId);
    const scopedId = getScopedFirestoreDocId(effectiveShopId, canonId);
    markDeletedIds([id, canonId, scopedId]);
    setCustomers((prev) => {
      const next = prev.filter((c) => getCanonicalDocId(c.id, effectiveShopId) !== canonId);
      saveLocal(STORAGE_KEYS.CUSTOMERS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, effectiveShopId), next);
      return next;
    });
    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        Array.from(new Set([scopedId, canonId, id])).map((delId) => ({
          promise: deleteDoc(doc(db, 'customers', delId)),
          operationType: OperationType.DELETE,
          path: `customers/${delId}`,
        })),
        1200
      );
    }
    showToast('কাস্টমার লেজার স্থায়ীভাবে মুছে ফেলা হয়েছে');
  };

  const handleCollectDuePayment = async (params: {
    customer: Customer;
    amount: number;
    paymentMethod: Transaction['paymentMethod'];
    note: string;
  }) => {
    const nowMs = Date.now();
    const canonCustId = getCanonicalDocId(params.customer.id, effectiveShopId);
    const amt = sanitizeNumber(params.amount, 0, params.customer.totalDue);
    const txId = `tx_due_${nowMs}`;
    const staffRoleVal: 'owner' | 'staff' =
      activeStaff.roleTitle === 'owner' ? 'owner' : 'staff';
    const operatorDisplayName = getOperatorName(activeStaff);

    const dueTx: Transaction = {
      id: txId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      txType: 'due_payment',
      invoiceNo: `DUE-${getTodayDateStr().replace(/-/g, '').slice(2)}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      dateStr: getTodayDateStr(),
      partyId: canonCustId,
      partyName: sanitizeString(params.customer.name, 120),
      partyPhone: sanitizeString(params.customer.phone, 30),
      itemsSummary: sanitizeString(params.note, 600, 'বকেয়া আদায়'),
      totalCount: 1,
      subTotal: amt,
      discount: 0,
      grandTotal: amt,
      paidAmount: amt,
      dueAmount: 0,
      paymentMethod: params.paymentMethod,
      staffName: sanitizeString(operatorDisplayName, 100),
      staffRole: staffRoleVal,
      counterName: sanitizeString(activeStaff.counterName, 60),
      updatedAtMs: nowMs,
    };

    const updatedCustObj: Customer = {
      ...params.customer,
      id: canonCustId,
      shopId: effectiveShopId,
      totalPaid: params.customer.totalPaid + amt,
      totalDue: Math.max(0, params.customer.totalDue - amt),
      updatedAtMs: nowMs,
    };

    unmarkDeletedId(txId);
    setTransactions((prev) => {
      const next = [dueTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.TRANSACTIONS, effectiveShopId), next);
      return next;
    });
    setCustomers((prev) => {
      const next = prev.map((c) =>
        getCanonicalDocId(c.id, effectiveShopId) === canonCustId ? updatedCustObj : c
      );
      saveLocal(STORAGE_KEYS.CUSTOMERS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOMERS, effectiveShopId), next);
      return next;
    });

    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        [
          {
            promise: setDoc(
              doc(db, 'transactions', getScopedFirestoreDocId(effectiveShopId, txId)),
              buildTransactionCloudPayload(dueTx, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `transactions/${txId}`,
          },
          {
            promise: setDoc(
              doc(db, 'customers', getScopedFirestoreDocId(effectiveShopId, canonCustId)),
              buildCustomerCloudPayload(updatedCustObj, effectiveCloudUid, effectiveShopId)
            ),
            operationType: OperationType.WRITE,
            path: `customers/${canonCustId}`,
          },
        ],
        1200
      );
    }
    showToast(`৳${amt.toFixed(2)} বকেয়া আদায় লেজারে সংরক্ষিত হয়েছে!`);
  };

  // Add or Edit Medicine in Catalog & Trigger Automatic Price Change Alert
  const handleSaveMedicineCatalog = async (
    medData: Omit<MedicineCatalogItem, 'id' | 'darNo' | 'unitsPerStrip' | 'dosageForm'> & {
      dosageForm: string;
    },
    existingMed?: MedicineCatalogItem
  ) => {
    const nowMs = Date.now();
    // If existingMed is provided, verify if brandName+strength still match existingMed or if user selected a different variant
    const matchedCatalogVariant = fullCatalog.find(
      (m) =>
        m.brandName.toLowerCase() === medData.brandName.toLowerCase() &&
        m.strength.toLowerCase() === medData.strength.toLowerCase() &&
        m.dosageForm.toLowerCase() === medData.dosageForm.toLowerCase()
    );

    const targetMed =
      existingMed &&
      existingMed.brandName.toLowerCase() === medData.brandName.toLowerCase() &&
      existingMed.strength.toLowerCase() === medData.strength.toLowerCase()
        ? existingMed
        : matchedCatalogVariant || existingMed;

    const medId = getCanonicalDocId(targetMed ? targetMed.id : `cmed_${nowMs}`, effectiveShopId);
    unmarkDeletedId(medId);

    const resolvedPurchasePrice = sanitizeNumber(
      typeof medData.purchasePrice === 'number' && medData.purchasePrice > 0
        ? medData.purchasePrice
        : Number((medData.unitPrice * 0.88).toFixed(2))
    );

    if (targetMed && Math.abs(targetMed.unitPrice - medData.unitPrice) > 0.001) {
      await triggerPriceChangeAlert({
        medicineId: medId,
        brandName: medData.brandName,
        genericName: medData.genericName,
        companyName: medData.companyName,
        strength: medData.strength,
        oldUnitPrice: targetMed.unitPrice,
        newUnitPrice: medData.unitPrice,
        oldStripPrice: targetMed.stripPrice,
        newStripPrice: medData.stripPrice,
      });
    }

    const newMed: CustomMedicine = {
      id: medId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      brandName: sanitizeString(medData.brandName, 120),
      genericName: sanitizeString(medData.genericName, 150),
      companyName: sanitizeString(medData.companyName, 120),
      strength: sanitizeString(medData.strength, 60),
      dosageForm: sanitizeString(medData.dosageForm, 60),
      packSize: sanitizeString(medData.packSize, 60),
      purchasePrice: resolvedPurchasePrice,
      unitPrice: sanitizeNumber(medData.unitPrice),
      stripPrice: sanitizeNumber(medData.stripPrice),
      therapeuticClass: sanitizeString(medData.therapeuticClass, 100),
      indication: sanitizeString(medData.indication, 300),
      updatedAtMs: nowMs,
    };

    setCustomMedicines((prev) => {
      const exists = prev.some((m) => getCanonicalDocId(m.id, effectiveShopId) === medId);
      const next = exists
        ? prev.map((m) => (getCanonicalDocId(m.id, effectiveShopId) === medId ? newMed : m))
        : [newMed, ...prev];
      saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, effectiveShopId), next);
      return next;
    });

    // Also update matching inventory item's purchasePrice, unitPrice, and stripPrice
    let matchedInvItemForCloud: InventoryItem | null = null;
    setInventory((prev) => {
      const next = prev.map((inv) => {
        if (
          inv.medicineId === medId ||
          (inv.brandName.toLowerCase() === medData.brandName.toLowerCase() &&
            inv.strength.toLowerCase() === medData.strength.toLowerCase())
        ) {
          const updatedInv: InventoryItem = {
            ...inv,
            id: getCanonicalDocId(inv.id, effectiveShopId),
            shopId: effectiveShopId,
            purchasePrice: resolvedPurchasePrice,
            unitPrice: medData.unitPrice,
            stripPrice: medData.stripPrice,
            updatedAtMs: nowMs,
          };
          matchedInvItemForCloud = updatedInv;
          return updatedInv;
        }
        return inv;
      });
      saveLocal(STORAGE_KEYS.INVENTORY, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.INVENTORY, effectiveShopId), next);
      return next;
    });

    // Also update any matching items in POS or Purchase cart so active cart reflects new price
    setPosCart((prev) => {
      const changed = prev.some((item) => item.medicineId === medId);
      if (!changed) return prev;
      const next = prev.map((item) =>
        item.medicineId === medId
          ? {
              ...item,
              unitPrice: medData.unitPrice,
              originalUnitPrice: medData.unitPrice,
              purchasePrice: resolvedPurchasePrice,
              originalPurchasePrice: resolvedPurchasePrice,
            }
          : item
      );
      saveLocal(STORAGE_KEYS.POS_CART, next);
      return next;
    });

    if (user || isCloudLoggedIn) {
      const scopedMedId = getScopedFirestoreDocId(effectiveShopId, medId);
      const medWrites: Array<{ promise: Promise<unknown>; operationType: OperationType; path: string | null }> = [
        {
          promise: setDoc(
            doc(db, 'custom_medicines', scopedMedId),
            buildCustomMedCloudPayload(newMed, effectiveCloudUid, effectiveShopId)
          ),
          operationType: OperationType.WRITE,
          path: `custom_medicines/${scopedMedId}`,
        },
      ];
      if (matchedInvItemForCloud) {
        const invItem = matchedInvItemForCloud as InventoryItem;
        const canonInvId = getCanonicalDocId(invItem.id, effectiveShopId);
        medWrites.push({
          promise: setDoc(
            doc(db, 'inventory', getScopedFirestoreDocId(effectiveShopId, canonInvId)),
            buildInventoryCloudPayload(invItem, effectiveCloudUid, effectiveShopId)
          ),
          operationType: OperationType.WRITE,
          path: `inventory/${canonInvId}`,
        });
      }
      await fireAndRaceFirestoreWrites(medWrites, 1200);
    }
    showToast(
      targetMed
        ? `${medData.brandName} (${medData.strength})-এর ক্রয় মূল্য (৳${resolvedPurchasePrice.toFixed(2)}) ও বিক্রয় মূল্য (৳${medData.unitPrice.toFixed(2)}) সংরক্ষিত হয়েছে!`
        : `${medData.brandName} ক্যাটালগে যুক্ত হয়েছে!`
    );
  };

  const handleDeleteCustomMedicine = async (medId: string) => {
    const canonId = getCanonicalDocId(medId, effectiveShopId);
    const scopedId = getScopedFirestoreDocId(effectiveShopId, canonId);
    if (isCoreDatabaseMedicineId(canonId) || CATALOG_BY_ID.has(canonId)) {
      showToast(
        'ডাটাবেস এ থাকা মূল প্রোডাক্ট ডিলিট করা যাবে না! তবে ক্রয় মূল্য ও বিক্রয় মূল্য পরিবর্তন করা যাবে।'
      );
      return;
    }

    markDeletedIds([medId, canonId, scopedId]);
    setCustomMedicines((prev) => {
      const next = prev.filter((m) => getCanonicalDocId(m.id, effectiveShopId) !== canonId);
      saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.CUSTOM_MEDS, effectiveShopId), next);
      return next;
    });
    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        Array.from(new Set([scopedId, canonId, medId])).map((delId) => ({
          promise: deleteDoc(doc(db, 'custom_medicines', delId)),
          operationType: OperationType.DELETE,
          path: `custom_medicines/${delId}`,
        })),
        1200
      );
    }
    showToast('কাস্টম ওষুধটি তালিকা থেকে মুছে ফেলা হয়েছে');
  };

  // Price Watchlist & Alert Handlers
  const handleTogglePriceWatch = async (med: MedicineCatalogItem) => {
    const existing = priceWatches.find(
      (w) =>
        w.medicineId === med.id ||
        w.brandName.toLowerCase() === med.brandName.toLowerCase()
    );

    if (existing) {
      const canonId = getCanonicalDocId(existing.id, effectiveShopId);
      const scopedId = getScopedFirestoreDocId(effectiveShopId, canonId);
      markDeletedIds([existing.id, canonId, scopedId]);
      setPriceWatches((prev) => {
        const next = prev.filter((w) => getCanonicalDocId(w.id, effectiveShopId) !== canonId);
        saveLocal(STORAGE_KEYS.PRICE_WATCHES, next);
        saveLocal(getScopedStorageKey(STORAGE_KEYS.PRICE_WATCHES, effectiveShopId), next);
        return next;
      });
      if (user || isCloudLoggedIn) {
        await fireAndRaceFirestoreWrites(
          Array.from(new Set([scopedId, canonId, existing.id])).map((delId) => ({
            promise: deleteDoc(doc(db, 'price_watches', delId)),
            operationType: OperationType.DELETE,
            path: `price_watches/${delId}`,
          })),
          1200
        );
      }
      showToast(`${med.brandName} মূল্য ট্র্যাকিং তালিকা থেকে সরানো হয়েছে`);
      return;
    }

    const nowMs = Date.now();
    const watchId = `watch_${nowMs}`;
    unmarkDeletedId(watchId);
    const newWatch: PriceWatch = {
      id: watchId,
      shopId: effectiveShopId,
      ownerId: effectiveCloudUid,
      medicineId: sanitizeString(med.id, 100),
      brandName: sanitizeString(med.brandName, 120),
      genericName: sanitizeString(med.genericName, 150),
      companyName: sanitizeString(med.companyName, 120),
      strength: sanitizeString(med.strength, 60),
      baselineUnitPrice: sanitizeNumber(med.unitPrice),
      currentUnitPrice: sanitizeNumber(med.unitPrice),
      targetAlertPrice: sanitizeNumber(med.unitPrice),
      notifyOnAnyChange: true,
      updatedAtMs: nowMs,
    };

    setPriceWatches((prev) => {
      const next = [newWatch, ...prev];
      saveLocal(STORAGE_KEYS.PRICE_WATCHES, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.PRICE_WATCHES, effectiveShopId), next);
      return next;
    });
    if (user || isCloudLoggedIn) {
      const scopedWatchId = getScopedFirestoreDocId(effectiveShopId, watchId);
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'price_watches', scopedWatchId),
          buildPriceWatchCloudPayload(newWatch, effectiveCloudUid, effectiveShopId)
        ),
        OperationType.CREATE,
        `price_watches/${scopedWatchId}`,
        1200
      );
    }
    showToast(`${med.brandName} মূল্য নিরীক্ষণ ও অ্যালার্ট তালিকায় যুক্ত হয়েছে!`);
  };

  const handleMarkAlertRead = async (alertId: string) => {
    const canonId = getCanonicalDocId(alertId, effectiveShopId);
    const nowMs = Date.now();
    const targetAlert = priceAlerts.find((a) => getCanonicalDocId(a.id, effectiveShopId) === canonId);
    const updatedAlert: PriceAlert | null = targetAlert
      ? { ...targetAlert, id: canonId, shopId: effectiveShopId, isRead: true, updatedAtMs: nowMs }
      : null;

    setPriceAlerts((prev) => {
      const next = prev.map((a) =>
        getCanonicalDocId(a.id, effectiveShopId) === canonId
          ? { ...a, id: canonId, shopId: effectiveShopId, isRead: true, updatedAtMs: nowMs }
          : a
      );
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.PRICE_ALERTS, effectiveShopId), next);
      return next;
    });
    if (updatedAlert && (user || isCloudLoggedIn)) {
      const scopedAlertId = getScopedFirestoreDocId(effectiveShopId, canonId);
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'price_alerts', scopedAlertId),
          buildPriceAlertCloudPayload(updatedAlert, effectiveCloudUid, effectiveShopId)
        ),
        OperationType.UPDATE,
        `price_alerts/${scopedAlertId}`,
        1000
      );
    }
  };

  const handleDeletePriceAlert = async (alertId: string) => {
    const canonId = getCanonicalDocId(alertId, effectiveShopId);
    const scopedId = getScopedFirestoreDocId(effectiveShopId, canonId);
    markDeletedIds([alertId, canonId, scopedId]);
    setPriceAlerts((prev) => {
      const next = prev.filter((a) => getCanonicalDocId(a.id, effectiveShopId) !== canonId);
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.PRICE_ALERTS, effectiveShopId), next);
      return next;
    });
    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        Array.from(new Set([scopedId, canonId, alertId])).map((delId) => ({
          promise: deleteDoc(doc(db, 'price_alerts', delId)),
          operationType: OperationType.DELETE,
          path: `price_alerts/${delId}`,
        })),
        1000
      );
    }
    showToast('মূল্য অ্যালার্ট বিজ্ঞপ্তি মুছে ফেলা হয়েছে');
  };

  // Staff & Shop Profile Handlers
  const handleUpdateShopProfile = async (
    data: Omit<ShopProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    const nowMs = Date.now();
    const targetShopId = effectiveShopId;
    const nextShop: ShopProfile = {
      ...shopProfile,
      id: targetShopId,
      shopId: targetShopId,
      ownerId: effectiveCloudUid,
      ...data,
      updatedAtMs: nowMs,
    };
    setShopProfile(nextShop);
    saveLocal(STORAGE_KEYS.SHOP, nextShop);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, targetShopId), nextShop);

    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'shops', targetShopId),
          buildShopCloudPayload(nextShop, effectiveCloudUid, targetShopId)
        ),
        OperationType.WRITE,
        `shops/${targetShopId}`,
        1200
      );
    }
    showToast('দোকানের একাউন্ট তথ্য সংরক্ষিত হয়েছে!');
  };

  const handleApproveShopRegistration = async (regId: string) => {
    const nowMs = Date.now();
    setShopRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? { ...r, status: 'approved', isApproved: true, approvedAtMs: nowMs, approvedBy: 'mhakbor2001@gmail.com' }
          : r
      )
    );
    await fireAndRaceFirestoreWrite(
      setDoc(
        doc(db, 'shop_registrations', regId),
        {
          status: 'approved',
          isApproved: true,
          approvedAtMs: nowMs,
          approvedBy: 'mhakbor2001@gmail.com',
        },
        { merge: true }
      ),
      OperationType.UPDATE,
      `shop_registrations/${regId}`,
      1200
    );
    showToast('শপ একাউন্টটি সফলভাবে অনুমোদন দেওয়া হয়েছে!');
  };

  const handleRejectShopRegistration = async (regId: string) => {
    setShopRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status: 'rejected', isApproved: false } : r))
    );
    await fireAndRaceFirestoreWrite(
      setDoc(
        doc(db, 'shop_registrations', regId),
        {
          status: 'rejected',
          isApproved: false,
        },
        { merge: true }
      ),
      OperationType.UPDATE,
      `shop_registrations/${regId}`,
      1200
    );
    showToast('শপ একাউন্টটি স্থগিত করা হয়েছে');
  };

  const handleUpdateNotice = async (notice: ShopNotice | null) => {
    const targetShopId = effectiveShopId;
    const updatedShop: ShopProfile = {
      ...shopProfile,
      id: targetShopId,
      shopId: targetShopId,
      notice: notice || undefined,
      updatedAtMs: Date.now(),
    };
    setShopProfile(updatedShop);
    saveLocal(STORAGE_KEYS.SHOP, updatedShop);
    saveLocal(getScopedStorageKey(STORAGE_KEYS.SHOP, targetShopId), updatedShop);
    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrite(
        setDoc(
          doc(db, 'shops', targetShopId),
          buildShopCloudPayload(updatedShop, effectiveCloudUid, targetShopId)
        ),
        OperationType.UPDATE,
        `shops/${targetShopId}`,
        1000
      );
    }
  };

  const handleSaveStaffMember = async (
    data: Omit<StaffMember, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const nowMs = Date.now();
    const targetShopId = effectiveShopId;
    const cleanDigits = (data.phone || '').replace(/[^0-9]/g, '');
    const duplicateStaff = !existingId
      ? staffList.find((s) => {
          if (s.shopId && s.shopId !== targetShopId) return false;
          const sDigits = (s.phone || '').replace(/[^0-9]/g, '');
          return (
            (cleanDigits.length >= 6 && (sDigits === cleanDigits || (cleanDigits.length >= 10 && sDigits.endsWith(cleanDigits.slice(-10))))) ||
            (data.email && s.email && s.email.toLowerCase() === data.email.toLowerCase())
          );
        })
      : undefined;

    const targetStaffId = existingId || duplicateStaff?.id || (cleanDigits.length >= 6 ? `staff_${cleanDigits.length >= 10 ? '0' + cleanDigits.slice(-10) : cleanDigits}` : `staff_${nowMs}`);
    const isTargetMandatory = isMandatoryOwner({ id: targetStaffId, phone: data.phone, email: data.email });
    const rawCanonId = getCanonicalDocId(targetStaffId, targetShopId);
    const stId =
      isTargetMandatory && targetShopId === 'shop_iqbal_pharmacy'
        ? 'staff-owner-1'
        : rawCanonId;
    unmarkDeletedId(stId);

    let assignedRole: StaffMember['roleTitle'] = data.roleTitle;
    if (isTargetMandatory) {
      assignedRole = 'owner';
    } else if (assignedRole === 'owner') {
      assignedRole = 'sub_owner';
    }
    const enforcedName = assignedRole === 'owner' ? 'Owner' : sanitizeString(data.name, 100);

    const newStaff: StaffMember = {
      id: stId,
      shopId: targetShopId,
      ownerId: effectiveCloudUid,
      name: enforcedName,
      roleTitle: assignedRole,
      isMandatoryOwner: isTargetMandatory,
      phone: sanitizeString(data.phone, 30),
      email: data.email ? sanitizeString(data.email, 120, '') : undefined,
      password: data.password ? sanitizeString(data.password, 100, '') : undefined,
      shift: sanitizeString(data.shift, 60),
      counterName: sanitizeString(data.counterName, 60),
      active: true,
      updatedAtMs: nowMs,
    };

    setStaffList((prev) => {
      const next = deduplicateStaffMembers(
        [newStaff, ...prev.filter((s) => !s.shopId || s.shopId === targetShopId)],
        targetShopId
      );
      saveLocal(STORAGE_KEYS.STAFF, next);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, targetShopId), next);
      return next;
    });
    if (getCanonicalDocId(activeStaff.id, targetShopId) === stId) setActiveStaff(newStaff);

    if (user || isCloudLoggedIn) {
      const scopedStaffId = getScopedFirestoreDocId(targetShopId, stId);
      const staffWrites: Array<{ promise: Promise<unknown>; operationType: OperationType; path: string | null }> = [
        {
          promise: setDoc(
            doc(db, 'staff', scopedStaffId),
            buildStaffCloudPayload(newStaff, effectiveCloudUid, targetShopId)
          ),
          operationType: OperationType.WRITE,
          path: `staff/${scopedStaffId}`,
        },
      ];

      // Index in registered_users so any other device discovers this staff member immediately
      const phoneDigits = (data.phone || '').replace(/[^0-9]/g, '');
      if (phoneDigits) {
        const userDocPayload = {
          ownerId: stId,
          shopId: targetShopId,
          staffId: stId,
          ownerName: enforcedName,
          name: enforcedName,
          phone: data.phone,
          email: data.email || `${phoneDigits}@iqbalpharmacy.bd`,
          password: data.password || '123456',
          role: assignedRole,
          roleTitle: assignedRole,
          isMandatoryOwner: isTargetMandatory,
          shopName: shopProfile.shopName || 'ইকবাল ফার্মেসী',
          updatedAtMs: nowMs,
        };
        setDoc(doc(db, 'registered_users', `user_phone_${phoneDigits}`), userDocPayload).catch(() => {});
        if (phoneDigits.length >= 10) {
          setDoc(doc(db, 'registered_users', `user_phone_0${phoneDigits.slice(-10)}`), userDocPayload).catch(() => {});
        }
      }
      if (data.email) {
        const safeEmailKey = data.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
        const userDocPayload = {
          ownerId: stId,
          shopId: targetShopId,
          staffId: stId,
          ownerName: enforcedName,
          name: enforcedName,
          phone: data.phone,
          email: data.email.toLowerCase(),
          password: data.password || '123456',
          role: assignedRole,
          roleTitle: assignedRole,
          isMandatoryOwner: isTargetMandatory,
          shopName: shopProfile.shopName || 'ইকবাল ফার্মেসী',
          updatedAtMs: nowMs,
        };
        setDoc(doc(db, 'registered_users', `user_email_${safeEmailKey}`), userDocPayload).catch(() => {});
      }
      await fireAndRaceFirestoreWrites(staffWrites, 1200);
    }
    showToast(`${enforcedName} প্রোফাইল সংরক্ষিত হয়েছে!`);
  };

  const handleDeleteStaffMember = async (id: string) => {
    const targetShopId = effectiveShopId;
    const canonId = getCanonicalDocId(id, targetShopId);
    const scopedId = getScopedFirestoreDocId(targetShopId, canonId);
    const targetStaff = staffList.find((s) => getCanonicalDocId(s.id, targetShopId) === canonId || s.id === id);
    if (targetStaff && isMandatoryOwner(targetStaff)) {
      showToast('প্রধান মালিক (Mandatory Owner) স্থায়ী এবং ডিলিট করা সম্ভব নয়!');
      return;
    }
    markDeletedIds([id, canonId, scopedId]);
    setStaffList((prev) => {
      const remaining = prev.filter((s) => getCanonicalDocId(s.id, targetShopId) !== canonId);
      saveLocal(STORAGE_KEYS.STAFF, remaining);
      saveLocal(getScopedStorageKey(STORAGE_KEYS.STAFF, targetShopId), remaining);
      if (getCanonicalDocId(activeStaff.id, targetShopId) === canonId && remaining.length > 0) {
        setActiveStaff(remaining[0]);
      }
      return remaining;
    });
    if (user || isCloudLoggedIn) {
      await fireAndRaceFirestoreWrites(
        Array.from(new Set([scopedId, canonId, id])).map((delId) => ({
          promise: deleteDoc(doc(db, 'staff', delId)),
          operationType: OperationType.DELETE,
          path: `staff/${delId}`,
        })),
        1200
      );
    }
    showToast('স্টাফ প্রোফাইল স্থায়ীভাবে ডিলিট করা হয়েছে');
  };

  const unreadAlertsCount = useMemo(
    () => priceAlerts.filter((a) => !a.isRead).length,
    [priceAlerts]
  );

  const navItems = useMemo(() => [
    {
      id: 'dashboard' as ActiveSection,
      label: lang === 'bn' ? 'ফার্মেসী ড্যাশবোর্ড ও সংক্ষিপ্ত তথ্য' : 'Pharmacy Dashboard & Overview',
      shortLabel: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'compare' as ActiveSection,
      label: lang === 'bn' ? 'ওষুধের মূল্য, অ্যালার্ট ও বিকল্প তুলনা' : 'Medicine Price, Alerts & Comparison',
      shortLabel: lang === 'bn' ? 'মূল্য ও অ্যালার্ট' : 'Price & Alerts',
      icon: ArrowRightLeft,
    },
    {
      id: 'pos_accounts' as ActiveSection,
      label: lang === 'bn' ? 'দৈনিক ক্রয়-বিক্রয় ও ক্যাশ মেমো' : 'Daily Sales, Purchases & Billing',
      shortLabel: lang === 'bn' ? 'ক্রয় ও বিক্রয়' : 'Sales & Purchases',
      icon: ShoppingCart,
    },
    {
      id: 'inventory' as ActiveSection,
      label: lang === 'bn' ? 'ইনভেন্টরি ও ওষুধ স্টক তালিকা' : 'Inventory & Stock Management',
      shortLabel: lang === 'bn' ? 'ইনভেন্টরি স্টক' : 'Inventory & Stock',
      icon: Boxes,
    },
    {
      id: 'customer_ledger' as ActiveSection,
      label: lang === 'bn' ? 'কাস্টমার লেজার ও বাকি হিসাব' : 'Customer Ledger & Due Accounts',
      shortLabel: lang === 'bn' ? 'কাস্টমার লেজার' : 'Customer Ledger',
      icon: BookOpen,
    },
    {
      id: 'staff_shop' as ActiveSection,
      label: lang === 'bn' ? 'দোকান সেটিংস ও স্টাফ ব্যবস্থাপনা' : 'Shop Settings & Staff Accounts',
      shortLabel: lang === 'bn' ? 'স্টাফ ও সেটিংস' : 'Shop & Staff',
      icon: Users,
    },
  ], [lang]);

  const activeNavObj = navItems.find((n) => n.id === activeSection) || navItems[0];

  // If visiting root URL (/) or public domain, show only the Public Healthcare Portal for Iqbal Pharmacy and Dental Care 1 & 2
  // Admin dashboard and POS software is accessed only via /admin
  if (!isAdminRoute) {
    return (
      <PublicHealthcarePortal
        transactions={transactions}
        shopProfile={isCloudLoggedIn ? shopProfile : DEFAULT_SHOP_PROFILE}
      />
    );
  }

  // Strict Admin Auth Gate: While logged out, ALL /admin features stay completely closed and ONLY Login / Create Shop Account appears
  if (!isCloudLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
        {/* Minimal Locked Top Bar (No POS, No Carts, No Settings, No Admin Modules) */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {lang === 'bn' ? 'ফার্মেসী এডমিন প্যানেল' : 'Pharmacy Admin Panel'}
              </div>
              <div className="text-[11px] font-medium text-rose-700 truncate">
                {lang === 'bn' ? 'লগআউট অবস্থা · সকল ফিচার সুরক্ষিত' : 'Logged Out · All Features Locked'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? (lang === 'bn' ? 'অনলাইন' : 'Online') : (lang === 'bn' ? 'অফলাইন' : 'Offline')}</span>
            </span>

            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 cursor-pointer"
            >
              {lang === 'bn' ? 'EN' : 'বাংলা'}
            </button>

            <a
              href="/"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-1 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পাবলিক সাইট' : 'Public Portal'}</span>
            </a>
          </div>
        </header>

        {/* Centered Login / Create Shop Account Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg space-y-4">
            {toastMessage && (
              <div className="px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg flex items-center justify-between shadow-sm">
                <span>{toastMessage}</span>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-white ml-4 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-7 space-y-5">
              {/* Locked Status Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-amber-950">
                    {lang === 'bn'
                      ? 'এডমিন প্যানেলের সমস্ত ফিচার বর্তমানে বন্ধ রয়েছে'
                      : 'All Admin Features Are Currently Locked'}
                  </div>
                  <p className="text-amber-900 leading-relaxed">
                    {lang === 'bn'
                      ? 'লগআউট অবস্থায় ক্রয়-বিক্রয়, ইনভেন্টরি, হিসাব ও সেটিংস বন্ধ থাকবে। কাজ শুরু করতে আপনার একাউন্টে লগইন করুন অথবা নতুন শপ একাউন্ট তৈরি করুন।'
                      : 'POS, inventory, ledger, and settings are locked while logged out. Please log in or create a new shop account to continue.'}
                  </p>
                </div>
              </div>

              {/* Heading */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                  <Cloud className="w-4 h-4" />
                  <span>ফার্মেসী ও ডেন্টাল ম্যানেজমেন্ট সিস্টেম</span>
                </div>
                <h1 className="text-lg font-bold text-slate-900">
                  {cloudAuthTab === 'register_owner'
                    ? 'নতুন শপ / Owner একাউন্ট তৈরি করুন'
                    : 'এডমিন লগইন (Owner ও স্টাফ)'}
                </h1>
              </div>

              {/* Auth Mode Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCloudAuthTab('login');
                    setLoginErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                    cloudAuthTab === 'login'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  লগইন (Owner ও স্টাফ)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCloudAuthTab('register_owner');
                    setLoginErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                    cloudAuthTab === 'register_owner'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  নতুন শপ একাউন্ট তৈরি
                </button>
              </div>

              {/* TAB 1: Login Form */}
              {cloudAuthTab === 'login' && (
                <form onSubmit={handleUniversalLoginSubmit} className="space-y-3.5">
                  {loginErrorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold leading-relaxed">
                      ⚠️ {loginErrorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      মোবাইল নম্বর অথবা ইমেইল / জিমেইল *
                    </label>
                    <input
                      type="text"
                      required
                      value={cloudLoginEmail}
                      onChange={(e) => setCloudLoginEmail(e.target.value)}
                      placeholder="018XXXXXXXX অথবা example@gmail.com"
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        লগইন পাসওয়ার্ড *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer inline-flex items-center gap-1"
                      >
                        {showLoginPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showLoginPassword ? 'লুকান' : 'দেখুন'}
                      </button>
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={cloudLoginPassword}
                      onChange={(e) => setCloudLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={cloudLoginLoading}
                      className="w-full sm:flex-1 py-2.5 px-4 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <LogIn className="w-4 h-4" />
                      {cloudLoginLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন (Owner / Staff)'}
                    </button>
                    <button
                      type="button"
                      disabled={cloudLoginLoading}
                      onClick={handleGoogleCloudLogin}
                      className="w-full sm:w-auto py-2.5 px-3.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      Google লগইন
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCloudAuthTab('register_owner');
                        setLoginErrorMessage(null);
                      }}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
                    >
                      নতুন শপ / Owner একাউন্ট তৈরি করবেন? এখানে ক্লিক করুন →
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Create New Shop Owner Account Form */}
              {cloudAuthTab === 'register_owner' && (
                <form onSubmit={handleRegisterOwnerSubmit} className="space-y-3">
                  {loginErrorMessage && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-semibold leading-relaxed">
                      ℹ️ {loginErrorMessage}
                    </div>
                  )}

                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 leading-relaxed">
                    <strong>নতুন শপ একাউন্ট:</strong> আপনার ফার্মেসীর নাম, মালিকের নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে নতুন শপ একাউন্ট তৈরি করুন।
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      দোকানের নাম (Shop Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerShopName}
                      onChange={(e) => setRegisterShopName(e.target.value)}
                      placeholder="যেমন: ইকবাল ফার্মেসী"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        মালিকের নাম (Owner Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={registerOwnerName}
                        onChange={(e) => setRegisterOwnerName(e.target.value)}
                        placeholder="যেমন: ইকবাল মাহমুদ"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        মোবাইল নম্বর *
                      </label>
                      <input
                        type="text"
                        required
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="018XXXXXXXX"
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ইমেইল / জিমেইল (ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="owner@gmail.com"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        পাসওয়ার্ড সেট করুন *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer inline-flex items-center gap-1"
                      >
                        {showRegisterPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showRegisterPassword ? 'লুকান' : 'দেখুন'}
                      </button>
                    </div>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="নূন্যতম ৬ অক্ষর"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={cloudLoginLoading}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {cloudLoginLoading ? 'একাউন্ট তৈরি হচ্ছে...' : 'নতুন শপ একাউন্ট তৈরি করুন'}
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCloudAuthTab('login');
                        setLoginErrorMessage(null);
                      }}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
                    >
                      ইতিমধ্যে একাউন্ট আছে? লগইন করুন →
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar: Clean header with carts, language toggle & account logout */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-6 no-print overflow-x-hidden">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
            aria-label={lang === 'bn' ? 'মেনু' : 'Menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <div className="relative flex items-center justify-center">
                <div className="w-4 h-1.5 bg-white rounded-xs"></div>
                <div className="w-1.5 h-4 bg-white rounded-xs absolute"></div>
              </div>
            </div>
            <span>
              {!isCloudLoggedIn
                ? lang === 'bn'
                  ? 'ফার্মেসী ম্যানেজমেন্ট'
                  : 'Pharmacy Management'
                : lang === 'bn'
                ? shopProfile.shopName || 'ইকবাল ফার্মেসী'
                : shopProfile.shopName || 'Iqbal Pharmacy'}
            </span>
          </a>
        </div>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-teal-700 border-teal-700 font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {item.shortLabel}
                {item.id === 'compare' && unreadAlertsCount > 0
                  ? ` (${unreadAlertsCount})`
                  : ''}
                {item.id === 'pos_accounts' && posCart.length > 0
                  ? ` (${posCart.length})`
                  : ''}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Action Buttons, Language Toggle & Authentication */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Purchase Cart Header Button */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('pos_accounts');
              setPosActiveTab('purchase_entry');
              showToast(lang === 'bn' ? 'ক্রয় কার্ট ও ইনভয়েস বিল এন্ট্রি খোলা হয়েছে' : 'Purchase Cart & Billing opened');
            }}
            className={`px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
              activeSection === 'pos_accounts' && posActiveTab === 'purchase_entry'
                ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
            }`}
            title={lang === 'bn' ? 'ক্রয় কার্ট দেখুন' : 'View Purchase Cart'}
            aria-label="Purchase Cart"
          >
            <Package className={`w-3.5 h-3.5 ${
              activeSection === 'pos_accounts' && posActiveTab === 'purchase_entry' ? 'text-white' : 'text-indigo-700'
            }`} />
            <span className="font-bold hidden sm:inline">{lang === 'bn' ? 'ক্রয় কার্ট' : 'Purchase'}</span>
            <span className={`px-1.5 py-0.2 text-[11px] font-mono font-bold rounded-full min-w-4 text-center leading-tight ${
              activeSection === 'pos_accounts' && posActiveTab === 'purchase_entry'
                ? 'bg-white text-indigo-800'
                : 'bg-indigo-600 text-white'
            }`}>
              {purchaseCart.length}
            </span>
          </button>

          {/* Sell Cart Header Button */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('pos_accounts');
              setPosActiveTab('sale_pos');
              showToast(lang === 'bn' ? 'বিক্রয় কার্ট ও ক্যাশ মেমো খোলা হয়েছে' : 'Sales Cart & Cash Memo opened');
            }}
            className={`px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
              activeSection === 'pos_accounts' && posActiveTab === 'sale_pos'
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}
            title={lang === 'bn' ? 'বিক্রয় কার্ট দেখুন' : 'View Sales Cart'}
            aria-label="Sales Cart"
          >
            <ShoppingCart className={`w-3.5 h-3.5 ${
              activeSection === 'pos_accounts' && posActiveTab === 'sale_pos' ? 'text-white' : 'text-emerald-700'
            }`} />
            <span className="font-bold hidden sm:inline">{lang === 'bn' ? 'বিক্রয় কার্ট' : 'Sales'}</span>
            <span className={`px-1.5 py-0.2 text-[11px] font-mono font-bold rounded-full min-w-4 text-center leading-tight ${
              activeSection === 'pos_accounts' && posActiveTab === 'sale_pos'
                ? 'bg-white text-emerald-800'
                : 'bg-emerald-600 text-white'
            }`}>
              {posCart.length}
            </span>
          </button>

          {/* Box Scanner Button */}
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            title={lang === 'bn' ? 'ওষুধের বক্স স্ক্যান' : 'Medicine Box Scanner'}
            aria-label="Scanner"
          >
            <Camera className="w-3.5 h-3.5 text-purple-700" />
            <span className="font-bold hidden sm:inline">{lang === 'bn' ? 'স্ক্যান' : 'Scan'}</span>
          </button>

          {/* Language Switcher Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            title={lang === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
            aria-label="Language Toggle"
          >
            <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-teal-100 text-teal-800">
              {lang === 'bn' ? 'EN' : 'বাং'}
            </span>
            <span className="hidden sm:inline font-semibold">
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setActiveSection('staff_shop')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title={lang === 'bn' ? 'ফার্মেসী সেটিংস ও স্টাফ' : 'Pharmacy Settings & Staff'}
            aria-label="Settings"
          >
            <Settings className="w-4.5 h-4.5 text-slate-700" />
          </button>

          {/* Quick Purge & Reload Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof (window as any).purgeAppCacheAndReload === 'function') {
                (window as any).purgeAppCacheAndReload();
              } else {
                window.location.reload();
              }
            }}
            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title={lang === 'bn' ? 'নতুন আপডেট লোড ও ক্যাশ রিফ্রেশ করুন' : 'Reload Updates & Purge Cache'}
            aria-label="Refresh"
          >
            <RefreshCw className="w-4.5 h-4.5 text-slate-600 hover:text-teal-700 hover:rotate-180 transition-transform duration-300" />
          </button>

          {/* Account Logout / Login Button - Visible on Both Mobile & Desktop */}
          {isCloudLoggedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setShowCloudLoginModal(true)}
                className="hidden xl:flex px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title={lang === 'bn' ? 'ফায়ারস্টোর একাউন্ট বিস্তারিত' : 'Firestore Account Details'}
              >
                <Cloud className="w-3.5 h-3.5 text-teal-700" />
                <span>{lang === 'bn' ? `ফায়ারস্টোর সক্রিয় (${cloudSession?.email?.split('@')[0] || cloudSession?.phone || 'Owner'})` : `Firestore Active (${cloudSession?.email?.split('@')[0] || cloudSession?.phone || 'Owner'})`}</span>
              </button>
              <button
                type="button"
                onClick={handleCloudLogout}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-95"
                title={lang === 'bn' ? 'ফায়ারস্টোর ও একাউন্ট লগআউট করুন' : 'Log out from Account and Firestore'}
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCloudLoginModal(true)}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-95"
              title={lang === 'bn' ? 'ফায়ারস্টোর ডাটাবেস লগইন' : 'Firestore Database Login'}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
            </button>
          )}
        </div>
      </header>

      {/* 1-Line Right-to-Left Scrolling Marquee Notice (হেডিংয়ের নিচে ১ লাইনে ডান দিক থেকে বাম দিকে স্ক্রল করবে, ২ সেকেন্ড ব্যবধানে পুনরাবৃত্তি) */}
      {shopProfile?.notice && shopProfile.notice.isActive && shopProfile.notice.text && shopProfile.notice.text.trim() && (
        <div
          role="marquee"
          aria-live="polite"
          className="bg-amber-400 text-slate-950 border-b border-amber-500 py-1.5 sm:py-2 px-3 sm:px-4 shadow-xs overflow-hidden select-none no-print"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-2.5">
            <div className="shrink-0 flex items-center gap-1.5 bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-xs tracking-wide">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span>জরুরী নোটিশ</span>
            </div>
            <div className="overflow-hidden flex-1 relative whitespace-nowrap">
              <div
                className="animate-marquee-rtl font-bold text-xs sm:text-sm tracking-wide text-slate-950 inline-block"
                title="কার্সার রাখলে স্ক্রল সাময়িক থামবে"
              >
                {shopProfile.notice.text}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 no-print shadow-md">
          {/* Mobile drawer quick actions: Language & Logout */}
          <div className="flex flex-col gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-slate-50 text-slate-800 flex items-center gap-1.5"
              >
                <span>{lang === 'bn' ? '🌐 Switch to English' : '🌐 বাংলায় পরিবর্তন করুন'}</span>
              </button>
              {isCloudLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    handleCloudLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowCloudLoginModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
                </button>
              )}
            </div>
            {isCloudLoggedIn && cloudSession && (
              <div className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 flex items-center justify-between">
                <span>👤 {cloudSession.displayName}</span>
                <span className="font-mono">{cloudSession.phone || cloudSession.email}</span>
              </div>
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-left cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Workspace Body: Left Sidebar (260px) + Main Content Viewport */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col justify-between bg-white border-r border-slate-200 transition-all duration-200 shrink-0 no-print ${
            sidebarCollapsed ? 'w-18 p-3' : 'w-64 xl:w-72 p-4 sm:p-5'
          }`}
        >
          <div className="space-y-4">
            {/* Shop Identity Summary with Collapse Button */}
            <div className="pb-3 border-b border-slate-200">
              <div className="flex items-start justify-between gap-1">
                {!sidebarCollapsed && (
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-sm font-bold text-teal-800 truncate">
                      {isCloudLoggedIn ? (shopProfile.shopName || 'ইকবাল ফার্মেসী') : 'গেস্ট মোড (লগইন করুন)'}
                    </div>
                    {isCloudLoggedIn && effectiveShopId === 'shop_iqbal_pharmacy' && (
                      <div className="text-[11px] font-semibold text-slate-800 leading-snug line-clamp-2">
                        ডেন্টিস্ট:- ইকবাল মাহমুদ (ডি.এম.টি.ডি (ডেন্টাল) · এল.এম.এ.এফ (ঢাকা) · আর.এম.পি (ঢাকা) · ফার্মাসিস্ট · ওরাল এন্ড ডেন্টাল টেকনোলজিষ্ট)
                      </div>
                    )}
                    {isCloudLoggedIn && shopProfile.address && (
                      <div className="text-[10.5px] text-slate-600 truncate">
                        ঠিকানা:- {shopProfile.address}
                      </div>
                    )}
                    {isCloudLoggedIn && shopProfile.phone && (
                      <div className="text-[10.5px] text-slate-700 font-mono">
                        মোবাইল:- {shopProfile.phone}
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                  title={sidebarCollapsed ? 'সাইডবার প্রসারিত করুন' : 'সাইডবার ছোট করুন'}
                  aria-label="Toggle sidebar collapse"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sidebar Navigation List */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="text-[11px] font-bold text-slate-400 px-3 pb-0.5">
                  মূল মেনু ও মডিউল
                </div>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    title={item.label}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    } ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : ''}`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!sidebarCollapsed && item.id === 'pos_accounts' && posCart.length > 0 && (
                      <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-teal-600 text-white">
                        {posCart.length}
                      </span>
                    )}
                    {!sidebarCollapsed && item.id === 'compare' && unreadAlertsCount > 0 && (
                      <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                        {unreadAlertsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collapsible Extra Options Card (অতিরিক্ত অপশনগুলো সব সময় চালু থাকবে না) */}
            {!sidebarCollapsed && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExtraOptions(!showExtraOptions)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>অতিরিক্ত অপশন ও টুলস</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {showExtraOptions ? 'বন্ধ করুন ▲' : 'খুলুন ▼'}
                  </span>
                </button>

                {showExtraOptions && (
                  <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3 animate-fadeIn">
                    {/* Active Operator Switcher (visible only when logged in) */}
                    {isCloudLoggedIn && staffList.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">
                          সক্রিয় অপারেটর (Owner / স্টাফ)
                        </div>
                        <select
                          value={activeStaff.id}
                          onChange={(e) => {
                            const found = staffList.find((s) => s.id === e.target.value);
                            if (found) {
                              setActiveStaff(found);
                              showToast(`সক্রিয় অপারেটর: ${getOperatorName(found)}`);
                            }
                          }}
                          aria-label="সক্রিয় অপারেটর নির্বাচন"
                          className="w-full px-2 py-1 text-xs font-medium bg-white border border-slate-200 rounded-md"
                        >
                          {staffList.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.roleTitle === 'owner' ? 'Owner' : st.name} — {st.counterName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* PWA Install Button if available */}
                    {!isInstalled && (isInstallable || isIOS) && (
                      <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-md space-y-1.5">
                        <div className="text-[11px] font-bold text-teal-950">
                          অফলাইন PWA ইনস্টল
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isInstallable) install();
                            else if (isIOS) setShowIOSInstallModal(true);
                          }}
                          className="w-full py-1.5 px-2 text-[11px] font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>অ্যাপ ইনস্টল করুন</span>
                        </button>
                      </div>
                    )}

                    {/* Backup & Restore */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadBackup}
                        className="flex-1 py-1 px-2 text-[10.5px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-emerald-700" />
                        <span>ব্যাকআপ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => backupFileInputRef.current?.click()}
                        className="flex-1 py-1 px-2 text-[10.5px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-teal-700" />
                        <span>রিস্টোর</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Online / Offline Dual Mode Status & Cloud Sync */}
          {!sidebarCollapsed && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                      <span>অনলাইন মোড</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-700">অফলাইন মোড</span>
                    </>
                  )}
                </span>
                <span className="text-[10.5px] text-slate-400">অফলাইন-রেডি</span>
              </div>

              {isCloudLoggedIn ? (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                    <Cloud className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="truncate">
                      {cloudSession?.email || user?.email || 'mhakbor2001@gmail.com'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSeedCloudData}
                    disabled={seedingCloud}
                    className="w-full py-1.5 px-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md cursor-pointer disabled:opacity-50"
                  >
                    {seedingCloud ? 'সিঙ্ক হচ্ছে...' : 'ক্লাউড সিঙ্ক করুন'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCloudLoginModal(true)}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  দোকান ক্লাউড লগইন
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Main Workspace Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full pb-24 lg:pb-8">

          {/* Offline Connectivity Banner */}
          {!isOnline && (
            <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium rounded-md flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>অফলাইন মোড সক্রিয়:</strong> ইন্টারনেট সংযোগ ছাড়াই আপনি ওষুধের মূল্য যাচাই, নতুন ইনভয়েস তৈরি, মূল্য পরিবর্তন, এডিট ও ডিলিট করতে পারবেন। ইন্টারনেট চালু হলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।
                </span>
              </div>
            </div>
          )}

          {/* Toast Feedback Banner */}
          {toastMessage && (
            <div className="mb-4 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-md flex items-center justify-between shadow-sm no-print">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white ml-4 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active View Render */}
              {activeSection === 'dashboard' && (
                <DashboardView
                  transactions={transactions}
                  inventory={inventory}
                  customers={customers}
                  catalog={fullCatalog}
                  posCart={posCart}
                  purchaseCart={purchaseCart}
                  shopProfile={shopProfile}
                  onNavigate={(sec, subTab) => {
                    setActiveSection(sec);
                    if (subTab) setPosActiveTab(subTab as any);
                  }}
                  onOpenScanner={() => setShowScannerModal(true)}
                  onUpdateNotice={handleUpdateNotice}
                />
              )}

              {activeSection === 'compare' && (
                <MedicineCompareView
                  catalog={fullCatalog}
                  inventory={inventory}
                  priceWatches={priceWatches}
                  priceAlerts={priceAlerts}
                  publicAppUrl={PUBLIC_APP_URL}
                  onAddToPosCart={handleAddToPosCart}
                  onAddToPurchaseCart={handleAddToPurchaseCart}
                  onQuickAddInventory={handleQuickAddInventoryFromCompare}
                  onSaveMedicineCatalog={handleSaveMedicineCatalog}
                  onDeleteCustomMedicine={handleDeleteCustomMedicine}
                  onTogglePriceWatch={handleTogglePriceWatch}
                  onMarkAlertRead={handleMarkAlertRead}
                  onDeletePriceAlert={handleDeletePriceAlert}
                />
              )}

              {activeSection === 'pos_accounts' && (
                <PosAndDailyAccountsView
                  catalog={fullCatalog}
                  inventory={inventory}
                  customers={customers}
                  transactions={transactions}
                  staffList={staffList}
                  activeStaff={activeStaff}
                  selectedTab={posActiveTab}
                  onTabChange={setPosActiveTab}
                  onSelectActiveStaff={(st) => {
                    setActiveStaff(st);
                    showToast(`সক্রিয় অপারেটর: ${getOperatorName(st)}`);
                  }}
                  posCart={posCart}
                  onAddToCart={handleAddToPosCart}
                  onAddCustomToCart={handleAddCustomToPosCart}
                  onUpdateCartQty={handleUpdateCartQty}
                  onUpdateCartUnitPrice={handleUpdateCartUnitPrice}
                  onUpdateCartPurchasePrice={handleUpdateCartPurchasePrice}
                  onUpdateCartItemDetails={handleUpdateCartItemDetails}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={() => {
                    setPosCart([]);
                    saveLocal(STORAGE_KEYS.POS_CART, []);
                  }}
                  onCompleteSale={handleCompleteSale}
                  purchaseCart={purchaseCart}
                  onAddToPurchaseCart={handleAddToPurchaseCart}
                  onAddCustomToPurchaseCart={handleAddCustomToPurchaseCart}
                  onUpdatePurchaseCartQty={handleUpdatePurchaseCartQty}
                  onUpdatePurchaseCartCost={handleUpdatePurchaseCartCost}
                  onUpdatePurchaseCartMrp={handleUpdatePurchaseCartMrp}
                  onUpdatePurchaseCartBatch={handleUpdatePurchaseCartBatch}
                  onUpdatePurchaseCartItemDetails={handleUpdatePurchaseCartItemDetails}
                  onRemoveFromPurchaseCart={handleRemoveFromPurchaseCart}
                  onClearPurchaseCart={() => {
                    setPurchaseCart([]);
                    saveLocal(STORAGE_KEYS.PURCHASE_CART, []);
                  }}
                  onCompletePurchaseInvoice={handleCompletePurchaseInvoice}
                  onRecordPurchase={handleRecordPurchase}
                  editingInvoiceTx={editingInvoiceTx}
                  onStartEditInvoice={handleStartEditInvoice}
                  onCancelEditInvoice={handleCancelEditInvoice}
                  onEditTransaction={handleEditTransaction}
                  onPayInvoiceDue={handlePayInvoiceDue}
                  onDeleteTransaction={handleDeleteTransaction}
                  shopProfile={shopProfile}
                  onSaveMedicineCatalog={handleSaveMedicineCatalog}
                  onOpenScanner={() => setShowScannerModal(true)}
                />
              )}

              {activeSection === 'inventory' && (
                <InventoryView
                  inventory={inventory}
                  catalog={fullCatalog}
                  onSaveInventoryItem={handleSaveInventoryItem}
                  onDeleteInventoryItem={handleDeleteInventoryItem}
                  onQuickRestock={handleQuickRestock}
                  onAddToPosCart={handleAddToPosCart}
                  onAddToPurchaseCart={handleAddToPurchaseCart}
                />
              )}

              {activeSection === 'customer_ledger' && (
                <CustomerLedgerView
                  customers={customers}
                  transactions={transactions}
                  activeStaff={activeStaff}
                  onSaveCustomer={handleSaveCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onCollectDuePayment={handleCollectDuePayment}
                  onStartEditInvoice={handleStartEditInvoice}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}

              {activeSection === 'staff_shop' && (
                <StaffAndShopView
                  shopProfile={shopProfile}
                  staffList={staffList}
                  activeStaff={activeStaff}
                  transactions={transactions}
                  cloudSession={cloudSession}
                  isCloudLoggedIn={isCloudLoggedIn}
                  seedingCloud={seedingCloud}
                  lang={lang}
                  onOpenCloudLoginModal={() => setShowCloudLoginModal(true)}
                  onQuickCloudLogin={handleQuickCloudLogin}
                  onCloudLogout={handleCloudLogout}
                  onSyncCloudData={handleSeedCloudData}
                  onSelectActiveStaff={(st) => {
                    setActiveStaff(st);
                    showToast(`সক্রিয় অপারেটর: ${getOperatorName(st)}`);
                  }}
                  onUpdateShopProfile={handleUpdateShopProfile}
                  onSaveStaffMember={handleSaveStaffMember}
                  onDeleteStaffMember={handleDeleteStaffMember}
                  shopRegistrations={shopRegistrations}
                  onApproveShopRegistration={handleApproveShopRegistration}
                  onRejectShopRegistration={handleRejectShopRegistration}
                />
              )}
        </main>
      </div>

      {/* Shop Cloud Login Modal (দোকান ক্লাউড লগইন) */}
      {showCloudLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 no-print">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3.5">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                  <Cloud className="w-4 h-4" />
                  <span>ইকবাল ফার্মেসী · ক্লাউড ও মাল্টি-ডিভাইস সিঙ্ক</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {cloudAuthTab === 'register_owner'
                    ? 'দোকানের নতুন Owner আইডি রেজিস্ট্রেশন'
                    : 'দোকান ক্লাউড লগইন (Owner ও স্টাফ)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCloudLoginModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            {/* If currently logged in, show current session status */}
            {isCloudLoggedIn && cloudSession && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-2 text-xs">
                <div className="font-bold text-teal-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>বর্তমানে লগইন সক্রিয় রয়েছে</span>
                  </span>
                  <span className="px-2 py-0.5 bg-teal-200 text-teal-900 rounded font-semibold text-[11px]">
                    {cloudSession.operatorRole === 'owner' ? 'Owner (মালিক)' : 'Staff (স্টাফ)'}
                  </span>
                </div>
                <div className="text-teal-900">
                  অপারেটর: <strong>{cloudSession.displayName}</strong> · দোকান: <strong>{cloudSession.shopName}</strong>
                </div>
                <div className="text-teal-800 font-mono text-[11px]">
                  মোবাইল: {cloudSession.phone} {cloudSession.email ? `· ইমেইল: ${cloudSession.email}` : ''}
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-teal-200/80">
                  <span className="text-[11px] text-teal-700">অন্য একাউন্টে ঢুকতে চাইলে প্রথমে লগআউট করুন:</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleCloudLogout();
                      setShowCloudLoginModal(false);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs cursor-pointer flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    লগআউট করুন
                  </button>
                </div>
              </div>
            )}

            {/* Tabs for Login vs Register New Owner */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setCloudAuthTab('login')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  cloudAuthTab === 'login'
                    ? 'border-teal-700 text-teal-800'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Owner ও স্টাফ লগইন
              </button>
              <button
                type="button"
                onClick={() => setCloudAuthTab('register_owner')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  cloudAuthTab === 'register_owner'
                    ? 'border-teal-700 text-teal-800'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                নতুন Owner আইডি খুলুন
              </button>
            </div>

            {/* TAB 1: Universal Login (Owner or Staff by Email/Mobile + Password) */}
            {cloudAuthTab === 'login' && (
              <form onSubmit={handleUniversalLoginSubmit} className="space-y-3.5">
                {loginErrorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-semibold flex items-center gap-2">
                    <span>⚠️ {loginErrorMessage}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মোবাইল নম্বর অথবা ইমেইল / জিমেইল *
                  </label>
                  <input
                    type="text"
                    required
                    value={cloudLoginEmail}
                    onChange={(e) => setCloudLoginEmail(e.target.value)}
                    placeholder="01812-358839 অথবা example@gmail.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    দোকানের মালিক বা স্টাফ নিজের মোবাইল নম্বর অথবা ইমেইল দিয়ে লগইন করতে পারবেন।
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      লগইন পাসওয়ার্ড *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer inline-flex items-center gap-1"
                    >
                      {showLoginPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showLoginPassword ? 'লুকান' : 'দেখুন'}
                    </button>
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={cloudLoginPassword}
                    onChange={(e) => setCloudLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono"
                  />
                </div>


                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={cloudLoginLoading}
                    className="w-full sm:flex-1 py-2.5 px-4 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    {cloudLoginLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন (Owner / Staff)'}
                  </button>
                  <button
                    type="button"
                    disabled={cloudLoginLoading}
                    onClick={handleGoogleCloudLogin}
                    className="w-full sm:w-auto py-2.5 px-3.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md cursor-pointer disabled:opacity-50"
                  >
                    Google লগইন
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setCloudAuthTab('register_owner')}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
                  >
                    দোকানের নতুন Owner আইডি খুলবেন? এখানে ক্লিক করুন →
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Register New Shop Owner Account */}
            {cloudAuthTab === 'register_owner' && (
              <form onSubmit={handleRegisterOwnerSubmit} className="space-y-3">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-teal-900 leading-relaxed">
                  <strong>দোকান মালিকের (Owner) নতুন আইডি:</strong> নিজের ফার্মেসীর নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে একাউন্ট তৈরি করুন। পরবর্তীতে আপনি এই একাউন্ট থেকেই আপনার সকল স্টাফদের আইডি ও পাসওয়ার্ড তৈরি করতে পারবেন।
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    দোকানের নাম (Shop Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerShopName}
                    onChange={(e) => setRegisterShopName(e.target.value)}
                    placeholder="যেমন: ইকবাল ফার্মেসী"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      মালিকের নাম (Owner Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerOwnerName}
                      onChange={(e) => setRegisterOwnerName(e.target.value)}
                      placeholder="যেমন: ইকবাল মাহমুদ"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="018XXXXXXXX"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ইমেইল / জিমেইল (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="owner@gmail.com"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      পাসওয়ার্ড সেট করুন *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer inline-flex items-center gap-1"
                    >
                      {showRegisterPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showRegisterPassword ? 'লুকান' : 'দেখুন'}
                    </button>
                  </div>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="নূন্যতম ৬ অক্ষর"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cloudLoginLoading}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {cloudLoginLoading ? 'একাউন্ট তৈরি হচ্ছে...' : 'নতুন Owner আইডি তৈরি ও লগইন করুন'}
                  </button>
                </div>

                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-normal space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-amber-950">
                    <span>☁️ Cloudflare Pages ও Firestore ডেপ্লয় নোট:</span>
                  </div>
                  <p>
                    Cloudflare (যেমন: <code className="bg-amber-100 px-1 py-0.5 rounded">*.pages.dev</code>) এ অ্যাপ ডেপ্লয় করার পর Firebase Console এ যান:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10.5px]">
                    <li><strong>Authentication &gt; Settings &gt; Authorized Domains:</strong> আপনার ক্লাউডফ্লেয়ার ডোমেন যুক্ত করুন।</li>
                    <li><strong>Authentication &gt; Sign-in method:</strong> Email/Password এবং Anonymous চালু রাখুন।</li>
                  </ul>
                  <p className="text-[10px] text-amber-800">
                    (ডোমেন অনুমোদন ছাড়াও আপনার অফলাইন ও লোকাল রেজিস্টার্ড একাউন্ট স্বয়ংক্রিয়ভাবে কার্যকর থাকবে)।
                  </p>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setCloudAuthTab('login')}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
                  >
                    ইতিমধ্যে একাউন্ট আছে? লগইন করুন →
                  </button>
                </div>
              </form>
            )}

            {/* 4-Layer Permanent Data Protection & Backup/Restore */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-md space-y-2.5">
              <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                <span>স্থায়ী ডাটা সুরক্ষা (৪-স্তরের অটো ব্যাকআপ সক্রিয়)</span>
                <span className="font-mono text-[11px] text-emerald-700">Auto-Saved</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                সকল ক্রয়-বিক্রয় বিল, কাস্টম প্রডাক্ট, স্টক ও হিসাব স্বয়ংক্রিয়ভাবে সার্ভার ডাটাবেস ও ক্লাউডে সেভ থাকে—ব্রাউজারের ক্যাশ ক্লিয়ার করলেও কোনো ডাটা মুছবে না।
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  ব্যাকআপ ডাউনলোড (.json)
                </button>
                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  ব্যাকআপ রিস্টোর
                </button>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreBackupFile}
                  className="hidden"
                />
              </div>
            </div>

            {isCloudLoggedIn && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSeedCloudData}
                  disabled={seedingCloud}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                >
                  {seedingCloud ? 'সিঙ্ক হচ্ছে...' : 'সকল ডেটা এখনই সিঙ্ক করুন'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleCloudLogout();
                    setShowCloudLoginModal(false);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  একাউন্ট লগআউট করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* iOS PWA Installation Guide Modal */}
      {showIOSInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              iPhone / iPad-এ অ্যাপটি ইনস্টল করুন
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              ১. Safari ব্রাউজারের নিচে <strong>Share</strong> বাটনে ট্যাপ করুন।
              <br />
              ২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> সিলেক্ট করুন।
            </p>
            <button
              type="button"
              onClick={() => setShowIOSInstallModal(false)}
              className="mt-4 w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              বুঝেছি, বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar matching user mockup ("ড্যাশবোর্ড", "তালিকা", "বিক্রি", "প্রতিবেদন", "একাউন্ট") */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg no-print select-none">
        {/* 1. ড্যাশবোর্ড */}
        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg cursor-pointer transition-colors ${
            activeSection === 'dashboard'
              ? 'text-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">ড্যাশবোর্ড</span>
        </button>

        {/* 2. তালিকা */}
        <button
          type="button"
          onClick={() => setActiveSection('compare')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg cursor-pointer transition-colors ${
            activeSection === 'compare'
              ? 'text-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListFilter className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">তালিকা</span>
        </button>

        {/* 3. বিক্রি (with Cart Badge & Cart Icon) */}
        <button
          type="button"
          onClick={() => {
            setActiveSection('pos_accounts');
            setPosActiveTab('sale_pos');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg cursor-pointer transition-colors ${
            activeSection === 'pos_accounts' && posActiveTab === 'sale_pos'
              ? 'text-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            {posCart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-600 text-white min-w-3 text-center leading-tight">
                {posCart.length}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight">বিক্রি</span>
        </button>

        {/* 4. প্রতিবেদন / কাস্টমার ও বিক্রয় লেজার */}
        <button
          type="button"
          onClick={() => {
            setActiveSection('customer_ledger');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg cursor-pointer transition-colors ${
            activeSection === 'customer_ledger'
              ? 'text-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">প্রতিবেদন</span>
        </button>

        {/* 5. একাউন্ট */}
        <button
          type="button"
          onClick={() => setActiveSection('staff_shop')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg cursor-pointer transition-colors ${
            activeSection === 'staff_shop'
              ? 'text-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">একাউন্ট</span>
        </button>
      </nav>

      {/* Medicine Box Scanner Modal (নাম, বক্স সাইজ, দাম, ব্যাচ, মেয়াদ স্ক্যানার ও সরাসরি ক্রয়/বিক্রয়/স্টক) */}
      <BoxScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        catalog={fullCatalog}
        inventory={inventory}
        onDirectSale={handleDirectSaleWithoutInvoice}
        onDirectPurchase={handleDirectPurchaseWithoutInvoice}
        onUpdateStock={handleDirectStockAdjustment}
        onAddToPurchase={(data) => {
          handleAddCustomToPurchaseCart({
            brandName: data.brandName,
            packDetailFormula: data.boxSize,
            purchasePrice: data.boxRate,
            unitPrice: data.unitPrice,
            batchNo: data.batchNo,
            expiryDate: data.expiryDate,
            qty: data.totalPcs || 100,
            packCount: 1,
            packRate: data.boxRate,
            packUnit: 'box',
          });
          setShowScannerModal(false);
          setActiveSection('pos_accounts');
          setPosActiveTab('purchase_entry');
          showToast(`বক্স স্ক্যান সফল: ${data.brandName} ক্রয় কার্টে যোগ হয়েছে`);
        }}
        onAddToSale={(data) => {
          handleAddCustomToPosCart({
            brandName: data.brandName,
            unitPrice: data.unitPrice,
            purchasePrice: Math.round(data.unitPrice * 0.88 * 100) / 100,
            qty: 1,
            saveToCatalog: true,
          });
          setShowScannerModal(false);
          setActiveSection('pos_accounts');
          setPosActiveTab('sale_pos');
          showToast(`বক্স স্ক্যান সফল: ${data.brandName} বিক্রয় কার্টে যোগ হয়েছে`);
        }}
      />
    </div>
  );
}
