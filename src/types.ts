export type DosageFormType =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Suspension'
  | 'Suppository'
  | 'Inhaler'
  | 'Sachet'
  | 'Eye Drop'
  | 'Ear Drop'
  | 'Nasal Drop'
  | 'Drops'
  | 'Injection'
  | 'Gel';

export interface MedicineCatalogItem {
  id: string;
  brandName: string;
  genericName: string;
  companyName: string;
  strength: string;
  dosageForm: DosageFormType;
  packSize: string;
  unitsPerStrip: number;
  purchasePrice?: number; // Purchase price (ক্রয় মূল্য) per unit in BDT (৳)
  unitPrice: number; // Selling price (বিক্রয় মূল্য / MRP) per unit in BDT (৳)
  stripPrice: number; // Selling price (বিক্রয় মূল্য / MRP) per strip in BDT (৳)
  therapeuticClass: string;
  indication: string;
  darNo: string;
  availableDosages?: string; // e.g., "20 mg, 40 mg Capsule / IV Injection"
  isCustom?: boolean;
  isCoreProduct?: boolean;
  hasPriceOverride?: boolean;
}

export interface ShopProfile {
  id: string;
  ownerId: string;
  shopName: string;
  licenseNo: string;
  phone: string;
  address: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface InventoryItem {
  id: string;
  ownerId: string;
  medicineId: string;
  brandName: string;
  genericName: string;
  companyName: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  purchasePrice: number;
  unitPrice: number;
  stripPrice: number;
  stockQty: number;
  minStockLevel: number;
  batchNo: string;
  expiryDate: string;
  shelfLocation: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  address: string;
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface Transaction {
  id: string;
  ownerId: string;
  txType: 'sale' | 'purchase' | 'due_payment';
  invoiceNo: string;
  dateStr: string;
  partyId: string;
  partyName: string;
  partyPhone: string;
  itemsSummary: string;
  totalCount: number;
  subTotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card' | 'due';
  staffName: string; // Shows "Owner" for shop owner, or specific staff name for staff
  staffRole: 'owner' | 'staff';
  counterName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface StaffMember {
  id: string;
  ownerId: string;
  name: string; // For owner, displays "Owner", for staff displays their specific name
  roleTitle: 'owner' | 'manager' | 'pharmacist' | 'salesman';
  phone: string;
  email?: string; // Email / Gmail for staff login
  password?: string; // Password for staff login
  shift: string;
  counterName: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface CustomMedicine {
  id: string;
  ownerId: string;
  brandName: string;
  genericName: string;
  companyName: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  purchasePrice?: number;
  unitPrice: number;
  stripPrice: number;
  therapeuticClass: string;
  indication: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface PriceWatch {
  id: string;
  ownerId: string;
  medicineId: string;
  brandName: string;
  genericName: string;
  companyName: string;
  strength: string;
  baselineUnitPrice: number;
  currentUnitPrice: number;
  targetAlertPrice: number;
  notifyOnAnyChange: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface PriceAlert {
  id: string;
  ownerId: string;
  medicineId: string;
  brandName: string;
  genericName: string;
  companyName: string;
  strength: string;
  oldUnitPrice: number;
  newUnitPrice: number;
  oldStripPrice: number;
  newStripPrice: number;
  changedBy: string; // "Owner" or specific staff name
  dateStr: string;
  isRead: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface CartItem {
  medicineId: string;
  inventoryId?: string;
  brandName: string;
  genericName: string;
  companyName: string;
  strength: string;
  dosageForm: string;
  unitPrice: number; // Editable directly in POS before creating invoice
  originalUnitPrice?: number;
  purchasePrice: number;
  originalPurchasePrice?: number;
  qty: number;
  availableStock: number;
  updateStock?: boolean; // When true (default), decreases inventory stock; when false, only appears in invoice without touching stock
}

export type PurchasePackUnit = 'piece' | 'strip' | 'box' | 'cartoon';

export interface PurchaseCartItem {
  medicineId: string;
  inventoryId?: string;
  brandName: string;
  genericName: string;
  companyName: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  purchasePrice: number; // Editable unit purchase price per piece (৳)
  unitPrice: number; // Retail MRP per unit (৳)
  qty: number; // Total purchased quantity in pieces
  batchNo: string;
  expiryDate: string;
  availableStock: number;
  updateStock?: boolean; // When true (default), increases inventory stock; when false, only appears in invoice without touching stock
  packUnit?: PurchasePackUnit; // 'piece' | 'strip' | 'box' | 'cartoon'
  packCount?: number; // e.g. 1 পাতা, 2 বক্স, 1 কার্টুন
  unitsPerPack?: number; // e.g. 10 pcs per পাতা, 100 pcs per বক্স, 48 pcs per কার্টুন
  packRate?: number; // Price per pack (e.g. ৳25 per পাতা, ৳250 per বক্স, ৳1680 per কার্টুন)
  packDetailFormula?: string; // e.g. '১*১০', '১*১০*৫১', '১*৪৮'
  stripsPerBox?: number; // e.g. 51 পাতা per বক্স
  pcsPerStrip?: number; // e.g. 10 পিস per পাতা
}

