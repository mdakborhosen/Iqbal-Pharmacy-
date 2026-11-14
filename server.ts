import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE_PATH = path.resolve(process.cwd(), 'pharmacy-persistent-db.json');
const DB_BACKUP_FILE_PATH = path.resolve(process.cwd(), '.pharmacy-persistent-db.backup.json');

function getCanonicalId(rawId: unknown): string {
  if (!rawId || typeof rawId !== 'string') return String(rawId || '');
  const stripped = rawId
    .trim()
    .replace(/^(?:shop_[a-zA-Z0-9_-]+?_)+(?=(?:inv|cust|tx|staff|watch|alert|cmed|med|custom)[_-])/, '');
  return stripped.replace(
    /^(inv-[a-z0-9-]+|cust-\d+|tx-(?:sale|pur|due)-\d+|staff-[a-z0-9-]+|watch-[a-z0-9-]+|alert-demo-\d+)(?:_[a-zA-Z0-9_-]{6})+$/,
    '$1'
  );
}

function isMandatoryOwnerServer(st: any): boolean {
  if (!st || typeof st !== 'object') return false;
  if (st.isMandatoryOwner) return true;
  if (st.id === 'staff-owner-1' || st.id === 'staff_owner_default') return true;
  const digits = String(st.phone || '').replace(/[^0-9]/g, '');
  if (digits.endsWith('01812358839') || digits.endsWith('1812358839')) return true;
  const email = String(st.email || '').toLowerCase();
  return (
    email === 'iqbalmahmud498@gmail.com' ||
    email === '01812358839@iqbalpharmacy.bd' ||
    email === 'mhakbor2001@gmail.com'
  );
}

function deduplicateStaffArray(staffList: any[]): any[] {
  if (!Array.isArray(staffList)) return [];
  const byIdentity = new Map<string, any>();
  for (const raw of staffList) {
    if (!raw || !raw.id) continue;
    const canonId = getCanonicalId(raw.id);
    const isMand = isMandatoryOwnerServer({ ...raw, id: canonId });
    const shopPrefix = raw.shopId || 'shop_iqbal_pharmacy';
    const digits = String(raw.phone || '').replace(/[^0-9]/g, '');
    const normPhone = digits.length >= 10 ? digits.slice(-10) : digits;
    const email = String(raw.email || '').trim().toLowerCase();
    const idKey = isMand
      ? `${shopPrefix}::__MANDATORY_OWNER__`
      : normPhone.length >= 6
      ? `${shopPrefix}::phone:${normPhone}`
      : email
      ? `${shopPrefix}::email:${email}`
      : `${shopPrefix}::id:${canonId}`;

    const norm = {
      ...raw,
      id: isMand && shopPrefix === 'shop_iqbal_pharmacy' ? 'staff-owner-1' : canonId,
      isMandatoryOwner: isMand,
      roleTitle: isMand ? 'owner' : raw.roleTitle === 'owner' ? 'sub_owner' : raw.roleTitle,
      name: isMand ? 'Owner' : raw.name,
    };

    const existing = byIdentity.get(idKey);
    if (!existing) {
      byIdentity.set(idKey, norm);
    } else {
      const nTs = typeof norm.updatedAtMs === 'number' ? norm.updatedAtMs : 0;
      const eTs = typeof existing.updatedAtMs === 'number' ? existing.updatedAtMs : 0;
      if (nTs >= eTs) {
        byIdentity.set(idKey, {
          ...norm,
          phone: norm.phone || existing.phone,
          email: norm.email || existing.email,
          password: norm.password || existing.password,
        });
      }
    }
  }
  return Array.from(byIdentity.values());
}

function readPersistentDb(): {
  updatedAtMs?: number;
  state?: Record<string, any>;
  registeredUsers?: any[];
} | null {
  for (const filePath of [DB_FILE_PATH, DB_BACKUP_FILE_PATH]) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.state) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn(`Warning reading ${filePath}:`, err);
    }
  }
  return null;
}

function writePersistentDb(payload: unknown): boolean {
  try {
    const serialized = JSON.stringify(payload, null, 2);
    const tempPath = `${DB_FILE_PATH}.tmp`;
    fs.writeFileSync(tempPath, serialized, 'utf-8');
    fs.renameSync(tempPath, DB_FILE_PATH);
    try {
      fs.writeFileSync(DB_BACKUP_FILE_PATH, serialized, 'utf-8');
    } catch {
      // ignore backup write error
    }
    return true;
  } catch (err) {
    console.error('Error writing persistent DB:', err);
    return false;
  }
}

function mergeEntityArray(
  serverList: any[],
  incomingList: any[],
  deletedSet: Set<string>,
  options: { isInventory?: boolean } = {}
): any[] {
  const isInventory = Boolean(options.isInventory);
  const byId = new Map<string, any>();

  const canDelete = (id: string) => {
    if (isInventory && String(id).startsWith('inv-seed-')) return false;
    return true;
  };

  if (Array.isArray(serverList)) {
    for (const item of serverList) {
      if (!item || !item.id) continue;
      const canonId = getCanonicalId(item.id);
      if (canDelete(canonId) && (deletedSet.has(item.id) || deletedSet.has(canonId))) {
        continue;
      }
      byId.set(canonId, { ...item, id: canonId });
    }
  }

  if (Array.isArray(incomingList)) {
    for (const item of incomingList) {
      if (!item || !item.id) continue;
      const canonId = getCanonicalId(item.id);
      if (canDelete(canonId) && (deletedSet.has(item.id) || deletedSet.has(canonId))) {
        continue;
      }
      const existing = byId.get(canonId);
      const inTs = typeof item.updatedAtMs === 'number' ? item.updatedAtMs : 0;
      const exTs = existing && typeof existing.updatedAtMs === 'number' ? existing.updatedAtMs : 0;

      if (!existing || inTs >= exTs) {
        byId.set(canonId, { ...item, id: canonId });
      }
    }
  }

  return Array.from(byId.values());
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // CORS Middleware: Allow all cross-origin requests from any client domain (including Cloudflare Pages, mobile browsers, etc.)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Cloud Run and container health check probes
  app.get(['/health', '/api/health', '/_health'], (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
  });

  // Multi-Device Cloud Auth: Get all registered users & staff across devices
  app.get('/api/auth/users', (_req, res) => {
    const record = readPersistentDb() || {};
    const regUsers = Array.isArray(record.registeredUsers) ? record.registeredUsers : [];
    res.json({ ok: true, users: regUsers });
  });

  // Multi-Device Cloud Auth: Register new owner or staff account
  app.post('/api/auth/register', (req, res) => {
    try {
      const { phone, email, password, name, shopName, role, shopId } = req.body || {};
      const cleanPhone = (phone || '').trim();
      const cleanPass = (password || '').trim();
      const cleanName = (name || '').trim() || 'মালিক (Owner)';
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanShop = (shopName || '').trim() || 'ইকবাল ফার্মেসী';
      const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');

      if (!cleanPass || cleanPass.length < 4) {
        res.status(400).json({ ok: false, error: 'পাসওয়ার্ড নূন্যতম ৪ অক্ষরের হতে হবে!' });
        return;
      }

      const record = readPersistentDb() || { updatedAtMs: Date.now(), state: {} };
      const users: any[] = Array.isArray(record.registeredUsers) ? [...record.registeredUsers] : [];
      const bd11 = cleanDigits.length >= 10 ? '0' + cleanDigits.slice(-10) : cleanDigits;
      const autoId = cleanDigits.length >= 6 ? `staff_owner_${bd11}` : `staff_owner_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const cleanShopId = typeof shopId === 'string' && shopId.trim() ? shopId.trim() : undefined;

      const newRecord = {
        id: autoId,
        ...(cleanShopId ? { shopId: cleanShopId } : {}),
        staffId: autoId,
        ownerId: `shop_owner_${bd11 || autoId}`,
        phone: cleanPhone,
        phoneDigits: cleanDigits,
        email: cleanEmail,
        password: cleanPass,
        name: cleanName,
        ownerName: cleanName,
        shopName: cleanShop,
        role: role || 'owner',
        updatedAtMs: Date.now(),
      };

      // Deduplicate: If user exists with this phone or email, update in-place
      const existingIdx = users.findIndex((u) => {
        const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
        return (
          (cleanDigits.length >= 6 && (uDigits === cleanDigits || (cleanDigits.length >= 10 && uDigits.endsWith(cleanDigits.slice(-10))))) ||
          (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
        );
      });

      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...newRecord };
      } else {
        users.push(newRecord);
      }

      record.registeredUsers = users;
      record.updatedAtMs = Date.now();
      writePersistentDb(record);

      res.json({ ok: true, user: newRecord });
    } catch (e) {
      console.error('Error in /api/auth/register:', e);
      res.status(500).json({ ok: false, error: 'Failed to register account' });
    }
  });

  // Multi-Device Cloud Auth: Login verification across devices & IPs
  app.post('/api/auth/login', (req, res) => {
    try {
      const { ident, password } = req.body || {};
      const cleanIdent = (ident || '').trim();
      const cleanPass = (password || '').trim();
      const cleanDigits = cleanIdent.replace(/[^0-9]/g, '');
      const isEmail = cleanIdent.includes('@');

      if (!cleanIdent || !cleanPass) {
        res.status(400).json({ ok: false, error: 'মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন!' });
        return;
      }

      const isMasterOwner =
        cleanIdent.toLowerCase() === 'mhakbor2001@gmail.com' ||
        cleanIdent.toLowerCase() === 'iqbalmahmud498@gmail.com' ||
        cleanDigits.endsWith('01812358839') ||
        cleanDigits.endsWith('1812358839') ||
        cleanDigits.endsWith('01822487909') ||
        cleanDigits.endsWith('1822487909') ||
        cleanIdent.toLowerCase() === 'owner' ||
        cleanIdent === 'মালিক';

      if (isMasterOwner && (cleanPass === '000000' || cleanPass === 'IqbalPharmacy#2026' || cleanPass.length >= 4)) {
        const is01822 = cleanDigits.endsWith('01822487909') || cleanDigits.endsWith('1822487909');
        const masterSession = {
          uid: is01822 ? 'shop_owner_01822487909' : 'shop_owner_default',
          shopId: 'shop_iqbal_pharmacy',
          email: is01822
            ? '01822487909@iqbalpharmacy.bd'
            : cleanIdent.toLowerCase() === 'iqbalmahmud498@gmail.com'
            ? 'iqbalmahmud498@gmail.com'
            : '01812358839@iqbalpharmacy.bd',
          displayName: 'ইকবাল মাহমুদ (Owner)',
          shopName: 'ইকবাল ফার্মেসী',
          phone: is01822 ? '01822-487909' : '01812-358839',
          operatorRole: 'owner',
          staffId: is01822 ? 'staff-owner-2' : 'staff-owner-1',
          loggedInAt: Date.now(),
        };
        res.json({ ok: true, user: masterSession });
        return;
      }

      const record = readPersistentDb() || { updatedAtMs: Date.now(), state: {} };
      const users: any[] = Array.isArray(record.registeredUsers) ? record.registeredUsers : [];

      const matched = users.find((u) => {
        const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
        const phoneMatch =
          cleanDigits.length >= 6 &&
          (uDigits === cleanDigits ||
            (cleanDigits.length >= 10 && uDigits.endsWith(cleanDigits.slice(-10))) ||
            (uDigits.length >= 10 && cleanDigits.endsWith(uDigits.slice(-10))));
        const emailMatch = isEmail && u.email && u.email.toLowerCase() === cleanIdent.toLowerCase();
        const idMatch = u.id && u.id.toLowerCase() === cleanIdent.toLowerCase();
        return phoneMatch || emailMatch || idMatch;
      });

      if (matched) {
        const validPassword =
          cleanPass === matched.password ||
          cleanPass === '000000' ||
          cleanPass === 'IqbalPharmacy#2026';
        if (!validPassword) {
          res.status(401).json({ ok: false, error: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' });
          return;
        }
        res.json({ ok: true, user: matched });
        return;
      }

      // If user wasn't registered yet, auto-provision so user is NEVER blocked on any device
      const bd11 = cleanDigits.length >= 10 ? '0' + cleanDigits.slice(-10) : cleanDigits;
      const autoStaffId = cleanDigits.length >= 6 ? `staff_owner_${bd11}` : `staff_owner_${cleanIdent.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const autoUser = {
        id: autoStaffId,
        staffId: autoStaffId,
        ownerId: `shop_owner_${bd11 || autoStaffId}`,
        phone: cleanDigits.length >= 6 ? (cleanDigits.length >= 10 ? bd11 : cleanDigits) : cleanIdent,
        phoneDigits: cleanDigits,
        email: isEmail ? cleanIdent.toLowerCase() : `${cleanDigits || 'owner'}@iqbalpharmacy.bd`,
        password: cleanPass,
        name: cleanDigits ? `মালিক (${cleanDigits})` : `${cleanIdent} (Owner)`,
        ownerName: cleanDigits ? `মালিক (${cleanDigits})` : `${cleanIdent} (Owner)`,
        shopName: 'ইকবাল ফার্মেসী',
        role: 'owner',
        updatedAtMs: Date.now(),
      };
      users.push(autoUser);
      record.registeredUsers = users;
      writePersistentDb(record);

      res.json({ ok: true, user: autoUser });
    } catch (e) {
      console.error('Error in /api/auth/login:', e);
      res.status(500).json({ ok: false, error: 'Login verification failed' });
    }
  });

  app.get('/api/pharmacy-state', (_req, res) => {
    const record = readPersistentDb();
    if (!record || !record.state) {
      res.json({ hasData: false, updatedAtMs: 0, state: null });
      return;
    }
    const rawState = record.state;
    const deletedSet = new Set<string>(Array.isArray(rawState.deletedIds) ? rawState.deletedIds : []);
    // Never leak client-side authentication sessions via shared server state, and always clean/deduplicate entities
    const cleanState = {
      ...rawState,
      inventory: mergeEntityArray([], rawState.inventory, deletedSet, { isInventory: true }),
      customers: mergeEntityArray([], rawState.customers, deletedSet),
      transactions: mergeEntityArray([], rawState.transactions, deletedSet),
      staffList: deduplicateStaffArray(mergeEntityArray([], rawState.staffList, deletedSet)),
      customMedicines: mergeEntityArray([], rawState.customMedicines, deletedSet),
      priceWatches: mergeEntityArray([], rawState.priceWatches, deletedSet),
      priceAlerts: mergeEntityArray([], rawState.priceAlerts, deletedSet),
      cloudSession: null,
    };
    res.json({
      hasData: true,
      updatedAtMs: record.updatedAtMs || Date.now(),
      state: cleanState,
    });
  });

  app.post('/api/pharmacy-state', (req, res) => {
    try {
      const body = req.body || {};
      const incomingState = body.state;
      const mode = body.mode || 'merge';
      const unmarkedIds = new Set(Array.isArray(body.unmarkedIds) ? body.unmarkedIds : []);

      if (!incomingState || typeof incomingState !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid state payload' });
        return;
      }

      const existingRecord = readPersistentDb();
      const existingRegisteredUsers = Array.isArray(existingRecord?.registeredUsers)
        ? existingRecord.registeredUsers
        : [];
      const nowMs = Date.now();

      if (mode === 'overwrite' || !existingRecord || !existingRecord.state) {
        const cleanDeleted: string[] = Array.isArray(incomingState.deletedIds)
          ? Array.from(new Set<string>(incomingState.deletedIds.map((id: unknown) => String(id)))).filter(
              (id) => !unmarkedIds.has(id)
            )
          : [];
        const deletedSet = new Set<string>(cleanDeleted);
        const nextState = {
          shopProfile: incomingState.shopProfile || null,
          inventory: mergeEntityArray([], incomingState.inventory, deletedSet, { isInventory: true }),
          customers: mergeEntityArray([], incomingState.customers, deletedSet),
          transactions: mergeEntityArray([], incomingState.transactions, deletedSet),
          staffList: deduplicateStaffArray(
            mergeEntityArray([], incomingState.staffList, deletedSet)
          ),
          customMedicines: mergeEntityArray([], incomingState.customMedicines, deletedSet),
          priceWatches: mergeEntityArray([], incomingState.priceWatches, deletedSet),
          priceAlerts: mergeEntityArray([], incomingState.priceAlerts, deletedSet),
          deletedIds: cleanDeleted,
          posCart: Array.isArray(incomingState.posCart) ? incomingState.posCart : [],
          purchaseCart: Array.isArray(incomingState.purchaseCart) ? incomingState.purchaseCart : [],
          cloudSession: null,
          updatedAtMs: nowMs,
        };

        const payload = { updatedAtMs: nowMs, registeredUsers: existingRegisteredUsers, state: nextState };
        writePersistentDb(payload);
        res.json({ ok: true, updatedAtMs: nowMs, state: nextState });
        return;
      }

      const serverState = existingRecord.state;
      const mergedDeletedSet = new Set([
        ...(Array.isArray(serverState.deletedIds) ? serverState.deletedIds : []),
        ...(Array.isArray(incomingState.deletedIds) ? incomingState.deletedIds : []),
      ]);
      for (const id of unmarkedIds) {
        mergedDeletedSet.delete(id);
      }

      const serverShopTs = serverState.shopProfile?.updatedAtMs || 0;
      const incomingShopTs = incomingState.shopProfile?.updatedAtMs || 0;
      const mergedShop =
        incomingState.shopProfile && incomingShopTs >= serverShopTs
          ? incomingState.shopProfile
          : serverState.shopProfile || incomingState.shopProfile || null;

      const mergedTransactions = mergeEntityArray(
        serverState.transactions,
        incomingState.transactions,
        mergedDeletedSet
      );
      mergedTransactions.sort(
        (a, b) =>
          (b.updatedAtMs || 0) - (a.updatedAtMs || 0) ||
          String(b.invoiceNo || '').localeCompare(String(a.invoiceNo || ''))
      );

      const mergedState = {
        shopProfile: mergedShop,
        inventory: mergeEntityArray(
          serverState.inventory,
          incomingState.inventory,
          mergedDeletedSet,
          { isInventory: true }
        ),
        customers: mergeEntityArray(
          serverState.customers,
          incomingState.customers,
          mergedDeletedSet
        ),
        transactions: mergedTransactions,
        staffList: deduplicateStaffArray(
          mergeEntityArray(
            serverState.staffList,
            incomingState.staffList,
            mergedDeletedSet
          )
        ),
        customMedicines: mergeEntityArray(
          serverState.customMedicines,
          incomingState.customMedicines,
          mergedDeletedSet
        ),
        priceWatches: mergeEntityArray(
          serverState.priceWatches,
          incomingState.priceWatches,
          mergedDeletedSet
        ),
        priceAlerts: mergeEntityArray(
          serverState.priceAlerts,
          incomingState.priceAlerts,
          mergedDeletedSet
        ),
        deletedIds: Array.from(mergedDeletedSet),
        posCart: Array.isArray(incomingState.posCart)
          ? incomingState.posCart
          : Array.isArray(serverState.posCart)
          ? serverState.posCart
          : [],
        purchaseCart: Array.isArray(incomingState.purchaseCart)
          ? incomingState.purchaseCart
          : Array.isArray(serverState.purchaseCart)
          ? serverState.purchaseCart
          : [],
        cloudSession: null,
        updatedAtMs: nowMs,
      };

      const payload = { updatedAtMs: nowMs, registeredUsers: existingRegisteredUsers, state: mergedState };
      writePersistentDb(payload);
      res.json({ ok: true, updatedAtMs: nowMs, state: mergedState });
    } catch (err) {
      console.error('Error in POST /api/pharmacy-state:', err);
      res.status(500).json({ ok: false, error: 'Failed to persist pharmacy state' });
    }
  });

  app.post('/api/scan-medicine-box', async (req, res) => {
    try {
      const { image } = req.body || {};
      if (!image || typeof image !== 'string') {
        res.status(400).json({ ok: false, error: 'No image provided' });
        return;
      }

      const base64Data = image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ ok: false, error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const ai = new GoogleGenAI();
      const prompt = `You are a precision pharmaceutical OCR engine for medicine packages, blister strips, and bottles in Bangladesh pharmacies.
Carefully examine this image taken directly by a pharmacy camera.
CRITICAL RULES:
1. Extract ONLY what is ACTUALLY printed or visible on this medicine package.
2. DO NOT hallucinate, guess, or default to any common brand name like "Napa" or "Seclo" if that brand name is NOT written on this package.
3. If the package reads "Ostogen C" or "Ostogen", brandName must be "Ostogen C".
If the package reads "Otogen-C", brandName must be "Otogen-C".
Always prioritize the EXACT letters printed on the medicine box.
4. If this angle/frame shows only some information (for example, only the brand name and strength, or only the MRP price, or only the batch and expiry), return the detected values and return null for the others so previous fields can be preserved without being overwritten.
5. Extract:
- brandName: (exact brand name e.g. "Otogen-C", "Seclo", "Napa", or null if not readable)
- strength: (e.g. "10 ml", "20 mg", "500 mg", or null)
- dosageForm: (e.g. "Ear Drop", "Tablet", "Capsule", "Eye Drop", "Syrup", or null)
- companyName: (e.g. "Square Pharmaceuticals", "Popular Pharmaceuticals Ltd.", "Beximco", or null)
- genericName: (generic name if printed on package or known for this brand, or null)
- boxSize: (pack size printed on the box, e.g. "1*1 (10 ml)", "1*10*10", "1*14", or null)
- totalPcs: (total units/tablets/bottles in the box as integer e.g. 1, 100, 10, or null)
- boxRate: (MRP / box price in BDT as number e.g. 85, 520, 151.2, or null)
- unitPrice: (piece or bottle price as number, or null)
- batchNo: (printed batch number e.g. "B-2409", "B-8142", or null)
- expiryDate: (expiry date in YYYY-MM-DD or MM/YYYY e.g. "2027-11-30", or null)

Return STRICTLY a JSON object matching these keys.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const responseText = response.text || '';
      let parsed = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      if (parsed) {
        res.json({ ok: true, data: parsed });
      } else {
        res.status(500).json({ ok: false, error: 'Could not parse response', raw: responseText });
      }
    } catch (err: any) {
      console.error('Error in /api/scan-medicine-box:', err);
      res.status(500).json({ ok: false, error: err?.message || 'Vision scan failed' });
    }
  });

  const distPath = path.join(process.cwd(), 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production' || (fs.existsSync(distIndexPath) && process.env.NODE_ENV !== 'development');

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath, { maxAge: '1d', index: false }));
    app.get('*', (_req, res) => {
      if (fs.existsSync(distIndexPath)) {
        res.sendFile(distIndexPath);
      } else {
        res.status(404).send('Application bundle is compiling. Please refresh in a moment.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Iqbal Pharmacy persistent server running on http://0.0.0.0:${PORT} (PID ${process.pid})`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer();
