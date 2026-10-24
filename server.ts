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
  return rawId.replace(
    /^(inv-[a-z0-9-]+|cust-\d+|tx-(?:sale|pur|due)-\d+|staff-[a-z0-9-]+|watch-[a-z0-9-]+|alert-demo-\d+)(?:_[a-zA-Z0-9_-]{6})+$/,
    '$1'
  );
}

function readPersistentDb(): { updatedAtMs?: number; state?: Record<string, any> } | null {
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

  // Cloud Run and container health check probes
  app.get(['/health', '/api/health', '/_health'], (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
  });

  app.get('/api/pharmacy-state', (_req, res) => {
    const record = readPersistentDb();
    if (!record || !record.state) {
      res.json({ hasData: false, updatedAtMs: 0, state: null });
      return;
    }
    res.json({
      hasData: true,
      updatedAtMs: record.updatedAtMs || Date.now(),
      state: record.state,
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
      const nowMs = Date.now();

      if (mode === 'overwrite' || !existingRecord || !existingRecord.state) {
        const cleanDeleted = Array.isArray(incomingState.deletedIds)
          ? Array.from(new Set(incomingState.deletedIds)).filter((id) => !unmarkedIds.has(id))
          : [];
        const nextState = {
          shopProfile: incomingState.shopProfile || null,
          inventory: Array.isArray(incomingState.inventory) ? incomingState.inventory : [],
          customers: Array.isArray(incomingState.customers) ? incomingState.customers : [],
          transactions: Array.isArray(incomingState.transactions) ? incomingState.transactions : [],
          staffList: Array.isArray(incomingState.staffList) ? incomingState.staffList : [],
          customMedicines: Array.isArray(incomingState.customMedicines)
            ? incomingState.customMedicines
            : [],
          priceWatches: Array.isArray(incomingState.priceWatches) ? incomingState.priceWatches : [],
          priceAlerts: Array.isArray(incomingState.priceAlerts) ? incomingState.priceAlerts : [],
          deletedIds: cleanDeleted,
          posCart: Array.isArray(incomingState.posCart) ? incomingState.posCart : [],
          purchaseCart: Array.isArray(incomingState.purchaseCart) ? incomingState.purchaseCart : [],
          cloudSession:
            incomingState.cloudSession !== undefined
              ? incomingState.cloudSession
              : existingRecord?.state?.cloudSession || null,
          updatedAtMs: nowMs,
        };

        const payload = { updatedAtMs: nowMs, state: nextState };
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
        staffList: mergeEntityArray(
          serverState.staffList,
          incomingState.staffList,
          mergedDeletedSet
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
        cloudSession:
          incomingState.cloudSession !== undefined
            ? incomingState.cloudSession
            : serverState.cloudSession || null,
        updatedAtMs: nowMs,
      };

      const payload = { updatedAtMs: nowMs, state: mergedState };
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
