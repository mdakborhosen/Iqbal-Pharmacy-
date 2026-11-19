import React, { useMemo, useState } from 'react';
import {
  Activity,
  Camera,
  Clock,
  FileText,
  Heart,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Stethoscope,
  Thermometer,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { formatCleanMoney } from '../data/bdMedicines';
import { getCustomerDueSummary } from '../utils/dueReconciliation';
import { isDueEntryItem, orderCartItemsWithDueLast } from '../utils/whatsappShare';
import {
  CartItem,
  Customer,
  InvoiceSealType,
  MedicineCatalogItem,
  StaffMember,
  Transaction,
} from '../types';

export interface SaleStepWizardProps {
  saleStep: 1 | 2 | 3 | 4;
  setSaleStep: (step: 1 | 2 | 3 | 4) => void;
  saleWorkflowMode: 'step_by_step' | 'all_in_one';
  setSaleWorkflowMode: (mode: 'step_by_step' | 'all_in_one') => void;

  // Patient Info & Chamber
  walkInName: string;
  setWalkInName: (name: string) => void;
  walkInPhone: string;
  setWalkInPhone: (phone: string) => void;
  patientAge: string;
  setPatientAge: (age: string) => void;
  patientSex: string;
  setPatientSex: (sex: string) => void;
  selectedSeal: InvoiceSealType;
  setSelectedSeal: (seal: InvoiceSealType) => void;

  // Clinical findings
  pharmacyFindings: Record<string, string>;
  setPharmacyFindings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  dentalFindings: Record<string, string>;
  setDentalFindings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showClinicalPanel: boolean;
  setShowClinicalPanel: (show: boolean) => void;

  // Customer & Invoice
  customers: Customer[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  saleInvoiceNo: string;
  setSaleInvoiceNo: (no: string) => void;
  saleDateStr: string;
  setSaleDateStr: (date: string) => void;
  paymentMethod: Transaction['paymentMethod'];
  setPaymentMethod: (m: Transaction['paymentMethod']) => void;

  // Custom Drug form
  saleCustomName: string;
  setSaleCustomName: (v: string) => void;
  saleCustomStrength: string;
  setSaleCustomStrength: (v: string) => void;
  saleCustomForm: string;
  setSaleCustomForm: (v: string) => void;
  saleCustomUnitPrice: string;
  setSaleCustomUnitPrice: (v: string) => void;
  saleCustomPurPrice: string;
  setSaleCustomPurPrice: (v: string) => void;
  saleCustomQty: string;
  setSaleCustomQty: (v: string) => void;
  saleCustomSaveCatalog: boolean;
  setSaleCustomSaveCatalog: (v: boolean) => void;
  saleCustomNameInputRef: React.RefObject<HTMLInputElement | null>;
  saleCustomPriceInputRef: React.RefObject<HTMLInputElement | null>;
  customProductForms: Array<{ value: string; label: string }>;

  // Search & Catalog
  medSearch: string;
  setMedSearch: (v: string) => void;
  saleSearchInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenScanner?: () => void;
  quickSearchSaleMedicines: MedicineCatalogItem[];
  medexSaleSearching?: boolean;
  getStockForMed: (med: MedicineCatalogItem | CartItem) => number;
  getMedPurchasePrice: (med: MedicineCatalogItem | CartItem) => number;
  getOldEditedQtyForMed: (med: MedicineCatalogItem | CartItem) => number;

  // Cart operations
  posCart: CartItem[];
  cartSubTotal: number;
  discountStr: string;
  setDiscountStr: (v: string) => void;
  discountVal: number;
  grandTotal: number;
  paidAmountStr: string;
  setPaidAmountStr: (v: string) => void;
  dueAmount: number;
  totalSaleUnits: number;
  hasModifiedCartPrice: boolean;
  syncModifiedPrices: boolean;
  setSyncModifiedPrices: (v: boolean) => void;

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
    reconcilePreviousInvoices?: boolean;
    reconcileInvoiceIds?: string[];
  }) => Promise<void>;
  onUpdateCartItemDetails: (medId: string, updates: Partial<CartItem>) => void;
  onUpdateCartUnitPrice: (medId: string, price: number) => void;
  onUpdateCartPurchasePrice: (medId: string, price: number) => void;
  onUpdateCartQty: (medId: string, qty: number) => void;
  onRemoveFromCart: (medId: string) => void;
  onClearCart: () => void;

  // Status & Submit
  isEditingSale: boolean;
  submittingSale: boolean;
  handleSaleSubmit: (e: React.FormEvent) => void;
  submitSaleWithMode: (forceNew?: boolean) => Promise<void>;
  onPreviewCurrentSaleInvoice: (withPrice?: boolean) => void;
  activeStaff: StaffMember;
  transactions?: Transaction[];
  editingTxId?: string;
}

export const SaleStepWizard: React.FC<SaleStepWizardProps> = ({
  saleStep,
  setSaleStep,
  saleWorkflowMode,
  setSaleWorkflowMode,
  walkInName,
  setWalkInName,
  walkInPhone,
  setWalkInPhone,
  patientAge,
  setPatientAge,
  patientSex,
  setPatientSex,
  selectedSeal,
  setSelectedSeal,
  pharmacyFindings,
  setPharmacyFindings,
  dentalFindings,
  setDentalFindings,
  showClinicalPanel,
  setShowClinicalPanel,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  saleInvoiceNo,
  setSaleInvoiceNo,
  saleDateStr,
  setSaleDateStr,
  paymentMethod,
  setPaymentMethod,
  saleCustomName,
  setSaleCustomName,
  saleCustomStrength,
  setSaleCustomStrength,
  saleCustomForm,
  setSaleCustomForm,
  saleCustomUnitPrice,
  setSaleCustomUnitPrice,
  saleCustomPurPrice,
  setSaleCustomPurPrice,
  saleCustomQty,
  setSaleCustomQty,
  saleCustomSaveCatalog,
  setSaleCustomSaveCatalog,
  saleCustomNameInputRef,
  saleCustomPriceInputRef,
  customProductForms,
  medSearch,
  setMedSearch,
  saleSearchInputRef,
  onOpenScanner,
  quickSearchSaleMedicines,
  medexSaleSearching = false,
  getStockForMed,
  getMedPurchasePrice,
  getOldEditedQtyForMed,
  posCart,
  cartSubTotal,
  discountStr,
  setDiscountStr,
  grandTotal,
  paidAmountStr,
  setPaidAmountStr,
  dueAmount,
  totalSaleUnits,
  hasModifiedCartPrice,
  syncModifiedPrices,
  setSyncModifiedPrices,
  onAddToCart,
  onAddCustomToCart,
  onUpdateCartItemDetails,
  onUpdateCartUnitPrice,
  onUpdateCartPurchasePrice,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  isEditingSale,
  submittingSale,
  handleSaleSubmit,
  submitSaleWithMode,
  onPreviewCurrentSaleInvoice,
  activeStaff,
  transactions = [],
  editingTxId,
}) => {
  const hasAnyClinicalData = useMemo(() => {
    if (selectedSeal === 'iqbal_pharmacy') {
      return Object.values(pharmacyFindings).some((v) => v && v.trim().length > 0);
    }
    return Object.values(dentalFindings).some((v) => v && v.trim().length > 0);
  }, [selectedSeal, pharmacyFindings, dentalFindings]);

  const selectedCustomerObj = useMemo(
    () => (selectedCustomerId !== 'walk-in' ? customers.find((c) => c.id === selectedCustomerId) : undefined),
    [customers, selectedCustomerId]
  );

  const customerDueSummary = useMemo(
    () =>
      getCustomerDueSummary(
        transactions,
        {
          customerId: selectedCustomerId,
          customerName: selectedCustomerObj?.name || walkInName,
          customerPhone: selectedCustomerObj?.phone || walkInPhone,
          ledgerTotalDue: selectedCustomerObj?.totalDue || 0,
        },
        editingTxId
      ),
    [transactions, selectedCustomerId, selectedCustomerObj, walkInName, walkInPhone, editingTxId]
  );

  const dueAlreadyInCart = useMemo(
    () =>
      posCart
        .filter((i) => isDueEntryItem(i))
        .reduce((sum, i) => sum + i.unitPrice * Math.max(1, i.qty || 1), 0),
    [posCart]
  );

  const remainingSuggestedDue = useMemo(
    () => Math.max(0, Number((customerDueSummary.suggestedDue - dueAlreadyInCart).toFixed(2))),
    [customerDueSummary.suggestedDue, dueAlreadyInCart]
  );

  const customersWithDue = useMemo(() => {
    return customers
      .filter((c) => (c.totalDue || 0) > 0.009)
      .sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0));
  }, [customers]);

  // Due (বকেয়া) Amount Entry Popup Modal State (amount starts strictly empty)
  const [showDueModal, setShowDueModal] = useState(false);
  const [dueAmountInput, setDueAmountInput] = useState('');
  const [editingDueMedId, setEditingDueMedId] = useState<string | null>(null);
  const [dueReconcileEnabled, setDueReconcileEnabled] = useState(true);
  const [dueSelectedInvoiceIds, setDueSelectedInvoiceIds] = useState<string[]>([]);

  const openDueModal = (existingDueItem?: CartItem) => {
    if (existingDueItem) {
      const amt = Number((existingDueItem.unitPrice * Math.max(1, existingDueItem.qty || 1)).toFixed(2));
      setEditingDueMedId(existingDueItem.medicineId);
      setDueAmountInput(amt > 0 ? String(amt) : '');
      setDueReconcileEnabled(existingDueItem.reconcilePreviousInvoices !== false);
      setDueSelectedInvoiceIds(
        existingDueItem.reconcileInvoiceIds || customerDueSummary.invoices.map((t) => t.id)
      );
    } else {
      setEditingDueMedId(null);
      setDueAmountInput('');
      setDueReconcileEnabled(true);
      setDueSelectedInvoiceIds([]);
    }
    setShowDueModal(true);
  };

  const handleQuickAddPreviousDue = async (specificInvoice?: Transaction, explicitAmount?: number) => {
    const targetInvoices = specificInvoice ? [specificInvoice] : customerDueSummary.invoices;
    const amt =
      explicitAmount !== undefined
        ? explicitAmount
        : specificInvoice
        ? Number((specificInvoice.dueAmount || 0).toFixed(2))
        : remainingSuggestedDue;
    if (amt <= 0) return;

    await onAddCustomToCart({
      brandName: 'Due',
      genericName: '',
      companyName: '',
      strength: '',
      dosageForm: 'Due',
      unitPrice: amt,
      purchasePrice: 0,
      qty: 1,
      saveToCatalog: false,
      reconcilePreviousInvoices: true,
      reconcileInvoiceIds: targetInvoices.map((inv) => inv.id),
    });
  };

  const handleDueModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(dueAmountInput);
    if (!Number.isFinite(parsedAmt) || parsedAmt <= 0) return;

    const effectiveInvoiceIds =
      dueSelectedInvoiceIds.length > 0
        ? dueSelectedInvoiceIds
        : customerDueSummary.invoices.map((t) => t.id);

    if (editingDueMedId) {
      onUpdateCartItemDetails(editingDueMedId, {
        brandName: 'Due',
        genericName: '',
        strength: '',
        dosageForm: 'Due',
        unitPrice: parsedAmt,
        purchasePrice: 0,
        qty: 1,
        updateStock: false,
        reconcilePreviousInvoices: dueReconcileEnabled,
        reconcileInvoiceIds: effectiveInvoiceIds,
      });
    } else {
      await onAddCustomToCart({
        brandName: 'Due',
        genericName: '',
        companyName: '',
        strength: '',
        dosageForm: 'Due',
        unitPrice: parsedAmt,
        purchasePrice: 0,
        qty: 1,
        saveToCatalog: false,
        reconcilePreviousInvoices: dueReconcileEnabled,
        reconcileInvoiceIds: effectiveInvoiceIds,
      });
    }
    setShowDueModal(false);
    setDueAmountInput('');
    setEditingDueMedId(null);
    setDueSelectedInvoiceIds([]);
  };

  return (
    <div className="bg-slate-50/50">
      {/* Top Workflow Navigator Bar */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="font-extrabold text-xs text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 inline-flex items-center gap-1.5 whitespace-nowrap">
              <ShoppingCart className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span>বিক্রয় ইনভয়েস ও মেমো</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              ধাপ ১ থেকে ৪ ক্রমানুসারে পূরণ করুন
            </span>
          </div>

          <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSaleWorkflowMode('step_by_step')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                saleWorkflowMode === 'step_by_step'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ধাপভিত্তিক (১–৪)
            </button>
            <button
              type="button"
              onClick={() => setSaleWorkflowMode('all_in_one')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                saleWorkflowMode === 'all_in_one'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              একত্রে সব (All-in-One)
            </button>
          </div>
        </div>

        {/* 4 Interactive Steps Navigator */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Step 1 Tab Button */}
          <button
            type="button"
            onClick={() => setSaleStep(1)}
            className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
              saleStep === 1
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : walkInName.trim() || patientAge
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums shrink-0 ${
                    saleStep === 1 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ১
                </span>
                <span className="truncate">রোগী ও চেম্বার</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  saleStep === 1 ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                {walkInName.trim() ? walkInName : 'নাম, বয়স, লিঙ্গ ও সিল'}
              </div>
            </div>
            {(walkInName.trim() || patientAge) && saleStep !== 1 && (
              <span className="text-teal-700 font-bold text-xs shrink-0">✓</span>
            )}
          </button>

          {/* Step 2 Tab Button */}
          <button
            type="button"
            onClick={() => setSaleStep(2)}
            className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
              saleStep === 2
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : hasAnyClinicalData
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums shrink-0 ${
                    saleStep === 2 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ২
                </span>
                <span className="truncate">ক্লিনিক্যাল ও ভাইটালস</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  saleStep === 2 ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                {hasAnyClinicalData ? 'পর্যবেক্ষণ যুক্ত আছে' : 'BP, RBS, জ্বর ও লক্ষণ'}
              </div>
            </div>
            {hasAnyClinicalData && saleStep !== 2 && (
              <span className="text-teal-700 font-bold text-xs shrink-0">✓</span>
            )}
          </button>

          {/* Step 3 Tab Button */}
          <button
            type="button"
            onClick={() => setSaleStep(3)}
            className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
              saleStep === 3
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : posCart.length > 0
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums shrink-0 ${
                    saleStep === 3 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ৩
                </span>
                <span className="truncate">ওষুধ ও ডোজ</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate tabular-nums ${
                  saleStep === 3 ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                {posCart.length > 0 ? `${posCart.length}টি ওষুধ যুক্ত` : 'সার্চ, কাস্টম ও ডোজ'}
              </div>
            </div>
            {posCart.length > 0 && saleStep !== 3 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-teal-800 text-white rounded font-mono tabular-nums shrink-0">
                {posCart.length}
              </span>
            )}
          </button>

          {/* Step 4 Tab Button */}
          <button
            type="button"
            onClick={() => setSaleStep(4)}
            className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
              saleStep === 4
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : posCart.length > 0
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums shrink-0 ${
                    saleStep === 4 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ৪
                </span>
                <span className="truncate">মেমো ও ফাইনাল বিল</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate font-mono tabular-nums ${
                  saleStep === 4 ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                মোট: ৳{grandTotal.toFixed(0)} {dueAmount > 0 ? `(বাকি ৳${dueAmount.toFixed(0)})` : ''}
              </div>
            </div>
            {posCart.length > 0 && saleStep !== 4 && (
              <span className="font-mono tabular-nums text-xs font-bold text-teal-800 shrink-0">
                ৳{grandTotal.toFixed(0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area based on saleWorkflowMode */}
      {saleWorkflowMode === 'step_by_step' ? (
        <div className="p-3 sm:p-5 max-w-5xl mx-auto space-y-4">
          {/* =========================================================================
              STEP 1: PATIENT INFO & CHAMBER SELECTION (ছবি ১)
              ========================================================================= */}
          {saleStep === 1 && (
            <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-mono tabular-nums shrink-0">
                      ১
                    </span>
                    <span>রোগীর তথ্য ও চেম্বার নির্বাচন</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ক্রেতা, তারিখ, রোগীর তথ্য এবং প্রেসক্রিপশন মেমোর চেম্বার/সিল সিলেক্ট করুন
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 whitespace-nowrap shrink-0 self-start sm:self-auto">
                  মেমো নং: {saleInvoiceNo}
                </span>
              </div>

              {/* Customer & Invoice Meta (4 dedicated non-clipping fields) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    কাস্টমার / লেজার খাতা
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none"
                  >
                    <option value="walk-in">সাধারণ ক্রেতা (নগদ / Walk-in)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — বাকি: ৳{c.totalDue}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিক্রয় মেমো নং *
                  </label>
                  <input
                    type="text"
                    required
                    value={saleInvoiceNo}
                    onChange={(e) => setSaleInvoiceNo(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-mono tabular-nums font-bold bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDateStr}
                    onChange={(e) => setSaleDateStr(e.target.value)}
                    aria-label="বিক্রয় তারিখ"
                    className="w-full min-w-0 px-2.5 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as Transaction['paymentMethod'])
                    }
                    aria-label="পেমেন্ট মাধ্যম"
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold focus:border-teal-600 focus:outline-none"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ MFS</option>
                    <option value="card">কার্ড</option>
                    <option value="due">বাকি (Due)</option>
                  </select>
                </div>
              </div>

              {/* Customer Previous Due Auto-Suggestion & Reconciliation Banner */}
              {customerDueSummary.suggestedDue > 0 && (
                <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="space-y-1.5 min-w-0">
                    <div className="font-bold text-rose-950 flex flex-wrap items-center gap-1.5">
                      <span>
                        ⚠️ {selectedCustomerObj?.name || walkInName || 'ক্রেতা'}-এর পূর্বের বকেয়া:{' '}
                        <span className="font-mono tabular-nums text-rose-700">
                          ৳{formatCleanMoney(customerDueSummary.suggestedDue)}
                        </span>
                      </span>
                      {dueAlreadyInCart > 0 && (
                        <span className="px-2 py-0.5 text-[10.5px] bg-emerald-100 text-emerald-900 rounded-full font-mono tabular-nums whitespace-nowrap">
                          কার্টে যুক্ত: ৳{formatCleanMoney(dueAlreadyInCart)}
                        </span>
                      )}
                    </div>
                    {customerDueSummary.invoices.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px] text-rose-800">
                        {customerDueSummary.invoices.map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => handleQuickAddPreviousDue(inv)}
                            className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-full font-mono tabular-nums text-[10.5px] text-rose-900 cursor-pointer whitespace-nowrap shrink-0"
                            title="এই একটি ইনভয়েসের বকেয়া কার্টে যোগ ও সমন্বয় করুন"
                          >
                            {inv.invoiceNo} ({inv.dateStr}) · ৳{formatCleanMoney(inv.dueAmount)} +
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {remainingSuggestedDue > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAddPreviousDue()}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                    >
                      + পূর্বের Due (৳{formatCleanMoney(remainingSuggestedDue)}) যোগ ও সমন্বয়
                    </button>
                  )}
                </div>
              )}

              {customerDueSummary.suggestedDue === 0 && customersWithDue.length > 0 && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-amber-950 text-[11px]">
                    পূর্বের বকেয়া থাকা ক্রেতা (এক ট্যাপে সিলেক্ট করুন):
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {customersWithDue.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-full text-[11px] font-semibold text-amber-950 cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <span>{c.name}</span>
                        <span className="font-mono tabular-nums font-bold text-rose-700">
                          ৳{formatCleanMoney(c.totalDue)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient Name, Age, Sex (Compact mobile 2-col for Age & Sex) */}
              <div className="p-3.5 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-bold text-pink-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-pink-700 shrink-0" />
                    <span>রোগীর ব্যক্তিগত তথ্য</span>
                  </span>
                  <span className="text-[10.5px] text-pink-800">
                    মেমোর সিল বক্সে প্রদর্শিত হবে
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedCustomerId === 'walk-in' ? (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                        Name (রোগীর নাম)
                      </label>
                      <input
                        type="text"
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="যেমন: মো: রহিম / রোগীর নাম"
                        className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded-lg focus:border-pink-600 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                        Name (রোগীর নাম)
                      </label>
                      <div className="px-3 py-2 text-xs bg-white border border-pink-200 rounded-lg font-bold text-slate-900 truncate">
                        {customers.find((c) => c.id === selectedCustomerId)?.name || 'নাম'}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                      Age (বয়স)
                    </label>
                    <input
                      type="text"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="যেমন: 28Y"
                      className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded-lg focus:border-pink-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                      Sex (লিঙ্গ)
                    </label>
                    <select
                      value={patientSex}
                      onChange={(e) => setPatientSex(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-pink-300 rounded-lg focus:border-pink-600 focus:outline-none font-medium"
                    >
                      <option value="Male">পুরুষ (Male)</option>
                      <option value="Female">মহিলা (Female)</option>
                      <option value="Other">অন্যান্য (Other)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seal / Chamber Selection (৩টি সিল থেকে নির্বাচন - সঠিক ঠিকানা সহ) */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-900">
                    চেম্বার ও সিল নির্বাচন (মেমো ঠিকানা)
                  </label>
                  <span className="text-[11px] text-teal-800 font-semibold">
                    ডেন্টিস্ট: ইকবাল মাহমুদ (DMTD, LMAF, RMP, Pharmacist)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSeal === 'iqbal_pharmacy'
                        ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-xs ring-2 ring-teal-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="invoiceSeal"
                      value="iqbal_pharmacy"
                      checked={selectedSeal === 'iqbal_pharmacy'}
                      onChange={() => setSelectedSeal('iqbal_pharmacy')}
                      className="text-teal-700 focus:ring-teal-600 mt-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-teal-950">১. ইকবাল ফার্মেসী</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।
                      </div>
                      <div className="text-[10px] text-teal-700 mt-0.5">
                        (ফার্মেসী প্রেসক্রিপশন ও ডেলিভারি মেমো)
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSeal === 'dental_care_1'
                        ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-xs ring-2 ring-teal-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="invoiceSeal"
                      value="dental_care_1"
                      checked={selectedSeal === 'dental_care_1'}
                      onChange={() => setSelectedSeal('dental_care_1')}
                      className="text-teal-700 focus:ring-teal-600 mt-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-teal-950">২. ইকবাল ডেন্টাল কেয়ার-১</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।
                      </div>
                      <div className="text-[10px] text-teal-700 mt-0.5">
                        (চন্দ্রগঞ্জ শাখা চেম্বার)
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSeal === 'dental_care_2'
                        ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-xs ring-2 ring-teal-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="invoiceSeal"
                      value="dental_care_2"
                      checked={selectedSeal === 'dental_care_2'}
                      onChange={() => setSelectedSeal('dental_care_2')}
                      className="text-teal-700 focus:ring-teal-600 mt-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-teal-950">
                        ৩. ইকবাল ডেন্টাল কেয়ার-২ (ওদারহাট)
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        উদয় সাধুরহাট, পশ্চিম বাজার, পানা মিয়া স্কুল গেইট (ইউনিয়ন পরিষদ রোড), সদর, নোয়াখালী।
                      </div>
                      <div className="text-[10px] text-teal-700 mt-0.5">
                        (নোয়াখালী সদর শাখা চেম্বার)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 1 Footer Navigation */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  পরবর্তী ধাপে রোগীর ক্লিনিক্যাল ভাইটালস বা ডেন্টাল পর্যবেক্ষণ পূরণ করুন
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaleStep(3)}
                    className="px-3 py-2.5 text-xs font-semibold text-slate-700 hover:text-teal-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-center"
                  >
                    সরাসরি ওষুধ (ধাপ ৩) ⏩
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleStep(2)}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                  >
                    <span>পরবর্তী ধাপ ২ (ভাইটালস)</span>
                    <span>➜</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: CLINICAL VITALS / DENTAL FINDINGS (ছবি ২)
              ========================================================================= */}
          {saleStep === 2 && (
            <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-mono tabular-nums shrink-0">
                      ২
                    </span>
                    <span>
                      {selectedSeal === 'iqbal_pharmacy'
                        ? 'ফার্মেসী ক্লিনিক্যাল ভাইটালস (Pharmacy Vitals)'
                        : 'ডেন্টাল ক্লিনিক্যাল পর্যবেক্ষণ (Dental Exam)'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedSeal === 'iqbal_pharmacy'
                      ? 'BP, RBS, Temp, Weight, Pulse ও লক্ষণ সংক্ষেপে লিখুন'
                      : 'দাঁতের সমস্যা, ক্যারিস, স্কেলিং, আরসিটি বা এক্সট্রাকশন তথ্য লিখুন'}
                  </p>
                </div>
                <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap shrink-0 self-start sm:self-auto">
                  রোগী: <strong>{walkInName.trim() || 'সাধারণ ক্রেতা'}</strong> ({patientAge || 'বয়স'})
                </span>
              </div>

              {/* Pharmacy Clinical Vitals — 2-col compact mobile grid */}
              {selectedSeal === 'iqbal_pharmacy' ? (
                <div className="p-3 sm:p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5 min-w-0">
                      <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="truncate">ক্লিনিক্যাল ভাইটালস তথ্য</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
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
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                    >
                      সব তথ্য খালি করুন
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
                    {[
                      { key: 'রক্তচাপ (BP)', icon: Activity, placeholder: '120/80 mmHg' },
                      { key: 'ডায়াবেটিস (RBS)', icon: Heart, placeholder: '6.5 mmol/L' },
                      { key: 'তাপমাত্রা (Temp)', icon: Thermometer, placeholder: '98.6 °F' },
                      { key: 'ওজন (Weight)', placeholder: '65 kg' },
                      { key: 'নাড়ির গতি (Pulse)', placeholder: '72 bpm' },
                      { key: 'প্রধান লক্ষণ (Symptoms)', placeholder: 'সর্দি, কাশি, গ্যাস্ট্রিক' },
                      { key: 'প্রাথমিক পরামর্শ (Advice)', placeholder: 'পর্যাপ্ত পানি ও বিশ্রাম' },
                      { key: 'পরীক্ষা-নিরীক্ষা (Inv.)', placeholder: 'CBC, RBS, Urine R/E' },
                    ].map((field) => {
                      const val = pharmacyFindings[field.key] || '';
                      const IconComp = field.icon;
                      return (
                        <div key={field.key} className="bg-white p-2 sm:p-2.5 rounded-lg border border-teal-200 shadow-2xs">
                          <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1 truncate">
                            {IconComp && <IconComp className="w-3 h-3 text-teal-600 shrink-0" />}
                            <span className="truncate">{field.key}</span>
                          </label>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setPharmacyFindings((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Dental Clinical Findings — 2-col compact mobile grid */
                <div className="p-3 sm:p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 min-w-0">
                      <span className="truncate">🦷 ডেন্টাল ক্লিনিক্যাল পর্যবেক্ষণ</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
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
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                    >
                      সব তথ্য খালি করুন
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
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
                    ].map((itemKey) => {
                      const val = dentalFindings[itemKey] || '';
                      return (
                        <div key={itemKey} className="bg-white p-2 sm:p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                          <label className="block text-[11px] font-bold text-slate-800 mb-1 truncate">
                            {itemKey}:
                          </label>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setDentalFindings((prev) => ({
                                ...prev,
                                [itemKey]: e.target.value,
                              }))
                            }
                            placeholder={`${itemKey} / দাঁতের নং...`}
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-600 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2 Footer Navigation */}
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSaleStep(1)}
                  className="px-3 sm:px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>⬅ ধাপ ১ (রোগীর তথ্য)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleStep(3)}
                  className="px-3 sm:px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <span>পরবর্তী ধাপ ৩ (ওষুধ)</span>
                  <span>➜</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 3: MEDICINE SEARCH & DOSAGE PRESETS (ছবি ৩)
              ========================================================================= */}
          {saleStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-mono tabular-nums shrink-0">
                        ৩
                      </span>
                      <span>ওষুধ সার্চ, কাস্টম আইটেম ও ডোজ নির্বাচন</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ওষুধ যোগ করে এক ট্যাপে ডোজ ও মেয়াদ বসান (যেমন: 1+0+1, 7 Days)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openDueModal()}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-full cursor-pointer whitespace-nowrap shrink-0"
                      title="পূর্বের বকেয়া (Due) টাকা যোগ করুন"
                    >
                      + বকেয়া (Due)
                    </button>
                    <span className="px-3 py-1.5 bg-teal-100 text-teal-900 font-bold text-xs rounded-full font-mono tabular-nums whitespace-nowrap shrink-0">
                      {posCart.length}টি নির্বাচিত
                    </span>
                  </div>
                </div>

                {/* Custom Drug Quick Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const name = saleCustomName.trim();
                    if (!name) {
                      saleCustomNameInputRef.current?.focus();
                      return;
                    }
                    if (isDueEntryItem({ brandName: name, dosageForm: saleCustomForm })) {
                      const dueAmt = parseFloat(saleCustomUnitPrice) || 0;
                      if (dueAmt <= 0) {
                        openDueModal();
                        return;
                      }
                      await onAddCustomToCart({
                        brandName: 'Due',
                        genericName: '',
                        companyName: '',
                        strength: '',
                        dosageForm: 'Due',
                        unitPrice: dueAmt,
                        purchasePrice: 0,
                        qty: 1,
                        saveToCatalog: false,
                        reconcilePreviousInvoices: true,
                        reconcileInvoiceIds: customerDueSummary.invoices.map((inv) => inv.id),
                      });
                      setSaleCustomName('');
                      setSaleCustomStrength('');
                      setSaleCustomUnitPrice('');
                      setSaleCustomPurPrice('');
                      setSaleCustomQty('1');
                      return;
                    }
                    const unitPrice = Math.max(0.1, parseFloat(saleCustomUnitPrice) || 10);
                    const purchasePrice =
                      saleCustomPurPrice.trim() !== ''
                        ? Math.max(0.01, parseFloat(saleCustomPurPrice) || Number((unitPrice * 0.88).toFixed(2)))
                        : Number((unitPrice * 0.88).toFixed(2));
                    const qty = Math.max(1, parseInt(saleCustomQty, 10) || 1);

                    await onAddCustomToCart({
                      brandName: name,
                      strength: saleCustomStrength.trim(),
                      dosageForm: saleCustomForm,
                      unitPrice,
                      purchasePrice,
                      qty,
                      saveToCatalog: saleCustomSaveCatalog,
                    });

                    setSaleCustomName('');
                    setSaleCustomStrength('');
                    setSaleCustomUnitPrice('');
                    setSaleCustomPurPrice('');
                    setSaleCustomQty('1');
                    setTimeout(() => {
                      saleCustomNameInputRef.current?.focus();
                    }, 60);
                  }}
                  className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>কাস্টম ওষুধ / পণ্য যোগ করুন</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                    <div className="col-span-2 sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        প্রডাক্ট / ওষুধের নাম *
                      </label>
                      <input
                        ref={saleCustomNameInputRef}
                        type="text"
                        required
                        placeholder="যেমন: Napa Extra, Seclo"
                        value={saleCustomName}
                        onChange={(e) => {
                          const nextName = e.target.value;
                          setSaleCustomName(nextName);
                          if (isDueEntryItem({ brandName: nextName })) {
                            setSaleCustomStrength('');
                            setSaleCustomUnitPrice('');
                            setSaleCustomPurPrice('');
                            setSaleCustomQty('1');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    {!isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm }) && (
                      <>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            শক্তি/সাইজ
                          </label>
                          <input
                            type="text"
                            placeholder="500mg"
                            value={saleCustomStrength}
                            onChange={(e) => setSaleCustomStrength(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            ধরন / Form
                          </label>
                          <select
                            value={saleCustomForm}
                            onChange={(e) => setSaleCustomForm(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                          >
                            {customProductForms.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        {isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm })
                          ? 'বকেয়া পরিমাণ (৳)'
                          : 'বিক্রয় দর (৳) *'}
                      </label>
                      <input
                        ref={saleCustomPriceInputRef}
                        type="number"
                        step="any"
                        min="0.1"
                        required={!isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm })}
                        placeholder={
                          isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm })
                            ? 'পপআপ'
                            : '12.00'
                        }
                        value={saleCustomUnitPrice}
                        onChange={(e) => setSaleCustomUnitPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    {!isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm }) && (
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          পরিমাণ (পিস) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={saleCustomQty}
                          onChange={(e) => setSaleCustomQty(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    {!isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm }) ? (
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-teal-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saleCustomSaveCatalog}
                          onChange={(e) => setSaleCustomSaveCatalog(e.target.checked)}
                          className="rounded border-teal-400 text-teal-700"
                        />
                        <span>ক্যাটালগ ও স্টকেও সংরক্ষণ করুন</span>
                      </label>
                    ) : (
                      <span className="text-[11px] text-rose-800 font-medium">
                        Due আইটেম কার্টের নিচে যোগ হবে
                      </span>
                    )}

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>বিলে যুক্ত করুন</span>
                    </button>
                  </div>
                </form>

                {/* Medicine Search with Live Auto-suggestions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={saleSearchInputRef}
                        type="text"
                        value={medSearch}
                        onChange={(e) => setMedSearch(e.target.value)}
                        placeholder="ওষুধের নাম লিখে দ্রুত সার্চ করুন (Napa, Seclo, Ciprocin)..."
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-teal-600 focus:outline-none"
                      />
                      {medSearch && (
                        <button
                          type="button"
                          onClick={() => setMedSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {onOpenScanner && (
                      <button
                        type="button"
                        onClick={onOpenScanner}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 transition-all shadow-2xs"
                      >
                        <Camera className="w-4 h-4 text-purple-700" />
                        <span className="hidden sm:inline">বক্স স্ক্যানার</span>
                      </button>
                    )}
                  </div>

                  {medexSaleSearching && medSearch.trim().length >= 2 && (
                    <div className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-teal-600 border-t-transparent animate-spin shrink-0" />
                      <span>medex.com.bd থেকে সরাসরি অনুসন্ধান ও লাইভ বিক্রয়মূল্য যাচাই হচ্ছে...</span>
                    </div>
                  )}

                  {/* Search Results Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-0.5">
                    {quickSearchSaleMedicines.map((med) => {
                      const st = getStockForMed(med);
                      const inCart = posCart.find((c) => c.medicineId === med.id)?.qty || 0;
                      const purPrice = getMedPurchasePrice(med);
                      return (
                        <div
                          key={med.id}
                          className="p-2.5 border border-slate-200 rounded-xl hover:border-teal-600 transition-colors flex flex-col justify-between gap-1.5 bg-white shadow-2xs"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {med.variantDisplayName || med.brandName}{' '}
                                {!(med.variantDisplayName && med.variantDisplayName !== med.brandName) && (
                                  <span className="font-normal text-slate-500">
                                    {med.strength}
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {med.source === 'medex' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded whitespace-nowrap">
                                    MedEx
                                  </span>
                                )}
                                <span className="font-mono tabular-nums text-xs font-bold text-teal-800">
                                  ৳{formatCleanMoney(med.unitPrice)}
                                </span>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center justify-between gap-2 mt-0.5">
                              <span className="truncate">
                                {med.genericName} · {med.dosageForm}
                                {med.strength ? ` (${med.strength})` : ''}
                              </span>
                              <span className="font-mono tabular-nums text-[10px] text-indigo-700 shrink-0">
                                ক্রয়: ৳{formatCleanMoney(purPrice)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                            <div className="text-[11px] font-mono tabular-nums">
                              {st > 0 ? (
                                <span className="text-slate-700 font-semibold">
                                  স্টক: {st}
                                  {inCart > 0 && (
                                    <span className="text-amber-700 ml-1">
                                      ({inCart} যোগ)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-red-600 font-medium">স্টক: ০</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onAddToCart(med, 1)}
                                className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer whitespace-nowrap"
                              >
                                +১ পিস
                              </button>
                              <button
                                type="button"
                                onClick={() => onAddToCart(med, med.unitsPerStrip || 10)}
                                className="px-2 py-1 text-[11px] font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-md cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                +১ পাতা
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dedicated Medicine Dosage & Administration Card for Cart Items (Screenshot 3) */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-700 shrink-0" />
                    <h4 className="text-xs font-bold text-slate-900">
                      নির্বাচিত ওষুধের ডোজ ও খাওয়ার নিয়মাবলী
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    ১-ট্যাপে ডোজ ও মেয়াদ বসান (যেমন: 1+0+1, 7 Days)
                  </span>
                </div>

                {posCart.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    ওপরের সার্চ বা কাস্টম ফর্ম থেকে ওষুধ যোগ করলে এখানে ডোজ ও নিয়ম নির্ধারণ করার অপশন আসবে।
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orderCartItemsWithDueLast(posCart).map((item, idx) => {
                      const isDue = isDueEntryItem(item);
                      if (isDue) {
                        return (
                          <div
                            key={item.medicineId}
                            className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono tabular-nums text-xs font-bold text-rose-900 bg-rose-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-rose-950">Due</span>
                              <span className="text-xs font-mono tabular-nums font-bold text-rose-800">
                                ৳{formatCleanMoney(item.unitPrice * Math.max(1, item.qty || 1))}
                              </span>
                              {item.reconcilePreviousInvoices !== false && customerDueSummary.suggestedDue > 0 && (
                                <span className="text-[10.5px] px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full font-medium whitespace-nowrap">
                                  পূর্বের বকেয়া সমন্বয় হবে
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => openDueModal(item)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-800 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg cursor-pointer whitespace-nowrap"
                              >
                                ✏️ সংশোধন
                              </button>
                              <button
                                type="button"
                                onClick={() => onRemoveFromCart(item.medicineId)}
                                className="px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer whitespace-nowrap"
                              >
                                বাদ দিন ✕
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                      <div
                        key={item.medicineId}
                        className="p-3 bg-rose-50/40 border border-rose-200 rounded-xl space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="font-mono tabular-nums text-xs font-bold text-rose-900 bg-rose-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.dosageForm} {item.brandName} {item.strength}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
                              ({item.qty} পিস · ৳{formatCleanMoney(item.unitPrice * item.qty)})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.medicineId)}
                            className="px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-md cursor-pointer whitespace-nowrap shrink-0"
                          >
                            বাদ দিন ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center">
                          <div className="col-span-1 md:col-span-4 flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-slate-700 shrink-0">
                              ডোজ:
                            </label>
                            <input
                              type="text"
                              value={item.dosageSchedule || ''}
                              onChange={(e) =>
                                onUpdateCartItemDetails(item.medicineId, {
                                  dosageSchedule: e.target.value,
                                })
                              }
                              placeholder="1+0+1"
                              className="w-full min-w-0 px-2 py-1 text-xs font-mono font-bold text-red-700 bg-white border border-rose-300 rounded-md focus:border-red-500 focus:outline-none"
                            />
                          </div>

                          <div className="col-span-1 md:col-span-4 flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-slate-700 shrink-0">
                              মেয়াদ:
                            </label>
                            <input
                              type="text"
                              value={item.dosageDuration || ''}
                              onChange={(e) =>
                                onUpdateCartItemDetails(item.medicineId, {
                                  dosageDuration: e.target.value,
                                })
                              }
                              placeholder="7 Days"
                              className="w-full min-w-0 px-2 py-1 text-xs font-mono text-slate-800 bg-white border border-rose-300 rounded-md focus:border-red-500 focus:outline-none"
                            />
                          </div>

                          {/* Preset Chips — clean horizontal scroller on mobile */}
                          <div className="col-span-2 md:col-span-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                            {['1+0+1', '1+1+1', '1+0+0', '0+0+1'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  onUpdateCartItemDetails(item.medicineId, {
                                    dosageSchedule: preset,
                                  })
                                }
                                className={`px-2 py-1 text-[10.5px] font-mono font-bold rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                                  item.dosageSchedule === preset
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white hover:bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                            {['7 Days', '10 Day', '14 Days'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  onUpdateCartItemDetails(item.medicineId, {
                                    dosageDuration: preset,
                                  })
                                }
                                className={`px-2 py-1 text-[10.5px] font-mono rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                                  item.dosageDuration === preset
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3 Footer Navigation */}
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2.5 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSaleStep(2)}
                  className="px-3 sm:px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>⬅ ধাপ ২ (ভাইটালস)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleStep(4)}
                  className="px-3 sm:px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <span>ধাপ ৪ (ফাইনাল বিল)</span>
                  <span>➜</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 4: POS MEMO TABLE, FINANCIAL TOTALS & SUBMIT (ছবি ৪)
              ========================================================================= */}
          {saleStep === 4 && (
            <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-mono tabular-nums shrink-0">
                      ৪
                    </span>
                    <span>বিক্রয় ইনভয়েস মেমো ও ফাইনাল বিল</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ওষুধের বিক্রয় দর, পরিমাণ ও স্টক হ্রাস নিশ্চিত করে মেমো সম্পন্ন করুন
                  </p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(true)}
                    className="px-3 py-1.5 text-xs font-bold text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-700" />
                    <span>A4 ইনভয়েস</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(false)}
                    className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>দাম ছাড়া মেমো</span>
                  </button>
                  {posCart.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                    >
                      খালি করুন
                    </button>
                  )}
                </div>
              </div>

              {/* Sale Items Table (No Purchase Price shown to customer/operator) */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                {posCart.length === 0 ? (
                  <div className="py-10 px-4 text-center text-xs text-slate-500 space-y-2">
                    <div>বিক্রয় ইনভয়েসে এখনো কোনো ওষুধ যোগ করা হয়নি।</div>
                    <button
                      type="button"
                      onClick={() => setSaleStep(3)}
                      className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                    >
                      + ধাপ ৩ থেকে ওষুধ যোগ করুন
                    </button>
                  </div>
                ) : (
                  <table className="w-full min-w-[540px] text-left border-collapse">
                    <thead className="bg-teal-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">ওষুধ, ডোজ ও স্টক হ্রাস</th>
                        <th className="py-2.5 px-2 text-center">বিক্রয় দর (৳)</th>
                        <th className="py-2.5 px-2 text-center">পরিমাণ</th>
                        <th className="py-2.5 px-3 text-right">মোট (৳)</th>
                        <th className="py-2.5 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {orderCartItemsWithDueLast(posCart).map((item, idx) => {
                        const isDue = isDueEntryItem(item);
                        const priceChanged =
                          !isDue &&
                          item.originalUnitPrice !== undefined &&
                          Math.abs(item.unitPrice - item.originalUnitPrice) > 0.001;
                        const lineTotal = item.unitPrice * item.qty;
                        const rawCurrentStock = isDue ? 0 : getStockForMed(item);
                        const oldEditedQty = !isDue && isEditingSale ? getOldEditedQtyForMed(item) : 0;
                        const currentStock = rawCurrentStock + oldEditedQty;
                        const remainingStock = Math.max(0, currentStock - item.qty);

                        if (isDue) {
                          return (
                            <tr key={item.medicineId} className="bg-rose-50/40 hover:bg-rose-50/70">
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono tabular-nums text-xs font-bold text-rose-700">
                                    {idx + 1}.
                                  </span>
                                  <span className="font-bold text-xs text-rose-950">Due</span>
                                  {item.reconcilePreviousInvoices !== false && customerDueSummary.suggestedDue > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded font-medium whitespace-nowrap">
                                      পূর্বের বকেয়া সমন্বয়
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => openDueModal(item)}
                                  className="px-2.5 py-1 text-xs font-mono tabular-nums font-bold text-rose-900 bg-white border border-rose-300 hover:bg-rose-100 rounded cursor-pointer"
                                  title="ক্লিক করে Due টাকা পরিবর্তন করুন"
                                >
                                  ৳{formatCleanMoney(item.unitPrice)}
                                </button>
                              </td>
                              <td className="py-2.5 px-2 text-center text-xs font-mono text-slate-400">
                                —
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-rose-950 text-xs">
                                ৳{formatCleanMoney(lineTotal)}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => onRemoveFromCart(item.medicineId)}
                                  className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                  title="আইটেম মুছুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={item.medicineId} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono tabular-nums text-xs font-bold text-slate-500">
                                  {idx + 1}.
                                </span>
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-900 rounded font-mono">
                                  {item.dosageForm}
                                </span>
                                <span className="font-bold text-xs text-slate-900">
                                  {item.brandName}
                                </span>
                                {item.strength && (
                                  <span className="text-[11px] font-mono text-slate-500">
                                    ({item.strength})
                                  </span>
                                )}
                              </div>

                              {(item.dosageSchedule || item.dosageDuration) && (
                                <div className="text-[11px] font-mono text-rose-800 mt-1 flex items-center gap-1.5">
                                  <span className="font-bold text-rose-900">ডোজ:</span>
                                  <span className="bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold">
                                    {item.dosageSchedule || 'নিয়ম অনুযায়ী'}
                                  </span>
                                  {item.dosageDuration && (
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                      {item.dosageDuration}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <label
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] border cursor-pointer select-none ${
                                    item.updateStock !== false
                                      ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold'
                                      : 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.updateStock !== false}
                                    onChange={(e) =>
                                      onUpdateCartItemDetails(item.medicineId, {
                                        updateStock: e.target.checked,
                                      })
                                    }
                                    className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                  />
                                  <span>
                                    {item.updateStock !== false
                                      ? '✅ স্টক কমবে'
                                      : '❌ স্টক অপরিবর্তিত'}
                                  </span>
                                </label>

                                {item.updateStock !== false && (
                                  <span className="text-[10.5px] font-mono tabular-nums text-slate-500">
                                    স্টক: {currentStock} ➜ <strong>{remainingStock} পিস</strong>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Selling Price Input */}
                            <td className="py-2.5 px-2 text-center">
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  onUpdateCartUnitPrice(
                                    item.medicineId,
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className={`w-20 text-center py-1 px-1 text-xs font-mono tabular-nums border rounded font-bold ${
                                  priceChanged
                                    ? 'border-amber-500 bg-amber-50 text-slate-900'
                                    : 'border-slate-300 bg-white text-slate-900'
                                }`}
                              />
                            </td>

                            {/* Qty +/- Controls */}
                            <td className="py-2.5 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateCartQty(item.medicineId, Math.max(1, item.qty - 1))
                                  }
                                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) =>
                                    onUpdateCartQty(
                                      item.medicineId,
                                      Math.max(1, parseInt(e.target.value, 10) || 1)
                                    )
                                  }
                                  className="w-12 text-center py-1 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => onUpdateCartQty(item.medicineId, item.qty + 1)}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 text-xs whitespace-nowrap">
                              ৳{formatCleanMoney(lineTotal)}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => onRemoveFromCart(item.medicineId)}
                                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                title="আইটেম মুছুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {dueAlreadyInCart > 0 &&
                (() => {
                  const dueItems = posCart.filter(
                    (i) => isDueEntryItem(i) && i.reconcilePreviousInvoices !== false
                  );
                  if (dueItems.length === 0) return null;
                  const explicitIds = Array.from(
                    new Set(dueItems.flatMap((i) => i.reconcileInvoiceIds || []))
                  );
                  const targetInvs =
                    explicitIds.length > 0
                      ? transactions.filter((t) => explicitIds.includes(t.id) && (t.dueAmount || 0) > 0)
                      : customerDueSummary.invoices;
                  if (targetInvs.length === 0) return null;
                  const targetTotal = targetInvs.reduce((s, t) => s + (t.dueAmount || 0), 0);
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                      <strong>✓ পূর্বের ইনভয়েস সমন্বয় সক্রিয়:</strong> এই ইনভয়েস সম্পন্ন হলে{' '}
                      <span className="font-mono tabular-nums font-bold">
                        {targetInvs
                          .map((t) => `${t.invoiceNo} (৳${formatCleanMoney(t.dueAmount)})`)
                          .join(', ')}
                      </span>{' '}
                      থেকে ক্রমানুসারে ৳{formatCleanMoney(Math.min(dueAlreadyInCart, targetTotal))} বকেয়া সমন্বয় হয়ে ঐ ইনভয়েসগুলোর Due বাদ যাবে এবং লেখা থাকবে{' '}
                      <span className="font-bold text-indigo-900">
                        &ldquo;সমন্বয় করা হয়েছে {saleInvoiceNo} নাম্বার ইনভয়েস এ&rdquo;
                      </span>
                      ।
                    </div>
                  );
                })()}

              {/* Financial Totals Calculation Box */}
              <form onSubmit={handleSaleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-teal-50/60 p-3 sm:p-4 rounded-xl border border-teal-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">
                      মোট বিক্রয় বিল (৳)
                    </label>
                    <div className="text-base sm:text-lg font-black font-mono tabular-nums text-slate-900 mt-1">
                      ৳{cartSubTotal.toFixed(2)}
                    </div>
                    <div className="text-[11px] font-bold font-mono tabular-nums text-teal-800 mt-0.5">
                      চূড়ান্ত: ৳{grandTotal.toFixed(0)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">
                      ছাড় / ডিসকাউন্ট (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discountStr}
                      onChange={(e) => setDiscountStr(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">
                      নগদ জমা / পেইড (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={grandTotal.toFixed(0)}
                      value={paidAmountStr}
                      onChange={(e) => setPaidAmountStr(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded-md bg-white text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">
                      বকেয়া বিল (Due ৳)
                    </label>
                    <div
                      className={`text-base sm:text-lg font-black font-mono tabular-nums mt-1 ${
                        dueAmount > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      ৳{dueAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {hasModifiedCartPrice && (
                  <label className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncModifiedPrices}
                      onChange={(e) => setSyncModifiedPrices(e.target.checked)}
                      className="rounded border-amber-400 text-teal-700"
                    />
                    <span>
                      ইনভয়েসে পরিবর্তিত ওষুধের নতুন দর মূল ক্যাটালগ ও ইনভেন্টরিতেও আপডেট করুন
                    </span>
                  </label>
                )}

                {/* Step 4 Footer Navigation & Submit */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSaleStep(3)}
                    className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>⬅ ধাপ ৩ (ওষুধ ও ডোজ)</span>
                  </button>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPreviewCurrentSaleInvoice(true)}
                      className="px-3 py-2.5 text-xs font-bold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
                      title="দাম সহ A4 ইনভয়েস প্রিভিউ"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>মেমো (দাম সহ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPreviewCurrentSaleInvoice(false)}
                      className="px-3 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
                      title="দাম ছাড়া ডেলিভারি মেমো প্রিভিউ"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>দাম ছাড়া মেমো</span>
                    </button>

                    <button
                      type="button"
                      disabled={posCart.length === 0 || submittingSale}
                      onClick={async () => {
                        setWalkInName('সরাসরি ক্যাশ কাস্টমার');
                        setSelectedCustomerId('walk-in');
                        setPaymentMethod('cash');
                        setPaidAmountStr(grandTotal.toString());
                        await submitSaleWithMode(false);
                      }}
                      className="px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>সরাসরি নগদ বিক্রি</span>
                    </button>

                    <button
                      type="submit"
                      disabled={posCart.length === 0 || submittingSale}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap tabular-nums active:scale-95"
                    >
                      {submittingSale
                        ? 'সংরক্ষণ হচ্ছে...'
                        : isEditingSale
                        ? `এডিট সেভ (${saleInvoiceNo}) ✓`
                        : `বিক্রয় সম্পন্ন (-${totalSaleUnits} পিস) ✓`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
           ALL-IN-ONE TWO-COLUMN LAYOUT (If user switches to All-in-One mode)
           ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left 5 Cols: Custom Product Entry + Quick Medicine Picker for Sale */}
          <div className="lg:col-span-5 p-3.5 sm:p-5 space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const name = saleCustomName.trim();
                if (!name) {
                  saleCustomNameInputRef.current?.focus();
                  return;
                }
                if (isDueEntryItem({ brandName: name, dosageForm: saleCustomForm })) {
                  const dueAmt = parseFloat(saleCustomUnitPrice) || 0;
                  if (dueAmt <= 0) {
                    openDueModal();
                    return;
                  }
                  await onAddCustomToCart({
                    brandName: 'Due',
                    genericName: '',
                    companyName: '',
                    strength: '',
                    dosageForm: 'Due',
                    unitPrice: dueAmt,
                    purchasePrice: 0,
                    qty: 1,
                    saveToCatalog: false,
                    reconcilePreviousInvoices: true,
                    reconcileInvoiceIds: customerDueSummary.invoices.map((inv) => inv.id),
                  });
                  setSaleCustomName('');
                  setSaleCustomStrength('');
                  setSaleCustomUnitPrice('');
                  setSaleCustomPurPrice('');
                  setSaleCustomQty('1');
                  return;
                }
                const unitPrice = Math.max(0.1, parseFloat(saleCustomUnitPrice) || 10);
                const purchasePrice =
                  saleCustomPurPrice.trim() !== ''
                    ? Math.max(0.01, parseFloat(saleCustomPurPrice) || Number((unitPrice * 0.88).toFixed(2)))
                    : Number((unitPrice * 0.88).toFixed(2));
                const qty = Math.max(1, parseInt(saleCustomQty, 10) || 1);

                await onAddCustomToCart({
                  brandName: name,
                  strength: saleCustomStrength.trim(),
                  dosageForm: saleCustomForm,
                  unitPrice,
                  purchasePrice,
                  qty,
                  saveToCatalog: saleCustomSaveCatalog,
                });

                setSaleCustomName('');
                setSaleCustomStrength('');
                setSaleCustomUnitPrice('');
                setSaleCustomPurPrice('');
                setSaleCustomQty('1');
                setTimeout(() => {
                  saleCustomNameInputRef.current?.focus();
                }, 60);
              }}
              className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5 min-w-0">
                  <Plus className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">কাস্টম প্রডাক্ট ও পরিমাণ যোগ করুন</span>
                </div>
                <button
                  type="button"
                  onClick={() => openDueModal()}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] rounded-full cursor-pointer whitespace-nowrap shrink-0"
                >
                  + বকেয়া (Due)
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                <div className="col-span-2 sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    প্রডাক্ট / ওষুধের নাম *
                  </label>
                  <input
                    ref={saleCustomNameInputRef}
                    type="text"
                    required
                    placeholder="যেমন: Napa Extra, Seclo 20"
                    value={saleCustomName}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setSaleCustomName(nextName);
                      if (isDueEntryItem({ brandName: nextName })) {
                        setSaleCustomStrength('');
                        setSaleCustomUnitPrice('');
                        setSaleCustomPurPrice('');
                        setSaleCustomQty('1');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
                  />
                </div>

                {!isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm }) && (
                  <>
                    <div className="col-span-1 sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        শক্তি/সাইজ
                      </label>
                      <input
                        type="text"
                        placeholder="500mg"
                        value={saleCustomStrength}
                        onChange={(e) => setSaleCustomStrength(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        ধরন / Form
                      </label>
                      <select
                        value={saleCustomForm}
                        onChange={(e) => setSaleCustomForm(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
                      >
                        {customProductForms.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="col-span-1 sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    {isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm })
                      ? 'বকেয়া পরিমাণ (৳)'
                      : 'বিক্রয় দর (৳) *'}
                  </label>
                  <input
                    ref={saleCustomPriceInputRef}
                    type="number"
                    step="any"
                    min="0.1"
                    required={!isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm })}
                    placeholder={
                      isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm })
                        ? 'পপআপ'
                        : '12.00'
                    }
                    value={saleCustomUnitPrice}
                    onChange={(e) => setSaleCustomUnitPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
                  />
                </div>

                {!isDueEntryItem({ brandName: saleCustomName, dosageForm: saleCustomForm }) && (
                  <>
                    <div className="col-span-1 sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        ক্রয় দর (৳)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        placeholder="১০.৫৬"
                        value={saleCustomPurPrice}
                        onChange={(e) => setSaleCustomPurPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        পরিমাণ (পিস) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={saleCustomQty}
                        onChange={(e) => setSaleCustomQty(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <label className="inline-flex items-center gap-1.5 text-[11px] text-teal-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saleCustomSaveCatalog}
                    onChange={(e) => setSaleCustomSaveCatalog(e.target.checked)}
                    className="rounded border-teal-400 text-teal-700"
                  />
                  <span>ক্যাটালগ ও স্টকেও সংরক্ষণ করুন</span>
                </label>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>কাস্টম প্রডাক্ট যোগ</span>
                </button>
              </div>
            </form>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={saleSearchInputRef}
                    type="text"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="ওষুধের নাম লিখে সার্চ করুন..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                  {medSearch && (
                    <button
                      type="button"
                      onClick={() => setMedSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="px-2.5 sm:px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4 text-purple-700" />
                    <span className="font-bold hidden sm:inline">বক্স স্ক্যানার</span>
                  </button>
                )}
              </div>
              {medexSaleSearching && medSearch.trim().length >= 2 && (
                <div className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-teal-600 border-t-transparent animate-spin shrink-0" />
                  <span>medex.com.bd থেকে সরাসরি অনুসন্ধান ও লাইভ বিক্রয়মূল্য যাচাই হচ্ছে...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {quickSearchSaleMedicines.map((med) => {
                const st = getStockForMed(med);
                const inCart = posCart.find((c) => c.medicineId === med.id)?.qty || 0;
                const purPrice = getMedPurchasePrice(med);
                return (
                  <div
                    key={med.id}
                    className="p-3 border border-slate-200 rounded-md hover:border-teal-600 transition-colors flex flex-col justify-between gap-2 bg-white"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {med.brandName}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            {med.strength}
                          </span>
                        </span>
                        <span className="font-mono tabular-nums text-xs font-bold text-teal-700">
                          বিক্রয়: ৳{formatCleanMoney(med.unitPrice)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center justify-between">
                        <span>{med.genericName} · {med.dosageForm}</span>
                        <span className="font-mono text-[11px] font-semibold text-indigo-700">
                          ক্রয়: ৳{formatCleanMoney(purPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-xs font-mono tabular-nums">
                        {st > 0 ? (
                          <span className="text-slate-700 font-semibold">
                            স্টক: {st} পিস
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">স্টক: ০ পিস</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onAddToCart(med, 1)}
                          className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                        >
                          +১ পিস
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddToCart(med, med.unitsPerStrip || 10)}
                          className="px-2 py-1 text-xs font-medium bg-teal-700 hover:bg-teal-800 text-white rounded cursor-pointer flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          +১ পাতা
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 7 Cols: Active Sales Invoice Memo */}
          <div className="lg:col-span-7 p-3.5 sm:p-5 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-teal-900">
                    বিক্রয় ইনভয়েস ও ক্যাশ মেমো
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    অপারেটর: <strong>{activeStaff.roleTitle === 'owner' ? 'Owner' : activeStaff.name}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-lg cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                    title="দাম সহ সম্পূর্ণ বিক্রয় ইনভয়েস প্রিভিউ"
                  >
                    <Printer className="w-3 h-3" />
                    <span>মেমো (দাম সহ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                    title="দাম ছাড়া ডেলিভারি চালান প্রিভিউ (টাকার কথা ও কিউআরে টাকা থাকবে না)"
                  >
                    <FileText className="w-3 h-3" />
                    <span>দাম ছাড়া মেমো</span>
                  </button>
                  {posCart.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs text-red-600 hover:underline cursor-pointer ml-1 whitespace-nowrap shrink-0"
                    >
                      খালি করুন
                    </button>
                  )}
                </div>
              </div>

              {/* Sale Cart Items Table */}
              <div className="my-3 max-h-[290px] overflow-auto border border-slate-200 rounded-xl bg-white">
                {posCart.length === 0 ? (
                  <div className="py-10 px-4 text-center text-xs text-slate-500">
                    বিক্রয় ইনভয়েসে এখনো কোনো ওষুধ যোগ করা হয়নি।
                  </div>
                ) : (
                  <table className="w-full min-w-[500px] text-left border-collapse">
                    <thead className="bg-teal-50/70 border-b border-slate-200 text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="py-2 px-3">ওষুধের নাম</th>
                        <th className="py-2 px-1.5 text-center">ক্রয় দর (৳)</th>
                        <th className="py-2 px-1.5 text-center">বিক্রয় দর (৳)</th>
                        <th className="py-2 px-2 text-center">পরিমাণ</th>
                        <th className="py-2 px-3 text-right">মোট (৳)</th>
                        <th className="py-2 px-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {orderCartItemsWithDueLast(posCart).map((item, idx) => {
                        const isDue = isDueEntryItem(item);
                        const purPriceVal = isDue
                          ? 0
                          : typeof item.purchasePrice === 'number' && item.purchasePrice > 0
                          ? item.purchasePrice
                          : Number((item.unitPrice * 0.88).toFixed(2));
                        const lineTotal = item.unitPrice * item.qty;
                        return (
                          <tr key={item.medicineId} className={isDue ? 'bg-rose-50/40' : ''}>
                            <td className="py-2 px-3">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-mono tabular-nums text-xs font-bold text-slate-500">
                                  {idx + 1}.
                                </span>
                                <span className={`font-semibold text-xs ${isDue ? 'text-rose-950 font-bold' : 'text-slate-900'}`}>
                                  {isDue ? 'Due' : `${item.brandName} ${item.strength}`}
                                </span>
                              </div>
                              {!isDue && (item.dosageSchedule || item.dosageDuration) && (
                                <div className="text-[10px] font-mono text-rose-800">
                                  ডোজ: {item.dosageSchedule || ''} {item.dosageDuration || ''}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-1.5 text-center text-xs font-mono tabular-nums">
                              {isDue ? '—' : `৳${formatCleanMoney(purPriceVal)}`}
                            </td>
                            <td className="py-2 px-1.5 text-center text-xs font-mono tabular-nums font-bold">
                              {isDue ? (
                                <button
                                  type="button"
                                  onClick={() => openDueModal(item)}
                                  className="underline decoration-dotted text-rose-800 cursor-pointer"
                                >
                                  ৳{formatCleanMoney(item.unitPrice)}
                                </button>
                              ) : (
                                `৳${formatCleanMoney(item.unitPrice)}`
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-xs font-mono tabular-nums">
                              {isDue ? '—' : item.qty}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 text-xs">
                              {formatCleanMoney(lineTotal)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => onRemoveFromCart(item.medicineId)}
                                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Patient & Seal Bar */}
              <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2 mb-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-700">রোগীর নাম:</label>
                    <input
                      type="text"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="রোগীর নাম"
                      className="w-full px-2 py-1.5 text-xs bg-white border border-pink-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">বয়স:</label>
                    <input
                      type="text"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="28Y"
                      className="w-full px-2 py-1.5 text-xs bg-white border border-pink-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">লিঙ্গ:</label>
                    <select
                      value={patientSex}
                      onChange={(e) => setPatientSex(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-pink-300 rounded-md"
                    >
                      <option value="Male">পুরুষ (Male)</option>
                      <option value="Female">মহিলা (Female)</option>
                      <option value="Other">অন্যান্য (Other)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Selection & Sale Payment Form */}
            <form onSubmit={handleSaleSubmit} className="space-y-3 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] text-slate-500">মোট বিল (৳)</label>
                  <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                    ৳{cartSubTotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">ছাড় (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 text-xs font-mono tabular-nums border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">নগদ জমা (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={grandTotal.toFixed(0)}
                    value={paidAmountStr}
                    onChange={(e) => setPaidAmountStr(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 text-xs font-mono tabular-nums border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs space-x-3 font-mono tabular-nums">
                  <span className="text-slate-700">
                    নিট প্রদেয়: <strong className="text-slate-900">৳{grandTotal.toFixed(2)}</strong>
                  </span>
                  <span className={dueAmount > 0 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                    বাকি: ৳{dueAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={posCart.length === 0 || submittingSale}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 tabular-nums"
                  >
                    {submittingSale
                      ? 'সংরক্ষণ হচ্ছে...'
                      : isEditingSale
                      ? `এডিট সেভ (${saleInvoiceNo}) ✓`
                      : `বিক্রয় সম্পন্ন (-${totalSaleUnits} পিস) ✓`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Due (বকেয়া) Amount Entry Popup Modal */}
      {showDueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-rose-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-rose-950">
                {editingDueMedId ? 'বকেয়া (Due) টাকা সংশোধন করুন' : 'বকেয়া (Due) টাকা যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDueModal(false);
                  setDueAmountInput('');
                  setEditingDueMedId(null);
                  setDueSelectedInvoiceIds([]);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDueModalSubmit} className="space-y-3 text-xs">
              {(selectedCustomerObj || walkInName.trim()) && (
                <div className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                  ক্রেতা: <strong className="text-slate-900">{selectedCustomerObj?.name || walkInName}</strong>
                </div>
              )}

              {customerDueSummary.suggestedDue > 0 ? (
                <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-lg space-y-2">
                  <div className="text-[11px] font-bold text-rose-950">
                    পূর্বের বকেয়া সাজেস্ট (ক্লিক করলে টাকার অংকে বসবে):
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDueAmountInput(String(customerDueSummary.suggestedDue));
                      setDueSelectedInvoiceIds(customerDueSummary.invoices.map((t) => t.id));
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-white hover:bg-rose-100 border border-rose-300 rounded font-bold text-rose-900 cursor-pointer flex items-center justify-between"
                  >
                    <span>
                      মোট পূর্বের বকেয়া{' '}
                      {customerDueSummary.invoices.length > 0
                        ? `(${customerDueSummary.invoices.length}টি ইনভয়েস)`
                        : '(লেজার)'}
                    </span>
                    <span className="font-mono">৳{formatCleanMoney(customerDueSummary.suggestedDue)}</span>
                  </button>
                  {customerDueSummary.invoices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {customerDueSummary.invoices.map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => {
                            setDueAmountInput(String(inv.dueAmount));
                            setDueSelectedInvoiceIds([inv.id]);
                          }}
                          className="px-2 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded font-mono text-[10.5px] text-slate-800 cursor-pointer"
                        >
                          {inv.invoiceNo} ({inv.dateStr}) · ৳{formatCleanMoney(inv.dueAmount)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                customersWithDue.length > 0 && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1.5">
                    <div className="text-[11px] font-bold text-amber-950">
                      পূর্বের বকেয়া থাকা ক্রেতা (ক্লিক করলে ক্রেতা ও টাকা সেট হবে):
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                      {customersWithDue.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setDueAmountInput(String(c.totalDue));
                          }}
                          className="w-full text-left px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[11px] font-semibold text-slate-900 cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="font-mono font-bold text-rose-700 shrink-0">
                            ৳{formatCleanMoney(c.totalDue)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  autoFocus
                  value={dueAmountInput}
                  onChange={(e) => setDueAmountInput(e.target.value)}
                  placeholder="টাকার পরিমাণ লিখুন"
                  className="w-full px-3 py-2 border border-rose-300 rounded-lg bg-white font-mono font-bold text-base text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>

              {customerDueSummary.invoices.length > 0 && (
                <label className="flex items-start gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg cursor-pointer select-none text-[11px] text-emerald-950">
                  <input
                    type="checkbox"
                    checked={dueReconcileEnabled}
                    onChange={(e) => setDueReconcileEnabled(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>
                    <strong>পূর্বের ইনভয়েস সহ সমন্বয় করুন</strong> (
                    {(dueSelectedInvoiceIds.length > 0
                      ? customerDueSummary.invoices.filter((t) => dueSelectedInvoiceIds.includes(t.id))
                      : customerDueSummary.invoices
                    )
                      .map((t) => t.invoiceNo)
                      .join(', ')}
                    ) — ইনভয়েস সম্পন্ন হলে পূর্বের বকেয়া স্বয়ংক্রিয়ভাবে সমন্বিত হবে।
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDueModal(false);
                    setDueAmountInput('');
                    setEditingDueMedId(null);
                    setDueSelectedInvoiceIds([]);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-xs"
                >
                  {editingDueMedId ? 'আপডেট করুন' : 'কার্টে যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
