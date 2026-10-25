export type AppLanguage = 'bn' | 'en';

export const LANGUAGE_STORAGE_KEY = 'iqbal_pharmacy_app_lang_v1';

export function getSavedLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch {
    // ignore
  }
  return 'bn';
}

export function saveLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export const translations = {
  bn: {
    // App header & brand
    appName: 'ওষুধ বাজার ও ফার্মেসি পিওএস',
    appSubtitle: 'স্মার্ট ফার্মেসি ইনভেন্টরি, নির্ভুল মূল্য যাচাই ও স্বয়ংক্রিয় হিসাব',
    shopFallbackName: 'ইকবাল ফার্মেসী',

    // Nav tabs
    tabDashboard: 'ড্যাশবোর্ড',
    tabCompare: 'মূল্য ও গ্রুপ যাচাই',
    tabPos: 'বিক্রয় ও দৈনিক হিসাব',
    tabInventory: 'ইনভেন্টরি ও স্টক',
    tabCustomerLedger: 'কাস্টমার লেজার',
    tabStaffShop: 'স্টাফ ও দোকান সেটিংস',

    // Top bar actions & status
    cloudConnected: 'ক্লাউড সংযুক্ত',
    cloudOffline: 'অফলাইন মোড',
    online: 'অনলাইন',
    offline: 'অফলাইন',
    downloadBackup: 'ব্যাকআপ ডাউনলোড',
    restoreBackup: 'রিস্টোর',
    purgeCache: 'ক্যাশ মুছুন',
    cloudLogin: 'ক্লাউড লগইন',
    accountLogout: 'লগআউট',
    confirmLogout: 'আপনি কি নিশ্চিত যে একাউন্ট ও ক্লাউড থেকে লগআউট করতে চান?',
    loggedOutNotice: 'আপনি বর্তমানে লগআউট অবস্থায় আছেন। ক্লাউড সিঙ্ক চালু করতে লগইন করুন।',
    loginNow: 'লগইন করুন',

    // Price and calculation terms
    currencySymbol: '৳',
    currencyName: 'টাকা',
    unitPrice: 'একক বিক্রয় মূল্য',
    purchasePrice: 'একক ক্রয় মূল্য',
    mrpPrice: 'খুচরা বিক্রয় দর',
    discount: 'ছাড়',
    grandTotal: 'সর্বমোট',
    subTotal: 'মোট মূল্য',
    paidAmount: 'পরিশোধিত',
    dueAmount: 'বকেয়া',
    quantity: 'পরিমাণ',
    pcs: 'পিস',
    strip: 'পাতা',
    box: 'বক্স',
    totalPcs: 'মোট পিস',
    packRate: 'প্যাক বা পাতা দর',
    exactCalculationNotice: 'টাকার হিসেবে দশমিকের পর যেকোনো সংখ্যা পরিমাণ স্বয়ংক্রিয় ও নির্ভুলভাবে হিসেব হবে।',

    // Buttons & Common Actions
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    delete: 'মুছে ফেলুন',
    edit: 'সম্পাদনা',
    search: 'অনুসন্ধান করুন...',
    filter: 'ফিল্টার',
    print: 'প্রিন্ট',
    export: 'এক্সপোর্ট',
    close: 'বন্ধ করুন',
    confirm: 'নিশ্চিত করুন',
    success: 'সফল',
    error: 'ত্রুটি',
    loading: 'লোড হচ্ছে...',
    actions: 'অ্যাকশন',

    // Staff & Roles
    roleOwner: 'দোকান মালিক',
    roleManager: 'ম্যানেজার',
    rolePharmacist: 'ফার্মাসিস্ট',
    roleSalesman: 'বিক্রয়কর্মী',
    counter: 'কাউন্টার',

    // Payment methods
    paymentCash: 'নগদ ক্যাশ',
    paymentBkash: 'বিকাশ',
    paymentNagad: 'নগদ',
    paymentCard: 'কার্ড',
    paymentDue: 'সম্পূর্ণ বকেয়া',

    // Scanner
    scanMedicineBox: 'ক্যামেরা দিয়ে ওষুধের বক্স স্ক্যান',
    captureImage: 'ছবি তুলুন',
    retake: 'আবার তুলুন',
    applyToInvoice: 'বিলে যুক্ত করুন',

    // Language toggle
    langToggleLabel: 'English',
    currentLanguageName: 'বাংলা',
  },
  en: {
    // App header & brand
    appName: 'OshudhBazar & PharmaPOS BD',
    appSubtitle: 'Smart Pharmacy Inventory, Accurate Price Intelligence & Automated Accounts',
    shopFallbackName: 'Iqbal Pharmacy',

    // Nav tabs
    tabDashboard: 'Dashboard',
    tabCompare: 'Price & Group Compare',
    tabPos: 'POS & Daily Accounts',
    tabInventory: 'Inventory & Stock',
    tabCustomerLedger: 'Customer Ledger',
    tabStaffShop: 'Staff & Shop Settings',

    // Top bar actions & status
    cloudConnected: 'Cloud Connected',
    cloudOffline: 'Offline Mode',
    online: 'Online',
    offline: 'Offline',
    downloadBackup: 'Download Backup',
    restoreBackup: 'Restore Backup',
    purgeCache: 'Purge Cache',
    cloudLogin: 'Cloud Login',
    accountLogout: 'Logout',
    confirmLogout: 'Are you sure you want to log out from your account and cloud?',
    loggedOutNotice: 'You are currently logged out. Log in to enable live cloud sync.',
    loginNow: 'Log In',

    // Price and calculation terms
    currencySymbol: 'BDT ',
    currencyName: 'Taka',
    unitPrice: 'Unit Selling Price',
    purchasePrice: 'Unit Purchase Cost',
    mrpPrice: 'Retail MRP Price',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    subTotal: 'Subtotal',
    paidAmount: 'Paid Amount',
    dueAmount: 'Due Balance',
    quantity: 'Quantity',
    pcs: 'Pcs',
    strip: 'Strip',
    box: 'Box',
    totalPcs: 'Total Pcs',
    packRate: 'Pack / Strip Rate',
    exactCalculationNotice: 'Supports arbitrary precision calculations after the decimal point.',

    // Buttons & Common Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search medicines, generics, brands...',
    filter: 'Filter',
    print: 'Print',
    export: 'Export',
    close: 'Close',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    actions: 'Actions',

    // Staff & Roles
    roleOwner: 'Shop Owner',
    roleManager: 'Manager',
    rolePharmacist: 'Pharmacist',
    roleSalesman: 'Sales Executive',
    counter: 'Counter',

    // Payment methods
    paymentCash: 'Cash',
    paymentBkash: 'bKash',
    paymentNagad: 'Nagad',
    paymentCard: 'Card',
    paymentDue: 'Full Credit / Due',

    // Scanner
    scanMedicineBox: 'Camera Medicine Box Scanner',
    captureImage: 'Capture Photo',
    retake: 'Retake',
    applyToInvoice: 'Apply to Invoice',

    // Language toggle
    langToggleLabel: 'বাংলা',
    currentLanguageName: 'English',
  },
} as const;

export type TranslationKey = keyof typeof translations.bn;

export function t(key: TranslationKey, lang: AppLanguage): string {
  const table = translations[lang] || translations.bn;
  return table[key] || translations.bn[key] || String(key);
}
