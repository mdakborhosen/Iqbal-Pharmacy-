import React, { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Cloud,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Key,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { ShopCloudSession } from '../firebase';
import { ShopProfile, StaffMember, Transaction } from '../types';

interface StaffAndShopViewProps {
  shopProfile: ShopProfile;
  staffList: StaffMember[];
  activeStaff: StaffMember;
  transactions: Transaction[];
  cloudSession: ShopCloudSession | null;
  isCloudLoggedIn: boolean;
  seedingCloud: boolean;
  onOpenCloudLoginModal: () => void;
  onQuickCloudLogin: () => Promise<void>;
  onCloudLogout: () => Promise<void>;
  onSyncCloudData: () => Promise<void>;
  onSelectActiveStaff: (staff: StaffMember) => void;
  onUpdateShopProfile: (
    data: Omit<ShopProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onSaveStaffMember: (
    data: Omit<StaffMember, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onDeleteStaffMember: (id: string) => Promise<void>;
}

export const StaffAndShopView: React.FC<StaffAndShopViewProps> = ({
  shopProfile,
  staffList,
  activeStaff,
  transactions,
  cloudSession,
  isCloudLoggedIn,
  seedingCloud,
  onOpenCloudLoginModal,
  onQuickCloudLogin,
  onCloudLogout,
  onSyncCloudData,
  onSelectActiveStaff,
  onUpdateShopProfile,
  onSaveStaffMember,
  onDeleteStaffMember,
}) => {
  // Shop form
  const [shopName, setShopName] = useState(shopProfile.shopName);
  const [licenseNo, setLicenseNo] = useState(shopProfile.licenseNo);
  const [phone, setPhone] = useState(shopProfile.phone);
  const [address, setAddress] = useState(shopProfile.address);
  const [savingShop, setSavingShop] = useState(false);
  const [shopSaved, setShopSaved] = useState(false);

  // Add / Edit Staff modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffName, setStaffName] = useState('');
  const [roleTitle, setRoleTitle] = useState<StaffMember['roleTitle']>('salesman');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [shift, setShift] = useState('সকাল ৯টা - বিকাল ৫টা');
  const [counterName, setCounterName] = useState('কাউন্টার ২ (স্টাফ)');
  const [savingStaff, setSavingStaff] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);

  // Toggle table password visibility
  const toggleTablePassword = (staffId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [staffId]: !prev[staffId],
    }));
  };

  // One-click copy staff login credentials
  const handleCopyStaffCredentials = (st: StaffMember) => {
    const credText = `ইকবাল ফার্মেসী - স্টাফ লগইন তথ্য:\nনাম: ${st.roleTitle === 'owner' ? 'Owner' : st.name}\nমোবাইল: ${st.phone}\nইমেইল: ${st.email || 'N/A'}\nপাসওয়ার্ড: ${st.password || '123456'}\nকাউন্টার: ${st.counterName}`;
    navigator.clipboard?.writeText(credText);
    setCopiedStaffId(st.id);
    setTimeout(() => setCopiedStaffId(null), 2500);
  };

  // Calculate Sales & Collection per Staff Member
  const staffPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        memoCount: number;
        totalSaleAmount: number;
        cashCollected: number;
      }
    >();

    for (const tx of transactions) {
      if (tx.txType === 'sale' || tx.txType === 'due_payment') {
        const key = tx.staffRole === 'owner' ? 'Owner' : tx.staffName;
        const prev = map.get(key) || {
          memoCount: 0,
          totalSaleAmount: 0,
          cashCollected: 0,
        };
        if (tx.txType === 'sale') {
          prev.memoCount += 1;
          prev.totalSaleAmount += tx.grandTotal;
        }
        prev.cashCollected += tx.paidAmount;
        map.set(key, prev);
      }
    }
    return map;
  }, [transactions]);

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShop(true);
    try {
      await onUpdateShopProfile({
        shopName: shopName.trim(),
        licenseNo: licenseNo.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setShopSaved(true);
      setTimeout(() => setShopSaved(false), 2000);
    } finally {
      setSavingShop(false);
    }
  };

  const openNewStaffModal = () => {
    setEditingStaff(null);
    setStaffName('');
    setRoleTitle('salesman');
    setStaffPhone('');
    setStaffEmail('');
    setStaffPassword('123456');
    setShowModalPassword(false);
    setShift('সকাল ৯টা - বিকাল ৫টা');
    setCounterName('কাউন্টার ২ (স্টাফ)');
    setShowStaffModal(true);
  };

  const openEditStaffModal = (st: StaffMember) => {
    setEditingStaff(st);
    setStaffName(st.roleTitle === 'owner' ? 'Owner' : st.name);
    setRoleTitle(st.roleTitle);
    setStaffPhone(st.phone);
    setStaffEmail(st.email || '');
    setStaffPassword(st.password || '123456');
    setShowModalPassword(false);
    setShift(st.shift);
    setCounterName(st.counterName);
    setShowStaffModal(true);
  };

  const handleSaveStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = roleTitle === 'owner' ? 'Owner' : staffName.trim();
    if (!finalName) return;
    setSavingStaff(true);
    try {
      await onSaveStaffMember(
        {
          name: finalName,
          roleTitle,
          phone: staffPhone.trim() || '01700-000000',
          email: staffEmail.trim() || undefined,
          password: staffPassword.trim() || '123456',
          shift: shift.trim(),
          counterName: counterName.trim(),
          active: true,
        },
        editingStaff?.id
      );
      setShowStaffModal(false);
    } finally {
      setSavingStaff(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shop Cloud Login & Real-Time Multi-Device Sync Control Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
            <Cloud className="w-4 h-4" />
            <span>দোকান ক্লাউড লগইন ও মাল্টি-ডিভাইস অটো সিঙ্ক</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {isCloudLoggedIn
              ? `ক্লাউড একাউন্ট সক্রিয়: ${cloudSession?.shopName || shopProfile.shopName} (${cloudSession?.email || 'mhakbor2001@gmail.com'})`
              : 'দোকান ক্লাউড একাউন্টে লগইন করে সকল ডিভাইসে রিয়েল-টাইম ডেটা সিঙ্ক চালু করুন'}
          </h2>
          <p className="text-xs text-slate-600">
            {isCloudLoggedIn
              ? `লগইনকৃত একাউন্ট: ${cloudSession?.displayName || 'ইকবাল মাহমুদ (Owner)'} · মোবাইল: ${cloudSession?.phone || shopProfile.phone} · সকল ইনভয়েস, স্টক ও কাস্টমার লেজার ক্লাউড ও লোকাল স্টোরেজে সুরক্ষিত।`
              : '১-ক্লিকে ইকবাল ফার্মেসী ক্লাউড লগইন অথবা ইমেইল/মোবাইল ও পাসওয়ার্ড দিয়ে দোকান ক্লাউডে লগইন করুন।'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isCloudLoggedIn ? (
            <>
              <button
                type="button"
                onClick={onSyncCloudData}
                disabled={seedingCloud}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seedingCloud ? 'animate-spin' : ''}`} />
                {seedingCloud ? 'সিঙ্ক হচ্ছে...' : 'এখনই ক্লাউডে সিঙ্ক করুন'}
              </button>
              <button
                type="button"
                onClick={onOpenCloudLoginModal}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                একাউন্ট তথ্য / পরিবর্তন
              </button>
              <button
                type="button"
                onClick={onCloudLogout}
                className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                লগআউট
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onQuickCloudLogin}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                ১-ক্লিকে দোকান ক্লাউড লগইন
              </button>
              <button
                type="button"
                onClick={onOpenCloudLoginModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                ইমেইল / পাসওয়ার্ড লগইন অপশন
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Owner & Staff Counter Role Management + Sales Performance */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
                <Users className="w-4 h-4" />
                নির্দিষ্ট দোকানের একাউন্টে মালিক (Owner) ও স্টাফ ব্যবস্থাপনা
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                মালিক (Owner) ও স্টাফ তালিকা এবং সেলস রিপোর্ট
              </h2>
              <p className="text-xs text-slate-500">
                দোকানের মালিকের এন্ট্রিতে সর্বদা <strong>&ldquo;Owner&rdquo;</strong> দেখাবে এবং অন্যান্য স্টাফদের ক্ষেত্রে তাদের নির্দিষ্ট নাম দেখাবে।
              </p>
            </div>
            <button
              type="button"
              onClick={openNewStaffModal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> নতুন স্টাফ যুক্ত করুন
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-4">প্রদর্শিত নাম ও পদবী</th>
                  <th className="py-2.5 px-3">লগইন আইডি (মোবাইল / ইমেইল)</th>
                  <th className="py-2.5 px-3">লগইন পাসওয়ার্ড</th>
                  <th className="py-2.5 px-3">কাউন্টার ও শিফট</th>
                  <th className="py-2.5 px-3 text-right">মোট বিক্রি ও আদায় (৳)</th>
                  <th className="py-2.5 px-4 text-right">লগইন তথ্য / সুইচ / অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {staffList.map((st) => {
                  const isCurrent = st.id === activeStaff.id;
                  const displayName = st.roleTitle === 'owner' ? 'Owner' : st.name;
                  const isPwVisible = Boolean(visiblePasswords[st.id]);
                  const hasPw = Boolean(st.password);
                  const isCopied = copiedStaffId === st.id;
                  const perf = staffPerformance.get(displayName) || {
                    memoCount: 0,
                    totalSaleAmount: 0,
                    cashCollected: 0,
                  };
                  return (
                    <tr
                      key={st.id}
                      className={isCurrent ? 'bg-teal-50/60' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{displayName}</span>
                          {st.roleTitle === 'owner' ? (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                              মালিক (Owner)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-100 text-teal-800 rounded border border-teal-200">
                              {st.roleTitle === 'pharmacist'
                                ? 'ফার্মাসিস্ট'
                                : st.roleTitle === 'manager'
                                ? 'ম্যানেজার'
                                : 'সেলসম্যান'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          কাউন্টার: {st.counterName}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="font-mono font-semibold text-slate-900">{st.phone}</div>
                        {st.email ? (
                          <div className="text-slate-500 font-mono text-[11px] truncate max-w-[160px]">
                            {st.email}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px]">ইমেইল সেট করা নেই</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {isPwVisible
                              ? st.password || '123456'
                              : hasPw
                              ? '••••••••'
                              : '123456'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTablePassword(st.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title={isPwVisible ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                          >
                            {isPwVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">{st.counterName}</div>
                        <div className="text-slate-500 text-[11px]">{st.shift}</div>
                      </td>

                      <td className="py-3 px-3 text-right text-xs">
                        <div className="font-mono font-bold text-slate-900">
                          ৳{perf.totalSaleAmount.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {perf.memoCount}টি মেমো · আদায় ৳{perf.cashCollected.toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyStaffCredentials(st)}
                            className={`p-1.5 rounded transition-colors cursor-pointer border ${
                              isCopied
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                            }`}
                            title="স্টাফের লগইন আইডি ও পাসওয়ার্ড কপি করুন"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectActiveStaff(st)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="এই অপারেটর হিসেবে বিল তৈরি করুন"
                          >
                            {isCurrent ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> সক্রিয়
                              </>
                            ) : (
                              'সুইচ করুন'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditStaffModal(st)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            title="তথ্য ও পাসওয়ার্ড এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {staffList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteStaffMember(st.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded cursor-pointer"
                              title="ডিলিট করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Specific Pharmacy Shop Account Profile & License Info */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
          <div className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
              <Building2 className="w-4 h-4" />
              নির্দিষ্ট দোকানের নামে একাউন্ট ও লাইসেন্স সেটিংস
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              ফার্মেসি একাউন্ট প্রোফাইল ({shopProfile.shopName})
            </h2>
            <p className="text-xs text-slate-500">
              নির্দিষ্ট দোকানের নামে একাউন্ট তৈরি বা হালনাগাদ করুন। এই একাউন্টের অধীনেই Owner ও সকল স্টাফ কাজ করবেন।
            </p>
          </div>

          <form onSubmit={handleSaveShop} className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                নির্দিষ্ট দোকানের / ফার্মেসির নাম *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ড্রাগ লাইসেন্স নম্বর (DGDA) *
                </label>
                <input
                  type="text"
                  required
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  দোকানের মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                দোকানের ঠিকানা *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {shopSaved ? (
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-4 h-4" /> দোকানের একাউন্ট আপডেট হয়েছে
                </span>
              ) : (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-teal-700" /> অনলাইন ও অফলাইন সিঙ্ক সক্রিয়
                </span>
              )}

              <button
                type="submit"
                disabled={savingShop}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer disabled:opacity-50"
              >
                {savingShop ? 'আপডেট হচ্ছে...' : 'দোকানের একাউন্ট সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add / Edit Staff Member Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingStaff
                  ? 'মালিক / স্টাফ প্রোফাইল এডিট করুন'
                  : 'দোকানের একাউন্টে নতুন মালিক / স্টাফ যুক্ত করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaffSubmit} className="space-y-3.5 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    পদবী / রোল নির্বাচন করুন *
                  </label>
                  <select
                    value={roleTitle}
                    onChange={(e) => {
                      const val = e.target.value as StaffMember['roleTitle'];
                      setRoleTitle(val);
                      if (val === 'owner') {
                        setStaffName('Owner');
                        setCounterName('কাউন্টার ১ (Owner)');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  >
                    <option value="salesman">সেলসম্যান (Staff)</option>
                    <option value="pharmacist">ফার্মাসিস্ট (Staff)</option>
                    <option value="manager">ম্যানেজার (Staff)</option>
                    <option value="owner">দোকানের মালিক (Owner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {roleTitle === 'owner'
                      ? 'প্রদর্শিত নাম (সর্বদা Owner)'
                      : 'স্টাফের নির্দিষ্ট নাম *'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={roleTitle === 'owner'}
                    value={roleTitle === 'owner' ? 'Owner' : staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="যেমন: মাহফুজুর রহমান"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md disabled:bg-slate-100 disabled:font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মোবাইল নম্বর (লগইন আইডি) *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="018XXXXXXXX"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ইমেইল / জিমেইল (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="staff@gmail.com"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>স্টাফের লগইন পাসওয়ার্ড *</span>
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer inline-flex items-center gap-1"
                    >
                      {showModalPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showModalPassword ? 'লুকান' : 'দেখুন'}
                    </button>
                  </label>
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="নূন্যতম ৪-৬ অক্ষর"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    কাউন্টার নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    placeholder="কাউন্টার ২ (স্টাফ)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-teal-700" />
                  <span>স্টাফ একাউন্ট লগইন নিয়ম:</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  স্টাফ তার মোবাইল নম্বর অথবা ইমেইল এবং এখানে সেট করা পাসওয়ার্ড দিয়ে যেকোনো ডিভাইস থেকে লগইন করতে পারবেন।
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ডিউটি শিফট *
                </label>
                <input
                  type="text"
                  required
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {savingStaff ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
