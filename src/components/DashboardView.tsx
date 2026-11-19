import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Search,
  ClipboardList,
  X,
  Camera,
  Bell,
  Package,
  PackagePlus,
  ShoppingCart,
  ArrowRight,
  Megaphone,
  Trash2,
  Check,
  Send,
  Eye,
  Sparkles,
  Plus,
  Clock,
  Receipt,
  CalendarClock,
} from 'lucide-react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import {
  db,
  fireAndRaceFirestoreWrite,
  fireAndRaceFirestoreWrites,
  OperationType,
} from '../firebase';
import {
  DEFAULT_CHAMBER_NOTICES,
  getTodayDateStr,
} from '../data/demoSeedData';
import { parseTransactionItemsDetailed } from '../data/bdMedicines';
import { isDueEntryItem } from '../utils/whatsappShare';
import {
  Customer,
  InventoryItem,
  MedicineCatalogItem,
  CartItem,
  PurchaseCartItem,
  ShopProfile,
  ShopNotice,
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
  onNavigate: (section: any, subTab?: string, scrollTargetId?: string) => void;
  onOpenScanner?: () => void;
  onUpdateNotice?: (notice: ShopNotice | null) => Promise<void> | void;
  onQuickRestock?: (item: InventoryItem, addQty: number) => Promise<void>;
}

export const toBengaliDigits = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/\d/g, (d) => bnDigits[parseInt(d, 10)] ?? d);
};

export const formatBengaliCurrency = (num: number): string => {
  const rounded = Math.round(num);
  const absFormatted = Math.abs(rounded).toLocaleString('en-IN');
  const sign = rounded < 0 ? '-' : '';
  return `${sign}৳${toBengaliDigits(absFormatted)}`;
};

const getDaysUntilExpiry = (expDate?: string): number | null => {
  if (!expDate || !expDate.trim()) return null;
  const trimmed = expDate.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let expMs: number;
  if (match) {
    expMs = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    ).getTime();
  } else {
    expMs = new Date(trimmed).getTime();
  }
  if (Number.isNaN(expMs)) return null;
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  return Math.ceil((expMs - todayStart) / (1000 * 60 * 60 * 24));
};

const formatLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const BN_WEEKDAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

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
  catalog,
  posCart,
  shopProfile,
  onNavigate,
  onOpenScanner,
  onUpdateNotice,
  onQuickRestock,
}) => {
  // Live Scrolling Notice State
  const [noticeText, setNoticeText] = useState(shopProfile?.notice?.text || '');
  const [noticeActive, setNoticeActive] = useState<boolean>(
    shopProfile?.notice?.isActive !== false
  );
  const [savingNotice, setSavingNotice] = useState(false);
  const [noticeFeedback, setNoticeFeedback] = useState<string | null>(null);
  const [showNoticeManager, setShowNoticeManager] = useState(false);

  // Sync notice with Firestore live announcement document
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'shop_notices', 'live_announcement'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as ShopNotice;
            setNoticeText(data.text || '');
            setNoticeActive(data.isActive !== false);
          } else if (shopProfile?.notice) {
            setNoticeText(shopProfile.notice.text || '');
            setNoticeActive(shopProfile.notice.isActive !== false);
          }
        },
        () => {
          if (shopProfile?.notice) {
            setNoticeText(shopProfile.notice.text || '');
            setNoticeActive(shopProfile.notice.isActive !== false);
          }
        }
      );
      return () => unsub();
    } catch {
      // ignore
    }
  }, [shopProfile?.notice]);

  const handleSaveNotice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noticeText.trim()) {
      setNoticeFeedback('দয়া করে নোটিশের লেখা লিখুন!');
      setTimeout(() => setNoticeFeedback(null), 3000);
      return;
    }
    setSavingNotice(true);
    const updatedNotice: ShopNotice = {
      text: noticeText.trim(),
      isActive: noticeActive,
      updatedAtMs: Date.now(),
      updatedBy: 'Admin',
    };
    try {
      await Promise.all([
        fireAndRaceFirestoreWrite(
          setDoc(doc(db, 'shop_notices', 'live_announcement'), updatedNotice),
          OperationType.WRITE,
          'shop_notices/live_announcement'
        ),
        onUpdateNotice
          ? Promise.resolve(onUpdateNotice(updatedNotice))
          : Promise.resolve(),
      ]);
      setNoticeFeedback(
        noticeActive
          ? 'নোটিশটি সফলভাবে সংরক্ষিত ও ওয়েবসাইটে লাইভ প্রকাশ করা হয়েছে!'
          : 'নোটিশ সংরক্ষিত হয়েছে (বর্তমানে প্রদর্শনী বন্ধ রাখা হয়েছে)'
      );
    } catch {
      if (onUpdateNotice) {
        await Promise.resolve(onUpdateNotice(updatedNotice)).catch(() => {});
      }
      setNoticeFeedback('নোটিশ সংরক্ষিত হয়েছে!');
    } finally {
      setSavingNotice(false);
      setTimeout(() => setNoticeFeedback(null), 4000);
    }
  };

  const handleDirectPublishPreset = async (presetText: string) => {
    setNoticeText(presetText);
    setNoticeActive(true);
    setSavingNotice(true);
    const updatedNotice: ShopNotice = {
      text: presetText.trim(),
      isActive: true,
      updatedAtMs: Date.now(),
      updatedBy: 'Admin (Default List)',
    };
    try {
      await Promise.all([
        fireAndRaceFirestoreWrite(
          setDoc(doc(db, 'shop_notices', 'live_announcement'), updatedNotice),
          OperationType.WRITE,
          'shop_notices/live_announcement'
        ),
        onUpdateNotice
          ? Promise.resolve(onUpdateNotice(updatedNotice))
          : Promise.resolve(),
      ]);
      setNoticeFeedback(
        'নির্বাচিত নোটিশটি তাৎক্ষণিকভাবে ওয়েবসাইটে প্রকাশ ও চালু করা হয়েছে!'
      );
    } catch {
      if (onUpdateNotice) {
        await Promise.resolve(onUpdateNotice(updatedNotice)).catch(() => {});
      }
      setNoticeFeedback('নোটিশটি চালু করা হয়েছে!');
    } finally {
      setSavingNotice(false);
      setTimeout(() => setNoticeFeedback(null), 4000);
    }
  };

  const handleDeleteNotice = async () => {
    setSavingNotice(true);
    const emptyNotice: ShopNotice = {
      text: '',
      isActive: false,
      updatedAtMs: Date.now(),
      updatedBy: 'Admin',
    };
    try {
      await Promise.all([
        fireAndRaceFirestoreWrites([
          {
            promise: setDoc(
              doc(db, 'shop_notices', 'live_announcement'),
              emptyNotice
            ),
            operationType: OperationType.WRITE,
            path: 'shop_notices/live_announcement',
          },
          {
            promise: deleteDoc(doc(db, 'shop_notices', 'live_announcement')),
            operationType: OperationType.DELETE,
            path: 'shop_notices/live_announcement',
          },
        ]),
        onUpdateNotice ? Promise.resolve(onUpdateNotice(null)) : Promise.resolve(),
      ]);
      setNoticeText('');
      setNoticeActive(false);
      setNoticeFeedback(
        'নোটিশটি বাদ দেওয়া হয়েছে! ওয়েবসাইটে এখন আর নোটিশ দেখাবে না।'
      );
    } catch {
      if (onUpdateNotice) {
        await Promise.resolve(onUpdateNotice(null)).catch(() => {});
      }
      setNoticeText('');
      setNoticeActive(false);
      setNoticeFeedback('নোটিশ বাদ দেওয়া হয়েছে');
    } finally {
      setSavingNotice(false);
      setTimeout(() => setNoticeFeedback(null), 4000);
    }
  };

  // Chart & Tasks state
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'month'>('7d');
  const [showTasks, setShowTasks] = useState(false);

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

  // Modals & UI section toggles
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [lowStockFilter, setLowStockFilter] = useState<'all' | 'zero'>('all');
  const [lowStockSearch, setLowStockSearch] = useState('');
  const [restockingItemId, setRestockingItemId] = useState<string | null>(null);
  const [expandedRestockRowId, setExpandedRestockRowId] = useState<string | null>(
    null
  );
  const [showAllLowStockWidget, setShowAllLowStockWidget] = useState(false);
  const [showAllExpiringWidget, setShowAllExpiringWidget] = useState(false);
  const [customRestockQtyMap, setCustomRestockQtyMap] = useState<
    Record<string, string>
  >({});

  const todayStr = getTodayDateStr();

  // Real Today's KPI Metrics (Sales, Profit, Total Customer Due)
  const { todaySales, todayProfit, todayInvoicesCount, totalCustomerDue } =
    useMemo(() => {
      const invByMedId = new Map<string, InventoryItem>();
      const invByKey = new Map<string, InventoryItem>();
      for (const inv of inventory) {
        if (inv.medicineId && !invByMedId.has(inv.medicineId)) {
          invByMedId.set(inv.medicineId, inv);
        }
        const k = `${(inv.brandName || '').trim().toLowerCase()}__${(
          inv.strength || ''
        )
          .trim()
          .toLowerCase()}`;
        if (!invByKey.has(k)) invByKey.set(k, inv);
      }

      const computeSalePurchaseCost = (tx: Transaction): number => {
        if (
          typeof tx.totalPurchaseCost === 'number' &&
          Number.isFinite(tx.totalPurchaseCost) &&
          tx.totalPurchaseCost >= 0
        ) {
          return tx.totalPurchaseCost;
        }
        const parsed = parseTransactionItemsDetailed(
          tx.itemsSummary || '',
          catalog
        );
        if (parsed.length === 0) {
          return Number(
            (
              Math.max(
                0,
                (tx.grandTotal || 0) - (tx.reconciledDueAmount || 0)
              ) * 0.88
            ).toFixed(2)
          );
        }
        let costSum = 0;
        for (const line of parsed) {
          if (
            line.formPrefix === 'due' ||
            isDueEntryItem({
              brandName: line.cleanName || line.brandAndStrength,
              formPrefix: line.formPrefix,
            })
          ) {
            continue;
          }
          const matched = line.matchedMedicine;
          const cleanLower = (matched?.brandName || line.cleanName || '')
            .trim()
            .toLowerCase();
          const strLower = (matched?.strength || '').trim().toLowerCase();
          const invHit =
            (matched?.id ? invByMedId.get(matched.id) : undefined) ||
            invByKey.get(`${cleanLower}__${strLower}`) ||
            inventory.find(
              (i) => (i.brandName || '').trim().toLowerCase() === cleanLower
            );

          const unitCost =
            invHit && invHit.purchasePrice > 0
              ? invHit.purchasePrice
              : matched?.purchasePrice && matched.purchasePrice > 0
              ? matched.purchasePrice
              : Number(((line.unitPrice || 0) * 0.88).toFixed(2));
          costSum += unitCost * (line.qty || 1);
        }
        return Number(costSum.toFixed(2));
      };

      let salesRev = 0;
      let salesReconciled = 0;
      let salesCost = 0;
      let invoicesCount = 0;

      for (const tx of transactions) {
        if (tx.txType === 'sale' && tx.dateStr?.startsWith(todayStr)) {
          salesRev += tx.grandTotal || 0;
          salesReconciled += tx.reconciledDueAmount || 0;
          salesCost += computeSalePurchaseCost(tx);
          invoicesCount++;
        }
      }

      const profit = Number(
        (salesRev - salesReconciled - salesCost).toFixed(2)
      );
      const dueSum = customers.reduce(
        (sum, c) => sum + Math.max(0, c.totalDue || 0),
        0
      );

      return {
        todaySales: salesRev,
        todayProfit: profit,
        todayInvoicesCount: invoicesCount,
        totalCustomerDue: dueSum,
      };
    }, [transactions, inventory, customers, catalog, todayStr]);

  // Real Low / Out-of-Stock Inventory Items (no fake fallback items)
  const belowMinStockItems = useMemo(() => {
    return inventory
      .filter((item) => (item.stockQty ?? 0) < (item.minStockLevel ?? 10))
      .sort((a, b) => {
        const aZero = (a.stockQty ?? 0) <= 0 ? -1 : 0;
        const bZero = (b.stockQty ?? 0) <= 0 ? -1 : 0;
        if (aZero !== bZero) return aZero - bZero;
        return (a.stockQty ?? 0) - (b.stockQty ?? 0);
      });
  }, [inventory]);

  const lowStockCount = belowMinStockItems.length;
  const zeroStockCount = useMemo(
    () => belowMinStockItems.filter((item) => (item.stockQty ?? 0) <= 0).length,
    [belowMinStockItems]
  );

  // Real Expiring Soon Inventory Items (within 90 days or already expired)
  const expiringSoonItems = useMemo(() => {
    return inventory
      .map((item) => ({
        item,
        daysLeft: getDaysUntilExpiry(item.expiryDate),
      }))
      .filter(
        (entry): entry is { item: InventoryItem; daysLeft: number } =>
          entry.daysLeft !== null && entry.daysLeft <= 90
      )
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [inventory]);

  // Real Recent Sale Transactions (newest first, up to 6)
  const recentSales = useMemo(() => {
    return [...transactions]
      .filter((t) => t.txType === 'sale')
      .sort((a, b) => {
        const tA = a.timestamp || a.updatedAtMs || 0;
        const tB = b.timestamp || b.updatedAtMs || 0;
        if (tA !== tB) return tB - tA;
        return (b.dateStr || '').localeCompare(a.dateStr || '');
      })
      .slice(0, 6);
  }, [transactions]);

  const getDefaultRestockQty = (item: InventoryItem): number => {
    const minLvl = item.minStockLevel ?? 10;
    return Math.max(50, minLvl * 2 - (item.stockQty ?? 0));
  };

  const handleWidgetQuickRestock = async (item: InventoryItem) => {
    if (!onQuickRestock) {
      onNavigate('inventory');
      return;
    }
    const rawVal = customRestockQtyMap[item.id];
    const parsedVal =
      rawVal !== undefined
        ? Math.floor(Number(rawVal))
        : getDefaultRestockQty(item);
    if (!Number.isFinite(parsedVal) || parsedVal <= 0) return;

    setRestockingItemId(item.id);
    try {
      await onQuickRestock(item, parsedVal);
      setCustomRestockQtyMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setExpandedRestockRowId(null);
    } finally {
      setRestockingItemId(null);
    }
  };

  // Real Aggregated Sales Trend Chart Data (computed live from transactions)
  const chartSeries = useMemo(() => {
    const dailyTotals = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.txType === 'sale' && tx.dateStr) {
        const key = tx.dateStr.slice(0, 10);
        dailyTotals.set(key, (dailyTotals.get(key) || 0) + (tx.grandTotal || 0));
      }
    }

    const now = new Date();
    const result: { label: string; val: number }[] = [];

    if (timeFilter === '7d') {
      for (let offset = 6; offset >= 0; offset--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
        const key = formatLocalDateStr(d);
        result.push({
          label: BN_WEEKDAYS_SHORT[d.getDay()] || '',
          val: Math.round(dailyTotals.get(key) || 0),
        });
      }
    } else if (timeFilter === '30d') {
      // 6 buckets of 5 days each covering last 30 days
      for (let bucket = 5; bucket >= 0; bucket--) {
        const startOffset = bucket * 5 + 4;
        const endOffset = bucket * 5;
        let sum = 0;
        for (let off = startOffset; off >= endOffset; off--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - off);
          sum += dailyTotals.get(formatLocalDateStr(d)) || 0;
        }
        const endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - endOffset
        );
        result.push({
          label: `${toBengaliDigits(endDate.getDate())}/${toBengaliDigits(
            endDate.getMonth() + 1
          )}`,
          val: Math.round(sum),
        });
      }
    } else {
      // Current month in 4 weeks
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const ranges = [
        { label: 'সপ্তাহ ১', start: 1, end: 7 },
        { label: 'সপ্তাহ ২', start: 8, end: 14 },
        { label: 'সপ্তাহ ৩', start: 15, end: 21 },
        { label: 'সপ্তাহ ৪', start: 22, end: daysInMonth },
      ];
      for (const r of ranges) {
        let sum = 0;
        for (let day = r.start; day <= r.end; day++) {
          const key = formatLocalDateStr(new Date(year, month, day));
          sum += dailyTotals.get(key) || 0;
        }
        result.push({ label: r.label, val: Math.round(sum) });
      }
    }

    return result;
  }, [transactions, timeFilter]);

  const chartHeight = 156;
  const chartWidth = 480;
  const paddingLeft = 54;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 26;

  const rawMax = Math.max(0, ...chartSeries.map((d) => d.val));
  const maxVal = useMemo(() => {
    if (rawMax <= 0) return 4000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
    return Math.ceil((rawMax * 1.15) / magnitude) * magnitude;
  }, [rawMax]);

  const points = chartSeries.map((d, i) => {
    const divisor = Math.max(1, chartSeries.length - 1);
    const x =
      paddingLeft + (i * (chartWidth - paddingLeft - paddingRight)) / divisor;
    const y =
      paddingTop +
      (1 - d.val / maxVal) * (chartHeight - paddingTop - paddingBottom);
    return { x, y, ...d };
  });

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

  const formattedBanglaToday = useMemo(() => {
    try {
      return new Date().toLocaleDateString('bn-BD', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return todayStr;
    }
  }, [todayStr]);

  const displayedLowStock = showAllLowStockWidget
    ? belowMinStockItems
    : belowMinStockItems.slice(0, 5);
  const displayedExpiring = showAllExpiringWidget
    ? expiringSoonItems
    : expiringSoonItems.slice(0, 5);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-4">
      {/* Compact Brand Header & Date */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Plus className="w-5 h-5 stroke-[2.75]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
              {shopProfile?.shopName || 'ইকবাল ফার্মেসী'}
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate sm:hidden">
              {formattedBanglaToday}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl whitespace-nowrap">
            {formattedBanglaToday}
          </span>

          <button
            type="button"
            onClick={() => setIsLowStockModalOpen(true)}
            className="relative min-h-[42px] min-w-[42px] px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors cursor-pointer flex items-center justify-center"
            title={`${toBengaliDigits(lowStockCount)}টি ওষুধের স্টক কম বা শেষ`}
            aria-label="স্টক সতর্কতা নোটিফিকেশন"
          >
            <Bell className="w-4.5 h-4.5" />
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono tabular-nums font-bold leading-none">
                {toBengaliDigits(lowStockCount)}
              </span>
            )}
          </button>

          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="min-h-[42px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap shrink-0"
              title="ওষুধের বক্স স্ক্যান করুন"
            >
              <Camera className="w-4 h-4 text-teal-700" />
              <span className="hidden sm:inline">বক্স স্ক্যান</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Tile Quick Action Bar (নতুন বিক্রি, ওষুধ খুঁজুন, স্টক যোগ) */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        <button
          type="button"
          onClick={() => onNavigate('pos_accounts', 'sale_pos')}
          className="min-h-[76px] sm:min-h-[82px] p-3 sm:p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            {posCart.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-mono tabular-nums font-extrabold leading-tight">
                {toBengaliDigits(posCart.length)}
              </span>
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            নতুন বিক্রি
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('compare')}
          className="min-h-[76px] sm:min-h-[82px] p-3 sm:p-4 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
        >
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            ওষুধ খুঁজুন
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('inventory')}
          className="min-h-[76px] sm:min-h-[82px] p-3 sm:p-4 rounded-2xl bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200 text-teal-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
        >
          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-teal-700" />
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            স্টক যোগ
          </span>
        </button>
      </section>

      {/* SECTION: আজকের হিসাব (4-Tile KPI Grid) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            আজকের হিসাব
          </h2>
          <button
            type="button"
            onClick={() =>
              onNavigate('pos_accounts', 'sale_pos', 'daily-accounts-ledger')
            }
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>বিস্তারিত হিসাব</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* 1. আজকের বিক্রি (Primary Highlighted Card) */}
          <button
            type="button"
            onClick={() =>
              onNavigate('pos_accounts', 'sale_pos', 'daily-accounts-ledger')
            }
            className="text-left rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white p-3.5 sm:p-4 border border-emerald-800 shadow-xs flex flex-col justify-between gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-semibold text-emerald-50">
                আজকের বিক্রি
              </span>
              <span className="text-[11px] font-mono tabular-nums text-emerald-100 bg-emerald-800/70 px-2 py-0.5 rounded-lg">
                {toBengaliDigits(todayInvoicesCount)} বিল
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight">
              {formatBengaliCurrency(todaySales)}
            </div>
          </button>

          {/* 2. আজকের মুনাফা */}
          <button
            type="button"
            onClick={() =>
              onNavigate('pos_accounts', 'sale_pos', 'daily-accounts-ledger')
            }
            className="text-left rounded-2xl bg-white hover:bg-slate-50 p-3.5 sm:p-4 border border-slate-200 flex flex-col justify-between gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                আজকের মুনাফা
              </span>
              <TrendingUp
                className={`w-4 h-4 shrink-0 ${
                  todayProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              />
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight ${
                todayProfit < 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {formatBengaliCurrency(todayProfit)}
            </div>
          </button>

          {/* 3. মোট বাকি */}
          <button
            type="button"
            onClick={() => onNavigate('customer_ledger')}
            className="text-left rounded-2xl bg-white hover:bg-slate-50 p-3.5 sm:p-4 border border-slate-200 flex flex-col justify-between gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                মোট বাকি
              </span>
              <span className="text-[11px] font-semibold text-teal-700">
                খাতা →
              </span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight ${
                totalCustomerDue > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {formatBengaliCurrency(totalCustomerDue)}
            </div>
          </button>

          {/* 4. কম বা শেষ স্টক */}
          <button
            type="button"
            onClick={() => setIsLowStockModalOpen(true)}
            className={`text-left rounded-2xl p-3.5 sm:p-4 border flex flex-col justify-between gap-2 transition-all active:scale-[0.99] cursor-pointer ${
              lowStockCount > 0
                ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                কম বা শেষ স্টক
              </span>
              <AlertTriangle
                className={`w-4 h-4 shrink-0 ${
                  lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}
              />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900">
              {toBengaliDigits(lowStockCount)} টি
            </div>
          </button>
        </div>
      </section>

      {/* Main Operational Workspace: Low Stock + Expiring Soon (Left) | Recent Sales (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-5">
          {/* SECTION: কম স্টক (আগে এগুলো কিনুন) */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                কম স্টক
              </h2>
              <span className="text-xs font-medium text-slate-500">
                আগে এগুলো কিনুন
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {belowMinStockItems.length === 0 ? (
                <div className="p-6 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    সব ওষুধের স্টক পর্যাপ্ত রয়েছে
                  </p>
                  <p className="text-xs text-slate-500">
                    কোনো ওষুধ নির্ধারিত ন্যূনতম সীমার নিচে নেই।
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {displayedLowStock.map((med) => {
                      const curStock = med.stockQty ?? 0;
                      const isZero = curStock <= 0;
                      const isExpanded = expandedRestockRowId === med.id;
                      const defaultRestockAmount = getDefaultRestockQty(med);
                      const customQtyStr =
                        customRestockQtyMap[med.id] !== undefined
                          ? customRestockQtyMap[med.id]
                          : String(defaultRestockAmount);
                      const parsedCustomQty = Math.floor(Number(customQtyStr));
                      const isValidCustomQty =
                        Number.isFinite(parsedCustomQty) && parsedCustomQty > 0;
                      const isRestocking = restockingItemId === med.id;

                      return (
                        <div
                          key={med.id}
                          className="p-3.5 sm:px-4 sm:py-3.5 transition-colors hover:bg-slate-50/70"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                  {med.brandName}
                                </span>
                                {med.strength && (
                                  <span className="text-xs font-medium text-slate-500">
                                    {med.strength}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono tabular-nums ${
                                    isZero
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {isZero
                                    ? 'স্টক নেই'
                                    : `কম স্টক · ${toBengaliDigits(curStock)}`}
                                </span>
                                {med.shelfLocation && (
                                  <span className="text-[11px] text-slate-400">
                                    র‍্যাক: {med.shelfLocation}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRestockRowId(
                                  isExpanded ? null : med.id
                                )
                              }
                              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 border ${
                                isExpanded
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isExpanded ? 'বন্ধ' : 'স্টক যোগ'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs text-slate-500 font-mono tabular-nums">
                                ন্যূনতম সীমা:{' '}
                                {toBengaliDigits(med.minStockLevel ?? 10)} পিস
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center rounded-xl border border-emerald-400 bg-white overflow-hidden">
                                  <span className="pl-2.5 pr-1 text-xs font-bold text-emerald-700 select-none">
                                    +
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    autoFocus
                                    value={customQtyStr}
                                    onChange={(e) =>
                                      setCustomRestockQtyMap((prev) => ({
                                        ...prev,
                                        [med.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (isValidCustomQty) {
                                          handleWidgetQuickRestock(med);
                                        }
                                      }
                                    }}
                                    aria-label="স্টক যোগ সংখ্যা"
                                    className="w-16 py-1.5 pr-1 text-xs font-mono tabular-nums font-bold text-slate-900 bg-transparent focus:outline-none text-center"
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={isRestocking || !isValidCustomQty}
                                  onClick={() => handleWidgetQuickRestock(med)}
                                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                  <span>
                                    {isRestocking ? 'যোগ হচ্ছে...' : 'নিশ্চিত'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {belowMinStockItems.length > 5 && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowAllLowStockWidget((p) => !p)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        {showAllLowStockWidget
                          ? 'সংক্ষেপ করুন ▲'
                          : `আরও দেখুন (${toBengaliDigits(
                              belowMinStockItems.length - 5
                            )} টি বাকি) ▼`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsLowStockModalOpen(true)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        সম্পূর্ণ তালিকা →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* SECTION: মেয়াদ কাছাকাছি (NEW FEATURE) */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  মেয়াদ কাছাকাছি
                </h2>
                {expiringSoonItems.length > 0 && (
                  <span className="text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    {toBengaliDigits(expiringSoonItems.length)} টি
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer whitespace-nowrap"
              >
                স্টক দেখুন →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {expiringSoonItems.length === 0 ? (
                <div className="p-6 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    কোনো ওষুধের মেয়াদ কাছাকাছি নেই
                  </p>
                  <p className="text-xs text-slate-500">
                    আগামী ৯০ দিনের মধ্যে মেয়াদোত্তীর্ণ হওয়ার মতো কোনো স্টক পাওয়া যায়নি।
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {displayedExpiring.map(({ item: med, daysLeft }) => {
                      const isExpired = daysLeft < 0;
                      const isCritical = daysLeft <= 30;
                      const badgeText = isExpired
                        ? `মেয়াদোত্তীর্ণ (${toBengaliDigits(
                            Math.abs(daysLeft)
                          )} দিন)`
                        : daysLeft === 0
                        ? 'আজই মেয়াদ শেষ'
                        : `মেয়াদ ${toBengaliDigits(daysLeft)} দিন`;

                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => onNavigate('inventory')}
                          className="w-full text-left p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                {med.brandName}
                              </span>
                              {med.strength && (
                                <span className="text-xs font-medium text-slate-500">
                                  {med.strength}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                              {med.batchNo ? `ব্যাচ: ${med.batchNo} · ` : ''}
                              মজুদ: {toBengaliDigits(med.stockQty ?? 0)} পিস
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold font-mono tabular-nums whitespace-nowrap shrink-0 border ${
                              isExpired || isCritical
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {badgeText}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {expiringSoonItems.length > 5 && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAllExpiringWidget((p) => !p)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        {showAllExpiringWidget
                          ? 'সংক্ষেপ করুন ▲'
                          : `সব মেয়াদ তালিকা দেখুন (${toBengaliDigits(
                              expiringSoonItems.length
                            )}) ▼`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: সাম্প্রতিক বিক্রি (NEW FEATURE) */}
        <section className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              সাম্প্রতিক বিক্রি
            </h2>
            {recentSales.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onNavigate('pos_accounts', 'sale_pos', 'daily-accounts-ledger')
                }
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer whitespace-nowrap"
              >
                সকল মেমো →
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {recentSales.length === 0 ? (
              <div className="p-8 sm:p-10 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">
                    এখনো কোনো বিক্রি হয়নি
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    নতুন বিক্রি বোতামে চাপ দিয়ে শুরু করুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('pos_accounts', 'sale_pos')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>নতুন বিক্রি শুরু করুন</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSales.map((tx) => {
                  const hasDue = (tx.dueAmount || 0) > 0;
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() =>
                        onNavigate(
                          'pos_accounts',
                          'sale_pos',
                          'daily-accounts-ledger'
                        )
                      }
                      className="w-full text-left p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {tx.partyName || 'সাধারণ ক্রেতা'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums truncate flex items-center gap-1.5">
                            <span>{tx.invoiceNo}</span>
                            <span>·</span>
                            <span>{tx.dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-slate-900 font-mono tabular-nums">
                          {formatBengaliCurrency(tx.grandTotal || 0)}
                        </div>
                        <div
                          className={`text-[11px] font-bold font-mono tabular-nums ${
                            hasDue ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {hasDue
                            ? `বাকি ${formatBengaliCurrency(tx.dueAmount)}`
                            : 'পরিশোধিত'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* SECTION: বিক্রয় গতিধারা (Live Data Chart) + আজকের কাজ (To-Do) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                বিক্রয় গতিধারা ও পারফরম্যান্স
              </h2>
              <p className="text-xs text-slate-500">
                প্রকৃত বিক্রয় চালানের ভিত্তিতে দৈনিক আয়ের হিসাব
              </p>
            </div>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 select-none self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeFilter === '7d'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ৭ দিন
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('30d')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeFilter === '30d'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ৩০ দিন
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('month')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeFilter === 'month'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                এই মাস
              </button>
            </div>
          </div>

          <div className="w-full pt-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto select-none"
            >
              <defs>
                <linearGradient id="salesGradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                const val = Math.round(maxVal * ratio);
                const y =
                  paddingTop +
                  (1 - ratio) * (chartHeight - paddingTop - paddingBottom);
                return (
                  <g key={ratio}>
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
                      {val === 0
                        ? '৳০'
                        : `৳${toBengaliDigits(val.toLocaleString('en-IN'))}`}
                    </text>
                  </g>
                );
              })}

              {areaD && <path d={areaD} fill="url(#salesGradEmerald)" />}

              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((pt, i) => (
                <g key={i} className="cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <title>{`${pt.label}: ৳${pt.val.toLocaleString('en-IN')}`}</title>
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

        {/* SECTION: আজকের কাজ (To-Do) */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  আজকের কাজ
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono tabular-nums font-semibold">
                  {toBengaliDigits(tasks.filter((t) => t.completed).length)}/
                  {toBengaliDigits(tasks.length)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTasks(!showTasks)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                {showTasks ? 'সংক্ষেপ ▲' : 'তালিকা খুলুন ▼'}
              </button>
            </div>

            {showTasks ? (
              <div className="space-y-1.5 mb-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      task.completed
                        ? 'bg-slate-50'
                        : 'hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {toBengaliDigits(
                      tasks.filter((t) => !t.completed).length
                    )}{' '}
                    টি কাজ বাকি রয়েছে
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  প্রয়োজন অনুযায়ী &apos;তালিকা খুলুন&apos; বোতামে চেপে দৈনন্দিন কাজের তালিকা দেখুন।
                </p>
              </div>
            )}

            {isAddingTask && (
              <form
                onSubmit={addTask}
                className="mt-2 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  autoFocus
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="নতুন কাজ লিখুন..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer"
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

          {!isAddingTask && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowTasks(true);
                  setIsAddingTask(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন কাজ যোগ করুন</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* SECTION: লাইভ স্ক্রলিং নোটিশ বোর্ড (Compact Accordion - Collapsed by Default) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Megaphone className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  লাইভ স্ক্রলিং নোটিশ বোর্ড
                </h2>
                {noticeActive && noticeText.trim() ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    সচল
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    বন্ধ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {noticeActive && noticeText.trim()
                  ? noticeText
                  : 'ওয়েবসাইটের হেডিংয়ে জরুরি চেম্বার নোটিশ পরিচালনা করুন'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNoticeManager(!showNoticeManager)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            {showNoticeManager ? 'বন্ধ করুন ▲' : 'নোটিশ পরিচালনা ▼'}
          </button>
        </div>

        {noticeFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeFeedback}</span>
          </div>
        )}

        {showNoticeManager && (
          <form
            onSubmit={handleSaveNotice}
            className="mt-4 pt-4 border-t border-slate-100 space-y-3.5"
          >
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>ডিফল্ট চেম্বার নোটিশ তালিকা (১ ক্লিকে বাছাই):</span>
                </label>
                <span className="text-[11px] text-amber-900 font-semibold bg-amber-200/70 px-2 py-0.5 rounded-full border border-amber-300">
                  ১-৫ তালিকা
                </span>
              </div>
              <select
                onChange={(e) => {
                  const selected = DEFAULT_CHAMBER_NOTICES.find(
                    (n) => n.id === e.target.value
                  );
                  if (selected) {
                    setNoticeText(selected.text);
                    setNoticeActive(true);
                  }
                }}
                defaultValue=""
                className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="" disabled>
                  -- ড্রপডাউন থেকে চেম্বার নোটিশ বেছে নিন --
                </option>
                {DEFAULT_CHAMBER_NOTICES.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.num}/ {preset.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  নোটিশের মূল বার্তা / ঘোষণা:
                </label>
                {noticeText.includes('"তারিখ"') && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 2);
                      const dateBn = d.toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'long',
                      });
                      setNoticeText((prev) => prev.replace('"তারিখ"', dateBn));
                    }}
                    className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    + নির্দিষ্ট তারিখ বসান
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                placeholder="চেম্বার নোটিশ লিখুন বা নিচের তালিকা থেকে সিলেক্ট করুন..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50/50 leading-relaxed font-sans text-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_CHAMBER_NOTICES.map((preset) => {
                const isCurrentActive =
                  noticeActive && noticeText.trim() === preset.text.trim();
                return (
                  <div
                    key={preset.id}
                    className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                      isCurrentActive
                        ? 'bg-amber-50/90 border-amber-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                          {preset.num}/
                        </span>
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}
                        >
                          {preset.badge}
                        </span>
                        {isCurrentActive && (
                          <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            ✓ লাইভ চালু আছে
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed text-xs">
                        {preset.text}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setNoticeText(preset.text);
                          setNoticeActive(true);
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        এডিটরে বসান
                      </button>
                      <button
                        type="button"
                        disabled={savingNotice}
                        onClick={() => handleDirectPublishPreset(preset.text)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                          isCurrentActive
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>
                          {isCurrentActive ? 'পুনরায় প্রকাশ' : '১ ক্লিকে প্রকাশ'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noticeActive}
                  onChange={(e) => setNoticeActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  ওয়েবসাইটে ১ লাইনে স্ক্রলিং প্রদর্শন সক্রিয় রাখুন
                </span>
              </label>

              <div className="flex items-center gap-2">
                {noticeText.trim() && (
                  <button
                    type="button"
                    onClick={handleDeleteNotice}
                    disabled={savingNotice}
                    className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছুন</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingNotice}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {savingNotice
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'নোটিশ সংরক্ষণ ও প্রকাশ'}
                  </span>
                </button>
              </div>
            </div>

            {noticeText.trim() && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    <span>লাইভ প্রিভিউ:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {noticeActive ? 'স্ক্রলিং সচল' : 'প্রদর্শন বন্ধ রাখা হয়েছে'}
                  </span>
                </div>
                <div className="bg-amber-400 text-slate-950 border border-amber-500 rounded-xl py-2 px-3 overflow-hidden select-none">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 flex items-center gap-1 bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold">
                      <Bell className="w-3 h-3 text-amber-300" />
                      <span>জরুরী নোটিশ</span>
                    </div>
                    <div className="overflow-hidden flex-1 relative whitespace-nowrap">
                      <div className="animate-marquee-rtl font-bold text-xs sm:text-sm text-slate-950 inline-block">
                        {noticeText}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </section>

      {/* Low Stock Notifications Center Modal */}
      {isLowStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-view-enter">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-amber-50/70 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    স্বল্প ও শূন্য স্টক সতর্কতা তালিকা
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    যেসব ওষুধের মজুদ নির্ধারিত ন্যূনতম সীমার নিচে বা শেষ হয়ে গেছে
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLowStockModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={lowStockSearch}
                  onChange={(e) => setLowStockSearch(e.target.value)}
                  placeholder="ওষুধ বা জেনেরিক নাম দিয়ে ফিল্টার করুন..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {lowStockSearch && (
                  <button
                    type="button"
                    onClick={() => setLowStockSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setLowStockFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    lowStockFilter === 'all'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  সকল স্বল্প স্টক ({toBengaliDigits(lowStockCount)})
                </button>
                <button
                  type="button"
                  onClick={() => setLowStockFilter('zero')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    lowStockFilter === 'zero'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  স্টক নেই ({toBengaliDigits(zeroStockCount)})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(() => {
                const filtered = belowMinStockItems.filter((item) => {
                  if (lowStockFilter === 'zero' && (item.stockQty ?? 0) > 0)
                    return false;
                  if (lowStockSearch) {
                    const q = lowStockSearch.toLowerCase();
                    const b = (item.brandName || '').toLowerCase();
                    const g = (item.genericName || '').toLowerCase();
                    const c = (item.companyName || '').toLowerCase();
                    return b.includes(q) || g.includes(q) || c.includes(q);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-10 text-center text-slate-500 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-800">
                        কোনো কম স্টকের ওষুধ নেই
                      </p>
                      <p className="text-xs text-slate-500">
                        সকল ফিল্টারকৃত ওষুধের মজুদ পর্যাপ্ত রয়েছে।
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((med) => {
                      const curStock = med.stockQty ?? 0;
                      const minLvl = med.minStockLevel || 10;
                      const isZero = curStock <= 0;
                      const shortage = Math.max(0, minLvl - curStock);
                      const percent = Math.min(
                        100,
                        Math.round((curStock / minLvl) * 100)
                      );
                      const defaultModalQty = getDefaultRestockQty(med);
                      const customModalQtyStr =
                        customRestockQtyMap[med.id] !== undefined
                          ? customRestockQtyMap[med.id]
                          : String(defaultModalQty);
                      const parsedModalQty = Math.floor(
                        Number(customModalQtyStr)
                      );
                      const isValidModalQty =
                        Number.isFinite(parsedModalQty) && parsedModalQty > 0;

                      return (
                        <div
                          key={med.id}
                          className={`p-3.5 rounded-xl border ${
                            isZero
                              ? 'bg-rose-50/40 border-rose-200'
                              : 'bg-amber-50/30 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {med.brandName}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {med.dosageForm} {med.strength}
                                </span>
                              </div>
                              {med.genericName && (
                                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                                  {med.genericName}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-500">
                                {med.companyName}{' '}
                                {med.shelfLocation &&
                                  `· র‍্যাক: ${med.shelfLocation}`}
                              </p>
                            </div>

                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                isZero
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-200 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {isZero ? 'স্টক নেই' : 'কম স্টক'}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold font-mono tabular-nums">
                              <span
                                className={
                                  isZero ? 'text-rose-700' : 'text-amber-800'
                                }
                              >
                                বর্তমান: {toBengaliDigits(curStock)} পিস
                              </span>
                              <span className="text-slate-600">
                                সীমা: {toBengaliDigits(minLvl)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isZero
                                    ? 'bg-rose-600 w-0'
                                    : percent < 30
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono tabular-nums">
                              <span>
                                ঘাটতি: {toBengaliDigits(shortage)} পিস
                              </span>
                              {med.purchasePrice > 0 && (
                                <span>
                                  সম্ভাব্য খরচ:{' '}
                                  {formatBengaliCurrency(
                                    shortage * med.purchasePrice
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                            {onQuickRestock && (
                              <div className="flex items-center rounded-lg border border-emerald-300 bg-white overflow-hidden shrink-0">
                                <span className="pl-2 pr-0.5 text-xs font-bold text-emerald-700 select-none">
                                  +
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={customModalQtyStr}
                                  onChange={(e) =>
                                    setCustomRestockQtyMap((prev) => ({
                                      ...prev,
                                      [med.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (isValidModalQty)
                                        handleWidgetQuickRestock(med);
                                    }
                                  }}
                                  aria-label="কাস্টম রি-স্টক সংখ্যা"
                                  className="w-16 py-1 pr-1 text-xs font-mono tabular-nums font-bold text-slate-900 bg-transparent focus:outline-none text-center"
                                />
                                <button
                                  type="button"
                                  disabled={
                                    restockingItemId === med.id ||
                                    !isValidModalQty
                                  }
                                  onClick={() => handleWidgetQuickRestock(med)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                  <span>
                                    {restockingItemId === med.id
                                      ? 'যোগ হচ্ছে...'
                                      : 'স্টক যোগ'}
                                  </span>
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIsLowStockModalOpen(false);
                                onNavigate('pos_accounts', 'purchase_entry');
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ml-auto"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>ক্রয় চালান</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600">
                সরাসরি ক্রয় বিল তৈরি করতে ডানদিকের বোতামে ক্লিক করুন।
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLowStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLowStockModalOpen(false);
                    onNavigate('pos_accounts', 'purchase_entry');
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>ক্রয় চালানে যান</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
