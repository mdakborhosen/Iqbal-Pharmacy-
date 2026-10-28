import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Search,
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Clock,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  Download,
  Stethoscope,
  Activity,
  Layers,
  ChevronRight,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { Transaction } from '../types';
import { parseTransactionItemsDetailed, formatCleanMoney } from '../data/bdMedicines';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

interface InvoiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  transactions?: Transaction[];
}

export const InvoiceVerificationModal: React.FC<InvoiceVerificationModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  transactions = [],
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedInvoices, setMatchedInvoices] = useState<Transaction[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<Transaction | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync initial query if passed or changed
  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Generate QR for active invoice
  useEffect(() => {
    if (!activeInvoice) {
      setQrDataUrl('');
      return;
    }
    const invCode = encodeURIComponent(activeInvoice.invoiceNo || 'INV-01');
    const verifyUrl = `https://iqbal-pharmacy.pages.dev/?verify=${invCode}`;
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 100,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR error:', err));
  }, [activeInvoice]);

  // Load all available local transactions
  const localTransactions = useMemo(() => {
    const list: Transaction[] = [...transactions];
    try {
      const stored = localStorage.getItem('iqbal_pharmacy_transactions_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const map = new Map<string, Transaction>();
          for (const t of list) map.set(t.invoiceNo || t.id, t);
          for (const t of parsed) {
            const key = t.invoiceNo || t.id;
            if (key && !map.has(key)) {
              map.set(key, t);
            }
          }
          return Array.from(map.values());
        }
      }
    } catch {
      // ignore
    }
    return list;
  }, [transactions]);

  const performSearch = async (queryTerm: string) => {
    const q = queryTerm.trim();
    if (!q) {
      setSearchError('অনুগ্রহ করে ইনভয়েস নম্বর অথবা পেশেন্ট আইডি/মোবাইল নম্বর লিখুন');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setActiveInvoice(null);
    setMatchedInvoices([]);

    try {
      const cleanQ = q.toLowerCase();
      const digitsOnly = q.replace(/[^0-9]/g, '');

      // 1. Check local transactions first
      const localMatches = localTransactions.filter((tx) => {
        const invNo = (tx.invoiceNo || '').toLowerCase();
        const partyId = (tx.partyId || '').toLowerCase();
        const partyPhone = (tx.partyPhone || '').replace(/[^0-9]/g, '');
        const partyName = (tx.partyName || '').toLowerCase();

        if (invNo === cleanQ || invNo.includes(cleanQ)) return true;
        if (partyId && (partyId === cleanQ || partyId.includes(cleanQ))) return true;
        if (partyName && partyName.includes(cleanQ)) return true;
        if (digitsOnly.length >= 5 && partyPhone && partyPhone.includes(digitsOnly)) return true;
        return false;
      });

      let allFound: Transaction[] = [...localMatches];

      // 2. Query Firestore if online
      try {
        // Query by invoiceNo exact
        const invQ = query(collection(db, 'transactions'), where('invoiceNo', '==', q));
        const invSnap = await getDocs(invQ);
        invSnap.forEach((d) => {
          const item = { id: d.id, ...(d.data() as Omit<Transaction, 'id'>) };
          if (!allFound.some((x) => x.invoiceNo === item.invoiceNo)) {
            allFound.push(item);
          }
        });

        // Also query public_invoices if present
        try {
          const pubDoc = await getDoc(doc(db, 'public_invoices', q.replace(/\//g, '_')));
          if (pubDoc.exists()) {
            const item = { id: pubDoc.id, ...(pubDoc.data() as Omit<Transaction, 'id'>) };
            if (!allFound.some((x) => x.invoiceNo === item.invoiceNo)) {
              allFound.push(item);
            }
          }
        } catch {
          // ignore
        }

        // Query by partyId (patient ID)
        if (q.startsWith('PAT-') || q.startsWith('pat-') || q.length > 2) {
          const patQ = query(collection(db, 'transactions'), where('partyId', '==', q));
          const patSnap = await getDocs(patQ);
          patSnap.forEach((d) => {
            const item = { id: d.id, ...(d.data() as Omit<Transaction, 'id'>) };
            if (!allFound.some((x) => x.invoiceNo === item.invoiceNo)) {
              allFound.push(item);
            }
          });
        }
      } catch (firestoreErr) {
        console.warn('Firestore invoice search fallback:', firestoreErr);
      }

      // Sort results descending by latest date first (সর্বশেষ তারিখের ক্রম অনুসারে)
      allFound.sort((a, b) => {
        const dateA = a.dateStr || '';
        const dateB = b.dateStr || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
      });

      if (allFound.length === 0) {
        setSearchError(`"${q}" দিয়ে কোনো ইনভয়েস বা রোগীর রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে সঠিক কোড দিন।`);
      } else {
        setMatchedInvoices(allFound);
        // If an exact single invoice match, or only 1 invoice found, show it directly
        const exactInv = allFound.find(
          (t) => (t.invoiceNo || '').toLowerCase() === cleanQ
        );
        if (exactInv) {
          setActiveInvoice(exactInv);
        } else if (allFound.length === 1 && !q.toLowerCase().startsWith('pat-') && digitsOnly.length < 10) {
          setActiveInvoice(allFound[0]);
        }
      }
    } catch (err) {
      console.error('Invoice search error:', err);
      setSearchError('ইনভয়েস তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVerificationLink = (invNo: string) => {
    const url = `https://iqbal-pharmacy.pages.dev/?verify=${encodeURIComponent(invNo)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  // Determine patient summary if multiple invoices found for a patient
  const patientSummary = useMemo(() => {
    if (matchedInvoices.length === 0) return null;
    const first = matchedInvoices[0];
    const totalAmount = matchedInvoices.reduce((sum, t) => sum + (t.grandTotal || t.amount || 0), 0);
    const totalPaid = matchedInvoices.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
    const totalDue = matchedInvoices.reduce((sum, t) => sum + (t.dueAmount || 0), 0);
    return {
      name: first.partyName || 'সাধারণ ক্রেতা / রোগী',
      patientId: first.partyId || 'N/A',
      phone: first.partyPhone || 'N/A',
      totalInvoices: matchedInvoices.length,
      totalAmount,
      totalPaid,
      totalDue,
    };
  }, [matchedInvoices]);

  const parsedItems = activeInvoice ? parseTransactionItemsDetailed(activeInvoice.itemsSummary || '') : [];

  const getFacilityName = (seal?: string) => {
    if (seal === 'dental_1') return 'ইকবাল ডেন্টাল কেয়ার-১';
    if (seal === 'dental_2') return 'ইকবাল ডেন্টাল কেয়ার-২';
    return 'ইকবাল ফার্মেসী';
  };

  const getFacilitySubtitle = (seal?: string) => {
    if (seal === 'dental_1' || seal === 'dental_2') {
      return 'আধুনিক ডিজিটাল ডেন্টাল ক্লিনিক ও বিশেষায়িত দন্ত চিকিৎসা সেবা';
    }
    return 'মডেল ফার্মেসী · আসল ঔষধ ও সার্বক্ষণিক চিকিৎসাসেবা';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-6">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-verified-invoice, #printable-verified-invoice * {
            visibility: visible;
          }
          #printable-verified-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 10px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/60 border border-teal-400/40 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                <span>ইনভয়েস ও প্রেসক্রিপশন যাচাই</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  ডিজিটাল ভেরিফিকেশন
                </span>
              </h3>
              <p className="text-[11px] text-teal-200">
                ইকবাল ফার্মেসী ও ইকবাল ডেন্টাল কেয়ার (শাখা ১ ও ২)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar (Sticky under header) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performSearch(searchTerm);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ইনভয়েস কোড (যেমন: INV-261020-187) বা পেশেন্ট আইডি / ফোন..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>যাচাই করুন</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Helper / Sample Tags */}
          <div className="mt-2.5 flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">উদাহরণ:</span>
            {localTransactions.slice(0, 3).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSearchTerm(t.invoiceNo);
                  performSearch(t.invoiceNo);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-teal-800 hover:border-teal-400 hover:bg-teal-50 font-mono text-[10.5px] transition-colors cursor-pointer"
              >
                {t.invoiceNo}
              </button>
            ))}
            <span className="text-slate-400">|</span>
            <span className="text-[10.5px]">পেশেন্ট আইডি দিলে সকল ইনভয়েস সর্বশেষ তারিখ অনুসারে দেখতে পারবেন।</span>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          {searchError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">ইনভয়েস তথ্য পাওয়া যায়নি</p>
                <p className="mt-0.5 text-rose-700">{searchError}</p>
              </div>
            </div>
          )}

          {/* If an active invoice is selected: SHOW AUTHENTIC CASH MEMO */}
          {activeInvoice ? (
            <div className="space-y-4">
              {/* Top Controls Bar for Memo */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs no-print">
                <div className="flex items-center gap-2">
                  {matchedInvoices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveInvoice(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>সকল ইনভয়েস তালিকা ({matchedInvoices.length})</span>
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>যাচাইকৃত আসল ক্যাশ মেমো</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyVerificationLink(activeInvoice.invoiceNo)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'লিংক কপি হয়েছে!' : 'লিংক কপি'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট / ডাউনলোড</span>
                  </button>
                </div>
              </div>

              {/* Printable Cash Memo Card */}
              <div
                id="printable-verified-invoice"
                ref={printContainerRef}
                className="bg-white rounded-xl border-2 border-slate-300 shadow-md p-4 sm:p-6 text-slate-900 max-w-2xl mx-auto"
              >
                {/* Memo Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-3 text-center relative">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-black text-sm">
                      +
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {getFacilityName(activeInvoice.selectedSeal)}
                    </h2>
                  </div>
                  <p className="text-xs font-bold text-teal-800">
                    {getFacilitySubtitle(activeInvoice.selectedSeal)}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    ঠিকানা: নতুনহাট, দক্ষিণ বাজার, চন্দ্রগঞ্জ, লক্ষ্মীপুর। · মোবাইল: ০১৮১২-৩৫৮৮৩৯
                  </p>
                  <div className="mt-1 inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10.5px] font-bold border border-slate-300">
                    <span>ড্রাগ লাইসেন্স নং:</span>
                    <span className="font-mono text-rose-700">LP-3577</span>
                  </div>
                </div>

                {/* Memo Meta Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-3">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold">ইনভয়েস নম্বর:</p>
                    <p className="font-mono font-bold text-slate-900 text-sm">{activeInvoice.invoiceNo}</p>
                    <p className="text-[10.5px] text-slate-600 mt-0.5">
                      তারিখ: <span className="font-semibold text-slate-800">{activeInvoice.dateStr}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-semibold">ক্রেতা / রোগীর বিবরণ:</p>
                    <p className="font-bold text-slate-900">{activeInvoice.partyName || 'সাধারণ ক্রেতা'}</p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      ফোন: {activeInvoice.partyPhone || 'N/A'}
                    </p>
                    {activeInvoice.partyId && activeInvoice.partyId !== 'walk-in' && (
                      <p className="text-[10px] text-teal-800 font-mono font-bold">
                        পেশেন্ট আইডি: {activeInvoice.partyId}
                      </p>
                    )}
                    {(activeInvoice.patientAge || activeInvoice.patientSex) && (
                      <p className="text-[10px] text-slate-500">
                        বয়স/লিঙ্গ: {activeInvoice.patientAge || '-'} / {activeInvoice.patientSex || '-'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Clinical Findings / Vitals (If available) */}
                {activeInvoice.dentalClinical && Object.keys(activeInvoice.dentalClinical).length > 0 && (
                  <div className="mb-3 p-2.5 rounded-lg bg-teal-50/60 border border-teal-200 text-xs">
                    <div className="flex items-center gap-1.5 text-teal-900 font-bold text-[11px] pb-1 border-b border-teal-200 mb-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                      <span>ক্লিনিক্যাল পর্যবেক্ষণ ও প্রেসক্রিপশন নোট</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10.5px]">
                      {Object.entries(activeInvoice.dentalClinical).map(([k, v]) => (
                        <div key={k} className="bg-white/80 p-1 rounded border border-teal-100">
                          <span className="text-teal-800 font-semibold block">{k}:</span>
                          <span className="text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-800 text-[10.5px] uppercase font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-1.5 px-2 text-center w-8">ক্র.</th>
                        <th className="py-1.5 px-2">আইটেমের বিবরণ ও সেবনবিধি</th>
                        <th className="py-1.5 px-2 text-right">মূল্য</th>
                        <th className="py-1.5 px-2 text-center">পরিমাণ</th>
                        <th className="py-1.5 px-2 text-right">মোট টাকা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-[11.5px]">
                      {parsedItems.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-1.5 px-2 text-center font-mono text-[10.5px] text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2">
                            <span className="font-bold text-slate-900 block leading-tight">
                              {item.cleanName || item.brandAndStrength}
                            </span>
                            {item.dosageInstruction && (
                              <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5">
                                {item.dosageInstruction}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">
                            ৳{formatCleanMoney(item.unitPrice)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold">
                            {item.qty}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                            ৳{formatCleanMoney(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                      {parsedItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-3 px-3 text-center text-slate-500 text-xs">
                            {activeInvoice.itemsSummary || 'কোনো আইটেম রেকর্ড পাওয়া যায়নি'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 text-xs">
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <p>
                      <span className="font-semibold text-slate-700">পেমেন্ট মাধ্যম:</span>{' '}
                      <span className="font-mono font-bold uppercase text-slate-900">
                        {activeInvoice.paymentMethod || 'CASH'}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">অপারেটর:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {activeInvoice.staffRole === 'owner' ? 'মালিক (Owner)' : activeInvoice.staffName || 'স্টাফ'}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">কাউন্টার:</span>{' '}
                      <span>{activeInvoice.counterName || 'কাউন্টার ১'}</span>
                    </p>
                  </div>

                  <div className="w-full sm:w-56 space-y-1 text-right text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>সাবটোটাল:</span>
                      <span className="font-mono font-semibold">৳{formatCleanMoney(activeInvoice.subTotal)}</span>
                    </div>
                    {activeInvoice.discount > 0 && (
                      <div className="flex justify-between text-rose-700 font-medium">
                        <span>বিশেষ ছাড়:</span>
                        <span className="font-mono">-৳{formatCleanMoney(activeInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-300 pt-1">
                      <span>সর্বমোট প্রদেয় বিল:</span>
                      <span className="font-mono text-teal-900">৳{formatCleanMoney(activeInvoice.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-semibold">
                      <span>পরিশোধ (Paid):</span>
                      <span className="font-mono">৳{formatCleanMoney(activeInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-0.5">
                      <span className={activeInvoice.dueAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                        {activeInvoice.dueAmount > 0 ? 'বকেয়া (DUE):' : 'স্ট্যাটাস:'}
                      </span>
                      <span
                        className={`font-mono ${
                          activeInvoice.dueAmount > 0
                            ? 'text-rose-700 font-black'
                            : 'text-emerald-700 font-bold'
                        }`}
                      >
                        {activeInvoice.dueAmount > 0
                          ? `৳${formatCleanMoney(activeInvoice.dueAmount)}`
                          : 'সম্পূর্ণ পরিশোধিত (PAID)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Seal, QR Code & Signatures */}
                <div className="pt-3 border-t-2 border-slate-800 flex items-center justify-between gap-4 text-center">
                  <div className="w-32">
                    <div className="h-9 border-b border-dashed border-slate-400"></div>
                    <p className="text-[10px] font-bold text-slate-700 mt-1">ক্রেতার স্বাক্ষর</p>
                    <p className="text-[8.5px] text-slate-400">Customer's Signature</p>
                  </div>

                  {/* QR Code */}
                  {qrDataUrl && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-0.5 bg-white border border-slate-300 rounded shadow-2xs">
                        <img
                          src={qrDataUrl}
                          alt={`QR Verification for ${activeInvoice.invoiceNo}`}
                          className="w-16 h-16"
                        />
                      </div>
                      <div className="font-mono font-bold text-slate-800 text-[8.5px] mt-0.5">
                        পেমেন্ট ও বিল যাচাই QR
                      </div>
                      <div className="font-mono text-slate-600 text-[7.5px]">
                        {activeInvoice.invoiceNo} · ৳{Math.round(activeInvoice.grandTotal)}
                      </div>
                    </div>
                  )}

                  <div className="w-32">
                    <div className="h-9 border-b border-dashed border-slate-400"></div>
                    <p className="text-[10px] font-bold text-slate-700 mt-1">বিক্রেয়কারীর স্বাক্ষর</p>
                    <p className="text-[8.5px] text-slate-400">Owner / Pharmacist</p>
                  </div>
                </div>

                <div className="mt-3 text-center text-[9px] text-slate-500 border-t border-slate-200 pt-1.5">
                  <p>সুস্থ থাকুন, সঠিক সময়ে ঔষধ সেবন করুন। ইকবাল হেলথকেয়ারের সাথে থাকার জন্য ধন্যবাদ।</p>
                </div>
              </div>
            </div>
          ) : matchedInvoices.length > 0 ? (
            /* Mode 2: Multiple Invoices / Patient Invoices sorted latest first */
            <div className="space-y-4">
              {patientSummary && (
                <div className="bg-gradient-to-r from-teal-900 to-indigo-900 text-white p-4 rounded-xl shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-700/60">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-teal-300 font-bold block">
                        রোগী / গ্রাহকের প্রোফাইল ও ইনভয়েস হিস্টোরি
                      </span>
                      <h4 className="text-base sm:text-lg font-black">{patientSummary.name}</h4>
                      <p className="text-xs text-teal-200 font-mono">
                        পেশেন্ট আইডি: <span className="font-bold text-white">{patientSummary.patientId}</span> · ফোন: {patientSummary.phone}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-teal-300" />
                      <span>সর্বশেষ তারিখের ক্রম অনুসারে ({patientSummary.totalInvoices} টি ইনভয়েস)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-[10px] text-teal-200">মোট সেবা/বিল</p>
                      <p className="text-sm font-black font-mono">৳{formatCleanMoney(patientSummary.totalAmount)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-[10px] text-emerald-300">পরিশোধিত</p>
                      <p className="text-sm font-black font-mono text-emerald-300">৳{formatCleanMoney(patientSummary.totalPaid)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-[10px] text-rose-300">মোট বকেয়া</p>
                      <p className={`text-sm font-black font-mono ${patientSummary.totalDue > 0 ? 'text-rose-300 font-bold' : 'text-slate-300'}`}>
                        ৳{formatCleanMoney(patientSummary.totalDue)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>ইনভয়েস সমূহের তালিকা (সর্বশেষ তারিখ প্রথমে)</span>
                  <span className="text-slate-500 font-normal">যেকোনো ইনভয়েসে ক্লিক করে মূল মেমো দেখুন</span>
                </div>

                {matchedInvoices.map((inv) => (
                  <div
                    key={inv.id || inv.invoiceNo}
                    onClick={() => setActiveInvoice(inv)}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {inv.invoiceNo}
                          </span>
                          <span className="text-[10.5px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {getFacilityName(inv.selectedSeal)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>তারিখ: {inv.dateStr}</span>
                          </span>
                          <span>·</span>
                          <span>{inv.partyName || 'সাধারণ ক্রেতা'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-black font-mono text-slate-900">
                          ৳{formatCleanMoney(inv.grandTotal)}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            inv.dueAmount > 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {inv.dueAmount > 0 ? `বকেয়া ৳${formatCleanMoney(inv.dueAmount)}` : 'পরিশোধিত (PAID)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveInvoice(inv);
                        }}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <span>মেমো দেখুন</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Mode 3: Initial Empty State */
            <div className="text-center py-10 px-4 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border-2 border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-inner">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  ইনভয়েস বা প্রেসক্রিপশন নম্বর দিয়ে খুঁজুন
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  আপনার ক্যাশ মেমোতে থাকা QR কোডটি স্ক্যান করলে বা উপরের সার্চ বক্সে ইনভয়েস নম্বর অথবা পেশেন্ট আইডি লিখলে সম্পূর্ণ মেমো দেখতে পারবেন এবং পুনরায় প্রিন্ট বা সংরক্ষণ করতে পারবেন।
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ডিজিটাল যাচাই সুবিধার বৈশিষ্ট্য:</span>
                </p>
                <ul className="text-slate-600 space-y-1 pl-5 list-disc text-[11px]">
                  <li>আসল ঔষধ ও নির্ধারিত দামের সঠিক নিশ্চয়তা</li>
                  <li>রোগীর পূর্ববর্তী সকল প্রেসক্রিপশন ও বিলের ইতিহাস</li>
                  <li>যেকোনো সময় পুনরায় প্রিন্ট বা ডাউনলোড করার সুযোগ</li>
                  <li>ড্রাগ লাইসেন্স ও রেজিস্টার্ড ফার্মাসিস্ট সিল সংবলিত মেমো</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span className="font-semibold text-slate-800">ইকবাল হেলথকেয়ার নিরাপদ ভেরিফিকেশন সিস্টেম</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
