import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  Search,
  Trash2,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import { formatTransactionItemsList } from '../data/bdMedicines';
import { Customer, StaffMember, Transaction } from '../types';

interface CustomerLedgerViewProps {
  customers: Customer[];
  transactions: Transaction[];
  activeStaff: StaffMember;
  onSaveCustomer: (
    data: {
      name: string;
      phone: string;
      address: string;
      totalPurchased: number;
      totalPaid: number;
      totalDue: number;
    },
    existingId?: string
  ) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onCollectDuePayment: (params: {
    customer: Customer;
    amount: number;
    paymentMethod: Transaction['paymentMethod'];
    note: string;
  }) => Promise<void>;
  onStartEditInvoice?: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => Promise<void>;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  customers,
  transactions,
  activeStaff,
  onSaveCustomer,
  onDeleteCustomer,
  onCollectDuePayment,
  onStartEditInvoice,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dueFilter, setDueFilter] = useState<'ALL' | 'DUE_ONLY'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );

  // Add / Edit Customer Modal
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPurchased, setCustPurchased] = useState('0');
  const [custPaid, setCustPaid] = useState('0');
  const [custDue, setCustDue] = useState('0');
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Collect Due Payment states
  const [collectAmountStr, setCollectAmountStr] = useState('');
  const [collectMethod, setCollectMethod] = useState<Transaction['paymentMethod']>('cash');
  const [collectNote, setCollectNote] = useState('পূর্বের বকেয়া বিল হতে নগদ জমা');
  const [collecting, setCollecting] = useState(false);
  const [collectSuccessMsg, setCollectSuccessMsg] = useState(false);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      if (dueFilter === 'DUE_ONLY' && c.totalDue <= 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery, dueFilter]);

  const activeCustomer = useMemo(() => {
    return (
      customers.find((c) => c.id === selectedCustomerId) ||
      filteredCustomers[0] ||
      customers[0] ||
      null
    );
  }, [customers, selectedCustomerId, filteredCustomers]);

  const customerHistory = useMemo(() => {
    if (!activeCustomer) return [];
    return transactions.filter(
      (tx) =>
        tx.partyId === activeCustomer.id ||
        tx.partyName.toLowerCase() === activeCustomer.name.toLowerCase()
    );
  }, [transactions, activeCustomer]);

  const totals = useMemo(() => {
    let totalDueAll = 0;
    let totalPurchasedAll = 0;
    let totalPaidAll = 0;
    let dueCustCount = 0;
    for (const c of customers) {
      totalDueAll += c.totalDue;
      totalPurchasedAll += c.totalPurchased;
      totalPaidAll += c.totalPaid;
      if (c.totalDue > 0) dueCustCount++;
    }
    return { totalDueAll, totalPurchasedAll, totalPaidAll, dueCustCount };
  }, [customers]);

  const openAddCustomerModal = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustPurchased('0');
    setCustPaid('0');
    setCustDue('0');
    setShowCustModal(true);
  };

  const openEditCustomerModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone);
    setCustAddress(cust.address);
    setCustPurchased(String(cust.totalPurchased));
    setCustPaid(String(cust.totalPaid));
    setCustDue(String(cust.totalDue));
    setShowCustModal(true);
  };

  const handleSaveCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return;
    setSavingCustomer(true);
    try {
      const dueVal = Math.max(0, parseFloat(custDue) || 0);
      const paidVal = Math.max(0, parseFloat(custPaid) || 0);
      const purchasedVal = editingCustomer
        ? Math.max(0, parseFloat(custPurchased) || dueVal + paidVal)
        : dueVal;

      await onSaveCustomer(
        {
          name: custName.trim(),
          phone: custPhone.trim(),
          address: custAddress.trim() || 'ঢাকা',
          totalPurchased: purchasedVal,
          totalPaid: paidVal,
          totalDue: dueVal,
        },
        editingCustomer?.id
      );
      setShowCustModal(false);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleDueCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    const amt = parseFloat(collectAmountStr);
    if (Number.isNaN(amt) || amt <= 0) return;
    setCollecting(true);
    try {
      await onCollectDuePayment({
        customer: activeCustomer,
        amount: Math.min(activeCustomer.totalDue, amt),
        paymentMethod: collectMethod,
        note: collectNote.trim() || 'পূর্বের বকেয়া বিল হতে আদায়',
      });
      setCollectAmountStr('');
      setCollectSuccessMsg(true);
      setTimeout(() => setCollectSuccessMsg(false), 2000);
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">নিবন্ধিত লেজার কাস্টমার</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {customers.length} জন
          </div>
          <div className="text-xs text-slate-500 mt-1">
            বাকি আছে এমন কাস্টমার: {totals.dueCustCount} জন
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">কাস্টমারদের মোট ওষুধ ক্রয়</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            ৳{totals.totalPurchasedAll.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">সকল লেজার খাতার সম্মিলিত হিসাব</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">মোট পরিশোধিত (Total Paid)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            ৳{totals.totalPaidAll.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">নগদ ও বিকাশ/নগদ জমা</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">মোট বকেয়া পাওনা (Total Due)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600 mt-1">
            ৳{totals.totalDueAll.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">কাস্টমারদের নিকট বর্তমান পাওনা</div>
        </div>
      </div>

      {/* Main Split: Left 5 Cols Customer List, Right 7 Cols Individual Customer Ledger & Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Customer Directory */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">কাস্টমার লেজার তালিকা</h2>
              <p className="text-xs text-slate-500">
                কাস্টমার দেখা, এডিট ও ডিলিট করার পূর্ণ সুবিধা
              </p>
            </div>
            <button
              type="button"
              onClick={openAddCustomerModal}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> নতুন কাস্টমার
            </button>
          </div>

          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:border-teal-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                  title="সার্চ মুছে ফেলুন"
                  aria-label="সার্চ মুছে ফেলুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded">
              <button
                type="button"
                onClick={() => setDueFilter('ALL')}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  dueFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল কাস্টমার ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setDueFilter('DUE_ONLY')}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  dueFilter === 'DUE_ONLY'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বকেয়া আছে ({totals.dueCustCount})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-200 max-h-[540px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-slate-500">
                কোনো কাস্টমার পাওয়া যায়নি।
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = activeCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{c.name}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">{c.phone}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{c.address}</div>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="text-xs text-slate-500">বর্তমান বাকি</div>
                        <div
                          className={`text-sm font-bold ${
                            c.totalDue > 0 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          ৳{c.totalDue.toFixed(2)}
                        </div>
                        <div
                          className="flex items-center justify-end gap-1 mt-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openEditCustomerModal(c)}
                            className="p-1 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            title="কাস্টমার এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(c.id)}
                            className="p-1 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded cursor-pointer"
                            title="কাস্টমার ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Individual Customer Ledger Details & Transaction History */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          {activeCustomer ? (
            <div>
              {/* Customer Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
                      <BookOpen className="w-4 h-4" />
                      কাস্টমারের ব্যক্তিগত লেজার খাতা ও ট্রানজেকশন হিস্ট্রি
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {activeCustomer.name}
                    </h2>
                    <div className="text-xs text-slate-600 mt-0.5">
                      মোবাইল: <span className="font-mono">{activeCustomer.phone}</span> · ঠিকানা:{' '}
                      {activeCustomer.address}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-md border border-slate-200 font-mono tabular-nums text-right shrink-0">
                    <div>
                      <div className="text-xs text-slate-500">মোট ক্রয়</div>
                      <div className="text-sm font-bold text-slate-900">
                        ৳{activeCustomer.totalPurchased.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">মোট জমা</div>
                      <div className="text-sm font-bold text-emerald-700">
                        ৳{activeCustomer.totalPaid.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">বকেয়া বাকি</div>
                      <div
                        className={`text-sm font-bold ${
                          activeCustomer.totalDue > 0 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        ৳{activeCustomer.totalDue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collect Due Payment Form */}
                {activeCustomer.totalDue > 0 && (
                  <form
                    onSubmit={handleDueCollectionSubmit}
                    className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
                  >
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        বকেয়া আদায় এন্ট্রি (সর্বোচ্চ ৳{activeCustomer.totalDue.toFixed(2)})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max={activeCustomer.totalDue}
                        required
                        value={collectAmountStr}
                        onChange={(e) => setCollectAmountStr(e.target.value)}
                        placeholder="আদায়কৃত টাকার পরিমাণ লিখুন..."
                        className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        মাধ্যম
                      </label>
                      <select
                        value={collectMethod}
                        onChange={(e) =>
                          setCollectMethod(e.target.value as Transaction['paymentMethod'])
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                      >
                        <option value="cash">নগদ (Cash)</option>
                        <option value="bkash">বিকাশ (bKash)</option>
                        <option value="nagad">নগদ (Nagad)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={collecting}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      {collecting ? 'জমা হচ্ছে...' : 'বকেয়া জমা নিন'}
                    </button>
                  </form>
                )}

                {collectSuccessMsg && (
                  <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    বকেয়া আদায় সফলভাবে লেজার খাতায় এবং দৈনিক ক্যাশবুকে লিপিবদ্ধ হয়েছে (
                    {activeStaff.roleTitle === 'owner' ? 'Owner' : activeStaff.name})।
                  </div>
                )}
              </div>

              {/* Chronological Transaction Ledger Table */}
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900">
                  লেনদেন হিস্ট্রি ও ওষুধের মেমো বিবরণী ({customerHistory.length}টি লেনদেন)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-4">তারিখ ও মেমো</th>
                      <th className="py-2.5 px-3">ধরন</th>
                      <th className="py-2.5 px-3">ওষুধ / নোট বিবরণ</th>
                      <th className="py-2.5 px-3">অপারেটর</th>
                      <th className="py-2.5 px-3 text-right">মোট বিল (৳)</th>
                      <th className="py-2.5 px-3 text-right">জমা (৳)</th>
                      <th className="py-2.5 px-3 text-right">বাকি (৳)</th>
                      <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {customerHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 px-4 text-center text-xs text-slate-500">
                          এই কাস্টমারের নামে এখনো কোনো মেমো বা লেনদেন রেকর্ড করা হয়নি।
                        </td>
                      </tr>
                    ) : (
                      customerHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-xs">
                            <div className="font-semibold text-slate-900">{tx.dateStr}</div>
                            <div className="text-slate-500">{tx.invoiceNo}</div>
                          </td>
                          <td className="py-2.5 px-3 text-xs font-medium">
                            {tx.txType === 'sale' ? (
                              <span className="text-teal-700">ওষুধ ক্রয় মেমো</span>
                            ) : (
                              <span className="text-emerald-700">
                                বকেয়া জমা ({tx.paymentMethod})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-800 font-mono">
                            <div className="space-y-0.5">
                              {formatTransactionItemsList(tx.itemsSummary).map((line, idx) => (
                                <div key={idx} className="whitespace-nowrap">
                                  {line}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs font-medium text-slate-800">
                            {tx.staffRole === 'owner' ? 'Owner' : tx.staffName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-slate-900">
                            {tx.txType === 'sale' ? `৳${tx.grandTotal.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-emerald-700">
                            ৳{tx.paidAmount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-red-600">
                            {tx.dueAmount > 0 ? `৳${tx.dueAmount.toFixed(2)}` : '৳0.00'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {tx.txType === 'sale' && onStartEditInvoice && (
                                <button
                                  type="button"
                                  onClick={() => onStartEditInvoice(tx)}
                                  className="px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded flex items-center gap-1 cursor-pointer"
                                  title="ইনভয়েস বিল্ডারে এডিট করুন"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  এডিট
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDeleteTransaction(tx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                title="লেনদেন মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-slate-500">
              বাম পাশ থেকে যেকোনো কাস্টমার নির্বাচন করুন অথবা নতুন কাস্টমার যুক্ত করুন।
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showCustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer
                  ? 'কাস্টমার লেজার তথ্য এডিট করুন'
                  : 'নতুন কাস্টমার লেজার খাতা খুলুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCustModal(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerSubmit} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  কাস্টমারের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ঠিকানা *
                </label>
                <input
                  type="text"
                  required
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="বাসা/রোড, এলাকা"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
              </div>

              {editingCustomer ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      মোট ক্রয় (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={custPurchased}
                      onChange={(e) => setCustPurchased(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      মোট জমা (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={custPaid}
                      onChange={(e) => setCustPaid(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      বর্তমান বাকি (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={custDue}
                      onChange={(e) => setCustDue(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-200 rounded-md"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    প্রারম্ভিক বকেয়া ব্যালেন্স (Opening Due ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={custDue}
                    onChange={(e) => setCustDue(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCustModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {savingCustomer ? 'সংরক্ষণ হচ্ছে...' : 'লেজার খাতা সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
