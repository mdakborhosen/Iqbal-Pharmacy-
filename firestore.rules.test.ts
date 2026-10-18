/**
 * Security Rules Red Team Verification Suite ("Dirty Dozen" Payloads)
 * Verifies all 12 adversarial payloads defined in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Create (ownerId mismatch)',
    collection: 'customers',
    docId: 'cust_1',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      ownerId: 'user_B',
      name: 'রহিম উদ্দিন',
      phone: '01711000000',
      address: 'মিরপুর ১০, ঢাকা',
      totalPurchased: 0,
      totalPaid: 0,
      totalDue: 0,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collection: 'inventory',
    docId: 'item_1',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: false,
    payload: {
      ownerId: 'user_A',
      medicineId: 'med_1',
      brandName: 'Napa',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Create (isAdmin ghost key)',
    collection: 'shops',
    docId: 'shop_1',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      ownerId: 'user_A',
      shopName: 'জনতা ফার্মেসি',
      licenseNo: 'DGDA-12904',
      phone: '01711223344',
      address: 'ধানমন্ডি, ঢাকা',
      isAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Update',
    collection: 'customers',
    docId: 'cust_1',
    operation: 'update',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      creditLimit: 9999999,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Owner Hijack on Update',
    collection: 'shops',
    docId: 'shop_1',
    operation: 'update',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      ownerId: 'user_B',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immortal createdAt Tampering on Update',
    collection: 'inventory',
    docId: 'item_1',
    operation: 'update',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Forged Client Timestamp on Create',
    collection: 'transactions',
    docId: 'tx_1',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      createdAt: '1999-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Cross-Tenant PII Read (get)',
    collection: 'customers',
    docId: 'cust_owned_by_A',
    operation: 'get',
    authUid: 'user_B',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Blanket Unfiltered List Query Across Tenants',
    collection: 'customers',
    docId: '*',
    operation: 'list',
    authUid: 'user_B',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'ID Poisoning Attack (Invalid characters in document ID)',
    collection: 'inventory',
    docId: 'bad$id!with*spaces and slashes',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning / Negative Stock Quantity',
    collection: 'inventory',
    docId: 'item_1',
    operation: 'update',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      stockQty: -500,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Invalid Enum State Injection on Transaction',
    collection: 'transactions',
    docId: 'tx_1',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: {
      txType: 'unauthorized_refund',
      staffRole: 'superadmin',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
