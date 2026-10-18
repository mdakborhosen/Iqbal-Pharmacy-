import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Bell,
  BellRing,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  FlaskConical,
  Link2,
  Package,
  PackagePlus,
  Pill,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  BD_COMPANIES_DIRECTORY,
  BD_GENERICS_DIRECTORY,
  BD_PHARMA_COMPANIES,
  calculateProportionalMedicinePrice,
  DOSAGE_FORM_OPTIONS,
  formatBrandVariantLabel,
  getBrandFormAndStrengthVariants,
  getCompleteCompanyGenericItems,
  getShortDosageForm,
  getUnitLabelForForm,
  isCoreDatabaseMedicineId,
  matchesMedicineQuery,
  searchAndRankMedicines,
} from '../data/bdMedicines';
import { InventoryItem, MedicineCatalogItem, PriceAlert, PriceWatch } from '../types';

interface MedicineCompareViewProps {
  catalog: MedicineCatalogItem[];
  inventory: InventoryItem[];
  priceWatches: PriceWatch[];
  priceAlerts: PriceAlert[];
  publicAppUrl: string;
  onAddToPosCart: (med: MedicineCatalogItem, qty: number) => void;
  onAddToPurchaseCart?: (med: MedicineCatalogItem, qty?: number) => void;
  onQuickAddInventory: (med: MedicineCatalogItem) => void;
  onSaveMedicineCatalog: (
    med: Omit<MedicineCatalogItem, 'id' | 'darNo' | 'unitsPerStrip'>,
    existingMed?: MedicineCatalogItem
  ) => Promise<void>;
  onDeleteCustomMedicine: (medId: string) => Promise<void>;
  onTogglePriceWatch: (med: MedicineCatalogItem) => Promise<void>;
  onMarkAlertRead: (alertId: string) => Promise<void>;
  onDeletePriceAlert: (alertId: string) => Promise<void>;
}

const ALPHABET = [
  'ALL',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

const PAGE_SIZE = 50;

export const MedicineCompareView: React.FC<MedicineCompareViewProps> = ({
  catalog,
  inventory,
  priceWatches,
  priceAlerts,
  publicAppUrl,
  onAddToPosCart,
  onAddToPurchaseCart,
  onQuickAddInventory,
  onSaveMedicineCatalog,
  onDeleteCustomMedicine,
  onTogglePriceWatch,
  onMarkAlertRead,
  onDeletePriceAlert,
}) => {
  const [directoryTab, setDirectoryTab] = useState<'medicines' | 'companies' | 'generics'>('medicines');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedGeneric, setSelectedGeneric] = useState<string>('ALL');
  const [selectedDosageForm, setSelectedDosageForm] = useState<string>('ALL');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeMedicineId, setActiveMedicineId] = useState<string>('med-seclo-20');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);
  const [showWatchCenter, setShowWatchCenter] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Add / Edit Medicine Modal states
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicineCatalogItem | null>(null);
  const [medBrand, setMedBrand] = useState('');
  const [medGeneric, setMedGeneric] = useState('Omeprazole');
  const [medCompany, setMedCompany] = useState<string>(BD_PHARMA_COMPANIES[0]);
  const [medStrength, setMedStrength] = useState('20 mg');
  const [medForm, setMedForm] = useState<MedicineCatalogItem['dosageForm']>('Capsule');
  const [medPackSize, setMedPackSize] = useState('10 × 10 (100 pcs)');
  const [medPurchasePrice, setMedPurchasePrice] = useState('5.28');
  const [medUnitPrice, setMedUnitPrice] = useState('6.00');
  const [medStripPrice, setMedStripPrice] = useState('60.00');
  const [medClass, setMedClass] = useState('Proton Pump Inhibitor');
  const [medIndication, setMedIndication] = useState('গ্যাস্ট্রিক ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত');
  const [submittingMed, setSubmittingMed] = useState(false);
  const [showModalBrandList, setShowModalBrandList] = useState(false);
  const [showModalGenericList, setShowModalGenericList] = useState(false);
  const [showModalCompanyList, setShowModalCompanyList] = useState(false);

  const getMedPurchasePrice = (med: MedicineCatalogItem): number => {
    const invMatch = inventory.find(
      (i) =>
        i.medicineId === med.id ||
        (i.brandName.trim().toLowerCase() === med.brandName.trim().toLowerCase() &&
          i.strength.trim().toLowerCase() === med.strength.trim().toLowerCase() &&
          getShortDosageForm(i.dosageForm) === getShortDosageForm(med.dosageForm))
    );
    if (med.purchasePrice !== undefined && med.purchasePrice > 0) {
      return med.purchasePrice;
    }
    if (invMatch && invMatch.purchasePrice > 0) {
      return invMatch.purchasePrice;
    }
    return Number((med.unitPrice * 0.88).toFixed(2));
  };

  const isCoreCatalogMed = (med: MedicineCatalogItem): boolean => {
    if (med.isCoreProduct) return true;
    if (isCoreDatabaseMedicineId(med.id)) return true;
    return !med.isCustom;
  };

  const modalBrandMatches = useMemo(() => {
    const q = medBrand.trim();
    const list: MedicineCatalogItem[] = [];
    for (let i = 0; i < catalog.length && list.length < 60; i++) {
      const m = catalog[i];
      if (!q || matchesMedicineQuery(m, q)) {
        list.push(m);
      }
    }
    return list;
  }, [catalog, medBrand]);

  const modalGenericMatches = useMemo(() => {
    const q = medGeneric.trim().toLowerCase();
    if (!q) return BD_GENERICS_DIRECTORY.slice(0, 60);
    return BD_GENERICS_DIRECTORY.filter((g) => g.genericName.toLowerCase().includes(q)).slice(0, 60);
  }, [medGeneric]);

  const modalCompanyMatches = useMemo(() => {
    const q = medCompany.trim().toLowerCase();
    if (!q) return BD_PHARMA_COMPANIES;
    const filtered = BD_PHARMA_COMPANIES.filter((c) => c.toLowerCase().includes(q));
    return filtered.length > 0 ? filtered : BD_PHARMA_COMPANIES;
  }, [medCompany]);

  const handleCopyPublicLink = () => {
    navigator.clipboard?.writeText(publicAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const watchedIds = useMemo(() => {
    const set = new Set<string>();
    for (const w of priceWatches) {
      set.add(w.medicineId);
      set.add(w.brandName.toLowerCase());
    }
    return set;
  }, [priceWatches]);

  const unreadAlertsCount = useMemo(
    () => priceAlerts.filter((a) => !a.isRead).length,
    [priceAlerts]
  );

  // Map inventory stock by medicineId and exact brand+strength+form
  const stockByMedicine = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.medicineId, (map.get(item.medicineId) || 0) + item.stockQty);
      const compositeKey = `${item.brandName.trim().toLowerCase()}__${item.strength.trim().toLowerCase()}__${getShortDosageForm(item.dosageForm).toLowerCase()}`;
      map.set(compositeKey, (map.get(compositeKey) || 0) + item.stockQty);
    }
    return map;
  }, [inventory]);

  // Compute available dosages per generic name
  const dosagesByGeneric = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of catalog) {
      const key = m.genericName.toLowerCase();
      if (!map.has(key)) map.set(key, new Set());
      const set = map.get(key)!;
      if (set.size < 6) {
        set.add(`${m.strength} (${m.dosageForm})`);
      }
    }
    return map;
  }, [catalog]);

  // Filtered 36,000+ Medicines with Complete 13 Dosage Forms per Company & Generic + Exact Brand Priority Ranking
  const filteredMedicines = useMemo(() => {
    const q = searchQuery.trim();

    const baseFiltered = getCompleteCompanyGenericItems({
      catalog,
      selectedCompany,
      selectedGeneric,
      selectedDosageForm,
      selectedLetter,
    });

    if (!q) return baseFiltered;
    return searchAndRankMedicines(baseFiltered, q);
  }, [catalog, searchQuery, selectedCompany, selectedGeneric, selectedDosageForm, selectedLetter]);

  // Filtered 250+ Companies
  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const letter = selectedLetter === 'ALL' ? '' : selectedLetter.toLowerCase();
    return BD_COMPANIES_DIRECTORY.filter((c) => {
      if (letter && !c.companyName.toLowerCase().startsWith(letter)) return false;
      if (!q) return true;
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.topGenerics.some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedLetter]);

  // Filtered 1,800+ Generics
  const filteredGenerics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const letter = selectedLetter === 'ALL' ? '' : selectedLetter.toLowerCase();
    return BD_GENERICS_DIRECTORY.filter((g) => {
      if (letter && !g.genericName.toLowerCase().startsWith(letter)) return false;
      if (!q) return true;
      return (
        g.genericName.toLowerCase().includes(q) ||
        g.therapeuticClass.toLowerCase().includes(q) ||
        g.indication.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedLetter]);

  // Paginated Slices for 60fps rendering
  const totalMedicinePages = Math.max(1, Math.ceil(filteredMedicines.length / PAGE_SIZE));
  const safeMedPage = Math.min(currentPage, totalMedicinePages);
  const paginatedMedicines = useMemo(() => {
    const start = (safeMedPage - 1) * PAGE_SIZE;
    return filteredMedicines.slice(start, start + PAGE_SIZE);
  }, [filteredMedicines, safeMedPage]);

  const totalGenericPages = Math.max(1, Math.ceil(filteredGenerics.length / PAGE_SIZE));
  const safeGenPage = Math.min(currentPage, totalGenericPages);
  const paginatedGenerics = useMemo(() => {
    const start = (safeGenPage - 1) * PAGE_SIZE;
    return filteredGenerics.slice(start, start + PAGE_SIZE);
  }, [filteredGenerics, safeGenPage]);

  const activeMedicine = useMemo(() => {
    return (
      catalog.find((m) => m.id === activeMedicineId) ||
      filteredMedicines[0] ||
      catalog[0]
    );
  }, [catalog, activeMedicineId, filteredMedicines]);

  // Same Generic Group + Strength Substitutes sorted by Unit Price ascending
  const genericSubstitutes = useMemo(() => {
    if (!activeMedicine) return [];
    const targetGen = activeMedicine.genericName.toLowerCase();
    const targetStr = activeMedicine.strength.toLowerCase();
    return catalog
      .filter(
        (m) =>
          m.genericName.toLowerCase() === targetGen &&
          m.strength.toLowerCase() === targetStr
      )
      .sort((a, b) => a.unitPrice - b.unitPrice)
      .slice(0, 45);
  }, [catalog, activeMedicine]);

  const otherStrengthBrands = useMemo(() => {
    if (!activeMedicine) return [];
    const targetGen = activeMedicine.genericName.toLowerCase();
    const targetStr = activeMedicine.strength.toLowerCase();
    return catalog
      .filter(
        (m) =>
          m.genericName.toLowerCase() === targetGen &&
          m.strength.toLowerCase() !== targetStr
      )
      .slice(0, 14);
  }, [catalog, activeMedicine]);

  const activeBrandFormStrengthVariants = useMemo(() => {
    if (!activeMedicine) return [];
    return getBrandFormAndStrengthVariants(
      catalog,
      activeMedicine.brandName,
      activeMedicine.genericName
    );
  }, [catalog, activeMedicine]);

  const modalBrandVariants = useMemo(() => {
    if (!medBrand.trim()) return [];
    return getBrandFormAndStrengthVariants(catalog, medBrand, medGeneric);
  }, [catalog, medBrand, medGeneric]);

  const modalFormMeta = useMemo(() => {
    const short = getShortDosageForm(medForm);
    return (
      DOSAGE_FORM_OPTIONS.find((o) => o.shortCode === short) ||
      DOSAGE_FORM_OPTIONS[0]
    );
  }, [medForm]);

  const handleModalFormChange = (newForm: MedicineCatalogItem['dosageForm']) => {
    setMedForm(newForm);
    const short = getShortDosageForm(newForm);
    const meta =
      DOSAGE_FORM_OPTIONS.find((o) => o.shortCode === short) ||
      DOSAGE_FORM_OPTIONS[0];
    const nextStrength = meta.defaultStrengths[2] || meta.defaultStrengths[0];
    setMedStrength(nextStrength);
    const calc = calculateProportionalMedicinePrice({
      catalog,
      brandName: medBrand,
      genericName: medGeneric,
      targetForm: newForm,
      targetStrength: nextStrength,
      currentUnitPrice: parseFloat(medUnitPrice) || 6.0,
    });
    setMedPurchasePrice(calc.purchasePrice.toFixed(2));
    setMedUnitPrice(calc.unitPrice.toFixed(2));
    setMedStripPrice(calc.stripPrice.toFixed(2));
    setMedPackSize(calc.packSize);
  };

  const handleModalStrengthChange = (newStrength: string) => {
    setMedStrength(newStrength);
    if (!newStrength.trim()) return;
    const calc = calculateProportionalMedicinePrice({
      catalog,
      brandName: medBrand,
      genericName: medGeneric,
      targetForm: medForm,
      targetStrength: newStrength,
      currentUnitPrice: parseFloat(medUnitPrice) || 6.0,
    });
    setMedPurchasePrice(calc.purchasePrice.toFixed(2));
    setMedUnitPrice(calc.unitPrice.toFixed(2));
    setMedStripPrice(calc.stripPrice.toFixed(2));
    setMedPackSize(calc.packSize);
  };

  const highestPriceInGroup = useMemo(() => {
    if (genericSubstitutes.length === 0) return 0;
    return Math.max(...genericSubstitutes.map((m) => m.unitPrice));
  }, [genericSubstitutes]);

  const lowestPriceInGroup = useMemo(() => {
    if (genericSubstitutes.length === 0) return 0;
    return Math.min(...genericSubstitutes.map((m) => m.unitPrice));
  }, [genericSubstitutes]);

  const handleAddPos = (med: MedicineCatalogItem, qty = 10) => {
    onAddToPosCart(med, qty);
    setAddedFeedbackId(med.id);
    setTimeout(() => setAddedFeedbackId(null), 1200);
  };

  const openAddMedicineModal = () => {
    setEditingMed(null);
    setMedBrand('');
    setMedGeneric('Omeprazole');
    setMedCompany(BD_PHARMA_COMPANIES[0]);
    setMedStrength('20 mg');
    setMedForm('Capsule');
    setMedPackSize('10 × 10 (100 pcs)');
    setMedPurchasePrice('5.28');
    setMedUnitPrice('6.00');
    setMedStripPrice('60.00');
    setMedClass('Proton Pump Inhibitor');
    setMedIndication('গ্যাস্ট্রিক ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত');
    setShowMedModal(true);
  };

  const openEditMedicineModal = (med: MedicineCatalogItem) => {
    setEditingMed(med);
    setMedBrand(med.brandName);
    setMedGeneric(med.genericName);
    setMedCompany(med.companyName);
    setMedStrength(med.strength);
    setMedForm(med.dosageForm);
    setMedPackSize(med.packSize);
    setMedPurchasePrice(getMedPurchasePrice(med).toFixed(2));
    setMedUnitPrice(med.unitPrice.toFixed(2));
    setMedStripPrice(med.stripPrice.toFixed(2));
    setMedClass(med.therapeuticClass);
    setMedIndication(med.indication);
    setShowMedModal(true);
  };

  const handleSaveMedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medBrand.trim() || !medGeneric.trim()) return;
    setSubmittingMed(true);
    try {
      const parsedSellingPrice = Math.max(0.1, parseFloat(medUnitPrice) || 1);
      const parsedPurchasePrice = Math.max(
        0.01,
        parseFloat(medPurchasePrice) || Number((parsedSellingPrice * 0.88).toFixed(2))
      );
      await onSaveMedicineCatalog(
        {
          brandName: medBrand.trim(),
          genericName: medGeneric.trim(),
          companyName: medCompany,
          strength: medStrength.trim(),
          dosageForm: medForm,
          packSize: medPackSize.trim(),
          purchasePrice: parsedPurchasePrice,
          unitPrice: parsedSellingPrice,
          stripPrice: Math.max(1, parseFloat(medStripPrice) || 10),
          therapeuticClass: medClass.trim(),
          indication: medIndication.trim(),
        },
        editingMed || undefined
      );
      setShowMedModal(false);
    } finally {
      setSubmittingMed(false);
    }
  };

  const selectCompanyFromDirectory = (companyName: string) => {
    setSelectedCompany(companyName);
    setSelectedGeneric('ALL');
    setSelectedLetter('ALL');
    setSearchQuery('');
    setCurrentPage(1);
    setDirectoryTab('medicines');
    const firstMed = catalog.find((m) => m.companyName === companyName);
    if (firstMed) setActiveMedicineId(firstMed.id);
  };

  const selectGenericFromDirectory = (genericName: string) => {
    setSelectedGeneric(genericName);
    setSelectedCompany('ALL');
    setSelectedLetter('ALL');
    setSearchQuery('');
    setCurrentPage(1);
    setDirectoryTab('medicines');
    const firstMed = catalog.find(
      (m) => m.genericName.toLowerCase() === genericName.toLowerCase()
    );
    if (firstMed) setActiveMedicineId(firstMed.id);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ঔষধের নাম, জেনেরিক বা কোম্পানি লিখে সার্চ করুন..."
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-teal-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full cursor-pointer transition-colors"
                title="সার্চ মুছে ফেলুন"
                aria-label="সার্চ মুছে ফেলুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedGeneric}
              onChange={(e) => {
                setSelectedGeneric(e.target.value);
                setDirectoryTab('medicines');
                setCurrentPage(1);
              }}
              aria-label="জেনেরিক গ্রুপ ফিল্টার"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-teal-600 focus:outline-none"
            >
              <option value="ALL">সকল জেনেরিক গ্রুপ</option>
              {BD_GENERICS_DIRECTORY.slice(0, 350).map((g) => (
                <option key={g.id} value={g.genericName}>
                  {g.genericName}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setDirectoryTab('medicines');
                setCurrentPage(1);
              }}
              aria-label="কোম্পানি ফিল্টার"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-teal-600 focus:outline-none"
            >
              <option value="ALL">সকল প্রস্তুতকারক কোম্পানি</option>
              {BD_PHARMA_COMPANIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCompany('ALL');
                setSelectedGeneric('ALL');
                setSelectedDosageForm('ALL');
                setSelectedLetter('ALL');
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              রিসেট
            </button>
            <button
              type="button"
              onClick={openAddMedicineModal}
              className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন ঔষধ
            </button>
          </div>
        </div>

        {/* A–Z Alphabetical Index Filter Bar (MedEx Style) */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1.5 whitespace-nowrap shrink-0">
            A–Z ইনডেক্স:
          </span>
          {ALPHABET.map((letter) => {
            const active = selectedLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  setSelectedLetter(letter);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 text-xs font-mono font-semibold rounded transition-colors shrink-0 cursor-pointer ${
                  active
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {letter === 'ALL' ? 'সবগুলো' : letter}
              </button>
            );
          })}
        </div>

        {/* Popular Generic Quick-Pick Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-xs font-medium text-slate-500 mr-1 whitespace-nowrap shrink-0">
            জনপ্রিয় জেনেরিক গ্রুপ:
          </span>
          {[
            'ALL',
            'Cefuroxime Axetil + Clavulanic Acid',
            'Moxifloxacin Ophthalmic Solution',
            'Xylometazoline Hydrochloride Nasal Drops',
            'Ciprofloxacin Ophthalmic & Otic Solution',
            'Probiotic Combination (4 Billion CFU)',
            'Omeprazole',
            'Esomeprazole',
            'Paracetamol',
            'Cefixime Trihydrate',
            'Azithromycin',
            'Montelukast Sodium',
            'Calcium Carbonate + Vitamin D3',
          ].map((grp) => {
            const active = selectedGeneric === grp && directoryTab === 'medicines';
            return (
              <button
                key={grp}
                type="button"
                onClick={() => {
                  setSelectedGeneric(grp);
                  setDirectoryTab('medicines');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {grp === 'ALL' ? 'সবগুলো (২১,০০০+)' : grp}
              </button>
            );
          })}
        </div>

        {/* Quick Brand & Drop Search Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-xs font-semibold text-teal-800 mr-1 whitespace-nowrap shrink-0">
            জনপ্রিয় ওষুধ ও ড্রপস কুইক সার্চ:
          </span>
          {[
            { label: 'Noret-28', query: 'Noret', form: 'ALL' },
            { label: 'Femicon / Femicom', query: 'Femicon', form: 'ALL' },
            { label: 'Microlon / Minicon', query: 'Microlon', form: 'ALL' },
            { label: 'Marvelon', query: 'Marvelon', form: 'ALL' },
            { label: 'Ovastat / Ovostat', query: 'Ovastat', form: 'ALL' },
            { label: 'Zox (Square)', query: 'Zox', form: 'ALL' },
            { label: 'Aristomom', query: 'Aristomom', form: 'ALL' },
            { label: 'Normens (Renata)', query: 'Normens', form: 'ALL' },
            { label: 'Ximeclav', query: 'Ximeclav', form: 'ALL' },
            { label: 'Cefotil Plus', query: 'Cefotil Plus', form: 'ALL' },
            { label: 'Eye Drop (চোখের ড্রপ)', query: '', form: 'Eye Drop' },
            { label: 'Ear Drop (কানের ড্রপ)', query: '', form: 'Ear Drop' },
            { label: 'Nasal Drop (নাকের ড্রপ)', query: '', form: 'Nasal Drop' },
            { label: 'Probio Sachet', query: 'Probio', form: 'ALL' },
            { label: 'Entacyd Plus', query: 'Entacyd Plus', form: 'ALL' },
            { label: 'Lorix Plus', query: 'Lorix Plus', form: 'ALL' },
          ].map((item) => {
            const isActive =
              (item.query && searchQuery.toLowerCase() === item.query.toLowerCase()) ||
              (!item.query && selectedDosageForm === item.form);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setDirectoryTab('medicines');
                  setSelectedGeneric('ALL');
                  setSelectedCompany('ALL');
                  setSelectedLetter('ALL');
                  setSearchQuery(item.query);
                  setSelectedDosageForm(item.form);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-teal-50/70 text-teal-900 border-teal-200 hover:bg-teal-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Monitoring & Automatic Alert Notification System Panel */}
      {showWatchCenter && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900">
                ওষুধের মূল্য নিরীক্ষণ (Price Tracker) ও স্বয়ংক্রিয় মূল্য পরিবর্তন অ্যালার্ট সিস্টেম
              </h2>
            </div>
            <div className="text-xs text-slate-500">
              যেকোনো ওষুধের মূল্য পরিবর্তন/এডিট করা হলে এখানে তাৎক্ষণিক স্বয়ংক্রিয় বিজ্ঞপ্তি তৈরি হয়
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left 5 Cols: Tracked Medicines Watchlist */}
            <div className="lg:col-span-5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700">
                  ট্র্যাককৃত ওষুধের তালিকা ({priceWatches.length}টি)
                </h3>
                <span className="text-xs text-slate-500">
                  নিচের সারণি থেকে বেল আইকনে ক্লিক করে ট্র্যাক করুন
                </span>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md max-h-[210px] overflow-y-auto">
                {priceWatches.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    কোনো ওষুধ ট্র্যাক করা হয়নি। ওষুধের তালিকার পাশে &ldquo;ট্র্যাক&rdquo; বাটনে ক্লিক করুন।
                  </div>
                ) : (
                  priceWatches.map((w) => {
                    const liveMed = catalog.find(
                      (m) =>
                        m.id === w.medicineId ||
                        m.brandName.toLowerCase() === w.brandName.toLowerCase()
                    );
                    const currentPrice = liveMed ? liveMed.unitPrice : w.currentUnitPrice;
                    const diff = currentPrice - w.baselineUnitPrice;
                    return (
                      <div
                        key={w.id}
                        className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {w.brandName} {w.strength}
                          </div>
                          <div className="text-slate-500">
                            {w.genericName} · {w.companyName.replace(' Pharmaceuticals', '')}
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums shrink-0 flex items-center gap-3">
                          <div>
                            <div className="font-bold text-slate-900">
                              বর্তমান: ৳{currentPrice.toFixed(2)}
                            </div>
                            <div className="text-slate-500">
                              পূর্বের: ৳{w.baselineUnitPrice.toFixed(2)}{' '}
                              {diff !== 0 && (
                                <span
                                  className={
                                    diff > 0
                                      ? 'text-red-600 font-semibold'
                                      : 'text-emerald-700 font-semibold'
                                  }
                                >
                                  ({diff > 0 ? `+৳${diff.toFixed(2)}` : `৳${diff.toFixed(2)}`})
                                </span>
                              )}
                            </div>
                          </div>

                          {liveMed && (
                            <button
                              type="button"
                              onClick={() => openEditMedicineModal(liveMed)}
                              className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                              title="মূল্য পরিবর্তন করে অ্যালার্ট পরীক্ষা করুন"
                            >
                              মূল্য এডিট
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 7 Cols: Automatic Price Change Notifications Log */}
            <div className="lg:col-span-7 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700">
                  স্বয়ংক্রিয় মূল্য পরিবর্তন বিজ্ঞপ্তি ও হিস্ট্রি ({priceAlerts.length}টি অ্যালার্ট)
                </h3>
                <span className="text-xs text-teal-700 font-medium">
                  সকল ব্যবহারকারী দেখতে ও ডিলিট করতে পারবেন
                </span>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md max-h-[210px] overflow-y-auto">
                {priceAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    এখনো কোনো ওষুধের মূল্য পরিবর্তনের বিজ্ঞপ্তি নেই। যেকোনো ওষুধের &ldquo;এডিট&rdquo; বাটনে ক্লিক করে নতুন মূল্য সংরক্ষণ করলে স্বয়ংক্রিয় বিজ্ঞপ্তি তৈরি হবে।
                  </div>
                ) : (
                  priceAlerts.map((alert) => {
                    const isIncrease = alert.newUnitPrice >= alert.oldUnitPrice;
                    const diff = Math.abs(alert.newUnitPrice - alert.oldUnitPrice);
                    return (
                      <div
                        key={alert.id}
                        className={`p-3 flex items-center justify-between gap-3 text-xs ${
                          !alert.isRead ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-1.5 rounded mt-0.5 ${
                              isIncrease
                                ? 'bg-red-50 text-red-600'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isIncrease ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {alert.brandName} {alert.strength}{' '}
                              <span className="font-normal text-slate-500">
                                ({alert.genericName} · {alert.companyName})
                              </span>
                            </div>
                            <div className="font-mono tabular-nums text-slate-700 mt-0.5">
                              পূর্বের মূল্য: <strong>৳{alert.oldUnitPrice.toFixed(2)}</strong> → নতুন মূল্য:{' '}
                              <strong
                                className={isIncrease ? 'text-red-600' : 'text-emerald-700'}
                              >
                                ৳{alert.newUnitPrice.toFixed(2)}
                              </strong>{' '}
                              ({isIncrease ? `বৃদ্ধি +৳${diff.toFixed(2)}` : `হ্রাস -৳${diff.toFixed(2)}`} / পিস · পাতা: ৳{alert.newStripPrice.toFixed(2)})
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              পরিবর্তনকারী: <strong className="text-slate-700">{alert.changedBy}</strong> · তারিখ: {alert.dateStr}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!alert.isRead && (
                            <button
                              type="button"
                              onClick={() => onMarkAlertRead(alert.id)}
                              className="px-2 py-1 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded cursor-pointer"
                            >
                              পঠিত ✓
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeletePriceAlert(alert.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            title="বিজ্ঞপ্তি মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECTORY TAB 2: 250+ PHARMACEUTICAL COMPANIES DIRECTORY */}
      {directoryTab === 'companies' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                বাংলাদেশের সকল ফার্মাসিউটিক্যাল কোম্পানির ডিরেক্টরি ({filteredCompanies.length}টি কোম্পানি)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                যেকোনো কোম্পানির নামের ওপর ক্লিক করলে উক্ত কোম্পানির সকল ব্র্যান্ড ঔষধ ও মূল্য তালিকা দেখতে পাবেন
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDirectoryTab('medicines')}
              className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md cursor-pointer self-start sm:self-auto"
            >
              ← সকল ঔষধের তালিকায় ফিরে যান
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 gap-px bg-slate-200">
            {filteredCompanies.map((comp, idx) => (
              <div
                key={comp.id}
                onClick={() => selectCompanyFromDirectory(comp.companyName)}
                className="bg-white p-4 hover:bg-teal-50/40 transition-colors cursor-pointer flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      #{idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-teal-700">
                      {comp.companyName}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    প্রধান জেনেরিক:{' '}
                    <span className="text-slate-700">
                      {comp.topGenerics.slice(0, 3).join(', ') || 'Allopathic Formulations'}
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-xs font-bold text-teal-700">
                    {comp.brandCount}টি ব্র্যান্ড
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {comp.genericCount}টি জেনেরিক
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIRECTORY TAB 3: 1,800+ GENERICS DIRECTORY */}
      {directoryTab === 'generics' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                বাংলাদেশের সকল জেনেরিক নাম ও থেরাপিউটিক ইনডেক্স ({filteredGenerics.length.toLocaleString()}টি জেনেরিক)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                যেকোনো জেনেরিক নামের ওপর ক্লিক করলে সেই গ্রুপের সকল কোম্পানির ঔষধের নামের তালিকা ও মূল্যের তুলনা দেখতে পাবেন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-600">
                পৃষ্ঠা {safeGenPage} / {totalGenericPages}
              </span>
              <button
                type="button"
                disabled={safeGenPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safeGenPage >= totalGenericPages}
                onClick={() => setCurrentPage((p) => Math.min(totalGenericPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">জেনেরিক নাম (Generic Name)</th>
                  <th className="py-2.5 px-3">থেরাপিউটিক ক্লাস</th>
                  <th className="py-2.5 px-3">ব্যবহার ও নির্দেশনা (Indication)</th>
                  <th className="py-2.5 px-3 text-right">মোট ব্র্যান্ড ঔষধ</th>
                  <th className="py-2.5 px-4 text-right">তুলনা দেখুন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {paginatedGenerics.map((gen) => (
                  <tr
                    key={gen.id}
                    onClick={() => selectGenericFromDirectory(gen.genericName)}
                    className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {gen.genericName}
                      <div className="text-xs font-normal text-slate-500">
                        সাধারণ ডোজ: {gen.sampleStrength} ({gen.sampleForm})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700">
                      {gen.therapeuticClass}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      {gen.indication}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-teal-700">
                      {gen.brandCount}টি ব্র্যান্ড
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectGenericFromDirectory(gen.genericName);
                        }}
                        className="px-3 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded cursor-pointer"
                      >
                        সকল ব্র্যান্ড ও দাম দেখুন →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIRECTORY TAB 1: 21,000+ MEDICINES DIRECTORY & SAME-GENERIC PRICE COMPARISON */}
      {directoryTab === 'medicines' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Searchable & Paginated 21,000+ Medicine Directory */}
          <div className="xl:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  ঔষধের বিস্তারিত তালিকা (ব্র্যান্ড, জেনেরিক, প্রস্তুতকারক, ডোজ ও খুচরা মূল্য)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  মোট <strong className="text-slate-800 font-mono">{filteredMedicines.length.toLocaleString()}</strong>টি ঔষধ পাওয়া গেছে (পৃষ্ঠা {safeMedPage} / {totalMedicinePages}) · তুলনা করতে যেকোনো ঔষধে ক্লিক করুন
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md">
                {[
                  { value: 'ALL', label: 'সকল ফর্ম' },
                  { value: 'Tablet', label: 'Tab (ট্যাবলেট)' },
                  { value: 'Capsule', label: 'Cap (ক্যাপসুল)' },
                  { value: 'Syrup', label: 'Syp (সিরাপ)' },
                  { value: 'Suspension', label: 'Susp (সাসপেনশন)' },
                  { value: 'Sachet', label: 'Sachet (স্যাচেট)' },
                  { value: 'Drops', label: 'Drops (ড্রপ)' },
                  { value: 'Eye Drop', label: 'Eye Drop (আই ড্রপ)' },
                  { value: 'Ear Drop', label: 'Ear Drop (ইয়ার ড্রপ)' },
                  { value: 'Nasal Drop', label: 'Nasal Drop' },
                  { value: 'Suppository', label: 'Supp (সাপোজিটর)' },
                  { value: 'Inhaler', label: 'Inhaler (ইনহেলার)' },
                  { value: 'Injection', label: 'Inj (ইনজেকশন)' },
                  { value: 'Gel', label: 'Gel/Cream' },
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setSelectedDosageForm(f.value);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedDosageForm === f.value
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filter Banner if filtered by Company or Generic */}
            {(selectedCompany !== 'ALL' || selectedGeneric !== 'ALL' || selectedLetter !== 'ALL') && (
              <div className="px-5 py-2 bg-teal-50/70 border-b border-teal-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-teal-900">
                  সক্রিয় ফিল্টার:{' '}
                  {selectedCompany !== 'ALL' && (
                    <strong className="mr-2">কোম্পানি: {selectedCompany}</strong>
                  )}
                  {selectedGeneric !== 'ALL' && (
                    <strong className="mr-2">জেনেরিক: {selectedGeneric}</strong>
                  )}
                  {selectedLetter !== 'ALL' && (
                    <strong className="mr-2">অক্ষর: {selectedLetter}</strong>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('ALL');
                    setSelectedGeneric('ALL');
                    setSelectedLetter('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-teal-800 font-semibold hover:underline cursor-pointer"
                >
                  ফিল্টার মুছে সব ২১,০০০+ ঔষধ দেখুন ✕
                </button>
              </div>
            )}

            <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-4">ব্র্যান্ড ও উপলব্ধ ডোজ</th>
                    <th className="py-2.5 px-3">জেনেরিক নাম</th>
                    <th className="py-2.5 px-3">প্রস্তুতকারক কোম্পানি</th>
                    <th className="py-2.5 px-3 text-right">ক্রয় মূল্য (৳)</th>
                    <th className="py-2.5 px-3 text-right">বিক্রয় মূল্য (৳)</th>
                    <th className="py-2.5 px-3 text-right">দোকানে স্টক</th>
                    <th className="py-2.5 px-4 text-right">মূল্য পরিবর্তন / মেমো</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {paginatedMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center text-slate-500">
                        আপনার অনুসন্ধানের সাথে মিলে এমন কোনো ঔষধ পাওয়া যায়নি। অন্য নাম বা জেনেরিক দিয়ে চেষ্টা করুন।
                      </td>
                    </tr>
                  ) : (
                    paginatedMedicines.map((med) => {
                      const isSelected = activeMedicine?.id === med.id;
                      const stockQty =
                        stockByMedicine.get(med.id) ??
                        stockByMedicine.get(
                          `${med.brandName.trim().toLowerCase()}__${med.strength.trim().toLowerCase()}__${getShortDosageForm(med.dosageForm).toLowerCase()}`
                        ) ??
                        0;
                      const isWatched =
                        watchedIds.has(med.id) ||
                        watchedIds.has(med.brandName.toLowerCase());
                      const purchasePriceVal = getMedPurchasePrice(med);
                      const isCore = isCoreCatalogMed(med);
                      const genericDosages =
                        med.availableDosages ||
                        Array.from(
                          dosagesByGeneric.get(med.genericName.toLowerCase()) || [
                            `${med.strength} (${med.dosageForm})`,
                          ]
                        ).join(', ');

                      return (
                        <tr
                          key={med.id}
                          onClick={() => setActiveMedicineId(med.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-teal-50/70 font-medium'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">
                                {med.brandName}
                              </span>
                              {/* Cart Action Buttons right beside product name */}
                              <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddPos(med, med.unitsPerStrip || 10);
                                  }}
                                  title="বিক্রয় কার্ট / Sell Cart-এ যোগ করুন"
                                  className="px-2 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                                >
                                  <ShoppingCart className="w-3 h-3 text-emerald-700" />
                                  <span>বিক্রয়</span>
                                </button>
                                {onAddToPurchaseCart && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onAddToPurchaseCart(med, med.unitsPerStrip || 10);
                                      setAddedFeedbackId(med.id);
                                      setTimeout(() => setAddedFeedbackId(null), 1200);
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
                                {getShortDosageForm(med.dosageForm)} · {med.strength}
                              </span>
                              {med.hasPriceOverride && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded">
                                  মূল্য আপডেটকৃত
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {med.dosageForm} · {med.packSize}
                            </div>
                            <div className="text-xs text-teal-700 mt-0.5">
                              উপলব্ধ ডোজ: {genericDosages}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-700">
                            <div className="font-medium text-xs sm:text-sm">
                              {med.genericName}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[160px]">
                              {med.indication}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-xs text-slate-600">
                            {med.companyName}
                          </td>

                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                            <div className="font-semibold text-indigo-800">
                              ৳{purchasePriceVal.toFixed(2)}
                            </div>
                            <div className="text-[10px] font-normal text-slate-400">
                              প্রতি {getUnitLabelForForm(med.dosageForm)} ক্রয়
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                            <div className="text-teal-900 font-bold">
                              ৳{med.unitPrice.toFixed(2)}
                            </div>
                            <div className="text-[10px] font-normal text-slate-500">
                              পাতা: ৳{med.stripPrice.toFixed(2)}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                            {stockQty > 0 ? (
                              <div>
                                <div className="text-emerald-700 font-semibold">
                                  {stockQty} {getUnitLabelForForm(med.dosageForm)}
                                </div>
                                <div className="text-[11px] font-bold text-teal-800">
                                  বিক্রয়: ৳{(stockQty * med.unitPrice).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">স্টকে নেই</span>
                            )}
                          </td>

                          <td
                            className="py-3 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onTogglePriceWatch(med)}
                                title={
                                  isWatched
                                    ? 'মূল্য নিরীক্ষণ চালু আছে (বাতিল করতে ক্লিক করুন)'
                                    : 'এই ঔষধের দাম ট্র্যাক করুন'
                                }
                                className={`p-1.5 rounded transition-colors cursor-pointer ${
                                  isWatched
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {isWatched ? (
                                  <BellRing className="w-3.5 h-3.5" />
                                ) : (
                                  <Bell className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditMedicineModal(med)}
                                title="ক্রয় মূল্য ও বিক্রয় মূল্য পরিবর্তন করুন"
                                className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>মূল্য পরিবর্তন</span>
                              </button>

                              {!isCore && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCustomMedicine(med.id)}
                                  title="কাস্টম ওষুধ মুছে ফেলুন"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleAddPos(med, med.unitsPerStrip || 10)}
                                title="বিক্রয় কার্ট (POS)-এ যোগ করুন"
                                className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <ShoppingCart className="w-3 h-3 text-emerald-700" />
                                <span>{addedFeedbackId === med.id ? 'যুক্ত ✓' : '+বিক্রয়'}</span>
                              </button>

                              {onAddToPurchaseCart && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onAddToPurchaseCart(med, med.unitsPerStrip || 10);
                                    setAddedFeedbackId(med.id);
                                    setTimeout(() => setAddedFeedbackId(null), 1200);
                                  }}
                                  title="ক্রয় কার্ট (Purchase)-এ যোগ করুন"
                                  className="px-2 py-1 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Package className="w-3 h-3 text-indigo-700" />
                                  <span>+ক্রয়</span>
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

            {/* Pagination Footer for 21,000+ Medicines */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600 font-mono">
                দেখানো হচ্ছে: {filteredMedicines.length === 0 ? 0 : (safeMedPage - 1) * PAGE_SIZE + 1}–
                {Math.min(safeMedPage * PAGE_SIZE, filteredMedicines.length)} (মোট{' '}
                {filteredMedicines.length.toLocaleString()}টি ঔষধ)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeMedPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  প্রথম
                </button>
                <button
                  type="button"
                  disabled={safeMedPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> পূর্ববর্তী
                </button>
                <span className="px-2.5 py-1 font-mono font-semibold text-slate-800">
                  পৃষ্ঠা {safeMedPage} / {totalMedicinePages}
                </span>
                <button
                  type="button"
                  disabled={safeMedPage >= totalMedicinePages}
                  onClick={() => setCurrentPage((p) => Math.min(totalMedicinePages, p + 1))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  পরবর্তী <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Selected Medicine Details & Same Generic Group Price Comparison */}
          <div className="xl:col-span-5 space-y-5">
            {activeMedicine ? (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {/* Active Medicine Header Card */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-teal-700">
                        নির্বাচিত ঔষধের বিস্তারিত তথ্য ও ক্রয়-বিক্রয় মূল্যের তুলনা
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {activeMedicine.brandName} ({activeMedicine.strength})
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        জেনেরিক: <strong className="text-slate-900">{activeMedicine.genericName}</strong> · প্রস্তুতকারক:{' '}
                        <strong className="text-slate-800">{activeMedicine.companyName}</strong>
                      </p>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0 bg-white border border-slate-200 rounded-md px-3 py-2">
                      <div className="text-xs text-indigo-800 font-semibold">
                        ক্রয় মূল্য: ৳{getMedPurchasePrice(activeMedicine).toFixed(2)}
                      </div>
                      <div className="text-base font-bold text-teal-900 mt-0.5">
                        বিক্রয় (MRP): ৳{activeMedicine.unitPrice.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        পাতা বিক্রয়: ৳{activeMedicine.stripPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <div>
                      <span className="font-semibold text-slate-700">উপলব্ধ ডোজ (Available Dosages):</span>{' '}
                      {activeMedicine.availableDosages ||
                        Array.from(
                          dosagesByGeneric.get(activeMedicine.genericName.toLowerCase()) || [
                            `${activeMedicine.strength} (${activeMedicine.dosageForm})`,
                          ]
                        ).join(', ')}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">প্যাক সাইজ ও রেজিস্ট্রেশন:</span>{' '}
                      {activeMedicine.packSize} · DAR No: {activeMedicine.darNo}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">কাজ ও নির্দেশনা:</span>{' '}
                      {activeMedicine.indication}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">থেরাপিউটিক ক্লাস:</span>{' '}
                      {activeMedicine.therapeuticClass}
                    </div>
                  </div>

                  {/* Quick Switcher for Specific Brand Family Variants (e.g., Napa Tab, Syrup, Drops, Extend, Extra, Napadol, Supp) */}
                  {activeBrandFormStrengthVariants.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="text-[11px] font-bold text-teal-900">
                          {activeMedicine.brandName}-এর উপলব্ধ সকল প্রকারভেদ ও মাত্রা ({activeBrandFormStrengthVariants.length}টি ধরন):
                        </div>
                        <span className="text-[10px] text-teal-700 font-medium">
                          যে প্রকারটি স্টকে বা মেমোতে নিবেন ক্লিক করুন
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeBrandFormStrengthVariants.map((v) => {
                          const isCurr = v.id === activeMedicine.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setActiveMedicineId(v.id)}
                              className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurr
                                  ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-teal-600 hover:bg-teal-50/40'
                              }`}
                            >
                              <span>{formatBrandVariantLabel(v, activeMedicine.brandName)}</span>
                              <span
                                className={`font-mono font-bold ${
                                  isCurr ? 'text-teal-100' : 'text-teal-700'
                                }`}
                              >
                                — ক্রয় ৳{getMedPurchasePrice(v).toFixed(2)} | বিক্রয় ৳{v.unitPrice.toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action buttons on selected medicine */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => openEditMedicineModal(activeMedicine)}
                      className="px-3 py-1.5 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      ক্রয় ও বিক্রয় মূল্য পরিবর্তন করুন
                    </button>

                    <button
                      type="button"
                      onClick={() => onTogglePriceWatch(activeMedicine)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer ${
                        watchedIds.has(activeMedicine.id) ||
                        watchedIds.has(activeMedicine.brandName.toLowerCase())
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      {watchedIds.has(activeMedicine.id) ||
                      watchedIds.has(activeMedicine.brandName.toLowerCase())
                        ? 'মূল্য ট্র্যাকিং সক্রিয় আছে'
                        : 'মূল্য ট্র্যাক করুন'}
                    </button>

                    {isCoreCatalogMed(activeMedicine) ? (
                      <span className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                        মূল ডাটাবেস প্রোডাক্ট (ডিলিট করা যাবে না)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomMedicine(activeMedicine.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        কাস্টম প্রোডাক্ট মুছুন
                      </button>
                    )}
                  </div>

                  {/* Price Spread Summary inside this Generic Group */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200">
                    <div>
                      <div className="text-xs text-slate-500">একই গ্রুপের বিকল্প</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                        {genericSubstitutes.length}টি ব্র্যান্ড
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">সর্বনিম্ন দর (পিস)</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                        ৳{lowestPriceInGroup.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">সর্বোচ্চ দর (পিস)</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                        ৳{highestPriceInGroup.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Table of All Brands in Same Generic + Strength */}
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-teal-700" />
                    <h3 className="text-xs font-semibold text-slate-900">
                      একই জেনেরিক গ্রুপের ({activeMedicine.genericName} {activeMedicine.strength}) অন্য কোম্পানির ঔষধের দাম যাচাই ও তুলনা
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 max-h-[440px] overflow-y-auto">
                  {genericSubstitutes.map((sub, idx) => {
                    const isCurrent = sub.id === activeMedicine.id;
                    const isCheapest =
                      sub.unitPrice === lowestPriceInGroup &&
                      lowestPriceInGroup < highestPriceInGroup;
                    const priceDiffFromHighest = highestPriceInGroup - sub.unitPrice;
                    const savingsPct =
                      highestPriceInGroup > 0
                        ? Math.round((priceDiffFromHighest / highestPriceInGroup) * 100)
                        : 0;
                    const stockQty =
                      stockByMedicine.get(sub.id) ??
                      stockByMedicine.get(
                        `${sub.brandName.trim().toLowerCase()}__${sub.strength.trim().toLowerCase()}__${getShortDosageForm(sub.dosageForm).toLowerCase()}`
                      ) ??
                      0;
                    const subPurchasePrice = getMedPurchasePrice(sub);

                    return (
                      <div
                        key={sub.id}
                        className={`p-4 transition-colors ${
                          isCurrent ? 'bg-teal-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono tabular-nums text-slate-400">
                                {String(idx + 1).padStart(2, '0')}.
                              </span>
                              <span className="font-semibold text-slate-900 text-sm">
                                {sub.brandName}
                              </span>
                              <span className="text-xs text-slate-500">
                                {sub.strength} · {sub.dosageForm}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5 pl-6">
                              {sub.companyName}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 pl-6 flex flex-wrap items-center gap-2">
                              <span>
                                দোকানে স্টক:{' '}
                                <strong
                                  className={
                                    stockQty > 0
                                      ? 'text-emerald-700 font-mono tabular-nums'
                                      : 'text-slate-400'
                                  }
                                >
                                  {stockQty > 0
                                    ? `${stockQty} ${getUnitLabelForForm(sub.dosageForm)} (৳${(
                                        stockQty * sub.unitPrice
                                      ).toLocaleString('en-BD', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })})`
                                    : 'নেই'}
                                </strong>
                              </span>
                              <span>·</span>
                              {isCheapest ? (
                                <span className="text-emerald-700 font-semibold">
                                  সবচেয়ে সাশ্রয়ী বিকল্প ({savingsPct}% কম দাম)
                                </span>
                              ) : savingsPct > 0 ? (
                                <span className="text-teal-700">
                                  সর্বোচ্চ দর থেকে {savingsPct}% সাশ্রয়ী
                                </span>
                              ) : (
                                <span>স্ট্যান্ডার্ড এমআরপি রেট</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono tabular-nums text-xs font-semibold text-indigo-800">
                              ক্রয়: ৳{subPurchasePrice.toFixed(2)} / পিস
                            </div>
                            <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                              বিক্রয়: ৳{sub.unitPrice.toFixed(2)} / পিস
                            </div>
                            <div className="font-mono tabular-nums text-xs text-slate-500">
                              পাতা ({sub.unitsPerStrip}টি): ৳{sub.stripPrice.toFixed(2)}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-2">
                              <button
                                type="button"
                                onClick={() => openEditMedicineModal(sub)}
                                className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                                title="ক্রয় মূল্য ও বিক্রয় মূল্য পরিবর্তন করুন"
                              >
                                মূল্য পরিবর্তন
                              </button>
                              <button
                                type="button"
                                onClick={() => onQuickAddInventory(sub)}
                                className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                                title="ইনভেন্টরি স্টকে যুক্ত করুন"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                স্টকে যোগ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddPos(sub, 10)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {addedFeedbackId === sub.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> যুক্ত
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-3.5 h-3.5" /> ১ পাতা বিক্রি
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {otherStrengthBrands.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      একই জেনেরিকের অন্যান্য উপলব্ধ ডোজ (Available Dosages):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {otherStrengthBrands.map((ob) => (
                        <button
                          key={ob.id}
                          type="button"
                          onClick={() => setActiveMedicineId(ob.id)}
                          className="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:border-teal-600 rounded text-slate-700 font-medium transition-colors cursor-pointer"
                        >
                          {ob.brandName} {ob.strength} — ৳{ob.unitPrice.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal to Add or Edit Medicine & Change Purchase/Selling Price */}
      {showMedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingMed
                  ? `${editingMed.brandName} (${editingMed.strength})-এর ক্রয় মূল্য ও বিক্রয় মূল্য পরিবর্তন করুন`
                  : 'নতুন ওষুধ ও ক্রয়-বিক্রয় মূল্য তালিকা যুক্ত করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowMedModal(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            {editingMed && (
              <div className="mt-3 p-2.5 bg-teal-50 border border-teal-200 rounded text-xs text-teal-950 space-y-1">
                <div>
                  <strong>মূল ডাটাবেস প্রোডাক্ট সুরক্ষা:</strong> ডাটাবেসে থাকা মূল প্রোডাক্ট ডিলিট করা যাবে না, তবে এর <strong>ক্রয় মূল্য (Purchase Price)</strong> এবং <strong>বিক্রয় মূল্য (Selling Price / MRP)</strong> যেকোনো সময় পরিবর্তন করে সংরক্ষণ করা যাবে।
                </div>
                <div className="font-mono text-[11px] text-teal-800">
                  বর্তমান ক্রয় মূল্য: <strong>৳{getMedPurchasePrice(editingMed).toFixed(2)}</strong> · বর্তমান বিক্রয় মূল্য: <strong>৳{editingMed.unitPrice.toFixed(2)}</strong>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveMedSubmit} className="space-y-3.5 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Brand Name Searchable & Selectable */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      ব্র্যান্ডের নাম (Medicine Name) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModalBrandList((v) => !v);
                        setShowModalGenericList(false);
                        setShowModalCompanyList(false);
                      }}
                      className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      লিস্ট দেখুন <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={medBrand}
                      onFocus={() => {
                        setShowModalBrandList(true);
                        setShowModalGenericList(false);
                        setShowModalCompanyList(false);
                      }}
                      onChange={(e) => {
                        setMedBrand(e.target.value);
                        setShowModalBrandList(true);
                      }}
                      placeholder="ঔষধের নাম সার্চ বা সিলেক্ট করুন..."
                      className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalBrandList((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showModalBrandList && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {modalBrandMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setEditingMed(m);
                            setMedBrand(m.brandName);
                            setMedGeneric(m.genericName);
                            setMedCompany(m.companyName);
                            setMedStrength(m.strength);
                            setMedForm(m.dosageForm);
                            setMedPackSize(m.packSize);
                            setMedPurchasePrice(getMedPurchasePrice(m).toFixed(2));
                            setMedUnitPrice(m.unitPrice.toFixed(2));
                            setMedStripPrice(m.stripPrice.toFixed(2));
                            setMedClass(m.therapeuticClass);
                            setMedIndication(m.indication);
                            setShowModalBrandList(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-teal-50 flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {m.brandName} <span className="font-normal text-slate-500">{m.strength}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">{m.genericName} · {m.companyName}</div>
                          </div>
                          <span className="font-mono text-teal-700 font-semibold">
                            ক্রয় ৳{getMedPurchasePrice(m).toFixed(2)} | বিক্রয় ৳{m.unitPrice.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generic Name Searchable & Selectable */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      জেনেরিক নাম (Generic Name) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModalGenericList((v) => !v);
                        setShowModalBrandList(false);
                        setShowModalCompanyList(false);
                      }}
                      className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      লিস্ট দেখুন <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={medGeneric}
                      onFocus={() => {
                        setShowModalGenericList(true);
                        setShowModalBrandList(false);
                        setShowModalCompanyList(false);
                      }}
                      onChange={(e) => {
                        setMedGeneric(e.target.value);
                        setShowModalGenericList(true);
                      }}
                      placeholder="জেনেরিক নাম সার্চ বা সিলেক্ট করুন..."
                      className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalGenericList((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showModalGenericList && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {modalGenericMatches.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setMedGeneric(g.genericName);
                            setMedClass(g.therapeuticClass);
                            setMedIndication(g.indication);
                            setShowModalGenericList(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-teal-50 cursor-pointer"
                        >
                          <div className="font-semibold text-slate-900">{g.genericName}</div>
                          <div className="text-[11px] text-slate-500">{g.therapeuticClass}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Company Name Searchable & Selectable */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      প্রস্তুতকারক কোম্পানি (Company Name) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModalCompanyList((v) => !v);
                        setShowModalBrandList(false);
                        setShowModalGenericList(false);
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
                      value={medCompany}
                      onFocus={() => {
                        setShowModalCompanyList(true);
                        setShowModalBrandList(false);
                        setShowModalGenericList(false);
                      }}
                      onChange={(e) => {
                        setMedCompany(e.target.value);
                        setShowModalCompanyList(true);
                      }}
                      placeholder="কোম্পানির নাম সার্চ বা সিলেক্ট করুন..."
                      className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalCompanyList((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showModalCompanyList && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {modalCompanyMatches.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setMedCompany(c);
                            setShowModalCompanyList(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-teal-50 flex items-center justify-between cursor-pointer ${
                            medCompany === c ? 'bg-teal-50 font-bold text-teal-900' : 'text-slate-800'
                          }`}
                        >
                          <span>{c}</span>
                          {medCompany === c && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    উপলব্ধ ডোজ / মাত্রা (mg / ml) *
                  </label>
                  <input
                    type="text"
                    required
                    value={medStrength}
                    onChange={(e) => handleModalStrengthChange(e.target.value)}
                    placeholder="যেমন: 500 mg / 60 ml / 250 mg"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              {/* Medicine-Specific Variants or Fallback Strength Chips in Modal */}
              {modalBrandVariants.length > 0 ? (
                <div className="p-2.5 bg-teal-50/60 border border-teal-200 rounded-md space-y-1.5">
                  <div className="text-[11px] font-semibold text-teal-900">
                    {medBrand}-এর উপলব্ধ প্রকারভেদ ({modalBrandVariants.length}টি) — সিলেক্ট করলে সঠিক ফর্ম, মাত্রা ও ক্রয়-বিক্রয় দাম বসে যাবে:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {modalBrandVariants.map((v) => {
                      const active =
                        medBrand.trim().toLowerCase() === v.brandName.toLowerCase() &&
                        medForm === v.dosageForm &&
                        medStrength.trim().toLowerCase() === v.strength.toLowerCase();
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setEditingMed(v);
                            setMedBrand(v.brandName);
                            setMedGeneric(v.genericName);
                            setMedCompany(v.companyName);
                            setMedForm(v.dosageForm);
                            setMedStrength(v.strength);
                            setMedPackSize(v.packSize);
                            setMedPurchasePrice(getMedPurchasePrice(v).toFixed(2));
                            setMedUnitPrice(v.unitPrice.toFixed(2));
                            setMedStripPrice(v.stripPrice.toFixed(2));
                            setMedClass(v.therapeuticClass);
                            setMedIndication(v.indication);
                          }}
                          className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                            active
                              ? 'bg-teal-700 text-white border-teal-700 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500'
                          }`}
                        >
                          {formatBrandVariantLabel(v, medBrand)} (ক্রয় ৳{getMedPurchasePrice(v).toFixed(2)} | বিক্রয় ৳{v.unitPrice.toFixed(2)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-teal-50/60 border border-teal-200 rounded-md space-y-1.5">
                  <div className="text-[11px] font-semibold text-teal-900">
                    {modalFormMeta.shortCode} এর মাত্রা (mg / ml) সিলেক্ট করলে সে অনুপাতে দাম অটো-সেট হবে:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {modalFormMeta.defaultStrengths.map((sOpt) => {
                      const active = medStrength.trim().toLowerCase() === sOpt.toLowerCase();
                      const pCalc = calculateProportionalMedicinePrice({
                        catalog,
                        brandName: medBrand,
                        genericName: medGeneric,
                        targetForm: medForm,
                        targetStrength: sOpt,
                        currentUnitPrice: parseFloat(medUnitPrice) || 6.0,
                      });
                      return (
                        <button
                          key={sOpt}
                          type="button"
                          onClick={() => handleModalStrengthChange(sOpt)}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                            active
                              ? 'bg-teal-700 text-white border-teal-700 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500'
                          }`}
                        >
                          {sOpt} (৳{pCalc.unitPrice.toFixed(2)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ওষুধের ধরন / ফর্ম *
                  </label>
                  <select
                    value={medForm}
                    onChange={(e) => {
                      const nextForm = e.target.value as MedicineCatalogItem['dosageForm'];
                      const matchedVar = modalBrandVariants.find((v) => v.dosageForm === nextForm);
                      if (matchedVar) {
                        setEditingMed(matchedVar);
                        setMedBrand(matchedVar.brandName);
                        setMedGeneric(matchedVar.genericName);
                        setMedCompany(matchedVar.companyName);
                        setMedForm(matchedVar.dosageForm);
                        setMedStrength(matchedVar.strength);
                        setMedPackSize(matchedVar.packSize);
                        setMedPurchasePrice(getMedPurchasePrice(matchedVar).toFixed(2));
                        setMedUnitPrice(matchedVar.unitPrice.toFixed(2));
                        setMedStripPrice(matchedVar.stripPrice.toFixed(2));
                      } else {
                        handleModalFormChange(nextForm);
                      }
                    }}
                    className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-md bg-white"
                  >
                    {modalBrandVariants.length > 0 ? (
                      <>
                        <optgroup label={`${medBrand}-এর উপলব্ধ ধরন`}>
                          {Array.from(new Set(modalBrandVariants.map((v) => v.dosageForm))).map(
                            (df) => (
                              <option key={df} value={df}>
                                {df} ({getShortDosageForm(df)})
                              </option>
                            )
                          )}
                        </optgroup>
                        <optgroup label="অন্যান্য কাস্টম ধরন">
                          {DOSAGE_FORM_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.labelBn}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    ) : (
                      DOSAGE_FORM_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.labelBn}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    প্যাক সাইজ (Pack Size)
                  </label>
                  <input
                    type="text"
                    value={medPackSize}
                    onChange={(e) => setMedPackSize(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              {/* Purchase Price & Selling Price Editing Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    প্রোডাক্টের ক্রয় মূল্য এবং বিক্রয় মূল্য (পরিবর্তনযোগ্য)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const sell = parseFloat(medUnitPrice) || 0;
                      if (sell > 0) {
                        setMedPurchasePrice((sell * 0.88).toFixed(2));
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
                      প্রতি {getUnitLabelForForm(medForm)} ক্রয় মূল্য (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={medPurchasePrice}
                      onChange={(e) => setMedPurchasePrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono font-bold text-indigo-900 bg-white border border-indigo-300 rounded-md focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-900 mb-1">
                      প্রতি {getUnitLabelForForm(medForm)} বিক্রয় মূল্য (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      value={medUnitPrice}
                      onChange={(e) => {
                        setMedUnitPrice(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!Number.isNaN(val)) {
                          setMedStripPrice((val * modalFormMeta.defaultUnitsPerStrip).toFixed(2));
                        }
                      }}
                      className="w-full px-3 py-2 text-sm font-mono font-bold text-teal-900 bg-white border border-teal-300 rounded-md focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      প্রতি {modalFormMeta.packLabelBn} বিক্রয় মূল্য (৳) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={medStripPrice}
                      onChange={(e) => setMedStripPrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-1 text-slate-700">
                  <span>
                    ক্রয় মূল্য: <strong className="text-indigo-800">৳{(parseFloat(medPurchasePrice) || 0).toFixed(2)}</strong>
                  </span>
                  <span>
                    বিক্রয় মূল্য: <strong className="text-teal-800">৳{(parseFloat(medUnitPrice) || 0).toFixed(2)}</strong>
                  </span>
                  <span>
                    প্রতি এককে লাভ:{' '}
                    <strong className="text-emerald-700">
                      ৳{Math.max(0, (parseFloat(medUnitPrice) || 0) - (parseFloat(medPurchasePrice) || 0)).toFixed(2)}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ব্যবহার ও নির্দেশনা (Indication)
                </label>
                <input
                  type="text"
                  value={medIndication}
                  onChange={(e) => setMedIndication(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingMed}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {submittingMed ? 'সংরক্ষণ হচ্ছে...' : 'ক্রয় ও বিক্রয় মূল্য সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
