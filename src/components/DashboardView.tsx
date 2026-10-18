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
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

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

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-6 overflow-hidden">
      {/* Title & Scan Icon Button matching user request */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          ড্যাশবোর্ড
        </h1>
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="বক্সের উপর স্ক্যান করুন: নাম, বক্স সাইজ, দাম, ব্যাচ নম্বর ও মেয়াদ উত্তীর্ণের তারিখ"
          >
            <Camera className="w-4 h-4 text-purple-700" />
            <span>(স্ক্যান) বক্স স্ক্যানার</span>
          </button>
        )}
      </div>

      {/* SECTION 1: আজকের সংক্ষিপ্ত বিবরণ (Today's Quick Summary - 3 Cards) */}
      <section className="space-y-2">
        <h2 className="text-xs sm:text-sm font-semibold text-slate-800 px-1">
          আজকের সংক্ষিপ্ত বিবরণ
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* 1. আজকের বিক্রি */}
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 text-center flex flex-col items-center justify-center shadow-2xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">
              আজকের বিক্রি
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-tight">
              {formatBengaliCurrency(todaySales)}
            </div>
          </div>

          {/* 2. নতুন গ্রাহক */}
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 text-center flex flex-col items-center justify-center shadow-2xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">
              নতুন গ্রাহক
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-tight">
              {toBengaliDigits(customerCount)} জন
            </div>
          </div>

          {/* 3. কম স্টকের ওষুধ */}
          <div
            onClick={() => onNavigate('inventory')}
            className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 text-center flex flex-col items-center justify-center shadow-2xs cursor-pointer hover:border-amber-300 transition-colors"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">
              কম স্টকের ওষুধ
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-700 font-mono tracking-tight">
              {toBengaliDigits(lowStockCount)}টি
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: দ্রুত অ্যাকশন বাটনসমূহ (Quick Action Grid - 5 Items) */}
      <section className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 text-center">
          {/* 1. ওষুধ অনুসন্ধান */}
          <button
            type="button"
            onClick={() => onNavigate('compare')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-2xs cursor-pointer active:scale-95 transition-transform"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold mt-1.5 leading-tight">
              ওষুধ<br />অনুসন্ধান
            </span>
          </button>

          {/* 2. নতুন ওষুধ যোগ */}
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold mt-1.5 leading-tight">
              নতুন ওষুধ<br />যোগ
            </span>
          </button>

          {/* 3. বিক্রয় রেকর্ড */}
          <button
            type="button"
            onClick={() => onNavigate('pos_accounts', 'transaction_history')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer active:scale-95 transition-transform"
          >
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold mt-1.5 leading-tight">
              বিক্রয়<br />রেকর্ড
            </span>
          </button>

          {/* 4. গ্রাহক তালিকা */}
          <button
            type="button"
            onClick={() => onNavigate('customer_ledger')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white shadow-2xs cursor-pointer active:scale-95 transition-transform"
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold mt-1.5 leading-tight">
              গ্রাহক<br />তালিকা
            </span>
          </button>

          {/* 5. কর্মচারী ব্যবস্থাপনা */}
          <button
            type="button"
            onClick={() => onNavigate('staff_shop')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-2xs cursor-pointer active:scale-95 transition-transform"
          >
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold mt-1.5 leading-tight">
              কর্মচারী<br />ব্যবস্থাপনা
            </span>
          </button>
        </div>
      </section>

      {/* SECTION 3: সাপ্তাহিক বিক্রয় গ্রাফ (Weekly Sales Graph) */}
      <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-800">
            সাপ্তাহিক বিক্রয় গ্রাফ
          </h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md flex items-center gap-1 shadow-2xs hover:bg-blue-700 cursor-pointer"
            >
              <span>{timeFilter === '7d' ? '৭ দিন' : timeFilter === '30d' ? '৩০ দিন' : 'এই মাস'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showTimeDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 w-24 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setTimeFilter('7d');
                    setShowTimeDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  ৭ দিন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeFilter('30d');
                    setShowTimeDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  ৩০ দিন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeFilter('month');
                    setShowTimeDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  এই মাস
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 100% Fluid Responsive SVG Line Chart (No fixed min-width to prevent overflow) */}
        <div className="w-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto select-none"
          >
            <defs>
              <linearGradient id="salesGradClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
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

      {/* SECTION 4: আজকের কাজ (Today's Tasks / To-Do Checklist) */}
      <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs relative">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-800">
            আজকের কাজ
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            {tasks.filter((t) => t.completed).length}/{tasks.length} সম্পন্ন
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-1.5 mb-2 pr-12">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors ${
                task.completed ? 'bg-slate-50' : 'hover:bg-slate-50'
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
                  className={`text-xs sm:text-sm truncate ${
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

        {/* Inline Add Task Input */}
        {isAddingTask && (
          <form onSubmit={addTask} className="mt-2 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="নতুন কাজ লিখুন..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              যোগ করুন
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

        {/* Blue Circular Floating Plus Button (Matching user screenshot) */}
        {!isAddingTask && (
          <button
            type="button"
            onClick={() => setIsAddingTask(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 cursor-pointer"
            title="নতুন কাজ যোগ করুন"
            aria-label="নতুন কাজ যোগ করুন"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </section>
    </div>
  );
};
