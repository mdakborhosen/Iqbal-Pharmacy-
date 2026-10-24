import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  CreditCard,
  Edit3,
  FileText,
  Heart,
  Info,
  Minus,
  Package,
  PackageCheck,
  PackageMinus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Stethoscope,
  Thermometer,
  Trash2,
  Truck,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  BD_PHARMA_COMPANIES,
  formatCartItemInvoiceLine,
  formatCleanMoney,
  formatPurchaseItemInvoiceLine,
  formatTransactionItemsList,
  formatTransactionItemsText,
  getInventoryStockForMedicine,
  getInvoiceFormPrefix,
  matchesMedicineQuery,
  numberToBanglaWords,
  parseTransactionItemsDetailed,
  searchAndRankMedicines,
} from '../data/bdMedicines';
import { getTodayDateStr } from '../data/demoSeedData';
import {
  CartItem,
  Customer,
  DentalClinicalDetails,
  InventoryItem,
  InvoiceSealType,
  MedicineCatalogItem,
  PurchaseCartItem,
  PurchasePackUnit,
  ShopProfile,
  StaffMember,
  Transaction,
} from '../types';
import { SaleStepWizard } from './SaleStepWizard';

interface PosAndDailyAccountsViewProps {
  catalog: MedicineCatalogItem[];
  inventory: InventoryItem[];
  customers: Customer[];
  transactions: Transaction[];
  staffList: StaffMember[];
  activeStaff: StaffMember;
  onSelectActiveStaff: (staff: StaffMember) => void;
  selectedTab?: 'sale_pos' | 'purchase_entry';
  onTabChange?: (tab: 'sale_pos' | 'purchase_entry') => void;
  posCart: CartItem[];
  onAddToCart: (med: MedicineCatalogItem, qty: number) => void;
  onAddCustomToCart: (params: {
    brandName: string;
    genericName?: string;
    companyName?: string;
    strength?: string;
    dosageForm?: string;
    unitPrice: number;
    purchasePrice?: number;
    qty: number;
    saveToCatalog?: boolean;
  }) => Promise<void>;
  onUpdateCartQty: (medId: string, newQty: number) => void;
  onUpdateCartUnitPrice: (medId: string, newUnitPrice: number) => void;
  onUpdateCartPurchasePrice: (medId: string, newPurchasePrice: number) => void;
  onUpdateCartItemDetails: (medId: string, updates: Partial<CartItem>) => void;
  onRemoveFromCart: (medId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (params: {
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
  }) => Promise<Transaction | null>;
  purchaseCart: PurchaseCartItem[];
  onAddToPurchaseCart: (
    med: MedicineCatalogItem,
    qty?: number,
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
  ) => void;
  onAddCustomToPurchaseCart: (params: {
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
  }) => Promise<void>;
  onUpdatePurchaseCartQty: (medId: string, newQty: number) => void;
  onUpdatePurchaseCartCost: (medId: string, newCost: number) => void;
  onUpdatePurchaseCartMrp: (medId: string, newMrp: number) => void;
  onUpdatePurchaseCartBatch: (medId: string, batchNo: string, expiryDate?: string) => void;
  onUpdatePurchaseCartItemDetails: (
    medId: string,
    updates: Partial<PurchaseCartItem>
  ) => void;
  onRemoveFromPurchaseCart: (medId: string) => void;
  onClearPurchaseCart: () => void;
  onCompletePurchaseInvoice: (params: {
    supplierCompany: string;
    supplierPhone: string;
    invoiceNo: string;
    discount: number;
    paidAmount: number;
    paymentMethod: Transaction['paymentMethod'];
    dateStr?: string;
    editingTxId?: string;
    syncModifiedPricesToCatalog?: boolean;
  }) => Promise<Transaction | null>;
  onRecordPurchase: (params: {
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
  }) => Promise<Transaction | null>;
  editingInvoiceTx: Transaction | null;
  onStartEditInvoice: (tx: Transaction) => void;
  onCancelEditInvoice: () => void;
  onEditTransaction: (
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
  ) => Promise<void>;
  onPayInvoiceDue?: (params: {
    invoiceTx: Transaction;
    paymentAmount: number;
    paymentMethod: Transaction['paymentMethod'];
    note?: string;
  }) => Promise<Transaction | null>;
  onDeleteTransaction: (tx: Transaction) => Promise<void>;
  shopProfile: ShopProfile;
  onSaveMedicineCatalog?: (
    medData: Omit<MedicineCatalogItem, 'id' | 'darNo' | 'unitsPerStrip' | 'dosageForm'> & {
      dosageForm: string;
    },
    existingMed?: MedicineCatalogItem
  ) => Promise<any>;
  onOpenScanner?: () => void;
}

const CUSTOM_PRODUCT_FORMS = [
  { value: 'Tablet', label: 'ট্যাবলেট (Tablet)' },
  { value: 'Capsule', label: 'ক্যাপসুল (Capsule)' },
  { value: 'Syrup', label: 'সিরাপ (Syrup)' },
  { value: 'Suspension', label: 'সাসপেনশন (Suspension)' },
  { value: 'Sachet', label: 'স্যাচেট (Sachet)' },
  { value: 'Drops', label: 'ড্রপ (Pediatric Drops)' },
  { value: 'Eye Drop', label: 'আই ড্রপ (Eye Drop)' },
  { value: 'Ear Drop', label: 'ইয়ার ড্রপ (Ear Drop)' },
  { value: 'Nasal Drop', label: 'ন্যাজাল ড্রপ (Nasal Drop)' },
  { value: 'Suppository', label: 'সাপোজিটরি (Suppository)' },
  { value: 'Inhaler', label: 'ইনহেলার (Inhaler)' },
  { value: 'Injection', label: 'ইনজেকশন (Injection)' },
  { value: 'Gel', label: 'ক্রিম / অয়েন্টমেন্ট / জেল (Gel/Cream)' },
  { value: 'Surgical', label: 'সার্জিক্যাল / কাস্টম পণ্য (Item/Pcs)' },
];

const makeFreshSaleInvoiceNo = () =>
  `INV-${getTodayDateStr().replace(/-/g, '').slice(2)}-${Math.floor(100 + Math.random() * 900)}`;

const makeFreshPurchaseInvoiceNo = () =>
  `PUR-${getTodayDateStr().replace(/-/g, '').slice(2)}-${Math.floor(100 + Math.random() * 900)}`;

const InvoiceVerificationQrCode: React.FC<{
  invoice: Transaction;
  isDense?: boolean;
  showPrice?: boolean;
}> = ({ invoice, isDense, showPrice = true }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    // If showPrice is false (দাম ছাড়া মেমো), absolutely NO price, payment, or taka info is encoded in QR code
    const payload = JSON.stringify(
      showPrice
        ? {
            invoiceNo: invoice.invoiceNo,
            date: invoice.dateStr || getTodayDateStr(),
            customer: invoice.partyName || 'Walk-in',
            phone: invoice.partyPhone || 'N/A',
            totalAmount: invoice.grandTotal ?? invoice.amount ?? 0,
            paidAmount: invoice.paidAmount,
            dueAmount: invoice.dueAmount,
            status: invoice.dueAmount > 0 ? 'DUE' : 'PAID',
            method: invoice.paymentMethod,
            chamber: invoice.selectedSeal || 'iqbal_pharmacy',
            app: 'Iqbal Pharmacy & Dental Care',
          }
        : {
            invoiceNo: invoice.invoiceNo,
            memoType: 'ডেলিভারি চালান (দাম ছাড়া মেমো)',
            date: invoice.dateStr || getTodayDateStr(),
            customer: invoice.partyName || 'Walk-in',
            phone: invoice.partyPhone || 'N/A',
            chamber: invoice.selectedSeal || 'iqbal_pharmacy',
            app: 'Iqbal Pharmacy & Dental Care',
          }
    );

    QRCode.toDataURL(payload, {
      margin: 1,
      width: isDense ? 76 : 90,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrUrl)
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [invoice, isDense, showPrice]);

  if (!qrUrl) return null;

  const displayTotal = invoice.grandTotal ?? invoice.amount ?? 0;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="p-0.5 bg-white border border-slate-300 rounded shadow-2xs">
        <img
          src={qrUrl}
          alt={`QR Verification for ${invoice.invoiceNo}`}
          className={isDense ? 'w-14 h-14' : 'w-16 h-16'}
        />
      </div>
      <div className={`font-mono font-bold text-slate-800 mt-0.5 ${isDense ? 'text-[7.5px]' : 'text-[8.5px]'}`}>
        {showPrice ? 'পেমেন্ট ও বিল যাচাই QR' : 'চালান ও ডেলিভারি যাচাই QR'}
      </div>
      <div className={`font-mono text-slate-600 leading-tight ${isDense ? 'text-[7px]' : 'text-[7.5px]'}`}>
        {showPrice ? `${invoice.invoiceNo} · ৳${displayTotal.toFixed(0)}` : `${invoice.invoiceNo} · ডেলিভারি মেমো`}
      </div>
    </div>
  );
};

export const PosAndDailyAccountsView: React.FC<PosAndDailyAccountsViewProps> = ({
  catalog,
  inventory,
  customers,
  transactions,
  staffList,
  activeStaff,
  onSelectActiveStaff,
  selectedTab,
  onTabChange,
  posCart,
  onAddToCart,
  onAddCustomToCart,
  onUpdateCartQty,
  onUpdateCartUnitPrice,
  onUpdateCartPurchasePrice,
  onUpdateCartItemDetails,
  onRemoveFromCart,
  onClearCart,
  onCompleteSale,
  purchaseCart,
  onAddToPurchaseCart,
  onAddCustomToPurchaseCart,
  onUpdatePurchaseCartQty,
  onUpdatePurchaseCartCost,
  onUpdatePurchaseCartMrp,
  onUpdatePurchaseCartBatch,
  onUpdatePurchaseCartItemDetails,
  onRemoveFromPurchaseCart,
  onClearPurchaseCart,
  onCompletePurchaseInvoice,
  editingInvoiceTx,
  onStartEditInvoice,
  onCancelEditInvoice,
  onEditTransaction,
  onPayInvoiceDue,
  onDeleteTransaction,
  onSaveMedicineCatalog,
  onOpenScanner,
}) => {
  const invoiceBuilderRef = useRef<HTMLDivElement | null>(null);
  const saleSearchInputRef = useRef<HTMLInputElement | null>(null);
  const saleCustomNameInputRef = useRef<HTMLInputElement | null>(null);
  const saleCustomPriceInputRef = useRef<HTMLInputElement | null>(null);
  const purCustomNameInputRef = useRef<HTMLInputElement | null>(null);
  const purCustomCostInputRef = useRef<HTMLInputElement | null>(null);

  const [internalTab, setInternalTab] = useState<'sale_pos' | 'purchase_entry'>('sale_pos');
  const entryTab = selectedTab ?? internalTab;
  const setEntryTab = (tab: 'sale_pos' | 'purchase_entry') => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const [medSearch, setMedSearch] = useState('');

  // Custom Product Entry states for Sales Bill (কাস্টম প্রডাক্ট, দাম, পরিমাণ দিয়ে বিক্রয় বিল)
  const [saleCustomName, setSaleCustomName] = useState('');
  const [saleCustomForm, setSaleCustomForm] = useState('Tablet');
  const [saleCustomStrength, setSaleCustomStrength] = useState('');
  const [saleCustomUnitPrice, setSaleCustomUnitPrice] = useState('');
  const [saleCustomPurPrice, setSaleCustomPurPrice] = useState('');
  const [saleCustomQty, setSaleCustomQty] = useState('1');
  const [saleCustomSaveCatalog, setSaleCustomSaveCatalog] = useState(true);

  // Custom Product Entry states for Purchase Bill (কাস্টম প্রডাক্ট, দাম, পরিমাণ দিয়ে ক্রয় বিল)
  const [purCustomName, setPurCustomName] = useState('');
  const [purCustomForm, setPurCustomForm] = useState('Tablet');
  const [purCustomStrength, setPurCustomStrength] = useState('');
  const [purCustomCostPrice, setPurCustomCostPrice] = useState('');
  const [purCustomMrpPrice, setPurCustomMrpPrice] = useState('');
  const [purCustomQty, setPurCustomQty] = useState('10');
  const [purCustomBatchNo, setPurCustomBatchNo] = useState('');
  const [purCustomSaveCatalog, setPurCustomSaveCatalog] = useState(true);

  // Sale checkout states (বিক্রয় ইনভয়েস — স্টক কমবে)
  const [saleInvoiceNo, setSaleInvoiceNo] = useState<string>(() => makeFreshSaleInvoiceNo());
  const [saleDateStr, setSaleDateStr] = useState<string>(() => getTodayDateStr());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [walkInName, setWalkInName] = useState('সাধারণ ক্রেতা (Walk-in)');
  const [walkInPhone, setWalkInPhone] = useState('N/A');
  const [discountStr, setDiscountStr] = useState('0');
  const [paidAmountStr, setPaidAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Transaction['paymentMethod']>('cash');
  const [syncModifiedPrices, setSyncModifiedPrices] = useState<boolean>(true);
  const [submittingSale, setSubmittingSale] = useState(false);

  // Purchase Invoice states (ক্রয় ইনভয়েস — স্টক বাড়বে)
  const [purMedSearch, setPurMedSearch] = useState<string>('');
  const [supplierCompany, setSupplierCompany] = useState<string>(BD_PHARMA_COMPANIES[0]);
  const [purCompanySearch, setPurCompanySearch] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('কোম্পানি ডিপো / প্রতিনিধি');
  const [purInvoiceNo, setPurInvoiceNo] = useState(() => makeFreshPurchaseInvoiceNo());
  const [purDateStr, setPurDateStr] = useState<string>(() => getTodayDateStr());
  const [purDiscountStr, setPurDiscountStr] = useState('0');
  const [purPaidStr, setPurPaidStr] = useState('');
  const [purPaymentMethod, setPurPaymentMethod] = useState<Transaction['paymentMethod']>('cash');
  const [syncPurPricesToCatalog, setSyncPurPricesToCatalog] = useState<boolean>(false);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [activeSearchMedId, setActiveSearchMedId] = useState<string | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');

  // Auto 1st line fill / open when entering purchase tab if cart is empty (run only once safely without infinite loop)
  const initialPurchaseBoxAddedRef = useRef(false);
  useEffect(() => {
    if (
      entryTab === 'purchase_entry' &&
      purchaseCart.length === 0 &&
      !editingInvoiceTx &&
      !initialPurchaseBoxAddedRef.current
    ) {
      initialPurchaseBoxAddedRef.current = true;
      onAddCustomToPurchaseCart({
        brandName: '',
        companyName: supplierCompany,
        strength: '',
        dosageForm: 'Tablet',
        purchasePrice: 0,
        unitPrice: 0,
        qty: 10,
        updateStock: true,
        packUnit: 'strip',
        packCount: 1,
        unitsPerPack: 10,
        packDetailFormula: '1*10',
        saveToCatalog: false,
      });
    }
  }, [entryTab, editingInvoiceTx]);

  // Patient Info & Clinical fields
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientSex, setPatientSex] = useState<string>('Male');
  const [selectedSeal, setSelectedSeal] = useState<InvoiceSealType>('iqbal_pharmacy');
  const [activeInvoiceSeal, setActiveInvoiceSeal] = useState<InvoiceSealType>('iqbal_pharmacy');
  const [dentalFindings, setDentalFindings] = useState<Record<string, string>>({
    Pereocoronaties: '',
    Pulpitis: '',
    Calculus: '',
    Gingivitis: '',
    Caries: '',
    Scaling: '',
    Filling: '',
    RCT: '',
    Cap: '',
    Bridge: '',
    EXT: '',
    Others: '',
    'Inv.': '',
  });

  const [pharmacyFindings, setPharmacyFindings] = useState<Record<string, string>>({
    'রক্তচাপ (BP)': '',
    'ডায়াবেটিস (RBS)': '',
    'তাপমাত্রা (Temp)': '',
    'ওজন (Weight)': '',
    'নাড়ির গতি (Pulse)': '',
    'প্রধান লক্ষণ (Symptoms)': '',
    'প্রাথমিক পরামর্শ (Advice)': '',
    'পরীক্ষা-নিরীক্ষা (Inv.)': '',
  });

  const [showClinicalPanel, setShowClinicalPanel] = useState<boolean>(true);
  const [saleStep, setSaleStep] = useState<1 | 2 | 3 | 4>(1);
  const [saleWorkflowMode, setSaleWorkflowMode] = useState<'step_by_step' | 'all_in_one'>('step_by_step');

  const hasAnyClinicalData = useMemo(() => {
    if (selectedSeal === 'iqbal_pharmacy') {
      return Object.values(pharmacyFindings).some((v) => v && v.trim().length > 0);
    }
    return Object.values(dentalFindings).some((v) => v && v.trim().length > 0);
  }, [selectedSeal, pharmacyFindings, dentalFindings]);

  // Payment Now Modal states (for Full or Partial payment of any invoice with Due)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<Transaction | null>(null);
  const [isFullPayment, setIsFullPayment] = useState<boolean>(true);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<Transaction['paymentMethod']>('cash');
  const [paymentNoteInput, setPaymentNoteInput] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Daily Cashbook Filter states
  const [dateFilter, setDateFilter] = useState<string>(getTodayDateStr());
  const [showAllDates, setShowAllDates] = useState<boolean>(true);
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'sale' | 'purchase' | 'due_payment'>(
    'ALL'
  );
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL' | 'owner' | 'staff'>('ALL');
  const [previewInvoice, setPreviewInvoice] = useState<Transaction | null>(null);
  const [invoicePrintWithPrice, setInvoicePrintWithPrice] = useState<boolean>(true);

  useEffect(() => {
    if (previewInvoice?.selectedSeal) {
      setActiveInvoiceSeal(previewInvoice.selectedSeal);
    }
  }, [previewInvoice]);

  // Edit Due Payment Modal states (only used for due_payment entries; sale & purchase invoices use the full New-Invoice Builder)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editDateStr, setEditDateStr] = useState('');
  const [editPartyName, setEditPartyName] = useState('');
  const [editPartyPhone, setEditPartyPhone] = useState('');
  const [editItemsSummary, setEditItemsSummary] = useState('');
  const [editSubTotal, setEditSubTotal] = useState('0');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editPaidAmount, setEditPaidAmount] = useState('0');
  const [editPaymentMethod, setEditPaymentMethod] = useState<Transaction['paymentMethod']>('cash');
  const [savingEditTx, setSavingEditTx] = useState(false);

  const isEditingSale = editingInvoiceTx?.txType === 'sale';
  const isEditingPurchase = editingInvoiceTx?.txType === 'purchase';

  // When an invoice is selected for editing, load all its fields into the full New-Invoice Builder and scroll to it
  useEffect(() => {
    if (!editingInvoiceTx) return;

    if (editingInvoiceTx.txType === 'sale') {
      setEntryTab('sale_pos');
      setSaleInvoiceNo(editingInvoiceTx.invoiceNo);
      setSaleDateStr(editingInvoiceTx.dateStr);

      const matchedCust = customers.find(
        (c) =>
          c.id === editingInvoiceTx.partyId ||
          c.name.trim().toLowerCase() === editingInvoiceTx.partyName.trim().toLowerCase()
      );
      if (matchedCust && editingInvoiceTx.partyId !== 'walk-in') {
        setSelectedCustomerId(matchedCust.id);
      } else {
        setSelectedCustomerId('walk-in');
        setWalkInName(editingInvoiceTx.partyName);
        setWalkInPhone(editingInvoiceTx.partyPhone);
      }
      setDiscountStr(String(editingInvoiceTx.discount));
      setPaidAmountStr(String(editingInvoiceTx.paidAmount));
      setPaymentMethod(editingInvoiceTx.paymentMethod);
      if (editingInvoiceTx.patientAge) setPatientAge(editingInvoiceTx.patientAge);
      if (editingInvoiceTx.patientSex) setPatientSex(editingInvoiceTx.patientSex);
      if (editingInvoiceTx.selectedSeal) {
        setSelectedSeal(editingInvoiceTx.selectedSeal);
        setActiveInvoiceSeal(editingInvoiceTx.selectedSeal);
      }
      if (editingInvoiceTx.dentalClinical) {
        setDentalFindings((prev) => ({ ...prev, ...editingInvoiceTx.dentalClinical }));
      }
    } else if (editingInvoiceTx.txType === 'purchase') {
      setEntryTab('purchase_entry');
      setPurInvoiceNo(editingInvoiceTx.invoiceNo);
      setPurDateStr(editingInvoiceTx.dateStr);
      const cleanComp =
        editingInvoiceTx.partyName.replace(/\s*\(ডিপো চালান\)\s*$/, '').trim() ||
        BD_PHARMA_COMPANIES[0];
      setSupplierCompany(cleanComp);
      setSupplierPhone(editingInvoiceTx.partyPhone);
      setPurDiscountStr(String(editingInvoiceTx.discount));
      setPurPaidStr(String(editingInvoiceTx.paidAmount));
      setPurPaymentMethod(editingInvoiceTx.paymentMethod);
    }

    const timer = setTimeout(() => {
      invoiceBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(timer);
  }, [editingInvoiceTx?.id]);

  // Map of original quantities in the invoice currently being edited, so live stock preview is 100% accurate
  const editedOldQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!editingInvoiceTx) return map;
    const parsed = parseTransactionItemsDetailed(editingInvoiceTx.itemsSummary, catalog);
    for (const p of parsed) {
      if (p.matchedMedicine?.id) {
        map.set(p.matchedMedicine.id, (map.get(p.matchedMedicine.id) || 0) + p.qty);
      }
      const keyByName = p.brandAndStrength.trim().toLowerCase();
      map.set(keyByName, (map.get(keyByName) || 0) + p.qty);
    }
    return map;
  }, [editingInvoiceTx, catalog]);

  const getOldEditedQtyForMed = (med: {
    id?: string;
    medicineId?: string;
    brandName: string;
    strength: string;
  }): number => {
    if (!editingInvoiceTx) return 0;
    const idKey = med.medicineId || med.id;
    if (idKey && editedOldQtyMap.has(idKey)) {
      return editedOldQtyMap.get(idKey) || 0;
    }
    const nameKey = `${med.brandName} ${med.strength}`.trim().toLowerCase();
    return editedOldQtyMap.get(nameKey) || 0;
  };

  const getStockForMed = (med: {
    id?: string;
    medicineId?: string;
    brandName: string;
    strength: string;
    dosageForm: string;
  }) => {
    return getInventoryStockForMedicine(inventory, {
      ...med,
      id: med.id || med.medicineId || '',
    });
  };

  const quickSearchSaleMedicines = useMemo(() => {
    const q = medSearch.trim();
    if (!q) return catalog.slice(0, 16);
    return searchAndRankMedicines(catalog, q, 24);
  }, [catalog, medSearch]);

  const quickSearchPurchaseMedicines = useMemo(() => {
    const q = purMedSearch.trim();
    if (!q) return catalog.slice(0, 16);
    return searchAndRankMedicines(catalog, q, 24);
  }, [catalog, purMedSearch]);

  const filteredPurchaseCompanies = useMemo(() => {
    const q = purCompanySearch.trim().toLowerCase();
    const baseList =
      supplierCompany && !BD_PHARMA_COMPANIES.includes(supplierCompany)
        ? [supplierCompany, ...BD_PHARMA_COMPANIES]
        : BD_PHARMA_COMPANIES;
    if (!q) return baseList;
    const matches = baseList.filter((c) => c.toLowerCase().includes(q));
    return matches.length > 0 ? matches : baseList;
  }, [purCompanySearch, supplierCompany]);

  // Sale calculations
  const cartSubTotal = useMemo(() => {
    return posCart.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  }, [posCart]);

  const totalSaleUnits = useMemo(() => {
    return posCart.reduce((acc, item) => acc + item.qty, 0);
  }, [posCart]);

  const getMedPurchasePrice = (med: MedicineCatalogItem): number => {
    if (typeof med.purchasePrice === 'number' && med.purchasePrice > 0) {
      return med.purchasePrice;
    }
    return Number((med.unitPrice * 0.88).toFixed(2));
  };

  const hasModifiedCartPrice = useMemo(() => {
    return posCart.some(
      (item) =>
        (item.originalUnitPrice !== undefined &&
          Math.abs(item.unitPrice - item.originalUnitPrice) > 0.001) ||
        (item.originalPurchasePrice !== undefined &&
          item.purchasePrice !== undefined &&
          Math.abs(item.purchasePrice - item.originalPurchasePrice) > 0.001)
    );
  }, [posCart]);

  const discountVal = Math.max(0, parseFloat(discountStr) || 0);
  const grandTotal = Math.max(0, cartSubTotal - discountVal);

  const effectivePaidAmount =
    paidAmountStr.trim() === ''
      ? grandTotal
      : Math.max(0, Math.min(grandTotal, parseFloat(paidAmountStr) || 0));

  const dueAmount = Math.max(0, grandTotal - effectivePaidAmount);

  // Purchase Invoice calculations
  const purchaseSubTotal = useMemo(() => {
    return purchaseCart.reduce((acc, item) => {
      const effPackRate =
        item.packRate && item.packRate > 0
          ? item.packRate
          : item.purchasePrice > 0
          ? Number((item.purchasePrice * (item.unitsPerPack || 1)).toFixed(2))
          : 0;
      const count = Math.max(1, item.packCount || 1);
      const isPack = Boolean(item.packUnit && item.packUnit !== 'piece' && effPackRate > 0);
      const lineCost = isPack
        ? Number((effPackRate * count).toFixed(2))
        : Number((item.purchasePrice * item.qty).toFixed(2));
      return acc + lineCost;
    }, 0);
  }, [purchaseCart]);

  const totalPurchaseUnits = useMemo(() => {
    return purchaseCart.reduce((acc, item) => acc + item.qty, 0);
  }, [purchaseCart]);

  const purDiscountVal = Math.max(0, parseFloat(purDiscountStr) || 0);
  const purGrandTotal = Math.max(0, purchaseSubTotal - purDiscountVal);

  const effectivePurPaidAmount =
    purPaidStr.trim() === ''
      ? purGrandTotal
      : Math.max(0, Math.min(purGrandTotal, parseFloat(purPaidStr) || 0));

  const purDueAmount = Math.max(0, purGrandTotal - effectivePurPaidAmount);

  const formatOperatorDisplay = (staff: StaffMember) => {
    return staff.roleTitle === 'owner' ? 'Owner' : staff.name;
  };

  const resetSaleFormToFresh = () => {
    setSaleInvoiceNo(makeFreshSaleInvoiceNo());
    setSaleDateStr(getTodayDateStr());
    setSelectedCustomerId('walk-in');
    setWalkInName('সাধারণ ক্রেতা (Walk-in)');
    setWalkInPhone('N/A');
    setPatientAge('');
    setPatientSex('Male');
    setSelectedSeal('iqbal_pharmacy');
    setDentalFindings({
      Pereocoronaties: '',
      Pulpitis: '',
      Calculus: '',
      Gingivitis: '',
      Caries: '',
      Scaling: '',
      Filling: '',
      RCT: '',
      Cap: '',
      Bridge: '',
      EXT: '',
      Others: '',
      'Inv.': '',
    });
    setPharmacyFindings({
      'রক্তচাপ (BP)': '',
      'ডায়াবেটিস (RBS)': '',
      'তাপমাত্রা (Temp)': '',
      'ওজন (Weight)': '',
      'নাড়ির গতি (Pulse)': '',
      'প্রধান লক্ষণ (Symptoms)': '',
      'প্রাথমিক পরামর্শ (Advice)': '',
      'পরীক্ষা-নিরীক্ষা (Inv.)': '',
    });
    setDiscountStr('0');
    setPaidAmountStr('');
    setPaymentMethod('cash');
    setSaleStep(1);
  };

  const handlePreviewCurrentSaleInvoice = (withPrice: boolean = true) => {
    setInvoicePrintWithPrice(withPrice);
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const partyName =
      selectedCustomerId === 'walk-in'
        ? walkInName.trim() || 'সাধারণ ক্রেতা (Walk-in)'
        : cust?.name || 'কাস্টমার';
    const partyPhone = selectedCustomerId === 'walk-in' ? walkInPhone : cust?.phone || '';
    const itemsSummary = posCart.map((i, idx) => formatCartItemInvoiceLine(i, idx)).join('\n');
    const mockTx: Transaction = {
      id: 'preview-' + Date.now(),
      ownerId: activeStaff.ownerId || '',
      invoiceNo: saleInvoiceNo,
      dateStr: saleDateStr,
      txType: 'sale',
      category: 'Medicine Sale',
      amount: grandTotal,
      subTotal: cartSubTotal,
      discount: discountVal,
      grandTotal: grandTotal,
      paidAmount: effectivePaidAmount,
      dueAmount: dueAmount,
      paymentMethod: paymentMethod,
      partyId: selectedCustomerId,
      partyName,
      partyPhone,
      itemsSummary,
      totalCount: posCart.length,
      counterName: activeStaff.counterName || 'Counter-1',
      staffId: activeStaff.id,
      staffName: activeStaff.name,
      staffRole: activeStaff.roleTitle === 'owner' ? 'owner' : 'staff',
      timestamp: Date.now(),
      patientAge,
      patientSex,
      selectedSeal,
      dentalClinical: selectedSeal === 'iqbal_pharmacy' ? pharmacyFindings : dentalFindings,
    };
    setPreviewInvoice(mockTx);
  };

  const resetPurchaseFormToFresh = () => {
    setPurInvoiceNo(makeFreshPurchaseInvoiceNo());
    setPurDateStr(getTodayDateStr());
    setPurDiscountStr('0');
    setPurPaidStr('');
    setPurPaymentMethod('cash');
  };

  const submitSaleWithMode = async (asBrandNewInvoice: boolean) => {
    if (posCart.length === 0) return;
    setSubmittingSale(true);
    try {
      let cName = walkInName.trim() || 'সাধারণ ক্রেতা (Walk-in)';
      let cPhone = walkInPhone.trim() || 'N/A';
      if (selectedCustomerId !== 'walk-in') {
        const cust = customers.find((c) => c.id === selectedCustomerId);
        if (cust) {
          cName = cust.name;
          cPhone = cust.phone;
        }
      }
      const targetInvoiceNo =
        asBrandNewInvoice && isEditingSale && saleInvoiceNo === editingInvoiceTx?.invoiceNo
          ? makeFreshSaleInvoiceNo()
          : saleInvoiceNo.trim() || makeFreshSaleInvoiceNo();

      const activeClinical =
        selectedSeal === 'iqbal_pharmacy' ? pharmacyFindings : dentalFindings;

      const createdTx = await onCompleteSale({
        customerId: selectedCustomerId,
        customerName: cName,
        customerPhone: cPhone,
        patientAge: patientAge.trim() || undefined,
        patientSex: patientSex || 'Male',
        dentalClinical: activeClinical,
        selectedSeal: selectedSeal,
        discount: discountVal,
        paidAmount: effectivePaidAmount,
        paymentMethod: dueAmount > 0 && effectivePaidAmount === 0 ? 'due' : paymentMethod,
        syncModifiedPricesToCatalog: syncModifiedPrices,
        invoiceNo: targetInvoiceNo,
        dateStr: saleDateStr.trim() || getTodayDateStr(),
        editingTxId: !asBrandNewInvoice && isEditingSale ? editingInvoiceTx?.id : undefined,
      });

      // Store current patient info and clinical options before resetting the form
      const finalAge = patientAge.trim();
      const finalSex = patientSex;
      const finalClinical = { ...activeClinical };
      const finalSeal = selectedSeal;

      resetSaleFormToFresh();
      if (createdTx) {
        setPreviewInvoice({
          ...createdTx,
          patientAge: finalAge || createdTx.patientAge,
          patientSex: finalSex || createdTx.patientSex,
          dentalClinical: finalClinical || createdTx.dentalClinical,
          selectedSeal: finalSeal || createdTx.selectedSeal,
        });
        setActiveInvoiceSeal(finalSeal || 'iqbal_pharmacy');
      }
    } finally {
      setSubmittingSale(false);
    }
  };

  // Complete Sale Invoice (Stock decreases)
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitSaleWithMode(false);
  };

  const submitPurchaseWithMode = async (asBrandNewInvoice: boolean) => {
    if (purchaseCart.length === 0) return;
    setSubmittingPurchase(true);
    try {
      const targetPurInvNo =
        asBrandNewInvoice && isEditingPurchase && purInvoiceNo === editingInvoiceTx?.invoiceNo
          ? makeFreshPurchaseInvoiceNo()
          : purInvoiceNo.trim() || makeFreshPurchaseInvoiceNo();

      const createdTx = await onCompletePurchaseInvoice({
        supplierCompany: supplierCompany.trim() || BD_PHARMA_COMPANIES[0],
        supplierPhone: supplierPhone.trim() || 'কোম্পানি ডিপো',
        invoiceNo: targetPurInvNo,
        discount: purDiscountVal,
        paidAmount: effectivePurPaidAmount,
        paymentMethod:
          purDueAmount > 0 && effectivePurPaidAmount === 0 ? 'due' : purPaymentMethod,
        dateStr: purDateStr.trim() || getTodayDateStr(),
        editingTxId: !asBrandNewInvoice && isEditingPurchase ? editingInvoiceTx?.id : undefined,
        syncModifiedPricesToCatalog: syncPurPricesToCatalog,
      });
      resetPurchaseFormToFresh();
      if (createdTx) {
        setPreviewInvoice(createdTx);
      }
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Complete Purchase Invoice (Stock increases)
  const handlePurchaseInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPurchaseWithMode(false);
  };

  const handleEditInvoiceAction = (tx: Transaction) => {
    setPreviewInvoice(null);
    if (tx.txType === 'sale' || tx.txType === 'purchase') {
      // Load directly into the full New-Invoice Creation Builder (নতুন ইনভয়েস তৈরী করার প্রক্রিয়া)
      onStartEditInvoice(tx);
      return;
    }
    setEditingTx(tx);
    setEditDateStr(tx.dateStr);
    setEditPartyName(tx.partyName);
    setEditPartyPhone(tx.partyPhone);
    setEditItemsSummary(formatTransactionItemsText(tx.itemsSummary));
    setEditSubTotal(String(tx.subTotal));
    setEditDiscount(String(tx.discount));
    setEditPaidAmount(String(tx.paidAmount));
    setEditPaymentMethod(tx.paymentMethod);
  };

  const handleSaveEditTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setSavingEditTx(true);
    try {
      const sub = Math.max(0, parseFloat(editSubTotal) || 0);
      const disc = Math.max(0, Math.min(sub, parseFloat(editDiscount) || 0));
      const grand = Math.max(0, sub - disc);
      const paid = Math.max(0, Math.min(grand, parseFloat(editPaidAmount) || 0));
      const due = Math.max(0, grand - paid);

      await onEditTransaction(editingTx.id, {
        dateStr: editDateStr.trim() || editingTx.dateStr,
        partyName: editPartyName.trim() || editingTx.partyName,
        partyPhone: editPartyPhone.trim() || editingTx.partyPhone,
        itemsSummary: editItemsSummary.trim() || editingTx.itemsSummary,
        subTotal: sub,
        discount: disc,
        grandTotal: grand,
        paidAmount: paid,
        dueAmount: due,
        paymentMethod: editPaymentMethod,
      });
      setEditingTx(null);
    } finally {
      setSavingEditTx(false);
    }
  };

  // Payment Now Modal Handlers
  const openPaymentModal = (tx: Transaction) => {
    setSelectedPaymentInvoice(tx);
    setIsFullPayment(true);
    setPaymentAmountInput(tx.dueAmount.toString());
    setPaymentMethodChoice('cash');
    setPaymentNoteInput('');
    setShowPaymentModal(true);
  };

  const handleConfirmPaymentNow = async () => {
    if (!selectedPaymentInvoice || !onPayInvoiceDue) return;
    const due = selectedPaymentInvoice.dueAmount;
    const enteredAmt = isFullPayment
      ? due
      : parseFloat(paymentAmountInput) || 0;
    if (enteredAmt <= 0) return;
    const finalAmt = Math.min(due, enteredAmt);
    setSubmittingPayment(true);
    try {
      const updatedTx = await onPayInvoiceDue({
        invoiceTx: selectedPaymentInvoice,
        paymentAmount: finalAmt,
        paymentMethod: paymentMethodChoice,
        note: paymentNoteInput.trim() || undefined,
      });
      if (updatedTx && previewInvoice && previewInvoice.id === selectedPaymentInvoice.id) {
        setPreviewInvoice(updatedTx);
      }
      setShowPaymentModal(false);
      setSelectedPaymentInvoice(null);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filtered Daily Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!showAllDates && tx.dateStr !== dateFilter) return false;
      if (txTypeFilter !== 'ALL' && tx.txType !== txTypeFilter) return false;
      if (staffRoleFilter !== 'ALL' && tx.staffRole !== staffRoleFilter) return false;
      return true;
    });
  }, [transactions, dateFilter, showAllDates, txTypeFilter, staffRoleFilter]);

  // Daily Accounting Summary Metrics
  const dailyMetrics = useMemo(() => {
    let totalSalesBill = 0;
    let salesCashCollected = 0;
    let salesDueGiven = 0;
    let dueCollectedLater = 0;
    let totalPurchaseBill = 0;
    let ownerSales = 0;
    let staffSales = 0;

    for (const tx of filteredTransactions) {
      if (tx.txType === 'sale') {
        totalSalesBill += tx.grandTotal;
        salesCashCollected += tx.paidAmount;
        salesDueGiven += tx.dueAmount;
        if (tx.staffRole === 'owner') ownerSales += tx.grandTotal;
        else staffSales += tx.grandTotal;
      } else if (tx.txType === 'due_payment') {
        dueCollectedLater += tx.paidAmount;
      } else if (tx.txType === 'purchase') {
        totalPurchaseBill += tx.grandTotal;
      }
    }

    const totalCashIn = salesCashCollected + dueCollectedLater;
    const netCashDrawer = totalCashIn - totalPurchaseBill;

    return {
      totalSalesBill,
      salesCashCollected,
      salesDueGiven,
      dueCollectedLater,
      totalPurchaseBill,
      totalCashIn,
      netCashDrawer,
      ownerSales,
      staffSales,
    };
  }, [filteredTransactions]);

  const parsedPreviewItems = useMemo(() => {
    if (!previewInvoice) return [];
    return parseTransactionItemsDetailed(previewInvoice.itemsSummary);
  }, [previewInvoice]);

  const updatePurchaseRowUnitAndFormula = (
    item: PurchaseCartItem,
    packUnit: PurchasePackUnit,
    opts?: {
      formulaPreset?: string;
      customFormula?: string;
      packCount?: number;
      customMultiplier?: number;
      stripsPerBox?: number;
      pcsPerStrip?: number;
      packRate?: number;
      purchasePrice?: number;
    }
  ): Partial<PurchaseCartItem> => {
    const count = Math.max(1, opts?.packCount !== undefined ? opts.packCount : item.packCount || 1);
    let unitsPerPack = item.unitsPerPack || 10;
    let packDetailFormula = item.packDetailFormula || '';
    let stripsPerBox = opts?.stripsPerBox || item.stripsPerBox || 51;
    let pcsPerStrip = opts?.pcsPerStrip || item.pcsPerStrip || 10;

    if (packUnit === 'strip') {
      if (opts?.formulaPreset === '1*10' || (!opts?.formulaPreset && !opts?.customFormula && (!packDetailFormula || !packDetailFormula.startsWith('1*')))) {
        unitsPerPack = 10;
        packDetailFormula = '1*10';
      } else if (opts?.formulaPreset === '1*28') {
        unitsPerPack = 28;
        packDetailFormula = '1*28';
      } else if (opts?.formulaPreset === '1*20') {
        unitsPerPack = 20;
        packDetailFormula = '1*20';
      } else if (opts?.formulaPreset === '1*15') {
        unitsPerPack = 15;
        packDetailFormula = '1*15';
      } else if (opts?.customMultiplier) {
        unitsPerPack = opts.customMultiplier;
        packDetailFormula = `1*${opts.customMultiplier}`;
      } else if (opts?.customFormula) {
        const parts = opts.customFormula.split('*').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
        if (parts.length >= 2) {
          unitsPerPack = parts.reduce((a, b) => a * b, 1);
          packDetailFormula = opts.customFormula.trim();
        } else if (parts.length === 1) {
          unitsPerPack = parts[0];
          packDetailFormula = `1*${parts[0]}`;
        }
      } else if (!packDetailFormula || !packDetailFormula.startsWith('1*')) {
        unitsPerPack = 10;
        packDetailFormula = '1*10';
      }
    } else if (packUnit === 'box') {
      if (opts?.formulaPreset === '1*10*51' || (!opts?.formulaPreset && !opts?.customFormula && (!packDetailFormula || !packDetailFormula.includes('*')))) {
        stripsPerBox = 51;
        pcsPerStrip = 10;
        unitsPerPack = 510;
        packDetailFormula = '1*10*51';
      } else if (opts?.formulaPreset === '1*10*10') {
        stripsPerBox = 10;
        pcsPerStrip = 10;
        unitsPerPack = 100;
        packDetailFormula = '1*10*10';
      } else if (opts?.formulaPreset === '1*28*20') {
        stripsPerBox = 20;
        pcsPerStrip = 28;
        unitsPerPack = 560;
        packDetailFormula = '1*28*20';
      } else if (opts?.customFormula) {
        const parts = opts.customFormula.split('*').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
        if (parts.length >= 3) {
          pcsPerStrip = parts[1];
          stripsPerBox = parts[2];
          unitsPerPack = parts.reduce((a, b) => a * b, 1);
          packDetailFormula = opts.customFormula.trim();
        } else if (parts.length === 2) {
          unitsPerPack = parts.reduce((a, b) => a * b, 1);
          packDetailFormula = opts.customFormula.trim();
        } else if (parts.length === 1) {
          unitsPerPack = parts[0];
          packDetailFormula = `${parts[0]} পিস`;
        }
      } else if (opts?.stripsPerBox || opts?.pcsPerStrip) {
        stripsPerBox = opts.stripsPerBox || stripsPerBox;
        pcsPerStrip = opts.pcsPerStrip || pcsPerStrip;
        unitsPerPack = stripsPerBox * pcsPerStrip;
        packDetailFormula = `1*${pcsPerStrip}*${stripsPerBox}`;
      }
    } else if (packUnit === 'cartoon') {
      if (opts?.formulaPreset === '1*48' || (!opts?.formulaPreset && !opts?.customFormula && (!packDetailFormula || !packDetailFormula.startsWith('1*')))) {
        unitsPerPack = 48;
        packDetailFormula = '1*48';
      } else if (opts?.formulaPreset === '1*24') {
        unitsPerPack = 24;
        packDetailFormula = '1*24';
      } else if (opts?.customFormula) {
        const parts = opts.customFormula.split('*').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
        if (parts.length >= 2) {
          unitsPerPack = parts.reduce((a, b) => a * b, 1);
          packDetailFormula = opts.customFormula.trim();
        } else if (parts.length === 1) {
          unitsPerPack = parts[0];
          packDetailFormula = `1*${parts[0]}`;
        }
      } else if (opts?.customMultiplier) {
        unitsPerPack = opts.customMultiplier;
        packDetailFormula = `1*${opts.customMultiplier}`;
      }
    } else {
      unitsPerPack = 1;
      packDetailFormula = '১ পিস';
    }

    const totalQty = packUnit === 'piece' ? count : count * unitsPerPack;

    let finalPurPrice = item.purchasePrice;
    let finalPackRate = item.packRate || 0;

    if (opts?.packRate !== undefined) {
      finalPackRate = opts.packRate;
      finalPurPrice = packUnit === 'piece' ? opts.packRate : opts.packRate / unitsPerPack;
    } else if (opts?.purchasePrice !== undefined) {
      finalPurPrice = opts.purchasePrice;
      finalPackRate = packUnit === 'piece' ? opts.purchasePrice : Number((opts.purchasePrice * unitsPerPack).toFixed(2));
    } else if (finalPurPrice > 0) {
      finalPackRate = packUnit === 'piece' ? finalPurPrice : Number((finalPurPrice * unitsPerPack).toFixed(2));
    }

    return {
      packUnit,
      packCount: count,
      unitsPerPack,
      packDetailFormula,
      stripsPerBox,
      pcsPerStrip,
      qty: Math.max(1, totalQty),
      purchasePrice: Math.max(0.01, finalPurPrice),
      packRate: finalPackRate,
    };
  };

  const ensureNextPurchaseBoxOpen = (idx?: number, filledBrandName?: string) => {
    const lastItem = purchaseCart[purchaseCart.length - 1];
    const isLastItemBeingFilledNow =
      idx !== undefined &&
      idx === purchaseCart.length - 1 &&
      Boolean(filledBrandName && filledBrandName.trim());

    const hasBlankRow = !isLastItemBeingFilledNow && Boolean(lastItem && !lastItem.brandName.trim());
    if (!hasBlankRow) {
      onAddCustomToPurchaseCart({
        brandName: '',
        companyName: supplierCompany,
        strength: '',
        dosageForm: 'Tablet',
        purchasePrice: 0,
        unitPrice: 0,
        qty: 10,
        updateStock: true,
        packUnit: 'strip',
        packCount: 1,
        unitsPerPack: 10,
        packDetailFormula: '1*10',
        saveToCatalog: false,
      });
    }
  };

  const handleSelectMedForRow = (rowItem: PurchaseCartItem, med: MedicineCatalogItem, idx: number) => {
    const isSolid = ['tablet', 'capsule', 'suppository', 'sachet'].includes((med.dosageForm || '').toLowerCase());
    const isLiquid = ['syrup', 'suspension', 'drops', 'solution', 'liquid'].includes((med.dosageForm || '').toLowerCase());
    
    const packUnit: PurchasePackUnit = isSolid ? 'strip' : isLiquid ? 'cartoon' : 'piece';
    const unitsPerPack = isSolid ? (med.unitsPerStrip || 10) : isLiquid ? 48 : 1;
    const formulaStr = isSolid ? `1*${unitsPerPack}` : isLiquid ? '1*48' : '১ পিস';
    const estCost = typeof med.purchasePrice === 'number' && med.purchasePrice > 0
      ? med.purchasePrice
      : Number((med.unitPrice * 0.88).toFixed(2));
    const packRate = packUnit === 'piece' ? estCost : Number((estCost * unitsPerPack).toFixed(2));

    onUpdatePurchaseCartItemDetails(rowItem.medicineId, {
      medicineId: med.id,
      brandName: med.brandName,
      strength: med.strength,
      dosageForm: med.dosageForm,
      companyName: med.companyName || rowItem.companyName,
      purchasePrice: estCost,
      unitPrice: med.unitPrice,
      packUnit,
      packCount: 1,
      unitsPerPack,
      packDetailFormula: formulaStr,
      qty: unitsPerPack,
      packRate,
      updateStock: true,
    });
    if (med.companyName) {
      setSupplierCompany(med.companyName);
    }
    setActiveSearchMedId(null);

    // Auto 1st Line Fill 2nd Box Open
    ensureNextPurchaseBoxOpen(idx, med.brandName);
  };

  const handleCreateManualMedForRow = (
    rowItem: PurchaseCartItem,
    customName: string,
    chosenForm: string,
    idx: number
  ) => {
    const isSolid = ['tablet', 'capsule', 'suppository', 'sachet'].includes(chosenForm.toLowerCase());
    const isLiquid = ['syrup', 'suspension', 'drops', 'solution', 'liquid'].includes(chosenForm.toLowerCase());
    const packUnit: PurchasePackUnit = isSolid ? 'strip' : isLiquid ? 'cartoon' : 'piece';
    const unitsPerPack = isSolid ? 10 : isLiquid ? 48 : 1;
    const formulaStr = isSolid ? '1*10' : isLiquid ? '1*48' : '১ পিস';

    onUpdatePurchaseCartItemDetails(rowItem.medicineId, {
      brandName: customName.trim(),
      dosageForm: chosenForm,
      packUnit,
      packCount: 1,
      unitsPerPack,
      packDetailFormula: formulaStr,
      qty: unitsPerPack,
      updateStock: true,
    });
    setActiveSearchMedId(null);

    // Save newly created medicine to database catalog immediately so it appears in future suggestions
    if (onSaveMedicineCatalog && customName.trim()) {
      onSaveMedicineCatalog({
        brandName: customName.trim(),
        genericName: customName.trim(),
        companyName: supplierCompany || 'Custom / General',
        strength: rowItem.strength || 'Standard',
        dosageForm: chosenForm,
        packSize: formulaStr,
        purchasePrice: rowItem.purchasePrice || 0,
        unitPrice: rowItem.unitPrice || (rowItem.purchasePrice ? Number((rowItem.purchasePrice * 1.15).toFixed(2)) : 5),
        stripPrice: Number(((rowItem.unitPrice || (rowItem.purchasePrice * 1.15) || 5) * 10).toFixed(2)),
        therapeuticClass: 'Custom Medicine',
        indication: 'কাস্টম ওষুধ',
      }).catch(console.error);
    }

    // Auto open 2nd box if this was last row / custom product added
    ensureNextPurchaseBoxOpen(idx, customName.trim());
  };

  const handleAddNewPurchaseBox = () => {
    onAddCustomToPurchaseCart({
      brandName: '',
      companyName: supplierCompany,
      strength: '',
      dosageForm: 'Tablet',
      purchasePrice: 0,
      unitPrice: 0,
      qty: 10,
      updateStock: true,
      packUnit: 'strip',
      packCount: 1,
      unitsPerPack: 10,
      packDetailFormula: '1*10',
      saveToCatalog: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Active Owner / Staff Entry Identity Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              বর্তমান ক্রয় ও বিক্রয় ইনভয়েস অপারেটর (মালিকের নাম &ldquo;Owner&rdquo; এবং স্টাফদের নির্দিষ্ট নাম প্রদর্শিত)
            </div>
            <div className="text-sm font-bold text-slate-900">
              অপারেটর নাম:{' '}
              <span className="text-teal-700 font-bold">
                {formatOperatorDisplay(activeStaff)}
              </span>{' '}
              · {activeStaff.counterName}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">অপারেটর পরিবর্তন:</span>
          {staffList.map((st) => {
            const isSelected = st.id === activeStaff.id;
            const label = st.roleTitle === 'owner' ? 'Owner' : st.name;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectActiveStaff(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Distinct Invoice Modes: 1. Sales Invoice (Decreases Stock) | 2. Purchase Invoice (Increases Stock) */}
      <div
        ref={invoiceBuilderRef}
        className={`bg-white border rounded-lg overflow-hidden transition-colors no-print ${
          editingInvoiceTx
            ? 'border-amber-500 ring-2 ring-amber-200/80'
            : 'border-slate-200'
        }`}
      >
        {/* Active Invoice Edit Mode Banner (Uses the exact same New-Invoice Creation Process) */}
        {editingInvoiceTx && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-amber-950">
                <Edit3 className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  ইনভয়েস এডিট মোড সক্রিয় (নতুন ইনভয়েস তৈরির প্রক্রিয়ায় এডিট হচ্ছে):{' '}
                  <span className="font-mono underline">{editingInvoiceTx.invoiceNo}</span>
                </span>
                <span className="text-amber-800 font-semibold">
                  · {editingInvoiceTx.txType === 'sale' ? 'বিক্রয় ইনভয়েস' : 'ক্রয় ইনভয়েস'} ·{' '}
                  {editingInvoiceTx.partyName}
                </span>
              </div>
              <p className="text-xs text-amber-900">
                নতুন ইনভয়েস তৈরির মতোই বাম পাশ থেকে যেকোনো নতুন ওষুধ যোগ করুন, ডান পাশে পরিমাণ (+ / -), ক্রয় মূল্য ও বিক্রয় মূল্য পরিবর্তন বা ওষুধ ডিলিট করুন এবং নিচে ইনভয়েস সম্পন্ন করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onCancelEditInvoice();
                resetSaleFormToFresh();
                resetPurchaseFormToFresh();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-white hover:bg-amber-100 border border-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              এডিট বাতিল করে নতুন মেমো শুরু করুন ✕
            </button>
          </div>
        )}

        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-2 bg-slate-200/80 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setEntryTab('sale_pos')}
              className={`px-4 py-2 text-xs font-bold rounded transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                entryTab === 'sale_pos'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {isEditingSale
                  ? `১. বিক্রয় ইনভয়েস এডিট হচ্ছে (${editingInvoiceTx?.invoiceNo})`
                  : '১. প্রডাক্ট বিক্রয় ইনভয়েস — স্টক কমবে (Sales Invoice)'}
              </span>
              {posCart.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[11px] font-mono rounded ${
                    entryTab === 'sale_pos'
                      ? 'bg-teal-900 text-white'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {posCart.length} আইটেম (-{totalSaleUnits})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setEntryTab('purchase_entry')}
              className={`px-4 py-2 text-xs font-bold rounded transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                entryTab === 'purchase_entry'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>
                {isEditingPurchase
                  ? `২. ক্রয় ইনভয়েস এডিট হচ্ছে (${editingInvoiceTx?.invoiceNo})`
                  : '২. প্রডাক্ট ক্রয় ইনভয়েস — স্টক বাড়বে (Purchase Invoice)'}
              </span>
              {purchaseCart.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[11px] font-mono rounded ${
                    entryTab === 'purchase_entry'
                      ? 'bg-indigo-900 text-white'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {purchaseCart.length} আইটেম (+{totalPurchaseUnits})
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {entryTab === 'sale_pos' ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-md">
                <PackageMinus className="w-3.5 h-3.5 text-teal-700" />
                {isEditingSale
                  ? 'বিক্রয় ইনভয়েস এডিট: সংরক্ষণ করলে পূর্বের স্টক সমন্বয় হয়ে নতুন স্টক কমবে'
                  : 'বিক্রয় মোড: ইনভয়েস সম্পন্ন করলে স্টক স্বয়ংক্রিয়ভাবে কমবে'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-md">
                <PackageCheck className="w-3.5 h-3.5 text-indigo-700" />
                {isEditingPurchase
                  ? 'ক্রয় ইনভয়েস এডিট: সংরক্ষণ করলে পূর্বের স্টক সমন্বয় হয়ে নতুন স্টক বাড়বে'
                  : 'ক্রয় মোড: ইনভয়েস সম্পন্ন করলে স্টক স্বয়ংক্রিয়ভাবে বাড়বে'}
              </span>
            )}
          </div>
        </div>

        {entryTab === 'sale_pos' ? (
          <SaleStepWizard
            saleStep={saleStep}
            setSaleStep={setSaleStep}
            saleWorkflowMode={saleWorkflowMode}
            setSaleWorkflowMode={setSaleWorkflowMode}
            walkInName={walkInName}
            setWalkInName={setWalkInName}
            walkInPhone={walkInPhone}
            setWalkInPhone={setWalkInPhone}
            patientAge={patientAge}
            setPatientAge={setPatientAge}
            patientSex={patientSex}
            setPatientSex={setPatientSex}
            selectedSeal={selectedSeal}
            setSelectedSeal={setSelectedSeal}
            pharmacyFindings={pharmacyFindings}
            setPharmacyFindings={setPharmacyFindings}
            dentalFindings={dentalFindings}
            setDentalFindings={setDentalFindings}
            showClinicalPanel={showClinicalPanel}
            setShowClinicalPanel={setShowClinicalPanel}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            saleInvoiceNo={saleInvoiceNo}
            setSaleInvoiceNo={setSaleInvoiceNo}
            saleDateStr={saleDateStr}
            setSaleDateStr={setSaleDateStr}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            saleCustomName={saleCustomName}
            setSaleCustomName={setSaleCustomName}
            saleCustomStrength={saleCustomStrength}
            setSaleCustomStrength={setSaleCustomStrength}
            saleCustomForm={saleCustomForm}
            setSaleCustomForm={setSaleCustomForm}
            saleCustomUnitPrice={saleCustomUnitPrice}
            setSaleCustomUnitPrice={setSaleCustomUnitPrice}
            saleCustomPurPrice={saleCustomPurPrice}
            setSaleCustomPurPrice={setSaleCustomPurPrice}
            saleCustomQty={saleCustomQty}
            setSaleCustomQty={setSaleCustomQty}
            saleCustomSaveCatalog={saleCustomSaveCatalog}
            setSaleCustomSaveCatalog={setSaleCustomSaveCatalog}
            saleCustomNameInputRef={saleCustomNameInputRef}
            saleCustomPriceInputRef={saleCustomPriceInputRef}
            customProductForms={CUSTOM_PRODUCT_FORMS}
            medSearch={medSearch}
            setMedSearch={setMedSearch}
            saleSearchInputRef={saleSearchInputRef}
            onOpenScanner={onOpenScanner}
            quickSearchSaleMedicines={quickSearchSaleMedicines}
            getStockForMed={getStockForMed}
            getMedPurchasePrice={getMedPurchasePrice}
            getOldEditedQtyForMed={getOldEditedQtyForMed}
            posCart={posCart}
            cartSubTotal={cartSubTotal}
            discountStr={discountStr}
            setDiscountStr={setDiscountStr}
            discountVal={discountVal}
            grandTotal={grandTotal}
            paidAmountStr={paidAmountStr}
            setPaidAmountStr={setPaidAmountStr}
            dueAmount={dueAmount}
            totalSaleUnits={totalSaleUnits}
            hasModifiedCartPrice={hasModifiedCartPrice}
            syncModifiedPrices={syncModifiedPrices}
            setSyncModifiedPrices={setSyncModifiedPrices}
            onAddToCart={onAddToCart}
            onAddCustomToCart={onAddCustomToCart}
            onUpdateCartItemDetails={onUpdateCartItemDetails}
            onUpdateCartUnitPrice={onUpdateCartUnitPrice}
            onUpdateCartPurchasePrice={onUpdateCartPurchasePrice}
            onUpdateCartQty={onUpdateCartQty}
            onRemoveFromCart={onRemoveFromCart}
            onClearCart={onClearCart}
            isEditingSale={isEditingSale}
            submittingSale={submittingSale}
            handleSaleSubmit={handleSaleSubmit}
            submitSaleWithMode={submitSaleWithMode}
            onPreviewCurrentSaleInvoice={handlePreviewCurrentSaleInvoice}
            activeStaff={activeStaff}
          />
        ) : (
          /* ============================================================================
             MODE 2: PRODUCT PURCHASE INVOICE (বক্স আকারে ক্রয় ইনভয়েস টেবিল)
             |No(Auto 1st Line Fill 2nd Box Open)|Name (List/Manual)|Pcs 0,1,2.../Strip 1*10,1*28,1*20,1*15/Box 1*10*10,1*28*20,..|Price (Manual/Database)
             ============================================================================ */
          <div className="p-4 sm:p-5 space-y-4 bg-indigo-50/20">
            {/* Top Bar: Supplier & Invoice Header Details */}
            <div className="bg-white p-4 rounded-lg border border-indigo-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-md">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      ২. প্রডাক্ট ক্রয় ইনভয়েস ও চালান এন্ট্রি (বক্স আকারে তালিকা)
                    </h3>
                    <p className="text-xs text-slate-500">
                      অপারেটর: <strong>{formatOperatorDisplay(activeStaff)}</strong> · ক্রয় ইনভয়েসে বিক্রয় মূল্য দেখাবে না, শুধুমাত্র ক্রয় দর ও প্যাক হিসাব সংরক্ষিত হবে
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewPurchaseBox}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + নতুন বক্স / লাইন যোগ করুন
                  </button>
                  {purchaseCart.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          purchaseCart.forEach((item) => {
                            onUpdatePurchaseCartItemDetails(item.medicineId, { updateStock: true });
                          });
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-colors"
                      >
                        সবগুলোতে ✅ স্টকে যুক্ত
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          purchaseCart.forEach((item) => {
                            onUpdatePurchaseCartItemDetails(item.medicineId, { updateStock: false });
                          });
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded cursor-pointer transition-colors"
                      >
                        সবগুলো শুধু ইনভয়েস
                      </button>
                      <button
                        type="button"
                        onClick={onClearPurchaseCart}
                        className="text-xs text-red-600 hover:underline cursor-pointer ml-1"
                      >
                        খালি করুন
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    সরবরাহকারী কোম্পানি *
                  </label>
                  <select
                    value={supplierCompany}
                    onChange={(e) => setSupplierCompany(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800"
                  >
                    {BD_PHARMA_COMPANIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    ডিপো / প্রতিনিধির মোবাইল
                  </label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="যেমন: 01712345678"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    ক্রয় চালান / ইনভয়েস নং *
                  </label>
                  <input
                    type="text"
                    required
                    value={purInvoiceNo}
                    onChange={(e) => setPurInvoiceNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-md text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    ক্রয়ের তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={purDateStr}
                    onChange={(e) => setPurDateStr(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    পেমেন্ট মাধ্যম *
                  </label>
                  <select
                    value={purPaymentMethod}
                    onChange={(e) =>
                      setPurPaymentMethod(e.target.value as Transaction['paymentMethod'])
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                  >
                    <option value="cash">নগদ টাকা (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ এমএফএস (Nagad)</option>
                    <option value="card">ব্যাংক / চেক (Card/Bank)</option>
                    <option value="due">কোম্পানি বাকি (Supplier Due)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Purchase Entry Toolbar with Scan Icon */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="text-xs text-slate-500 font-medium">
                চালান বক্স তালিকা (স্বয়ংক্রিয় ২য় বক্স ওপেন ও ডাটাবেস এন্ট্রি)
              </div>
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                  title="বক্সের উপর ধরুন: নাম, বক্স সাইজ, দাম, ব্যাচ নম্বর ও মেয়াদ স্বয়ংক্রিয়ভাবে স্ক্যান হবে"
                >
                  <Camera className="w-4 h-4 text-purple-700" />
                  <span>(স্ক্যান) বক্স স্ক্যানার</span>
                </button>
              )}
            </div>

            {/* The Main Box Grid Table */}
            <div className="border border-indigo-200 rounded-lg bg-white overflow-visible shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-indigo-950 text-white font-sans text-xs">
                    <tr>
                      <th className="py-2.5 px-2 w-14 text-center border-r border-indigo-800/60 leading-tight">
                        No<br />
                        <span className="text-[9px] font-normal text-indigo-300">(Auto 1st Line Fill 2nd Box Open)</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[260px] border-r border-indigo-800/60">
                        Name (List / Manual)
                      </th>
                      <th className="py-2.5 px-3 min-w-[360px] border-r border-indigo-800/60 leading-tight">
                        Pcs 0,1,2... / Strip 1*10, 1*28, 1*20, 1*15 (Manual/Product Database) / Box 1*10*10, 1*28*20,.. (Manual/Product Database)
                      </th>
                      <th className="py-2.5 px-3 min-w-[170px] text-center border-r border-indigo-800/60">
                        Price (Manual / Database) (৳)
                      </th>
                      <th className="py-2.5 px-3 w-32 text-right border-r border-indigo-800/60">
                        লাইন মোট (৳)
                      </th>
                      <th className="py-2.5 px-2 w-10 text-center">
                        ✕
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {purchaseCart.map((item, idx) => {
                      const effectivePackRate =
                        item.packRate && item.packRate > 0
                          ? item.packRate
                          : item.purchasePrice > 0
                          ? Number((item.purchasePrice * (item.unitsPerPack || 1)).toFixed(2))
                          : 0;
                      const effectivePackCount = Math.max(1, item.packCount || 1);
                      const isPackRow = Boolean(item.packUnit && item.packUnit !== 'piece' && effectivePackRate > 0);
                      const lineTotal = isPackRow
                        ? Number((effectivePackRate * effectivePackCount).toFixed(2))
                        : Number((item.purchasePrice * item.qty).toFixed(2));
                      const rawCurrentStock = getStockForMed(item);
                      const oldPurQty = isEditingPurchase ? getOldEditedQtyForMed(item) : 0;
                      const currentStock = Math.max(0, rawCurrentStock - oldPurQty);
                      const afterStock = currentStock + item.qty;

                      const isSolid = ['tablet', 'capsule', 'suppository', 'sachet'].includes(
                        (item.dosageForm || 'Tablet').toLowerCase()
                      );
                      const isLiquid = ['syrup', 'suspension', 'drops', 'solution', 'liquid'].includes(
                        (item.dosageForm || '').toLowerCase()
                      );
                      const currentPackUnit = item.packUnit || (isSolid ? 'strip' : isLiquid ? 'cartoon' : 'piece');

                      // Search matches for this specific row when active
                      const isDropdownOpen = activeSearchMedId === item.medicineId;
                      const query = (activeSearchQuery || item.brandName || '').trim().toLowerCase();
                      const suggestions = query
                        ? catalog
                            .filter(
                              (m) =>
                                m.brandName.toLowerCase().includes(query) ||
                                m.genericName.toLowerCase().includes(query)
                            )
                            .slice(0, 8)
                        : catalog.slice(0, 8);

                      return (
                        <tr
                          key={item.medicineId}
                          className={`hover:bg-indigo-50/30 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                        >
                          {/* 1. No Column (Auto 1st Line Fill 2nd Box Open) */}
                          <td className="py-3 px-2 text-center align-top border-r border-slate-200">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded inline-block text-[11px]">
                              {idx + 1}
                            </span>
                          </td>

                          {/* 2. Name Column (List / Manual) */}
                          <td className="py-3 px-3 align-top border-r border-slate-200 relative">
                            <div className="space-y-1.5">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.brandName}
                                  onFocus={() => {
                                    setActiveSearchMedId(item.medicineId);
                                    setActiveSearchQuery(item.brandName || '');
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setActiveSearchQuery(val);
                                    setActiveSearchMedId(item.medicineId);
                                    onUpdatePurchaseCartItemDetails(item.medicineId, {
                                      brandName: val,
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      setActiveSearchMedId(null);
                                      if (item.brandName.trim()) {
                                        ensureNextPurchaseBoxOpen(idx, item.brandName.trim());
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    // Do not auto-open extra rows on simple blur to prevent race conditions & duplicate blank boxes
                                  }}
                                  placeholder="ওষুধের নাম লিখুন বা লিস্ট থেকে সিলেক্ট করুন (যেমন: Napa, Seclo)..."
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />

                                {/* Interactive Suggestions Dropdown */}
                                {isDropdownOpen && (
                                  <div className="absolute left-0 top-full mt-1 w-full max-w-md bg-white border border-indigo-300 rounded-md shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                                    <div className="p-2 bg-indigo-50 flex items-center justify-between text-[11px] font-semibold text-indigo-950">
                                      <span>ডাটাবেস সাজেশন ও ক্যাটালগ লিস্ট:</span>
                                      <button
                                        type="button"
                                        onClick={() => setActiveSearchMedId(null)}
                                        className="text-slate-500 hover:text-slate-800 cursor-pointer"
                                      >
                                        ✕ বন্ধ
                                      </button>
                                    </div>

                                    {suggestions.length > 0 ? (
                                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                                        {suggestions.map((med) => {
                                          const medCost =
                                            typeof med.purchasePrice === 'number' && med.purchasePrice > 0
                                              ? med.purchasePrice
                                              : Number((med.unitPrice * 0.88).toFixed(2));
                                          const medStock = getInventoryStockForMedicine(inventory, med);
                                          return (
                                            <button
                                              key={med.id}
                                              type="button"
                                              onClick={() => handleSelectMedForRow(item, med, idx)}
                                              className="w-full p-2 text-left hover:bg-indigo-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                                            >
                                              <div>
                                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                                  <span>{med.brandName}</span>
                                                  <span className="text-[11px] font-normal text-slate-500">
                                                    {med.strength}
                                                  </span>
                                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                                    {med.dosageForm}
                                                  </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                  {med.genericName} · {med.companyName}
                                                </div>
                                              </div>
                                              <div className="text-right shrink-0">
                                                <div className="font-mono text-xs font-bold text-indigo-700">
                                                  ক্রয়: ৳{formatCleanMoney(medCost)}
                                                </div>
                                                <div className="text-[10px] font-mono text-slate-500">
                                                  স্টক: {medStock} পিস
                                                </div>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="p-3 text-xs text-slate-500 text-center">
                                        ডাটাবেসে &ldquo;{query}&rdquo; নামে কোনো ওষুধ পাওয়া যায়নি।
                                      </div>
                                    )}

                                    {/* Manual entry / new medicine save prompt */}
                                    {item.brandName.trim() && (
                                      <div className="p-2.5 bg-indigo-50/50 space-y-2 border-t border-indigo-100">
                                        <div className="text-[11px] font-bold text-indigo-900">
                                          ➕ &ldquo;{item.brandName.trim()}&rdquo; নতুন ওষুধ হিসেবে ডাটাবেসে সেভ করুন:
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {[
                                            { label: 'ট্যাবলেট', form: 'Tablet' },
                                            { label: 'ক্যাপসুল', form: 'Capsule' },
                                            { label: 'সিরাপ', form: 'Syrup' },
                                            { label: 'সাপোজিটরি', form: 'Suppository' },
                                            { label: 'স্যাশেট', form: 'Sachet' },
                                            { label: 'ড্রপ', form: 'Drops' },
                                            { label: 'ইনজেকশন', form: 'Injection' },
                                            { label: 'অন্যান্য', form: 'Surgical' },
                                          ].map((btn) => (
                                            <button
                                              key={btn.form}
                                              type="button"
                                              onClick={() =>
                                                handleCreateManualMedForRow(
                                                  item,
                                                  item.brandName,
                                                  btn.form,
                                                  idx
                                                )
                                              }
                                              className="px-2 py-0.5 text-[11px] font-semibold text-indigo-900 bg-white hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer transition-colors"
                                            >
                                              {btn.label} হিসেবে সেভ
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Form & Strength secondary fields */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <select
                                  value={item.dosageForm || 'Tablet'}
                                  onChange={(e) => {
                                    const nextForm = e.target.value;
                                    const isSolidNext = ['tablet', 'capsule', 'suppository', 'sachet'].includes(
                                      nextForm.toLowerCase()
                                    );
                                    const isLiquidNext = ['syrup', 'suspension', 'drops', 'solution', 'liquid'].includes(
                                      nextForm.toLowerCase()
                                    );
                                    const nextPackUnit = isSolidNext ? 'strip' : isLiquidNext ? 'cartoon' : 'piece';
                                    const updates = updatePurchaseRowUnitAndFormula(item, nextPackUnit);
                                    onUpdatePurchaseCartItemDetails(item.medicineId, {
                                      ...updates,
                                      dosageForm: nextForm,
                                    });
                                  }}
                                  className="px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
                                >
                                  {CUSTOM_PRODUCT_FORMS.map((f) => (
                                    <option key={f.value} value={f.value}>
                                      {f.label}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={item.strength || ''}
                                  onChange={(e) =>
                                    onUpdatePurchaseCartItemDetails(item.medicineId, {
                                      strength: e.target.value,
                                    })
                                  }
                                  placeholder="শক্তি (যেমন: 500mg)"
                                  className="w-24 px-1.5 py-0.5 text-[11px] font-mono border border-slate-200 rounded bg-white"
                                />
                                <input
                                  type="text"
                                  value={item.batchNo || ''}
                                  onChange={(e) =>
                                    onUpdatePurchaseCartItemDetails(item.medicineId, {
                                      batchNo: e.target.value,
                                    })
                                  }
                                  placeholder="ব্যাচ নং"
                                  className="w-20 px-1.5 py-0.5 text-[11px] font-mono border border-slate-200 rounded bg-white text-slate-600"
                                />
                              </div>
                            </div>
                          </td>

                          {/* 3. Pcs / Strip / Box / Cartoon (Manual/Database) */}
                          <td className="py-3 px-3 align-top border-r border-slate-200">
                            <div className="space-y-2">
                              {/* Unit Buttons */}
                              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 w-fit">
                                {isSolid ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'strip', {
                                          formulaPreset: '1*10',
                                        });
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'strip'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      পাতা (Strip)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'box', {
                                          formulaPreset: '1*10*10',
                                        });
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'box'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      বক্স (Box)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'piece');
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'piece'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      পিস (Pcs)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'cartoon', {
                                          formulaPreset: '1*48',
                                        });
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'cartoon'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      কার্টুন
                                    </button>
                                  </>
                                ) : isLiquid ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'piece');
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'piece'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      পিস / বোতল
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'cartoon', {
                                          formulaPreset: '1*48',
                                        });
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'cartoon'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      কার্টুন (1*48)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'box', {
                                          formulaPreset: '1*10*10',
                                        });
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'box'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      বক্স (Box)
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'piece');
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'piece'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      পিস (Pcs)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'box', {
                                          formulaPreset: '1*10*10',
                                        });
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'box'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      বক্স (Box)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updates = updatePurchaseRowUnitAndFormula(item, 'cartoon', {
                                          formulaPreset: '1*48',
                                        });
                                        onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                                        currentPackUnit === 'cartoon'
                                          ? 'bg-indigo-700 text-white shadow-xs'
                                          : 'text-slate-700 hover:text-indigo-900'
                                      }`}
                                    >
                                      কার্টুন
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* Pack Count & Multiplier Formula Presets */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    {currentPackUnit === 'strip'
                                      ? 'পাতা সংখ্যা:'
                                      : currentPackUnit === 'box'
                                      ? 'বক্স সংখ্যা:'
                                      : currentPackUnit === 'cartoon'
                                      ? 'কার্টুন সংখ্যা:'
                                      : 'পিস সংখ্যা:'}
                                  </span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.packCount || 1}
                                    onChange={(e) => {
                                      const nextCount = Math.max(1, parseInt(e.target.value, 10) || 1);
                                      const updates = updatePurchaseRowUnitAndFormula(item, currentPackUnit, {
                                        packCount: nextCount,
                                      });
                                      onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                    }}
                                    className="w-14 text-center py-1 text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                                  />
                                </div>

                                {/* Preset Buttons for Strip */}
                                {currentPackUnit === 'strip' && (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {['1*10', '1*28', '1*20', '1*15'].map((preset) => (
                                      <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                          const updates = updatePurchaseRowUnitAndFormula(item, 'strip', {
                                            formulaPreset: preset,
                                          });
                                          onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                        }}
                                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer border ${
                                          item.packDetailFormula === preset
                                            ? 'bg-indigo-100 border-indigo-400 font-bold text-indigo-950'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                      >
                                        {preset}
                                      </button>
                                    ))}
                                    <div className="flex items-center gap-0.5 pl-0.5">
                                      <span className="text-[10px] text-slate-500 font-mono">ম্যানুয়াল:</span>
                                      <input
                                        type="text"
                                        value={item.packDetailFormula || ''}
                                        onChange={(e) => {
                                          const customVal = e.target.value;
                                          const updates = updatePurchaseRowUnitAndFormula(item, 'strip', {
                                            customFormula: customVal,
                                          });
                                          onUpdatePurchaseCartItemDetails(item.medicineId, {
                                            ...updates,
                                            packDetailFormula: customVal,
                                          });
                                        }}
                                        placeholder="1*10"
                                        className="w-14 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded bg-white text-center"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Preset Buttons for Box */}
                                {currentPackUnit === 'box' && (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {[
                                      { label: '1*10*10 (100)', preset: '1*10*10' },
                                      { label: '1*28*20 (560)', preset: '1*28*20' },
                                      { label: '1*10*51 (510)', preset: '1*10*51' },
                                    ].map((b) => (
                                      <button
                                        key={b.preset}
                                        type="button"
                                        onClick={() => {
                                          const updates = updatePurchaseRowUnitAndFormula(item, 'box', {
                                            formulaPreset: b.preset,
                                          });
                                          onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                        }}
                                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer border ${
                                          item.packDetailFormula === b.preset
                                            ? 'bg-indigo-100 border-indigo-400 font-bold text-indigo-950'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                      >
                                        {b.label}
                                      </button>
                                    ))}
                                    <div className="flex items-center gap-0.5 pl-0.5">
                                      <span className="text-[10px] text-slate-500 font-mono">ম্যানুয়াল:</span>
                                      <input
                                        type="text"
                                        value={item.packDetailFormula || ''}
                                        onChange={(e) => {
                                          const customVal = e.target.value;
                                          const updates = updatePurchaseRowUnitAndFormula(item, 'box', {
                                            customFormula: customVal,
                                          });
                                          onUpdatePurchaseCartItemDetails(item.medicineId, {
                                            ...updates,
                                            packDetailFormula: customVal,
                                          });
                                        }}
                                        placeholder="1*10*51"
                                        className="w-18 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded bg-white text-center"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Preset Buttons for Cartoon */}
                                {currentPackUnit === 'cartoon' && (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {['1*48', '1*24'].map((preset) => (
                                      <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                          const updates = updatePurchaseRowUnitAndFormula(item, 'cartoon', {
                                            formulaPreset: preset,
                                          });
                                          onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                        }}
                                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer border ${
                                          item.packDetailFormula === preset
                                            ? 'bg-indigo-100 border-indigo-400 font-bold text-indigo-950'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                      >
                                        {preset}
                                      </button>
                                    ))}
                                    <div className="flex items-center gap-0.5 pl-0.5">
                                      <span className="text-[10px] text-slate-500 font-mono">ম্যানুয়াল:</span>
                                      <input
                                        type="text"
                                        value={item.packDetailFormula || ''}
                                        onChange={(e) => {
                                          const customVal = e.target.value;
                                          const updates = updatePurchaseRowUnitAndFormula(item, 'cartoon', {
                                            customFormula: customVal,
                                          });
                                          onUpdatePurchaseCartItemDetails(item.medicineId, {
                                            ...updates,
                                            packDetailFormula: customVal,
                                          });
                                        }}
                                        placeholder="1*48"
                                        className="w-14 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded bg-white text-center"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Live Calculation Formula Display */}
                              <div className="text-[11px] font-mono font-semibold text-indigo-950 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200/60 inline-flex items-center gap-1.5">
                                <span>হিসাব:</span>
                                <span>
                                  {currentPackUnit === 'strip'
                                    ? `${item.packCount || 1} পাতা (${item.packDetailFormula || '1*10'}) = ${item.qty} পিস`
                                    : currentPackUnit === 'box'
                                    ? `${item.packCount || 1} বক্স (${item.packDetailFormula || '1*10*51'}) = ${item.qty} পিস`
                                    : currentPackUnit === 'cartoon'
                                    ? `${item.packCount || 1} কার্টুন (${item.packDetailFormula || '1*48'}) = ${item.qty} পিস`
                                    : `${item.qty} পিস`}
                                </span>
                              </div>

                              {/* Stock Checkbox Toggle: ✅ দিলে স্টকে যুক্ত হবে, অন্যথায় শুধু ইনভয়েস */}
                              <div className="pt-0.5">
                                <label
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] border select-none cursor-pointer transition-colors ${
                                    item.updateStock !== false
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-100'
                                      : 'bg-amber-50 border-amber-300 text-amber-900 font-semibold hover:bg-amber-100'
                                  }`}
                                  title={
                                    item.updateStock !== false
                                      ? '✅ স্টকে যুক্ত হবে (ক্লিক করে টিক তুলে দিলে স্টক বাড়বে না, শুধু ইনভয়েস তৈরি হবে)'
                                      : '❌ স্টকে যুক্ত হবে না (শুধু ইনভয়েস তৈরি হবে)'
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.updateStock !== false}
                                    onChange={(e) =>
                                      onUpdatePurchaseCartItemDetails(item.medicineId, {
                                        updateStock: e.target.checked,
                                      })
                                    }
                                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span>
                                    {item.updateStock !== false
                                      ? `✅ স্টকে যুক্ত হবে (স্টক বাড়বে: ${currentStock} → ${afterStock})`
                                      : '❌ স্টকে যুক্ত হবে না (শুধু ইনভয়েস বিল)'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          </td>

                          {/* 4. Price Column (Manual / Database) - NO SELLING PRICE! */}
                          <td className="py-3 px-3 align-top border-r border-slate-200">
                            <div className="space-y-1.5 text-center">
                              {currentPackUnit !== 'piece' ? (
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                                    প্রতি {currentPackUnit === 'strip' ? 'পাতা' : currentPackUnit === 'box' ? 'বক্স' : 'কার্টুন'} দর (৳):
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={item.packRate || ''}
                                    onChange={(e) => {
                                      const nextRate = parseFloat(e.target.value) || 0;
                                      const updates = updatePurchaseRowUnitAndFormula(item, currentPackUnit, {
                                        packRate: nextRate,
                                      });
                                      onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                    }}
                                    placeholder="প্যাক দর"
                                    className="w-24 text-center py-1 px-1.5 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded bg-white text-slate-900 mx-auto"
                                  />
                                  <div className="text-[10px] font-mono text-indigo-700 mt-0.5">
                                    (পিস দর ৳{formatCleanMoney(item.purchasePrice)})
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                                    প্রতি পিস ক্রয় দর (৳):
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={item.purchasePrice || ''}
                                    onChange={(e) => {
                                      const nextPrice = parseFloat(e.target.value) || 0;
                                      const updates = updatePurchaseRowUnitAndFormula(item, 'piece', {
                                        purchasePrice: nextPrice,
                                      });
                                      onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                    }}
                                    placeholder="পিস দর"
                                    className="w-24 text-center py-1 px-1.5 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded bg-white text-slate-900 mx-auto"
                                  />
                                </div>
                              )}

                              {/* Direct piece price override */}
                              <div className="pt-0.5 flex items-center justify-center gap-1">
                                <span className="text-[10px] text-slate-500">পিস দর:</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={item.purchasePrice || ''}
                                  onChange={(e) => {
                                    const nextPrice = parseFloat(e.target.value) || 0;
                                    const updates = updatePurchaseRowUnitAndFormula(item, currentPackUnit, {
                                      purchasePrice: nextPrice,
                                    });
                                    onUpdatePurchaseCartItemDetails(item.medicineId, updates);
                                  }}
                                  className="w-18 text-center py-0.5 px-1 text-[10px] font-mono border border-slate-200 rounded bg-white text-slate-700"
                                />
                              </div>
                            </div>
                          </td>

                          {/* 5. Line Total (৳) - Two-way synced with Box & Piece Price */}
                          <td className="py-3 px-3 align-top border-r border-slate-200 text-right">
                            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5 text-right">
                              লাইন মোট (৳):
                            </label>
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs font-bold text-slate-500">৳</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={lineTotal > 0 ? lineTotal : ''}
                                onChange={(e) => {
                                  const nextLineTotal = Math.max(0, parseFloat(e.target.value) || 0);
                                  const count = Math.max(1, item.packCount || 1);
                                  const uPack = Math.max(1, item.unitsPerPack || 1);
                                  if (currentPackUnit !== 'piece') {
                                    const nextPackRate = Number((nextLineTotal / count).toFixed(2));
                                    const nextPurPrice = Number((nextLineTotal / (count * uPack)).toFixed(4));
                                    onUpdatePurchaseCartItemDetails(item.medicineId, {
                                      packRate: nextPackRate,
                                      purchasePrice: Math.max(0.01, nextPurPrice),
                                    });
                                  } else {
                                    const nextPurPrice = Number((nextLineTotal / Math.max(1, item.qty)).toFixed(4));
                                    onUpdatePurchaseCartItemDetails(item.medicineId, {
                                      purchasePrice: Math.max(0.01, nextPurPrice),
                                      packRate: nextLineTotal,
                                    });
                                  }
                                }}
                                placeholder="লাইন মোট"
                                className="w-24 text-right py-1 px-1.5 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded bg-white text-indigo-950 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-1">
                              {isPackRow ? (
                                <span>
                                  {item.packCount}{' '}
                                  {item.packUnit === 'strip'
                                    ? 'পাতা'
                                    : item.packUnit === 'box'
                                    ? 'বক্স'
                                    : 'কার্টুন'}{' '}
                                  ({item.qty} পিস)
                                </span>
                              ) : (
                                <span>{item.qty} পিস × ৳{formatCleanMoney(item.purchasePrice)}</span>
                              )}
                            </div>
                          </td>

                          {/* 6. Remove Column */}
                          <td className="py-3 px-2 align-top text-center">
                            <button
                              type="button"
                              onClick={() => onRemoveFromPurchaseCart(item.medicineId)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="লাইন মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action inside Table Box */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAddNewPurchaseBox}
                  className="px-3.5 py-1.5 text-xs font-bold text-indigo-950 bg-white hover:bg-indigo-50 border border-indigo-300 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-700" />
                  <span>+ পরবর্তী বক্স / নতুন লাইন খুলুন (Auto / Add Box)</span>
                </button>

                <div className="text-xs font-mono text-slate-600">
                  মোট <strong>{purchaseCart.filter((i) => i.brandName.trim()).length}</strong>টি ওষুধ · মোট পরিমাণ: <strong>{totalPurchaseUnits} পিস</strong>
                </div>
              </div>
            </div>

            {/* Bottom Financial Totals & Invoice Checkout Form */}
            <form
              onSubmit={handlePurchaseInvoiceSubmit}
              className="bg-white p-4 rounded-lg border border-indigo-200 shadow-xs space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/40 p-3 rounded-md border border-indigo-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600">মোট ক্রয় বিল (SubTotal ৳)</label>
                  <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
                    ৳{purchaseSubTotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">কমিশন / ডিসকাউন্ট (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={purDiscountStr}
                    onChange={(e) => setPurDiscountStr(e.target.value)}
                    placeholder="0"
                    className="w-full mt-1 px-2.5 py-1 text-xs font-mono tabular-nums border border-slate-300 rounded bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">নগদ পরিশোধ (Paid ৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={purGrandTotal.toFixed(0)}
                    value={purPaidStr}
                    onChange={(e) => setPurPaidStr(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1 text-xs font-mono tabular-nums border border-slate-300 rounded bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs space-x-3 font-mono tabular-nums">
                  <span className="text-slate-700 font-semibold">
                    নিট ক্রয় বিল:{' '}
                    <strong className="text-slate-950 text-sm">৳{purGrandTotal.toFixed(2)}</strong>
                  </span>
                  <span
                    className={purDueAmount > 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'}
                  >
                    কোম্পানি বাকি: ৳{purDueAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isEditingPurchase && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onCancelEditInvoice();
                          resetPurchaseFormToFresh();
                        }}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        এডিট বাতিল
                      </button>
                      <button
                        type="button"
                        disabled={purchaseCart.length === 0 || submittingPurchase}
                        onClick={() => submitPurchaseWithMode(true)}
                        className="px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        নতুন ইনভয়েস হিসেবে তৈরি করুন
                      </button>
                    </>
                  )}
                  {(() => {
                    const stockedPurUnits = purchaseCart
                      .filter((i) => i.updateStock !== false && i.brandName.trim())
                      .reduce((acc, i) => acc + i.qty, 0);
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={purchaseCart.length === 0 || submittingPurchase}
                          onClick={async () => {
                            if (!supplierCompany.trim()) {
                              setSupplierCompany('সরাসরি সাপ্লায়ার ক্রয়');
                            }
                            setPurPaidStr(purGrandTotal.toString());
                            await submitPurchaseWithMode(false);
                          }}
                          className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95"
                          title="কোনো জটিল চালান বা কাগজপত্র ছাড়া ১-ক্লিকে সরাসরি স্টকে যুক্ত করুন"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ সরাসরি স্টকে জমা করুন (চালান ছাড়া)</span>
                        </button>
                        <button
                          type="submit"
                          disabled={purchaseCart.length === 0 || submittingPurchase}
                          className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-800 hover:bg-indigo-900 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 flex items-center gap-2"
                        >
                        <PackageCheck className="w-4 h-4" />
                        <span>
                          {submittingPurchase
                            ? 'ক্রয় ইনভয়েস সংরক্ষণ হচ্ছে...'
                            : isEditingPurchase
                            ? `এডিটকৃত ক্রয় ইনভয়েস সংরক্ষণ করুন (${purInvoiceNo}) ✓`
                            : stockedPurUnits > 0
                            ? `ক্রয় ইনভয়েস সম্পন্ন করুন ও স্টক বাড়ান (+${stockedPurUnits} পিস) ✓`
                            : `ক্রয় ইনভয়েস সম্পন্ন করুন (শুধু ইনভয়েস, স্টক অপরিবর্তিত) ✓`}
                        </span>
                      </button>
                    </div>
                  );
                  })()}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Daily Purchase & Sales Accounting Dashboard */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden no-print">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              দৈনিক ক্রয় ও বিক্রয় ইনভয়েস তালিকা (বিক্রয়ে স্টক হ্রাস ও ক্রয়ে স্টক বৃদ্ধি)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              সকল বিক্রয় ইনভয়েস এবং ক্রয় ইনভয়েস আলাদাভাবে দেখুন, প্রিন্ট করুন, এডিট বা ডিলিট করুন (ডিলিট করলে স্টক স্বয়ংক্রিয়ভাবে পূর্বাবস্থায় ফিরবে)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setShowAllDates(false);
              }}
              aria-label="তারিখ নির্বাচন"
              className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-md bg-slate-50"
            />
            <button
              type="button"
              onClick={() => setShowAllDates(!showAllDates)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showAllDates
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {showAllDates ? 'সকল তারিখ দেখানো হচ্ছে' : 'সকল তারিখের হিসাব'}
            </button>

            <select
              value={staffRoleFilter}
              onChange={(e) => setStaffRoleFilter(e.target.value as 'ALL' | 'owner' | 'staff')}
              aria-label="মালিক বা স্টাফ ফিল্টার"
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
            >
              <option value="ALL">Owner ও সকল স্টাফ</option>
              <option value="owner">শুধুমাত্র Owner-এর এন্ট্রি</option>
              <option value="staff">শুধুমাত্র স্টাফদের এন্ট্রি</option>
            </select>
          </div>
        </div>

        {/* 5-Column Daily Financial Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/70 border-b border-slate-200">
          <div className="p-4">
            <div className="text-xs text-slate-500">মোট বিক্রয় ইনভয়েস (Sales Bill)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-teal-800 mt-1">
              ৳{dailyMetrics.totalSalesBill.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              Owner: ৳{dailyMetrics.ownerSales} · স্টাফ: ৳{dailyMetrics.staffSales}
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500">নগদ বিক্রয় ও বকেয়া আদায়</div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              ৳{dailyMetrics.totalCashIn.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              নগদ মেমো: ৳{dailyMetrics.salesCashCollected} · বকেয়া আদায়: ৳{dailyMetrics.dueCollectedLater}
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500">কাস্টমার বাকি (Due Given)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1">
              ৳{dailyMetrics.salesDueGiven.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">কাস্টমার লেজারে স্বয়ংক্রিয় যুক্ত</div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500">প্রডাক্ট ক্রয় ইনভয়েস (Purchase Bill)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-indigo-900 mt-1">
              ৳{dailyMetrics.totalPurchaseBill.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">কোম্পানি ক্রয় ও স্টক-ইন খরচ</div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500">নেট ক্যাশ ব্যালেন্স (Cash Flow)</div>
            <div
              className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                dailyMetrics.netCashDrawer >= 0 ? 'text-teal-700' : 'text-red-600'
              }`}
            >
              ৳{dailyMetrics.netCashDrawer.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">মোট নগদ জমা বিয়োগ ক্রয় খরচ</div>
          </div>
        </div>

        {/* Transaction Type Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md">
            {[
              { id: 'ALL', label: 'সকল ইনভয়েস ও লেনদেন' },
              { id: 'sale', label: 'বিক্রয় ইনভয়েস (স্টক কমেছে)' },
              { id: 'purchase', label: 'ক্রয় ইনভয়েস (স্টক বেড়েছে)' },
              { id: 'due_payment', label: 'বকেয়া আদায় (Due Collection)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTxTypeFilter(tab.id as typeof txTypeFilter)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txTypeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            মোট {filteredTransactions.length}টি ইনভয়েস এন্ট্রি
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-4">ইনভয়েস নং ও তারিখ</th>
                <th className="py-2.5 px-3">ইনভয়েসের ধরন ও স্টক প্রভাব</th>
                <th className="py-2.5 px-3">কাস্টমার / কোম্পানি</th>
                <th className="py-2.5 px-3">ওষুধের বিবরণ</th>
                <th className="py-2.5 px-3">এন্ট্রি অপারেটর</th>
                <th className="py-2.5 px-3 text-right">মোট বিল (৳)</th>
                <th className="py-2.5 px-3 text-right">নগদ জমা (৳)</th>
                <th className="py-2.5 px-3 text-right">বাকি (৳)</th>
                <th className="py-2.5 px-4 text-right">ইনভয়েস / এডিট / ডিলিট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-500">
                    নির্বাচিত ফিল্টারে কোনো ক্রয় বা বিক্রয় ইনভয়েস পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCurrentlyEditingThisRow = editingInvoiceTx?.id === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        isCurrentlyEditingThisRow
                          ? 'bg-amber-50/80 hover:bg-amber-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono tabular-nums text-xs">
                        <div className="font-semibold text-slate-900">{tx.invoiceNo}</div>
                        <div className="text-slate-500">{tx.dateStr}</div>
                        {isCurrentlyEditingThisRow && (
                          <div className="text-[11px] font-sans font-bold text-amber-800 mt-0.5">
                            উপরে প্যানেলে এডিট হচ্ছে...
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        {tx.txType === 'sale' ? (
                          <div>
                            <span className="font-bold text-teal-800">বিক্রয় ইনভয়েস</span>
                            <div className="text-[11px] font-mono text-amber-700">
                              স্টক হ্রাস (-{tx.totalCount} পিস)
                            </div>
                          </div>
                        ) : tx.txType === 'purchase' ? (
                          <div>
                            <span className="font-bold text-indigo-800">ক্রয় ইনভয়েস</span>
                            <div className="text-[11px] font-mono text-emerald-700">
                              স্টক বৃদ্ধি (+{tx.totalCount} পিস)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-emerald-700">বকেয়া আদায়</span>
                            <div className="text-[11px] text-slate-400">লেজার জমা</div>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                          {tx.paymentMethod}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 text-xs">{tx.partyName}</div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {tx.partyPhone}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-800 font-mono">
                        <div className="space-y-0.5">
                          {formatTransactionItemsList(tx.itemsSummary).map((line, idx) => (
                            <div key={idx} className="whitespace-nowrap">
                              {line}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        <div className="font-bold text-slate-900">
                          {tx.staffRole === 'owner' ? 'Owner' : tx.staffName}
                        </div>
                        <div className="text-slate-500">{tx.counterName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        ৳{tx.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                        ৳{tx.paidAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {tx.dueAmount > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-red-600 font-semibold">
                              ৳{tx.dueAmount.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => openPaymentModal(tx)}
                              className="mt-1 px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-2xs cursor-pointer whitespace-nowrap flex items-center gap-1"
                              title="বকেয়া পরিশোধ করুন (Full বা Partial Payment)"
                            >
                              <CreditCard className="w-2.5 h-2.5" />
                              <span>Payment Now</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">৳0.00</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setInvoicePrintWithPrice(true);
                              setPreviewInvoice(tx);
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                              tx.txType === 'purchase'
                                ? 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                                : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200'
                            }`}
                            title="ইনভয়েস দেখুন ও প্রিন্ট করুন"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {tx.txType === 'purchase'
                              ? 'ক্রয় ইনভয়েস'
                              : tx.txType === 'sale'
                              ? 'বিক্রয় ইনভয়েস'
                              : 'রশিদ'}
                          </button>
                          {tx.txType === 'sale' && (
                            <button
                              type="button"
                              onClick={() => {
                                setInvoicePrintWithPrice(false);
                                setPreviewInvoice(tx);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                              title="দাম ছাড়া চালান / ডেলিভারি মেমো দেখুন ও প্রিন্ট করুন"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              দাম ছাড়া
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEditInvoiceAction(tx)}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            title="নতুন ইনভয়েস তৈরির মতো সম্পূর্ণ এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            এডিট
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="এন্ট্রি ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                লেনদেন / ইনভয়েস এন্ট্রি এডিট করুন ({editingTx.invoiceNo})
              </h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTx} className="space-y-3.5 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDateStr}
                    onChange={(e) => setEditDateStr(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) =>
                      setEditPaymentMethod(e.target.value as Transaction['paymentMethod'])
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="card">কার্ড (Card)</option>
                    <option value="due">বাকি (Due)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    কাস্টমার / কোম্পানির নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPartyName}
                    onChange={(e) => setEditPartyName(e.target.value)}
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
                    value={editPartyPhone}
                    onChange={(e) => setEditPartyPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ওষুধ ও আইটেম বিবরণ *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editItemsSummary}
                  onChange={(e) => setEditItemsSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মোট বিল (SubTotal ৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editSubTotal}
                    onChange={(e) => setEditSubTotal(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ডিসকাউন্ট (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    নগদ জমা (Paid ৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEditTx}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {savingEditTx ? 'আপডেট হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
         A4 SIZE PHARMACY & CLINIC SALES INVOICE (210mm × 297mm)
         - True A4 proportions on screen and standard A4 portrait in print dialog
         - Complete Bangladesh DGDA & Dental clinic header, doctor qualifications & chambers
         - Patient & customer info, vitals/clinical findings, items table, dosage rules
         - Bengali amount in words ("কথায়: ... টাকা মাত্র"), return policy
         - Customer, salesman, doctor signatures with official circular stamp
         ============================================================================ */}
      {previewInvoice && (
        <div
          id="printable-invoice-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
        >
          <div
            id="printable-invoice-receipt"
            className={`bg-white border border-slate-300 rounded-lg w-full max-w-[210mm] shadow-2xl my-2 text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-none print:w-full print:max-h-[287mm] flex flex-col justify-between overflow-hidden ${
              parsedPreviewItems.length >= 14
                ? 'p-3 sm:p-4 text-[9.5px]'
                : parsedPreviewItems.length >= 9
                ? 'p-3.5 sm:p-5 text-[10px]'
                : parsedPreviewItems.length >= 5
                ? 'p-4 sm:p-6 text-[11px]'
                : 'p-6 sm:p-8 text-xs'
            }`}
          >
            {(() => {
              const previewItemCount = parsedPreviewItems.length;
              const isMicro = previewItemCount >= 14;
              const isUltraCompact = previewItemCount >= 9 && previewItemCount < 14;
              const isCompact = previewItemCount >= 5 && previewItemCount < 9;
              const isDense = isMicro || isUltraCompact || isCompact;

              const currentSeal = activeInvoiceSeal || previewInvoice.selectedSeal || 'iqbal_pharmacy';
              const sealMap = {
                iqbal_pharmacy: {
                  title: 'ইকবাল ফার্মেসী',
                  sub: 'ডেন্টিস্ট:- ইকবাল মাহমুদ (ডি.এম.টি.ডি (ডেন্টাল), এল.এম.এ.এফ (ঢাকা), আর.এম.পি (ঢাকা), ফার্মাসিস্ট, ওরাল এন্ড ডেন্টাল টেকনোলজিষ্ট)',
                  address: 'ঠিকানা:- নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।',
                  mobile: 'মোবাইল:- 01812-358839, 01315645076',
                  location: 'নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর',
                },
                dental_care_1: {
                  title: 'ইকবাল ডেন্টাল কেয়ার-১',
                  sub: 'ডেন্টিস্ট:- ইকবাল মাহমুদ (ডি.এম.টি.ডি (ডেন্টাল), এল.এম.এ.এফ (ঢাকা), আর.এম.পি (ঢাকা), ফার্মাসিস্ট, ওরাল এন্ড ডেন্টাল টেকনোলজিষ্ট)',
                  address: 'ঠিকানা:- নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।',
                  mobile: 'মোবাইল:- 01812-358839, 01315645076',
                  location: 'নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর',
                },
                dental_care_2: {
                  title: 'ইকবাল ডেন্টাল কেয়ার-২ (ওদারহাট ডেন্টাল কেয়ার)',
                  sub: 'ডেন্টিস্ট:- ইকবাল মাহমুদ (ডি.এম.টি.ডি (ডেন্টাল), এল.এম.এ.এফ (ঢাকা), আর.এম.পি (ঢাকা), ফার্মাসিস্ট, ওরাল এন্ড ডেন্টাল টেকনোলজিষ্ট)',
                  address: 'ঠিকানা:- উদয় সাধুরহাট,পশ্চিম বাজার, পানা মিয়া স্কুল গেইট (ইউনিয়ন পরিষদ রোড), সদর,নোয়াখালী।',
                  mobile: 'মোবাইল:- 01812-358839, 01315645076',
                  location: 'উদয় সাধুরহাট,পশ্চিম বাজার, পানা মিয়া স্কুল গেইট (ইউনিয়ন পরিষদ রোড), সদর,নোয়াখালী',
                },
              };
              const sealConfig = sealMap[currentSeal] || sealMap.iqbal_pharmacy;
              const sealDimensions = isMicro ? 'w-18 h-18' : isUltraCompact ? 'w-20 h-20' : isCompact ? 'w-22 h-22' : 'w-26 h-26';

              return (
                <div>
                  {/* Top Control Toolbar (no-print) */}
                  <div className="mb-3 p-2.5 bg-slate-100 border border-slate-300 rounded-lg flex flex-wrap items-center justify-between gap-2 no-print shadow-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-800 text-white font-bold text-xs shadow-2xs">
                        <FileText className="w-3.5 h-3.5" />
                        <span>A4 পেপার সাইজ (এক পেজে সম্পূর্ণ ইনভয়েস)</span>
                      </span>

                      {previewInvoice.txType === 'sale' && (
                        <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setInvoicePrintWithPrice(true)}
                            className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                              invoicePrintWithPrice
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            ✓ দাম সহ মেমো
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoicePrintWithPrice(false)}
                            className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                              !invoicePrintWithPrice
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            ✓ দাম ছাড়া মেমো
                          </button>
                        </div>
                      )}
                    </div>

                    {previewInvoice.txType === 'sale' && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-bold text-slate-700">সিল / শাখা:</span>
                        <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setActiveInvoiceSeal('iqbal_pharmacy')}
                            className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                              activeInvoiceSeal === 'iqbal_pharmacy'
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            🏢 ১. ইকবাল ফার্মেসী
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInvoiceSeal('dental_care_1')}
                            className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                              activeInvoiceSeal === 'dental_care_1'
                                ? 'bg-blue-800 text-white shadow-xs'
                                : 'text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            🦷 ২. ইকবাল ডেন্টাল কেয়ার-১
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInvoiceSeal('dental_care_2')}
                            className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                              activeInvoiceSeal === 'dental_care_2'
                                ? 'bg-indigo-800 text-white shadow-xs'
                                : 'text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            🦷 ৩. ইকবাল ডেন্টাল কেয়ার-২
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-1 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>A4 প্রিন্ট করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewInvoice(null)}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-md cursor-pointer"
                      >
                        বন্ধ
                      </button>
                    </div>
                  </div>

                  {/* Header Row: Doctor Qualifications (Left) & Chamber Box (Right) */}
                  <div className={`border-b-2 border-slate-900 ${isDense ? 'pb-2 mb-2' : 'pb-3 mb-3'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-3 bg-white">
                      {/* Left Doctor Info */}
                      <div className="text-left space-y-0.5 sm:max-w-[48%]">
                        <div>
                          <h3 className={`font-black text-rose-900 tracking-tight ${isDense ? 'text-base sm:text-lg' : 'text-xl'}`}>
                            ডেন্টিস্ট:- ইকবাল মাহমুদ
                          </h3>
                        </div>
                        <div className={`font-semibold text-slate-800 leading-snug space-y-0.5 ${isDense ? 'text-[9.5px]' : 'text-[11px]'}`}>
                          <div className={`font-bold text-teal-900 ${isDense ? 'text-[10px]' : 'text-[11.5px]'}`}>
                            ডি.এম.টি.ডি (ডেন্টাল) · এল.এম.এ.এফ (ঢাকা) · আর.এম.পি (ঢাকা)
                          </div>
                          <div className="text-slate-700 font-medium">
                            ফার্মাসিস্ট · ওরাল এন্ড ডেন্টাল টেকনোলজিষ্ট
                          </div>
                          <div className={`font-mono font-bold text-slate-900 ${isDense ? 'text-[10px] pt-0.5' : 'text-xs pt-0.5'}`}>
                            মোবাইল: 01812-358839, 01315645076
                          </div>
                          <div className={`font-bold text-teal-800 ${isDense ? 'text-[10px]' : 'text-[11px]'}`}>
                            শাখা: {sealConfig.title}
                          </div>
                        </div>
                      </div>

                      {/* Right Chambers Box (Dark Teal Box - clean without visiting times) */}
                      <div className={`bg-[#2a6d70] text-white rounded-md flex-1 space-y-1 shadow-xs ${isDense ? 'p-2 text-[10px]' : 'p-2.5 sm:p-3 text-xs'}`}>
                        <div className="text-center font-bold text-xs text-amber-200 border-b border-teal-600/60 pb-0.5">
                          শাখা ও চেম্বার:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] leading-tight">
                          {/* Chamber 2 */}
                          <div className="border-b sm:border-b-0 sm:border-r border-teal-500/50 pb-1 sm:pb-0 sm:pr-2">
                            <div className="font-bold text-emerald-100">ইকবাল ডেন্টাল কেয়ার-২</div>
                            <div className="text-[9.5px] text-teal-100">(ওদারহাট ডেন্টাল কেয়ার)</div>
                            <div className="mt-0.5 text-teal-100 text-[9.5px] leading-snug">
                              উদয় সাধুরহাট,পশ্চিম বাজার, পানা মিয়া স্কুল গেইট (ইউনিয়ন পরিষদ রোড), সদর,নোয়াখালী।
                            </div>
                          </div>

                          {/* Chamber 1 */}
                          <div className="sm:pl-1">
                            <div className="font-bold text-emerald-100">ইকবাল ডেন্টাল কেয়ার-১</div>
                            <div className="mt-0.5 text-teal-100 text-[9.5px] leading-snug">
                              নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।
                            </div>
                            <div className="mt-0.5 text-[9.5px] text-teal-200 border-t border-teal-600/50 pt-0.5">
                              ফার্মেসী শাখা: ইকবাল ফার্মেসী, নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient & Customer & Invoice Meta Details (4-Card Grid) */}
                  <div className={`bg-pink-50/70 border border-pink-200 rounded-lg ${isDense ? 'p-1.5 mb-1.5' : 'p-2.5 mb-2.5'}`}>
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${isDense ? 'text-[10px]' : 'text-xs'}`}>
                      <div className="space-y-0.5">
                        <span className="text-slate-500 text-[9.5px] block">
                          Name (রোগী / ক্রেতার নাম):
                        </span>
                        <span className="font-bold text-slate-900 block truncate text-xs sm:text-[13px]">
                          {previewInvoice.partyName || 'সাধারণ ক্রেতা (Walk-in)'}
                        </span>
                        <span className="text-slate-500 text-[9.5px] block font-mono">
                          ফোন: {previewInvoice.partyPhone || 'N/A'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 text-[9.5px] block">
                          Age & Sex (বয়স ও লিঙ্গ):
                        </span>
                        <span className="font-bold text-slate-900 block text-xs sm:text-[13px]">
                          {previewInvoice.patientAge ? `${previewInvoice.patientAge} বছর` : '—'} ·{' '}
                          {previewInvoice.patientSex === 'Female'
                            ? 'মহিলা'
                            : previewInvoice.patientSex === 'Other'
                            ? 'Other'
                            : 'পুরুষ'}
                        </span>
                        <span className="text-slate-500 text-[9.5px] block">
                          ঠিকানা: {previewInvoice.selectedSeal === 'dental_care_2' ? 'নোয়াখালী সদর' : 'চন্দ্রগঞ্জ, লক্ষ্মীপুর'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 text-[9.5px] block">
                          Invoice No (চালান / মেমো নং):
                        </span>
                        <span className="font-mono font-bold text-slate-900 block text-xs sm:text-[13px]">
                          {previewInvoice.invoiceNo}
                        </span>
                        <span className="text-slate-500 text-[9.5px] block font-mono">
                          তারিখ: {previewInvoice.dateStr || getTodayDateStr()}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 text-[9.5px] block">
                          {previewInvoice.txType === 'sale' && !invoicePrintWithPrice
                            ? 'Served By & Memo Type:'
                            : 'Served By & Payment:'}
                        </span>
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          অপারেটর: {previewInvoice.staffRole === 'owner' ? 'Owner' : previewInvoice.staffName || 'Staff'}
                        </span>
                        {previewInvoice.txType === 'sale' && !invoicePrintWithPrice ? (
                          <span className="font-bold text-amber-800 block text-[11px]">
                            ডেলিভারি চালান (দাম ছাড়া)
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-emerald-800 block text-[11px]">
                            {previewInvoice.paymentMethod.toUpperCase()} ·{' '}
                            <span className={previewInvoice.dueAmount > 0 ? 'text-red-600' : 'text-emerald-700'}>
                              {previewInvoice.dueAmount > 0 ? 'বকেয়া (DUE)' : 'পরিশোধিত (PAID)'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Body: Clinical Findings & Vitals on Left, Medicines Table on Right */}
                  <div className="flex flex-row gap-2.5 items-start mb-2">
                    {/* Left Column: Clinical Findings & Vitals */}
                    {previewInvoice.txType === 'sale' && (
                      <div className={`w-[27%] shrink-0 border border-teal-300 rounded-md bg-teal-50/50 p-2 ${isDense ? 'text-[9px]' : 'text-[10px]'}`}>
                        <div className="text-[10px] sm:text-[11px] font-bold text-teal-950 pb-1 border-b border-teal-300 mb-1.5 leading-snug">
                          <div className="flex items-center gap-1 text-teal-900">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>ক্লিনিক্যাল পর্যবেক্ষণ</span>
                          </div>
                          <div className="text-[8.5px] text-teal-700 font-normal">
                            ফার্মেসী ক্লিনিক্যাল পর্যবেক্ষণ ও ভাইটালস:
                          </div>
                          <div className="text-[7.5px] text-teal-800 font-normal mt-0.5">
                            রক্তচাপ, সুগার, তাপমাত্রা ও পরামর্শ
                          </div>
                        </div>

                        {currentSeal === 'iqbal_pharmacy' ? (
                          <div className="space-y-1">
                            {[
                              'রক্তচাপ (BP)',
                              'ডায়াবেটিস (RBS)',
                              'তাপমাত্রা (Temp)',
                              'ওজন (Weight)',
                              'নাড়ির গতি (Pulse)',
                              'প্রধান লক্ষণ (Symptoms)',
                              'প্রাথমিক পরামর্শ (Advice)',
                              'পরীক্ষা-নিরীক্ষা (Inv.)',
                            ].map((key) => {
                              const val = previewInvoice.dentalClinical?.[key];
                              const hasVal = Boolean(val && val.trim().length > 0);
                              return (
                                <div key={key} className="border-b border-teal-100/70 pb-0.5 leading-tight">
                                  <div className="font-bold text-slate-800 flex items-center justify-between text-[8.5px] sm:text-[9px]">
                                    <span>{key}:</span>
                                    {hasVal && <span className="text-teal-700 text-[8px] font-bold">✓</span>}
                                  </div>
                                  <div className="text-[8.5px] text-teal-950 font-mono mt-0.5 break-words">
                                    {hasVal ? val : '...................'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-bold text-amber-900 mb-1">
                              🦷 ডেন্টাল ক্লিনিক্যাল পর্যবেক্ষণ:
                            </div>
                            {[
                              'Pereocoronaties',
                              'Pulpitis',
                              'Calculus',
                              'Gingivitis',
                              'Caries',
                              'Scaling',
                              'Filling',
                              'RCT',
                              'Cap',
                              'Bridge',
                              'EXT',
                              'Others',
                              'Inv.',
                            ].map((key) => {
                              const val = previewInvoice.dentalClinical?.[key];
                              const hasVal = Boolean(val && val.trim().length > 0);
                              return (
                                <div key={key} className="border-b border-amber-100 pb-0.5 leading-tight">
                                  <div className="font-bold text-slate-800 flex items-center justify-between text-[8px] sm:text-[8.5px]">
                                    <span>{key}:</span>
                                    {hasVal && <span className="text-emerald-700 text-[7.5px] font-bold">✓</span>}
                                  </div>
                                  <div className="text-[8px] text-amber-950 font-mono break-words">
                                    {hasVal ? val : '...................'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Right Column: Items Table (Full Width A4 Table with Clean Borders) */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 mb-1">
                        <span>
                          {previewInvoice.txType === 'purchase'
                            ? 'ক্রয়কৃত ওষুধের বিবরণ ও প্যাক হিসাব:'
                            : previewInvoice.txType === 'sale' && !invoicePrintWithPrice
                            ? 'বিতরণকৃত ওষুধের তালিকা (ডেলিভারি চালান):'
                            : 'বিক্রয়কৃত ওষুধের তালিকা ও হিসাব:'}
                        </span>
                      </div>

                      {parsedPreviewItems.length > 0 ? (
                        <div className="border border-slate-300 rounded overflow-hidden">
                          <table className={`w-full text-left border-collapse font-mono ${
                            isMicro ? 'text-[9.5px] leading-tight' : isUltraCompact ? 'text-[10px] leading-tight' : isCompact ? 'text-[11px]' : 'text-xs'
                          }`}>
                            <thead
                              className={
                                previewInvoice.txType === 'purchase'
                                  ? 'bg-indigo-100/70 border-b-2 border-slate-300 text-indigo-950 font-sans'
                                  : previewInvoice.txType === 'sale' && !invoicePrintWithPrice
                                  ? 'bg-amber-100/70 border-b-2 border-slate-300 text-amber-950 font-sans'
                                  : 'bg-teal-100/70 border-b-2 border-slate-300 text-teal-950 font-sans'
                              }
                            >
                              <tr>
                                <th className={`text-center w-8 ${isDense ? 'py-1 px-1' : 'py-1.5 px-2'}`}>ক্র.নং</th>
                                <th className={` ${isDense ? 'py-1 px-1.5' : 'py-1.5 px-2.5'}`}>ওষুধের বিবরণ ও নির্দেশনা</th>
                                <th className={`text-center w-22 sm:w-24 ${isDense ? 'py-1 px-1' : 'py-1.5 px-1.5'}`}>ডোজ ও নিয়ম</th>
                                {(previewInvoice.txType !== 'sale' || invoicePrintWithPrice) && (
                                  <th className={`text-center w-18 sm:w-20 ${isDense ? 'py-1 px-1' : 'py-1.5 px-1.5'}`}>
                                    {previewInvoice.txType === 'purchase' ? 'ক্রয় দর (৳)' : 'একক দর (৳)'}
                                  </th>
                                )}
                                <th className={`text-center w-14 sm:w-16 ${isDense ? 'py-1 px-1' : 'py-1.5 px-1.5'}`}>পরিমাণ</th>
                                {(previewInvoice.txType !== 'sale' || invoicePrintWithPrice) && (
                                  <th className={`text-right w-20 sm:w-24 ${isDense ? 'py-1 px-1.5' : 'py-1.5 px-2'}`}>
                                    {previewInvoice.txType === 'purchase' ? 'মোট ক্রয় (৳)' : 'মোট টাকা (৳)'}
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {parsedPreviewItems.map((pItem, idx) => (
                                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                  <td className={`text-center font-bold text-slate-600 ${isDense ? 'py-0.5 px-1' : 'py-1.5 px-1.5'}`}>
                                    {idx + 1}
                                  </td>
                                  <td className={`text-slate-900 ${isDense ? 'py-0.5 px-1.5' : 'py-1.5 px-2.5'}`}>
                                    {previewInvoice.txType === 'purchase' ? (
                                      <div>
                                        <div className={`font-bold text-slate-900 font-sans ${isDense ? 'text-[10px]' : 'text-xs'}`}>
                                          {pItem.formPrefix ? `${pItem.formPrefix.toUpperCase()}. ` : ''}
                                          {pItem.cleanName || pItem.brandAndStrength}
                                        </div>
                                        {pItem.packDetail && (
                                          <div className="text-[9px] font-mono text-indigo-800 font-semibold mt-0.5">
                                            প্যাক হিসাব: {pItem.packDetail}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <div className={`font-bold text-slate-900 font-sans ${isDense ? 'text-[10px]' : 'text-xs sm:text-[13px]'}`}>
                                          {pItem.formPrefix ? `${pItem.formPrefix.charAt(0).toUpperCase() + pItem.formPrefix.slice(1)}. ` : ''}
                                          {pItem.cleanName || pItem.brandAndStrength}
                                        </div>
                                        {pItem.tailText && !pItem.dosageInstruction && (
                                          <div className="text-[9px] text-slate-500 font-sans">
                                            {pItem.tailText}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className={`text-center ${isDense ? 'py-0.5 px-1' : 'py-1.5 px-1'}`}>
                                    {pItem.dosageInstruction ? (
                                      <span className={`inline-block font-mono font-bold text-red-600 bg-rose-50 border border-rose-200 rounded ${
                                        isDense ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
                                      }`}>
                                        {pItem.dosageInstruction}
                                      </span>
                                    ) : pItem.rawLine.includes('{') ? (
                                      <span className={`inline-block font-mono font-bold text-red-600 bg-rose-50 border border-rose-200 rounded ${
                                        isDense ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
                                      }`}>
                                        {pItem.rawLine.split('{')[1]?.replace('}', '')}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-sans text-[9.5px]">নিয়মিত</span>
                                    )}
                                  </td>
                                  {(previewInvoice.txType !== 'sale' || invoicePrintWithPrice) && (
                                    <td className={`text-center text-slate-700 ${isDense ? 'py-0.5 px-1' : 'py-1.5 px-1'}`}>
                                      ৳{formatCleanMoney(pItem.unitPrice)}
                                    </td>
                                  )}
                                  <td className={`text-center font-bold text-slate-900 ${isDense ? 'py-0.5 px-1' : 'py-1.5 px-1'}`}>
                                    {pItem.qty} পিস
                                  </td>
                                  {(previewInvoice.txType !== 'sale' || invoicePrintWithPrice) && (
                                    <td className={`text-right font-bold text-slate-900 ${isDense ? 'py-0.5 px-1.5' : 'py-1.5 px-2'}`}>
                                      ৳{formatCleanMoney(pItem.lineTotal)}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-300 text-xs font-mono text-slate-900 space-y-1 leading-relaxed">
                          {formatTransactionItemsList(previewInvoice.itemsSummary).map((line, idx) => (
                            <div key={idx}>{line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Totals & In-Words Section (Only shown when price is enabled; omitted for no-price memo) */}
                  {previewInvoice.txType === 'sale' && !invoicePrintWithPrice ? null : (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 pt-0.5">
                      {/* Left 7 Cols: Amount In Bengali Words + Return Terms */}
                      <div className="sm:col-span-7 space-y-1.5">
                        <div className={`bg-slate-50 border border-slate-300 rounded-md space-y-0.5 ${isDense ? 'p-1.5 text-[10px]' : 'p-2 text-xs'}`}>
                          <div className="font-bold text-slate-800">
                            কথায় (Amount in Words):
                          </div>
                          <div className={`text-teal-900 font-bold bg-white rounded border border-slate-200 ${isDense ? 'p-1 text-[11px]' : 'p-1.5 text-xs sm:text-[13px]'}`}>
                            কথায়: {numberToBanglaWords(previewInvoice.grandTotal)}
                          </div>
                        </div>

                        <div className={`bg-slate-50 border border-slate-200 rounded-md text-slate-600 space-y-0.5 ${isDense ? 'p-1.5 text-[9.5px]' : 'p-2 text-[10.5px]'}`}>
                          <div className="font-bold text-slate-800">
                            ওষুধ সংক্রান্ত বিশেষ দ্রষ্টব্য ও শর্তাবলী:
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                            <li>বিক্রিত ওষুধ অক্ষত ফয়েল/প্যাক থাকলে ক্যাশ মেমোসহ ৭ দিনের মধ্যে পরিবর্তনযোগ্য।</li>
                            <li>কাটা/ছেঁড়া পাতা বা ইনসুলিন ও ফ্রিজের ওষুধ ফেরত বা পরিবর্তনযোগ্য নয়।</li>
                            <li>সকল ওষুধ আলো ও তাপ থেকে দূরে ঠাণ্ডা ও শুষ্ক স্থানে রাখুন। শিশুদের নাগালের বাইরে রাখুন।</li>
                          </ul>
                        </div>

                        {/* পরবর্তী সাক্ষাতের সময় ব্যবস্থাপত্র সঙ্গে আনবেন Banner */}
                        <div className={`bg-[#2e7d32] text-white text-center font-bold rounded tracking-wide shadow-2xs ${isDense ? 'py-1 px-2 text-[10px]' : 'py-1.5 px-3 text-xs'}`}>
                          পরবর্তী সাক্ষাতের সময় ব্যবস্থাপত্র সঙ্গে আনবেন।
                        </div>
                      </div>

                      {/* Right 5 Cols: Financial Calculations Breakdown */}
                      <div className="sm:col-span-5">
                        <div className={`bg-slate-50 border border-slate-300 rounded-md font-mono tabular-nums ${isDense ? 'p-2 space-y-1 text-[11px]' : 'p-2.5 sm:p-3 space-y-1.5 text-xs'}`}>
                          <div className="flex justify-between text-slate-600">
                            <span>
                              {previewInvoice.txType === 'purchase'
                                ? 'মোট ক্রয় মূল্য (Sub-total):'
                                : 'মোট বিক্রয় মূল্য (Sub-total):'}
                            </span>
                            <span className="font-bold">৳{previewInvoice.subTotal.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between text-slate-600">
                            <span>ছাড় / ডিসকাউন্ট (Discount):</span>
                            <span className="font-bold text-red-600">-৳{previewInvoice.discount.toFixed(2)}</span>
                          </div>

                          <div className={`flex justify-between font-bold text-slate-900 pt-1 border-t-2 border-slate-300 ${isDense ? 'text-xs' : 'text-sm'}`}>
                            <span>সর্বমোট প্রদেয় বিল (Grand Total):</span>
                            <span className={`text-teal-900 ${isDense ? 'text-sm' : 'text-base'}`}>৳{previewInvoice.grandTotal.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between text-emerald-700 font-bold pt-0.5 border-t border-slate-200">
                            <span>
                              {previewInvoice.txType === 'purchase' ? 'পরিশোধিত মূল্য' : 'নগদ জমা / পরিশোধ'} (
                              {previewInvoice.paymentMethod.toUpperCase()}):
                            </span>
                            <span>৳{previewInvoice.paidAmount.toFixed(2)}</span>
                          </div>

                          {previewInvoice.dueAmount > 0 && (
                            <div className="flex justify-between text-red-600 font-bold items-center pt-0.5">
                              <span>
                                {previewInvoice.txType === 'purchase'
                                  ? 'কোম্পানি বাকি (Supplier Due):'
                                  : 'বকেয়া বিল (Customer Due):'}
                              </span>
                              <span className="text-sm">৳{previewInvoice.dueAmount.toFixed(2)}</span>
                            </div>
                          )}

                          {previewInvoice.dueAmount > 0 && (
                            <div className="pt-1.5 flex justify-end no-print">
                              <button
                                type="button"
                                onClick={() => openPaymentModal(previewInvoice)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Payment Now (বকেয়া পরিশোধ)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bottom Section: Official Seal & Doctor Signatures (Print-Friendly) */}
            <div className="print-avoid-break">
              {(() => {
                const currentSeal = activeInvoiceSeal || previewInvoice.selectedSeal || 'iqbal_pharmacy';
                const sealMap = {
                  iqbal_pharmacy: {
                    title: 'ইকবাল ফার্মেসী',
                    location: 'নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর',
                  },
                  dental_care_1: {
                    title: 'ইকবাল ডেন্টাল কেয়ার-১',
                    location: 'নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর',
                  },
                  dental_care_2: {
                    title: 'ইকবাল ডেন্টাল কেয়ার-২ (ওদারহাট ডেন্টাল কেয়ার)',
                    location: 'উদয় সাধুরহাট,পশ্চিম বাজার, পানা মিয়া স্কুল গেইট (ইউনিয়ন পরিষদ রোড), সদর,নোয়াখালী',
                  },
                };
                const sealConfig = sealMap[currentSeal] || sealMap.iqbal_pharmacy;
                const previewItemCount = parsedPreviewItems.length;
                const isMicro = previewItemCount >= 14;
                const isUltraCompact = previewItemCount >= 9 && previewItemCount < 14;
                const isCompact = previewItemCount >= 5 && previewItemCount < 9;
                const isDense = isMicro || isUltraCompact || isCompact;
                const sealDimensions = isMicro ? 'w-18 h-18' : isUltraCompact ? 'w-20 h-20' : isCompact ? 'w-22 h-22' : 'w-26 h-26';
                const showInvoicePrice = previewInvoice.txType !== 'sale' || invoicePrintWithPrice;

                return (
                  <div className={`border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-4 items-center gap-2 ${isDense ? 'pt-2 pb-1' : 'pt-3 pb-2'}`}>
                    {/* Customer Signature */}
                    <div className="text-center sm:text-left space-y-0.5">
                      <div className="w-24 sm:w-28 border-b border-slate-600 mx-auto sm:mx-0 mb-0.5" />
                      <div className={`font-bold text-slate-800 ${isDense ? 'text-[10px]' : 'text-[11px]'}`}>
                        {showInvoicePrice ? 'ক্রেতার স্বাক্ষর' : 'গ্রহীতার স্বাক্ষর'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {showInvoicePrice ? "Customer's Signature" : "Receiver's Signature"}
                      </div>
                    </div>

                    {/* QR Code for Verification (Invoice No, Amount & Customer Details) */}
                    <div className="flex justify-center py-0.5">
                      <InvoiceVerificationQrCode
                        invoice={previewInvoice}
                        isDense={isDense}
                        showPrice={showInvoicePrice}
                      />
                    </div>

                    {/* Salesman / Prepared By Signature */}
                    <div className="text-center space-y-0.5">
                      <div className="w-24 sm:w-28 border-b border-slate-600 mx-auto mb-0.5" />
                      <div className={`font-bold text-slate-800 ${isDense ? 'text-[10px]' : 'text-[11px]'}`}>
                        {showInvoicePrice ? 'বিক্রয়কারীর স্বাক্ষর' : 'বিতরণকারীর স্বাক্ষর'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {previewInvoice.staffRole === 'owner' ? 'Owner / Pharmacist' : previewInvoice.staffName || 'Staff'}
                      </div>
                    </div>

                    {/* Doctor Seal & Signature Block */}
                    <div className="flex flex-col items-center sm:items-end">
                      <div className="flex items-center gap-2.5">
                        {/* Circular Rubber Stamp */}
                        <div className={`${sealDimensions} rounded-full border-2 border-dashed border-blue-900 p-0.5 flex items-center justify-center relative select-none shadow-xs bg-blue-50/25`}>
                          <div className="w-full h-full rounded-full border border-solid border-blue-900 flex flex-col items-center justify-center text-center p-0.5 text-blue-950">
                            <div className={`font-black uppercase tracking-tight text-blue-950 leading-tight ${isDense ? 'text-[7px]' : 'text-[8px]'}`}>
                              ★ {sealConfig.title} ★
                            </div>
                            <div className="w-10 h-px bg-blue-800 my-0.2" />
                            <div className={`font-bold text-blue-950 ${isDense ? 'text-[6.5px]' : 'text-[7.5px]'}`}>
                              ডেন্টিস্ট:- ইকবাল মাহমুদ
                            </div>
                            <div className={`font-semibold text-blue-900 leading-tight ${isDense ? 'text-[5.5px]' : 'text-[6.5px]'}`}>
                              ডি.এম.টি.ডি · এল.এম.এ.এফ · আর.এম.পি
                            </div>
                            <div className={`font-extrabold text-blue-900 tracking-wider border-y border-blue-700 py-0.2 my-0.2 ${isDense ? 'text-[6px]' : 'text-[7px]'}`}>
                              ★ VERIFIED & APPROVED ★
                            </div>
                            <div className={`font-mono font-bold text-blue-950 ${isDense ? 'text-[5.5px]' : 'text-[6.5px]'}`}>
                              {previewInvoice.dateStr || getTodayDateStr()}
                            </div>
                            <div className={`text-blue-800 font-semibold leading-tight truncate max-w-[80px] ${isDense ? 'text-[5.5px]' : 'text-[6px]'}`}>
                              {sealConfig.location}
                            </div>
                          </div>
                        </div>

                        {/* Doctor's Signature Text */}
                        <div className="text-right space-y-0.5">
                          <div className="w-28 sm:w-32 border-b border-slate-900 ml-auto mb-0.5" />
                          <div className={`font-bold text-slate-900 ${isDense ? 'text-[11px]' : 'text-xs'}`}>
                            স্বাক্ষর ও অফিসিয়াল সিল
                          </div>
                          <div className={`font-semibold text-slate-800 ${isDense ? 'text-[10px]' : 'text-[11px]'}`}>
                            ডেন্টিস্ট:- ইকবাল মাহমুদ
                          </div>
                          <div className={`text-slate-600 ${isDense ? 'text-[8.5px]' : 'text-[9.5px]'}`}>
                            ডি.এম.টি.ডি (ডেন্টাল) · এল.এম.এ.এফ (ঢাকা) · আর.এম.পি (ঢাকা)
                          </div>
                          <div className={`text-teal-800 font-medium ${isDense ? 'text-[7.5px]' : 'text-[8.5px]'}`}>
                            ফার্মাসিস্ট · ওরাল এন্ড ডেন্টাল টেকনোলজিষ্ট
                          </div>
                          <div className={`text-slate-500 ${isDense ? 'text-[8px]' : 'text-[9px]'}`}>
                            {sealConfig.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Developer Credit Footer */}
              <div className="pt-1 border-t border-dashed border-slate-300 text-center space-y-0.2">
                <div className="text-[9.5px] font-semibold text-slate-600">
                  মোঃ আকবর হোসেন চৌধুরী
                </div>
                <div className="text-[9px] text-slate-500">
                  ডেভেলপার ইকবাল ফার্মেসী মেডিসিন এ্যাপস্ · সুস্থ থাকুন, সঠিক নিয়মে ওষুধ সেবন করুন
                </div>
              </div>
            </div>
              {/* Modal Bottom Buttons (no-print) */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200 no-print mt-2">
                {(previewInvoice.txType === 'sale' || previewInvoice.txType === 'purchase') && (
                  <button
                    type="button"
                    onClick={() => handleEditInvoiceAction(previewInvoice)}
                    className="px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    ইনভয়েস এডিট করুন
                  </button>
                )}
                {previewInvoice.txType === 'sale' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoicePrintWithPrice(true);
                        setTimeout(() => window.print(), 100);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      A4 দাম সহ প্রিন্ট করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoicePrintWithPrice(false);
                        setTimeout(() => window.print(), 100);
                      }}
                      className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      A4 দাম ছাড়া প্রিন্ট করুন
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {previewInvoice.txType === 'purchase'
                      ? 'A4 ক্রয় ইনভয়েস প্রিন্ট করুন'
                      : 'A4 ইনভয়েস প্রিন্ট করুন'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Payment Now Modal (Full / Partial Payment for any invoice with Due) */}
      {showPaymentModal && selectedPaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">
                  বকেয়া পরিশোধ (Payment Now)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentInvoice(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">ইনভয়েস নম্বর:</span>
                <span className="font-mono font-bold text-slate-900">{selectedPaymentInvoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পার্টি / ক্রেতা:</span>
                <span className="font-semibold text-slate-800">{selectedPaymentInvoice.partyName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মোট বিল:</span>
                <span className="font-mono text-slate-700">৳{selectedPaymentInvoice.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পূর্বে পরিশোধিত:</span>
                <span className="font-mono text-emerald-700">৳{selectedPaymentInvoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm">
                <span className="text-red-700">বর্তমান বকেয়া (Current Due):</span>
                <span className="font-mono text-red-600">৳{selectedPaymentInvoice.dueAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                পরিশোধের ধরণ নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFullPayment(true);
                    setPaymentAmountInput(selectedPaymentInvoice.dueAmount.toString());
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    isFullPayment
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[13px]">সম্পূর্ণ পরিশোধ (Full)</div>
                  <div className="font-mono text-emerald-700 mt-0.5">
                    ৳{selectedPaymentInvoice.dueAmount.toFixed(2)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFullPayment(false);
                    if (paymentAmountInput === selectedPaymentInvoice.dueAmount.toString()) {
                      setPaymentAmountInput('');
                    }
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    !isFullPayment
                      ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[13px]">আংশিক পরিশোধ (Partial)</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    ইচ্ছামতো পরিমাণ দিন
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                পরিশোধের পরিমাণ (৳):
              </label>
              <input
                type="number"
                min="1"
                max={selectedPaymentInvoice.dueAmount}
                step="any"
                value={isFullPayment ? selectedPaymentInvoice.dueAmount : paymentAmountInput}
                disabled={isFullPayment}
                onChange={(e) => setPaymentAmountInput(e.target.value)}
                placeholder="পরিশোধের পরিমাণ দিন"
                className="w-full px-3 py-2 text-base font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none disabled:bg-slate-100"
              />
              {!isFullPayment && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[100, 200, 500, 1000].map((preset) => {
                    if (preset > selectedPaymentInvoice.dueAmount) return null;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPaymentAmountInput(preset.toString())}
                        className="px-2 py-0.5 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
                      >
                        ৳{preset}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPaymentAmountInput(selectedPaymentInvoice.dueAmount.toString())}
                    className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 cursor-pointer"
                  >
                    বাকি সব (৳{selectedPaymentInvoice.dueAmount})
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                পরিশোধের মাধ্যম (Payment Method):
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {(['cash', 'bkash', 'nagad', 'card'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethodChoice(method)}
                    className={`py-1.5 px-2 rounded-md font-bold uppercase cursor-pointer border transition-colors ${
                      paymentMethodChoice === method
                        ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {method === 'cash'
                      ? 'নগদ'
                      : method === 'bkash'
                      ? 'bKash'
                      : method === 'nagad'
                      ? 'Nagad'
                      : 'কার্ড/ব্যাংক'}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Note */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                মন্তব্য / নোট (ঐচ্ছিক):
              </label>
              <input
                type="text"
                value={paymentNoteInput}
                onChange={(e) => setPaymentNoteInput(e.target.value)}
                placeholder="যেমন: কাস্টমার বকেয়া পরিশোধ করেছেন"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentInvoice(null);
                }}
                disabled={submittingPayment}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentNow}
                disabled={submittingPayment}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submittingPayment ? (
                  <span>পরিশোধ প্রসেস হচ্ছে...</span>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>পরিশোধ নিশ্চিত করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
