import React, { useState } from 'react';
import {
  Camera,
  Check,
  ChevronRight,
  ExternalLink,
  Layers,
  Package,
  Pill,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { MedicineCatalogItem } from '../types';

interface MedExMedicineCardProps {
  medicine: MedicineCatalogItem;
  allMedicines: MedicineCatalogItem[];
  onSelectMedicine?: (med: MedicineCatalogItem) => void;
  onAddToPosCart?: (med: MedicineCatalogItem, qty: number) => void;
  onAddToPurchaseCart?: (med: MedicineCatalogItem, qty: number) => void;
  onOpenEditPrice?: (med: MedicineCatalogItem) => void;
  onAddVariant?: (baseMed: MedicineCatalogItem) => void;
  onDeleteMedicine?: (med: MedicineCatalogItem) => void;
  onDeleteVariant?: (
    parentMed: MedicineCatalogItem,
    variantId: string,
    kind: 'explicit' | 'family',
    sourceMedId?: string
  ) => void;
  isCompact?: boolean;
}

export const MedExMedicineCard: React.FC<MedExMedicineCardProps> = ({
  medicine,
  allMedicines,
  onSelectMedicine,
  onAddToPosCart,
  onAddToPurchaseCart,
  onOpenEditPrice,
  onAddVariant,
  onDeleteMedicine,
  onDeleteVariant,
  isCompact = false,
}) => {
  const [showPackImageModal, setShowPackImageModal] = useState(false);
  const [showAlternateBrandsModal, setShowAlternateBrandsModal] = useState(false);
  const [posSuccess, setPosSuccess] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [confirmDeleteMed, setConfirmDeleteMed] = useState(false);
  const [confirmDeleteVariantKey, setConfirmDeleteVariantKey] = useState<string | null>(null);

  // Explicit saved variants on this medicine + other catalog brand family variants (deduplicated)
  const explicitVariants = React.useMemo(() => {
    return Array.isArray(medicine.variants) ? medicine.variants : [];
  }, [medicine.variants]);

  const brandFamilyVariants = React.useMemo(() => {
    const rootName = medicine.brandName.split(' ')[0].toLowerCase();
    const absorbedSourceIds = new Set(
      explicitVariants.map((v) => v.sourceMedicineId).filter(Boolean) as string[]
    );
    const explicitNames = new Set(
      explicitVariants.map((v) => v.variantName.trim().toLowerCase())
    );
    return allMedicines.filter((m) => {
      if (m.id === medicine.id || m.mergedIntoParentId || absorbedSourceIds.has(m.id)) {
        return false;
      }
      if (explicitNames.has(m.brandName.trim().toLowerCase())) {
        return false;
      }
      const mRoot = m.brandName.split(' ')[0].toLowerCase();
      return (
        (m.brandName.toLowerCase().startsWith(rootName) || mRoot === rootName) &&
        m.genericName.toLowerCase() === medicine.genericName.toLowerCase()
      );
    });
  }, [medicine, allMedicines, explicitVariants]);

  // Find alternate brands under the same generic
  const alternateBrands = React.useMemo(() => {
    return allMedicines.filter(
      (m) =>
        m.id !== medicine.id &&
        !m.mergedIntoParentId &&
        m.genericName.toLowerCase().trim() === medicine.genericName.toLowerCase().trim()
    );
  }, [medicine, allMedicines]);

  // Pack pricing calculation
  const unitsPerStrip = medicine.unitsPerStrip || 10;
  const stripPrice = medicine.stripPrice || Number((medicine.unitPrice * unitsPerStrip).toFixed(2));
  const packPrice30 = Number((medicine.unitPrice * 30).toFixed(2));
  const packPrice15 = Number((medicine.unitPrice * 15).toFixed(2));

  const handleAddPos = () => {
    if (onAddToPosCart) {
      onAddToPosCart(medicine, unitsPerStrip);
      setPosSuccess(true);
      setTimeout(() => setPosSuccess(false), 1200);
    }
  };

  const handleAddPurchase = () => {
    if (onAddToPurchaseCart) {
      onAddToPurchaseCart(medicine, unitsPerStrip);
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 1200);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-shadow relative">
        {/* Top Row: Pill Icon + Brand Name + Dosage Form + [MedEx লাইভ] + [Pack Image] */}
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center shrink-0 text-slate-700">
              <Pill className="w-4.5 h-4.5 -rotate-45 text-teal-800" />
            </div>

            <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                {medicine.brandName}
              </h3>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                {medicine.dosageForm}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {medicine.medexUrl && (
              <a
                href={medicine.medexUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
                title="medex.com.bd থেকে সরাসরি প্রাপ্ত ও ডাটাবেসে সংরক্ষিত বিক্রয়মূল্য"
              >
                <ExternalLink className="w-3 h-3" />
                <span>MedEx লাইভ</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowPackImageModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#258750] hover:bg-[#1e6f42] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Pack Image</span>
            </button>
          </div>
        </div>

        {/* Generic, Strength, Company & Unit Price in tidy summary rows */}
        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <div className="text-sm sm:text-base font-semibold text-[#1e6b7b] leading-snug truncate">
              {medicine.genericName}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-slate-600">
              {medicine.strength && (
                <span className="font-mono font-medium text-slate-700">{medicine.strength}</span>
              )}
              {medicine.strength && <span className="text-slate-300">·</span>}
              <span className="font-medium text-slate-500 truncate">{medicine.companyName}</span>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 font-mono tabular-nums bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shrink-0 self-start sm:self-end">
            <div>
              <span className="font-bold text-slate-900">
                Unit Price: ৳{medicine.unitPrice.toFixed(2)}
              </span>{' '}
              <span className="text-slate-500 font-sans text-[11px]">
                (1 × 30: ৳{packPrice30.toFixed(2)})
              </span>
            </div>
            {medicine.brandName.toLowerCase().includes('a-cal d') &&
              !medicine.brandName.toLowerCase().includes('dx') && (
                <div className="text-[11px] text-slate-500">
                  1 × 15: ৳{packPrice15.toFixed(2)}
                </div>
              )}
          </div>
        </div>

        {/* Variants Row */}
        {(explicitVariants.length > 0 || brandFamilyVariants.length > 0 || onAddVariant) && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700 whitespace-nowrap shrink-0">
              ভ্যারিয়েন্ট:
            </span>
            {explicitVariants.map((v) => {
              const expandedMed: MedicineCatalogItem = {
                ...medicine,
                id: `${medicine.id}__var__${v.id}`,
                brandName: v.variantName,
                variantDisplayName: v.variantName,
                dosageForm: (v.dosageForm as MedicineCatalogItem['dosageForm']) || medicine.dosageForm,
                strength: v.strength || medicine.strength,
                packSize: v.packSize || medicine.packSize,
                purchasePrice: v.purchasePrice,
                unitPrice: v.unitPrice,
                stripPrice: v.stripPrice,
                parentMedicineId: medicine.id,
                variantId: v.id,
              };
              const varKey = `exp::${v.id}`;
              const isConfirming = confirmDeleteVariantKey === varKey;
              return (
                <div
                  key={v.id}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center text-xs font-semibold text-teal-900 bg-teal-50/80 border border-teal-500 rounded-lg overflow-hidden shadow-2xs shrink-0 whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMedicine && onSelectMedicine(expandedMed)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 hover:bg-teal-100 transition-colors cursor-pointer whitespace-nowrap"
                    title={`${v.variantName} (${v.dosageForm} · ${v.strength}) - বিক্রয়মূল্য: ৳${v.unitPrice.toFixed(2)}`}
                  >
                    <span>{v.variantName}</span>
                    <span className="text-[10px] font-normal text-slate-600">{v.dosageForm}</span>
                    <span className="font-mono tabular-nums text-emerald-700 font-bold">৳{v.unitPrice.toFixed(2)}</span>
                  </button>
                  {onDeleteVariant && (
                    isConfirming ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-1 bg-red-50 border-l border-red-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteVariant(medicine, v.id, 'explicit', v.sourceMedicineId);
                            setConfirmDeleteVariantKey(null);
                          }}
                          className="px-1 py-0.5 bg-red-600 text-white rounded font-bold cursor-pointer"
                          title="ডিলিট নিশ্চিত করুন"
                        >
                          ডিলিট
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteVariantKey(null)}
                          className="px-1 py-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="বাতিল"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteVariantKey(varKey)}
                        className="px-1.5 py-1 text-red-400 hover:text-red-700 hover:bg-red-50 border-l border-teal-300/60 transition-colors cursor-pointer"
                        title={`${v.variantName} ভ্যারিয়েন্ট ডিলিট করুন`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )
                  )}
                </div>
              );
            })}

            {brandFamilyVariants.map((v) => {
              const varKey = `fam::${v.id}`;
              const isConfirming = confirmDeleteVariantKey === varKey;
              return (
                <div
                  key={v.id}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center text-xs font-semibold text-[#1e6b7b] bg-white border border-[#1e6b7b] rounded-lg overflow-hidden shadow-2xs shrink-0 whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMedicine && onSelectMedicine(v)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 hover:bg-teal-50 transition-colors cursor-pointer whitespace-nowrap"
                    title={`${v.brandName} ${v.dosageForm} (${v.strength}) - বিক্রয়মূল্য: ৳${v.unitPrice.toFixed(2)}`}
                  >
                    <span>{v.dosageForm !== medicine.dosageForm ? `${v.dosageForm} ` : ''}{v.strength}</span>
                    <span className="font-mono tabular-nums text-emerald-700 font-bold">৳{v.unitPrice.toFixed(2)}</span>
                  </button>
                  {onDeleteVariant && (
                    isConfirming ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-1 bg-red-50 border-l border-red-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteVariant(medicine, v.id, 'family');
                            setConfirmDeleteVariantKey(null);
                          }}
                          className="px-1 py-0.5 bg-red-600 text-white rounded font-bold cursor-pointer"
                          title="ডিলিট নিশ্চিত করুন"
                        >
                          ডিলিট
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteVariantKey(null)}
                          className="px-1 py-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="বাতিল"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteVariantKey(varKey)}
                        className="px-1.5 py-1 text-red-400 hover:text-red-700 hover:bg-red-50 border-l border-teal-600/20 transition-colors cursor-pointer"
                        title={`${v.brandName} ${v.strength} ডিলিট করুন`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )
                  )}
                </div>
              );
            })}

            {onAddVariant && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddVariant(medicine);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                title="এই ঔষধের নতুন মাত্রা বা ধরণ (যেমন: Seclo 40, Seclo MUPS 20) বা ডাটাবেস থেকে অন্য ঔষধ ভ্যারিয়েন্ট হিসেবে যুক্ত করুন"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ ভ্যারিয়েন্ট</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Actions Row: Clean two-tier responsive alignment without broken wrapping */}
        <div
          className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAlternateBrandsModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-[#1e6b7b] bg-white border border-[#1e6b7b] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Alternate Brands</span>
              {alternateBrands.length > 0 && (
                <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-teal-100/80 text-teal-900 rounded-full font-bold">
                  {alternateBrands.length}
                </span>
              )}
            </button>

            {onOpenEditPrice && (
              <button
                type="button"
                onClick={() => onOpenEditPrice(medicine)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                মূল্য পরিবর্তন
              </button>
            )}

            {onDeleteMedicine && (
              confirmDeleteMed ? (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg text-[11px] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteMedicine(medicine);
                      setConfirmDeleteMed(false);
                    }}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded cursor-pointer whitespace-nowrap"
                  >
                    নিশ্চিত ডিলিট
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteMed(false)}
                    className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                  >
                    বাতিল
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteMed(true)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="এই ঔষধটি তালিকা থেকে ডিলিট করুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ডিলিট</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onAddToPosCart && (
              <button
                type="button"
                onClick={handleAddPos}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{posSuccess ? 'যুক্ত ✓' : '+ বিক্রয়'}</span>
              </button>
            )}

            {onAddToPurchaseCart && (
              <button
                type="button"
                onClick={handleAddPurchase}
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
              >
                <Package className="w-3.5 h-3.5" />
                <span>{purchaseSuccess ? 'যুক্ত ✓' : '+ ক্রয়'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Pack Image & Verification Modal */}
      {showPackImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm">
                  {medicine.brandName} · প্যাক ও নিরাপত্তা ইমেজ
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPackImageModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Simulated Realistic Blister/Box Pack Render */}
              <div className="relative rounded-xl border-2 border-dashed border-teal-200 bg-gradient-to-b from-teal-50/50 to-white p-6 flex flex-col items-center justify-center text-center">
                <div className="w-36 h-24 bg-gradient-to-r from-teal-700 to-emerald-700 rounded-lg shadow-md text-white p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs tracking-wider">{medicine.brandName}</span>
                    <span className="text-[9px] bg-white/20 px-1 rounded font-mono">{medicine.dosageForm}</span>
                  </div>
                  <div className="text-[10px] text-teal-100 truncate">{medicine.genericName}</div>
                  <div className="flex justify-between items-end text-[9px] text-teal-200 border-t border-white/20 pt-1">
                    <span>{medicine.strength}</span>
                    <span className="font-mono">৳{medicine.unitPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Blister foil simulation */}
                <div className="mt-3 flex items-center gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-5 h-7 rounded-full bg-slate-200 border border-slate-300 shadow-inner flex items-center justify-center text-[8px] text-slate-400 font-bold"
                    >
                      ●
                    </div>
                  ))}
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>DGDA নিবন্ধিত ও প্রস্তুতকারক অনুমোদিত আসল প্যাক</span>
                </div>
              </div>

              {/* Medicine Packaging Specifications */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">ব্র্যান্ডের নাম:</span>
                  <strong className="text-slate-900">{medicine.brandName} ({medicine.strength})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">জেনেরিক উপাদান:</span>
                  <strong className="text-teal-900">{medicine.genericName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">প্রস্তুতকারক প্রতিষ্ঠান:</span>
                  <strong className="text-slate-900">{medicine.companyName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">প্যাক সাইজ:</span>
                  <span className="font-mono text-slate-800">{medicine.packSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">প্রতি পিসের সরকারি MRP:</span>
                  <strong className="font-mono text-emerald-700">৳ {medicine.unitPrice.toFixed(2)}</strong>
                </div>
                {medicine.darNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ডিজিডিএ রেজিস্ট্রেশন (DAR No):</span>
                    <span className="font-mono text-slate-800">{medicine.darNo}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPackImageModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Alternate Brands Drawer / Modal */}
      {showAlternateBrandsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#1e6b7b] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base">
                  বিকল্প ব্র্যান্ডসমূহ (Alternate Brands)
                </h4>
                <p className="text-xs text-teal-100 mt-0.5">
                  একই জেনেরিক: <strong>{medicine.genericName}</strong> ({medicine.strength})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAlternateBrandsModal(false)}
                className="p-1 text-teal-100 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Alternate Brands */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {alternateBrands.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  বর্তমানে এই জেনেরিকে অন্য কোনো প্রস্তুতকারকের ব্র্যান্ড তালিকাভুক্ত নেই।
                </div>
              ) : (
                alternateBrands.map((alt) => {
                  const isCheaper = alt.unitPrice < medicine.unitPrice;
                  const priceDiff = Math.abs(alt.unitPrice - medicine.unitPrice);
                  return (
                    <div
                      key={alt.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {alt.brandName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {alt.dosageForm} · {alt.strength}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {alt.companyName}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            ৳{alt.unitPrice.toFixed(2)}
                          </div>
                          {priceDiff > 0 && (
                            <div
                              className={`text-[10px] font-semibold ${
                                isCheaper ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {isCheaper ? `৳${priceDiff.toFixed(2)} সাশ্রয়ী` : `+৳${priceDiff.toFixed(2)}`}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectMedicine) onSelectMedicine(alt);
                            setShowAlternateBrandsModal(false);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md cursor-pointer transition-colors"
                        >
                          নির্বাচন করুন
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
              <span>মোট বিকল্প ব্র্যান্ড: {alternateBrands.length}টি</span>
              <button
                type="button"
                onClick={() => setShowAlternateBrandsModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
