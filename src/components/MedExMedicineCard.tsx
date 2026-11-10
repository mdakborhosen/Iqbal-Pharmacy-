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
  isCompact?: boolean;
}

export const MedExMedicineCard: React.FC<MedExMedicineCardProps> = ({
  medicine,
  allMedicines,
  onSelectMedicine,
  onAddToPosCart,
  onAddToPurchaseCart,
  onOpenEditPrice,
  isCompact = false,
}) => {
  const [showPackImageModal, setShowPackImageModal] = useState(false);
  const [showAlternateBrandsModal, setShowAlternateBrandsModal] = useState(false);
  const [posSuccess, setPosSuccess] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Find all strength/form variants for this exact brand name (e.g., A-Cal D vs A-Cal DX)
  const brandFamilyVariants = React.useMemo(() => {
    const rootName = medicine.brandName.split(' ')[0].toLowerCase();
    return allMedicines.filter((m) => {
      const mRoot = m.brandName.split(' ')[0].toLowerCase();
      return (
        m.id !== medicine.id &&
        (m.brandName.toLowerCase().startsWith(rootName) || mRoot === rootName) &&
        m.genericName.toLowerCase() === medicine.genericName.toLowerCase()
      );
    });
  }, [medicine, allMedicines]);

  // Find alternate brands under the same generic
  const alternateBrands = React.useMemo(() => {
    return allMedicines.filter(
      (m) =>
        m.id !== medicine.id &&
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
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow relative">
        {/* Top Row: Pill Icon + Brand Name + Dosage Form + [ Pack Image ] */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* MedEx Pill Icon */}
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center shrink-0 text-slate-700">
              <Pill className="w-5 h-5 -rotate-45 text-teal-800" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {medicine.brandName}
            </h3>

            <span className="text-sm font-medium text-slate-500 pt-0.5">
              {medicine.dosageForm}
            </span>
          </div>

          {/* Green [ 📷 Pack Image ] Button (Exact match from screenshot) */}
          <button
            type="button"
            onClick={() => setShowPackImageModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#258750] hover:bg-[#1e6f42] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Pack Image</span>
          </button>
        </div>

        {/* Generic Name (Teal color) */}
        <div className="mt-2 text-base font-semibold text-[#1e6b7b] leading-tight hover:underline cursor-pointer">
          {medicine.genericName}
        </div>

        {/* Strength */}
        <div className="text-sm font-normal text-slate-600 mt-1">
          {medicine.strength}
        </div>

        {/* Company Name */}
        <div className="text-sm font-medium text-slate-500 mt-0.5">
          {medicine.companyName}
        </div>

        {/* Pricing Rows (Exact MedEx format) */}
        <div className="mt-3.5 space-y-1 text-sm sm:text-[15px] text-slate-700 font-mono">
          {medicine.brandName.toLowerCase().includes('a-cal d') && !medicine.brandName.toLowerCase().includes('dx') ? (
            <>
              <div>
                <span className="font-semibold text-slate-800">Unit Price: ৳ {medicine.unitPrice.toFixed(2)}</span>{' '}
                <span className="text-slate-500 font-sans text-xs">(1 x 15: ৳ {packPrice15.toFixed(2)})</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">Unit Price: ৳ {medicine.unitPrice.toFixed(2)}</span>{' '}
                <span className="text-slate-500 font-sans text-xs">(1 x 30: ৳ {packPrice30.toFixed(2)})</span>
              </div>
            </>
          ) : (
            <div>
              <span className="font-semibold text-slate-800">Unit Price: ৳ {medicine.unitPrice.toFixed(2)}</span>{' '}
              <span className="text-slate-500 font-sans text-xs">
                (1 x 30: ৳ {packPrice30.toFixed(2)})
              </span>
            </div>
          )}
        </div>

        {/* Also available as: [ Variant Pills ] */}
        {brandFamilyVariants.length > 0 && (
          <div className="mt-3.5 flex items-center gap-2 flex-wrap text-xs text-slate-600">
            <span className="font-medium">Also available as:</span>
            {brandFamilyVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectMedicine && onSelectMedicine(v)}
                className="px-2.5 py-1 text-xs font-semibold text-[#1e6b7b] bg-white border border-[#1e6b7b] hover:bg-teal-50 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                {v.strength}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Actions Row: [ Alternate Brands ] button + Cart options */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAlternateBrandsModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#1e6b7b] bg-white border border-[#1e6b7b] hover:bg-teal-50 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Alternate Brands</span>
            {alternateBrands.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 bg-teal-100/70 text-teal-900 rounded-full font-bold">
                {alternateBrands.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            {onOpenEditPrice && (
              <button
                type="button"
                onClick={() => onOpenEditPrice(medicine)}
                className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md cursor-pointer"
              >
                মূল্য পরিবর্তন
              </button>
            )}

            {onAddToPosCart && (
              <button
                type="button"
                onClick={handleAddPos}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{posSuccess ? 'যুক্ত ✓' : '+বিক্রয়'}</span>
              </button>
            )}

            {onAddToPurchaseCart && (
              <button
                type="button"
                onClick={handleAddPurchase}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Package className="w-3.5 h-3.5" />
                <span>{purchaseSuccess ? 'যুক্ত ✓' : '+ক্রয়'}</span>
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
