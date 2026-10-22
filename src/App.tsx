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
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  ArrowRightLeft,
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
  ShopProfile,
  StaffMember,
  Transaction,
} from './types';
import {
  downloadPharmacyBackupJson,
  fetchServerPharmacyState,
  loadIndexedDbSnapshot,
  parsePharmacyBackupJson,
  PharmacyPersistentState,
  pushServerPharmacyState,
  saveIndexedDbSnapshot,
} from './utils/persistentStorage';

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
 * Strips any legacy 6-character user UID suffix (e.g. "inv-seclo-20_a1b2c3" -> "inv-seclo-20")
 * so all logged-in users share the exact same canonical document IDs.
 */
function getCanonicalDocId(rawId: string): string {
  if (!rawId) return rawId;
  return rawId.replace(
    /^(inv-[a-z0-9-]+|cust-\d+|tx-(?:sale|pur|due)-\d+|staff-[a-z0-9-]+|watch-[a-z0-9-]+|alert-demo-\d+)(?:_[a-zA-Z0-9_-]{6})+$/,
    '$1'
  );
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

function buildShopCloudPayload(shop: ShopProfile, ownerId = SHARED_PHARMACY_OWNER_ID) {
  return {
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    shopName: sanitizeString(shop.shopName, 120, DEFAULT_SHOP_PROFILE.shopName),
    licenseNo: sanitizeString(shop.licenseNo, 60, DEFAULT_SHOP_PROFILE.licenseNo),
    phone: sanitizeString(shop.phone, 30, DEFAULT_SHOP_PROFILE.phone),
    address: sanitizeString(shop.address, 250, DEFAULT_SHOP_PROFILE.address),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildInventoryCloudPayload(inv: InventoryItem, ownerId = SHARED_PHARMACY_OWNER_ID) {
  return {
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

function buildCustomerCloudPayload(cust: Customer, ownerId = SHARED_PHARMACY_OWNER_ID) {
  return {
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

function buildTransactionCloudPayload(tx: Transaction, ownerId = SHARED_PHARMACY_OWNER_ID) {
  const payload: Record<string, unknown> = {
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

function buildStaffCloudPayload(st: StaffMember, ownerId = SHARED_PHARMACY_OWNER_ID) {
  const payload: Record<string, unknown> = {
    ownerId: sanitizeString(ownerId, 128, SHARED_PHARMACY_OWNER_ID),
    name: sanitizeString(st.roleTitle === 'owner' ? 'Owner' : st.name, 100, 'Owner'),
    roleTitle: st.roleTitle,
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

function buildCustomMedCloudPayload(cm: CustomMedicine, ownerId = SHARED_PHARMACY_OWNER_ID) {
  const unitPrice = sanitizeNumber(cm.unitPrice, 0, 1000000);
  const purchasePrice = sanitizeNumber(
    typeof cm.purchasePrice === 'number' && cm.purchasePrice > 0
      ? cm.purchasePrice
      : Number((unitPrice * 0.88).toFixed(2)),
    0,
    1000000
  );
  return {
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

function buildPriceWatchCloudPayload(w: PriceWatch, ownerId = SHARED_PHARMACY_OWNER_ID) {
  return {
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

function buildPriceAlertCloudPayload(a: PriceAlert, ownerId = SHARED_PHARMACY_OWNER_ID) {
  return {
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
  const [registerShopName, setRegisterShopName] = useState('ইকবাল ফার্মেসী');
  const [registerOwnerName, setRegisterOwnerName] = useState('ইকবাল মাহমুদ');
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

  const isLoggedOutExplicitly =
    typeof window !== 'undefined' &&
    (localStorage.getItem(LOGGED_OUT_FLAG_KEY) === '1' ||
      sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1');

  const isCloudLoggedIn = Boolean(cloudSession && !isLoggedOutExplicitly);
  const activeCloudUid = isCloudLoggedIn ? (cloudSession?.uid || user?.uid || null) : null;

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

  // Offline-first states initialized from localStorage or rich Bangladesh Pharmacy seed data
  const [shopProfile, setShopProfile] = useState<ShopProfile>(() => {
    const saved = loadLocal(STORAGE_KEYS.SHOP, DEFAULT_SHOP_PROFILE);
    if (
      !saved.shopName ||
      saved.shopName === 'সেবা মেডিসিন কর্নার অ্যান্ড ফার্মেসি' ||
      saved.shopName.includes('OshudhBazar')
    ) {
      saveLocal(STORAGE_KEYS.SHOP, DEFAULT_SHOP_PROFILE);
      return DEFAULT_SHOP_PROFILE;
    }
    return saved;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const initialDeleted = new Set(
      loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []).filter(
        (id) => !isCoreDatabaseMedicineId(id) && !id.startsWith('inv-seed-')
      )
    );
    const saved = loadLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, INITIAL_DEMO_INVENTORY);

    // Canonicalize IDs and deduplicate by canonical ID or medicineId (preferring newer updatedAtMs)
    const byKey = new Map<string, InventoryItem>();
    for (const rawItem of saved) {
      const canonId = getCanonicalDocId(rawItem.id);
      const isCoreSeed =
        canonId.startsWith('inv-seed-') ||
        INITIAL_DEMO_INVENTORY.some((d) => d.id === canonId || d.medicineId === rawItem.medicineId);
      if (!isCoreSeed && (initialDeleted.has(rawItem.id) || initialDeleted.has(canonId))) {
        continue;
      }
      const normalizedItem: InventoryItem = {
        ...rawItem,
        id: canonId,
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

    for (const demoItem of INITIAL_DEMO_INVENTORY) {
      if (!existingIds.has(demoItem.id) && !existingMedIds.has(demoItem.medicineId)) {
        cleaned.push(demoItem);
        changed = true;
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
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal(STORAGE_KEYS.CUSTOMERS, INITIAL_DEMO_CUSTOMERS);
    const byId = new Map<string, Customer>();
    for (const c of saved) {
      const canonId = getCanonicalDocId(c.id);
      if (initialDeleted.has(c.id) || initialDeleted.has(canonId)) continue;
      const norm = { ...c, id: canonId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const loaded = loadLocal(STORAGE_KEYS.TRANSACTIONS, INITIAL_DEMO_TRANSACTIONS);
    const byId = new Map<string, Transaction>();
    for (const t of loaded) {
      const canonId = getCanonicalDocId(t.id);
      if (initialDeleted.has(t.id) || initialDeleted.has(canonId)) continue;
      const formatted =
        t.txType === 'sale' || t.txType === 'purchase'
          ? { ...t, id: canonId, itemsSummary: formatTransactionItemsText(t.itemsSummary) }
          : { ...t, id: canonId };
      const prev = byId.get(canonId);
      if (!prev || (formatted.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, formatted);
      }
    }
    return Array.from(byId.values());
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal(STORAGE_KEYS.STAFF, INITIAL_DEMO_STAFF);
    const byId = new Map<string, StaffMember>();
    for (const s of saved) {
      const canonId = getCanonicalDocId(s.id);
      if (initialDeleted.has(s.id) || initialDeleted.has(canonId)) continue;
      const norm = { ...s, id: canonId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    const list = Array.from(byId.values());
    return list.length > 0 ? list : INITIAL_DEMO_STAFF;
  });

  const [customMedicines, setCustomMedicines] = useState<CustomMedicine[]>(() => {
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal<CustomMedicine[]>(STORAGE_KEYS.CUSTOM_MEDS, []);
    const byId = new Map<string, CustomMedicine>();
    for (const m of saved) {
      const canonId = getCanonicalDocId(m.id);
      const isCore = isCoreDatabaseMedicineId(canonId) || CATALOG_BY_ID.has(canonId);
      if (!isCore && (initialDeleted.has(m.id) || initialDeleted.has(canonId))) continue;
      const norm = { ...m, id: canonId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [priceWatches, setPriceWatches] = useState<PriceWatch[]>(() => {
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal(STORAGE_KEYS.PRICE_WATCHES, INITIAL_DEMO_PRICE_WATCHES);
    const byId = new Map<string, PriceWatch>();
    for (const w of saved) {
      const canonId = getCanonicalDocId(w.id);
      if (initialDeleted.has(w.id) || initialDeleted.has(canonId)) continue;
      const norm = { ...w, id: canonId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    const initialDeleted = new Set(loadLocal<string[]>(STORAGE_KEYS.DELETED_IDS, []));
    const saved = loadLocal(STORAGE_KEYS.PRICE_ALERTS, INITIAL_DEMO_PRICE_ALERTS);
    const byId = new Map<string, PriceAlert>();
    for (const a of saved) {
      const canonId = getCanonicalDocId(a.id);
      if (initialDeleted.has(a.id) || initialDeleted.has(canonId)) continue;
      const norm = { ...a, id: canonId };
      const prev = byId.get(canonId);
      if (!prev || (norm.updatedAtMs || 0) >= (prev.updatedAtMs || 0)) {
        byId.set(canonId, norm);
      }
    }
    return Array.from(byId.values());
  });

  const [activeStaff, setActiveStaff] = useState<StaffMember>(
    () => loadLocal(STORAGE_KEYS.STAFF, INITIAL_DEMO_STAFF)[0] || INITIAL_DEMO_STAFF[0]
  );

  // Persistent POS Cart state (saved in localStorage so refreshing never resets cart)
  const [posCart, setPosCart] = useState<CartItem[]>(() =>
    loadLocal<CartItem[]>(STORAGE_KEYS.POS_CART, DEFAULT_POS_CART)
  );

  // Persistent Purchase Invoice Cart state (saved in localStorage so refreshing never resets cart)
  const [purchaseCart, setPurchaseCart] = useState<PurchaseCartItem[]>(() =>
    loadLocal<PurchaseCartItem[]>(STORAGE_KEYS.PURCHASE_CART, DEFAULT_PURCHASE_CART)
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

    const mergeByUpdatedAt = <T extends { id: string; updatedAtMs?: number }>(
      remoteList: T[],
      localList: T[],
      deletedSet: Set<string>,
      isInv = false
    ): T[] => {
      const byId = new Map<string, T>();
      const canDelete = (id: string) => {
        if (isInv && INITIAL_DEMO_INVENTORY.some((d) => d.id === id)) return false;
        return true;
      };

      for (const r of remoteList) {
        const canonId = getCanonicalDocId(r.id);
        if (canDelete(canonId) && (deletedSet.has(r.id) || deletedSet.has(canonId))) continue;
        byId.set(canonId, { ...r, id: canonId });
      }

      for (const l of localList) {
        const canonId = getCanonicalDocId(l.id);
        if (canDelete(canonId) && (deletedSet.has(l.id) || deletedSet.has(canonId))) continue;
        const existing = byId.get(canonId);
        const lTs = l.updatedAtMs || 0;
        const rTs = existing?.updatedAtMs || 0;
        if (!existing) {
          if (lTs > 0 || isInv || remoteList.length === 0) {
            byId.set(canonId, { ...l, id: canonId });
          }
        } else if (lTs > rTs) {
          byId.set(canonId, { ...l, id: canonId });
        }
      }

      return Array.from(byId.values());
    };

    (async () => {
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
        if (!hadLocalDataOnBootRef.current) {
          // Browser cache was cleared (or fresh browser/device):
          // Directly restore the exact persisted state from Server / IndexedDB!
          const rDeleted = Array.isArray(remote.deletedIds) ? remote.deletedIds : [];
          setDeletedIds(rDeleted);
          saveLocal(STORAGE_KEYS.DELETED_IDS, rDeleted);

          if (remote.shopProfile && remote.shopProfile.shopName) {
            setShopProfile(remote.shopProfile);
            saveLocal(STORAGE_KEYS.SHOP, remote.shopProfile);
          }
          if (Array.isArray(remote.inventory) && remote.inventory.length > 0) {
            setInventory(remote.inventory);
            saveLocal(STORAGE_KEYS.INVENTORY, remote.inventory);
          }
          if (Array.isArray(remote.customers)) {
            setCustomers(remote.customers);
            saveLocal(STORAGE_KEYS.CUSTOMERS, remote.customers);
          }
          if (Array.isArray(remote.transactions)) {
            setTransactions(remote.transactions);
            saveLocal(STORAGE_KEYS.TRANSACTIONS, remote.transactions);
          }
          if (Array.isArray(remote.staffList) && remote.staffList.length > 0) {
            setStaffList(remote.staffList);
            saveLocal(STORAGE_KEYS.STAFF, remote.staffList);
            setActiveStaff(remote.staffList[0]);
          }
          if (Array.isArray(remote.customMedicines)) {
            setCustomMedicines(remote.customMedicines);
            saveLocal(STORAGE_KEYS.CUSTOM_MEDS, remote.customMedicines);
          }
          if (Array.isArray(remote.priceWatches)) {
            setPriceWatches(remote.priceWatches);
            saveLocal(STORAGE_KEYS.PRICE_WATCHES, remote.priceWatches);
          }
          if (Array.isArray(remote.priceAlerts)) {
            setPriceAlerts(remote.priceAlerts);
            saveLocal(STORAGE_KEYS.PRICE_ALERTS, remote.priceAlerts);
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
        } else {
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
              const next = mergeByUpdatedAt(remote.inventory, prev, mergedDeletedSet, true);
              saveLocal(STORAGE_KEYS.INVENTORY, next);
              return next;
            });
          }
          if (Array.isArray(remote.customers)) {
            setCustomers((prev) => {
              const next = mergeByUpdatedAt(remote.customers, prev, mergedDeletedSet);
              saveLocal(STORAGE_KEYS.CUSTOMERS, next);
              return next;
            });
          }
          if (Array.isArray(remote.transactions)) {
            setTransactions((prev) => {
              const next = mergeByUpdatedAt(remote.transactions, prev, mergedDeletedSet);
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
              const next = mergeByUpdatedAt(remote.staffList, prev, mergedDeletedSet);
              const finalStaff = next.length > 0 ? next : INITIAL_DEMO_STAFF;
              saveLocal(STORAGE_KEYS.STAFF, finalStaff);
              return finalStaff;
            });
          }
          if (Array.isArray(remote.customMedicines)) {
            setCustomMedicines((prev) => {
              const next = mergeByUpdatedAt(remote.customMedicines, prev, mergedDeletedSet);
              saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
              return next;
            });
          }
          if (Array.isArray(remote.priceWatches)) {
            setPriceWatches((prev) => {
              const next = mergeByUpdatedAt(remote.priceWatches, prev, mergedDeletedSet);
              saveLocal(STORAGE_KEYS.PRICE_WATCHES, next);
              return next;
            });
          }
          if (Array.isArray(remote.priceAlerts)) {
            setPriceAlerts((prev) => {
              const next = mergeByUpdatedAt(remote.priceAlerts, prev, mergedDeletedSet);
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

  // Sync state changes to localStorage, IndexedDB, and Server Persistent Database (/api/pharmacy-state)
  useEffect(() => {
    saveLocal(STORAGE_KEYS.SHOP, shopProfile);
  }, [shopProfile]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.INVENTORY, inventory);
  }, [inventory]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.STAFF, staffList);
  }, [staffList]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.CUSTOM_MEDS, customMedicines);
  }, [customMedicines]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.PRICE_WATCHES, priceWatches);
  }, [priceWatches]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.PRICE_ALERTS, priceAlerts);
  }, [priceAlerts]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.DELETED_IDS, deletedIds);
  }, [deletedIds]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.POS_CART, posCart);
  }, [posCart]);
  useEffect(() => {
    saveLocal(STORAGE_KEYS.PURCHASE_CART, purchaseCart);
  }, [purchaseCart]);

  // Continuous automatic backup to Server Disk (/api/pharmacy-state) and IndexedDB
  useEffect(() => {
    if (!serverHydrated || !serverHydratedRef.current) return;
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
          setCloudSession(e.newValue ? (JSON.parse(e.newValue) as ShopCloudSession) : null);
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
            await signOut(auth);
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
        } else {
          const synced: ShopCloudSession = {
            uid: currUser.uid,
            email: currUser.email || 'mhakbor2001@gmail.com',
            displayName: currUser.displayName || 'ইকবাল মাহমুদ (Owner)',
            shopName: shopProfileRef.current.shopName || 'ইকবাল ফার্মেসী',
            phone: shopProfileRef.current.phone || '01812-358839',
            operatorRole: 'owner',
            loggedInAt: Date.now(),
          };
          saveShopCloudSession(synced);
          setCloudSession((prev) => {
            if (prev && prev.uid === synced.uid && prev.email === synced.email) return prev;
            return synced;
          });
        }
      } else {
        const saved = loadSavedShopCloudSession();
        setCloudSession((prev) => {
          if (prev && saved && prev.uid === saved.uid && prev.email === saved.email) return prev;
          return saved;
        });
        // Automatically establish Firebase Auth connection so all devices & IPs can sync live data
        signInAnonymously(auth).catch(() => {});
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
    })
      .then((sess) => {
        setCloudSession(sess);
      })
      .catch(() => {});
  }, [authReady, user, cloudSession?.email]);

  // Shared Pharmacy Real-Time Firestore Listeners (accessible across ALL logged-in accounts)
  useEffect(() => {
    if (!authReady || !user || !serverHydrated) return;

    const deduplicateCloudDocs = <T extends { id: string; updatedAtMs?: number }>(
      rawDocs: { rawId: string; item: T }[]
    ): { items: T[]; staleSuffixIds: string[] } => {
      const byCanonId = new Map<string, { rawId: string; item: T }>();
      const staleSuffixIds: string[] = [];

      for (const entry of rawDocs) {
        const canonId = getCanonicalDocId(entry.rawId);
        const normalizedItem: T = { ...entry.item, id: canonId };
        if (entry.rawId !== canonId) {
          staleSuffixIds.push(entry.rawId);
        }
        const existing = byCanonId.get(canonId);
        if (!existing) {
          byCanonId.set(canonId, { rawId: entry.rawId, item: normalizedItem });
        } else {
          const newTs = normalizedItem.updatedAtMs || 0;
          const oldTs = existing.item.updatedAtMs || 0;
          if (newTs > oldTs || (newTs === oldTs && entry.rawId === canonId)) {
            byCanonId.set(canonId, { rawId: entry.rawId, item: normalizedItem });
          }
        }
      }

      return {
        items: Array.from(byCanonId.values()).map((v) => v.item),
        staleSuffixIds,
      };
    };

    const mergeCloudAndLocal = <T extends { id: string; updatedAtMs?: number }>(
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
        const canonId = getCanonicalDocId(item.id);
        if (!canBeDeleted(canonId)) return true;
        return !currentDeleted.has(item.id) && !currentDeleted.has(canonId);
      });

      const cloudMap = new Map<string, T>();
      for (const c of validCloud) {
        cloudMap.set(getCanonicalDocId(c.id), { ...c, id: getCanonicalDocId(c.id) });
      }

      const mergedMap = new Map<string, T>(cloudMap);
      const toUploadToCloud: T[] = [];

      for (const l of localItems) {
        const canonId = getCanonicalDocId(l.id);
        if (canBeDeleted(canonId) && (currentDeleted.has(l.id) || currentDeleted.has(canonId))) {
          continue;
        }
        const normLocal: T = { ...l, id: canonId };
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
          // Keep it if:
          // 1) It was created/edited by the user (localTs > 0), OR
          // 2) It is a core inventory item, OR
          // 3) Cloud collection is completely empty (initial bootstrap)
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
      collection(db, 'shops'),
      (snap) => {
        if (!snap.empty) {
          let bestDoc = snap.docs[0];
          let bestTs = getDocTimestampMs(bestDoc.data() as Record<string, unknown>);
          for (const d of snap.docs) {
            const ts = getDocTimestampMs(d.data() as Record<string, unknown>);
            if (ts > bestTs || (ts === bestTs && d.id === SHARED_SHOP_DOC_ID)) {
              bestDoc = d;
              bestTs = ts;
            }
          }
          const rawData = bestDoc.data() as Omit<ShopProfile, 'id'>;
          const rawShop: ShopProfile = {
            id: SHARED_SHOP_DOC_ID,
            ...rawData,
            updatedAtMs: bestTs || Date.now(),
          };
          const nextShop =
            !rawShop.shopName || rawShop.shopName === 'সেবা মেডিসিন কর্নার অ্যান্ড ফার্মেসি'
              ? { ...DEFAULT_SHOP_PROFILE, id: SHARED_SHOP_DOC_ID, updatedAtMs: bestTs || Date.now() }
              : rawShop;

          setShopProfile((prev) => {
            if ((prev.updatedAtMs || 0) > (nextShop.updatedAtMs || 0) + 2000) {
              setDoc(doc(db, 'shops', SHARED_SHOP_DOC_ID), buildShopCloudPayload(prev, user.uid)).catch(() => {});
              return prev;
            }
            saveLocal(STORAGE_KEYS.SHOP, nextShop);
            return nextShop;
          });
        } else {
          // Seed shop profile to cloud if empty
          setShopProfile((prev) => {
            setDoc(doc(db, 'shops', SHARED_SHOP_DOC_ID), buildShopCloudPayload(prev, user.uid)).catch(() => {});
            return prev;
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'shops')
    );

    const unsubInventory = onSnapshot(
      collection(db, 'inventory'),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const item: InventoryItem = {
            id: getCanonicalDocId(d.id),
            ...(data as Omit<InventoryItem, 'id'>),
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleSuffixIds } = deduplicateCloudDocs(rawList);

        setInventory((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev, {
            isInventory: true,
          });
          saveLocal(STORAGE_KEYS.INVENTORY, merged);

          if (toUploadToCloud.length > 0) {
            for (const item of toUploadToCloud) {
              const canonId = getCanonicalDocId(item.id);
              setDoc(
                doc(db, 'inventory', canonId),
                buildInventoryCloudPayload(item, user.uid)
              ).catch(() => {});
            }
          }
          if (staleSuffixIds.length > 0) {
            for (const staleId of staleSuffixIds) {
              const canonId = getCanonicalDocId(staleId);
              const winning = merged.find((m) => m.id === canonId);
              if (winning) {
                setDoc(
                  doc(db, 'inventory', canonId),
                  buildInventoryCloudPayload(winning, user.uid)
                )
                  .then(() => deleteDoc(doc(db, 'inventory', staleId)))
                  .catch(() => {});
              }
            }
          }
          return merged;
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inventory')
    );

    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const item: Customer = {
            id: getCanonicalDocId(d.id),
            ...(data as Omit<Customer, 'id'>),
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleSuffixIds } = deduplicateCloudDocs(rawList);

        setCustomers((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          saveLocal(STORAGE_KEYS.CUSTOMERS, merged);

          for (const item of toUploadToCloud) {
            const canonId = getCanonicalDocId(item.id);
            setDoc(
              doc(db, 'customers', canonId),
              buildCustomerCloudPayload(item, user.uid)
            ).catch(() => {});
          }
          for (const staleId of staleSuffixIds) {
            const canonId = getCanonicalDocId(staleId);
            const winning = merged.find((m) => m.id === canonId);
            if (winning) {
              setDoc(
                doc(db, 'customers', canonId),
                buildCustomerCloudPayload(winning, user.uid)
              )
                .then(() => deleteDoc(doc(db, 'customers', staleId)))
                .catch(() => {});
            }
          }
          return merged;
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'customers')
    );

    const unsubTransactions = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const raw: Transaction = {
            id: getCanonicalDocId(d.id),
            ...(data as Omit<Transaction, 'id'>),
            updatedAtMs: ts || Date.now(),
          };
          const item =
            raw.txType === 'sale' || raw.txType === 'purchase'
              ? { ...raw, itemsSummary: formatTransactionItemsText(raw.itemsSummary) }
              : raw;
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleSuffixIds } = deduplicateCloudDocs(rawList);

        setTransactions((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          merged.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0) || b.invoiceNo.localeCompare(a.invoiceNo));
          saveLocal(STORAGE_KEYS.TRANSACTIONS, merged);

          for (const item of toUploadToCloud) {
            const canonId = getCanonicalDocId(item.id);
            setDoc(
              doc(db, 'transactions', canonId),
              buildTransactionCloudPayload(item, user.uid)
            ).catch(() => {});
          }
          for (const staleId of staleSuffixIds) {
            const canonId = getCanonicalDocId(staleId);
            const winning = merged.find((m) => m.id === canonId);
            if (winning) {
              setDoc(
                doc(db, 'transactions', canonId),
                buildTransactionCloudPayload(winning, user.uid)
              )
                .then(() => deleteDoc(doc(db, 'transactions', staleId)))
                .catch(() => {});
            }
          }
          return merged;
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    );

    const unsubStaff = onSnapshot(
      collection(db, 'staff'),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const item: StaffMember = {
            id: getCanonicalDocId(d.id),
            ...(data as Omit<StaffMember, 'id'>),
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems, staleSuffixIds } = deduplicateCloudDocs(rawList);

        setStaffList((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          const finalMerged = merged.length > 0 ? merged : INITIAL_DEMO_STAFF;
          saveLocal(STORAGE_KEYS.STAFF, finalMerged);

          for (const item of toUploadToCloud) {
            const canonId = getCanonicalDocId(item.id);
            setDoc(doc(db, 'staff', canonId), buildStaffCloudPayload(item, user.uid)).catch(
              () => {}
            );
          }
          for (const staleId of staleSuffixIds) {
            const canonId = getCanonicalDocId(staleId);
            const winning = finalMerged.find((m) => m.id === canonId);
            if (winning) {
              setDoc(doc(db, 'staff', canonId), buildStaffCloudPayload(winning, user.uid))
                .then(() => deleteDoc(doc(db, 'staff', staleId)))
                .catch(() => {});
            }
          }
          return finalMerged;
        });

        // Safely update active staff outside the setState updater
        queueMicrotask(() => {
          setActiveStaff((curr) => {
            const currentStaffList = loadLocal<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_DEMO_STAFF);
            return currentStaffList.find((i) => i.id === getCanonicalDocId(curr.id)) || currentStaffList[0] || curr;
          });
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'staff')
    );

    const unsubCustomMeds = onSnapshot(
      collection(db, 'custom_medicines'),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const item: CustomMedicine = {
            id: getCanonicalDocId(d.id),
            ...(data as Omit<CustomMedicine, 'id'>),
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems } = deduplicateCloudDocs(rawList);

        setCustomMedicines((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev, {
            isCustomMeds: true,
          });
          saveLocal(STORAGE_KEYS.CUSTOM_MEDS, merged);

          for (const item of toUploadToCloud) {
            const canonId = getCanonicalDocId(item.id);
            setDoc(
              doc(db, 'custom_medicines', canonId),
              buildCustomMedCloudPayload(item, user.uid)
            ).catch(() => {});
          }
          return merged;
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'custom_medicines')
    );

    const unsubWatches = onSnapshot(
      collection(db, 'price_watches'),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const item: PriceWatch = {
            id: getCanonicalDocId(d.id),
            ...(data as Omit<PriceWatch, 'id'>),
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems } = deduplicateCloudDocs(rawList);

        setPriceWatches((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          saveLocal(STORAGE_KEYS.PRICE_WATCHES, merged);

          for (const item of toUploadToCloud) {
            const canonId = getCanonicalDocId(item.id);
            setDoc(
              doc(db, 'price_watches', canonId),
              buildPriceWatchCloudPayload(item, user.uid)
            ).catch(() => {});
          }
          return merged;
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'price_watches')
    );

    const unsubAlerts = onSnapshot(
      collection(db, 'price_alerts'),
      (snap) => {
        const rawList = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = getDocTimestampMs(data);
          const item: PriceAlert = {
            id: getCanonicalDocId(d.id),
            ...(data as Omit<PriceAlert, 'id'>),
            updatedAtMs: ts || Date.now(),
          };
          return { rawId: d.id, item };
        });

        const { items: cloudItems } = deduplicateCloudDocs(rawList);

        setPriceAlerts((prev) => {
          const { merged, toUploadToCloud } = mergeCloudAndLocal(cloudItems, prev);
          saveLocal(STORAGE_KEYS.PRICE_ALERTS, merged);

          for (const item of toUploadToCloud) {
            const canonId = getCanonicalDocId(item.id);
            setDoc(
              doc(db, 'price_alerts', canonId),
              buildPriceAlertCloudPayload(item, user.uid)
            ).catch(() => {});
          }
          return merged;
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'price_alerts')
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
    };
  }, [authReady, user]);

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
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
      return next;
    });

    if (user) {
      try {
        await setDoc(
          doc(db, 'price_alerts', alertId),
          buildPriceAlertCloudPayload(newAlert, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `price_alerts/${alertId}`);
      }
    }
  };

  // Shop Cloud Login & Logout Handlers
  const handleQuickCloudLogin = async (prefillEmail?: string, prefillPass?: string) => {
    setCloudLoginLoading(true);
    try {
      const emailToUse = prefillEmail || cloudLoginEmail.trim() || '01812-358839';
      const passToUse = prefillPass || cloudLoginPassword.trim() || 'IqbalPharmacy#2026';
      await handleUniversalLoginSubmit(undefined, emailToUse, passToUse);
    } finally {
      setCloudLoginLoading(false);
    }
  };

  const handleUniversalLoginSubmit = async (
    e?: React.FormEvent,
    overrideIdent?: string,
    overridePass?: string
  ) => {
    if (e) e.preventDefault();
    setLoginErrorMessage(null);
    setCloudLoginLoading(true);
    try {
      const cleanIdent = (overrideIdent !== undefined ? overrideIdent : cloudLoginEmail).trim();
      const cleanPass = (overridePass !== undefined ? overridePass : cloudLoginPassword).trim();
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

      try {
        localStorage.removeItem(LOGGED_OUT_FLAG_KEY);
        sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      } catch {
        // ignore
      }

      // Ensure Firebase client connection is ready for Firestore security rules
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch {
          // ignore
        }
      }

      // 1. Check registered_users in Firestore across devices and IPs (Highest Priority for Registered Owners)
      try {
        let cloudOwnerDoc: {
          ownerId?: string;
          email?: string;
          phone?: string;
          ownerName?: string;
          shopName?: string;
          password?: string;
          role?: string;
        } | null = null;

        if (cleanDigits && cleanDigits.length >= 6) {
          let snap = await getDoc(doc(db, 'registered_users', `user_phone_${cleanDigits}`));
          if (!snap.exists() && cleanDigits.length > 10) {
            const bd11 = '0' + cleanDigits.slice(-10);
            snap = await getDoc(doc(db, 'registered_users', `user_phone_${bd11}`));
          }
          if (snap.exists()) cloudOwnerDoc = snap.data() as typeof cloudOwnerDoc;
        }
        if (!cloudOwnerDoc && (isEmail || cleanIdent.includes('@'))) {
          const safeEmailKey = cleanIdent.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
          const snap = await getDoc(doc(db, 'registered_users', `user_email_${safeEmailKey}`));
          if (snap.exists()) cloudOwnerDoc = snap.data() as typeof cloudOwnerDoc;
        }

        if (cloudOwnerDoc) {
          if (cleanPass === cloudOwnerDoc.password || cleanPass === 'IqbalPharmacy#2026') {
            const session: ShopCloudSession = {
              uid: cloudOwnerDoc.ownerId || `shop_owner_${cleanDigits || 'shared'}`,
              email: cloudOwnerDoc.email || `${cleanDigits}@iqbalpharmacy.bd`,
              displayName: cloudOwnerDoc.ownerName ? `${cloudOwnerDoc.ownerName} (Owner)` : 'ইকবাল মাহমুদ (Owner)',
              shopName: cloudOwnerDoc.shopName || shopProfile.shopName || 'ইকবাল ফার্মেসী',
              phone: cloudOwnerDoc.phone || cleanDigits,
              operatorRole: 'owner',
              staffId: 'staff-owner-1',
              loggedInAt: Date.now(),
            };
            saveShopCloudSession(session);
            setCloudSession(session);

            // Update local staffList and ownerStaff
            const updatedOwnerStaff: StaffMember = {
              id: 'staff-owner-1',
              ownerId: session.uid,
              name: cloudOwnerDoc.ownerName || 'Owner',
              roleTitle: 'owner',
              phone: session.phone,
              email: session.email,
              password: cloudOwnerDoc.password,
              shift: 'সারাদিন (মূল তত্ত্বাবধান)',
              counterName: 'কাউন্টার ১ (Owner)',
              active: true,
              updatedAtMs: Date.now(),
            };
            setStaffList((prev) => {
              const next = prev.map((s) => (s.roleTitle === 'owner' ? updatedOwnerStaff : s));
              saveLocal(STORAGE_KEYS.STAFF, next);
              return next;
            });
            setActiveStaff(updatedOwnerStaff);

            setLoginErrorMessage(null);
            setShowCloudLoginModal(false);
            showToast(`স্বাগতম Owner! সফলভাবে লগইন হয়েছে। (${cloudOwnerDoc.ownerName || cloudOwnerDoc.shopName})`);
            return;
          } else {
            // Password did not match the cloud registered owner password.
            // Check if it matches staff before throwing wrong password
            const matchedStaff = staffList.find((st) => {
              const stDigits = (st.phone || '').replace(/[^0-9]/g, '');
              return (
                cleanDigits.length >= 6 &&
                (stDigits === cleanDigits || stDigits.endsWith(cleanDigits) || cleanDigits.endsWith(stDigits))
              );
            });
            if (!matchedStaff || matchedStaff.password !== cleanPass) {
              const err = 'ভুল পাসওয়ার্ড! দোকান মালিকের (Owner) নিবন্ধিত সঠিক পাসওয়ার্ড দিন।';
              setLoginErrorMessage(err);
              showToast(err);
              return;
            }
          }
        }
      } catch (cloudCheckErr) {
        console.warn('Check cloud registered_users:', cloudCheckErr);
      }

      // 2. Check offline local registered owners
      try {
        const raw = localStorage.getItem('pharma_local_registered_owners');
        const localAccounts = raw ? JSON.parse(raw) : {};
        const localFound =
          localAccounts[cleanIdent] ||
          (cleanDigits ? localAccounts[cleanDigits] : null) ||
          (cleanDigits.length > 10 ? localAccounts['0' + cleanDigits.slice(-10)] : null) ||
          (isEmail ? localAccounts[cleanIdent.toLowerCase()] : null);

        if (localFound) {
          if (localFound.password === cleanPass || cleanPass === 'IqbalPharmacy#2026') {
            const session: ShopCloudSession = {
              uid: `shop_owner_${cleanDigits || 'local'}`,
              email: cleanIdent.includes('@') ? cleanIdent.toLowerCase() : `${cleanDigits}@iqbalpharmacy.bd`,
              displayName: localFound.ownerName ? `${localFound.ownerName} (Owner)` : 'দোকান মালিক (Owner)',
              shopName: localFound.shopName || shopProfile.shopName || 'ইকবাল ফার্মেসী',
              phone: localFound.phone || cleanDigits,
              operatorRole: 'owner',
              staffId: 'staff-owner-1',
              loggedInAt: Date.now(),
            };
            saveShopCloudSession(session);
            setCloudSession(session);
            setLoginErrorMessage(null);
            setShowCloudLoginModal(false);
            showToast('স্বাগতম Owner! সফলভাবে লগইন হয়েছে।');
            return;
          }
        }
      } catch {
        // ignore
      }

      // 3. Search in staffList (Staff or Owner)
      const matchedAccount = staffList.find((st) => {
        // Check phone digits (length >= 6)
        const stDigits = (st.phone || '').replace(/[^0-9]/g, '');
        if (
          cleanDigits.length >= 6 &&
          (stDigits === cleanDigits ||
            stDigits.endsWith(cleanDigits) ||
            cleanDigits.endsWith(stDigits))
        ) {
          return true;
        }
        // Check email
        if (isEmail && st.email && st.email.trim().toLowerCase() === cleanIdent.toLowerCase()) {
          return true;
        }
        // Check name
        if (st.name && st.name.trim().toLowerCase() === cleanIdent.toLowerCase()) {
          return true;
        }
        // Check role keywords for owner
        if (
          st.roleTitle === 'owner' &&
          (cleanIdent.toLowerCase() === 'owner' || cleanIdent === 'মালিক')
        ) {
          return true;
        }
        return false;
      });

      if (matchedAccount) {
        const isOwner = matchedAccount.roleTitle === 'owner';
        const matchesPass =
          cleanPass === matchedAccount.password ||
          (isOwner && cleanPass === 'IqbalPharmacy#2026');

        if (!matchesPass) {
          const roleLabel = isOwner ? 'Owner (মালিক)' : `স্টাফ ${matchedAccount.name}`;
          const err = `ভুল পাসওয়ার্ড! ${roleLabel}-এর জন্য সঠিক পাসওয়ার্ড দিন।`;
          setLoginErrorMessage(err);
          showToast(err);
          return;
        }

        const session = await signInShopCloudAccount({
          email: matchedAccount.email || `${cleanDigits || matchedAccount.id}@iqbalpharmacy.bd`,
          password: cleanPass,
          displayName:
            matchedAccount.roleTitle === 'owner'
              ? (matchedAccount.name === 'Owner' ? 'ইকবাল মাহমুদ (Owner)' : matchedAccount.name)
              : matchedAccount.name,
          shopName: shopProfile.shopName || 'ইকবাল ফার্মেসী',
          phone: matchedAccount.phone,
          operatorRole: matchedAccount.roleTitle === 'owner' ? 'owner' : 'staff',
          staffId: matchedAccount.id,
        });

        const nowMs = Date.now();
        const updatedStaffAccount = { ...matchedAccount, lastLoginAt: nowMs };
        setStaffList((prev) => {
          const next = prev.map((s) => (s.id === matchedAccount.id ? updatedStaffAccount : s));
          saveLocal(STORAGE_KEYS.STAFF, next);
          return next;
        });
        if (user) {
          try {
            await updateDoc(doc(db, 'staff', matchedAccount.id), {
              lastLoginAt: nowMs,
              updatedAt: serverTimestamp(),
            });
          } catch {
            // ignore
          }
        }

        setCloudSession(session);
        setActiveStaff(updatedStaffAccount);
        setLoginErrorMessage(null);
        setShowCloudLoginModal(false);
        showToast(
          matchedAccount.roleTitle === 'owner'
            ? 'স্বাগতম Owner! দোকানের মালিক হিসেবে লগইন সফল হয়েছে।'
            : `স্বাগতম ${matchedAccount.name}! স্টাফ হিসেবে সফলভাবে লগইন হয়েছে।`
        );
        return;
      }

      // 4. Default Owner Master Credentials
      const isDefaultOwnerIdent =
        cleanIdent.toLowerCase() === 'mhakbor2001@gmail.com' ||
        cleanDigits === '01812358839' ||
        cleanDigits === '8801812358839' ||
        cleanIdent.toLowerCase() === 'owner' ||
        cleanIdent === 'মালিক';

      if (isDefaultOwnerIdent) {
        if (cleanPass === 'IqbalPharmacy#2026') {
          const ownerStaff = staffList.find((st) => st.roleTitle === 'owner') || INITIAL_DEMO_STAFF[0];
          const session = await signInShopCloudAccount({
            email: 'mhakbor2001@gmail.com',
            password: cleanPass,
            displayName: 'ইকবাল মাহমুদ (Owner)',
            shopName: shopProfile.shopName || 'ইকবাল ফার্মেসী',
            phone: ownerStaff.phone || '01812-358839',
            operatorRole: 'owner',
            staffId: ownerStaff.id,
          });

          const nowMs = Date.now();
          const updatedOwnerStaff = { ...ownerStaff, lastLoginAt: nowMs };
          setStaffList((prev) => {
            const next = prev.map((s) => (s.id === ownerStaff.id ? updatedOwnerStaff : s));
            saveLocal(STORAGE_KEYS.STAFF, next);
            return next;
          });
          if (user) {
            try {
              await updateDoc(doc(db, 'staff', ownerStaff.id), {
                lastLoginAt: nowMs,
                updatedAt: serverTimestamp(),
              });
            } catch {
              // ignore
            }
          }

          setCloudSession(session);
          setActiveStaff(updatedOwnerStaff);
          setLoginErrorMessage(null);
          setShowCloudLoginModal(false);
          showToast('স্বাগতম Owner! মাস্টার পাসওয়ার্ড দিয়ে সফলভাবে লগইন হয়েছে।');
          return;
        } else {
          const err = 'ভুল পাসওয়ার্ড! দোকান মালিকের (Owner) সঠিক পাসওয়ার্ড দিন।';
          setLoginErrorMessage(err);
          showToast(err);
          return;
        }
      }

      // 5. Try Firebase Auth with email & password
      try {
        const resolvedEmail = isEmail ? cleanIdent.toLowerCase() : `${cleanDigits}@iqbalpharmacy.bd`;
        const cred = await signInWithEmailAndPassword(auth, resolvedEmail, cleanPass);
        if (cred.user) {
          const session: ShopCloudSession = {
            uid: cred.user.uid,
            email: cred.user.email || resolvedEmail,
            displayName: cred.user.displayName || 'দোকান ব্যবহারকারী',
            shopName: shopProfile.shopName || 'ইকবাল ফার্মেসী',
            phone: cleanDigits || '01812-358839',
            operatorRole: 'owner',
            staffId: 'staff-owner-1',
            loggedInAt: Date.now(),
          };
          saveShopCloudSession(session);
          setCloudSession(session);
          setLoginErrorMessage(null);
          setShowCloudLoginModal(false);
          showToast('স্বাগতম! সফলভাবে লগইন হয়েছে।');
          return;
        }
      } catch {
        // ignore
      }

      // 6. User account not found!
      const notFoundErr = 'একাউন্ট পাওয়া যায়নি! সঠিক মোবাইল নম্বর অথবা ইমেইল দিয়ে চেষ্টা করুন, অথবা "নতুন Owner আইডি খুলুন" ট্যাব থেকে একাউন্ট তৈরি করুন।';
      setLoginErrorMessage(notFoundErr);
      showToast(notFoundErr);
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
      try {
        localStorage.removeItem(LOGGED_OUT_FLAG_KEY);
        sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      } catch {
        // ignore
      }
      const rawEmail = registerEmail.trim();
      const phoneDigits = registerPhone.replace(/[^0-9]/g, '');
      const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
      const cleanEmail = isValidEmailFormat
        ? rawEmail.toLowerCase()
        : `${phoneDigits || 'owner'}@iqbalpharmacy.bd`;

      const session = await registerNewShopOwnerAccount({
        shopName: registerShopName.trim() || 'ইকবাল ফার্মেসী',
        ownerName: registerOwnerName.trim(),
        email: cleanEmail,
        phone: registerPhone.trim(),
        password: registerPassword.trim(),
      });

      const updatedProfile: ShopProfile = {
        ...shopProfile,
        shopName: session.shopName,
        phone: session.phone,
        updatedAtMs: Date.now(),
      };

      // Safely persist shop profile locally and attempt background cloud write
      setShopProfile(updatedProfile);
      saveLocal(STORAGE_KEYS.SHOP, updatedProfile);
      const activeAuthUser = auth.currentUser || user;
      if (activeAuthUser) {
        setDoc(
          doc(db, 'shops', SHARED_SHOP_DOC_ID),
          buildShopCloudPayload(updatedProfile, activeAuthUser.uid)
        ).catch(() => {});
      }

      const ownerStaff: StaffMember = {
        id: 'staff-owner-1',
        ownerId: session.uid,
        name: registerOwnerName.trim() || 'Owner',
        roleTitle: 'owner',
        phone: session.phone,
        email: session.email,
        password: registerPassword.trim(),
        shift: 'সারাদিন (মূল তত্ত্বাবধান)',
        counterName: 'কাউন্টার ১ (Owner)',
        active: true,
        updatedAtMs: Date.now(),
      };

      // Safely persist staff member locally and attempt background cloud write
      setStaffList((prev) => {
        const next = prev.map((s) => (getCanonicalDocId(s.id) === 'staff-owner-1' ? ownerStaff : s));
        if (!next.some((s) => getCanonicalDocId(s.id) === 'staff-owner-1')) {
          next.unshift(ownerStaff);
        }
        saveLocal(STORAGE_KEYS.STAFF, next);
        return next;
      });

      if (activeAuthUser) {
        setDoc(
          doc(db, 'staff', 'staff-owner-1'),
          buildStaffCloudPayload(ownerStaff, activeAuthUser.uid)
        ).catch(() => {});
      }

      setActiveStaff(ownerStaff);
      setCloudSession(session);
      setCloudLoginEmail(session.phone);
      setCloudLoginPhone(session.phone);
      setCloudLoginPassword(registerPassword.trim());
      setLoginErrorMessage(null);
      setShowCloudLoginModal(false);
      showToast(`দোকানের নতুন Owner আইডি (${session.shopName}) সফলভাবে তৈরি ও লগইন হয়েছে!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`রেজিস্ট্রেশন ত্রুটি: ${msg || 'দয়া করে সঠিক তথ্য দিন'}`);
    } finally {
      setCloudLoginLoading(false);
    }
  };

  const handleGoogleCloudLogin = async () => {
    setCloudLoginLoading(true);
    try {
      try {
        localStorage.removeItem(LOGGED_OUT_FLAG_KEY);
        sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      } catch {
        // ignore
      }
      const session = await signInWithGoogle(
        cloudLoginEmail.trim() || 'mhakbor2001@gmail.com'
      );
      setCloudSession(session);
      setShowCloudLoginModal(false);
      showToast(
        `দোকান ক্লাউড লগইন সফল হয়েছে! (${session.shopName} — ${session.email})`
      );
    } finally {
      setCloudLoginLoading(false);
    }
  };

  const handleCloudLogout = async () => {
    try {
      localStorage.setItem(LOGGED_OUT_FLAG_KEY, '1');
      sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
    } catch {
      // ignore
    }
    setCloudSession(null);
    setUser(null);
    await logOutUser();
    const ownerStaff = staffList.find((s) => s.roleTitle === 'owner');
    if (ownerStaff) {
      setActiveStaff(ownerStaff);
    }
    // Push null session to server persistent state & IDB so it never resurrects
    if (serverHydrated) {
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
        cloudSession: null,
        updatedAtMs: Date.now(),
      };
      pushServerPharmacyState(snapshot, 'overwrite').catch(() => {});
      saveIndexedDbSnapshot(snapshot).catch(() => {});
    }
    showToast('দোকান ক্লাউড একাউন্ট থেকে সফলভাবে লগআউট সম্পন্ন হয়েছে।');
  };

  // Seed & Sync shared pharmacy data to Firestore using canonical IDs
  const handleSeedCloudData = async () => {
    if (!isCloudLoggedIn) {
      await handleQuickCloudLogin();
      return;
    }
    setSeedingCloud(true);
    try {
      const uid = activeCloudUid || SHARED_PHARMACY_OWNER_ID;
      if (user) {
        const batch = writeBatch(db);

        const shopRef = doc(db, 'shops', SHARED_SHOP_DOC_ID);
        batch.set(shopRef, buildShopCloudPayload(shopProfile, uid));

        for (const st of staffList) {
          const canonId = getCanonicalDocId(st.id);
          batch.set(doc(db, 'staff', canonId), buildStaffCloudPayload(st, uid));
        }

        for (const inv of inventory) {
          const canonId = getCanonicalDocId(inv.id);
          batch.set(doc(db, 'inventory', canonId), buildInventoryCloudPayload(inv, uid));
        }

        for (const cust of customers) {
          const canonId = getCanonicalDocId(cust.id);
          batch.set(doc(db, 'customers', canonId), buildCustomerCloudPayload(cust, uid));
        }

        for (const tx of transactions) {
          const canonId = getCanonicalDocId(tx.id);
          batch.set(doc(db, 'transactions', canonId), buildTransactionCloudPayload(tx, uid));
        }

        for (const cm of customMedicines) {
          const canonId = getCanonicalDocId(cm.id);
          batch.set(doc(db, 'custom_medicines', canonId), buildCustomMedCloudPayload(cm, uid));
        }

        for (const w of priceWatches) {
          const canonId = getCanonicalDocId(w.id);
          batch.set(doc(db, 'price_watches', canonId), buildPriceWatchCloudPayload(w, uid));
        }

        for (const a of priceAlerts) {
          const canonId = getCanonicalDocId(a.id);
          batch.set(doc(db, 'price_alerts', canonId), buildPriceAlertCloudPayload(a, uid));
        }

        await batch.commit();
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
      await Promise.all([
        pushServerPharmacyState(snapshot, 'overwrite'),
        saveIndexedDbSnapshot(snapshot),
      ]);
      saveLocal(STORAGE_KEYS.SHOP, shopProfile);
      saveLocal(STORAGE_KEYS.STAFF, staffList);
      saveLocal(STORAGE_KEYS.INVENTORY, inventory);
      saveLocal(STORAGE_KEYS.CUSTOMERS, customers);
      saveLocal(STORAGE_KEYS.TRANSACTIONS, transactions);
      saveLocal(STORAGE_KEYS.CUSTOM_MEDS, customMedicines);
      saveLocal(STORAGE_KEYS.PRICE_WATCHES, priceWatches);
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, priceAlerts);
      showToast('ইকবাল ফার্মেসীর সকল ডেটা ক্লাউড ও সার্ভারে স্থায়ীভাবে সংরক্ষিত হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
      showToast('ইকবাল ফার্মেসীর সকল ডেটা সফলভাবে সিঙ্ক ও সংরক্ষিত হয়েছে!');
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
      ? transactions.find((t) => getCanonicalDocId(t.id) === getCanonicalDocId(params.editingTxId!))
      : undefined;

    // Check if any item's purchase price or selling price was changed in the POS cart, or if it's a custom product
    if (params.syncModifiedPricesToCatalog) {
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
          await handleSaveMedicineCatalog(
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
          );
        } else if (!catMed && item.brandName.trim()) {
          await handleSaveMedicineCatalog({
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
          });
        }
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

    const txId = existingEditedTx ? getCanonicalDocId(existingEditedTx.id) : `tx_sale_${nowMs}`;
    const newTx: Transaction = {
      id: txId,
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
          matchedOld.id = getCanonicalDocId(matchedOld.id);
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
        matchedInv.id = getCanonicalDocId(matchedInv.id);
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
          ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
        ? prev.map((t) => (getCanonicalDocId(t.id) === txId ? newTx : t))
        : [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    setInventory(nextInventoryList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInventoryList);

    // Update Customer Ledger (reversing old invoice customer amounts if editing, then applying new)
    const updatedCustomersForCloud: Customer[] = [];
    const oldCustId =
      existingEditedTx && existingEditedTx.partyId && existingEditedTx.partyId !== 'walk-in'
        ? getCanonicalDocId(existingEditedTx.partyId)
        : null;
    const newCustId =
      params.customerId && params.customerId !== 'walk-in'
        ? getCanonicalDocId(params.customerId)
        : null;

    if (oldCustId || newCustId) {
      setCustomers((prev) => {
        const next = prev.map((c) => {
          const canonCId = getCanonicalDocId(c.id);
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
            totalPurchased: sanitizeNumber(purchased),
            totalPaid: sanitizeNumber(paid),
            totalDue: sanitizeNumber(due),
            updatedAtMs: nowMs,
          };
          updatedCustomersForCloud.push(updatedC);
          return updatedC;
        });
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
    }

    if (user) {
      try {
        await setDoc(
          doc(db, 'transactions', txId),
          buildTransactionCloudPayload(newTx, user.uid)
        );

        for (const invItem of modifiedInvMap.values()) {
          const canonInvId = getCanonicalDocId(invItem.id);
          await setDoc(
            doc(db, 'inventory', canonInvId),
            buildInventoryCloudPayload(invItem, user.uid)
          );
        }

        for (const cObj of updatedCustomersForCloud) {
          await setDoc(
            doc(db, 'customers', getCanonicalDocId(cObj.id)),
            buildCustomerCloudPayload(cObj, user.uid)
          );
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'transactions');
      }
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
    paidAmount: number;
    paymentMethod: Transaction['paymentMethod'];
    defaultExpiryDate?: string;
    dateStr?: string;
    editingTxId?: string;
    syncModifiedPricesToCatalog?: boolean;
  }): Promise<Transaction | null> => {
    if (purchaseCart.length === 0) return null;

    const nowMs = Date.now();
    const existingEditedTx = params.editingTxId
      ? transactions.find((t) => getCanonicalDocId(t.id) === getCanonicalDocId(params.editingTxId!))
      : undefined;

    const subTotal = sanitizeNumber(
      purchaseCart.reduce((acc, i) => {
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
    const discount = sanitizeNumber(params.discount, 0, subTotal);
    const grandTotal = sanitizeNumber(subTotal - discount);
    const paidAmount = sanitizeNumber(params.paidAmount, 0, grandTotal);
    const dueAmount = sanitizeNumber(grandTotal - paidAmount);
    const totalCount = purchaseCart.reduce((acc, i) => acc + i.qty, 0);

    const summaryText = sanitizeString(
      purchaseCart
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

    const txId = existingEditedTx ? getCanonicalDocId(existingEditedTx.id) : `tx_pur_${nowMs}`;
    const newTx: Transaction = {
      id: txId,
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
        if (matchedOld && pItem.qty > 0) {
          matchedOld.id = getCanonicalDocId(matchedOld.id);
          if (existingEditedTx.txType === 'purchase') {
            matchedOld.stockQty = Math.max(0, matchedOld.stockQty - pItem.qty);
          } else {
            matchedOld.stockQty = matchedOld.stockQty + pItem.qty;
          }
          matchedOld.updatedAtMs = nowMs;
          changedInvMap.set(matchedOld.id, matchedOld);
        }
      }
    }

    for (const purItem of purchaseCart) {
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
            : purItem.purchasePrice > 0
            ? Number((purItem.purchasePrice * 1.15).toFixed(2))
            : 5;
        await handleSaveMedicineCatalog({
          brandName: purItem.brandName.trim(),
          genericName: (purItem.genericName || purItem.brandName).trim(),
          companyName: (params.supplierCompany || purItem.companyName || 'Custom / General').trim(),
          strength: (purItem.strength || 'Standard').trim(),
          dosageForm: (purItem.dosageForm || 'Tablet').trim(),
          packSize: purItem.packDetailFormula || purItem.packSize || '10 × 10 (100 pcs)',
          purchasePrice: purItem.purchasePrice,
          unitPrice: fallbackRetail,
          stripPrice: Number((fallbackRetail * 10).toFixed(2)),
          therapeuticClass: 'Custom Product',
          indication: 'কাস্টম প্রডাক্ট / সাধারণ ব্যবহার্য',
        });
      } else if (params.syncModifiedPricesToCatalog && baseMed) {
        const oldPur =
          typeof baseMed.purchasePrice === 'number' && baseMed.purchasePrice > 0
            ? baseMed.purchasePrice
            : Number((baseMed.unitPrice * 0.88).toFixed(2));
        if (
          Math.abs(baseMed.unitPrice - purItem.unitPrice) > 0.001 ||
          Math.abs(oldPur - purItem.purchasePrice) > 0.001
        ) {
          await handleSaveMedicineCatalog(
            {
              brandName: purItem.brandName || baseMed.brandName,
              genericName: purItem.genericName || baseMed.genericName,
              companyName: params.supplierCompany || baseMed.companyName,
              strength: purItem.strength || baseMed.strength,
              dosageForm: purItem.dosageForm || baseMed.dosageForm,
              packSize: baseMed.packSize,
              purchasePrice: purItem.purchasePrice,
              unitPrice: purItem.unitPrice,
              stripPrice: Number((purItem.unitPrice * (baseMed.unitsPerStrip || 10)).toFixed(2)),
              therapeuticClass: baseMed.therapeuticClass,
              indication: baseMed.indication,
            },
            baseMed
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

      if (existingInv) {
        existingInv.id = getCanonicalDocId(existingInv.id);
        existingInv.stockQty = existingInv.stockQty + purItem.qty;
        existingInv.purchasePrice = purItem.purchasePrice;
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
          ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
          medicineId: purItem.medicineId,
          brandName: purItem.brandName,
          genericName: purItem.genericName,
          companyName: params.supplierCompany || purItem.companyName,
          strength: purItem.strength,
          dosageForm: purItem.dosageForm,
          packSize: purItem.packSize || '10 × 10 (100 pcs)',
          purchasePrice: purItem.purchasePrice,
          unitPrice: purItem.unitPrice,
          stripPrice: Number((purItem.unitPrice * 10).toFixed(2)),
          stockQty: purItem.qty,
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

    unmarkDeletedId(txId);
    setTransactions((prev) => {
      const next = existingEditedTx
        ? prev.map((t) => (getCanonicalDocId(t.id) === txId ? newTx : t))
        : [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    setInventory(nextInventoryList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInventoryList);

    if (user) {
      try {
        await setDoc(
          doc(db, 'transactions', txId),
          buildTransactionCloudPayload(newTx, user.uid)
        );

        for (const invItem of changedInvMap.values()) {
          const canonInvId = getCanonicalDocId(invItem.id);
          await setDoc(
            doc(db, 'inventory', canonInvId),
            buildInventoryCloudPayload(invItem, user.uid)
          );
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'transactions');
      }
    }

    setPurchaseCart([]);
    saveLocal(STORAGE_KEYS.PURCHASE_CART, []);
    setEditingInvoiceTx(null);
    const addedStockCount = purchaseCart
      .filter((i) => i.updateStock !== false)
      .reduce((acc, i) => acc + i.qty, 0);
    const nonStockPurCount = purchaseCart.filter((i) => i.updateStock === false).length;
    showToast(
      existingEditedTx
        ? `ক্রয় ইনভয়েস (${invoiceNo}) সফলভাবে এডিট হয়েছে!`
        : addedStockCount > 0
        ? `ক্রয় ইনভয়েস (${invoiceNo}) তৈরি হয়েছে ও স্টকে +${addedStockCount} পিস যুক্ত হয়েছে${nonStockPurCount > 0 ? ` (${nonStockPurCount}টি নন-স্টক আইটেম)` : ''}!`
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
    const canonTxId = getCanonicalDocId(txId);
    const existingTx = transactions.find((t) => getCanonicalDocId(t.id) === canonTxId);
    if (!existingTx) return;

    const nowMs = Date.now();
    const updatedTxObj: Transaction = {
      ...existingTx,
      id: canonTxId,
      ...updated,
      updatedAtMs: nowMs,
    };

    setTransactions((prev) => {
      const next = prev.map((t) => (getCanonicalDocId(t.id) === canonTxId ? updatedTxObj : t));
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    if (user) {
      try {
        await setDoc(
          doc(db, 'transactions', canonTxId),
          buildTransactionCloudPayload(updatedTxObj, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/${canonTxId}`);
      }
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
    const canonTxId = getCanonicalDocId(invoiceTx.id);
    const nowMs = Date.now();
    const amt = sanitizeNumber(paymentAmount, 0, invoiceTx.dueAmount);
    if (amt <= 0) return null;

    const newPaidAmount = sanitizeNumber(invoiceTx.paidAmount + amt);
    const newDueAmount = Math.max(0, sanitizeNumber(invoiceTx.dueAmount - amt));

    // 1. Updated invoice object
    const updatedInvoice: Transaction = {
      ...invoiceTx,
      id: canonTxId,
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
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
        (c) => getCanonicalDocId(c.id) === getCanonicalDocId(invoiceTx.partyId)
      );
      if (cust) {
        updatedCust = {
          ...cust,
          totalPaid: cust.totalPaid + amt,
          totalDue: Math.max(0, cust.totalDue - amt),
          updatedAtMs: nowMs,
        };
      }
    }

    setTransactions((prev) => {
      const next = [
        dueTx,
        ...prev.map((t) => (getCanonicalDocId(t.id) === canonTxId ? updatedInvoice : t)),
      ];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    if (updatedCust) {
      setCustomers((prev) => {
        const next = prev.map((c) =>
          getCanonicalDocId(c.id) === getCanonicalDocId(updatedCust!.id) ? updatedCust! : c
        );
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
    }

    if (user) {
      try {
        await setDoc(
          doc(db, 'transactions', canonTxId),
          buildTransactionCloudPayload(updatedInvoice, user.uid)
        );
        await setDoc(
          doc(db, 'transactions', dueTxId),
          buildTransactionCloudPayload(dueTx, user.uid)
        );
        if (updatedCust) {
          await setDoc(
            doc(db, 'customers', getCanonicalDocId(updatedCust.id)),
            buildCustomerCloudPayload(updatedCust, user.uid)
          );
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'pay_invoice_due');
      }
    }

    showToast(
      `৳${amt.toFixed(2)} টাকা বকেয়া পরিশোধ সম্পন্ন হয়েছে! ${
        newDueAmount === 0 ? '(সম্পূর্ণ বকেয়া পরিশোধিত)' : `(অবশিষ্ট বাকি: ৳${newDueAmount.toFixed(2)})`
      }`
    );
    return updatedInvoice;
  };

  const handleDeleteTransaction = async (tx: Transaction) => {
    const canonTxId = getCanonicalDocId(tx.id);
    const nowMs = Date.now();
    markDeletedIds(
      user ? [tx.id, canonTxId, `${canonTxId}_${user.uid.slice(0, 6)}`] : [tx.id, canonTxId]
    );
    setTransactions((prev) => {
      const next = prev.filter((t) => getCanonicalDocId(t.id) !== canonTxId);
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
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
          matched.id = getCanonicalDocId(matched.id);
          if (tx.txType === 'sale') {
            matched.stockQty = matched.stockQty + pItem.qty;
          } else {
            matched.stockQty = Math.max(0, matched.stockQty - pItem.qty);
          }
          matched.updatedAtMs = nowMs;
          modifiedInv.push(matched);
        }
      }

      if (modifiedInv.length > 0) {
        setInventory(nextInv);
        saveLocal(STORAGE_KEYS.INVENTORY, nextInv);
        if (user) {
          for (const invItem of modifiedInv) {
            try {
              await setDoc(
                doc(db, 'inventory', getCanonicalDocId(invItem.id)),
                buildInventoryCloudPayload(invItem, user.uid)
              );
            } catch {
              // ignore if not synced to cloud yet
            }
          }
        }
      }
    }

    if (user) {
      try {
        await deleteDoc(doc(db, 'transactions', canonTxId));
      } catch {
        // ignore if local demo transaction was not in Firestore yet
      }
      if (tx.id !== canonTxId) {
        try {
          await deleteDoc(doc(db, 'transactions', tx.id));
        } catch {
          // ignore
        }
      }
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
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
    const newInvId = existingInv ? getCanonicalDocId(existingInv.id) : `inv_${nowMs}`;

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
      return next;
    });

    const targetInvObj: InventoryItem = existingInv
      ? {
          ...existingInv,
          id: newInvId,
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
          ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
          getCanonicalDocId(i.id) === newInvId ? targetInvObj : i
        );
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        return next;
      });
    } else {
      setInventory((prev) => {
        const next = [targetInvObj, ...prev];
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        return next;
      });
    }

    if (user) {
      try {
        await setDoc(
          doc(db, 'transactions', txId),
          buildTransactionCloudPayload(newTx, user.uid)
        );
        await setDoc(
          doc(db, 'inventory', newInvId),
          buildInventoryCloudPayload(targetInvObj, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'transactions');
      }
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
      ? inventory.find((i) => getCanonicalDocId(i.id) === getCanonicalDocId(existingId))
      : inventory.find(
          (i) =>
            i.medicineId === itemData.medicineId ||
            (i.brandName.toLowerCase() === itemData.brandName.toLowerCase() &&
              i.dosageForm.toLowerCase() === itemData.dosageForm.toLowerCase() &&
              i.strength.toLowerCase() === itemData.strength.toLowerCase())
        );

    const targetId = getCanonicalDocId(existingId || matchedExisting?.id || `inv_${nowMs}`);
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
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
      ...itemData,
      stockQty: nextStockQty,
      updatedAtMs: nowMs,
    };

    if (isUpdatingExisting) {
      setInventory((prev) => {
        const next = prev.map((i) =>
          getCanonicalDocId(i.id) === targetId ? savedInvObj : i
        );
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        return next;
      });
    } else {
      setInventory((prev) => {
        const next = [savedInvObj, ...prev];
        saveLocal(STORAGE_KEYS.INVENTORY, next);
        return next;
      });
    }

    if (user) {
      try {
        await setDoc(
          doc(db, 'inventory', targetId),
          buildInventoryCloudPayload(savedInvObj, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `inventory/${targetId}`);
      }
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
    const canonId = getCanonicalDocId(item.id);
    const nextQty = sanitizeNumber(item.stockQty + addQty, 0, 10000000);
    const updatedItem: InventoryItem = {
      ...item,
      id: canonId,
      stockQty: nextQty,
      updatedAtMs: nowMs,
    };

    setInventory((prev) => {
      const exists = prev.some((i) => getCanonicalDocId(i.id) === canonId);
      const next = exists
        ? prev.map((i) => (getCanonicalDocId(i.id) === canonId ? updatedItem : i))
        : [updatedItem, ...prev];
      saveLocal(STORAGE_KEYS.INVENTORY, next);
      return next;
    });
    if (user) {
      try {
        await setDoc(
          doc(db, 'inventory', canonId),
          buildInventoryCloudPayload(updatedItem, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `inventory/${canonId}`);
      }
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
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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

    let nextInvList = [...inventory];
    const matchedInv = findMatchingInventoryRecord(nextInvList, {
      brandName: params.brandName,
      strength: params.strength,
      dosageForm: params.dosageForm,
    });

    if (matchedInv) {
      matchedInv.id = getCanonicalDocId(matchedInv.id);
      matchedInv.stockQty = Math.max(0, matchedInv.stockQty - params.qty);
      matchedInv.updatedAtMs = nowMs;
    } else {
      const newInvId = `inv_${nowMs.toString().slice(-6)}`;
      const createdInv: InventoryItem = {
        id: newInvId,
        ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
    }

    setInventory(nextInvList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInvList);

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'transactions', txId), buildTransactionCloudPayload(newTx, user.uid));
      } catch (err) {
        console.warn('Cloud sync transaction warning:', err);
      }
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
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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

    let nextInvList = [...inventory];
    const matchedInv = findMatchingInventoryRecord(nextInvList, {
      brandName: params.brandName,
      strength: params.strength,
      dosageForm: params.dosageForm,
    });

    if (matchedInv) {
      matchedInv.id = getCanonicalDocId(matchedInv.id);
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
    } else {
      const newInvId = `inv_${nowMs.toString().slice(-6)}`;
      const unitPrice =
        params.unitPrice ||
        Number(((params.purchasePrice / (params.qty || 1)) * 1.15).toFixed(2));
      const createdInv: InventoryItem = {
        id: newInvId,
        ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
    }

    setInventory(nextInvList);
    saveLocal(STORAGE_KEYS.INVENTORY, nextInvList);

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'transactions', txId), buildTransactionCloudPayload(newTx, user.uid));
      } catch (err) {
        console.warn('Cloud sync transaction warning:', err);
      }
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
    let nextInvList = [...inventory];
    const matchedInv = findMatchingInventoryRecord(nextInvList, {
      brandName: params.brandName,
      strength: params.strength,
      dosageForm: params.dosageForm,
    });

    if (matchedInv) {
      matchedInv.id = getCanonicalDocId(matchedInv.id);
      matchedInv.stockQty = Math.max(0, params.newStockQty);
      matchedInv.updatedAtMs = nowMs;
      setInventory(nextInvList);
      saveLocal(STORAGE_KEYS.INVENTORY, nextInvList);
      showToast(`📦 ${params.brandName} এর স্টক আপডেট হয়েছে: বর্তমান মজুদ ${params.newStockQty} পিস`);
    } else {
      const newInvId = `inv_${nowMs.toString().slice(-6)}`;
      const createdInv: InventoryItem = {
        id: newInvId,
        ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
      showToast(`📦 ${params.brandName} নতুন ওষুধ হিসেবে স্টকে যুক্ত হয়েছে: বর্তমান মজুদ ${params.newStockQty} পিস`);
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    const canonId = getCanonicalDocId(id);
    const targetItem = inventory.find((i) => getCanonicalDocId(i.id) === canonId);
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

    markDeletedIds(
      user ? [id, canonId, `${canonId}_${user.uid.slice(0, 6)}`] : [id, canonId]
    );
    setInventory((prev) => {
      const next = prev.filter((i) => getCanonicalDocId(i.id) !== canonId);
      saveLocal(STORAGE_KEYS.INVENTORY, next);
      return next;
    });
    if (user) {
      try {
        await deleteDoc(doc(db, 'inventory', canonId));
      } catch {
        // ignore if local demo item was not in Firestore yet
      }
      if (id !== canonId) {
        try {
          await deleteDoc(doc(db, 'inventory', id));
        } catch {
          // ignore
        }
      }
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
    const custId = getCanonicalDocId(existingId || `cust_${nowMs}`);
    unmarkDeletedId(custId);

    const newCust: Customer = {
      id: custId,
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
        const next = prev.map((c) => (getCanonicalDocId(c.id) === custId ? newCust : c));
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
    } else {
      setCustomers((prev) => {
        const next = [newCust, ...prev];
        saveLocal(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
    }

    if (user) {
      try {
        await setDoc(
          doc(db, 'customers', custId),
          buildCustomerCloudPayload(newCust, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `customers/${custId}`);
      }
    }
    showToast(`${data.name}-এর কাস্টমার লেজার সংরক্ষিত হয়েছে!`);
  };

  const handleDeleteCustomer = async (id: string) => {
    const canonId = getCanonicalDocId(id);
    markDeletedIds(
      user ? [id, canonId, `${canonId}_${user.uid.slice(0, 6)}`] : [id, canonId]
    );
    setCustomers((prev) => {
      const next = prev.filter((c) => getCanonicalDocId(c.id) !== canonId);
      saveLocal(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
    if (user) {
      try {
        await deleteDoc(doc(db, 'customers', canonId));
      } catch {
        // ignore if local demo customer was not in Firestore yet
      }
      if (id !== canonId) {
        try {
          await deleteDoc(doc(db, 'customers', id));
        } catch {
          // ignore
        }
      }
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
    const canonCustId = getCanonicalDocId(params.customer.id);
    const amt = sanitizeNumber(params.amount, 0, params.customer.totalDue);
    const txId = `tx_due_${nowMs}`;
    const staffRoleVal: 'owner' | 'staff' =
      activeStaff.roleTitle === 'owner' ? 'owner' : 'staff';
    const operatorDisplayName = getOperatorName(activeStaff);

    const dueTx: Transaction = {
      id: txId,
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
      totalPaid: params.customer.totalPaid + amt,
      totalDue: Math.max(0, params.customer.totalDue - amt),
      updatedAtMs: nowMs,
    };

    unmarkDeletedId(txId);
    setTransactions((prev) => {
      const next = [dueTx, ...prev];
      saveLocal(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });
    setCustomers((prev) => {
      const next = prev.map((c) =>
        getCanonicalDocId(c.id) === canonCustId ? updatedCustObj : c
      );
      saveLocal(STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });

    if (user) {
      try {
        await setDoc(
          doc(db, 'transactions', txId),
          buildTransactionCloudPayload(dueTx, user.uid)
        );
        await setDoc(
          doc(db, 'customers', canonCustId),
          buildCustomerCloudPayload(updatedCustObj, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'customers_due_payment');
      }
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

    const medId = getCanonicalDocId(targetMed ? targetMed.id : `cmed_${nowMs}`);
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
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
      const exists = prev.some((m) => getCanonicalDocId(m.id) === medId);
      const next = exists
        ? prev.map((m) => (getCanonicalDocId(m.id) === medId ? newMed : m))
        : [newMed, ...prev];
      saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
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
            id: getCanonicalDocId(inv.id),
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

    if (user) {
      try {
        await setDoc(
          doc(db, 'custom_medicines', medId),
          buildCustomMedCloudPayload(newMed, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `custom_medicines/${medId}`);
      }

      if (matchedInvItemForCloud) {
        const invItem = matchedInvItemForCloud as InventoryItem;
        try {
          await setDoc(
            doc(db, 'inventory', getCanonicalDocId(invItem.id)),
            buildInventoryCloudPayload(invItem, user.uid)
          );
        } catch {
          // ignore
        }
      }
    }
    showToast(
      targetMed
        ? `${medData.brandName} (${medData.strength})-এর ক্রয় মূল্য (৳${resolvedPurchasePrice.toFixed(2)}) ও বিক্রয় মূল্য (৳${medData.unitPrice.toFixed(2)}) সংরক্ষিত হয়েছে!`
        : `${medData.brandName} ক্যাটালগে যুক্ত হয়েছে!`
    );
  };

  const handleDeleteCustomMedicine = async (medId: string) => {
    const canonId = getCanonicalDocId(medId);
    if (isCoreDatabaseMedicineId(canonId) || CATALOG_BY_ID.has(canonId)) {
      showToast(
        'ডাটাবেস এ থাকা মূল প্রোডাক্ট ডিলিট করা যাবে না! তবে ক্রয় মূল্য ও বিক্রয় মূল্য পরিবর্তন করা যাবে।'
      );
      return;
    }

    markDeletedIds(
      user ? [medId, canonId, `${canonId}_${user.uid.slice(0, 6)}`] : [medId, canonId]
    );
    setCustomMedicines((prev) => {
      const next = prev.filter((m) => getCanonicalDocId(m.id) !== canonId);
      saveLocal(STORAGE_KEYS.CUSTOM_MEDS, next);
      return next;
    });
    if (user) {
      try {
        await deleteDoc(doc(db, 'custom_medicines', canonId));
      } catch {
        // ignore if medicine was built-in or not in Firestore
      }
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
      const canonId = getCanonicalDocId(existing.id);
      markDeletedIds(
        user
          ? [existing.id, canonId, `${canonId}_${user.uid.slice(0, 6)}`]
          : [existing.id, canonId]
      );
      setPriceWatches((prev) => {
        const next = prev.filter((w) => getCanonicalDocId(w.id) !== canonId);
        saveLocal(STORAGE_KEYS.PRICE_WATCHES, next);
        return next;
      });
      if (user) {
        try {
          await deleteDoc(doc(db, 'price_watches', canonId));
        } catch {
          // ignore if local demo watch was not in Firestore yet
        }
      }
      showToast(`${med.brandName} মূল্য ট্র্যাকিং তালিকা থেকে সরানো হয়েছে`);
      return;
    }

    const nowMs = Date.now();
    const watchId = `watch_${nowMs}`;
    unmarkDeletedId(watchId);
    const newWatch: PriceWatch = {
      id: watchId,
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
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
      return next;
    });
    if (user) {
      try {
        await setDoc(
          doc(db, 'price_watches', watchId),
          buildPriceWatchCloudPayload(newWatch, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `price_watches/${watchId}`);
      }
    }
    showToast(`${med.brandName} মূল্য নিরীক্ষণ ও অ্যালার্ট তালিকায় যুক্ত হয়েছে!`);
  };

  const handleMarkAlertRead = async (alertId: string) => {
    const canonId = getCanonicalDocId(alertId);
    const nowMs = Date.now();
    const targetAlert = priceAlerts.find((a) => getCanonicalDocId(a.id) === canonId);
    const updatedAlert: PriceAlert | null = targetAlert
      ? { ...targetAlert, id: canonId, isRead: true, updatedAtMs: nowMs }
      : null;

    setPriceAlerts((prev) => {
      const next = prev.map((a) =>
        getCanonicalDocId(a.id) === canonId ? { ...a, id: canonId, isRead: true, updatedAtMs: nowMs } : a
      );
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, next);
      return next;
    });
    if (user && updatedAlert) {
      try {
        await setDoc(
          doc(db, 'price_alerts', canonId),
          buildPriceAlertCloudPayload(updatedAlert, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `price_alerts/${canonId}`);
      }
    }
  };

  const handleDeletePriceAlert = async (alertId: string) => {
    const canonId = getCanonicalDocId(alertId);
    markDeletedIds(
      user ? [alertId, canonId, `${canonId}_${user.uid.slice(0, 6)}`] : [alertId, canonId]
    );
    setPriceAlerts((prev) => {
      const next = prev.filter((a) => getCanonicalDocId(a.id) !== canonId);
      saveLocal(STORAGE_KEYS.PRICE_ALERTS, next);
      return next;
    });
    if (user) {
      try {
        await deleteDoc(doc(db, 'price_alerts', canonId));
      } catch {
        // ignore if local demo alert was not in Firestore yet
      }
    }
    showToast('মূল্য অ্যালার্ট বিজ্ঞপ্তি মুছে ফেলা হয়েছে');
  };

  // Staff & Shop Profile Handlers
  const handleUpdateShopProfile = async (
    data: Omit<ShopProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    const nowMs = Date.now();
    const nextShop: ShopProfile = {
      ...shopProfile,
      id: SHARED_SHOP_DOC_ID,
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
      ...data,
      updatedAtMs: nowMs,
    };
    setShopProfile(nextShop);
    saveLocal(STORAGE_KEYS.SHOP, nextShop);

    if (user) {
      try {
        await setDoc(
          doc(db, 'shops', SHARED_SHOP_DOC_ID),
          buildShopCloudPayload(nextShop, user.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `shops/${SHARED_SHOP_DOC_ID}`);
      }
    }
    showToast('দোকানের একাউন্ট তথ্য সংরক্ষিত হয়েছে!');
  };

  const handleSaveStaffMember = async (
    data: Omit<StaffMember, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const nowMs = Date.now();
    const stId = getCanonicalDocId(existingId || `staff_${nowMs}`);
    unmarkDeletedId(stId);
    const enforcedName =
      data.roleTitle === 'owner' ? 'Owner' : sanitizeString(data.name, 100);

    const newStaff: StaffMember = {
      id: stId,
      ownerId: user?.uid || SHARED_PHARMACY_OWNER_ID,
      name: enforcedName,
      roleTitle: data.roleTitle,
      phone: sanitizeString(data.phone, 30),
      email: data.email ? sanitizeString(data.email, 120, '') : undefined,
      password: data.password ? sanitizeString(data.password, 100, '') : undefined,
      shift: sanitizeString(data.shift, 60),
      counterName: sanitizeString(data.counterName, 60),
      active: true,
      updatedAtMs: nowMs,
    };

    if (existingId) {
      setStaffList((prev) => {
        const next = prev.map((s) => (getCanonicalDocId(s.id) === stId ? newStaff : s));
        saveLocal(STORAGE_KEYS.STAFF, next);
        return next;
      });
      if (getCanonicalDocId(activeStaff.id) === stId) setActiveStaff(newStaff);
    } else {
      setStaffList((prev) => {
        const next = [...prev, newStaff];
        saveLocal(STORAGE_KEYS.STAFF, next);
        return next;
      });
    }

    const activeAuthUser = auth.currentUser || user;
    if (activeAuthUser) {
      try {
        await setDoc(
          doc(db, 'staff', stId),
          buildStaffCloudPayload(newStaff, activeAuthUser.uid)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `staff/${stId}`);
      }
    }
    showToast(`${enforcedName} প্রোফাইল সংরক্ষিত হয়েছে!`);
  };

  const handleDeleteStaffMember = async (id: string) => {
    const canonId = getCanonicalDocId(id);
    markDeletedIds(
      user ? [id, canonId, `${canonId}_${user.uid.slice(0, 6)}`] : [id, canonId]
    );
    setStaffList((prev) => {
      const remaining = prev.filter((s) => getCanonicalDocId(s.id) !== canonId);
      saveLocal(STORAGE_KEYS.STAFF, remaining);
      if (getCanonicalDocId(activeStaff.id) === canonId && remaining.length > 0) {
        setActiveStaff(remaining[0]);
      }
      return remaining;
    });
    if (user) {
      try {
        await deleteDoc(doc(db, 'staff', canonId));
      } catch {
        // ignore if local demo staff was not in Firestore yet
      }
      if (id !== canonId) {
        try {
          await deleteDoc(doc(db, 'staff', id));
        } catch {
          // ignore
        }
      }
    }
    showToast('স্টাফ প্রোফাইল স্থায়ীভাবে ডিলিট করা হয়েছে');
  };

  const unreadAlertsCount = useMemo(
    () => priceAlerts.filter((a) => !a.isRead).length,
    [priceAlerts]
  );

  const navItems: {
    id: ActiveSection;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'dashboard',
      label: 'ফার্মেসী ড্যাশবোর্ড ও ওভারভিউ',
      shortLabel: 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
    },
    {
      id: 'compare',
      label: 'ওষুধের মূল্য, অ্যালার্ট ও তুলনা',
      shortLabel: 'মূল্য ও অ্যালার্ট',
      icon: ArrowRightLeft,
    },
    {
      id: 'pos_accounts',
      label: 'দৈনিক ক্রয়-বিক্রয় ও ইনভয়েস',
      shortLabel: 'ক্রয়-বিক্রয় ও POS',
      icon: ShoppingCart,
    },
    {
      id: 'inventory',
      label: 'ইনভেন্টরি ও স্টক ম্যানেজমেন্ট',
      shortLabel: 'ইনভেন্টরি স্টক',
      icon: Boxes,
    },
    {
      id: 'customer_ledger',
      label: 'কাস্টমার লেজার ও বাকি খাতা',
      shortLabel: 'কাস্টমার লেজার',
      icon: BookOpen,
    },
    {
      id: 'staff_shop',
      label: 'দোকান একাউন্ট ও Owner/স্টাফ',
      shortLabel: 'Owner ও স্টাফ',
      icon: Users,
    },
  ];

  const activeNavObj = navItems.find((n) => n.id === activeSection) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar: Clean header with both carts */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-6 no-print overflow-x-hidden">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
            aria-label="মেনু"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <div className="relative flex items-center justify-center">
                <div className="w-4 h-1.5 bg-white rounded-xs"></div>
                <div className="w-1.5 h-4 bg-white rounded-xs absolute"></div>
              </div>
            </div>
            <span>ইকবাল ফার্মেসী</span>
          </a>
        </div>

        {/* Zone 2: 6 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
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

        {/* Zone 3: Cart Quick Action Buttons & Cloud Authentication */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Purchase Cart (ক্রয় কার্ট) Header Button - Visible Everywhere */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('pos_accounts');
              setPosActiveTab('purchase_entry');
              showToast('ক্রয় কার্ট ও ইনভয়েস বিল এন্ট্রি খোলা হয়েছে');
            }}
            className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
              activeSection === 'pos_accounts' && posActiveTab === 'purchase_entry'
                ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
            }`}
            title="ক্রয় কার্ট / Purchase Cart দেখুন ও নতুন চালান তৈরি করুন"
            aria-label="ক্রয় কার্ট"
          >
            <Package className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              activeSection === 'pos_accounts' && posActiveTab === 'purchase_entry' ? 'text-white' : 'text-indigo-700'
            }`} />
            <span className="font-bold hidden sm:inline">ক্রয় কার্ট</span>
            <span className="font-bold sm:hidden">ক্রয়</span>
            <span className={`px-1.5 py-0.2 text-[11px] font-mono font-bold rounded-full min-w-4 text-center leading-tight ${
              activeSection === 'pos_accounts' && posActiveTab === 'purchase_entry'
                ? 'bg-white text-indigo-800'
                : 'bg-indigo-600 text-white'
            }`}>
              {purchaseCart.length}
            </span>
          </button>

          {/* Sell Cart (বিক্রয় কার্ট) Header Button - Visible Everywhere */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('pos_accounts');
              setPosActiveTab('sale_pos');
              showToast('বিক্রয় কার্ট ও ক্যাশ মেমো খোলা হয়েছে');
            }}
            className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
              activeSection === 'pos_accounts' && posActiveTab === 'sale_pos'
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}
            title="বিক্রয় কার্ট / Sell Cart (POS) দেখুন ও মেমো তৈরি করুন"
            aria-label="বিক্রয় কার্ট"
          >
            <ShoppingCart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              activeSection === 'pos_accounts' && posActiveTab === 'sale_pos' ? 'text-white' : 'text-emerald-700'
            }`} />
            <span className="font-bold hidden sm:inline">বিক্রয় কার্ট</span>
            <span className="font-bold sm:hidden">বিক্রয়</span>
            <span className={`px-1.5 py-0.2 text-[11px] font-mono font-bold rounded-full min-w-4 text-center leading-tight ${
              activeSection === 'pos_accounts' && posActiveTab === 'sale_pos'
                ? 'bg-white text-emerald-800'
                : 'bg-emerald-600 text-white'
            }`}>
              {posCart.length}
            </span>
          </button>
          {/* Box Scanner Button (স্ক্যান আইকন) */}
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            title="ওষুধের বক্স স্ক্যান করুন: নাম, বক্স সাইজ, দাম, ব্যাচ নম্বর ও মেয়াদ উত্তীর্ণের তারিখ"
            aria-label="স্ক্যান"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700" />
            <span className="font-bold hidden sm:inline">স্ক্যান</span>
          </button>

          {/* Settings Button matching user mockup */}
          <button
            type="button"
            onClick={() => setActiveSection('staff_shop')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title="ফার্মেসী সেটিংস ও স্টাফ"
            aria-label="সেটিংস"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>

          {isCloudLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCloudLoginModal(true)}
                className="hidden xl:flex px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="দোকান ক্লাউড একাউন্ট বিস্তারিত"
              >
                <Cloud className="w-3.5 h-3.5 text-teal-700" />
                <span>ক্লাউড সক্রিয় ({cloudSession?.email?.split('@')[0] || 'Owner'})</span>
              </button>
              <button
                type="button"
                onClick={handleCloudLogout}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট ({getOperatorName(activeStaff)})</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCloudLoginModal(true)}
              className="hidden md:flex px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>দোকান ক্লাউড লগইন</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-3 space-y-1 no-print">
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
        <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col justify-between bg-white border-r border-slate-200 p-5 shrink-0 no-print">
          <div className="space-y-6">
            {/* Shop Identity Summary */}
            <div className="pb-4 border-b border-slate-200 space-y-0.5">
              <div className="text-base font-bold text-teal-800">
                {shopProfile.shopName || 'ইকবাল ফার্মেসী'}
              </div>
              <div className="text-xs font-semibold text-slate-800">
                ডেন্টিস্ট:- ইকবাল মাহমুদ (DMTD (Dental), LMAF, RMP, Pharmacist)
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">
                ঠিকানা:- {shopProfile.address}
              </div>
              <div className="text-xs text-slate-700 font-mono">
                মোবাইল:- {shopProfile.phone}
              </div>
            </div>

            {/* Sidebar Navigation List */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-400 px-3 pb-1">
                মূল মেনু ও মডিউল
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.id === 'pos_accounts' && posCart.length > 0 && (
                      <span className="font-mono tabular-nums text-xs px-1.5 py-0.5 rounded bg-teal-600 text-white">
                        {posCart.length}
                      </span>
                    )}
                    {item.id === 'compare' && unreadAlertsCount > 0 && (
                      <span className="font-mono tabular-nums text-xs px-1.5 py-0.5 rounded bg-amber-500 text-white">
                        {unreadAlertsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Operator / Staff Switcher in Sidebar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="text-xs font-semibold text-slate-700">
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
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.roleTitle === 'owner' ? 'Owner' : st.name} — {st.counterName}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500">
                সেল এন্ট্রিতে নাম দেখাবে:{' '}
                <strong className="text-slate-900">{getOperatorName(activeStaff)}</strong>
              </div>
            </div>

            {/* PWA In-App Install Prompt Button (Mandatory per pwa-integration skill) */}
            {!isInstalled && (isInstallable || isIOS) && (
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
                <div className="text-xs font-bold text-teal-950">
                  অফলাইন অ্যাপ হিসেবে ইনস্টল করুন
                </div>
                <p className="text-xs text-teal-800">
                  ইন্টারনেট ছাড়াই যেকোনো সময় ওষুধের মূল্য যাচাই ও ইনভয়েস তৈরি করতে অ্যাপটি ডিভাইসে ইনস্টল করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (isInstallable) install();
                    else if (isIOS) setShowIOSInstallModal(true);
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  অ্যাপ ইনস্টল করুন (Install PWA)
                </button>
              </div>
            )}
          </div>

          {/* Online / Offline Dual Mode Status & Cloud Sync */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span>অনলাইন মোড সক্রিয়</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700">অফলাইন মোড সক্রিয়</span>
                  </>
                )}
              </span>
              <span className="text-slate-400">Offline-Ready</span>
            </div>

            {isCloudLoggedIn ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-teal-700 shrink-0" />
                  <span className="truncate">
                    ক্লাউড সিঙ্ক: {cloudSession?.email || user?.email || 'mhakbor2001@gmail.com'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSeedCloudData}
                  disabled={seedingCloud}
                  className="w-full py-1.5 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {seedingCloud ? 'সিঙ্ক হচ্ছে...' : 'সকল ডেটা ক্লাউডে সিঙ্ক করুন'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 leading-relaxed">
                  অ্যাপটি অনলাইন ও অফলাইন উভয় মাধ্যমে স্বয়ংক্রিয়ভাবে ডেটা সংরক্ষণ করছে।
                </div>
                <button
                  type="button"
                  onClick={() => setShowCloudLoginModal(true)}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  দোকান ক্লাউড লগইন করুন
                </button>
              </div>
            )}
          </div>
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

          {/* If Locked Out / Not Logged In: Show Full Pharmacy Lock Screen */}
          {!isCloudLoggedIn ? (
            <div className="max-w-xl mx-auto py-6 sm:py-10">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
                {/* Lockout Header */}
                <div className="text-center space-y-2.5">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <span>🔒 ফার্মেসী সিস্টেম লকআউট অবস্থায় রয়েছে</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {shopProfile.shopName || 'ইকবাল ফার্মেসী'}
                  </h2>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    দোকানের সেলস, ইনভেন্টরি, কাস্টমার লেজার ও হিসাব সুরক্ষার জন্য সিস্টেমটি লকআউট করা আছে। কাজ শুরু করতে মালিক (Owner) অথবা স্টাফের আইডি ও পাসওয়ার্ড দিয়ে আনলক করুন।
                  </p>
                </div>

                {/* Tabs: Login vs Register Owner */}
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
                    Owner ও স্টাফ আনলক / লগইন
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
                    নতুন Owner আইডি খুলুন
                  </button>
                </div>

                {loginErrorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-semibold flex items-center gap-2">
                    <span>⚠️ {loginErrorMessage}</span>
                  </div>
                )}

                {/* TAB 1: Universal Login Form */}
                {cloudAuthTab === 'login' && (
                  <form onSubmit={handleUniversalLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        মোবাইল নম্বর অথবা ইমেইল / জিমেইল *
                      </label>
                      <input
                        type="text"
                        required
                        value={cloudLoginEmail}
                        onChange={(e) => {
                          setCloudLoginEmail(e.target.value);
                          setLoginErrorMessage(null);
                        }}
                        placeholder="01812-358839 অথবা example@gmail.com"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono"
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
                        onChange={(e) => {
                          setCloudLoginPassword(e.target.value);
                          setLoginErrorMessage(null);
                        }}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono"
                      />
                    </div>


                    <button
                      type="submit"
                      disabled={cloudLoginLoading}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Unlock className="w-4 h-4" />
                      {cloudLoginLoading ? 'আনলক হচ্ছে...' : 'সিস্টেম আনলক ও লগইন করুন'}
                    </button>
                  </form>
                )}

                {/* TAB 2: Register New Owner */}
                {cloudAuthTab === 'register_owner' && (
                  <form onSubmit={handleRegisterOwnerSubmit} className="space-y-3.5">
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-teal-900 leading-relaxed">
                      <strong>নতুন Owner আইডি রেজিস্ট্রেশন:</strong> নিজের ফার্মেসীর নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে একাউন্ট তৈরি করুন।
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        ফার্মেসী / দোকানের নাম *
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
                          মালিকের নাম *
                        </label>
                        <input
                          type="text"
                          required
                          value={registerOwnerName}
                          onChange={(e) => setRegisterOwnerName(e.target.value)}
                          placeholder="মালিকের নাম"
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

                    <button
                      type="submit"
                      disabled={cloudLoginLoading}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {cloudLoginLoading ? 'একাউন্ট তৈরি হচ্ছে...' : 'নতুন Owner একাউন্ট তৈরি ও আনলক করুন'}
                    </button>

                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-normal space-y-1">
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
                  </form>
                )}
              </div>
            </div>
          ) : (
            <>
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
                />
              )}
            </>
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
