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

export interface ShopNotice {
  text: string;
  isActive: boolean;
  updatedAtMs?: number;
  updatedBy?: string;
}

export interface ShopBranch {
  id: string;
  name: string; // e.g. "প্রধান শাখা", "শাখা ২ (হাসপাতাল মোড়)"
  branchCode?: string;
  address: string;
  phone: string;
  licenseNo?: string;
  drugLicenseNo?: string;
  vatRegNo?: string;
  isDefault?: boolean;
}

export interface CustomInvoiceSettings {
  invoiceTitle?: string; // e.g. "ইকবাল ফার্মেসী"
  tagline?: string; // e.g. "এখানে সকল প্রকার দেশি-বিদেশি পাইকারি ও খুচরা ঔষধ সুলভ মূল্যে পাওয়া যায়"
  address?: string;
  phone?: string;
  licenseNo?: string;
  sealType?: 'paid' | 'cash_received' | 'due' | 'custom';
  customSealText?: string; // e.g. "পরিশোধিত", "ধন্যবাদ আবার আসবেন"
  footerNotes?: string[];
  termsAndConditions?: string;
  showDrugLicense?: boolean;
  vatRegNo?: string;
}

export interface ShopRegistration {
  id: string;
  shopId?: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  password?: string;
  address: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  isApproved: boolean;
  registeredAtMs: number;
  approvedAtMs?: number;
  approvedBy?: string;
}

export interface ShopProfile {
  id: string;
  shopId?: string;
  ownerId: string;
  shopName: string;
  licenseNo: string;
  phone: string;
  address: string;
  branches?: ShopBranch[];
  activeBranchId?: string;
  customInvoiceSettings?: CustomInvoiceSettings;
  notice?: ShopNotice;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export interface InventoryItem {
  id: string;
  shopId?: string;
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
  shopId?: string;
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

export type InvoiceSealType = 'iqbal_pharmacy' | 'dental_care_1' | 'dental_care_2';

export interface PharmacyClinicalDetails {
  bp?: string; // Blood Pressure e.g. 120/80
  pulse?: string; // Pulse rate e.g. 74
  sugar?: string; // Blood Sugar e.g. 6.2 mmol/L
  temp?: string; // Temperature e.g. 98.6 F
  spo2?: string; // Oxygen level e.g. 98%
  weight?: string; // Weight e.g. 68 kg
  symptoms?: string; // Symptoms / Chief complaints
  advice?: string; // Medical advice
  inv?: string; // Investigation tests
}

export interface DentalClinicalDetails {
  pereocoronaties?: string;
  pulpitis?: string;
  calculus?: string;
  gingivitis?: string;
  caries?: string;
  scaling?: string;
  filling?: string;
  rct?: string;
  cap?: string;
  bridge?: string;
  ext?: string;
  others?: string;
  inv?: string;
  }

export interface Transaction {
  id: string;
  shopId?: string;
  ownerId: string;
  txType: 'sale' | 'purchase' | 'due_payment';
  invoiceNo: string;
  dateStr: string;
  partyId: string;
  partyName: string;
  partyPhone: string;
  patientAge?: string;
  patientSex?: string;
  dentalClinical?: Record<string, string>;
  selectedSeal?: InvoiceSealType;
  itemsSummary: string;
  totalCount: number;
  subTotal: number;
  discount: number;
  vat?: number; // Optional VAT / Tax (ভ্যাট টাকা ৳)
  vatPercent?: number; // Optional VAT % (ভ্যাট হার)
  grandTotal: number;
  amount?: number;
  category?: string;
  staffId?: string;
  timestamp?: number;
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

export type StaffRoleTitle = 'owner' | 'sub_owner' | 'manager' | 'pharmacist' | 'salesman' | 'cashier';

export interface StaffMember {
  id: string;
  shopId?: string;
  ownerId: string;
  name: string; // For owner, displays "Owner", for sub_owner displays specific name or Sub Owner, for staff displays name
  roleTitle: StaffRoleTitle;
  isMandatoryOwner?: boolean; // Exactly one mandatory owner (যাকে ডিলিট করা যাবে না)
  phone: string;
  email?: string; // Email / Gmail for staff login
  password?: string; // Password for staff login
  shift: string;
  counterName: string;
  active: boolean;
  lastLoginAt?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs?: number;
}

export function isMandatoryOwner(st?: Partial<StaffMember> | null): boolean {
  if (!st) return false;
  if (st.isMandatoryOwner) return true;
  if (st.id === 'staff-owner-1' || st.id === 'staff_owner_default') return true;
  const digits = (st.phone || '').replace(/[^0-9]/g, '');
  if (digits.endsWith('01812358839') || digits.endsWith('1812358839')) return true;
  if (
    st.email &&
    (st.email.toLowerCase() === 'iqbalmahmud498@gmail.com' ||
      st.email.toLowerCase() === '01812358839@iqbalpharmacy.bd' ||
      st.email.toLowerCase() === 'mhakbor2001@gmail.com')
  ) {
    return true;
  }
  return false;
}

export interface CustomMedicine {
  id: string;
  shopId?: string;
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
  shopId?: string;
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
  shopId?: string;
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
  dosageSchedule?: string; // e.g. "1+0+1" or "1+1+1"
  dosageDuration?: string; // e.g. "10 Day", "7 Day", "খাওয়ার পর"
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
  bonusQty?: number; // বোনাস সংখ্যা (Bonus quantity in pieces)
  bonusVatMode?: '%' | '৳' | 'fixed'; // বোনাস ভ্যাট ধরণ (% অথবা ৳ প্রতি পিস অথবা সরাসরি মোট টাকা)
  bonusVatRate?: number; // বোনাস ভ্যাট হার (% অথবা ৳/পিস অথবা মোট ৳)
  bonusVatAmount?: number; // মোট বোনাস ভ্যাট
  productVatMode?: '%' | '৳' | 'fixed' | 'piece_vat'; // পণ্যের মূল্যের ভ্যাট ধরণ (% বা ৳ প্রতি পিস বা ৳ মোট)
  pieceVatAmount?: number; // সিঙ্গেল পিস ভ্যাট (টাকা প্রতি পিস ৳/পিস)
  vatPercent?: number; // ভ্যাট হার % (VAT %)
  vatAmount?: number; // ভ্যাট টাকা ৳ (VAT Amount - মোট পণ্য ভ্যাট)
  customLineTotal?: number; // কাস্টম লাইন মোট মূল্য ৳ (Custom Price / Line Total)
}

