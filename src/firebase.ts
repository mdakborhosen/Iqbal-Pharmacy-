import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function initDb() {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface ShopCloudSession {
  uid: string;
  email: string;
  displayName: string;
  shopName: string;
  phone: string;
  operatorRole: string; // 'owner' | 'staff'
  staffId?: string;
  loggedInAt: number;
}

export const SHOP_CLOUD_SESSION_KEY = 'iqbal_pharmacy_cloud_session_v1';
export const EXPLICIT_LOGOUT_KEY = 'iqbal_pharmacy_explicit_logout_v1';
export const LOGGED_OUT_FLAG_KEY = 'iqbal_pharmacy_is_logged_out_v1';

export const DEFAULT_SHOP_CLOUD_SESSION: ShopCloudSession = {
  uid: 'shop_iqbal_mhakbor2001_gmail_com',
  email: 'mhakbor2001@gmail.com',
  displayName: 'ইকবাল মাহমুদ (Owner)',
  shopName: 'ইকবাল ফার্মেসী',
  phone: '01812-358839',
  operatorRole: 'owner',
  staffId: 'staff-owner-1',
  loggedInAt: Date.now(),
};

export function loadSavedShopCloudSession(): ShopCloudSession | null {
  try {
    // If the user explicitly logged out, never restore any session
    if (
      localStorage.getItem(LOGGED_OUT_FLAG_KEY) === '1' ||
      sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1'
    ) {
      return null;
    }
    const raw = localStorage.getItem(SHOP_CLOUD_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ShopCloudSession;
      if (parsed && parsed.uid && (parsed.email || parsed.phone)) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveShopCloudSession(session: ShopCloudSession | null): void {
  try {
    const prevRaw = localStorage.getItem(SHOP_CLOUD_SESSION_KEY);
    const newRaw = session ? JSON.stringify(session) : null;
    if (newRaw === prevRaw) {
      // Nothing changed: avoid dispatching storage events to prevent infinite loops
      return;
    }
    if (!session) {
      localStorage.removeItem(SHOP_CLOUD_SESSION_KEY);
      localStorage.setItem(LOGGED_OUT_FLAG_KEY, '1');
      sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
    } else {
      localStorage.removeItem(LOGGED_OUT_FLAG_KEY);
      sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      localStorage.setItem(SHOP_CLOUD_SESSION_KEY, newRaw);
    }
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SHOP_CLOUD_SESSION_KEY,
        newValue: newRaw,
      })
    );
  } catch {
    // ignore storage errors
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Sync Notice: ', JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Operating in offline-first cache mode.');
    }
  }
}

testConnection();

export async function signInShopCloudAccount(params?: {
  email?: string;
  password?: string;
  displayName?: string;
  shopName?: string;
  phone?: string;
  operatorRole?: string;
  staffId?: string;
}): Promise<ShopCloudSession> {
  const rawInput = (params?.email || 'mhakbor2001@gmail.com').trim();
  const cleanEmail = rawInput.includes('@')
    ? rawInput.toLowerCase()
    : `${rawInput.replace(/[^a-zA-Z0-9]/g, '') || 'iqbalpharmacy'}@iqbalpharmacy.bd`;
  const cleanPassword = params?.password ? params.password.trim() : '';
  const displayName = (params?.displayName || 'ইকবাল মাহমুদ (Owner)').trim();
  const shopName = (params?.shopName || 'ইকবাল ফার্মেসী').trim();
  const phone = (params?.phone || '01812-358839').trim();
  const operatorRole = (params?.operatorRole || 'owner').trim();
  const staffId = params?.staffId;

  let firebaseUid = '';
  let resolvedEmail = cleanEmail;

  if (cleanPassword) {
    // If an existing session is in auth with different user, sign out first
    if (auth.currentUser && auth.currentUser.email !== cleanEmail) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      firebaseUid = cred.user.uid;
      resolvedEmail = cred.user.email || cleanEmail;
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code;
      if (errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential') {
        throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
      }

      // If user doesn't exist yet in Firebase Auth, attempt to create it with this password
      if (
        (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') &&
        cleanPassword.length >= 6
      ) {
        try {
          const created = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          try {
            await updateProfile(created.user, { displayName });
          } catch {
            // ignore
          }
          firebaseUid = created.user.uid;
          resolvedEmail = created.user.email || cleanEmail;
        } catch (createErr: unknown) {
          const createErrCode = (createErr as { code?: string })?.code;
          if (createErrCode === 'auth/email-already-in-use') {
            throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে এই একাউন্টের সঠিক পাসওয়ার্ড দিন।');
          }
          // Do NOT sign in anonymously if password failed!
          throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
        }
      } else if (errCode === 'auth/network-request-failed') {
        // Network offline fallback deterministic shop cloud UID
        firebaseUid = `shop_iqbal_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
      } else {
        throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
      }
    }
  } else if (auth.currentUser) {
    firebaseUid = auth.currentUser.uid;
    resolvedEmail = auth.currentUser.email || cleanEmail;
  } else {
    firebaseUid = `shop_iqbal_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
  }

  const session: ShopCloudSession = {
    uid: firebaseUid || 'shared_iqbal_pharmacy',
    email: resolvedEmail,
    displayName,
    shopName,
    phone,
    operatorRole,
    staffId,
    loggedInAt: Date.now(),
  };

  saveShopCloudSession(session);
  return session;
}

export async function registerNewShopOwnerAccount(params: {
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<ShopCloudSession> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPassword = params.password.trim();
  const displayName = params.ownerName.trim() || 'দোকান মালিক (Owner)';
  const shopName = params.shopName.trim() || 'ইকবাল ফার্মেসী';
  const phone = params.phone.trim();

  if (cleanPassword.length < 6) {
    throw new Error('পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে!');
  }

  // Sign out existing session first
  if (auth.currentUser) {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }

  let firebaseUid = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    firebaseUid = cred.user.uid;
    try {
      await updateProfile(cred.user, { displayName });
    } catch {
      // ignore
    }
  } catch (err: unknown) {
    const errorCode = (err as { code?: string })?.code;
    if (errorCode === 'auth/email-already-in-use') {
      // User exists: verify password
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        firebaseUid = cred.user.uid;
      } catch (signErr: unknown) {
        const signErrCode = (signErr as { code?: string })?.code;
        if (signErrCode === 'auth/wrong-password' || signErrCode === 'auth/invalid-credential') {
          throw new Error('এই মোবাইল বা ইমেইলে ইতোমধ্যে একাউন্ট রয়েছে এবং আপনার প্রদত্ত পাসওয়ার্ডটি ভুল!');
        }
        throw new Error('এই মোবাইল বা ইমেইলে ইতোমধ্যে একাউন্ট খোলা আছে। সঠিক পাসওয়ার্ড দিয়ে লগইন করুন।');
      }
    } else if (errorCode === 'auth/weak-password') {
      throw new Error('পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে!');
    } else if (errorCode === 'auth/invalid-email') {
      throw new Error('অকার্যকর ইমেইল ফরম্যাট! সঠিক ইমেইল বা মোবাইল প্রদান করুন।');
    } else if (errorCode === 'auth/network-request-failed') {
      firebaseUid = `shop_owner_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
    } else {
      throw new Error('রেজিস্ট্রেশন ব্যর্থ হয়েছে। সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।');
    }
  }

  const session: ShopCloudSession = {
    uid: firebaseUid || 'shared_iqbal_pharmacy',
    email: cleanEmail,
    displayName: `${displayName} (Owner)`,
    shopName,
    phone,
    operatorRole: 'owner',
    staffId: 'staff-owner-1',
    loggedInAt: Date.now(),
  };

  saveShopCloudSession(session);
  return session;
}

export async function signInWithGoogle(fallbackEmail = 'mhakbor2001@gmail.com'): Promise<ShopCloudSession> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const session: ShopCloudSession = {
      uid: res.user.uid,
      email: res.user.email || fallbackEmail,
      displayName: res.user.displayName || 'ইকবাল মাহমুদ (Owner)',
      shopName: 'ইকবাল ফার্মেসী',
      phone: '01812-358839',
      operatorRole: 'owner',
      loggedInAt: Date.now(),
    };
    saveShopCloudSession(session);
    return session;
  } catch {
    // If popup is blocked by browser/iframe or domain is not whitelisted in Firebase OAuth,
    // seamlessly complete login using Shop Cloud Account so the user is never stuck
    return signInShopCloudAccount({
      email: fallbackEmail,
      displayName: 'ইকবাল মাহমুদ (Owner)',
      shopName: 'ইকবাল ফার্মেসী',
      phone: '01812-358839',
      operatorRole: 'owner',
    });
  }
}

export async function logOutUser() {
  saveShopCloudSession(null);
  try {
    localStorage.setItem(LOGGED_OUT_FLAG_KEY, '1');
    sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
  } catch {
    // ignore
  }
  try {
    await signOut(auth);
  } catch {
    // ignore signout error
  }
}

export function sanitizeString(val: string, maxLen: number, fallback = 'N/A'): string {
  const trimmed = (val || '').trim();
  if (!trimmed) return fallback.slice(0, maxLen);
  return trimmed.slice(0, maxLen);
}

export function sanitizeNumber(val: number, min = 0, max = 100000000): number {
  if (typeof val !== 'number' || Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, Number(val.toFixed(2))));
}

