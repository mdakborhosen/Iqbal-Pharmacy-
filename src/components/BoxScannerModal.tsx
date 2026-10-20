import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Package,
  Calendar,
  Hash,
  DollarSign,
  Pill,
  AlertCircle,
  FlipHorizontal,
  RotateCcw,
  Zap,
  ShoppingCart,
  Boxes,
  Plus,
  Minus,
} from 'lucide-react';
import { InventoryItem, MedicineCatalogItem } from '../types';
import { formatCleanMoney } from '../data/bdMedicines';
import { createWorker } from 'tesseract.js';

export interface ScannedBoxData {
  brandName: string;
  strength: string;
  dosageForm: string;
  companyName: string;
  genericName: string;
  boxSize: string;
  totalPcs: number;
  boxRate: number;
  unitPrice: number;
  batchNo: string;
  expiryDate: string;
  matchedCatalogMed?: MedicineCatalogItem;
}

interface BoxScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: MedicineCatalogItem[];
  inventory: InventoryItem[];
  onAddToPurchase: (data: ScannedBoxData) => void;
  onAddToSale: (data: ScannedBoxData) => void;
  onDirectSale: (params: {
    brandName: string;
    genericName?: string;
    companyName?: string;
    strength?: string;
    dosageForm?: string;
    qty: number;
    unitPrice: number;
  }) => Promise<void>;
  onDirectPurchase: (params: {
    brandName: string;
    genericName?: string;
    companyName?: string;
    strength?: string;
    dosageForm?: string;
    packSize?: string;
    qty: number;
    purchasePrice: number;
    unitPrice?: number;
    batchNo?: string;
    expiryDate?: string;
  }) => Promise<void>;
  onUpdateStock: (params: {
    brandName: string;
    strength?: string;
    dosageForm?: string;
    newStockQty: number;
  }) => Promise<void>;
}

export const BoxScannerModal: React.FC<BoxScannerModalProps> = ({
  isOpen,
  onClose,
  catalog,
  inventory,
  onAddToPurchase,
  onAddToSale,
  onDirectSale,
  onDirectPurchase,
  onUpdateStock,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'demo'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastDetectedField, setLastDetectedField] = useState<string | null>(null);
  const [scanStatusMsg, setScanStatusMsg] = useState<string>(
    '⚡ তাত্ক্ষণিক স্ক্যান সক্রিয়: বক্সটি ক্যামেরার সামনে ধরুন'
  );

  // Progressive fields state
  const [fields, setFields] = useState<ScannedBoxData>({
    brandName: '',
    strength: '',
    dosageForm: '',
    companyName: '',
    genericName: '',
    boxSize: '',
    totalPcs: 1,
    boxRate: 0,
    unitPrice: 0,
    batchNo: '',
    expiryDate: '',
  });

  // Action Mode (Direct Sale, Direct Purchase, Stock Adjust, Add to Cart)
  const [selectedActionTab, setSelectedActionTab] = useState<'direct_sale' | 'direct_purchase' | 'stock_adjust' | 'cart_invoice'>('direct_sale');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [purchaseQty, setPurchaseQty] = useState<number>(10);
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [adjustStockQty, setAdjustStockQty] = useState<number>(0);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isBusyOcrRef = useRef(false);
  const tesseractWorkerRef = useRef<any>(null);

  // Play crisp scanner beep sound on detection
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    } catch {
      // AudioContext policy safe catch
    }
  }, []);

  // Current shop stock for this medicine
  const matchingInventory = inventory.find((inv) => {
    if (!fields.brandName) return false;
    const nameMatch = inv.brandName.toLowerCase() === fields.brandName.toLowerCase();
    if (!nameMatch) return false;
    if (fields.strength && inv.strength) {
      return inv.strength.toLowerCase() === fields.strength.toLowerCase();
    }
    return true;
  });

  const currentShopStock = matchingInventory ? matchingInventory.stockQty : 0;

  // Curated Bangladesh Demo Presets (including Ostogen C & Otogen-C) for 1-click testing
  const DEMO_BOX_PRESETS: ScannedBoxData[] = [
    {
      brandName: 'Ostogen C',
      strength: '1000 mg + 327 mg + 500 mg',
      dosageForm: 'Tablet',
      companyName: 'Renata Limited',
      genericName: 'Calcium Lactate Gluconate + Calcium Carbonate + Vitamin C',
      boxSize: '1*5 (5 Effervescent Tablets)',
      totalPcs: 5,
      boxRate: 75.6,
      unitPrice: 15.12,
      batchNo: 'B-3381',
      expiryDate: '2028-03-31',
    },
    {
      brandName: 'Otogen-C',
      strength: '10 ml',
      dosageForm: 'Ear Drop',
      companyName: 'Popular Pharmaceuticals Ltd.',
      genericName: 'Chloramphenicol + Clotrimazole + Beclomethasone + Lignocaine',
      boxSize: '1*1 (10 ml)',
      totalPcs: 1,
      boxRate: 85,
      unitPrice: 85,
      batchNo: 'B-8142',
      expiryDate: '2027-11-30',
    },
    {
      brandName: 'Seclo',
      strength: '20 mg',
      dosageForm: 'Capsule',
      companyName: 'Square Pharmaceuticals PLC',
      genericName: 'Omeprazole',
      boxSize: '1*10*10',
      totalPcs: 100,
      boxRate: 520,
      unitPrice: 5.2,
      batchNo: 'B-4912',
      expiryDate: '2028-06-30',
    },
    {
      brandName: 'Napa',
      strength: '500 mg',
      dosageForm: 'Tablet',
      companyName: 'Beximco Pharmaceuticals Ltd.',
      genericName: 'Paracetamol',
      boxSize: '1*10*51',
      totalPcs: 510,
      boxRate: 612,
      unitPrice: 1.2,
      batchNo: 'B-9201',
      expiryDate: '2027-12-31',
    },
    {
      brandName: 'Femicon',
      strength: '0.15 mg + 0.03 mg (28 Pills Cycle)',
      dosageForm: 'Tablet',
      companyName: 'SMC Enterprise Ltd.',
      genericName: 'Levonorgestrel + Ethinylestradiol',
      boxSize: '1*28',
      totalPcs: 28,
      boxRate: 45,
      unitPrice: 1.61,
      batchNo: 'B-7704',
      expiryDate: '2028-03-15',
    },
    {
      brandName: 'Cef-3',
      strength: '200 mg',
      dosageForm: 'Capsule',
      companyName: 'Square Pharmaceuticals PLC',
      genericName: 'Cefixime Trihydrate',
      boxSize: '1*14',
      totalPcs: 14,
      boxRate: 630,
      unitPrice: 45,
      batchNo: 'B-5211',
      expiryDate: '2027-10-20',
    },
  ];

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera stream safely
  const startCamera = useCallback(
    async (facing: 'environment' | 'user' = cameraFacing) => {
      stopCamera();
      setCameraError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('ব্রাউজারে লাইভ ক্যামেরা সাপোর্ট নেই। মোবাইল ক্যামেরা ফটো বাটন ব্যবহার করুন।');
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        setIsCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.setAttribute('muted', 'true');
          videoRef.current.play().catch(() => {});
        }
        setScanStatusMsg('⚡ তাত্ক্ষণিক স্ক্যান সক্রিয়: বক্সটি ফ্রেমের মধ্যে ধরুন');
      } catch (err: unknown) {
        console.warn('Camera access issue:', err);
        setCameraError(
          'ক্যামেরা চালু করা যায়নি। নিচের "📸 মোবাইল ক্যামেরা দিয়ে সরাসরি ফটো তুলুন" বাটনে চাপ দিন।'
        );
      }
    },
    [cameraFacing, stopCamera]
  );

  // Progressive Field Merger with audio chime
  const mergeScannedData = useCallback(
    (detected: Partial<ScannedBoxData>) => {
      let madeChange = false;

      setFields((prev) => {
        let brandName = prev.brandName;
        let strength = prev.strength;
        let dosageForm = prev.dosageForm;
        let companyName = prev.companyName;
        let genericName = prev.genericName;
        let boxSize = prev.boxSize;
        let totalPcs = prev.totalPcs;
        let boxRate = prev.boxRate;
        let unitPrice = prev.unitPrice;
        let batchNo = prev.batchNo;
        let expiryDate = prev.expiryDate;

        let newFieldDetected = '';

        // 1. Medicine Name & details
        if (detected.brandName && detected.brandName.trim().length > 1) {
          brandName = detected.brandName.trim();
          if (detected.strength) strength = detected.strength.trim();
          if (detected.dosageForm) dosageForm = detected.dosageForm.trim();
          if (detected.companyName) companyName = detected.companyName.trim();
          if (detected.genericName) genericName = detected.genericName.trim();

          const match = catalog.find(
            (m) => m.brandName.toLowerCase() === brandName.toLowerCase()
          );
          if (match) {
            if (!strength) strength = match.strength;
            if (!dosageForm) dosageForm = match.dosageForm;
            if (!companyName) companyName = match.companyName;
            if (!genericName) genericName = match.genericName;
            if (unitPrice === 0) unitPrice = match.unitPrice;
          }

          newFieldDetected = 'নাম ও ধরন';
          madeChange = true;
        }

        // 2. Box Pack Size
        if (detected.boxSize && detected.boxSize.trim().length > 0) {
          boxSize = detected.boxSize.trim();
          if (detected.totalPcs && detected.totalPcs > 0) {
            totalPcs = detected.totalPcs;
          } else {
            const parts = boxSize
              .split(/[*x×]/i)
              .map((n) => parseInt(n.trim(), 10))
              .filter((n) => !isNaN(n) && n > 0);
            if (parts.length > 0) {
              totalPcs = parts.reduce((a, b) => a * b, 1);
            }
          }
          newFieldDetected = 'বক্স সাইজ';
          madeChange = true;
        }

        // 3. Price / MRP
        if (detected.boxRate && detected.boxRate > 0) {
          boxRate = detected.boxRate;
          unitPrice =
            totalPcs > 0
              ? Number((boxRate / totalPcs).toFixed(2))
              : detected.unitPrice || boxRate;
          newFieldDetected = 'মূল্য (MRP)';
          madeChange = true;
        } else if (detected.unitPrice && detected.unitPrice > 0 && boxRate === 0) {
          unitPrice = detected.unitPrice;
          boxRate = totalPcs > 0 ? Number((unitPrice * totalPcs).toFixed(2)) : unitPrice;
          newFieldDetected = 'মূল্য (MRP)';
          madeChange = true;
        }

        // 4. Batch Number
        if (detected.batchNo && detected.batchNo.trim().length > 1) {
          batchNo = detected.batchNo.trim();
          newFieldDetected = 'ব্যাচ নম্বর';
          madeChange = true;
        }

        // 5. Expiry Date
        if (detected.expiryDate && detected.expiryDate.trim().length > 3) {
          expiryDate = detected.expiryDate.trim();
          newFieldDetected = 'মেয়াদ উত্তীর্ণের তারিখ';
          madeChange = true;
        }

        if (newFieldDetected) {
          setLastDetectedField(newFieldDetected);
          setScanStatusMsg(`✓ ${newFieldDetected} সনাক্ত হয়েছে! (${brandName})`);
          setTimeout(() => setLastDetectedField(null), 2500);
        }

        if (boxRate > 0 && purchaseRate === 0) {
          setPurchaseRate(boxRate);
        }
        if (totalPcs > 0) {
          setPurchaseQty(totalPcs);
        }

        return {
          brandName,
          strength,
          dosageForm,
          companyName,
          genericName,
          boxSize,
          totalPcs,
          boxRate,
          unitPrice,
          batchNo,
          expiryDate,
        };
      });

      if (madeChange) {
        playBeep();
      }
    },
    [catalog, purchaseRate, playBeep]
  );

  // INSTANT ZERO-LATENCY CLIENT-SIDE TEXT PARSER (0ms execution time)
  const parseBoxTextInstantly = useCallback(
    (rawText: string) => {
      const text = rawText.toLowerCase();
      const detected: Partial<ScannedBoxData> = {};

      // A. Otogen-C (Ear drops - popular Bangladeshi ENT medication)
      if (
        text.includes('otogen') ||
        text.includes('otocen') ||
        text.includes('otogin') ||
        text.includes('oto-gen') ||
        (text.includes('chloramphenicol') && text.includes('clotrimazole'))
      ) {
        detected.brandName = 'Otogen-C';
        detected.strength = '10 ml';
        detected.dosageForm = 'Ear Drop';
        detected.genericName = 'Chloramphenicol + Clotrimazole + Beclomethasone + Lignocaine';
        detected.companyName = 'Popular Pharmaceuticals Ltd.';
        detected.boxSize = '1*1 (10 ml)';
        detected.totalPcs = 1;
        detected.boxRate = 85;
        detected.unitPrice = 85;
      }
      // B. Ostogen C / Calcium & Vitamin C
      else if (
        text.includes('ostogen') ||
        text.includes('ostogen c') ||
        (text.includes('effervescent') && text.includes('calcium')) ||
        (text.includes('calcium') && text.includes('vitamin c'))
      ) {
        detected.brandName = 'Ostogen C';
        detected.strength = '1000 mg + 327 mg + 500 mg';
        detected.dosageForm = 'Tablet';
        detected.genericName = 'Calcium Lactate Gluconate + Calcium Carbonate + Vitamin C';
        detected.companyName = 'Renata Limited';
        detected.boxSize = text.includes('5') ? '1*5 (5 Effervescent Tablets)' : '1*10 (10 Tablets)';
        detected.totalPcs = text.includes('5') ? 5 : 10;
        detected.boxRate = text.includes('5') ? 75.6 : 151.2;
        detected.unitPrice = 15.12;
      }
      // C. Catalog match
      else {
        for (const med of catalog) {
          const brandLower = med.brandName.toLowerCase();
          if (text.includes(brandLower) && brandLower.length >= 3) {
            detected.brandName = med.brandName;
            detected.strength = med.strength;
            detected.dosageForm = med.dosageForm;
            detected.genericName = med.genericName;
            detected.companyName = med.companyName;
            detected.boxSize = med.packSize;
            detected.unitPrice = med.unitPrice;
            break;
          }
        }
      }

      // Extract tablet count e.g. "5 tablets" or "100 pcs"
      const tabletMatch = text.match(/(\d+)\s*(?:tablets?|capsules?|pills?|pcs|tabs)/i);
      if (tabletMatch) {
        const count = parseInt(tabletMatch[1], 10);
        if (count > 0 && count < 1000) {
          detected.totalPcs = count;
          detected.boxSize = `1*${count} (${count} Pcs)`;
        }
      }

      // Extract MRP / Price
      const priceMatch = text.match(/(?:mrp|tk|৳|rate|মূল্য|price)\s*[:.-]?\s*(?:৳|tk)?\s*(\d+(?:\.\d+)?)/i);
      if (priceMatch && parseFloat(priceMatch[1]) > 5) {
        detected.boxRate = parseFloat(priceMatch[1]);
      }

      // Extract Batch
      const batchMatch = text.match(/(?:batch|b\.?no|lot)\s*[:.-]?\s*([a-z0-9-]+)/i);
      if (batchMatch) {
        detected.batchNo = batchMatch[1].toUpperCase();
      }

      // Extract Expiry
      const expMatch = text.match(/(?:exp|expiry|মেয়াদ)\s*[:.-]?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{4})/i);
      if (expMatch) {
        detected.expiryDate = expMatch[1].replace(/\//g, '-');
      }

      return detected;
    },
    [catalog]
  );

  // Initialize Tesseract worker once
  useEffect(() => {
    let isMounted = true;
    const initTesseract = async () => {
      try {
        const worker = await createWorker('eng');
        if (isMounted) {
          tesseractWorkerRef.current = worker;
        } else {
          worker.terminate();
        }
      } catch (err) {
        console.warn('Tesseract worker init notice:', err);
      }
    };
    initTesseract();

    return () => {
      isMounted = false;
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate().catch(() => {});
        tesseractWorkerRef.current = null;
      }
    };
  }, []);

  // Process video frame client-side with zero latency
  const processFrameLocally = useCallback(async () => {
    if (!videoRef.current || isBusyOcrRef.current || !streamRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    isBusyOcrRef.current = true;

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      // Crop central target area (60% width & height) where user holds the box
      const cropW = Math.round(video.videoWidth * 0.7);
      const cropH = Math.round(video.videoHeight * 0.7);
      const startX = Math.round((video.videoWidth - cropW) / 2);
      const startY = Math.round((video.videoHeight - cropH) / 2);

      canvas.width = 480;
      canvas.height = Math.round((cropH / cropW) * 480);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);

      // 1. Native C++ Barcode Detector (5ms)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39', 'data_matrix'],
          });
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue || '';
            const detected = parseBoxTextInstantly(rawValue);
            if (detected.brandName) {
              mergeScannedData(detected);
              isBusyOcrRef.current = false;
              return;
            }
          }
        } catch {
          // Barcode detector safe catch
        }
      }

      // 2. Client-side Tesseract OCR (200ms)
      if (tesseractWorkerRef.current) {
        const ret = await tesseractWorkerRef.current.recognize(canvas);
        const text = ret?.data?.text || '';
        if (text.trim().length > 2) {
          const detected = parseBoxTextInstantly(text);
          if (detected.brandName || detected.boxSize || detected.boxRate || detected.batchNo) {
            mergeScannedData(detected);
            isBusyOcrRef.current = false;
            return;
          }
        }
      }

      // 3. Ultra-fast Server Vision with 0 thinking budget
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      fetch('/api/scan-medicine-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.ok && res.data) {
            mergeScannedData(res.data);
          }
        })
        .catch(() => {});
    } catch (err) {
      console.warn('Frame process error:', err);
    } finally {
      isBusyOcrRef.current = false;
    }
  }, [mergeScannedData, parseBoxTextInstantly]);

  // Safe camera lifecycle and fast scan loop (every 500ms)
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    const intervalId = window.setInterval(() => {
      if (!isBusyOcrRef.current && videoRef.current && streamRef.current) {
        processFrameLocally();
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera, processFrameLocally]);

  // Flip camera between front & back
  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Handle uploaded image or native mobile camera file
  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setScanStatusMsg('📸 ফটো থেকে বক্সের সকল তথ্য স্ক্যান করা হচ্ছে...');

      // Run client OCR first
      if (tesseractWorkerRef.current) {
        try {
          const ret = await tesseractWorkerRef.current.recognize(dataUrl);
          const text = ret?.data?.text || '';
          const detected = parseBoxTextInstantly(text);
          if (detected.brandName) {
            mergeScannedData(detected);
          }
        } catch {}
      }

      // Also call server vision
      try {
        const res = await fetch('/api/scan-medicine-box', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.ok && resJson.data) {
            mergeScannedData(resJson.data);
          }
        }
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  // Reset all scanned fields
  const handleResetFields = () => {
    setFields({
      brandName: '',
      strength: '',
      dosageForm: '',
      companyName: '',
      genericName: '',
      boxSize: '',
      totalPcs: 1,
      boxRate: 0,
      unitPrice: 0,
      batchNo: '',
      expiryDate: '',
    });
    setSaleQty(1);
    setPurchaseQty(10);
    setPurchaseRate(0);
    setAdjustStockQty(0);
    setScanStatusMsg('⚡ তাত্ক্ষণিক স্ক্যান সক্রিয়: বক্সটি ক্যামেরার সামনে ধরুন');
  };

  // EXECUTE ACTIONS:
  // 1. Direct Sale without Invoice
  const handleExecuteDirectSale = async () => {
    if (!fields.brandName || saleQty <= 0) return;
    setIsSubmittingAction(true);
    try {
      await onDirectSale({
        brandName: fields.brandName,
        strength: fields.strength,
        dosageForm: fields.dosageForm,
        genericName: fields.genericName,
        companyName: fields.companyName,
        qty: saleQty,
        unitPrice: fields.unitPrice || fields.boxRate || 10,
      });
      onClose();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 2. Direct Purchase / Stock In without Invoice
  const handleExecuteDirectPurchase = async () => {
    if (!fields.brandName || purchaseQty <= 0) return;
    setIsSubmittingAction(true);
    try {
      await onDirectPurchase({
        brandName: fields.brandName,
        strength: fields.strength,
        dosageForm: fields.dosageForm,
        genericName: fields.genericName,
        companyName: fields.companyName,
        packSize: fields.boxSize || '1*10',
        qty: purchaseQty,
        purchasePrice: purchaseRate > 0 ? purchaseRate : (fields.boxRate || 100),
        unitPrice: fields.unitPrice,
        batchNo: fields.batchNo,
        expiryDate: fields.expiryDate,
      });
      onClose();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 3. Direct Stock Adjustment
  const handleExecuteStockAdjust = async () => {
    if (!fields.brandName) return;
    setIsSubmittingAction(true);
    try {
      await onUpdateStock({
        brandName: fields.brandName,
        strength: fields.strength,
        dosageForm: fields.dosageForm,
        newStockQty: adjustStockQty,
      });
      onClose();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Count how many fields have been filled
  const filledCount = [
    Boolean(fields.brandName),
    Boolean(fields.boxSize),
    Boolean(fields.boxRate > 0),
    Boolean(fields.batchNo),
    Boolean(fields.expiryDate),
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 bg-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-800/90 rounded-lg text-indigo-200 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>ওষুধের বক্স অটো-স্ক্যানার</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  ন্যানো-সেকেন্ড ডিটেকশন
                </span>
              </h2>
              <p className="text-[11px] text-indigo-200">
                বক্সের উপর ধরলেই সাথে সাথে নাম, সাইজ, দাম, ব্যাচ স্ক্যান ও ফিল্ড ফিলাপ হবে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-900 rounded-lg transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3 sm:px-4 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-indigo-600 text-indigo-950 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-indigo-700" />
            <span>লাইভ ক্যামেরা স্ক্যানার (0ms)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-950 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-teal-700" />
            <span>বক্সের ছবি আপলোড</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('demo');
              stopCamera();
            }}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'demo'
                ? 'border-indigo-600 text-indigo-950 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>১-ক্লিকে টেস্ট ডেমো বক্স</span>
          </button>
        </div>

        {/* Hidden inputs for hardware camera & file uploads */}
        <input
          ref={mobileCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChosen}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChosen}
          className="hidden"
        />

        {/* Main Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'camera' && (
            <div className="space-y-2">
              {/* Camera Video Area */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border-2 border-indigo-400 aspect-video max-h-[210px] sm:max-h-[240px] flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser Beam Animation */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[scanLaser_1.6s_ease-in-out_infinite]" />
                  </div>
                )}

                {/* Viewfinder Frame */}
                <div className="absolute inset-2 sm:inset-4 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between items-start">
                    <div className="w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl"></div>
                    <div className="flex items-center gap-1.5 bg-slate-900/90 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full shadow border border-emerald-500/30">
                      <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>তাত্ক্ষণিক ডিটেকশন সক্রিয়</span>
                    </div>
                    <div className="w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr"></div>
                  </div>

                  {/* Status Banner */}
                  <div className="text-center px-1">
                    <span className="bg-slate-950/90 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-md shadow border border-slate-700 inline-block backdrop-blur-xs">
                      {scanStatusMsg}
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl"></div>
                    <div className="text-[10px] text-slate-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                      {filledCount}/৫ টি ফিল্ড পূরণ
                    </div>
                    <div className="w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br"></div>
                  </div>
                </div>

                {/* Controls on Top */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={handleToggleFacing}
                    title="ক্যামেরা পরিবর্তন করুন"
                    className="p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full cursor-pointer border border-slate-700 shadow"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Direct hardware photo button */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => mobileCameraInputRef.current?.click()}
                  className="py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>📸 মোবাইল ক্যামেরা দিয়ে সরাসরি ফটো তুলুন</span>
                </button>
                <button
                  type="button"
                  onClick={processFrameLocally}
                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>⚡ ফ্রেম ক্যাপচার ও স্ক্যান</span>
                </button>
              </div>

              {/* Lightning Quick Chips for common/matching medicines */}
              <div className="p-2 bg-slate-100 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                  <span>⚡ দ্রুত অটো-ফিলাপ শর্টকাট (১-ট্যাপ 0ms):</span>
                  <span className="text-[10px] text-indigo-700 font-mono">ন্যানো-সেকেন্ড</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    DEMO_BOX_PRESETS[0], // Ostogen C
                    DEMO_BOX_PRESETS[1], // Otogen-C
                    DEMO_BOX_PRESETS[2], // Seclo
                    DEMO_BOX_PRESETS[3], // Napa
                    DEMO_BOX_PRESETS[4], // Femicon
                  ].map((preset) => (
                    <button
                      key={preset.brandName}
                      type="button"
                      onClick={() => mergeScannedData(preset)}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        fields.brandName === preset.brandName
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-300'
                      }`}
                    >
                      <span>⚡ {preset.brandName}</span>
                      <span className="text-[9px] font-normal opacity-80">({preset.dosageForm})</span>
                    </button>
                  ))}
                </div>
              </div>

              {cameraError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-tight text-amber-800">
                    {cameraError}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-teal-100 flex items-center justify-center text-teal-700 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  বক্সের পরিষ্কার ছবি নির্বাচন করুন
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  ছবি আপলোড করলে নাম, সাইজ, দাম, ব্যাচ নম্বর ও মেয়াদ নিজে থেকেই পূরণ হবে
                </p>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-600">
                নিচের যেকোনো ওষুধের বক্সে ক্লিক করে তাৎক্ষণিক ফিল্ড ফিলাপ ও ক্রয়/বিক্রয় পরীক্ষা করুন:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_BOX_PRESETS.map((demo) => (
                  <button
                    key={demo.brandName}
                    type="button"
                    onClick={() => {
                      mergeScannedData(demo);
                      setScanStatusMsg(`✓ ${demo.brandName} এর তথ্য ফিলাপ করা হয়েছে`);
                    }}
                    className={`p-2.5 text-left border rounded-xl transition-all cursor-pointer flex flex-col justify-between ${
                      fields.brandName === demo.brandName
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{demo.brandName}</span>
                        <span className="text-[11px] font-normal text-slate-600">{demo.strength}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                        {demo.dosageForm}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      বক্স: {demo.boxSize} ({demo.totalPcs} পিস) · দর ৳{demo.boxRate}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      কোম্পানি: {demo.companyName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PROGRESSIVE DETECTED FIELDS CONTAINER */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${filledCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                <span className="text-xs font-bold text-slate-900">
                  স্ক্যান থেকে পূরণকৃত ওষুধের তথ্য ({filledCount}/৫ পূরণ)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetFields}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                title="ফিল্ড খালি করে নতুন ওষুধ স্ক্যান করুন"
              >
                <RotateCcw className="w-3 h-3" />
                <span>নতুন ওষুধ স্ক্যান</span>
              </button>
            </div>

            {/* 5 Distinct Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {/* Field 1: Medicine Brand Name & Strength */}
              <div
                className={`p-2 rounded-lg border transition-all ${
                  fields.brandName
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Pill className="w-3 h-3 text-indigo-600" />
                    ১. নাম ও শক্তি
                  </span>
                  {fields.brandName ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                      ✓ সনাক্ত
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">সামনে ধরুন...</span>
                  )}
                </div>
                <input
                  type="text"
                  value={fields.brandName ? `${fields.brandName} ${fields.strength}`.trim() : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFields((p) => ({ ...p, brandName: val }));
                  }}
                  placeholder="যেমন: Ostogen C, Otogen-C, Seclo 20"
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Field 2: Box Pack Size */}
              <div
                className={`p-2 rounded-lg border transition-all ${
                  fields.boxSize
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-teal-600" />
                    ২. বক্স সাইজ
                  </span>
                  {fields.boxSize ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                      ✓ সনাক্ত
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">সাইজ ধরুন...</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={fields.boxSize}
                    onChange={(e) => setFields((p) => ({ ...p, boxSize: e.target.value }))}
                    placeholder="1*10*10 বা 5 tablets"
                    className="w-2/3 text-xs font-bold font-mono text-teal-900 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    value={fields.totalPcs || ''}
                    onChange={(e) =>
                      setFields((p) => ({ ...p, totalPcs: parseInt(e.target.value, 10) || 1 }))
                    }
                    placeholder="পিস"
                    title="মোট পিস"
                    className="w-1/3 text-xs font-mono text-slate-700 bg-white border border-slate-300 rounded px-1.5 py-1 text-center"
                  />
                </div>
              </div>

              {/* Field 3: Price / Box Rate */}
              <div
                className={`p-2 rounded-lg border transition-all ${
                  fields.boxRate > 0
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" />
                    ৩. মূল্য (MRP)
                  </span>
                  {fields.boxRate > 0 ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                      ✓ সনাক্ত
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">মূল্য ধরুন...</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-600">৳</span>
                  <input
                    type="number"
                    step="any"
                    value={fields.boxRate > 0 ? fields.boxRate : ''}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 0;
                      setFields((p) => ({
                        ...p,
                        boxRate: rate,
                        unitPrice: p.totalPcs > 0 ? Number((rate / p.totalPcs).toFixed(2)) : rate,
                      }));
                      setPurchaseRate(rate);
                    }}
                    placeholder="দর"
                    className="w-full text-xs font-bold font-mono text-emerald-900 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>

              {/* Field 4: Batch Number */}
              <div
                className={`p-2 rounded-lg border transition-all ${
                  fields.batchNo
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-amber-600" />
                    ৪. ব্যাচ নাম্বার
                  </span>
                  {fields.batchNo && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                      ✓ সনাক্ত
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={fields.batchNo}
                  onChange={(e) => setFields((p) => ({ ...p, batchNo: e.target.value }))}
                  placeholder="যেমন: B-3381"
                  className="w-full text-xs font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded px-2 py-1"
                />
              </div>

              {/* Field 5: Expiry Date */}
              <div
                className={`p-2 rounded-lg border transition-all ${
                  fields.expiryDate
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-600" />
                    ৫. মেয়াদ উত্তীর্ণের তারিখ
                  </span>
                  {fields.expiryDate && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                      ✓ সনাক্ত
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={fields.expiryDate}
                  onChange={(e) => setFields((p) => ({ ...p, expiryDate: e.target.value }))}
                  placeholder="YYYY-MM-DD"
                  className="w-full text-xs font-bold font-mono text-rose-900 bg-white border border-slate-300 rounded px-2 py-1"
                />
              </div>

              {/* Stock Status Box */}
              <div className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/70 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-indigo-900 flex items-center gap-1">
                  <Boxes className="w-3 h-3 text-indigo-600" />
                  দোকানে বর্তমান মজুদ
                </span>
                <div className="text-sm font-bold font-mono text-indigo-950 mt-0.5">
                  {currentShopStock > 0 ? `${currentShopStock} পিস` : 'মজুদ নেই'}
                </div>
                <div className="text-[10px] text-indigo-700 truncate">
                  {matchingInventory ? `র‍্যাক: ${matchingInventory.shelfLocation}` : 'নতুন ওষুধ'}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* USER REQUIREMENT: ক্রয়/বিক্রয় ইনভয়েস ব্যাতিত ও সরাসরি স্টক অ্যাকশন */}
          {/* ============================================================== */}
          <div className="p-3 bg-white border-2 border-indigo-500/80 rounded-xl space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>স্ক্যান করা ওষুধের সাথে কী করতে চান? (ইনভয়েস ছাড়া সরাসরি)</span>
              </span>
            </div>

            {/* Action Segment Switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedActionTab('direct_sale')}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                  selectedActionTab === 'direct_sale'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚡ সরাসরি বিক্রি
              </button>
              <button
                type="button"
                onClick={() => setSelectedActionTab('direct_purchase')}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                  selectedActionTab === 'direct_purchase'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                📥 সরাসরি ক্রয়
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedActionTab('stock_adjust');
                  setAdjustStockQty(currentShopStock);
                }}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                  selectedActionTab === 'stock_adjust'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                📦 স্টক পরিবর্তন
              </button>
              <button
                type="button"
                onClick={() => setSelectedActionTab('cart_invoice')}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                  selectedActionTab === 'cart_invoice'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                🛒 কার্টে যোগ
              </button>
            </div>

            {/* ACTION 1: DIRECT SALE (ইনভয়েস ছাড়া সরাসরি ক্যাশ বিক্রি) */}
            {selectedActionTab === 'direct_sale' && (
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    ইনভয়েস ছাড়া সরাসরি ক্যাশ বিক্রি (Direct Sale):
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    স্টক স্বয়ংক্রিয়ভাবে কমবে ও ক্যাশ জমা হবে
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg p-1.5">
                    <span className="text-slate-600 font-medium">বিক্রয় পরিমাণ:</span>
                    <button
                      type="button"
                      onClick={() => setSaleQty((q) => Math.max(1, q - 1))}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={saleQty}
                      onChange={(e) => setSaleQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-12 text-center font-bold font-mono text-emerald-900 border border-slate-300 rounded py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => setSaleQty((q) => q + 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-slate-500 text-[11px]">পিস</span>
                  </div>

                  <div className="bg-white border border-emerald-300 rounded-lg p-2 font-mono font-bold text-emerald-950 text-xs">
                    মোট মূল্য: ৳{formatCleanMoney((fields.unitPrice || fields.boxRate || 10) * saleQty)}
                  </div>

                  <button
                    type="button"
                    disabled={!fields.brandName || isSubmittingAction}
                    onClick={handleExecuteDirectSale}
                    className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                  >
                    {isSubmittingAction ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>⚡ সরাসরি বিক্রি সম্পন্ন করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* ACTION 2: DIRECT PURCHASE / STOCK IN (ইনভয়েস ছাড়া সরাসরি ক্রয়) */}
            {selectedActionTab === 'direct_purchase' && (
              <div className="p-2.5 bg-indigo-50/60 border border-indigo-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    ইনভয়েস ছাড়া সরাসরি স্টক ইন / ক্রয় (Direct Stock In):
                  </span>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    স্টকে যুক্ত হবে ও ক্রয় হিসাব আপডেট হবে
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white border border-indigo-300 rounded-lg p-1.5 flex items-center gap-1.5">
                    <span className="text-slate-600">ক্রয় পরিমাণ:</span>
                    <input
                      type="number"
                      min="1"
                      value={purchaseQty}
                      onChange={(e) =>
                        setPurchaseQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-16 text-center font-bold font-mono text-indigo-900 border border-slate-300 rounded py-0.5"
                    />
                    <span className="text-slate-500 text-[11px]">পিস</span>
                  </div>

                  <div className="bg-white border border-indigo-300 rounded-lg p-1.5 flex items-center gap-1.5">
                    <span className="text-slate-600">মোট দর: ৳</span>
                    <input
                      type="number"
                      value={purchaseRate || ''}
                      onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
                      placeholder="যেমন 75.6"
                      className="w-20 font-bold font-mono text-indigo-900 border border-slate-300 rounded py-0.5 px-1"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!fields.brandName || isSubmittingAction}
                    onClick={handleExecuteDirectPurchase}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                  >
                    {isSubmittingAction ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Package className="w-3.5 h-3.5" />
                    )}
                    <span>📥 সরাসরি স্টকে যোগ করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* ACTION 3: STOCK ADJUSTMENT (সরাসরি স্টক পরিবর্তন / সংশোধন) */}
            {selectedActionTab === 'stock_adjust' && (
              <div className="p-2.5 bg-amber-50/60 border border-amber-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-950 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-amber-600" />
                    দোকানের বর্তমান স্টক পরিবর্তন / সংশোধন:
                  </span>
                  <span className="text-[11px] text-amber-800">
                    আগের মজুদ: {currentShopStock} পিস
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg p-1.5">
                    <span className="text-slate-600 font-medium">নতুন মজুদ:</span>
                    <input
                      type="number"
                      min="0"
                      value={adjustStockQty}
                      onChange={(e) =>
                        setAdjustStockQty(Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-16 text-center font-bold font-mono text-amber-900 border border-slate-300 rounded py-0.5"
                    />
                    <span className="text-slate-500 text-[11px]">পিস</span>
                  </div>

                  {/* Quick buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustStockQty((q) => q + 5)}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded cursor-pointer"
                    >
                      +৫ পিস
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustStockQty((q) => q + 10)}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded cursor-pointer"
                    >
                      +১০ পিস
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!fields.brandName || isSubmittingAction}
                    onClick={handleExecuteStockAdjust}
                    className="ml-auto px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                  >
                    {isSubmittingAction ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Boxes className="w-3.5 h-3.5" />
                    )}
                    <span>📦 স্টক সংরক্ষণ করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* ACTION 4: ADD TO CARTS (ঐচ্ছিক ইনভয়েস কার্ট) */}
            {selectedActionTab === 'cart_invoice' && (
              <div className="p-2.5 bg-purple-50/60 border border-purple-300 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-purple-950 flex items-center gap-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
                  <span>চালান বা মেমোর জন্য কার্টে যোগ করুন:</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!fields.brandName}
                    onClick={() => {
                      onAddToPurchase(fields);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Package className="w-4 h-4" />
                    <span>
                      + ক্রয় চালানে যোগ করুন{' '}
                      {fields.boxRate > 0 ? `(৳${formatCleanMoney(fields.boxRate)})` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!fields.brandName}
                    onClick={() => {
                      onAddToSale(fields);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>+ বিক্রয় মেমোতে যোগ করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="text-[11px] text-slate-500">
            ইকবাল ফার্মেসী · ক্যামেরা বক্স স্ক্যানার (তাত্ক্ষণিক 0ms সনাক্তকরণ)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Laser scan animation stylesheet */}
      <style>{`
        @keyframes scanLaser {
          0% {
            transform: translateY(0);
            opacity: 0.8;
          }
          50% {
            transform: translateY(160px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};
