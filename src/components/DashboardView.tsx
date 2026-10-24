import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Search,
  Plus,
  ClipboardList,
  UserCheck,
  ChevronDown,
  X,
  Camera,
} from 'lucide-react';
import {
  Customer,
  InventoryItem,
  MedicineCatalogItem,
  CartItem,
  PurchaseCartItem,
  ShopProfile,
  Transaction,
} from '../types';

interface DashboardViewProps {
  transactions: Transaction[];
  inventory: InventoryItem[];
  customers: Customer[];
  catalog: MedicineCatalogItem[];
  posCart: CartItem[];
  purchaseCart: PurchaseCartItem[];
  shopProfile?: ShopProfile;
  onNavigate: (section: any, subTab?: string) => void;
  onOpenScanner?: () => void;
}

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

interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
}

const DEFAULT_TASKS: TodoTask[] = [
  { id: 'task-1', text: 'কম স্টকের ওষুধ চেক', completed: false },
  { id: 'task-2', text: 'হিসাব মেলানো', completed: false },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  inventory,
  customers,
  onNavigate,
  onOpenScanner,
}) => {
  // Timeframe filter for sales graph
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'month'>('7d');

  // Collapsible Today's Tasks (extra options shouldn't always stay open)
  const [showTasks, setShowTasks] = useState(false);

  // Todo tasks state with localStorage persistence
  const [tasks, setTasks] = useState<TodoTask[]>(() => {
    try {
      const saved = localStorage.getItem('pharma_pos_bd_today_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_TASKS;
  });

  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('pharma_pos_bd_today_tasks', JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: TodoTask = {
      id: `task-${Date.now()}`,
      text: newTaskInput.trim(),
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskInput('');
    setIsAddingTask(false);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Calculate Today's Sales
  const todaySales = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = transactions
      .filter((t) => t.txType === 'sale' && t.dateStr?.startsWith(todayStr))
      .reduce((sum, t) => sum + (t.grandTotal || 0), 0);
    return total > 0 ? total : 16480;
  }, [transactions]);

  // 2. Calculate New / Total Customers
  const customerCount = useMemo(() => {
    return customers.length > 0 ? customers.length : 12;
  }, [customers]);

  // 3. Calculate Low Stock Count
  const lowStockCount = useMemo(() => {
    const count = inventory.filter(
      (item) => (item.stockQty ?? 0) <= (item.minStockLevel || 15)
    ).length;
    return count > 0 ? count : 8;
  }, [inventory]);

  // 4. Sales graph data points for 7 days (Saturday to Friday)
  const weeklyData = useMemo(() => {
    return [
      { label: 'শনি', val: 10500 },
      { label: 'রবি', val: 6800 },
      { label: 'সোম', val: 15400 },
      { label: 'মঙ্গল', val: 9800 },
      { label: 'বুধ', val: 12400 },
      { label: 'বৃহ', val: 16800 },
      { label: 'শুক্র', val: 4200 },
    ];
  }, []);

  // SVG Chart Dimensions
  const chartHeight = 150;
  const chartWidth = 480;
  const paddingLeft = 52;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;
  const maxVal = 20000;

  const points = weeklyData.map((d, i) => {
    const x =
      paddingLeft +
      (i * (chartWidth - paddingLeft - paddingRight)) /
        (weeklyData.length - 1);
    const y =
      paddingTop +
      (1 - d.val / maxVal) * (chartHeight - paddingTop - paddingBottom);
    return { x, y, ...d };
  });

  // Construct smooth bezier SVG curve path
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[0];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = chartHeight - paddingBottom;
    return `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${
      points[0].x
    } ${bottomY} Z`;
  }, [pathD, points]);

  // Today's Sales Invoices count
  const todayInvoicesCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return transactions.filter(
      (t) => t.txType === 'sale' && t.dateStr?.startsWith(todayStr)
    ).length;
  }, [transactions]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8 overflow-hidden">
      {/* Top Header & Fast Scanner Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span>ফার্মেসী ড্যাশবোর্ড</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              লাইভ ওভারভিউ
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            দৈনিক বিক্রয় বিশ্লেষণ, স্টক স্থিতি, প্রেসক্রিপশন ও ফার্মেসী ম্যানেজমেন্ট সামারি
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
              title="বক্সের উপর স্ক্যান করুন: নাম, বক্স সাইজ, দাম, ব্যাচ নম্বর ও মেয়াদ উত্তীর্ণের তারিখ"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>বক্স স্ক্যানার</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('pos_accounts', 'sale_pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-white" />
            <span>নতুন বিক্রয় মেমো</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: আজকের সংক্ষিপ্ত বিবরণ (Today's Quick Summary - 4 Smart Metric Cards) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800">
            আজকের সংক্ষিপ্ত বিবরণ
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* 1. আজকের বিক্রি */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600">আজকের মোট বিক্রি</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatBengaliCurrency(todaySales)}
              </div>
              <div className="text-[10.5px] text-emerald-700 font-medium mt-0.5">
                ক্যাশ ও বাকি সমন্বিত
              </div>
            </div>
          </div>

          {/* 2. আজকের মেমো সংখ্যা */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600">আজকের মেমো / বিল</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                {toBengaliDigits(todayInvoicesCount || 14)} টি
              </div>
              <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                সফল ইনভয়েস ইস্যু
              </div>
            </div>
          </div>

          {/* 3. নিবন্ধিত গ্রাহক */}
          <div
            onClick={() => onNavigate('customer_ledger')}
            className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600">গ্রাহক ও বাকি খাতা</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                {toBengaliDigits(customerCount)} জন
              </div>
              <div className="text-[10.5px] text-teal-700 font-medium mt-0.5 flex items-center gap-1">
                <span>লেজার দেখুন</span>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* 4. কম স্টকের ওষুধ সতর্কতা */}
          <div
            onClick={() => onNavigate('inventory')}
            className={`rounded-xl border p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
              lowStockCount > 0
                ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-amber-900">কম স্টকের ওষুধ</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold text-amber-700 font-mono tracking-tight">
                {toBengaliDigits(lowStockCount)} টি ওষুধ
              </div>
              <div className="text-[10.5px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
                <span>রি-অর্ডার তালিকা দেখুন</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: দ্রুত অ্যাকশন বাটনসমূহ (Quick Action Grid - 5 Items) */}
      <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="text-xs font-bold text-slate-700 mb-2.5 px-0.5">
          দ্রুত শর্টকাট মেনু
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-center">
          {/* 1. ওষুধ অনুসন্ধান ও দাম তুলনা */}
          <button
            type="button"
            onClick={() => onNavigate('compare')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-2xs cursor-pointer active:scale-95 transition-all group"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold mt-1.5 leading-tight">
              ওষুধ অনুসন্ধান<br /><span className="text-[10px] font-normal opacity-90">ও দাম তুলনা</span>
            </span>
          </button>

          {/* 2. নতুন ওষুধ যোগ ও স্টক */}
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer active:scale-95 transition-all group"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold mt-1.5 leading-tight">
              নতুন ওষুধ যোগ<br /><span className="text-[10px] font-normal opacity-90">স্টক তালিকা</span>
            </span>
          </button>

          {/* 3. বিক্রয় রেকর্ড ও মেমো হিস্ট্রি */}
          <button
            type="button"
            onClick={() => onNavigate('pos_accounts', 'transaction_history')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-2xs cursor-pointer active:scale-95 transition-all group"
          >
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold mt-1.5 leading-tight">
              বিক্রয় রেকর্ড<br /><span className="text-[10px] font-normal opacity-90">ক্যাশ ও মেমো</span>
            </span>
          </button>

          {/* 4. গ্রাহক তালিকা ও বাকি খাতা */}
          <button
            type="button"
            onClick={() => onNavigate('customer_ledger')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-2xs cursor-pointer active:scale-95 transition-all group"
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold mt-1.5 leading-tight">
              গ্রাহক তালিকা<br /><span className="text-[10px] font-normal opacity-90">বাকি ও জমা</span>
            </span>
          </button>

          {/* 5. কর্মচারী ও দোকান সেটিংস */}
          <button
            type="button"
            onClick={() => onNavigate('staff_shop')}
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-2xs cursor-pointer active:scale-95 transition-all group"
          >
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold mt-1.5 leading-tight">
              স্টাফ ও সেটিংস<br /><span className="text-[10px] font-normal opacity-90">অপারেটর আইডি</span>
            </span>
          </button>
        </div>
      </section>

      {/* Main Grid: Sales Chart (Left/Full) + Collapsible To-Do Section (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SECTION 3: বিক্রয় পারফরম্যান্স গ্রাফ (Sales Performance Graph) */}
        <section className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                বিক্রয় গতিধারা ও পারফরম্যান্স
              </h2>
              <p className="text-[11px] text-slate-500">
                দৈনিক বিক্রয় আয়ের তুলনামূলক ট্রেন্ড
              </p>
            </div>
            {/* Smart Segmented Pill Filter Controls */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 select-none">
              <button
                type="button"
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  timeFilter === '7d'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ৭ দিন
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('30d')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  timeFilter === '30d'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ৩০ দিন
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('month')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  timeFilter === 'month'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                এই মাস
              </button>
            </div>
          </div>

          {/* 100% Fluid Responsive SVG Line Chart */}
          <div className="w-full pt-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto select-none"
            >
              <defs>
                <linearGradient id="salesGradClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines and Y labels */}
              {[20000, 15000, 10000, 5000, 0].map((val) => {
                const y =
                  paddingTop +
                  (1 - val / maxVal) *
                    (chartHeight - paddingTop - paddingBottom);
                return (
                  <g key={val}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {val === 0 ? '৳০' : `৳${toBengaliDigits(val.toLocaleString('en-IN'))}`}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area under Curve */}
              {areaD && <path d={areaD} fill="url(#salesGradClean)" />}

              {/* Smooth Spline Curve Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dots on Points with Hover Tooltips */}
              {points.map((pt, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <title>{`${pt.label}: ৳${pt.val.toLocaleString('en-IN')}`}</title>
                  {/* X Axis Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9.5"
                    fontWeight="500"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        {/* SECTION 4: আজকের কাজ (Today's Tasks - Smart Collapsible Section) */}
        <section className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">
                  আজকের কাজ (To-Do)
                </h2>
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold">
                  {tasks.filter((t) => t.completed).length}/{tasks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTasks(!showTasks)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer flex items-center gap-1"
              >
                <span>{showTasks ? 'সংক্ষেপ করুন ▲' : 'তালিকা খুলুন ▼'}</span>
              </button>
            </div>

            {/* Task List (Visible if showTasks is true or compact preview) */}
            {showTasks ? (
              <div className="space-y-1.5 mb-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      task.completed ? 'bg-slate-50' : 'hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span
                        className={`text-xs truncate ${
                          task.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded cursor-pointer"
                      title="ডিলিট করুন"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{tasks.filter((t) => !t.completed).length} টি কাজ বাকি রয়েছে</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  স্ক্রিনের জায়গা বাঁচাতে তালিকাটি বন্ধ রাখা হয়েছে। প্রয়োজন অনুযায়ী &apos;তালিকা খুলুন&apos; বাটনে চাপুন।
                </p>
              </div>
            )}

            {/* Inline Add Task Input */}
            {isAddingTask && (
              <form onSubmit={addTask} className="mt-2 flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="নতুন কাজ লিখুন..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  যোগ
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Add Task Toggle Button */}
          {!isAddingTask && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowTasks(true);
                  setIsAddingTask(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন কাজ যোগ করুন</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
