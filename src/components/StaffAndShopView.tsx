import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Key,
  Layers,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  Store,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { ShopCloudSession } from '../firebase';
import { AppLanguage } from '../i18n';
import {
  CustomInvoiceSettings,
  isMandatoryOwner,
  ShopBranch,
  ShopProfile,
  ShopRegistration,
  StaffMember,
  Transaction,
} from '../types';

interface StaffAndShopViewProps {
  shopProfile: ShopProfile;
  staffList: StaffMember[];
  activeStaff: StaffMember;
  transactions: Transaction[];
  cloudSession: ShopCloudSession | null;
  isCloudLoggedIn: boolean;
  seedingCloud: boolean;
  lang?: AppLanguage;
  shopRegistrations?: ShopRegistration[];
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
  onApproveShopRegistration?: (regId: string) => Promise<void>;
  onRejectShopRegistration?: (regId: string) => Promise<void>;
}

export const StaffAndShopView: React.FC<StaffAndShopViewProps> = ({
  shopProfile,
  staffList,
  activeStaff,
  transactions,
  cloudSession,
  isCloudLoggedIn,
  seedingCloud,
  lang = 'bn',
  shopRegistrations = [],
  onOpenCloudLoginModal,
  onQuickCloudLogin,
  onCloudLogout,
  onSyncCloudData,
  onSelectActiveStaff,
  onUpdateShopProfile,
  onSaveStaffMember,
  onDeleteStaffMember,
  onApproveShopRegistration,
  onRejectShopRegistration,
}) => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<'staff' | 'branches' | 'invoice_designer' | 'admin_approvals'>('staff');

  // Multi-Institution / Branches State
  const defaultBranches: ShopBranch[] = useMemo(() => {
    if (shopProfile.branches && shopProfile.branches.length > 0) {
      return shopProfile.branches;
    }
    return [
      {
        id: 'branch-main',
        name: shopProfile.shopName || 'ইকবাল ফার্মেসী - প্রধান শাখা',
        branchCode: 'MAIN-01',
        address: shopProfile.address || 'নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর',
        phone: shopProfile.phone || '01812-358839, 01315645076',
        drugLicenseNo: shopProfile.licenseNo || 'DGDA-12904 / নোয়াখালী-লক্ষ্মীপুর',
        vatRegNo: 'BIN: 002948192-0201',
        isDefault: true,
      },
    ];
  }, [shopProfile]);

  const [branches, setBranches] = useState<ShopBranch[]>(defaultBranches);
  const [activeBranchId, setActiveBranchId] = useState<string>(
    shopProfile.activeBranchId || defaultBranches[0]?.id || 'branch-main'
  );
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ShopBranch | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchLicense, setBranchLicense] = useState('');
  const [branchVat, setBranchVat] = useState('');
  const [savingBranch, setSavingBranch] = useState(false);

  // Custom Invoice Settings State
  const defaultInvoiceSettings: CustomInvoiceSettings = useMemo(() => {
    return (
      shopProfile.customInvoiceSettings || {
        invoiceTitle: shopProfile.shopName || 'ইকবাল ফার্মেসী',
        tagline: 'সুলভ মূল্যে আসল ও মানসম্মত দেশি-বিদেশি ঔষধের নির্ভরযোগ্য প্রতিষ্ঠান',
        address: shopProfile.address || 'নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর',
        phone: shopProfile.phone || '01812-358839, 01315645076',
        licenseNo: shopProfile.licenseNo || 'DGDA-12904 / নোয়াখালী-লক্ষ্মীপুর',
        sealType: 'paid',
        customSealText: 'PAID · পরিশোধিত',
        footerNotes: [
          'বিক্রিত ঔষধ অক্ষত ফয়েল/প্যাক থাকলে ক্যাশ মেমোসহ ৭ দিনের মধ্যে পরিবর্তনযোগ্য।',
          'কাটা/ছেঁড়া পাতা বা ইনসুলিন ও ফ্রিজের ওষুধ ফেরত বা পরিবর্তনযোগ্য নয়।',
          'সকল ওষুধ আলো ও তাপ থেকে দূরে ঠাণ্ডা ও শুষ্ক স্থানে রাখুন।',
        ],
        termsAndConditions: 'পরবর্তী সাক্ষাতের সময় ব্যবস্থাপত্র সঙ্গে আনবেন।',
        showDrugLicense: true,
        vatRegNo: 'BIN: 002948192-0201',
      }
    );
  }, [shopProfile]);

  const [invoiceSettings, setInvoiceSettings] = useState<CustomInvoiceSettings>(defaultInvoiceSettings);
  const [previewInvoiceType, setPreviewInvoiceType] = useState<'sale' | 'purchase'>('sale');
  const [savingInvoiceSettings, setSavingInvoiceSettings] = useState(false);
  const [invoiceSettingsSaved, setInvoiceSettingsSaved] = useState(false);

  // Shop basic form
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

  // Check if current user is Master App Owner
  const isAppOwner =
    cloudSession?.email?.toLowerCase() === 'mhakbor2001@gmail.com' ||
    activeStaff?.email?.toLowerCase() === 'mhakbor2001@gmail.com' ||
    activeStaff?.id === 'staff-owner-1';

  // Toggle table password visibility
  const toggleTablePassword = (staffId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [staffId]: !prev[staffId],
    }));
  };

  // One-click copy staff login credentials
  const handleCopyStaffCredentials = (st: StaffMember) => {
    const credText = `ফার্মেসী স্টাফ লগইন তথ্য:\nনাম: ${st.roleTitle === 'owner' ? 'Owner' : st.name}\nমোবাইল: ${st.phone}\nইমেইল: ${st.email || 'N/A'}\nপাসওয়ার্ড: ${st.password || '123456'}\nকাউন্টার: ${st.counterName}`;
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

  // Save Shop Basic Profile
  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShop(true);
    try {
      await onUpdateShopProfile({
        shopName: shopName.trim(),
        licenseNo: licenseNo.trim(),
        phone: phone.trim(),
        address: address.trim(),
        branches,
        activeBranchId,
        customInvoiceSettings: invoiceSettings,
      });
      setShopSaved(true);
      setTimeout(() => setShopSaved(false), 2000);
    } finally {
      setSavingShop(false);
    }
  };

  // Save Custom Invoice Settings
  const handleSaveInvoiceCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInvoiceSettings(true);
    try {
      await onUpdateShopProfile({
        shopName: invoiceSettings.invoiceTitle || shopName.trim(),
        licenseNo: invoiceSettings.licenseNo || licenseNo.trim(),
        phone: invoiceSettings.phone || phone.trim(),
        address: invoiceSettings.address || address.trim(),
        branches,
        activeBranchId,
        customInvoiceSettings: invoiceSettings,
      });
      setInvoiceSettingsSaved(true);
      setTimeout(() => setInvoiceSettingsSaved(false), 2000);
    } finally {
      setSavingInvoiceSettings(false);
    }
  };

  // Branch Modal Openers
  const openNewBranchModal = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchCode(`BR-${branches.length + 1}`);
    setBranchAddress(shopProfile.address || '');
    setBranchPhone(shopProfile.phone || '');
    setBranchLicense(shopProfile.licenseNo || '');
    setBranchVat('BIN: 002948192-0201');
    setShowBranchModal(true);
  };

  const openEditBranchModal = (br: ShopBranch) => {
    setEditingBranch(br);
    setBranchName(br.name);
    setBranchCode(br.branchCode || '');
    setBranchAddress(br.address);
    setBranchPhone(br.phone);
    setBranchLicense(br.drugLicenseNo || '');
    setBranchVat(br.vatRegNo || '');
    setShowBranchModal(true);
  };

  // Save or Add Branch
  const handleSaveBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    setSavingBranch(true);
    try {
      let updatedBranches: ShopBranch[];
      if (editingBranch) {
        updatedBranches = branches.map((b) =>
          b.id === editingBranch.id
            ? {
                ...b,
                name: branchName.trim(),
                branchCode: branchCode.trim(),
                address: branchAddress.trim(),
                phone: branchPhone.trim(),
                drugLicenseNo: branchLicense.trim(),
                vatRegNo: branchVat.trim(),
              }
            : b
        );
      } else {
        const newBranch: ShopBranch = {
          id: `branch-${Date.now()}`,
          name: branchName.trim(),
          branchCode: branchCode.trim() || `BR-${branches.length + 1}`,
          address: branchAddress.trim(),
          phone: branchPhone.trim(),
          drugLicenseNo: branchLicense.trim(),
          vatRegNo: branchVat.trim(),
          isDefault: branches.length === 0,
        };
        updatedBranches = [...branches, newBranch];
      }
      setBranches(updatedBranches);
      await onUpdateShopProfile({
        shopName: shopProfile.shopName,
        licenseNo: shopProfile.licenseNo,
        phone: shopProfile.phone,
        address: shopProfile.address,
        branches: updatedBranches,
        activeBranchId: activeBranchId || updatedBranches[0]?.id,
        customInvoiceSettings: invoiceSettings,
      });
      setShowBranchModal(false);
    } finally {
      setSavingBranch(false);
    }
  };

  // Switch Active Branch
  const handleSetActiveBranch = async (branchId: string) => {
    setActiveBranchId(branchId);
    await onUpdateShopProfile({
      shopName: shopProfile.shopName,
      licenseNo: shopProfile.licenseNo,
      phone: shopProfile.phone,
      address: shopProfile.address,
      branches,
      activeBranchId: branchId,
      customInvoiceSettings: invoiceSettings,
    });
  };

  // Delete Branch
  const handleDeleteBranch = async (branchId: string) => {
    if (branches.length <= 1) {
      alert('কমপক্ষে একটি প্রধান প্রতিষ্ঠান / শাখা থাকা আবশ্যক!');
      return;
    }
    const updated = branches.filter((b) => b.id !== branchId);
    setBranches(updated);
    const nextActive = activeBranchId === branchId ? updated[0]?.id : activeBranchId;
    setActiveBranchId(nextActive);
    await onUpdateShopProfile({
      shopName: shopProfile.shopName,
      licenseNo: shopProfile.licenseNo,
      phone: shopProfile.phone,
      address: shopProfile.address,
      branches: updated,
      activeBranchId: nextActive,
      customInvoiceSettings: invoiceSettings,
    });
  };

  // Staff Modal Openers
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
    const isMand = isMandatoryOwner(st);
    setStaffName(isMand ? 'Owner' : st.name);
    setRoleTitle(isMand ? 'owner' : st.roleTitle === 'owner' ? 'sub_owner' : st.roleTitle);
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
    const isMand = editingStaff ? isMandatoryOwner(editingStaff) : false;
    const finalRole: StaffMember['roleTitle'] = isMand
      ? 'owner'
      : roleTitle === 'owner'
      ? 'sub_owner'
      : roleTitle;
    const finalName = finalRole === 'owner' ? 'Owner' : staffName.trim();
    if (!finalName) return;
    setSavingStaff(true);
    try {
      await onSaveStaffMember(
        {
          name: finalName,
          roleTitle: finalRole,
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
      {/* Top Banner: Firestore Database Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
            <Cloud className="w-4 h-4" />
            <span>
              {lang === 'bn'
                ? 'ফায়ারস্টোর ডাটাবেস ও রিয়েল-টাইম মাল্টি-ডিভাইস সিঙ্ক'
                : 'Firestore Live Database & Multi-Device Sync'}
            </span>
            {!isCloudLoggedIn && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                গেস্ট মোড
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {isCloudLoggedIn
              ? `ফায়ারস্টোর সক্রিয়: ${cloudSession?.shopName || shopProfile.shopName} (${cloudSession?.email || cloudSession?.phone || 'Owner'})`
              : 'ফায়ারস্টোর ডাটাবেস: লগইন করে সব ডিভাইসে লাইভ ডেটা সিঙ্ক করুন'}
          </h2>
          <p className="text-xs text-slate-600">
            {isCloudLoggedIn
              ? `লগইনকৃত আইডি: ${cloudSession?.displayName || 'দোকান মালিক'} · মোবাইল: ${cloudSession?.phone || shopProfile.phone}`
              : 'নতুন শপ একাউন্ট খুললে অ্যাপস মালিকের অনুমোদন সাপেক্ষে চালু হবে।'}
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
                <span>ক্লাউড সিঙ্ক</span>
              </button>
              <button
                type="button"
                onClick={onCloudLogout}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenCloudLoginModal}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>লগইন / নতুন শপ একাউন্ট</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'staff'
              ? 'border-teal-700 text-teal-900 bg-teal-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-teal-700" />
          <span>স্টাফ ও রোল ব্যবস্থাপনা ({staffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'branches'
              ? 'border-teal-700 text-teal-900 bg-teal-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-700" />
          <span>প্রতিষ্ঠান ও শাখা ব্যবস্থাপনা ({branches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoice_designer')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'invoice_designer'
              ? 'border-teal-700 text-teal-900 bg-teal-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stamp className="w-4 h-4 text-emerald-700" />
          <span>ক্রয়/বিক্রয় ইনভয়েস কাস্টমাইজেশন ও সিল</span>
        </button>

        {isAppOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('admin_approvals')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              activeTab === 'admin_approvals'
                ? 'border-rose-700 text-rose-900 bg-rose-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-700" />
            <span>অ্যাপস মালিক কন্ট্রোল: শপ একাউন্ট অনুমোদন</span>
            {shopRegistrations.filter((r) => r.status === 'pending_approval').length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                {shopRegistrations.filter((r) => r.status === 'pending_approval').length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: STAFF & ROLE MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Active Operator Banner */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {isMandatoryOwner(activeStaff) ? 'MO' : activeStaff.roleTitle === 'sub_owner' ? 'SO' : 'ST'}
              </div>
              <div>
                <div className="font-bold text-sm text-teal-900">
                  বর্তমান সক্রিয় মেমো অপারেটর: {isMandatoryOwner(activeStaff) ? 'Owner' : activeStaff.name} (
                  {isMandatoryOwner(activeStaff)
                    ? 'প্রধান মালিক'
                    : activeStaff.roleTitle === 'sub_owner'
                    ? 'সাব-মালিক'
                    : 'স্টাফ'}
                  )
                </div>
                <div className="text-teal-700 text-[11px] mt-0.5">
                  কাউন্টার: {activeStaff.counterName} · শিফট: {activeStaff.shift} · মোবাইল: {activeStaff.phone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openNewStaffModal}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্টাফ / সাব-মালিক যোগ করুন</span>
            </button>
          </div>

          {/* Staff Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  স্টাফ তালিকা ও দায়িত্ব বন্টন
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  প্রধান মালিক (Mandatory) স্থায়ী থাকবেন। সাব-মালিক ও সকল স্টাফদের ভূমিকা পরিবর্তন বা মুছে ফেলা যাবে।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4">নাম ও পদবী</th>
                    <th className="py-2.5 px-3">মোবাইল ও ইমেইল</th>
                    <th className="py-2.5 px-3">পাসওয়ার্ড</th>
                    <th className="py-2.5 px-3">কাউন্টার ও শিফট</th>
                    <th className="py-2.5 px-3 text-right">মেমো ও বিক্রয়</th>
                    <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((st) => {
                    const isMand = isMandatoryOwner(st);
                    const isSub = st.roleTitle === 'sub_owner';
                    const isCurrent = activeStaff.id === st.id;
                    const perf = staffPerformance.get(isMand ? 'Owner' : st.name) || {
                      memoCount: 0,
                      totalSaleAmount: 0,
                      cashCollected: 0,
                    };

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCurrent ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {isMand ? 'Owner' : st.name}
                            </span>
                            {isMand ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-700" />
                                <span>প্রধান মালিক (স্থায়ী)</span>
                              </span>
                            ) : isSub ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-full">
                                সাব-মালিক (Sub Owner)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded">
                                {st.roleTitle}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-mono text-slate-800">{st.phone}</div>
                          {st.email && (
                            <div className="text-[11px] text-slate-500 font-mono truncate max-w-[160px]">
                              {st.email}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-mono">
                            <span>{visiblePasswords[st.id] ? st.password || '••••••' : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => toggleTablePassword(st.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                            >
                              {visiblePasswords[st.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyStaffCredentials(st)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded cursor-pointer"
                              title="লগইন তথ্য কপি করুন"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600">
                          <div>{st.counterName}</div>
                          <div className="text-[11px] text-slate-400">{st.shift}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-bold text-slate-900">৳{perf.totalSaleAmount.toFixed(0)}</div>
                          <div className="text-[11px] text-slate-500">{perf.memoCount} মেমো</div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => onSelectActiveStaff(st)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold rounded text-xs cursor-pointer"
                              >
                                সক্রিয় করুন
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openEditStaffModal(st)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                              title="তথ্য পরিবর্তন করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {!isMand && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`আপনি কি সত্যিই ${st.name}-কে মুছে ফেলতে চান?`)) {
                                    onDeleteStaffMember(st.id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="মুছে ফেলুন"
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
        </div>
      )}

      {/* TAB 2: MULTI-INSTITUTION / BRANCHES MANAGEMENT */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
            <div>
              <h3 className="font-bold text-sm text-indigo-900">
                বিভিন্ন প্রতিষ্ঠান ও শাখা ব্যবস্থাপনা (Multi-Branch Management)
              </h3>
              <p className="text-indigo-700 text-xs mt-0.5">
                আপনার ফার্মেসীর অধীনে বিভিন্ন শাখা, পয়েন্ট বা চেম্বার তৈরি করুন। সক্রিয় শাখা নির্বাচন করলে মেমোতে স্বয়ংক্রিয়ভাবে সেই প্রতিষ্ঠানের সিল ও নাম যুক্ত হবে।
              </p>
            </div>

            <button
              type="button"
              onClick={openNewBranchModal}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন শাখা / প্রতিষ্ঠান যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((br) => {
              const isActive = br.id === activeBranchId;
              return (
                <div
                  key={br.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition-all relative flex flex-col justify-between ${
                    isActive ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-indigo-700 shrink-0" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{br.name}</h4>
                          <span className="text-[10px] font-mono text-slate-500">{br.branchCode}</span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                          সক্রিয় শাখা
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{br.address || 'ঠিকানা নির্ধারিত নেই'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{br.phone || 'মোবাইল নেই'}</span>
                      </div>
                      {br.drugLicenseNo && (
                        <div className="text-[11px] text-slate-500">
                          ড্রাগ লাইসেন্স: <strong className="font-mono">{br.drugLicenseNo}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => handleSetActiveBranch(br.id)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md cursor-pointer transition-colors"
                      >
                        সক্রিয় শাখা করুন
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ইনভয়েসে ব্যবহৃত হচ্ছে
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditBranchModal(br)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {branches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(br.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="শাখা মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INVOICE CUSTOMIZATION & OFFICIAL SEAL DESIGNER */}
      {activeTab === 'invoice_designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Cols: Customization Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-emerald-700" />
                <span>ক্রয় ও বিক্রয় ইনভয়েস এবং সিল কাস্টমাইজেশন</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ইনভয়েসের হেডার, সিল, স্লোগান, ঠিকানা ও শর্তাবলী আপনার পছন্দমতো সাজিয়ে নিন
              </p>
            </div>

            <form onSubmit={handleSaveInvoiceCustomization} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতিষ্ঠানের নাম / ইনভয়েস হেডার *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceSettings.invoiceTitle || ''}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoiceTitle: e.target.value })}
                  placeholder="যেমন: ইকবাল ফার্মেসী"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  স্লোগান / ট্যাগলাইন
                </label>
                <input
                  type="text"
                  value={invoiceSettings.tagline || ''}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, tagline: e.target.value })}
                  placeholder="যেমন: সুলভ মূল্যে জেনুইন ঔষধের বিশ্বস্ত প্রতিষ্ঠান"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর / হটলাইন
                  </label>
                  <input
                    type="text"
                    value={invoiceSettings.phone || ''}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, phone: e.target.value })}
                    placeholder="01812-358839"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ড্রাগ লাইসেন্স নং
                  </label>
                  <input
                    type="text"
                    value={invoiceSettings.licenseNo || ''}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, licenseNo: e.target.value })}
                    placeholder="DGDA-12904"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতিষ্ঠানের পূর্ণাঙ্গ ঠিকানা
                </label>
                <textarea
                  rows={2}
                  value={invoiceSettings.address || ''}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, address: e.target.value })}
                  placeholder="যেমন: নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md text-slate-800"
                />
              </div>

              {/* Official Seal Settings */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>অফিসিয়াল সিল ও স্ট্যাম্প সেটিংস</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      সিল টাইপ (Seal Type)
                    </label>
                    <select
                      value={invoiceSettings.sealType || 'paid'}
                      onChange={(e) =>
                        setInvoiceSettings({
                          ...invoiceSettings,
                          sealType: e.target.value as any,
                          customSealText:
                            e.target.value === 'paid'
                              ? 'PAID · পরিশোধিত'
                              : e.target.value === 'cash_received'
                              ? 'নগদ আদায়কৃত'
                              : e.target.value === 'due'
                              ? 'বকেয়া বিল'
                              : invoiceSettings.customSealText || 'অনুমোদিত সিল',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                    >
                      <option value="paid">PAID / পরিশোধিত</option>
                      <option value="cash_received">নগদ আদায়কৃত (Cash Received)</option>
                      <option value="due">বকেয়া বিল (Due Bill)</option>
                      <option value="custom">কাস্টম লেখা (Custom Seal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      সিলের লেখা (Seal Stamp Text)
                    </label>
                    <input
                      type="text"
                      value={invoiceSettings.customSealText || 'PAID · পরিশোধিত'}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, customSealText: e.target.value })}
                      placeholder="যেমন: PAID, পরিশোধিত"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md font-semibold text-emerald-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ফুটার শর্তাবলী ও পরিবর্তন নির্দেশিকা
                </label>
                <textarea
                  rows={2}
                  value={invoiceSettings.termsAndConditions || ''}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
                  placeholder="যেমন: বিক্রিত ঔষধ ৭ দিনের মধ্যে ক্যাশ মেমোসহ পরিবর্তনযোগ্য (ফ্রিজের ঔষধ ব্যতীত)।"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md text-slate-700"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-700 font-semibold">
                  {invoiceSettingsSaved ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে! ✓' : ''}
                </span>

                <button
                  type="submit"
                  disabled={savingInvoiceSettings}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingInvoiceSettings ? 'সংরক্ষণ হচ্ছে...' : 'ইনভয়েস সেটিংস সেভ করুন'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right 6 Cols: Live Interactive Invoice Preview */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>লাইভ ইনভয়েস প্রিভিউ</span>
              </span>

              <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewInvoiceType('sale')}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    previewInvoiceType === 'sale' ? 'bg-teal-700 text-white' : 'text-slate-600'
                  }`}
                >
                  বিক্রয় মেমো
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoiceType('purchase')}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    previewInvoiceType === 'purchase' ? 'bg-indigo-700 text-white' : 'text-slate-600'
                  }`}
                >
                  ক্রয় চালান
                </button>
              </div>
            </div>

            {/* Printed Invoice Sheet Simulation */}
            <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm space-y-4 text-xs font-sans">
              {/* Header Box */}
              <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {invoiceSettings.invoiceTitle || shopProfile.shopName || 'ইকবাল ফার্মেসী'}
                  </h3>
                  <div className="text-[11px] text-teal-800 font-semibold mt-0.5">
                    {invoiceSettings.tagline || 'সুলভ মূল্যে জেনুইন ঔষধের বিশ্বস্ত প্রতিষ্ঠান'}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    ঠিকানা: {invoiceSettings.address || shopProfile.address || 'নতুনহাট, চন্দ্রগঞ্জ, লক্ষ্মীপুর'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-700 font-bold">
                    মোবাইল: {invoiceSettings.phone || shopProfile.phone || '01812-358839'} · লাইসেন্স:{' '}
                    {invoiceSettings.licenseNo || shopProfile.licenseNo || 'DGDA-12904'}
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="font-bold text-slate-800">
                    {previewInvoiceType === 'sale' ? 'ক্যাশ মেমো (INVOICE)' : 'স্টক-ইন চালান (PURCHASE)'}
                  </div>
                  <div className="text-slate-500">নং: INV-2026-0042</div>
                  <div className="text-slate-500">তারিখ: {new Date().toLocaleDateString('bn-BD')}</div>
                </div>
              </div>

              {/* Sample Items Table */}
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-semibold bg-slate-50">
                    <th className="py-1 px-2">ঔষধের নাম</th>
                    <th className="py-1 px-1 text-center">পরিমাণ</th>
                    <th className="py-1 px-2 text-right">দর (৳)</th>
                    <th className="py-1 px-2 text-right">মোট (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-1.5 px-2 font-sans font-medium text-slate-900">
                      A-Cal DX (500 mg+400 IU) - ACME
                    </td>
                    <td className="py-1.5 px-1 text-center">30 পিস</td>
                    <td className="py-1.5 px-2 text-right">৳7.50</td>
                    <td className="py-1.5 px-2 text-right font-bold">৳225.00</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 font-sans font-medium text-slate-900">
                      Seclo 20 mg - Square Pharma
                    </td>
                    <td className="py-1.5 px-1 text-center">10 পিস</td>
                    <td className="py-1.5 px-2 text-right">৳6.00</td>
                    <td className="py-1.5 px-2 text-right font-bold">৳60.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals & Stamped Official Seal */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                {/* Official Stamp Render */}
                <div className="relative border-2 border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-black uppercase tracking-wider text-center transform -rotate-3 select-none bg-emerald-50/40">
                  <div className="text-[10px] tracking-widest">{invoiceSettings.invoiceTitle || 'ইকবাল ফার্মেসী'}</div>
                  <div className="text-sm font-extrabold">{invoiceSettings.customSealText || 'PAID · পরিশোধিত'}</div>
                  <div className="text-[8px] font-mono tracking-tight">VERIFIED OFFICIAL SEAL</div>
                </div>

                <div className="font-mono text-right text-xs space-y-0.5">
                  <div className="text-slate-500">মোট মূল্য: ৳285.00</div>
                  <div className="text-slate-900 font-black text-sm">সর্বমোট বিল: ৳285.00</div>
                  <div className="text-emerald-700 font-bold">নগদ পরিশোধ: ৳285.00</div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-2 border-t border-slate-200 text-[9.5px] text-slate-500 space-y-0.5 leading-relaxed">
                <div>
                  <strong>শর্তাবলী:</strong>{' '}
                  {invoiceSettings.termsAndConditions ||
                    'বিক্রিত ঔষধ অক্ষত ফয়েল/প্যাক থাকলে ক্যাশ মেমোসহ ৭ দিনের মধ্যে পরিবর্তনযোগ্য।'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: APP OWNER SHOP APPROVALS DASHBOARD (Visible to Master Owner) */}
      {activeTab === 'admin_approvals' && isAppOwner && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-700" />
                <span>অ্যাপস মালিক কন্ট্রোল প্যানেল: শপ একাউন্ট অনুমোদন ও তালিকা</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                নতুন নিবন্ধিত শপ একাউন্ট অনুমোদন দিলে তারা সফটওয়্যারে কাজ করার সম্পূর্ণ এক্সেস পাবে
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">দোকানের নাম</th>
                  <th className="py-2.5 px-3">মালিকের নাম</th>
                  <th className="py-2.5 px-3">মোবাইল ও ইমেইল</th>
                  <th className="py-2.5 px-3">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3 text-right">অনুমোদন অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shopRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      কোনো অপেক্ষমান শপ রেজিস্ট্রেশন পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  shopRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">{reg.shopName}</td>
                      <td className="py-3 px-3 text-slate-800">{reg.ownerName}</td>
                      <td className="py-3 px-3 font-mono">
                        <div>{reg.phone}</div>
                        <div className="text-[11px] text-slate-400">{reg.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        {reg.status === 'approved' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                            অনুমোদিত (Approved)
                          </span>
                        ) : reg.status === 'rejected' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300">
                            স্থগিত (Suspended)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                            অপেক্ষমান (Pending)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(reg.registeredAtMs).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {reg.status !== 'approved' && onApproveShopRegistration && (
                            <button
                              type="button"
                              onClick={() => onApproveShopRegistration(reg.id)}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer shadow-2xs"
                            >
                              অনুমোদন করুন
                            </button>
                          )}
                          {reg.status === 'approved' && onRejectShopRegistration && (
                            <button
                              type="button"
                              onClick={() => onRejectShopRegistration(reg.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 rounded text-xs cursor-pointer"
                            >
                              স্থগিত করুন
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Institution Branch */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              {editingBranch ? 'শাখা / প্রতিষ্ঠান সম্পাদনা' : 'নতুন শাখা / প্রতিষ্ঠান যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveBranchSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শাখা / প্রতিষ্ঠানের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="যেমন: ইকবাল ফার্মেসী - মেডিকেল রোড শাখা"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শাখা কোড</label>
                  <input
                    type="text"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="BR-02"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    placeholder="01812-358839"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="চন্দ্রগঞ্জ বাজার, লক্ষ্মীপুর"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ড্রাগ লাইসেন্স নং</label>
                  <input
                    type="text"
                    value={branchLicense}
                    onChange={(e) => setBranchLicense(e.target.value)}
                    placeholder="DGDA-XXXX"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মূসক / ভ্যাট নং</label>
                  <input
                    type="text"
                    value={branchVat}
                    onChange={(e) => setBranchVat(e.target.value)}
                    placeholder="BIN: XXXXXXXX"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingBranch}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {savingBranch ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Staff Member */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              {editingStaff ? 'স্টাফ / সাব-মালিকের তথ্য পরিবর্তন' : 'নতুন স্টাফ / সাব-মালিক যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveStaffSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="যেমন: মোঃ ইকবাল"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ভূমিকা / পদবী *</label>
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-md bg-white font-medium"
                  >
                    <option value="sub_owner">সাব-মালিক (Sub Owner)</option>
                    <option value="pharmacist">ফার্মাসিস্ট (Pharmacist)</option>
                    <option value="salesman">সেলসম্যান (Salesman)</option>
                    <option value="cashier">ক্যাশিয়ার (Cashier)</option>
                    <option value="manager">ম্যানেজার (Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="01700-000000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল / জিমেইল (ঐচ্ছিক)</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">লগইন পাসওয়ার্ড *</label>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 pr-9 text-xs border border-slate-200 rounded-md font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শিফট</label>
                  <input
                    type="text"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    placeholder="সকাল ৯টা - বিকাল ৫টা"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">কাউন্টার</label>
                  <input
                    type="text"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    placeholder="কাউন্টার ২"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {savingStaff ? 'সংরক্ষণ হচ্ছে...' : 'স্টাফ সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
