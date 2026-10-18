import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Edit3,
  FlaskConical,
  Lock,
  Package,
  PackagePlus,
  Pill,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import {
  BD_GENERICS_DIRECTORY,
  BD_PHARMA_COMPANIES,
  calculateProportionalMedicinePrice,
  DOSAGE_FORM_OPTIONS,
  formatBrandVariantLabel,
  getBrandFormAndStrengthVariants,
  getShortDosageForm,
  getUnitLabelForForm,
  isCoreDatabaseMedicineId,
  matchesMedicineQuery,
  normalizePharmaSearchText,
  searchAndRankMedicines,
} from '../data/bdMedicines';
import { InventoryItem, MedicineCatalogItem } from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  catalog: MedicineCatalogItem[];
  onSaveInventoryItem: (
    item: Omit<InventoryItem, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onDeleteInventoryItem: (id: string) => Promise<void>;
  onQuickRestock: (item: InventoryItem, addQty: number) => Promise<void>;
  onAddToPosCart?: (med: MedicineCatalogItem, qty: number) => void;
  onAddToPurchaseCart?: (med: MedicineCatalogItem, qty?: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  catalog,
  onSaveInventoryItem,
  onDeleteInventoryItem,
  onQuickRestock,
  onAddToPosCart,
  onAddToPurchaseCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low_stock' | 'expiring'>('all');
  const [dosageFormFilter, setDosageFormFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal Search & Dropdown states for Medicine Name, Company Name, Generic Name
  const [modalCatalogSearch, setModalCatalogSearch] = useState('');
  const [modalCompanyFilter, setModalCompanyFilter] = useState<string>('ALL');
  const [showBrandListDropdown, setShowBrandListDropdown] = useState(false);
  const [showCompanyListDropdown, setShowCompanyListDropdown] = useState(false);
  const [showGenericListDropdown, setShowGenericListDropdown] = useState(false);

  // Form states
  const [selectedMedId, setSelectedMedId] = useState<string>(catalog[0]?.id || 'custom');
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [companyName, setCompanyName] = useState<string>(BD_PHARMA_COMPANIES[0]);
  const [strength, setStrength] = useState('20 mg');
  const [dosageForm, setDosageForm] = useState('Capsule');
  const [packSize, setPackSize] = useState('10 × 10 (100 pcs)');
  const [purchasePrice, setPurchasePrice] = useState('5.28');
  const [unitPrice, setUnitPrice] = useState('6.00');
  const [stripPrice, setStripPrice] = useState('60.00');
  const [stockQty, setStockQty] = useState('100');
  const [minStockLevel, setMinStockLevel] = useState('50');
  const [batchNo, setBatchNo] = useState('B-2610');
  const [expiryDate, setExpiryDate] = useState('2028-06-30');
  const [shelfLocation, setShelfLocation] = useState('Rack A-1');

  const isExpiringSoon = (expDate: string) => {
    const exp = new Date(expDate).getTime();
    if (Number.isNaN(exp)) return false;
    const daysLeft = (exp - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 90;
  };

  const metrics = useMemo(() => {
    let totalStockUnits = 0;
    let totalPurchaseValuation = 0;
    let totalMrpValuation = 0;
    let lowStockCount = 0;
    let expiringCount = 0;

    for (const item of inventory) {
      totalStockUnits += item.stockQty;
      totalPurchaseValuation += item.stockQty * item.purchasePrice;
      totalMrpValuation += item.stockQty * item.unitPrice;
      if (item.stockQty <= item.minStockLevel) lowStockCount++;
      if (isExpiringSoon(item.expiryDate)) expiringCount++;
    }

    return {
      totalItems: inventory.length,
      totalStockUnits,
      totalPurchaseValuation,
      totalMrpValuation,
      lowStockCount,
      expiringCount,
    };
  }, [inventory]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const normQ = normalizePharmaSearchText(q);
    const invMatches = inventory.filter((item) => {
      if (filterMode === 'low_stock' && item.stockQty > item.minStockLevel) return false;
      if (filterMode === 'expiring' && !isExpiringSoon(item.expiryDate)) return false;
      if (
        dosageFormFilter !== 'ALL' &&
        getShortDosageForm(item.dosageForm) !== dosageFormFilter
      ) {
        return false;
      }
      if (!q) return true;
      const shortForm = getShortDosageForm(item.dosageForm).toLowerCase();
      return (
        item.brandName.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.strength.toLowerCase().includes(q) ||
        item.dosageForm.toLowerCase().includes(q) ||
        shortForm.includes(q) ||
        item.batchNo.toLowerCase().includes(q) ||
        item.shelfLocation.toLowerCase().includes(q) ||
        (normQ.length > 0 &&
          (normalizePharmaSearchText(item.brandName).includes(normQ) ||
            normalizePharmaSearchText(item.genericName).includes(normQ) ||
            normalizePharmaSearchText(item.companyName).includes(normQ) ||
            normalizePharmaSearchText(item.dosageForm).includes(normQ) ||
            normalizePharmaSearchText(item.strength).includes(normQ)))
      );
    });

    if (!q || filterMode !== 'all') {
      return invMatches;
    }

    // Also include top-ranked matching medicines from the 21,500+ National Catalog that are not yet in inventory
    const existingMedIds = new Set(invMatches.map((i) => i.medicineId));
    const existingBrandStrengthKeys = new Set(
      invMatches.map(
        (i) =>
          `${i.brandName.toLowerCase()}__${i.strength.toLowerCase()}__${getShortDosageForm(i.dosageForm)}`
      )
    );

    const catalogMatches = searchAndRankMedicines(catalog, searchQuery, 45);
    const virtualCatalogItems: InventoryItem[] = [];

    for (const med of catalogMatches) {
      if (
        dosageFormFilter !== 'ALL' &&
        getShortDosageForm(med.dosageForm) !== dosageFormFilter
      ) {
        continue;
      }
      const bsKey = `${med.brandName.toLowerCase()}__${med.strength.toLowerCase()}__${getShortDosageForm(med.dosageForm)}`;
      if (existingMedIds.has(med.id) || existingBrandStrengthKeys.has(bsKey)) {
        continue;
      }
      existingMedIds.add(med.id);
      existingBrandStrengthKeys.add(bsKey);

      const purPrice =
        typeof med.purchasePrice === 'number' && med.purchasePrice > 0
          ? med.purchasePrice
          : Number((med.unitPrice * 0.88).toFixed(2));

      virtualCatalogItems.push({
        id: `inv-${med.id}`,
        ownerId: 'shared_iqbal_pharmacy',
        medicineId: med.id,
        brandName: med.brandName,
        genericName: med.genericName,
        companyName: med.companyName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        packSize: med.packSize,
        purchasePrice: purPrice,
        unitPrice: med.unitPrice,
        stripPrice: med.stripPrice,
        stockQty: 0,
        minStockLevel: 20,
        batchNo: 'NEW-CAT',
        expiryDate: '2028-12-31',
        shelfLocation: 'Rack A-1',
      });
    }

    return [...invMatches, ...virtualCatalogItems];
  }, [inventory, catalog, searchQuery, filterMode, dosageFormFilter]);

  // All catalog variants (Tab, Cap, Syp, Susp, Supp, Inhaler, Sachet, Inj, Drops, Gel & mg/ml strengths) for the currently selected Brand/Generic
  const brandFormAndStrengthVariants = useMemo(() => {
    return getBrandFormAndStrengthVariants(catalog, brandName, genericName);
  }, [catalog, brandName, genericName]);

  // Suggested mg/ml strengths for the currently selected dosageForm
  const currentFormMeta = useMemo(() => {
    const short = getShortDosageForm(dosageForm);
    return (
      DOSAGE_FORM_OPTIONS.find((o) => o.shortCode === short) ||
      DOSAGE_FORM_OPTIONS[0]
    );
  }, [dosageForm]);

  const handleDosageFormChange = (newForm: string) => {
    setDosageForm(newForm);
    const short = getShortDosageForm(newForm);
    const formMeta =
      DOSAGE_FORM_OPTIONS.find((o) => o.shortCode === short) ||
      DOSAGE_FORM_OPTIONS[0];

    // Check if this brand/generic has a catalog variant in this dosage form
    const brandVariantInForm = brandFormAndStrengthVariants.find(
      (v) => getShortDosageForm(v.dosageForm) === short
    );
    const nextStrength = brandVariantInForm
      ? brandVariantInForm.strength
      : formMeta.defaultStrengths[2] || formMeta.defaultStrengths[0];

    setStrength(nextStrength);

    const calc = calculateProportionalMedicinePrice({
      catalog,
      brandName,
      genericName,
      targetForm: newForm,
      targetStrength: nextStrength,
      currentUnitPrice: parseFloat(unitPrice) || 6.0,
    });

    if (calc.matchedItem) {
      setSelectedMedId(calc.matchedItem.id);
    }
    setUnitPrice(calc.unitPrice.toFixed(2));
    setStripPrice(calc.stripPrice.toFixed(2));
    setPurchasePrice(calc.purchasePrice.toFixed(2));
    setPackSize(calc.packSize);
  };

  const handleStrengthChangeWithProportionalPrice = (newStrength: string) => {
    setStrength(newStrength);
    if (!newStrength.trim()) return;

    const calc = calculateProportionalMedicinePrice({
      catalog,
      brandName,
      genericName,
      targetForm: dosageForm,
      targetStrength: newStrength,
      currentUnitPrice: parseFloat(unitPrice) || 6.0,
    });

    if (calc.matchedItem) {
      setSelectedMedId(calc.matchedItem.id);
    }
    setUnitPrice(calc.unitPrice.toFixed(2));
    setStripPrice(calc.stripPrice.toFixed(2));
    setPurchasePrice(calc.purchasePrice.toFixed(2));
    setPackSize(calc.packSize);
  };

  // Filtered catalog for top quick-pick search/select in modal
  const filteredModalCatalog = useMemo(() => {
    const q = modalCatalogSearch.trim();
    const pool =
      modalCompanyFilter === 'ALL'
        ? catalog
        : catalog.filter((m) => m.companyName === modalCompanyFilter);
    return searchAndRankMedicines(pool, q, 150);
  }, [catalog, modalCatalogSearch, modalCompanyFilter]);

  // Filtered Medicine Brand list when typing or opening Brand Name dropdown
  const matchingBrandSuggestions = useMemo(() => {
    const q = brandName.trim();
    return searchAndRankMedicines(catalog, q, 80);
  }, [catalog, brandName]);

  // Filtered 258+ Company list when typing or opening Company Name dropdown
  const matchingCompanies = useMemo(() => {
    const q = companyName.trim().toLowerCase();
    if (!q) return BD_PHARMA_COMPANIES;
    const filtered = BD_PHARMA_COMPANIES.filter((c) => c.toLowerCase().includes(q));
    return filtered.length > 0 ? filtered : BD_PHARMA_COMPANIES;
  }, [companyName]);

  // Filtered 1,835+ Generic list when typing or opening Generic Name dropdown
  const matchingGenerics = useMemo(() => {
    const q = genericName.trim().toLowerCase();
    if (!q) return BD_GENERICS_DIRECTORY.slice(0, 80);
    return BD_GENERICS_DIRECTORY.filter(
      (g) =>
        g.genericName.toLowerCase().includes(q) ||
        g.therapeuticClass.toLowerCase().includes(q)
    ).slice(0, 80);
  }, [genericName]);

  const getMedPurchasePrice = (med: MedicineCatalogItem): number => {
    if (typeof med.purchasePrice === 'number' && med.purchasePrice > 0) {
      return med.purchasePrice;
    }
    return Number((med.unitPrice * 0.88).toFixed(2));
  };

  const isCoreInventoryItem = (item: InventoryItem): boolean => {
    if (item.id && item.id.startsWith('inv-seed-')) return true;
    if (isCoreDatabaseMedicineId(item.medicineId)) return true;
    const matchedCat = catalog.find(
      (c) =>
        c.id === item.medicineId ||
        (c.brandName.toLowerCase() === item.brandName.toLowerCase() &&
          c.strength.toLowerCase() === item.strength.toLowerCase() &&
          getShortDosageForm(c.dosageForm) === getShortDosageForm(item.dosageForm))
    );
    if (matchedCat && (matchedCat.isCoreProduct || isCoreDatabaseMedicineId(matchedCat.id))) {
      return true;
    }
    return false;
  };

  const applyMedicineSelection = (found: MedicineCatalogItem) => {
    setSelectedMedId(found.id);
    setBrandName(found.brandName);
    setGenericName(found.genericName);
    setCompanyName(found.companyName);
    setStrength(found.strength);
    setDosageForm(found.dosageForm);
    setPackSize(found.packSize);
    setPurchasePrice(getMedPurchasePrice(found).toFixed(2));
    setUnitPrice(found.unitPrice.toFixed(2));
    setStripPrice(found.stripPrice.toFixed(2));
    setShowBrandListDropdown(false);
  };

  const openNewModal = () => {
    setEditingItem(null);
    setModalCatalogSearch('');
    setModalCompanyFilter('ALL');
    setShowBrandListDropdown(false);
    setShowCompanyListDropdown(false);
    setShowGenericListDropdown(false);
    const first = catalog[0];
    if (first) {
      applyMedicineSelection(first);
    }
    setStockQty('100');
    setMinStockLevel('50');
    setBatchNo(`B-${Math.floor(1000 + Math.random() * 9000)}`);
    setExpiryDate('2028-06-30');
    setShelfLocation('Rack A-1');
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setModalCatalogSearch('');
    setModalCompanyFilter('ALL');
    setShowBrandListDropdown(false);
    setShowCompanyListDropdown(false);
    setShowGenericListDropdown(false);
    setSelectedMedId(item.medicineId);
    setBrandName(item.brandName);
    setGenericName(item.genericName);
    setCompanyName(item.companyName);
    setStrength(item.strength);
    setDosageForm(item.dosageForm);
    setPackSize(item.packSize);
    setPurchasePrice(String(item.purchasePrice));
    setUnitPrice(String(item.unitPrice));
    setStripPrice(String(item.stripPrice));
    setStockQty(String(item.stockQty));
    setMinStockLevel(String(item.minStockLevel));
    setBatchNo(item.batchNo);
    setExpiryDate(item.expiryDate);
    setShelfLocation(item.shelfLocation);
    setShowModal(true);
  };

  const handleCatalogPick = (medId: string) => {
    setSelectedMedId(medId);
    const found = catalog.find((c) => c.id === medId);
    if (found) {
      applyMedicineSelection(found);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveInventoryItem(
        {
          medicineId: selectedMedId || `med-${Date.now()}`,
          brandName: brandName.trim(),
          genericName: genericName.trim(),
          companyName: companyName.trim(),
          strength: strength.trim(),
          dosageForm: dosageForm.trim(),
          packSize: packSize.trim(),
          purchasePrice: Math.max(0, parseFloat(purchasePrice) || 0),
          unitPrice: Math.max(0, parseFloat(unitPrice) || 0),
          stripPrice: Math.max(0, parseFloat(stripPrice) || 0),
          stockQty: Math.max(0, parseInt(stockQty, 10) || 0),
          minStockLevel: Math.max(0, parseInt(minStockLevel, 10) || 10),
          batchNo: batchNo.trim() || 'BATCH-01',
          expiryDate: expiryDate.trim() || '2028-12-31',
          shelfLocation: shelfLocation.trim() || 'Rack A-1',
        },
        editingItem?.id
      );
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">মোট ওষুধ আইটেম ও স্টক পিস</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {metrics.totalItems}টি ব্র্যান্ড ({metrics.totalStockUnits.toLocaleString()} পিস)
          </div>
          <div className="text-xs text-slate-500 mt-1">ফার্মেসি র‍্যাক ও কাউন্টার স্টক</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">স্টকের মোট ক্রয়মূল্য (Purchase Value)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            ৳{metrics.totalPurchaseValuation.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            বিক্রয়মূল্য (MRP): ৳{metrics.totalMrpValuation.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">স্টক স্বল্পতা (Low Stock Alert)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">
            {metrics.lowStockCount}টি ওষুধ
          </div>
          <div className="text-xs text-slate-500 mt-1">দ্রুত কোম্পানি অর্ডার দেওয়া প্রয়োজন</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">মেয়াদ সতর্কতা (৯০ দিনের মধ্যে)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600 mt-1">
            {metrics.expiringCount}টি ব্যাচ
          </div>
          <div className="text-xs text-slate-500 mt-1">মেয়াদোত্তীর্ণ হওয়ার আগে ডিপো রিটার্ন করুন</div>
        </div>
      </div>

      {/* Inventory Controls & Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ফার্মেসি ইনভেন্টরি ও স্টক ম্যানেজমেন্ট
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ব্যাচ নম্বর, মেয়াদ উত্তীর্ণের তারিখ, তাক/র‍্যাক লোকেশন এবং ক্রয়-বিক্রয় মূল্য অনুযায়ী স্টক নিয়ন্ত্রণ করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল স্টক ({inventory.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('low_stock')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterMode === 'low_stock'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                স্টক স্বল্পতা ({metrics.lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('expiring')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterMode === 'expiring'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                মেয়াদ সতর্কতা ({metrics.expiringCount})
              </button>
            </div>

            <button
              type="button"
              onClick={openNewModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              নতুন স্টক এন্ট্রি করুন
            </button>
          </div>
        </div>

        {/* Search Bar & Dosage Form Quick-Filter (Syp, Cap, Tab, Supp, Inhaler, Sachet) */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ওষুধের নাম, ফর্ম (Syp, Cap, Tab, Supp, Inhaler, Sachet), mg/ml বা ব্যাচ দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                  title="সার্চ মুছে ফেলুন"
                  aria-label="সার্চ মুছে ফেলুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              ফর্ম (Syp, Cap, Tab, Supp, Inhaler, Sachet) ও mg/ml অনুপাতে একক এবং মোট স্টকের দাম প্রদর্শিত হচ্ছে
            </div>
          </div>

          {/* Dosage Form Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap shrink-0 mr-1">
              ফর্ম অনুযায়ী স্টক ফিল্টার:
            </span>
            {[
              { code: 'ALL', label: 'সবগুলো ফর্ম' },
              { code: 'Tab', label: 'Tab (ট্যাবলেট - mg)' },
              { code: 'Cap', label: 'Cap (ক্যাপসুল - mg)' },
              { code: 'Syp', label: 'Syp (সিরাপ - ml)' },
              { code: 'Susp', label: 'Susp (সাসপেনশন - ml)' },
              { code: 'Supp', label: 'Supp (সাপোজিটরি - mg)' },
              { code: 'Inhaler', label: 'Inhaler (ইনহেলার - mcg)' },
              { code: 'Sachet', label: 'Sachet (স্যাচেট - mg/g)' },
              { code: 'Eye Drop', label: 'Eye Drop (চোখের ড্রপ)' },
              { code: 'Ear Drop', label: 'Ear Drop (কানের ড্রপ)' },
              { code: 'Nasal Drop', label: 'Nasal Drop (নাকের ড্রপ)' },
              { code: 'Drops', label: 'P-Drops (শিশুদের ড্রপ)' },
              { code: 'Inj', label: 'Inj (ইনজেকশন)' },
              { code: 'Gel/Cream', label: 'Cream/Gel' },
            ].map((f) => {
              const active = dosageFormFilter === f.code;
              return (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => setDosageFormFilter(f.code)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-teal-700 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* High-Density Inventory Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-4">ওষুধের নাম, ফর্ম (Syp/Cap/Tab/Supp) ও mg/ml</th>
                <th className="py-2.5 px-3">কোম্পানি</th>
                <th className="py-2.5 px-3">র‍্যাক ও ব্যাচ</th>
                <th className="py-2.5 px-3">মেয়াদ (Expiry)</th>
                <th className="py-2.5 px-3 text-right">একক ক্রয়মূল্য (৳)</th>
                <th className="py-2.5 px-3 text-right">একক বিক্রয় MRP (৳)</th>
                <th className="py-2.5 px-3 text-right">বর্তমান স্টক</th>
                <th className="py-2.5 px-3 text-right">স্টক অনুপাতে মোট দাম (৳)</th>
                <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-500">
                    কোনো ইনভেন্টরি স্টক আইটেম পাওয়া যায়নি। উপরে &ldquo;নতুন স্টক এন্ট্রি করুন&rdquo; বাটনে ক্লিক করে স্টক যোগ করুন।
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stockQty <= item.minStockLevel;
                  const expiring = isExpiringSoon(item.expiryDate);
                  const shortForm = getShortDosageForm(item.dosageForm);
                  const unitLbl = getUnitLabelForForm(item.dosageForm);
                  const totalStockMrp = item.stockQty * item.unitPrice;
                  const totalStockCost = item.stockQty * item.purchasePrice;
                  const isCore = isCoreInventoryItem(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{item.brandName}</span>
                          {/* Cart Action Buttons right beside product name */}
                          <div className="inline-flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                            {onAddToPosCart && (
                              <button
                                type="button"
                                onClick={() => {
                                  const matchedMed: MedicineCatalogItem = catalog.find((c) => c.id === item.medicineId) || {
                                    id: item.medicineId || item.id,
                                    brandName: item.brandName,
                                    genericName: item.genericName,
                                    companyName: item.companyName,
                                    strength: item.strength,
                                    dosageForm: (item.dosageForm as MedicineCatalogItem['dosageForm']) || 'Tablet',
                                    packSize: item.packSize,
                                    unitsPerStrip: 10,
                                    purchasePrice: item.purchasePrice,
                                    unitPrice: item.unitPrice,
                                    stripPrice: item.unitPrice * 10,
                                    therapeuticClass: 'General',
                                    indication: 'নিয়মিত সেব্য',
                                    darNo: '000-000-00',
                                    isCoreProduct: false,
                                  };
                                  onAddToPosCart(matchedMed, 1);
                                }}
                                title="বিক্রয় কার্ট / Sell Cart-এ যোগ করুন"
                                className="px-2 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              >
                                <ShoppingCart className="w-3 h-3 text-emerald-700" />
                                <span>বিক্রয়</span>
                              </button>
                            )}
                            {onAddToPurchaseCart && (
                              <button
                                type="button"
                                onClick={() => {
                                  const matchedMed: MedicineCatalogItem = catalog.find((c) => c.id === item.medicineId) || {
                                    id: item.medicineId || item.id,
                                    brandName: item.brandName,
                                    genericName: item.genericName,
                                    companyName: item.companyName,
                                    strength: item.strength,
                                    dosageForm: (item.dosageForm as MedicineCatalogItem['dosageForm']) || 'Tablet',
                                    packSize: item.packSize,
                                    unitsPerStrip: 10,
                                    purchasePrice: item.purchasePrice,
                                    unitPrice: item.unitPrice,
                                    stripPrice: item.unitPrice * 10,
                                    therapeuticClass: 'General',
                                    indication: 'নিয়মিত সেব্য',
                                    darNo: '000-000-00',
                                    isCoreProduct: false,
                                  };
                                  onAddToPurchaseCart(matchedMed, 10);
                                }}
                                title="ক্রয় কার্ট / Purchase Cart-এ যোগ করুন"
                                className="px-2 py-0.5 text-[11px] font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              >
                                <Package className="w-3 h-3 text-indigo-700" />
                                <span>ক্রয়</span>
                              </button>
                            )}
                          </div>
                          <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 rounded">
                            {shortForm} · {item.strength}
                          </span>
                          {isCore && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                              মূল প্রোডাক্ট
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.genericName} · <span className="text-slate-400">{item.packSize}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600">
                        {item.companyName}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600 font-mono tabular-nums">
                        <div>{item.shelfLocation}</div>
                        <div className="text-slate-400">Batch: {item.batchNo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-mono tabular-nums">
                        <span className={expiring ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                          {item.expiryDate}
                        </span>
                        {expiring && (
                          <div className="text-red-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> মেয়াদ নিকটবর্তী
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-indigo-900">৳{item.purchasePrice.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">ক্রয় / প্রতি {unitLbl}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-teal-800">৳{item.unitPrice.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-500">
                          {unitLbl === 'পিস' || unitLbl === 'সাপোজিটরি' || unitLbl === 'স্যাচেট'
                            ? `পাতা/বক্স: ৳${item.stripPrice.toFixed(2)}`
                            : `বিক্রয় / প্রতি ${unitLbl}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div
                          className={`font-bold ${
                            isLow ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {item.stockQty} {unitLbl}
                        </div>
                        <div className="text-xs text-slate-400">
                          সতর্কতা সীমা: {item.minStockLevel}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-teal-800">
                          ৳{totalStockMrp.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ক্রয়: ৳{totalStockCost.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickRestock(item, 100)}
                            className="px-2 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            title="দ্রুত ১০০ পিস স্টক যোগ করুন"
                          >
                            <PackagePlus className="w-3.5 h-3.5" /> +১০০
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            title="ক্রয় মূল্য, বিক্রয় মূল্য ও স্টক পরিবর্তন করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> মূল্য/স্টক এডিট
                          </button>
                          {isCore ? (
                            <span
                              className="px-2 py-1 text-[11px] font-medium text-slate-500 bg-slate-100 rounded flex items-center gap-1 whitespace-nowrap shrink-0"
                              title="ডাটাবেস এ থাকা মূল প্রোডাক্ট ডিলিট করা যাবে না"
                            >
                              <Lock className="w-3 h-3 text-slate-400" /> স্থায়ী
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onDeleteInventoryItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="কাস্টম স্টক মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Add / Edit Inventory Modal with Searchable & Selectable Medicine Name, Company Name & Generic Name */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-4 sm:p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'ইনভেন্টরি স্টক সম্পাদনা করুন' : 'নতুন ওষুধ স্টকে যুক্ত করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Top Search & Select Box from 21,000+ Medicines and 250+ Companies */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-teal-700" />
                    ক্যাটালগ থেকে ঔষধ / কোম্পানি সার্চ বা লিস্ট থেকে সিলেক্ট করুন (অটো-ফিল)
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ২১,০০০+ ঔষধ · ২৫০+ কোম্পানি
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  {/* Search input for Medicine or Company */}
                  <div className="sm:col-span-7 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={modalCatalogSearch}
                      onChange={(e) => setModalCatalogSearch(e.target.value)}
                      placeholder="ঔষধের নাম (যেমন: Napa, Seclo, Maxpro) বা কোম্পানি লিখে সার্চ..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                    />
                    {modalCatalogSearch && (
                      <button
                        type="button"
                        onClick={() => setModalCatalogSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter by Company */}
                  <div className="sm:col-span-5">
                    <select
                      value={modalCompanyFilter}
                      onChange={(e) => {
                        const comp = e.target.value;
                        setModalCompanyFilter(comp);
                        if (comp !== 'ALL') {
                          setCompanyName(comp);
                        }
                      }}
                      aria-label="কোম্পানি ফিল্টার"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                    >
                      <option value="ALL">সকল কোম্পানি ({BD_PHARMA_COMPANIES.length}টি)</option>
                      {BD_PHARMA_COMPANIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Search Results Clickable List when typing */}
                {modalCatalogSearch.trim().length > 0 && (
                  <div className="bg-white border border-teal-300 rounded-md max-h-44 overflow-y-auto divide-y divide-slate-100 shadow-xs">
                    {filteredModalCatalog.length === 0 ? (
                      <div className="p-2.5 text-xs text-slate-500 text-center">
                        কোনো মিল পাওয়া যায়নি। নিচে সরাসরি নাম লিখে যুক্ত করতে পারবেন।
                      </div>
                    ) : (
                      filteredModalCatalog.slice(0, 25).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            applyMedicineSelection(m);
                            setModalCatalogSearch('');
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{m.brandName}</span>{' '}
                            <span className="text-slate-600">{m.strength} ({m.dosageForm})</span>
                            <div className="text-[11px] text-slate-500">
                              {m.genericName} · <strong className="text-slate-700">{m.companyName}</strong>
                            </div>
                          </div>
                          <div className="text-right font-mono shrink-0">
                            <span className="font-bold text-indigo-700">ক্রয় ৳{getMedPurchasePrice(m).toFixed(2)}</span>
                            <span className="mx-1 text-slate-300">|</span>
                            <span className="font-bold text-teal-700">বিক্রয় ৳{m.unitPrice.toFixed(2)}</span>
                            <div className="text-[10px] text-slate-400">সিলেক্ট করুন</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Select Dropdown of filtered catalog */}
                <div>
                  <select
                    value={selectedMedId}
                    onChange={(e) => handleCatalogPick(e.target.value)}
                    aria-label="ক্যাটালগ থেকে ঔষধ নির্বাচন করুন"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                  >
                    {filteredModalCatalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brandName} {c.strength} ({c.genericName}) — {c.companyName} — ক্রয় ৳{getMedPurchasePrice(c).toFixed(2)} | বিক্রয় ৳{c.unitPrice.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 1: Medicine Name (ব্র্যান্ড নাম *) & Generic Name (জেনেরিক গ্রুপ *) with Search + Select Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Brand / Medicine Name Searchable + Selectable Combobox */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-teal-700" />
                      ব্র্যান্ড নাম (Medicine Name) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBrandListDropdown((v) => !v);
                        setShowCompanyListDropdown(false);
                        setShowGenericListDropdown(false);
                      }}
                      className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      লিস্ট থেকে সিলেক্ট <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={brandName}
                      onFocus={() => {
                        setShowBrandListDropdown(true);
                        setShowCompanyListDropdown(false);
                        setShowGenericListDropdown(false);
                      }}
                      onChange={(e) => {
                        setBrandName(e.target.value);
                        setShowBrandListDropdown(true);
                      }}
                      placeholder="ঔষধের নাম লিখুন বা লিস্ট থেকে সিলেক্ট করুন..."
                      className="w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBrandListDropdown((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="ঔষধের লিস্ট দেখুন"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {showBrandListDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                      <div className="px-2.5 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between sticky top-0">
                        <span>ঔষধের লিস্ট (ক্লিক করে সিলেক্ট করুন)</span>
                        <button
                          type="button"
                          onClick={() => setShowBrandListDropdown(false)}
                          className="text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          বন্ধ ✕
                        </button>
                      </div>
                      {matchingBrandSuggestions.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => applyMedicineSelection(m)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {m.brandName} <span className="font-normal text-slate-500">{m.strength}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.genericName} · {m.companyName}
                            </div>
                          </div>
                          <span className="font-mono font-semibold text-teal-700 shrink-0">
                            ৳{m.unitPrice.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generic Name Searchable + Selectable Combobox */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                      জেনেরিক গ্রুপ (Generic) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGenericListDropdown((v) => !v);
                        setShowBrandListDropdown(false);
                        setShowCompanyListDropdown(false);
                      }}
                      className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      ১,৮০০+ জেনেরিক লিস্ট <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={genericName}
                      onFocus={() => {
                        setShowGenericListDropdown(true);
                        setShowBrandListDropdown(false);
                        setShowCompanyListDropdown(false);
                      }}
                      onChange={(e) => {
                        setGenericName(e.target.value);
                        setShowGenericListDropdown(true);
                      }}
                      placeholder="জেনেরিক নাম লিখুন বা সিলেক্ট করুন..."
                      className="w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGenericListDropdown((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="জেনেরিক লিস্ট দেখুন"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {showGenericListDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                      <div className="px-2.5 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between sticky top-0">
                        <span>জেনেরিক লিস্ট ({BD_GENERICS_DIRECTORY.length}+ জেনেরিক)</span>
                        <button
                          type="button"
                          onClick={() => setShowGenericListDropdown(false)}
                          className="text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          বন্ধ ✕
                        </button>
                      </div>
                      {matchingGenerics.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setGenericName(g.genericName);
                            setShowGenericListDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{g.genericName}</div>
                            <div className="text-[11px] text-slate-500">{g.therapeuticClass}</div>
                          </div>
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 opacity-60" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Company Name (কোম্পানি * - Searchable & Selectable from 250+ Companies), Strength & Form */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Company Name Searchable + Selectable Combobox (6 cols on desktop, full width on mobile!) */}
                <div className="sm:col-span-6 relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-teal-700" />
                      কোম্পানি (Company Name) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCompanyListDropdown((v) => !v);
                        setShowBrandListDropdown(false);
                        setShowGenericListDropdown(false);
                      }}
                      className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      ২৫০+ কোম্পানি লিস্ট <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={companyName}
                      onFocus={() => {
                        setShowCompanyListDropdown(true);
                        setShowBrandListDropdown(false);
                        setShowGenericListDropdown(false);
                      }}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        setShowCompanyListDropdown(true);
                      }}
                      placeholder="কোম্পানির নাম সার্চ বা সিলেক্ট করুন..."
                      className="w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCompanyListDropdown((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="২৫০+ কোম্পানির লিস্ট দেখুন"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {showCompanyListDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                      <div className="px-2.5 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between sticky top-0">
                        <span>কোম্পানি সিলেক্ট করুন ({matchingCompanies.length}টি কোম্পানি)</span>
                        <button
                          type="button"
                          onClick={() => setShowCompanyListDropdown(false)}
                          className="text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          বন্ধ ✕
                        </button>
                      </div>
                      {matchingCompanies.map((comp) => (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => {
                            setCompanyName(comp);
                            setModalCompanyFilter(comp);
                            setShowCompanyListDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-teal-50 flex items-center justify-between cursor-pointer ${
                            companyName === comp ? 'bg-teal-50 font-bold text-teal-900' : 'text-slate-800'
                          }`}
                        >
                          <span>{comp}</span>
                          {companyName === comp && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strength & Volume (mg / ml) */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মাত্রা / পরিমাণ (mg / ml) *
                  </label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => handleStrengthChangeWithProportionalPrice(e.target.value)}
                    placeholder="500 mg / 60 ml / 250 mg"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                  />
                </div>

                {/* Dosage Form Selectable + Proportional Price Trigger */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধরন (ফর্ম) *
                  </label>
                  <select
                    value={dosageForm}
                    onChange={(e) => handleDosageFormChange(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm bg-white border border-slate-300 rounded-md focus:border-teal-600 focus:outline-none"
                  >
                    <option value="Tablet">Tab (Tablet - mg)</option>
                    <option value="Capsule">Cap (Capsule - mg)</option>
                    <option value="Syrup">Syp (Syrup - ml)</option>
                    <option value="Suspension">Susp (Suspension - ml)</option>
                    <option value="Suppository">Supp (Suppository - mg)</option>
                    <option value="Inhaler">Inhaler (mcg/puff)</option>
                    <option value="Sachet">Sachet (mg / g)</option>
                    <option value="Eye Drop">Eye Drop (চোখের ড্রপ - ml)</option>
                    <option value="Ear Drop">Ear Drop (কানের ড্রপ - ml)</option>
                    <option value="Nasal Drop">Nasal Drop (নাকের ড্রপ - ml)</option>
                    <option value="Drops">P-Drops (শিশুদের ড্রপ - ml)</option>
                    <option value="Injection">Inj (Injection - mg/ml)</option>
                    <option value="Gel">Gel / Cream (g / ml)</option>
                  </select>
                </div>
              </div>

              {/* Medicine-Specific Variants Selector (instead of generic all-options wall) */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2">
                {brandFormAndStrengthVariants.length > 0 ? (
                  <div>
                    <div className="text-xs font-bold text-teal-950 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span>
                        নির্বাচিত ওষুধ ({brandName})-এর উপলব্ধ সকল প্রকারভেদ ও মাত্রা ({brandFormAndStrengthVariants.length}টি প্রকার):
                      </span>
                      <span className="text-[11px] font-medium text-teal-700">
                        যেকোনো প্রকারে ক্লিক করলে নাম, ফর্ম, মাত্রা ও দাম অটো-সেট হবে
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {brandFormAndStrengthVariants.map((v) => {
                        const vShort = getShortDosageForm(v.dosageForm);
                        const isSelected =
                          v.brandName.toLowerCase() === brandName.trim().toLowerCase() &&
                          vShort === getShortDosageForm(dosageForm) &&
                          v.strength.toLowerCase() === strength.trim().toLowerCase();
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => applyMedicineSelection(v)}
                            className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-teal-600 hover:bg-teal-50'
                            }`}
                          >
                            <span>{formatBrandVariantLabel(v, brandName)}</span>
                            <span
                              className={
                                isSelected ? 'text-teal-100 font-bold' : 'text-teal-700 font-bold'
                              }
                            >
                              — ক্রয় ৳{getMedPurchasePrice(v).toFixed(2)} | বিক্রয় ৳{v.unitPrice.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Fallback only when typing a brand new custom medicine not in catalog */
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-700">
                      নতুন কাস্টম ওষুধের ফর্ম ও মাত্রা নির্বাচন করুন:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {DOSAGE_FORM_OPTIONS.map((opt) => {
                        const active = getShortDosageForm(dosageForm) === opt.shortCode;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleDosageFormChange(opt.value)}
                            className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                              active
                                ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt.labelBn}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentFormMeta.defaultStrengths.map((strOpt) => {
                        const active = strength.trim().toLowerCase() === strOpt.toLowerCase();
                        return (
                          <button
                            key={strOpt}
                            type="button"
                            onClick={() => handleStrengthChangeWithProportionalPrice(strOpt)}
                            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                              active
                                ? 'bg-teal-700 text-white border-teal-700 font-bold'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500'
                            }`}
                          >
                            {strOpt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    প্রোডাক্টের ক্রয় মূল্য এবং বিক্রয় মূল্য (পরিবর্তনযোগ্য)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(unitPrice) || 0;
                      if (val > 0) {
                        setPurchasePrice((val * 0.88).toFixed(2));
                      }
                    }}
                    className="text-[11px] font-semibold text-indigo-700 hover:underline cursor-pointer"
                  >
                    বিক্রয় মূল্যের ৮৮% অটো-ক্রয়মূল্য বসাও
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 mb-1">
                      প্রতি {getUnitLabelForForm(dosageForm)} ক্রয় মূল্য (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono font-bold text-indigo-900 bg-white border border-indigo-300 rounded-md focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-900 mb-1">
                      প্রতি {getUnitLabelForForm(dosageForm)} বিক্রয় মূল্য (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={unitPrice}
                      onChange={(e) => {
                        setUnitPrice(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!Number.isNaN(val)) {
                          const mult = currentFormMeta.defaultUnitsPerStrip;
                          setStripPrice((val * mult).toFixed(2));
                        }
                      }}
                      className="w-full px-3 py-2 text-sm font-mono font-bold text-teal-900 bg-white border border-teal-300 rounded-md focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      প্রতি {currentFormMeta.packLabelBn} বিক্রয় মূল্য (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={stripPrice}
                      onChange={(e) => setStripPrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    বর্তমান স্টক সংখ্যা ({getUnitLabelForForm(dosageForm)}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    স্টক স্বল্পতা সতর্কতা সীমা ({getUnitLabelForForm(dosageForm)}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              {/* Live Proportional Stock Price Summary Card */}
              <div className="p-3 bg-slate-900 text-white rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-300">নির্বাচিত ফর্ম ও মাত্রা:</span>{' '}
                  <strong className="text-teal-300 font-mono">
                    {brandName || 'ওষুধ'} ({getShortDosageForm(dosageForm)} — {strength})
                  </strong>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    প্রতি {getUnitLabelForForm(dosageForm)} বিক্রয়: ৳{(parseFloat(unitPrice) || 0).toFixed(2)} · ক্রয়: ৳{(parseFloat(purchasePrice) || 0).toFixed(2)} · স্টক: {parseInt(stockQty, 10) || 0} {getUnitLabelForForm(dosageForm)}
                  </div>
                </div>
                <div className="sm:text-right font-mono">
                  <div className="text-sm font-bold text-emerald-400">
                    মোট স্টক বিক্রয়মূল্য: ৳{((parseInt(stockQty, 10) || 0) * (parseFloat(unitPrice) || 0)).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    মোট ক্রয়মূল্য: ৳{((parseInt(stockQty, 10) || 0) * (parseFloat(purchasePrice) || 0)).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ব্যাচ নম্বর (Batch No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মেয়াদ উত্তীর্ণের তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    তাক / র‍্যাক লোকেশন *
                  </label>
                  <input
                    type="text"
                    required
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    placeholder="Rack A-1"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'স্টক সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
