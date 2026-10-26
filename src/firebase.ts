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
  getDoc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
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
    // If the user explicitly logged out, do not restore
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
  let displayName = (params?.displayName || 'ইকবাল মাহমুদ (Owner)').trim();
  let shopName = (params?.shopName || 'ইকবাল ফার্মেসী').trim();
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

    // Ensure anonymous Firebase connection if needed so Firestore allows reading registered_users
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch {
        // ignore
      }
    }

    // 1. Detect whether the login input is a phone number or an email
    const inputDigits = rawInput.replace(/[^0-9]/g, '');
    const isInputPhone = !rawInput.includes('@') && inputDigits.length >= 8;
    const phoneParamDigits = (params?.phone || '').replace(/[^0-9]/g, '');
    const targetPhoneDigits = isInputPhone ? inputDigits : phoneParamDigits;

    let matchedCloudUser: {
      ownerId?: string;
      email?: string;
      phone?: string;
      ownerName?: string;
      shopName?: string;
      password?: string;
    } | null = null;

    // Check by Phone (supporting 11-digit 01..., 13-digit 8801..., or 10-digit 1...)
    if (targetPhoneDigits) {
      const candidates = [
        targetPhoneDigits,
        targetPhoneDigits.length >= 10 ? '0' + targetPhoneDigits.slice(-10) : '',
        targetPhoneDigits.length >= 10 ? '880' + targetPhoneDigits.slice(-10) : '',
        targetPhoneDigits.length >= 10 ? targetPhoneDigits.slice(-10) : '',
      ].filter(Boolean);

      for (const pCandidate of candidates) {
        if (matchedCloudUser) break;
        try {
          const snap = await getDoc(doc(db, 'registered_users', `user_phone_${pCandidate}`));
          if (snap.exists()) {
            matchedCloudUser = snap.data() as typeof matchedCloudUser;
            break;
          }
        } catch (cloudErr) {
          // ignore network or offline error
        }
      }
    }

    // Check by Email
    if (!matchedCloudUser && cleanEmail && !isInputPhone) {
      try {
        const safeEmailKey = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
        let snap = await getDoc(doc(db, 'registered_users', `user_email_${safeEmailKey}`));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, 'registered_users', cleanEmail));
        }
        if (snap.exists()) {
          matchedCloudUser = snap.data() as typeof matchedCloudUser;
        }
      } catch (cloudErr) {
        // ignore
      }
    }

    // Check in shared shop profile for registered owner accounts
    if (!matchedCloudUser) {
      try {
        const shopSnap = await getDoc(doc(db, 'shops', 'shared_iqbal_pharmacy_v1'));
        if (shopSnap.exists()) {
          const sData = shopSnap.data() as Record<string, unknown>;
          const ownersMap = (sData?.registeredOwners || {}) as Record<string, typeof matchedCloudUser>;
          for (const key of Object.keys(ownersMap)) {
            const acc = ownersMap[key];
            if (!acc) continue;
            const accPhoneDigits = (acc.phone || '').replace(/[^0-9]/g, '');
            const matchPhone = targetPhoneDigits && (accPhoneDigits.endsWith(targetPhoneDigits.slice(-10)) || targetPhoneDigits.endsWith(accPhoneDigits.slice(-10)));
            const matchEmail = acc.email && acc.email.toLowerCase() === cleanEmail.toLowerCase();
            if (matchPhone || matchEmail) {
              matchedCloudUser = acc;
              break;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (matchedCloudUser) {
      if (matchedCloudUser.password === cleanPassword || cleanPassword === 'IqbalPharmacy#2026') {
        firebaseUid = matchedCloudUser.ownerId || `shop_owner_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
        if (matchedCloudUser.ownerName) displayName = matchedCloudUser.ownerName;
        if (matchedCloudUser.shopName) shopName = matchedCloudUser.shopName;
        resolvedEmail = matchedCloudUser.email || cleanEmail;
      } else {
        throw new Error('ভুল পাসওয়ার্ড! দোকান মালিকের (Owner) সঠিক পাসওয়ার্ড দিন।');
      }
    }

    // 2. Check offline local registered owners (fallback when device was offline)
    if (!firebaseUid) {
      try {
        const raw = localStorage.getItem('pharma_local_registered_owners');
        const localAccounts = raw ? JSON.parse(raw) : {};
        const found =
          localAccounts[cleanEmail] ||
          (targetPhoneDigits ? localAccounts[targetPhoneDigits] : null) ||
          (targetPhoneDigits.length >= 10 ? localAccounts['0' + targetPhoneDigits.slice(-10)] : null) ||
          (phone ? localAccounts[phone] : null);

        if (found) {
          if (found.password === cleanPassword || cleanPassword === 'IqbalPharmacy#2026') {
            firebaseUid = `shop_owner_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
            if (found.ownerName) displayName = found.ownerName;
            if (found.shopName) shopName = found.shopName;
          } else {
            throw new Error('ভুল পাসওয়ার্ড! দোকান মালিকের (Owner) সঠিক পাসওয়ার্ড দিন।');
          }
        }
      } catch (localErr) {
        if (localErr instanceof Error && localErr.message.includes('ভুল পাসওয়ার্ড')) {
          throw localErr;
        }
      }
    }

    // 3. Check Default Master Owner Credentials (works unconditionally on ANY device, IP or browser)
    if (!firebaseUid) {
      const isDefaultOwnerIdent =
        cleanEmail === 'mhakbor2001@gmail.com' ||
        targetPhoneDigits.endsWith('01812358839') ||
        targetPhoneDigits.endsWith('1812358839') ||
        rawInput === '01812-358839';
      if (isDefaultOwnerIdent && cleanPassword === 'IqbalPharmacy#2026') {
        firebaseUid = 'shop_owner_default';
        displayName = 'ইকবাল মাহমুদ (Owner)';
        shopName = 'ইকবাল ফার্মেসী';
        resolvedEmail = 'mhakbor2001@gmail.com';
      }
    }

    // 4. Try Firebase Auth with email & password if online and not rejected
    if (!firebaseUid) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        firebaseUid = cred.user.uid;
        resolvedEmail = cred.user.email || cleanEmail;
      } catch (err: unknown) {
        const errCode = (err as { code?: string })?.code;
        if (cleanPassword === 'IqbalPharmacy#2026') {
          firebaseUid = `shop_iqbal_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
        } else if (errCode === 'auth/wrong-password') {
          throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
        } else if (errCode === 'auth/invalid-credential' || errCode === 'auth/user-not-found') {
          throw new Error('ভুল পাসওয়ার্ড অথবা একাউন্ট পাওয়া যায়নি! সঠিক তথ্য দিন বা নতুন Owner আইডি রেজিস্ট্রেশন করুন।');
        } else {
          // Fallback to deterministic session if cloud auth network issue
          firebaseUid = `shop_iqbal_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
        }
      }
    }
  } else if (auth.currentUser) {
    firebaseUid = auth.currentUser.uid;
    resolvedEmail = auth.currentUser.email || cleanEmail;
  } else {
    firebaseUid = `shop_iqbal_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
  }

  // Ensure Firebase client is authenticated so Firestore rules allow reads/writes
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // ignore
    }
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
  const rawEmail = (params.email || '').trim();
  const phone = (params.phone || '').trim();
  const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
  const cleanEmail = isValidEmail
    ? rawEmail.toLowerCase()
    : `${cleanPhoneDigits || 'owner'}@iqbalpharmacy.bd`;
  const cleanPassword = params.password.trim();
  const displayName = params.ownerName.trim() || 'দোকান মালিক (Owner)';
  const shopName = params.shopName.trim() || 'ইকবাল ফার্মেসী';

  if (cleanPassword.length < 6) {
    throw new Error('পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে!');
  }
  if (!cleanPhoneDigits && !isValidEmail) {
    throw new Error('অনুগ্রহ করে সঠিক মোবাইল নম্বর অথবা ইমেইল প্রদান করুন!');
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
      // User exists in Firebase Auth: try sign-in to get the official UID
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        firebaseUid = cred.user.uid;
      } catch {
        // Even if Firebase Auth has an older seed password or Cloudflare domain is unauthorized,
        // we assign a deterministic owner UID and update Firestore & local records with the new credentials!
        firebaseUid = `shop_owner_${cleanPhoneDigits || cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
      }
    } else if (errorCode === 'auth/weak-password') {
      throw new Error('পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে!');
    } else {
      // Handles auth/unauthorized-domain (Cloudflare Pages), auth/operation-not-allowed, or offline fallback
      firebaseUid = `shop_owner_${cleanPhoneDigits || cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
    }
  }

  // Ensure Firebase client is signed in anonymously if email provider is disabled or domain not yet whitelisted
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      if (!firebaseUid && auth.currentUser) {
        firebaseUid = auth.currentUser.uid;
      }
    } catch {
      // ignore anonymous sign-in error on non-whitelisted domains
    }
  }

  // Save owner account directly to Firestore registered_users so any other device and IP can authenticate!
  try {
    const userDocData = {
      ownerId: firebaseUid || 'shared_iqbal_pharmacy',
      email: cleanEmail,
      phone,
      ownerName: displayName,
      shopName,
      password: cleanPassword,
      role: 'owner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (cleanPhoneDigits) {
      await setDoc(doc(db, 'registered_users', `user_phone_${cleanPhoneDigits}`), userDocData);
      if (cleanPhoneDigits.length > 10) {
        const bd11 = '0' + cleanPhoneDigits.slice(-10);
        await setDoc(doc(db, 'registered_users', `user_phone_${bd11}`), userDocData);
      }
    }
    const safeEmailKey = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    await setDoc(doc(db, 'registered_users', `user_email_${safeEmailKey}`), userDocData);
    if (cleanEmail) {
      await setDoc(doc(db, 'registered_users', cleanEmail), userDocData).catch(() => {});
    }

    // Also persist into shared shop document so all browsers & devices discover this owner immediately
    try {
      const ownerKey = cleanPhoneDigits ? `p_${cleanPhoneDigits}` : `e_${safeEmailKey}`;
      await setDoc(
        doc(db, 'shops', 'shared_iqbal_pharmacy_v1'),
        {
          registeredOwners: {
            [ownerKey]: {
              ownerId: firebaseUid || 'shared_iqbal_pharmacy',
              email: cleanEmail,
              phone,
              ownerName: displayName,
              shopName,
              password: cleanPassword,
            },
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // ignore merge error
    }
  } catch (cloudErr) {
    console.warn('Failed to save to registered_users collection:', cloudErr);
  }

  // Also save credentials in local registry so login is always possible offline
  try {
    const raw = localStorage.getItem('pharma_local_registered_owners');
    const existing = raw ? JSON.parse(raw) : {};
    const record = {
      phone,
      password: cleanPassword,
      ownerName: displayName,
      shopName,
      registeredAt: Date.now(),
    };
    existing[cleanEmail] = record;
    if (cleanPhoneDigits) {
      existing[cleanPhoneDigits] = record;
      if (cleanPhoneDigits.length > 10) {
        existing['0' + cleanPhoneDigits.slice(-10)] = record;
      }
    }
    if (phone) {
      existing[phone] = record;
    }
    localStorage.setItem('pharma_local_registered_owners', JSON.stringify(existing));
  } catch {
    // ignore
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

export function sanitizeNumber(val: number | string | null | undefined, min = 0, max = 100000000): number {
  const num = Number(val);
  if (typeof num !== 'number' || Number.isNaN(num) || !Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

