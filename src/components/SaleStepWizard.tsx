import React, { useMemo } from 'react';
import {
  Activity,
  ArrowDownRight,
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
}

export const SaleStepWizard: React.FC<SaleStepWizardProps> = ({
  saleStep,
  setSaleStep,
  saleWorkflowMode,
  setSaleWorkflowMode,
  walkInName,
  setWalkInName,
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
}) => {
  const hasAnyClinicalData = useMemo(() => {
    if (selectedSeal === 'iqbal_pharmacy') {
      return Object.values(pharmacyFindings).some((v) => v && v.trim().length > 0);
    }
    return Object.values(dentalFindings).some((v) => v && v.trim().length > 0);
  }, [selectedSeal, pharmacyFindings, dentalFindings]);

  return (
    <div className="bg-slate-50/50">
      {/* Top Workflow Navigator Bar */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs uppercase tracking-wider text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-teal-700" />
              <span>বিক্রয় ইনভয়েস ও মেমো তৈরি</span>
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (ছবি ১, ২, ৩, ৪ একটির পর অন্যটি ক্রমানুসারে পূরণ করুন)
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSaleWorkflowMode('step_by_step')}
              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                saleWorkflowMode === 'step_by_step'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ধাপভিত্তিক মোড (১➜২➜৩➜৪)
            </button>
            <button
              type="button"
              onClick={() => setSaleWorkflowMode('all_in_one')}
              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
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
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              saleStep === 1
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : walkInName.trim() || patientAge
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                    saleStep === 1 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ১
                </span>
                <span>রোগীর তথ্য ও চেম্বার</span>
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
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              saleStep === 2
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : hasAnyClinicalData
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                    saleStep === 2 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ২
                </span>
                <span>ক্লিনিক্যাল ও ভাইটালস</span>
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
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              saleStep === 3
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : posCart.length > 0
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                    saleStep === 3 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ৩
                </span>
                <span>ওষুধ ও ডোজ নির্বাচন</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  saleStep === 3 ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                {posCart.length > 0 ? `${posCart.length}টি ওষুধ যুক্ত আছে` : 'সার্চ, কাস্টম ও সেবনবিধি'}
              </div>
            </div>
            {posCart.length > 0 && saleStep !== 3 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-teal-800 text-white rounded font-mono shrink-0">
                {posCart.length}
              </span>
            )}
          </button>

          {/* Step 4 Tab Button */}
          <button
            type="button"
            onClick={() => setSaleStep(4)}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              saleStep === 4
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                : posCart.length > 0
                ? 'bg-teal-50/70 border-teal-300 text-teal-950 hover:bg-teal-100/60'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                    saleStep === 4 ? 'bg-white text-teal-900' : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  ৪
                </span>
                <span>বিক্রয় মেমো ও ফাইনাল বিল</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  saleStep === 4 ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                মোট: ৳{grandTotal.toFixed(2)} {dueAmount > 0 ? `(বাকি ৳${dueAmount.toFixed(0)})` : ''}
              </div>
            </div>
            {posCart.length > 0 && saleStep !== 4 && (
              <span className="font-mono text-xs font-bold text-teal-800 shrink-0">
                ৳{grandTotal.toFixed(0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area based on saleWorkflowMode */}
      {saleWorkflowMode === 'step_by_step' ? (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
          {/* =========================================================================
              STEP 1: PATIENT INFO & CHAMBER SELECTION (ছবি ১)
              ========================================================================= */}
          {saleStep === 1 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs">
                      ১
                    </span>
                    <span>ধাপ ১: রোগীর তথ্য ও চেম্বার নির্বাচন (Patient Info & Chamber)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    রোগীর নাম, বয়স, লিঙ্গ লিখুন এবং প্রেসক্রিপশন মেমোতে প্রদর্শনের জন্য নিচের চেম্বার নির্বাচন করুন
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  মেমো নং: {saleInvoiceNo}
                </span>
              </div>

              {/* Customer & Invoice Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    কাস্টমার / লেজার খাতা:
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                  >
                    <option value="walk-in">সাধারণ ক্রেতা (নগদ / Walk-in)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — পূর্বের বাকি: ৳{c.totalDue}
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
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    তারিখ ও পেমেন্ট মাধ্যম:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      required
                      value={saleDateStr}
                      onChange={(e) => setSaleDateStr(e.target.value)}
                      aria-label="বিক্রয় তারিখ"
                      className="w-1/2 px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                    />
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as Transaction['paymentMethod'])
                      }
                      aria-label="পেমেন্ট মাধ্যম"
                      className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                    >
                      <option value="cash">নগদ (Cash)</option>
                      <option value="bkash">বিকাশ</option>
                      <option value="nagad">নগদ MFS</option>
                      <option value="card">কার্ড</option>
                      <option value="due">বাকি (Due)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Patient Name, Age, Sex (Pink / Rose Theme matching Screenshot 1) */}
              <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-pink-700" />
                    <span>রোগীর ব্যক্তিগত তথ্য (Patient Personal Information):</span>
                  </span>
                  <span className="text-[11px] font-mono text-pink-800">
                    মেমোর উপরের ডানপাশে ও সিল বক্সে প্রদর্শিত হবে
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedCustomerId === 'walk-in' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Name (রোগীর নাম):
                      </label>
                      <input
                        type="text"
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="যেমন: মো: রহিম / রোগীর নাম"
                        className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded-md focus:border-pink-600 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Name (রোগীর নাম):
                      </label>
                      <div className="px-3 py-2 text-xs bg-white border border-pink-200 rounded-md font-bold text-slate-900 truncate">
                        {customers.find((c) => c.id === selectedCustomerId)?.name || 'নাম'}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Age (বয়স):
                    </label>
                    <input
                      type="text"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="যেমন: 28Y / ৩০ বছর"
                      className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded-md focus:border-pink-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Sex (লিঙ্গ):
                    </label>
                    <select
                      value={patientSex}
                      onChange={(e) => setPatientSex(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded-md focus:border-pink-600 focus:outline-none font-medium"
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>নিচের সিল ও চেম্বার নির্বাচন করুন (ইনভয়েস মেমোতে প্রদর্শিত ঠিকানা):</span>
                  </label>
                  <span className="text-[11px] text-teal-800 font-semibold">
                    ডেন্টিস্ট: ইকবাল মাহমুদ (DMTD, LMAF, RMP, Pharmacist)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
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
                      className="text-teal-700 focus:ring-teal-600 mt-1"
                    />
                    <div>
                      <div className="font-bold text-xs text-teal-950">১. ইকবাল ফার্মেসী</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।
                      </div>
                      <div className="text-[10px] text-teal-700 mt-1">
                        (ফার্মেসী প্রেসক্রিপশন ও ডেলিভারি মেমো)
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
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
                      className="text-teal-700 focus:ring-teal-600 mt-1"
                    />
                    <div>
                      <div className="font-bold text-xs text-teal-950">২. ইকবাল ডেন্টাল কেয়ার-১</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর।
                      </div>
                      <div className="text-[10px] text-teal-700 mt-1">
                        (চন্দ্রগঞ্জ শাখা চেম্বার)
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
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
                      className="text-teal-700 focus:ring-teal-600 mt-1"
                    />
                    <div>
                      <div className="font-bold text-xs text-teal-950">
                        ৩. ইকবাল ডেন্টাল কেয়ার-২ (ওদারহাট ডেন্টাল কেয়ার)
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        উদয় সাধুরহাট,পশ্চিম বাজার, পানা মিয়া স্কুল গেইট (ইউনিয়ন পরিষদ রোড), সদর,নোয়াখালী।
                      </div>
                      <div className="text-[10px] text-teal-700 mt-1">
                        (নোয়াখালী সদর শাখা চেম্বার)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 1 Footer Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500 font-medium">
                  পরবর্তী ধাপে রোগীর রক্তচাপ, ডায়াবেটিস, জ্বর বা ডেন্টাল পর্যবেক্ষণ পূরণ করুন
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaleStep(3)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-teal-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    সরাসরি ওষুধ নির্বাচন (ধাপ ৩) ⏩
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleStep(2)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <span>পরবর্তী ধাপ: ক্লিনিক্যাল পর্যবেক্ষণ (ধাপ ২)</span>
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
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs">
                      ২
                    </span>
                    <span>
                      {selectedSeal === 'iqbal_pharmacy'
                        ? 'ধাপ ২: ফার্মেসী ক্লিনিক্যাল পর্যবেক্ষণ ও ভাইটালস (Pharmacy Vitals)'
                        : 'ধাপ ২: ডেন্টাল ক্লিনিক্যাল পর্যবেক্ষণ ও দাঁতের লক্ষণ (Dental Examination)'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedSeal === 'iqbal_pharmacy'
                      ? 'রোগীর রক্তচাপ, সুগার, জ্বর, ওজন, লক্ষণ ও প্রাথমিক পরামর্শ লিখুন'
                      : 'দাঁতের সমস্যা, ক্যারিস, স্কেলিং, আরসিটি বা এক্সট্রাকশন তথ্য লিখুন'}
                  </p>
                </div>
                <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  রোগী: <strong>{walkInName.trim() || 'সাধারণ ক্রেতা'}</strong> ({patientAge || 'বয়স'})
                </span>
              </div>

              {/* Pharmacy Clinical Vitals */}
              {selectedSeal === 'iqbal_pharmacy' ? (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-700" />
                      <span>ক্লিনিক্যাল ভাইটালস তথ্য (মেমোর উপরের টেবিলে প্রদর্শিত হবে):</span>
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
                      className="text-[11px] text-red-600 hover:underline cursor-pointer"
                    >
                      সব তথ্য খালি করুন
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    {[
                      { key: 'রক্তচাপ (BP)', icon: Activity, placeholder: 'যেমন: 120/80 mmHg' },
                      { key: 'ডায়াবেটিস (RBS)', icon: Heart, placeholder: 'যেমন: 6.5 mmol/L' },
                      { key: 'তাপমাত্রা (Temp)', icon: Thermometer, placeholder: 'যেমন: 98.6 °F' },
                      { key: 'ওজন (Weight)', placeholder: 'যেমন: 65 kg' },
                      { key: 'নাড়ির গতি (Pulse)', placeholder: 'যেমন: 72 bpm' },
                      { key: 'প্রধান লক্ষণ (Symptoms)', placeholder: 'যেমন: সর্দি, কাশি, গ্যাস্ট্রিক' },
                      { key: 'প্রাথমিক পরামর্শ (Advice)', placeholder: 'যেমন: পর্যাপ্ত পানি ও বিশ্রাম' },
                      { key: 'পরীক্ষা-নিরীক্ষা (Inv.)', placeholder: 'যেমন: CBC, RBS, Urine R/E' },
                    ].map((field) => {
                      const val = pharmacyFindings[field.key] || '';
                      const IconComp = field.icon;
                      return (
                        <div key={field.key} className="bg-white p-2.5 rounded-lg border border-teal-200 shadow-2xs">
                          <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1">
                            {IconComp && <IconComp className="w-3.5 h-3.5 text-teal-600" />}
                            <span>{field.key}:</span>
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
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-teal-600 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Dental Clinical Findings */
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>🦷 ডেন্টাল ক্লিনিক্যাল পর্যবেক্ষণ (Clinical Findings & Dental Examination):</span>
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
                      className="text-[11px] text-red-600 hover:underline cursor-pointer"
                    >
                      সব তথ্য খালি করুন
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
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
                        <div key={itemKey} className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                          <label className="block text-[11px] font-bold text-slate-800 mb-1">
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
                            placeholder={`${itemKey} বিবরণ / দাঁতের নং...`}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-amber-600 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2 Footer Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSaleStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>⬅ পূর্ববর্তী ধাপ: রোগীর তথ্য (ধাপ ১)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleStep(3)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <span>পরবর্তী ধাপ: ওষুধ ও ডোজ নির্বাচন (ধাপ ৩)</span>
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
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs">
                        ৩
                      </span>
                      <span>ধাপ ৩: ওষুধ সার্চ, কাস্টম আইটেম ও সেবনবিধি/ডোজ নির্বাচন</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ওষুধ সার্চ করে যোগ করুন অথবা কাস্টম ড্রাগ বানিয়ে ডোজ ও নিয়ম নির্ধারণ করুন (1+0+1, 7 Days)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-teal-100 text-teal-900 font-bold text-xs rounded-full font-mono">
                      {posCart.length}টি ওষুধ নির্বাচিত
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
                  className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-teal-700" />
                      <span>কাস্টম ওষুধ বা পণ্যের নাম, দাম ও পরিমাণ দিয়ে বিলে যোগ করুন:</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        প্রডাক্ট / ওষুধের নাম *
                      </label>
                      <input
                        ref={saleCustomNameInputRef}
                        type="text"
                        required
                        placeholder="যেমন: Napa Extra, Seclo"
                        value={saleCustomName}
                        onChange={(e) => setSaleCustomName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        শক্তি/সাইজ
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: 500mg"
                        value={saleCustomStrength}
                        onChange={(e) => setSaleCustomStrength(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        ধরন / Form
                      </label>
                      <select
                        value={saleCustomForm}
                        onChange={(e) => setSaleCustomForm(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-teal-600 focus:outline-none"
                      >
                        {customProductForms.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        বিক্রয় দর (৳) *
                      </label>
                      <input
                        ref={saleCustomPriceInputRef}
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        placeholder="12.00"
                        value={saleCustomUnitPrice}
                        onChange={(e) => setSaleCustomUnitPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
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
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
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
                      className="px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ বিলে যুক্ত করুন</span>
                    </button>
                  </div>
                </form>

                {/* Medicine Search with Live Auto-suggestions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={saleSearchInputRef}
                        type="text"
                        value={medSearch}
                        onChange={(e) => setMedSearch(e.target.value)}
                        placeholder="ওষুধের নাম লিখে দ্রুত সার্চ করুন (যেমন: Napa, Seclo, Noret, Femicon, Ciprocin)..."
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
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-all shadow-2xs"
                      >
                        <Camera className="w-4 h-4 text-purple-700" />
                        <span className="hidden sm:inline">বক্স স্ক্যানার</span>
                      </button>
                    )}
                  </div>

                  {/* Search Results Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {quickSearchSaleMedicines.map((med) => {
                      const st = getStockForMed(med);
                      const inCart = posCart.find((c) => c.medicineId === med.id)?.qty || 0;
                      const purPrice = getMedPurchasePrice(med);
                      return (
                        <div
                          key={med.id}
                          className="p-2.5 border border-slate-200 rounded-lg hover:border-teal-600 transition-colors flex flex-col justify-between gap-1.5 bg-white shadow-2xs"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {med.brandName}{' '}
                                <span className="font-normal text-slate-500">
                                  {med.strength}
                                </span>
                              </span>
                              <span className="font-mono text-xs font-bold text-teal-800 shrink-0">
                                ৳{formatCleanMoney(med.unitPrice)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                              <span>{med.genericName} · {med.dosageForm}</span>
                              <span className="font-mono text-[10px] text-indigo-700">
                                ক্রয়: ৳{formatCleanMoney(purPrice)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                            <div className="text-[11px] font-mono">
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
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onAddToCart(med, 1)}
                                className="px-2 py-0.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                              >
                                +১ পিস
                              </button>
                              <button
                                type="button"
                                onClick={() => onAddToCart(med, med.unitsPerStrip || 10)}
                                className="px-2 py-0.5 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded cursor-pointer flex items-center gap-1"
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
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-700" />
                    <h4 className="text-xs font-bold text-slate-900">
                      নির্বাচিত ওষুধের ডোজ ও খাওয়ার নিয়মাবলী (Dosage Schedule & Duration):
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    (চিপসে ক্লিক করে ১-ক্লিকে ডোজ বসান: 1+0+1, 7 Days)
                  </span>
                </div>

                {posCart.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    ওপরের সার্চ বা কাস্টম ফর্ম থেকে ওষুধ যোগ করলে এখানে ডোজ ও নিয়ম নির্ধারণ করার অপশন আসবে।
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posCart.map((item, idx) => (
                      <div
                        key={item.medicineId}
                        className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-rose-900 bg-rose-100 w-5 h-5 rounded-full flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.dosageForm} {item.brandName} {item.strength}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              ({item.qty} পিস · ৳{formatCleanMoney(item.unitPrice * item.qty)})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.medicineId)}
                            className="text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            বাদ দিন ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1 items-center">
                          <div className="md:col-span-4 flex items-center gap-1.5">
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
                              placeholder="যেমন: 1+0+1"
                              className="w-full px-2 py-1 text-xs font-mono font-bold text-red-700 bg-white border border-rose-300 rounded focus:border-red-500 focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-4 flex items-center gap-1.5">
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
                              placeholder="যেমন: 7 Days / চলবে"
                              className="w-full px-2 py-1 text-xs font-mono text-slate-800 bg-white border border-rose-300 rounded focus:border-red-500 focus:outline-none"
                            />
                          </div>

                          {/* Preset Chips (Screenshot 3) */}
                          <div className="md:col-span-4 flex flex-wrap items-center gap-1">
                            {['1+0+1', '1+1+1', '1+0+0', '0+0+1'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  onUpdateCartItemDetails(item.medicineId, {
                                    dosageSchedule: preset,
                                  })
                                }
                                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors ${
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
                                className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
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
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3 Footer Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 bg-white p-4 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSaleStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>⬅ পূর্ববর্তী ধাপ: ক্লিনিক্যাল পর্যবেক্ষণ (ধাপ ২)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleStep(4)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <span>পরবর্তী ধাপ: বিক্রয় মেমো ও ফাইনাল বিল (ধাপ ৪)</span>
                  <span>➜</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 4: POS MEMO TABLE, FINANCIAL TOTALS & SUBMIT (ছবি ৪)
              ========================================================================= */}
          {saleStep === 4 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs">
                      ৪
                    </span>
                    <span>ধাপ ৪: বিক্রয় ইনভয়েস মেমো, স্টক হ্রাস ও ফাইনাল বিল সম্পন্ন</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ওষুধের বিক্রয় দর, ক্রয় দর, পরিমাণ ও স্টক হ্রাসের টিক নিশ্চিত করুন এবং মেমো সম্পন্ন করুন
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-700" />
                    <span>A4 ইনভয়েস (দাম সহ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(false)}
                    className="px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>দাম ছাড়া মেমো</span>
                  </button>
                  {posCart.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      মেমো খালি করুন
                    </button>
                  )}
                </div>
              </div>

              {/* Sale Items Table (Screenshot 4) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
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
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-teal-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">প্রডাক্ট / ওষুধের নাম, সেবনবিধি ও স্টক হ্রাস</th>
                        <th className="py-2.5 px-2 text-center">ক্রয় দর (৳)</th>
                        <th className="py-2.5 px-2 text-center">বিক্রয় দর (৳)</th>
                        <th className="py-2.5 px-2 text-center">পরিমাণ</th>
                        <th className="py-2.5 px-3 text-right">মোট (৳)</th>
                        <th className="py-2.5 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {posCart.map((item, idx) => {
                        const priceChanged =
                          item.originalUnitPrice !== undefined &&
                          Math.abs(item.unitPrice - item.originalUnitPrice) > 0.001;
                        const purPriceVal =
                          typeof item.purchasePrice === 'number' && item.purchasePrice > 0
                            ? item.purchasePrice
                            : Number((item.unitPrice * 0.88).toFixed(2));
                        const lineTotal = item.unitPrice * item.qty;
                        const rawCurrentStock = getStockForMed(item);
                        const oldEditedQty = isEditingSale ? getOldEditedQtyForMed(item) : 0;
                        const currentStock = rawCurrentStock + oldEditedQty;
                        const remainingStock = Math.max(0, currentStock - item.qty);

                        return (
                          <tr key={item.medicineId} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-slate-500">
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
                                <div className="text-[11px] font-mono text-rose-800 mt-1 flex items-center gap-2">
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
                                      : '❌ স্টকে কমবে না (শুধু ইনভয়েস)'}
                                  </span>
                                </label>

                                {item.updateStock !== false && (
                                  <span className="text-[10.5px] font-mono text-slate-500">
                                    স্টক: {currentStock} ➜ <strong>{remainingStock} পিস</strong>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Purchase Price Input */}
                            <td className="py-2.5 px-2 text-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={purPriceVal}
                                onChange={(e) =>
                                  onUpdateCartPurchasePrice(
                                    item.medicineId,
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className="w-20 text-center py-1 px-1 text-xs font-mono tabular-nums border border-slate-300 rounded bg-white text-indigo-950 font-semibold"
                              />
                            </td>

                            {/* Selling Price Input */}
                            <td className="py-2.5 px-2 text-center">
                              <input
                                type="number"
                                step="0.01"
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
                                  className="w-14 text-center py-1 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded"
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

                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 text-xs">
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

              {/* Financial Totals Calculation Box */}
              <form onSubmit={handleSaleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-teal-50/60 p-4 rounded-xl border border-teal-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      মোট বিক্রয় বিল (৳)
                    </label>
                    <div className="text-lg font-black font-mono tabular-nums text-slate-900 mt-1">
                      ৳{cartSubTotal.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      ছাড় / ডিসকাউন্ট (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discountStr}
                      onChange={(e) => setDiscountStr(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      নগদ জমা / পেইড (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={grandTotal.toFixed(0)}
                      value={paidAmountStr}
                      onChange={(e) => setPaidAmountStr(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono font-bold tabular-nums border border-slate-300 rounded-md bg-white text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      বকেয়া বিল (Due ৳)
                    </label>
                    <div
                      className={`text-lg font-black font-mono tabular-nums mt-1 ${
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
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSaleStep(3)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⬅ পূর্ববর্তী ধাপ: ওষুধ ও ডোজ পরিবর্তন (ধাপ ৩)</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPreviewCurrentSaleInvoice(true)}
                      className="px-3.5 py-2.5 text-xs font-bold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="দাম সহ A4 ইনভয়েস প্রিভিউ"
                    >
                      <Printer className="w-4 h-4 text-teal-700" />
                      <span>মেমো (দাম সহ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPreviewCurrentSaleInvoice(false)}
                      className="px-3.5 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="দাম ছাড়া ডেলিভারি মেমো প্রিভিউ"
                    >
                      <FileText className="w-4 h-4 text-amber-700" />
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
                      className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5 shadow-xs active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ সরাসরি নগদ বিক্রি</span>
                    </button>

                    <button
                      type="submit"
                      disabled={posCart.length === 0 || submittingSale}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap active:scale-95"
                    >
                      {submittingSale
                        ? 'বিক্রয় ইনভয়েস সংরক্ষণ হচ্ছে...'
                        : isEditingSale
                        ? `এডিটকৃত ইনভয়েস সংরক্ষণ ও স্টক সমন্বয় (${saleInvoiceNo}) ✓`
                        : `বিক্রয় সম্পন্ন ও স্টক কমান (-${totalSaleUnits} পিস) ✓`}
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
          <div className="lg:col-span-5 p-5 space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const name = saleCustomName.trim();
                if (!name) {
                  saleCustomNameInputRef.current?.focus();
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
              className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-md space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-teal-700" />
                    <span>কাস্টম প্রডাক্ট, দাম ও পরিমাণ দিয়ে বিক্রয় বিল তৈরি</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    প্রডাক্ট / ওষুধের নাম *
                  </label>
                  <input
                    ref={saleCustomNameInputRef}
                    type="text"
                    required
                    placeholder="যেমন: Napa Extra, Seclo 20"
                    value={saleCustomName}
                    onChange={(e) => setSaleCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    শক্তি/সাইজ
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 500mg"
                    value={saleCustomStrength}
                    onChange={(e) => setSaleCustomStrength(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    ধরন / Form
                  </label>
                  <select
                    value={saleCustomForm}
                    onChange={(e) => setSaleCustomForm(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:border-teal-600 focus:outline-none"
                  >
                    {customProductForms.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    বিক্রয় দর (৳) *
                  </label>
                  <input
                    ref={saleCustomPriceInputRef}
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    placeholder="12.00"
                    value={saleCustomUnitPrice}
                    onChange={(e) => setSaleCustomUnitPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    ক্রয় দর (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="১০.৫৬"
                    value={saleCustomPurPrice}
                    onChange={(e) => setSaleCustomPurPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
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
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded focus:border-teal-600 focus:outline-none"
                  />
                </div>
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
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ বিক্রয় বিলে কাস্টম প্রডাক্ট যুক্ত করুন</span>
                </button>
              </div>
            </form>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={saleSearchInputRef}
                    type="text"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="ওষুধের নাম লিখে সার্চ করুন..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-teal-600 focus:outline-none"
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
                    className="px-2.5 sm:px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4 text-purple-700" />
                    <span className="font-bold hidden sm:inline">(স্ক্যান) বক্স স্ক্যানার</span>
                  </button>
                )}
              </div>
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
          <div className="lg:col-span-7 p-5 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-teal-900">
                    বিক্রয় ইনভয়েস ও ক্যাশ মেমো (Sales Invoice — স্টক কমবে)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    অপারেটর: <strong>{activeStaff.roleTitle === 'owner' ? 'Owner' : activeStaff.name}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded cursor-pointer flex items-center gap-1"
                    title="দাম সহ সম্পূর্ণ বিক্রয় ইনভয়েস প্রিভিউ"
                  >
                    <Printer className="w-3 h-3" />
                    <span>মেমো (দাম সহ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewCurrentSaleInvoice(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded cursor-pointer flex items-center gap-1"
                    title="দাম ছাড়া ডেলিভারি চালান প্রিভিউ (টাকার কথা ও কিউআরে টাকা থাকবে না)"
                  >
                    <FileText className="w-3 h-3" />
                    <span>দাম ছাড়া মেমো</span>
                  </button>
                  {posCart.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs text-red-600 hover:underline cursor-pointer ml-1"
                    >
                      খালি করুন
                    </button>
                  )}
                </div>
              </div>

              {/* Sale Cart Items Table */}
              <div className="my-3 max-h-[290px] overflow-y-auto border border-slate-200 rounded-md bg-white">
                {posCart.length === 0 ? (
                  <div className="py-10 px-4 text-center text-xs text-slate-500">
                    বিক্রয় ইনভয়েসে এখনো কোনো ওষুধ যোগ করা হয়নি।
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-teal-50/70 border-b border-slate-200 text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="py-2 px-3">প্রডাক্ট / ওষুধের নাম ও স্টক হ্রাস</th>
                        <th className="py-2 px-1.5 text-center">ক্রয় দর (৳)</th>
                        <th className="py-2 px-1.5 text-center">বিক্রয় দর (৳)</th>
                        <th className="py-2 px-2 text-center">পরিমাণ</th>
                        <th className="py-2 px-3 text-right">মোট (৳)</th>
                        <th className="py-2 px-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {posCart.map((item, idx) => {
                        const purPriceVal =
                          typeof item.purchasePrice === 'number' && item.purchasePrice > 0
                            ? item.purchasePrice
                            : Number((item.unitPrice * 0.88).toFixed(2));
                        const lineTotal = item.unitPrice * item.qty;
                        return (
                          <tr key={item.medicineId}>
                            <td className="py-2 px-3">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-mono text-xs font-bold text-slate-500">
                                  {idx + 1}.
                                </span>
                                <span className="font-semibold text-xs text-slate-900">
                                  {item.brandName} {item.strength}
                                </span>
                              </div>
                              {(item.dosageSchedule || item.dosageDuration) && (
                                <div className="text-[10px] font-mono text-rose-800">
                                  ডোজ: {item.dosageSchedule || ''} {item.dosageDuration || ''}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-1.5 text-center text-xs font-mono">
                              ৳{formatCleanMoney(purPriceVal)}
                            </td>
                            <td className="py-2 px-1.5 text-center text-xs font-mono font-bold">
                              ৳{formatCleanMoney(item.unitPrice)}
                            </td>
                            <td className="py-2 px-2 text-center text-xs font-mono">
                              {item.qty}
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
              <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-lg space-y-2 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">রোগীর নাম:</label>
                    <input
                      type="text"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="রোগীর নাম"
                      className="w-full px-2 py-1 text-xs bg-white border border-pink-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">বয়স:</label>
                    <input
                      type="text"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="যেমন: 28Y"
                      className="w-full px-2 py-1 text-xs bg-white border border-pink-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">লিঙ্গ:</label>
                    <select
                      value={patientSex}
                      onChange={(e) => setPatientSex(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-white border border-pink-300 rounded"
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
              <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-md border border-slate-200">
                <div>
                  <label className="block text-xs text-slate-500">মোট বিক্রয় বিল (৳)</label>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    ৳{cartSubTotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">ছাড় / ডিসকাউন্ট (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 text-xs font-mono tabular-nums border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">নগদ জমা (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={grandTotal.toFixed(0)}
                    value={paidAmountStr}
                    onChange={(e) => setPaidAmountStr(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 text-xs font-mono tabular-nums border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs space-x-3 font-mono tabular-nums">
                  <span className="text-slate-700">
                    নিট প্রদেয়: <strong className="text-slate-900">৳{grandTotal.toFixed(2)}</strong>
                  </span>
                  <span className={dueAmount > 0 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                    বাকি (Due): ৳{dueAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={posCart.length === 0 || submittingSale}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {submittingSale
                      ? 'বিক্রয় ইনভয়েস সংরক্ষণ হচ্ছে...'
                      : isEditingSale
                      ? `এডিটকৃত বিক্রয় ইনভয়েস সংরক্ষণ (${saleInvoiceNo}) ✓`
                      : `বিক্রয় ইনভয়েস সম্পন্ন ও স্টক কমান (-${totalSaleUnits} পিস) ✓`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
