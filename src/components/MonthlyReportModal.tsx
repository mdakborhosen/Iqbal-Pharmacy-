import React, { useMemo, useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  Package,
  Award,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Transaction, ShopProfile, InventoryItem } from '../types';

export const toBengaliDigits = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/\d/g, (d) => bnDigits[parseInt(d, 10)] ?? d);
};

export const formatBengaliCurrency = (num: number): string => {
  const formatted = Math.round(num).toLocaleString('en-IN');
  return `৳${toBengaliDigits(formatted)}`;
};

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  inventory?: InventoryItem[];
  shopProfile?: ShopProfile;
  initialMonth?: string; // YYYY-MM
}

// Helper to format English YYYY-MM to Bengali Month Name
const formatBengaliMonthYear = (ym: string): string => {
  if (!ym) return '';
  const [yearStr, monthStr] = ym.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthsBn = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];
  const monthName = monthsBn[monthNum - 1] || monthStr;
  return `${monthName} ${toBengaliDigits(yearStr)}`;
};

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  inventory = [],
  shopProfile,
  initialMonth,
}) => {
  // Current month in YYYY-MM
  const currentYm = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || currentYm);
  const [reportType, setReportType] = useState<'all' | 'sales' | 'purchases'>('all');
  const [activeTab, setActiveTab] = useState<'summary' | 'daily' | 'items' | 'all_invoices'>('summary');

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevY = prevDate.getFullYear();
    const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${prevY}-${prevM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextY = nextDate.getFullYear();
    const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextY}-${nextM}`);
  };

  // Filter transactions for the selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.dateStr) return false;
      return tx.dateStr.startsWith(selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // Aggregate monthly stats
  const monthlyMetrics = useMemo(() => {
    let totalSales = 0;
    let salesCount = 0;
    let salesCashCollected = 0;
    let salesDue = 0;
    let salesDiscount = 0;

    let totalPurchases = 0;
    let purchasesCount = 0;
    let purchasesPaid = 0;
    let purchasesDue = 0;

    const uniqueCustomerIds = new Set<string>();
    const dailyMap: {
      [dateStr: string]: {
        dateStr: string;
        salesCount: number;
        salesAmount: number;
        salesCash: number;
        salesDue: number;
        purchasesCount: number;
        purchasesAmount: number;
        purchasesPaid: number;
        purchasesDue: number;
      };
    } = {};

    // Medicine sale frequency map for top selling medicines
    const medicineSalesMap: {
      [brandName: string]: {
        brandName: string;
        genericName: string;
        companyName: string;
        qtySold: number;
        totalRevenue: number;
      };
    } = {};

    // Supplier purchases map
    const supplierPurchasesMap: {
      [companyName: string]: {
        companyName: string;
        billCount: number;
        totalAmount: number;
      };
    } = {};

    monthTransactions.forEach((tx) => {
      const d = tx.dateStr || 'Unknown';
      if (!dailyMap[d]) {
        dailyMap[d] = {
          dateStr: d,
          salesCount: 0,
          salesAmount: 0,
          salesCash: 0,
          salesDue: 0,
          purchasesCount: 0,
          purchasesAmount: 0,
          purchasesPaid: 0,
          purchasesDue: 0,
        };
      }

      const txAny = tx as any;
      const txAmount = tx.grandTotal || txAny.finalTotal || txAny.totalAmount || 0;

      if (tx.txType === 'sale') {
        salesCount++;
        totalSales += txAmount;
        salesCashCollected += tx.paidAmount || 0;
        salesDue += tx.dueAmount || 0;
        salesDiscount += tx.discount || 0;
        if (tx.partyId) uniqueCustomerIds.add(tx.partyId);

        dailyMap[d].salesCount++;
        dailyMap[d].salesAmount += txAmount;
        dailyMap[d].salesCash += tx.paidAmount || 0;
        dailyMap[d].salesDue += tx.dueAmount || 0;

        // Extract items if available
        if (Array.isArray(txAny.items)) {
          txAny.items.forEach((item: any) => {
            const bName = item.brandName || item.medicineName || item.name || 'ঔষধ আইটেম';
            const qty = item.qty || item.quantity || 1;
            const rev = (item.unitPrice || item.price || 0) * qty;

            if (!medicineSalesMap[bName]) {
              medicineSalesMap[bName] = {
                brandName: bName,
                genericName: item.genericName || '',
                companyName: item.companyName || '',
                qtySold: 0,
                totalRevenue: 0,
              };
            }
            medicineSalesMap[bName].qtySold += qty;
            medicineSalesMap[bName].totalRevenue += rev;
          });
        }
      } else if (tx.txType === 'purchase') {
        purchasesCount++;
        totalPurchases += txAmount;
        purchasesPaid += tx.paidAmount || 0;
        purchasesDue += tx.dueAmount || 0;

        dailyMap[d].purchasesCount++;
        dailyMap[d].purchasesAmount += txAmount;
        dailyMap[d].purchasesPaid += tx.paidAmount || 0;
        dailyMap[d].purchasesDue += tx.dueAmount || 0;

        const comp = tx.partyName || txAny.companyName || 'সাপ্লায়ার / কোম্পানি';
        if (!supplierPurchasesMap[comp]) {
          supplierPurchasesMap[comp] = {
            companyName: comp,
            billCount: 0,
            totalAmount: 0,
          };
        }
        supplierPurchasesMap[comp].billCount++;
        supplierPurchasesMap[comp].totalAmount += txAmount;
      }
    });

    const sortedDailyList = Object.values(dailyMap).sort((a, b) =>
      b.dateStr.localeCompare(a.dateStr)
    );

    const topSellingMedicines = Object.values(medicineSalesMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const topSuppliers = Object.values(supplierPurchasesMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const grossMargin = totalSales - totalPurchases;
    const marginPercent = totalSales > 0 ? (grossMargin / totalSales) * 100 : 0;

    return {
      totalSales,
      salesCount,
      salesCashCollected,
      salesDue,
      salesDiscount,
      totalPurchases,
      purchasesCount,
      purchasesPaid,
      purchasesDue,
      grossMargin,
      marginPercent,
      customersCount: uniqueCustomerIds.size,
      dailyList: sortedDailyList,
      topSellingMedicines,
      topSuppliers,
    };
  }, [monthTransactions]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Header (Hidden when printing) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                মাসিক বিক্রয় ও ক্রয় অডিট রিপোর্ট
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              নির্বাচিত মাসের মোট বিক্রয়, ক্রয়, ক্যাশ ফ্লো এবং লাভ-ক্ষতির পূর্ণাঙ্গ মুদ্রণযোগ্য প্রতিবেদন
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Month Selector Buttons */}
            <div className="flex items-center bg-white border border-slate-300 rounded-xl shadow-2xs p-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="পূর্ববর্তী মাস"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold font-mono text-slate-800 px-2 py-1 outline-none bg-transparent cursor-pointer"
              />
              <button
                type="button"
                onClick={handleNextMonth}
                title="পরবর্তী মাস"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              title="রিপোর্ট সরাসরি প্রিন্ট করুন বা ব্রাউজারের প্রিন্ট উইন্ডো থেকে 'Save as PDF' নির্বাচন করে সংরক্ষণ করুন"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF ডাউনলোড</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher (No Print) */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-print text-xs shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white/80'
              }`}
            >
              📊 আর্থিক সারাংশ ও চার্ট
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white/80'
              }`}
            >
              📅 দিনভিত্তিক হিসাব ({toBengaliDigits(monthlyMetrics.dailyList.length)} দিন)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white/80'
              }`}
            >
              💊 শীর্ষ বিক্রিত ঔষধ ও সাপ্লায়ার
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all_invoices')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'all_invoices'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white/80'
              }`}
            >
              📑 সকল ইনভয়েস তালিকা ({toBengaliDigits(monthTransactions.length)})
            </button>
          </div>

          <div className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 hidden md:block">
            মাস: {formatBengaliMonthYear(selectedMonth)}
          </div>
        </div>

        {/* Scrollable Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 printable-report bg-white text-slate-800">
          
          {/* Printable Official Header (Shows prominently on print & screen) */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black text-sm">
                ই
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {shopProfile?.shopName || 'ইকবাল হেলথকেয়ার (ফার্মেসী ও ডেন্টাল কেয়ার)'}
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {shopProfile?.address || 'নতুনহাট, দক্ষিণ বাজার, চন্দ্রগঞ্জ, লক্ষ্মীপুর'} · ড্রাগ লাইসেন্স: {shopProfile?.licenseNo || 'LP-3577'}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              হটলাইন: {shopProfile?.phone || '০১৮১২-৩৫৮৮৩৯'} · ইমেইল: iqbalpharmacy24@gmail.com
            </p>
            <div className="pt-2">
              <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                মাসিক বিক্রয় ও ক্রয় অডিট প্রতিবেদন ({formatBengaliMonthYear(selectedMonth)})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-4 pt-1">
              <span>প্রতিবেদন তৈরির তারিখ: {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>মোট ইনভয়েস: {toBengaliDigits(monthTransactions.length)} টি</span>
            </div>
          </div>

          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. মোট বিক্রয় */}
            <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50">
              <div className="flex items-center justify-between text-teal-800 text-xs font-bold">
                <span>মোট বিক্রয় (Sales)</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-teal-950 font-mono mt-1">
                {formatBengaliCurrency(monthlyMetrics.totalSales)}
              </div>
              <div className="text-[11px] text-teal-700 font-medium mt-1 flex justify-between">
                <span>ইনভয়েস: {toBengaliDigits(monthlyMetrics.salesCount)} টি</span>
                <span>নগদ: {toBengaliDigits(Math.round(monthlyMetrics.salesCashCollected))}৳</span>
              </div>
            </div>

            {/* 2. মোট ক্রয় */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
              <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
                <span>মোট ক্রয় (Purchases)</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-blue-950 font-mono mt-1">
                {formatBengaliCurrency(monthlyMetrics.totalPurchases)}
              </div>
              <div className="text-[11px] text-blue-700 font-medium mt-1 flex justify-between">
                <span>ভাউচার: {toBengaliDigits(monthlyMetrics.purchasesCount)} টি</span>
                <span>পরিশোধ: {toBengaliDigits(Math.round(monthlyMetrics.purchasesPaid))}৳</span>
              </div>
            </div>

            {/* 3. মোট লাভ / ব্যবধান */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                <span>মোট ব্যবধান / গ্রস মার্জিন</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950 font-mono mt-1">
                {formatBengaliCurrency(monthlyMetrics.grossMargin)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                মার্জিন অনুপাত: {toBengaliDigits(monthlyMetrics.marginPercent.toFixed(1))}%
              </div>
            </div>

            {/* 4. বাকি ও বকেয়া স্থিতি */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
                <span>কাস্টমার বাকি ও ছাড়</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-950 font-mono mt-1">
                {formatBengaliCurrency(monthlyMetrics.salesDue)}
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1 flex justify-between">
                <span>মোট ছাড়: {toBengaliDigits(monthlyMetrics.salesDiscount)}৳</span>
                <span>সাপ্লায়ার দেনা: {toBengaliDigits(monthlyMetrics.purchasesDue)}৳</span>
              </div>
            </div>
          </div>

          {/* TAB 1: SUMMARY & DETAILS */}
          {(activeTab === 'summary' || typeof window !== 'undefined') && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>মাসিক আর্থিক হিসাবের তুলনামূলক বিবরণী</span>
                  <span className="font-normal text-slate-500 text-[11px]">শাখা ১ ও ২ সমন্বিত</span>
                </div>
                <div className="divide-y divide-slate-200 text-xs">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">মোট বিক্রয় ইনভয়েস সংখ্যা</span>
                    <span className="font-mono font-bold text-slate-900">{toBengaliDigits(monthlyMetrics.salesCount)} টি</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50">
                    <span className="font-semibold text-slate-700">মোট বিক্রয় বিল (Gross Sales)</span>
                    <span className="font-mono font-bold text-teal-800">{formatBengaliCurrency(monthlyMetrics.totalSales)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">ক্যাশ ও ডিজিটাল পেমেন্টে আদায়</span>
                    <span className="font-mono font-bold text-emerald-700">{formatBengaliCurrency(monthlyMetrics.salesCashCollected)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50">
                    <span className="font-semibold text-slate-700">কাস্টমারদের কাছে বকেয়া (Sales Due)</span>
                    <span className="font-mono font-bold text-amber-700">{formatBengaliCurrency(monthlyMetrics.salesDue)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">মোট কোম্পানি ক্রয় ভাউচার সংখ্যা</span>
                    <span className="font-mono font-bold text-slate-900">{toBengaliDigits(monthlyMetrics.purchasesCount)} টি</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50">
                    <span className="font-semibold text-slate-700">মোট ঔষধ ক্রয় ব্যয় (Total Purchases)</span>
                    <span className="font-mono font-bold text-blue-800">{formatBengaliCurrency(monthlyMetrics.totalPurchases)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-semibold text-slate-700">কোম্পানিকে পরিশোধিত অর্থ (Paid Amount)</span>
                    <span className="font-mono font-bold text-slate-900">{formatBengaliCurrency(monthlyMetrics.purchasesPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50">
                    <span className="font-semibold text-slate-700">কোম্পানির কাছে দেনা (Payables Due)</span>
                    <span className="font-mono font-bold text-rose-700">{formatBengaliCurrency(monthlyMetrics.purchasesDue)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-teal-50/80 font-bold text-sm text-teal-950">
                    <span>নেট পরিচালন উদ্বৃত্ত (বিক্রয় - ক্রয়)</span>
                    <span className="font-mono font-black">{formatBengaliCurrency(monthlyMetrics.grossMargin)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY BREAKDOWN TABLE */}
          {(activeTab === 'daily' || activeTab === 'summary') && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>তারিখভিত্তিক দৈনিক বিক্রয় ও ক্রয় বিবরণী</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {toBengaliDigits(monthlyMetrics.dailyList.length)} দিনের লেনদেন
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                        <th className="p-2 sm:p-2.5">তারিখ</th>
                        <th className="p-2 sm:p-2.5 text-center">বিক্রয় মেমো</th>
                        <th className="p-2 sm:p-2.5 text-right">বিক্রয় (৳)</th>
                        <th className="p-2 sm:p-2.5 text-right">নগদ আদায়</th>
                        <th className="p-2 sm:p-2.5 text-right">বকেয়া</th>
                        <th className="p-2 sm:p-2.5 text-center">ক্রয় ভাউচার</th>
                        <th className="p-2 sm:p-2.5 text-right">ক্রয় খরচ (৳)</th>
                        <th className="p-2 sm:p-2.5 text-right">নেট ব্যালেন্স (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyMetrics.dailyList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                            এই মাসে কোন লেনদেনের রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        monthlyMetrics.dailyList.map((row) => {
                          const net = row.salesAmount - row.purchasesAmount;
                          return (
                            <tr key={row.dateStr} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2 sm:p-2.5 font-mono font-semibold text-slate-900">
                                {toBengaliDigits(row.dateStr)}
                              </td>
                              <td className="p-2 sm:p-2.5 text-center font-mono">
                                {toBengaliDigits(row.salesCount)}
                              </td>
                              <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-teal-800">
                                {toBengaliDigits(row.salesAmount.toFixed(0))}
                              </td>
                              <td className="p-2 sm:p-2.5 text-right font-mono text-emerald-700">
                                {toBengaliDigits(row.salesCash.toFixed(0))}
                              </td>
                              <td className="p-2 sm:p-2.5 text-right font-mono text-amber-700">
                                {row.salesDue > 0 ? toBengaliDigits(row.salesDue.toFixed(0)) : '০'}
                              </td>
                              <td className="p-2 sm:p-2.5 text-center font-mono">
                                {toBengaliDigits(row.purchasesCount)}
                              </td>
                              <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-blue-800">
                                {toBengaliDigits(row.purchasesAmount.toFixed(0))}
                              </td>
                              <td
                                className={`p-2 sm:p-2.5 text-right font-mono font-bold ${
                                  net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {net >= 0 ? '+' : ''}{toBengaliDigits(net.toFixed(0))}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {monthlyMetrics.dailyList.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                          <td className="p-2 sm:p-2.5">সর্বমোট:</td>
                          <td className="p-2 sm:p-2.5 text-center font-mono">
                            {toBengaliDigits(monthlyMetrics.salesCount)}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono text-teal-900">
                            {toBengaliDigits(monthlyMetrics.totalSales.toFixed(0))}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono text-emerald-800">
                            {toBengaliDigits(monthlyMetrics.salesCashCollected.toFixed(0))}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono text-amber-800">
                            {toBengaliDigits(monthlyMetrics.salesDue.toFixed(0))}
                          </td>
                          <td className="p-2 sm:p-2.5 text-center font-mono">
                            {toBengaliDigits(monthlyMetrics.purchasesCount)}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono text-blue-900">
                            {toBengaliDigits(monthlyMetrics.totalPurchases.toFixed(0))}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono text-emerald-900">
                            {toBengaliDigits(monthlyMetrics.grossMargin.toFixed(0))}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOP SELLING MEDICINES & TOP SUPPLIERS */}
          {(activeTab === 'items' || activeTab === 'summary') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Top Selling Medicines */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-teal-50 px-3.5 py-2 border-b border-teal-200 flex items-center justify-between font-bold text-xs text-teal-900">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-teal-700" />
                    <span>সর্বোচ্চ বিক্রিত ঔষধ (Top Selling)</span>
                  </span>
                  <span className="text-[10.5px] font-normal text-teal-700">র‍্যাংক অনুয়ায়ী</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {monthlyMetrics.topSellingMedicines.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">তথ্য পাওয়া যায়নি</div>
                  ) : (
                    monthlyMetrics.topSellingMedicines.map((med, idx) => (
                      <div key={med.brandName} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{med.brandName}</div>
                            {med.genericName && (
                              <div className="text-[10px] text-slate-500">{med.genericName}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono text-teal-800">
                            {formatBengaliCurrency(med.totalRevenue)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {toBengaliDigits(med.qtySold)} ইউনিট
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Suppliers */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50 px-3.5 py-2 border-b border-blue-200 flex items-center justify-between font-bold text-xs text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span>প্রধান সাপ্লায়ার ও ওষুধ কোম্পানি</span>
                  </span>
                  <span className="text-[10.5px] font-normal text-blue-700">ক্রয় ভলিউম</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {monthlyMetrics.topSuppliers.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">তথ্য পাওয়া যায়নি</div>
                  ) : (
                    monthlyMetrics.topSuppliers.map((supp, idx) => (
                      <div key={supp.companyName} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{supp.companyName}</div>
                            <div className="text-[10px] text-slate-500">
                              {toBengaliDigits(supp.billCount)} টি চালান
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-bold font-mono text-blue-800">
                          {formatBengaliCurrency(supp.totalAmount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALL INVOICES CHRONOLOGICAL AUDIT */}
          {activeTab === 'all_invoices' && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>মাসের সকল বিক্রয় ও ক্রয় ইনভয়েসের তালিকা</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  সর্বমোট: {toBengaliDigits(monthTransactions.length)} টি
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                        <th className="p-2 sm:p-2.5">ইনভয়েস নং</th>
                        <th className="p-2 sm:p-2.5">তারিখ ও সময়</th>
                        <th className="p-2 sm:p-2.5">ধরন</th>
                        <th className="p-2 sm:p-2.5">গ্রাহক / সাপ্লায়ার</th>
                        <th className="p-2 sm:p-2.5 text-right">মোট টাকা</th>
                        <th className="p-2 sm:p-2.5 text-right">পরিশোধ</th>
                        <th className="p-2 sm:p-2.5 text-right">বাকি</th>
                        <th className="p-2 sm:p-2.5 text-center">মাধ্যম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {monthTransactions.map((tx) => (
                        <tr key={tx.id || tx.invoiceNo} className="hover:bg-slate-50">
                          <td className="p-2 sm:p-2.5 font-bold text-slate-900">
                            {tx.invoiceNo || 'INV-01'}
                          </td>
                          <td className="p-2 sm:p-2.5 text-slate-600 font-sans text-[11px]">
                            {tx.dateStr} {(tx as any).timeStr || ''}
                          </td>
                          <td className="p-2 sm:p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                                tx.txType === 'sale'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {tx.txType === 'sale' ? 'বিক্রয়' : 'ক্রয়'}
                            </span>
                          </td>
                          <td className="p-2 sm:p-2.5 text-slate-800 font-sans text-[11px]">
                            {tx.partyName || (tx.txType === 'sale' ? 'সাধারণ ক্রেতা' : 'সাপ্লায়ার')}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-bold text-slate-900">
                            ৳{(tx.grandTotal || (tx as any).finalTotal || (tx as any).totalAmount || 0).toFixed(0)}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right text-emerald-700">
                            ৳{(tx.paidAmount || 0).toFixed(0)}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right text-amber-700 font-bold">
                            {(tx.dueAmount || 0) > 0 ? `৳${tx.dueAmount?.toFixed(0)}` : '-'}
                          </td>
                          <td className="p-2 sm:p-2.5 text-center font-sans text-[10.5px]">
                            {tx.paymentMethod === 'cash' ? 'নগদ' : tx.paymentMethod || 'ক্যাশ'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Official Signatures Section (Shown clearly when printed) */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <p className="font-bold text-slate-800">হিসাব রক্ষক / প্রস্তুতকারী</p>
              <p className="text-[10px] text-slate-500">ইকবাল হেলথকেয়ার</p>
            </div>
            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <p className="font-bold text-slate-800">রেজিস্টার্ড ফার্মাসিস্ট</p>
              <p className="text-[10px] text-slate-500">যাচাই ও নিরীক্ষিত</p>
            </div>
            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <p className="font-bold text-slate-800">স্বত্বাধিকারী / অনুমোদিত স্বাক্ষর</p>
              <p className="text-[10px] text-slate-500">সীল ও অনুমোদন</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            * এটি ইকবাল ফার্মেসী ও ইকবাল ডেন্টাল কেয়ার এর অনুমোদিত ক্লাউড সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত অফিসিয়াল মাসিক রিপোর্ট।
          </div>

        </div>

        {/* Modal Bottom Actions (Hidden when printing) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Download className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              <strong>টিপ:</strong> 'প্রিন্ট / PDF ডাউনলোড' বাটনে ক্লিক করার পর Destination হিসেবে <strong>'Save as PDF'</strong> নির্বাচন করে সেভ করুন।
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সংরক্ষণ</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
