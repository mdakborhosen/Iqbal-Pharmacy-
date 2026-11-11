import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Edit3,
  FileText,
  Minus,
  Package,
  PackageCheck,
  PackagePlus,
  Percent,
  Plus,
  Printer,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  BD_PHARMA_COMPANIES,
  DOSAGE_FORM_OPTIONS,
  formatCleanMoney,
  matchesMedicineQuery,
  searchAndRankMedicines,
} from '../data/bdMedicines';
import { getTodayDateStr } from '../data/demoSeedData';
import {
  MedicineCatalogItem,
  PurchaseCartItem,
  PurchasePackUnit,
  StaffMember,
  Transaction,
} from '../types';

export interface PurchaseStepWizardProps {
  purchaseStep: 1 | 2 | 3;
  setPurchaseStep: (step: 1 | 2 | 3) => void;

  // Supplier & Challan Details
  supplierCompany: string;
  setSupplierCompany: (v: string) => void;
  supplierPhone: string;
  setSupplierPhone: (v: string) => void;
  purInvoiceNo: string;
  setPurInvoiceNo: (v: string) => void;
  purDateStr: string;
  setPurDateStr: (v: string) => void;
  purDiscountStr: string;
  setPurDiscountStr: (v: string) => void;
  purVatStr: string;
  setPurVatStr: (v: string) => void;
  purPaidStr: string;
  setPurPaidStr: (v: string) => void;
  purPaymentMethod: Transaction['paymentMethod'];
  setPurPaymentMethod: (v: Transaction['paymentMethod']) => void;
  syncPurPricesToCatalog: boolean;
  setSyncPurPricesToCatalog: (v: boolean) => void;
  submittingPurchase: boolean;
  onSubmitPurchase: (e: React.FormEvent) => void;

  // Cart Data & Actions
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
  }) => Promise<void>;
  onUpdatePurchaseCartQty: (medId: string, newQty: number) => void;
  onUpdatePurchaseCartCost: (medId: string, newCost: number) => void;
  onUpdatePurchaseCartItemDetails: (
    medId: string,
    updates: Partial<PurchaseCartItem>
  ) => void;
  onRemoveFromPurchaseCart: (medId: string) => void;
  onClearPurchaseCart: () => void;

  // Totals & Meta
  catalog: MedicineCatalogItem[];
  activeStaff: StaffMember;
  isEditingPurchase?: boolean;
  onPreviewCurrentPurchaseInvoice?: () => void;
}

export const PurchaseStepWizard: React.FC<PurchaseStepWizardProps> = ({
  purchaseStep,
  setPurchaseStep,
  supplierCompany,
  setSupplierCompany,
  supplierPhone,
  setSupplierPhone,
  purInvoiceNo,
  setPurInvoiceNo,
  purDateStr,
  setPurDateStr,
  purDiscountStr,
  setPurDiscountStr,
  purVatStr,
  setPurVatStr,
  purPaidStr,
  setPurPaidStr,
  purPaymentMethod,
  setPurPaymentMethod,
  syncPurPricesToCatalog,
  setSyncPurPricesToCatalog,
  submittingPurchase,
  onSubmitPurchase,
  purchaseCart,
  onAddToPurchaseCart,
  onAddCustomToPurchaseCart,
  onUpdatePurchaseCartQty,
  onUpdatePurchaseCartCost,
  onUpdatePurchaseCartItemDetails,
  onRemoveFromPurchaseCart,
  onClearPurchaseCart,
  catalog,
  activeStaff,
  isEditingPurchase = false,
  onPreviewCurrentPurchaseInvoice,
}) => {
  // Step 1: Product Search & Pack options state
  const [productSearch, setProductSearch] = useState('');
  const [isCustomCompanyMode, setIsCustomCompanyMode] = useState(
    !BD_PHARMA_COMPANIES.includes(supplierCompany) && supplierCompany !== 'সকল কোম্পানি'
  );
  const [selectedMed, setSelectedMed] = useState<MedicineCatalogItem | null>(null);
  const [selectedPackUnit, setSelectedPackUnit] = useState<PurchasePackUnit>('box');
  const [packCountInput, setPackCountInput] = useState('1');
  const [unitsPerPackInput, setUnitsPerPackInput] = useState('100');
  const [packRateInput, setPackRateInput] = useState('');
  const [singleTpInput, setSingleTpInput] = useState('');
  const [mrpInput, setMrpInput] = useState('');
  const [showCustomDrugForm, setShowCustomDrugForm] = useState(false);

  // Custom Drug form states
  const [customBrand, setCustomBrand] = useState('');
  const [customGeneric, setCustomGeneric] = useState('');
  const [customCompany, setCustomCompany] = useState(supplierCompany || BD_PHARMA_COMPANIES[0]);
  const [customStrength, setCustomStrength] = useState('20 mg');
  const [customForm, setCustomForm] = useState('Tablet');
  const [customTpPrice, setCustomTpPrice] = useState('5.28');
  const [customMrpPrice, setCustomMrpPrice] = useState('6.00');
  const [customQty, setCustomQty] = useState('100');
  const [customBatch, setCustomBatch] = useState('B-2601');
  const [customExpiry, setCustomExpiry] = useState('2028-12-31');

  // Search Results for Step 1
  const searchResults = useMemo(() => {
    const q = productSearch.trim();
    if (!q) return [];
    const filteredCatalog =
      supplierCompany && supplierCompany !== 'সকল কোম্পানি'
        ? catalog.filter(
            (m) => m.companyName.toLowerCase().trim() === supplierCompany.toLowerCase().trim()
          )
        : catalog;
    const matches = searchAndRankMedicines(filteredCatalog, q, 18);
    // If filtered by company had no hits, search globally
    if (matches.length === 0 && supplierCompany && supplierCompany !== 'সকল কোম্পানি') {
      return searchAndRankMedicines(catalog, q, 18);
    }
    return matches;
  }, [catalog, productSearch, supplierCompany]);

  // Handle selecting a medicine from search
  const handleSelectMedicine = (med: MedicineCatalogItem) => {
    setSelectedMed(med);
    setProductSearch(`${med.brandName} (${med.strength || med.dosageForm}) - ${med.companyName}`);
    const defaultTp =
      typeof med.purchasePrice === 'number' && med.purchasePrice > 0
        ? med.purchasePrice
        : Number((med.unitPrice * 0.88).toFixed(2));
    setSingleTpInput(defaultTp.toFixed(2));
    setMrpInput(med.unitPrice.toFixed(2));

    // Determine default pack size based on dosage form
    const isSyrupOrSusp =
      med.dosageForm.toLowerCase().includes('syrup') ||
      med.dosageForm.toLowerCase().includes('susp') ||
      med.dosageForm.toLowerCase().includes('drop');

    if (isSyrupOrSusp) {
      setSelectedPackUnit('piece');
      setPackCountInput('1');
      setUnitsPerPackInput('1');
      setPackRateInput(defaultTp.toFixed(2));
    } else {
      setSelectedPackUnit('box');
      setPackCountInput('1');
      const unitsPerStrip = med.unitsPerStrip || 10;
      const defaultBoxUnits = unitsPerStrip * 10;
      setUnitsPerPackInput(String(defaultBoxUnits));
      setPackRateInput((defaultTp * defaultBoxUnits).toFixed(2));
    }
  };

  // Add Item to Purchase Cart from Step 1
  const handleAddItemToCart = () => {
    if (!selectedMed) return;

    const count = Math.max(1, parseInt(packCountInput, 10) || 1);
    const unitsPerPack = Math.max(1, parseInt(unitsPerPackInput, 10) || 1);
    const totalPcs = selectedPackUnit === 'piece' ? count : count * unitsPerPack;
    const singleTp = Math.max(0.01, parseFloat(singleTpInput) || selectedMed.purchasePrice || 1);
    const packRate =
      parseFloat(packRateInput) || Number((singleTp * unitsPerPack).toFixed(2));
    const mrp = Math.max(0.1, parseFloat(mrpInput) || selectedMed.unitPrice || 1);

    const packFormula =
      selectedPackUnit === 'box'
        ? `${count} বক্স (${unitsPerPack} পিস/বক্স = ${totalPcs} পিস)`
        : selectedPackUnit === 'strip'
        ? `${count} পাতা (${unitsPerPack} পিস/পাতা = ${totalPcs} পিস)`
        : `${totalPcs} পিস`;

    onAddToPurchaseCart(selectedMed, totalPcs, {
      packUnit: selectedPackUnit,
      packCount: count,
      unitsPerPack,
      packRate,
      packDetailFormula: packFormula,
      customCost: singleTp,
      updateStock: true,
    });

    // Reset selection for next product
    setSelectedMed(null);
    setProductSearch('');
    setPackCountInput('1');
    setPackRateInput('');
    setSingleTpInput('');
    setMrpInput('');
  };

  // Add Custom Drug from Step 1
  const handleAddCustomDrugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBrand.trim()) return;

    const parsedTp = Math.max(0.01, parseFloat(customTpPrice) || 1);
    const parsedMrp = Math.max(0.1, parseFloat(customMrpPrice) || parsedTp * 1.15);
    const parsedQty = Math.max(1, parseInt(customQty, 10) || 1);

    await onAddCustomToPurchaseCart({
      brandName: customBrand.trim(),
      genericName: customGeneric.trim() || undefined,
      companyName: customCompany.trim() || supplierCompany,
      strength: customStrength.trim(),
      dosageForm: customForm,
      purchasePrice: parsedTp,
      unitPrice: parsedMrp,
      qty: parsedQty,
      batchNo: customBatch.trim() || 'B-2601',
      expiryDate: customExpiry.trim() || '2028-12-31',
      updateStock: true,
      saveToCatalog: true,
      packUnit: 'piece',
      packCount: parsedQty,
      unitsPerPack: 1,
      packRate: parsedTp,
      packDetailFormula: `${parsedQty} পিস`,
    });

    setCustomBrand('');
    setCustomGeneric('');
    setShowCustomDrugForm(false);
  };

  // Financial Calculations for Purchase Cart
  const calculations = useMemo(() => {
    let subTotalTp = 0;
    let totalVat = 0;
    let totalPcs = 0;
    let totalBonusPcs = 0;

    for (const item of purchaseCart) {
      if (!item.brandName.trim()) continue;

      const qty = item.qty || 1;
      const tp = item.purchasePrice || 0;
      const lineTp = Number((qty * tp).toFixed(2));
      subTotalTp += lineTp;
      totalPcs += qty;

      const bonus = item.bonusQty || 0;
      totalBonusPcs += bonus;

      // Single VAT Calculation
      let singleVat = 0;
      if (item.pieceVatAmount !== undefined && item.pieceVatAmount > 0) {
        singleVat = item.pieceVatAmount;
      } else if (item.vatPercent !== undefined && item.vatPercent > 0) {
        singleVat = Number(((tp * item.vatPercent) / 100).toFixed(4));
      } else if (item.vatAmount && item.vatAmount > 0) {
        singleVat = Number((item.vatAmount / qty).toFixed(4));
      }

      const lineProductVat = Number((qty * singleVat).toFixed(2));

      // Bonus VAT if bonus is taxable
      let lineBonusVat = 0;
      if (bonus > 0 && item.bonusVatRate && item.bonusVatRate > 0) {
        if (item.bonusVatMode === '%') {
          lineBonusVat = Number((bonus * ((tp * item.bonusVatRate) / 100)).toFixed(2));
        } else {
          lineBonusVat = Number((bonus * item.bonusVatRate).toFixed(2));
        }
      }

      totalVat += lineProductVat + lineBonusVat;
    }

    const discount = Math.max(0, parseFloat(purDiscountStr) || 0);
    const finalVat = purVatStr.trim() !== '' ? Math.max(0, parseFloat(purVatStr) || 0) : totalVat;
    const grandTotal = Math.max(0, subTotalTp + finalVat - discount);
    const paidAmount =
      purPaidStr.trim() === ''
        ? grandTotal
        : Math.max(0, Math.min(grandTotal, parseFloat(purPaidStr) || 0));
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    return {
      subTotalTp,
      totalVat: finalVat,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      totalPcs,
      totalBonusPcs,
    };
  }, [purchaseCart, purDiscountStr, purVatStr, purPaidStr]);

  return (
    <div className="p-3 sm:p-5 space-y-4 bg-indigo-50/20">
      {/* =========================================================================
          TOP PROGRESS BAR / 3-STEP WIZARD TABS (Exact match to User Request)
          ১ম ধাপ:- কোম্পানি সিলেকশন (লিস্ট/কাস্টম),প্রোডাক্ট নির্বাচন,প্যাক সাইজ,পরিমাণ।
          ২য় ধাপ:- বোনাস,ভ্যাট,সিঙ্গেল টিপি,সিঙ্গেল ভ্যাট,মোট টিপি,মোট ভ্যাট।
          ৩য় ধাপ:- প্রিভিউ/সংশোধন এবং সমপন্ন।
          ========================================================================= */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-indigo-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Step 1 Button */}
          <button
            type="button"
            onClick={() => setPurchaseStep(1)}
            className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              purchaseStep === 1
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-600/30'
                : 'bg-indigo-50/70 border-indigo-200 text-indigo-950 hover:bg-indigo-100/70'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold truncate">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold ${
                    purchaseStep === 1 ? 'bg-white text-indigo-900' : 'bg-indigo-200 text-indigo-900'
                  }`}
                >
                  ১
                </span>
                <span>১ম ধাপ: কোম্পানি ও প্রোডাক্ট নির্বাচন</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  purchaseStep === 1 ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                কোম্পানি, প্রোডাক্ট, প্যাক সাইজ ও পরিমাণ
              </div>
            </div>
            <span className="text-xs font-mono">
              {purchaseCart.length > 0 && `(${purchaseCart.length})`}
            </span>
          </button>

          {/* Step 2 Button */}
          <button
            type="button"
            onClick={() => setPurchaseStep(2)}
            className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              purchaseStep === 2
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-600/30'
                : purchaseCart.length > 0
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 hover:bg-indigo-100/70'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold truncate">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold ${
                    purchaseStep === 2 ? 'bg-white text-indigo-900' : 'bg-indigo-200 text-indigo-900'
                  }`}
                >
                  ২
                </span>
                <span>২য় ধাপ: বোনাস, ভ্যাট ও টিপি হিসাব</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  purchaseStep === 2 ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                বোনাস, ভ্যাট%, সিঙ্গেল ও মোট টিপি/ভ্যাট
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-800">
              {purchaseCart.length > 0 && `৳${calculations.subTotalTp.toFixed(0)}`}
            </span>
          </button>

          {/* Step 3 Button */}
          <button
            type="button"
            onClick={() => setPurchaseStep(3)}
            className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              purchaseStep === 3
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-600/30'
                : purchaseCart.length > 0
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 hover:bg-indigo-100/70'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold truncate">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold ${
                    purchaseStep === 3 ? 'bg-white text-indigo-900' : 'bg-indigo-200 text-indigo-900'
                  }`}
                >
                  ৩
                </span>
                <span>৩য় ধাপ: প্রিভিউ/সংশোধন ও সম্পন্ন</span>
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  purchaseStep === 3 ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                চালান প্রিভিউ, সংশোধন, পেমেন্ট ও স্টক বৃদ্ধি
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {purchaseCart.length > 0 && `৳${calculations.grandTotal.toFixed(0)}`}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          STEP 1: COMPANY SELECTION, PRODUCT SELECTION, PACK SIZE, QUANTITY
          ========================================================================= */}
      {purchaseStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Company Selection & Challan Header Box */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold">
                  ১
                </span>
                <h3 className="text-sm font-bold text-indigo-950">
                  সরবরাহকারী কোম্পানি ও চালান পরিচিতি
                </h3>
              </div>
              <div className="text-xs text-slate-500">
                অপারেটর: <strong className="text-slate-800">{activeStaff.name}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Company Selection (List vs Custom) */}
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    সরবরাহকারী ফার্মা কোম্পানি *
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomCompanyMode}
                      onChange={(e) => {
                        setIsCustomCompanyMode(e.target.checked);
                        if (!e.target.checked) setSupplierCompany(BD_PHARMA_COMPANIES[0]);
                      }}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>কাস্টম কোম্পানির নাম লিখুন</span>
                  </label>
                </div>

                {isCustomCompanyMode ? (
                  <input
                    type="text"
                    required
                    value={supplierCompany}
                    onChange={(e) => setSupplierCompany(e.target.value)}
                    placeholder="যেমন: অপসোনিন ফার্মা লিমিটেড / লোকাল ডিপো"
                    className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-md bg-white font-semibold text-indigo-950 focus:border-indigo-600 focus:outline-none"
                  />
                ) : (
                  <select
                    value={supplierCompany}
                    onChange={(e) => setSupplierCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-indigo-200 rounded-md font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="সকল কোম্পানি">🌐 সকল কোম্পানি (All Pharma Companies)</option>
                    {BD_PHARMA_COMPANIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Challan / Invoice No */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  চালান / মেমো নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={purInvoiceNo}
                  onChange={(e) => setPurInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono font-bold text-indigo-950 bg-white"
                />
              </div>

              {/* Challan Date */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  চালানের তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={purDateStr}
                  onChange={(e) => setPurDateStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono bg-white"
                />
              </div>
            </div>
          </div>

          {/* Product Selection, Pack Size & Quantity Box */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-100 text-indigo-800">
                  <PackagePlus className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-indigo-950">
                  ঔষধ / প্রোডাক্ট নির্বাচন, প্যাক সাইজ ও পরিমাণ নির্ধারণ
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomDrugForm(!showCustomDrugForm)}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded cursor-pointer"
              >
                {showCustomDrugForm ? 'সার্চে ফিরে যান' : '+ নতুন কাস্টম প্রোডাক্ট যোগ করুন'}
              </button>
            </div>

            {showCustomDrugForm ? (
              /* Custom Drug Manual Entry Form */
              <form onSubmit={handleAddCustomDrugSubmit} className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-200 space-y-3">
                <div className="font-bold text-xs text-indigo-950">
                  ক্যাটালগে না থাকা নতুন ওষুধ বা সার্জিক্যাল আইটেম সরাসরি ক্রয় তালিকায় যোগ করুন:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-0.5">ব্র্যান্ড নাম *</label>
                    <input
                      type="text"
                      required
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="যেমন: Napa Extra, Seclo-40"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-0.5">জেনেরিক নাম</label>
                    <input
                      type="text"
                      value={customGeneric}
                      onChange={(e) => setCustomGeneric(e.target.value)}
                      placeholder="যেমন: Paracetamol + Caffeine"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-0.5">ধরণ (Form)</label>
                    <select
                      value={customForm}
                      onChange={(e) => setCustomForm(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    >
                      {DOSAGE_FORM_OPTIONS.map((f) => (
                        <option key={f.shortCode} value={f.value}>
                          {f.value} ({f.shortCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-0.5">মাত্রা (Strength)</label>
                    <input
                      type="text"
                      value={customStrength}
                      onChange={(e) => setCustomStrength(e.target.value)}
                      placeholder="যেমন: 500 mg, 20 mg, 100 ml"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
                  <div>
                    <label className="block font-medium text-slate-700 mb-0.5">সিঙ্গেল ক্রয়মূল্য (টিপি ৳) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={customTpPrice}
                      onChange={(e) => setCustomTpPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-indigo-950"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-0.5">বিক্রয়মূল্য (MRP ৳) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={customMrpPrice}
                      onChange={(e) => setCustomMrpPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-0.5">মোট ক্রয় পিস *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={customQty}
                      onChange={(e) => setCustomQty(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded cursor-pointer shadow-xs"
                    >
                      + তালিকায় যোগ করুন
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Standard Search & Pack Selector */
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      if (selectedMed) setSelectedMed(null);
                    }}
                    placeholder="ঔষধের নাম বা জেনেরিক দিয়ে খুঁজুন (যেমন: Seclo, Napa, A-Cal, Ceevit, Azithromycin)..."
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-indigo-200 rounded-lg bg-white focus:border-indigo-600 focus:outline-none"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch('');
                        setSelectedMed(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Search Autocomplete Dropdown */}
                  {!selectedMed && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto z-30 divide-y divide-slate-100">
                      {searchResults.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleSelectMedicine(m)}
                          className="p-2.5 hover:bg-indigo-50/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {m.brandName}{' '}
                              <span className="font-normal text-slate-500">
                                ({m.dosageForm} · {m.strength})
                              </span>
                            </div>
                            <div className="text-[11px] text-teal-800 font-medium">
                              {m.genericName} · <span className="text-slate-500">{m.companyName}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono font-bold text-indigo-900">
                            টিপি: ৳{(m.purchasePrice || m.unitPrice * 0.88).toFixed(2)}
                            <div className="text-[10px] text-slate-500 font-normal">
                              MRP: ৳{m.unitPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* If a medicine is selected: Pack Size and Quantity Configuration Box */}
                {selectedMed && (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>নির্বাচিত: {selectedMed.brandName} ({selectedMed.dosageForm} {selectedMed.strength}) - {selectedMed.companyName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMed(null)}
                        className="text-[11px] text-red-600 hover:underline cursor-pointer"
                      >
                        বাতিল করুন
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
                      {/* Pack Unit */}
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          প্যাক সাইজ ধরণ *
                        </label>
                        <select
                          value={selectedPackUnit}
                          onChange={(e) => {
                            const unit = e.target.value as PurchasePackUnit;
                            setSelectedPackUnit(unit);
                            if (unit === 'piece') {
                              setUnitsPerPackInput('1');
                            } else if (unit === 'strip') {
                              setUnitsPerPackInput(String(selectedMed.unitsPerStrip || 10));
                            } else if (unit === 'box') {
                              setUnitsPerPackInput(String((selectedMed.unitsPerStrip || 10) * 10));
                            }
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                        >
                          <option value="box">📦 সম্পূর্ণ বক্স (Box)</option>
                          <option value="strip">💊 পাতা / স্ট্রিপ (Strip)</option>
                          <option value="piece">🔹 খুচরা পিস (Piece)</option>
                        </select>
                      </div>

                      {/* Pack Count (Quantity) */}
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          {selectedPackUnit === 'box'
                            ? 'কত বক্স? (Box Qty) *'
                            : selectedPackUnit === 'strip'
                            ? 'কত পাতা? (Strip Qty) *'
                            : 'কত পিস? (Pcs Qty) *'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={packCountInput}
                          onChange={(e) => setPackCountInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-slate-900"
                        />
                      </div>

                      {/* Units per Pack */}
                      {selectedPackUnit !== 'piece' && (
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            প্রতি প্যাকে পিস সংখ্যা
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={unitsPerPackInput}
                            onChange={(e) => setUnitsPerPackInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                          />
                        </div>
                      )}

                      {/* Single TP Price */}
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          প্রতি পিসের টিপি (Single TP ৳)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={singleTpInput}
                          onChange={(e) => {
                            setSingleTpInput(e.target.value);
                            const val = parseFloat(e.target.value) || 0;
                            const u = parseInt(unitsPerPackInput, 10) || 1;
                            setPackRateInput((val * u).toFixed(2));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-indigo-950"
                        />
                      </div>

                      {/* Add Button */}
                      <div className="flex items-end col-span-2 sm:col-span-1">
                        <button
                          type="button"
                          onClick={handleAddItemToCart}
                          className="w-full py-1.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ তালিকায় যুক্ত</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-indigo-900 font-medium">
                      হিসাব: মোট পরিমাণ ={' '}
                      <strong className="font-mono text-slate-900">
                        {selectedPackUnit === 'piece'
                          ? `${packCountInput || 1} পিস`
                          : `${packCountInput || 1} ${selectedPackUnit === 'box' ? 'বক্স' : 'পাতা'} × ${unitsPerPackInput || 1} = ${(parseInt(packCountInput, 10) || 1) * (parseInt(unitsPerPackInput, 10) || 1)} পিস`}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Purchase Items Table in Step 1 */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">
                  চালানে অন্তর্ভুক্ত আইটেমসমূহ ({purchaseCart.length}টি প্রডাক্ট, মোট {calculations.totalPcs} পিস)
                </span>
              </div>
              {purchaseCart.length > 0 && (
                <button
                  type="button"
                  onClick={onClearPurchaseCart}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  সবগুলো মুছুন
                </button>
              )}
            </div>

            {purchaseCart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                বর্তমানে কোনো ওষুধ তালিকায় যুক্ত নেই। উপরের সার্চ বক্স থেকে প্রোডাক্ট নির্বাচন করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-indigo-50/70 border-b border-indigo-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">নং</th>
                      <th className="py-2 px-3">ঔষধের নাম ও বিবরণ</th>
                      <th className="py-2 px-2 text-center">প্যাক সাইজ</th>
                      <th className="py-2 px-2 text-center">মোট পরিমাণ</th>
                      <th className="py-2 px-3 text-right">একক টিপি (৳)</th>
                      <th className="py-2 px-3 text-right">মোট টিপি (৳)</th>
                      <th className="py-2 px-2 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {purchaseCart.map((item, idx) => {
                      const lineCost = Number(((item.purchasePrice || 0) * (item.qty || 0)).toFixed(2));
                      return (
                        <tr key={item.medicineId} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">
                              {item.brandName}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({item.dosageForm} {item.strength})
                              </span>
                            </div>
                            <div className="text-[10.5px] text-teal-800">{item.companyName}</div>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600 font-mono">
                            {item.packDetailFormula || `${item.qty} পিস`}
                          </td>
                          <td className="py-2 px-2 text-center font-bold font-mono text-indigo-950">
                            {item.qty} পিস
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            ৳{item.purchasePrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-indigo-900">
                            ৳{lineCost.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => onRemoveFromPurchaseCart(item.medicineId)}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              title="তালিকা থেকে বাদ দিন"
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
            )}

            {/* Bottom Proceed to Step 2 */}
            <div className="flex justify-end pt-3 border-t border-indigo-100">
              <button
                type="button"
                disabled={purchaseCart.length === 0}
                onClick={() => setPurchaseStep(2)}
                className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 text-white font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <span>পরবর্তী ধাপ: বোনাস, ভ্যাট ও টিপি হিসাব (ধাপ ২)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: BONUS, VAT %, SINGLE TP, SINGLE VAT, TOTAL TP, TOTAL VAT
          (Exact table columns asked by user)
          ========================================================================= */}
      {purchaseStep === 2 && (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold">
                  ২
                </span>
                <h3 className="text-sm font-bold text-indigo-950">
                  ধাপ ২: বোনাস, ভ্যাট, সিঙ্গেল টিপি, সিঙ্গেল ভ্যাট, মোট টিপি ও মোট ভ্যাট হিসাব
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                প্রতিটি ওষুধের বোনাস পিস, ভ্যাট হার এবং সঠিক ট্রেড প্রাইস (টিপি) নিশ্চিত করুন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPurchaseStep(1)}
                className="px-3 py-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>+ আরও প্রোডাক্ট যোগ করুন</span>
              </button>
            </div>
          </div>

          {/* Comprehensive 10-Column Financial Calculation Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse text-xs min-w-[900px]">
              <thead className="bg-indigo-50/90 border-b border-indigo-200 text-indigo-950 font-bold">
                <tr>
                  <th className="py-2.5 px-3">ঔষধের নাম ও পরিমাণ</th>
                  <th className="py-2.5 px-2 text-center w-20">বোনাস (Pcs)</th>
                  <th className="py-2.5 px-2 text-center w-24">সিঙ্গেল টিপি (৳)</th>
                  <th className="py-2.5 px-2 text-center w-20">ভ্যাট (%)</th>
                  <th className="py-2.5 px-2 text-center w-24">সিঙ্গেল ভ্যাট (৳)</th>
                  <th className="py-2.5 px-3 text-right">মোট টিপি (৳)</th>
                  <th className="py-2.5 px-3 text-right">মোট ভ্যাট (৳)</th>
                  <th className="py-2.5 px-3 text-right">লাইন মোট (৳)</th>
                  <th className="py-2.5 px-2 text-center w-24">ব্যাচ ও মেয়াদ</th>
                  <th className="py-2.5 px-2 text-center">স্টক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-sans">
                {purchaseCart.map((item, idx) => {
                  const qty = item.qty || 1;
                  const tp = item.purchasePrice || 0;
                  const lineTp = Number((qty * tp).toFixed(2));
                  const bonus = item.bonusQty || 0;

                  // VAT calculations
                  const vatRate = item.vatPercent !== undefined ? item.vatPercent : 2.4;
                  const singleVat =
                    item.pieceVatAmount !== undefined && item.pieceVatAmount > 0
                      ? item.pieceVatAmount
                      : Number(((tp * vatRate) / 100).toFixed(4));
                  const lineVat = Number((qty * singleVat).toFixed(2));
                  const lineNetTotal = lineTp + lineVat;

                  return (
                    <tr key={item.medicineId} className="hover:bg-indigo-50/30">
                      {/* Product Name & Pcs */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">
                          {idx + 1}. {item.brandName}{' '}
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({item.dosageForm} {item.strength})
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          {item.companyName} · <strong className="font-mono text-indigo-900">{qty} পিস</strong>
                        </div>
                      </td>

                      {/* Bonus Input */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.bonusQty || 0}
                          onChange={(e) =>
                            onUpdatePurchaseCartItemDetails(item.medicineId, {
                              bonusQty: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="w-16 text-center py-1 px-1 border border-slate-300 rounded font-mono font-bold text-emerald-800 bg-white"
                        />
                      </td>

                      {/* Single TP Input */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.purchasePrice}
                          onChange={(e) => {
                            const newCost = Math.max(0.01, parseFloat(e.target.value) || 0);
                            onUpdatePurchaseCartCost(item.medicineId, newCost);
                          }}
                          className="w-20 text-center py-1 px-1 border border-slate-300 rounded font-mono font-bold text-indigo-950 bg-white"
                        />
                      </td>

                      {/* VAT % Input */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={vatRate}
                          onChange={(e) => {
                            const rate = Math.max(0, parseFloat(e.target.value) || 0);
                            const newSingleVat = Number(((tp * rate) / 100).toFixed(4));
                            onUpdatePurchaseCartItemDetails(item.medicineId, {
                              vatPercent: rate,
                              pieceVatAmount: newSingleVat,
                              productVatMode: '%',
                            });
                          }}
                          className="w-16 text-center py-1 px-1 border border-slate-300 rounded font-mono text-slate-800 bg-white"
                        />
                      </td>

                      {/* Single VAT Display / Input */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={singleVat}
                          onChange={(e) => {
                            const sVat = Math.max(0, parseFloat(e.target.value) || 0);
                            const approxRate = tp > 0 ? Number(((sVat / tp) * 100).toFixed(2)) : 0;
                            onUpdatePurchaseCartItemDetails(item.medicineId, {
                              pieceVatAmount: sVat,
                              vatPercent: approxRate,
                              productVatMode: 'piece_vat',
                            });
                          }}
                          className="w-20 text-center py-1 px-1 border border-slate-200 rounded font-mono text-slate-700 bg-slate-50"
                        />
                      </td>

                      {/* Total TP */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ৳{lineTp.toFixed(2)}
                      </td>

                      {/* Total VAT */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-800">
                        ৳{lineVat.toFixed(2)}
                      </td>

                      {/* Line Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-950">
                        ৳{lineNetTotal.toFixed(2)}
                      </td>

                      {/* Batch & Expiry */}
                      <td className="py-2.5 px-2 text-center space-y-1">
                        <input
                          type="text"
                          value={item.batchNo || 'B-2610'}
                          onChange={(e) =>
                            onUpdatePurchaseCartItemDetails(item.medicineId, {
                              batchNo: e.target.value,
                            })
                          }
                          placeholder="ব্যাচ নং"
                          className="w-20 text-[10px] text-center px-1 py-0.5 border border-slate-300 rounded font-mono"
                        />
                        <input
                          type="date"
                          value={item.expiryDate || '2028-12-31'}
                          onChange={(e) =>
                            onUpdatePurchaseCartItemDetails(item.medicineId, {
                              expiryDate: e.target.value,
                            })
                          }
                          className="w-20 text-[10px] text-center px-0.5 py-0.5 border border-slate-300 rounded font-mono"
                        />
                      </td>

                      {/* Stock Checkbox */}
                      <td className="py-2.5 px-2 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.updateStock !== false}
                            onChange={(e) =>
                              onUpdatePurchaseCartItemDetails(item.medicineId, {
                                updateStock: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-[10px] font-bold text-indigo-900">
                            {item.updateStock !== false ? '✅ স্টক বৃদ্ধি' : '❌ স্টক বাড়বে না'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 4-Column Step 2 Financial Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/80 p-3.5 rounded-lg border border-indigo-200">
            <div>
              <span className="text-slate-600 text-xs">মোট পরিমাণ ও বোনাস:</span>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {calculations.totalPcs} পিস {calculations.totalBonusPcs > 0 && `(+${calculations.totalBonusPcs} বোনাস)`}
              </div>
            </div>

            <div>
              <span className="text-slate-600 text-xs">সর্বমোট টিপি (SubTotal TP):</span>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                ৳{calculations.subTotalTp.toFixed(2)}
              </div>
            </div>

            <div>
              <span className="text-slate-600 text-xs">সর্বমোট ভ্যাট (Total VAT):</span>
              <div className="text-base font-bold font-mono text-indigo-800 mt-0.5">
                ৳{calculations.totalVat.toFixed(2)}
              </div>
            </div>

            <div>
              <span className="text-slate-600 text-xs">টিপি + ভ্যাট সর্বমোট:</span>
              <div className="text-lg font-black font-mono text-indigo-950 mt-0.5">
                ৳{(calculations.subTotalTp + calculations.totalVat).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-indigo-100">
            <button
              type="button"
              onClick={() => setPurchaseStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>পূর্ববর্তী ধাপ: কোম্পানি ও প্রোডাক্ট পরিবর্তন (ধাপ ১)</span>
            </button>

            <button
              type="button"
              onClick={() => setPurchaseStep(3)}
              className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <span>পরবর্তী ধাপ: চালান প্রিভিউ ও সম্পন্ন (ধাপ ৩)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: PREVIEW / AMENDMENT & FINALIZE (চালান প্রিভিউ, সংশোধন ও সম্পন্ন)
          ========================================================================= */}
      {purchaseStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Invoice Summary & Itemized Review */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold">
                    ৩
                  </span>
                  <h3 className="text-sm font-bold text-indigo-950">
                    ধাপ ৩: ক্রয় চালান প্রিভিউ, সংশোধন এবং চূড়ান্ত সম্পন্ন
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  চালানের সকল তথ্য ও হিসাব যাচাই করুন। কোনো তথ্য পরিবর্তন করতে চাইলে পাশে থাকা সংশোধন বাটনে ক্লিক করুন।
                </p>
              </div>

              {onPreviewCurrentPurchaseInvoice && (
                <button
                  type="button"
                  onClick={onPreviewCurrentPurchaseInvoice}
                  className="px-3.5 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-700" />
                  <span>A4 চালান প্রিন্ট প্রিভিউ</span>
                </button>
              )}
            </div>

            {/* Challan Metadata Badge */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">সরবরাহকারী:</span>
                <strong className="text-indigo-950 text-sm block">{supplierCompany}</strong>
                <span className="text-slate-500 text-[11px] font-mono">{supplierPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">চালান নম্বর:</span>
                <strong className="font-mono text-slate-900 text-sm block">{purInvoiceNo}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">চালানের তারিখ:</span>
                <strong className="font-mono text-slate-800 block">{purDateStr}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">অপারেটর:</span>
                <strong className="text-slate-800 block">{activeStaff.name}</strong>
              </div>
            </div>

            {/* Review Items Table with Amend Actions */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-indigo-50/80 border-b border-indigo-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">নং</th>
                    <th className="py-2.5 px-3">ঔষধের নাম ও বিবরণ</th>
                    <th className="py-2.5 px-2 text-center">পরিমাণ</th>
                    <th className="py-2.5 px-2 text-center">বোনাস</th>
                    <th className="py-2.5 px-3 text-right">সিঙ্গেল টিপি</th>
                    <th className="py-2.5 px-3 text-right">সিঙ্গেল ভ্যাট</th>
                    <th className="py-2.5 px-3 text-right">মোট টিপি</th>
                    <th className="py-2.5 px-3 text-right">মোট ভ্যাট</th>
                    <th className="py-2.5 px-3 text-right">লাইন মোট (৳)</th>
                    <th className="py-2.5 px-2 text-center">সংশোধন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {purchaseCart.map((item, idx) => {
                    const qty = item.qty || 1;
                    const tp = item.purchasePrice || 0;
                    const lineTp = Number((qty * tp).toFixed(2));
                    const bonus = item.bonusQty || 0;
                    const vatRate = item.vatPercent !== undefined ? item.vatPercent : 2.4;
                    const singleVat =
                      item.pieceVatAmount !== undefined && item.pieceVatAmount > 0
                        ? item.pieceVatAmount
                        : Number(((tp * vatRate) / 100).toFixed(4));
                    const lineVat = Number((qty * singleVat).toFixed(2));
                    const lineTotal = lineTp + lineVat;

                    return (
                      <tr key={item.medicineId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">
                            {item.brandName}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({item.dosageForm} {item.strength})
                            </span>
                          </div>
                          <div className="text-[10.5px] text-teal-800">{item.companyName}</div>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                          {qty} পিস
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-emerald-700 font-bold">
                          {bonus > 0 ? `${bonus} পিস` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">৳{tp.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">৳{singleVat.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ৳{lineTp.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-800">
                          ৳{lineVat.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-indigo-950">
                          ৳{lineTotal.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPurchaseStep(2)}
                            className="px-2 py-0.5 text-[10.5px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer"
                          >
                            ✏️ সংশোধন
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Financial Settlement & Checkout Form */}
          <form
            onSubmit={onSubmitPurchase}
            className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-xs space-y-4"
          >
            <div className="font-bold text-sm text-indigo-950 border-b border-indigo-100 pb-2 flex items-center justify-between">
              <span>চূড়ান্ত বিল হিসাব ও পেমেন্ট সেটেলমেন্ট:</span>
              <span className="text-xs font-normal text-slate-500">
                ইনভয়েস সম্পন্ন করলে স্টকে স্বয়ংক্রিয়ভাবে মাল যোগ হবে
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">সর্বমোট টিপি (SubTotal TP ৳)</label>
                <div className="text-lg font-black font-mono text-slate-900 mt-1">
                  ৳{calculations.subTotalTp.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">সর্বমোট ভ্যাট (Total VAT ৳)</label>
                <div className="text-lg font-black font-mono text-indigo-800 mt-1">
                  ৳{calculations.totalVat.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  কোম্পানি ডিসকাউন্ট / কমিশন (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={purDiscountStr}
                  onChange={(e) => setPurDiscountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">চূড়ান্ত প্রদেয় বিল (Grand Total ৳)</label>
                <div className="text-xl font-black font-mono text-indigo-950 mt-1">
                  ৳{calculations.grandTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  পরিশোধিত টাকা (Paid Amount ৳) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={purPaidStr}
                  onChange={(e) => setPurPaidStr(e.target.value)}
                  placeholder={calculations.grandTotal.toFixed(2)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-bold text-sm text-emerald-800 bg-white"
                />
                <div className="text-[10.5px] text-slate-500 mt-0.5">
                  বাকি বা চালান বিল হলে ০ লিখুন
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  বাকি চালান (Due ৳)
                </label>
                <div className={`px-3 py-2 border rounded-md font-mono font-bold text-sm ${
                  calculations.dueAmount > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  ৳{calculations.dueAmount.toFixed(2)}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-0.5">
                  {calculations.dueAmount > 0 ? 'কোম্পানি বাকি লেজারে জমা হবে' : 'পরিশোধিত বিল'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  পরিশোধ মাধ্যম (Payment Method)
                </label>
                <select
                  value={purPaymentMethod}
                  onChange={(e) => setPurPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-semibold text-xs"
                >
                  <option value="cash">💵 নগদ টাকা (Cash)</option>
                  <option value="bank">🏛️ ব্যাংক ডিপোজিট (Bank / Cheque)</option>
                  <option value="bkash">📱 বিকাশ / নগদ (MFS)</option>
                  <option value="due">📄 বাকি চালান (Due / Credit)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={syncPurPricesToCatalog}
                  onChange={(e) => setSyncPurPricesToCatalog(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  <strong>ক্যাটালগ মূল্য আপডেট:</strong> পরিবর্তিত ক্রয়মূল্য ও বিক্রয়মূল্য ভবিষ্যতে ব্যবহারের জন্য সেন্ট্রাল মেডিসিন ক্যাটালগে সেভ করে রাখুন
                </span>
              </label>
            </div>

            {/* Final Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100">
              <button
                type="button"
                onClick={() => setPurchaseStep(2)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ: বোনাস ও ভ্যাট সংশোধন (ধাপ ২)</span>
              </button>

              <div className="flex items-center gap-2">
                {onPreviewCurrentPurchaseInvoice && (
                  <button
                    type="button"
                    onClick={onPreviewCurrentPurchaseInvoice}
                    className="px-4 py-2.5 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-indigo-700" />
                    <span>প্রিন্ট প্রিভিউ</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submittingPurchase || purchaseCart.length === 0}
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-lg flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>
                    {submittingPurchase
                      ? 'চালান সংরক্ষণ হচ্ছে...'
                      : isEditingPurchase
                      ? 'ক্রয় চালান আপডেট ও স্টক সমন্বয় করুন'
                      : '✅ ক্রয় চালান সম্পন্ন ও স্টক বৃদ্ধি করুন'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
