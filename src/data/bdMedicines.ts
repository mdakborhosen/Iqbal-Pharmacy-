import {
  CartItem,
  InventoryItem,
  MedicineCatalogItem,
  PurchaseCartItem,
  PurchasePackUnit,
  Transaction,
} from '../types';
import {
  BD_NATIONAL_PHARMA_COMPANIES,
  buildNationalMedicineDatabase,
  CompanyDirectoryEntry,
  GenericDirectoryEntry,
} from './bdNationalRegistry';

export const BD_PHARMA_COMPANIES: string[] = BD_NATIONAL_PHARMA_COMPANIES;

export const CURATED_BD_MEDICINES: MedicineCatalogItem[] = [
  // =========================================================================
  // 1. Omeprazole 20mg & 40mg (Proton Pump Inhibitor - Gastric)
  // =========================================================================
  {
    id: 'med-seclo-20',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '018-112-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg IV Injection',
  },
  {
    id: 'med-seclo-40',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '40 mg',
    dosageForm: 'Capsule',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'তীব্র পেপটিক আলসার ও রিফ্লাক্স ইসোফ্যাজাইটিস নিরাময়ে ব্যবহৃত',
    darNo: '018-113-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg IV Injection',
  },
  {
    id: 'med-seclo-mups-20',
    brandName: 'Seclo MUPS',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'দ্রুত কার্যকরী গ্যাস্ট্রিক ও অ্যাসিড রিফ্লাক্স নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-612-043',
    availableDosages: '20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-losectil-20',
    brandName: 'Losectil',
    genericName: 'Omeprazole',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '211-085-043',
    availableDosages: '10 mg Capsule, 20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet',
  },
  {
    id: 'med-losectil-40',
    brandName: 'Losectil',
    genericName: 'Omeprazole',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '40 mg',
    dosageForm: 'Capsule',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'তীব্র পেপটিক আলসার ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '211-086-043',
    availableDosages: '10 mg Capsule, 20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet',
  },
  {
    id: 'med-proceptin-20',
    brandName: 'Proceptin',
    genericName: 'Omeprazole',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.5,
    stripPrice: 55.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '012-142-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 40 mg IV Injection',
  },
  {
    id: 'med-cosec-20',
    brandName: 'Cosec',
    genericName: 'Omeprazole',
    companyName: 'Drug International Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '154-088-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule',
  },
  {
    id: 'med-ppi-20',
    brandName: 'PPI',
    genericName: 'Omeprazole',
    companyName: 'ACME Laboratories Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '5 × 14 (70 pcs)',
    unitsPerStrip: 14,
    unitPrice: 5.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '024-119-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 40 mg IV Injection',
  },
  {
    id: 'med-xeldrin-20',
    brandName: 'Xeldrin',
    genericName: 'Omeprazole',
    companyName: 'ACI Limited',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '045-110-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule',
  },

  // =========================================================================
  // 2. Esomeprazole 20mg & 40mg (Proton Pump Inhibitor - Gastric)
  // =========================================================================
  {
    id: 'med-sergel-20',
    brandName: 'Sergel',
    genericName: 'Esomeprazole',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '319-045-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-sergel-40',
    brandName: 'Sergel',
    genericName: 'Esomeprazole',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '40 mg',
    dosageForm: 'Capsule',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'তীব্র গ্যাস্ট্রিক আলসার ও রিফ্লাক্স ইসোফ্যাজাইটিস নিরাময়ে ব্যবহৃত',
    darNo: '319-046-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-maxpro-20',
    brandName: 'Maxpro',
    genericName: 'Esomeprazole',
    companyName: 'Renata PLC',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 14 (140 pcs)',
    unitsPerStrip: 14,
    unitPrice: 7.0,
    stripPrice: 98.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '108-291-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg Tablet, 40 mg Tablet, 20 mg MUPS',
  },
  {
    id: 'med-maxpro-40',
    brandName: 'Maxpro',
    genericName: 'Esomeprazole',
    companyName: 'Renata PLC',
    strength: '40 mg',
    dosageForm: 'Capsule',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'তীব্র গ্যাস্ট্রিক আলসার ও অ্যাসিড নিঃসরণ নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '108-292-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg Tablet, 40 mg Tablet, 20 mg MUPS',
  },
  {
    id: 'med-nexum-20',
    brandName: 'Nexum',
    genericName: 'Esomeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '018-402-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-nexum-40',
    brandName: 'Nexum',
    genericName: 'Esomeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '40 mg',
    dosageForm: 'Capsule',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'তীব্র গ্যাস্ট্রিক আলসার ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '018-403-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-esoral-20',
    brandName: 'Esoral',
    genericName: 'Esomeprazole',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '211-319-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg IV Injection',
  },
  {
    id: 'med-exium-20',
    brandName: 'Exium',
    genericName: 'Esomeprazole',
    companyName: 'Radiant Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '285-051-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-esonix-20',
    brandName: 'Esonix',
    genericName: 'Esomeprazole',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '198-219-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg Tablet',
  },
  {
    id: 'med-maxima-20',
    brandName: 'Maxima',
    genericName: 'Esomeprazole',
    companyName: 'ACME Laboratories Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '024-288-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg MUPS Tablet',
  },
  {
    id: 'med-opton-20',
    brandName: 'Opton',
    genericName: 'Esomeprazole',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '012-315-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 40 mg IV Injection',
  },
  {
    id: 'med-esotid-20',
    brandName: 'Esotid',
    genericName: 'Esomeprazole',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'গ্যাস্ট্রিক আলসার, বুক জ্বালাপোড়া (GERD) ও অ্যাসিডিটি নিরাময়ে ব্যবহৃত',
    darNo: '032-204-043',
    availableDosages: '20 mg Capsule, 40 mg Capsule, 20 mg Tablet',
  },

  // =========================================================================
  // 3. Pantoprazole 20mg & 40mg (Proton Pump Inhibitor - Gastric)
  // =========================================================================
  {
    id: 'med-pantonix-20',
    brandName: 'Pantonix',
    genericName: 'Pantoprazole',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 14 (140 pcs)',
    unitsPerStrip: 14,
    unitPrice: 7.0,
    stripPrice: 98.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'পেপটিক আলসার ও দীর্ঘমেয়াদী গ্যাস্ট্রিক সমস্যায় ব্যবহৃত',
    darNo: '198-065-043',
    availableDosages: '20 mg Tablet, 40 mg Tablet, 40 mg IV Injection',
  },
  {
    id: 'med-pantonix-40',
    brandName: 'Pantonix',
    genericName: 'Pantoprazole',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '40 mg',
    dosageForm: 'Tablet',
    packSize: '6 × 14 (84 pcs)',
    unitsPerStrip: 14,
    unitPrice: 10.0,
    stripPrice: 140.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'মাঝারি ও তীব্র রিফ্লাক্স ইসোফ্যাজাইটিস ও পেপটিক আলসারে ব্যবহৃত',
    darNo: '198-066-043',
    availableDosages: '20 mg Tablet, 40 mg Tablet, 40 mg IV Injection',
  },
  {
    id: 'med-trupan-20',
    brandName: 'Trupan',
    genericName: 'Pantoprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 14 (140 pcs)',
    unitsPerStrip: 14,
    unitPrice: 7.0,
    stripPrice: 98.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'পেপটিক আলসার ও দীর্ঘমেয়াদী গ্যাস্ট্রিক সমস্যায় ব্যবহৃত',
    darNo: '018-611-043',
    availableDosages: '20 mg Tablet, 40 mg Tablet, 40 mg IV Injection',
  },
  {
    id: 'med-pantosec-20',
    brandName: 'Pantosec',
    genericName: 'Pantoprazole',
    companyName: 'Drug International Ltd.',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'পেপটিক আলসার ও দীর্ঘমেয়াদী গ্যাস্ট্রিক সমস্যায় ব্যবহৃত',
    darNo: '154-092-043',
    availableDosages: '20 mg Tablet, 40 mg Tablet',
  },
  {
    id: 'med-pantodac-20',
    brandName: 'Pantodac',
    genericName: 'Pantoprazole',
    companyName: 'Ziska Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'পেপটিক আলসার ও দীর্ঘমেয়াদী গ্যাস্ট্রিক সমস্যায় ব্যবহৃত',
    darNo: '240-108-043',
    availableDosages: '20 mg Tablet, 40 mg Tablet',
  },

  // =========================================================================
  // 4. Rabeprazole Sodium 20mg (Proton Pump Inhibitor - Gastric)
  // =========================================================================
  {
    id: 'med-finix-20',
    brandName: 'Finix',
    genericName: 'Rabeprazole Sodium',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '20 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'দ্রুত অ্যাসিডিটি ও ডিওডেনাল আলসার নিরাময়ে ব্যবহৃত',
    darNo: '032-310-043',
    availableDosages: '10 mg Tablet, 20 mg Tablet, 20 mg Capsule, 20 mg MUPS Tablet',
  },
  {
    id: 'med-rabeca-20',
    brandName: 'Rabeca',
    genericName: 'Rabeprazole Sodium',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'দ্রুত অ্যাসিডিটি ও ডিওডেনাল আলসার নিরাময়ে ব্যবহৃত',
    darNo: '018-485-043',
    availableDosages: '20 mg Tablet, 20 mg Capsule',
  },
  {
    id: 'med-acifix-20',
    brandName: 'Acifix',
    genericName: 'Rabeprazole Sodium',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'দ্রুত অ্যাসিডিটি ও ডিওডেনাল আলসার নিরাময়ে ব্যবহৃত',
    darNo: '012-382-043',
    availableDosages: '20 mg Tablet, 20 mg Capsule',
  },
  {
    id: 'med-paricel-20',
    brandName: 'Paricel',
    genericName: 'Rabeprazole Sodium',
    companyName: 'ACME Laboratories Ltd.',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'দ্রুত অ্যাসিডিটি ও ডিওডেনাল আলসার নিরাময়ে ব্যবহৃত',
    darNo: '024-345-043',
    availableDosages: '10 mg Tablet, 20 mg Tablet, 20 mg Capsule',
  },

  // =========================================================================
  // 5. Paracetamol 500mg, 665mg & Suspension (Fever & Pain)
  // =========================================================================
  {
    id: 'med-napa-500',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '51 × 10 (510 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.2,
    stripPrice: 12.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের সাধারণ ব্যথা উপশমে ব্যবহৃত',
    darNo: '012-004-009',
    availableDosages: '500 mg Tablet, 665 mg XR Tablet, 120 mg/5 ml Suspension, Paediatric Drops',
  },
  {
    id: 'med-ace-500',
    brandName: 'Ace',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '50 × 10 (500 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.2,
    stripPrice: 12.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের সাধারণ ব্যথা উপশমে ব্যবহৃত',
    darNo: '018-011-009',
    availableDosages: '500 mg Tablet, 665 mg XR Tablet, 120 mg/5 ml Suspension, Suppository',
  },
  {
    id: 'med-fast-500',
    brandName: 'Fast',
    genericName: 'Paracetamol',
    companyName: 'ACME Laboratories Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '20 × 10 (200 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.2,
    stripPrice: 12.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের সাধারণ ব্যথা উপশমে ব্যবহৃত',
    darNo: '024-092-009',
    availableDosages: '500 mg Tablet, 665 mg XR Tablet, 120 mg/5 ml Suspension',
  },
  {
    id: 'med-reset-500',
    brandName: 'Reset',
    genericName: 'Paracetamol',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '20 × 10 (200 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.2,
    stripPrice: 12.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের সাধারণ ব্যথা উপশমে ব্যবহৃত',
    darNo: '198-115-009',
    availableDosages: '500 mg Tablet, 665 mg ER Tablet, 120 mg/5 ml Suspension',
  },
  {
    id: 'med-xpa-500',
    brandName: 'Xpa',
    genericName: 'Paracetamol',
    companyName: 'Aristopharma Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '20 × 10 (200 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.2,
    stripPrice: 12.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের সাধারণ ব্যথা উপশমে ব্যবহৃত',
    darNo: '095-078-009',
    availableDosages: '500 mg Tablet, 665 mg XR Tablet, 120 mg/5 ml Suspension',
  },
  {
    id: 'med-pyralgin-500',
    brandName: 'Pyralgin',
    genericName: 'Paracetamol',
    companyName: 'Renata PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '25 × 10 (250 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.2,
    stripPrice: 12.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের সাধারণ ব্যথা উপশমে ব্যবহৃত',
    darNo: '108-114-009',
    availableDosages: '500 mg Tablet, 120 mg/5 ml Suspension',
  },
  {
    id: 'med-napa-extend',
    brandName: 'Napa Extend',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '665 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 12 (120 pcs)',
    unitsPerStrip: 12,
    unitPrice: 2.0,
    stripPrice: 24.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'দীর্ঘস্থায়ী জ্বর, আর্থ্রাইটিস ও জয়েন্টের ব্যথা উপশমে ব্যবহৃত',
    darNo: '012-490-009',
    availableDosages: '665 mg Extended Release Tablet',
  },
  {
    id: 'med-ace-xr',
    brandName: 'Ace XR',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '665 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 2.0,
    stripPrice: 20.0,
    therapeuticClass: 'Analgesic & Antipyretic',
    indication: 'দীর্ঘস্থায়ী জ্বর, আর্থ্রাইটিস ও জয়েন্টের ব্যথা উপশমে ব্যবহৃত',
    darNo: '018-502-009',
    availableDosages: '665 mg Extended Release Tablet',
  },

  // =========================================================================
  // 6. Cefixime Trihydrate 200mg & 400mg (3rd Gen Cephalosporin Antibiotic)
  // =========================================================================
  {
    id: 'med-cefixime-cefim-3',
    brandName: 'Cef-3',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '200 mg',
    dosageForm: 'Capsule',
    packSize: '2 × 7 (14 pcs)',
    unitsPerStrip: 7,
    unitPrice: 45.0,
    stripPrice: 315.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, মূত্রনালী, টাইফয়েড জ্বর, কান ও গলার ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '018-290-025',
    availableDosages: '200 mg Capsule, 400 mg DS Capsule, 100 mg/5 ml Suspension',
  },
  {
    id: 'med-cef3-ds-400',
    brandName: 'Cef-3 DS',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '400 mg',
    dosageForm: 'Capsule',
    packSize: '1 × 7 (7 pcs)',
    unitsPerStrip: 7,
    unitPrice: 65.0,
    stripPrice: 455.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'তীব্র ব্যাকটেরিয়াজনিত সংক্রমণ ও টাইফয়েড জ্বরে ব্যবহৃত',
    darNo: '018-291-025',
    availableDosages: '200 mg Capsule, 400 mg DS Capsule, 100 mg/5 ml Suspension',
  },
  {
    id: 'med-denvar-200',
    brandName: 'Denvar',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '200 mg',
    dosageForm: 'Capsule',
    packSize: '2 × 7 (14 pcs)',
    unitsPerStrip: 7,
    unitPrice: 40.0,
    stripPrice: 280.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, মূত্রনালী, টাইফয়েড জ্বর, কান ও গলার ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '319-112-025',
    availableDosages: '200 mg Capsule, 400 mg DS Capsule, 100 mg/5 ml Suspension',
  },
  {
    id: 'med-denvar-ds-400',
    brandName: 'Denvar DS',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '400 mg',
    dosageForm: 'Capsule',
    packSize: '1 × 7 (7 pcs)',
    unitsPerStrip: 7,
    unitPrice: 60.0,
    stripPrice: 420.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'তীব্র ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '319-113-025',
    availableDosages: '200 mg Capsule, 400 mg DS Capsule, 100 mg/5 ml Suspension',
  },
  {
    id: 'med-triocim-200',
    brandName: 'Triocim',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '200 mg',
    dosageForm: 'Capsule',
    packSize: '2 × 7 (14 pcs)',
    unitsPerStrip: 7,
    unitPrice: 45.0,
    stripPrice: 315.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, মূত্রনালী, টাইফয়েড জ্বর, কান ও গলার ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '012-308-025',
    availableDosages: '200 mg Capsule, 400 mg Capsule, 100 mg/5 ml Suspension',
  },
  {
    id: 'med-orcef-200',
    brandName: 'Orcef',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Renata PLC',
    strength: '200 mg',
    dosageForm: 'Capsule',
    packSize: '2 × 7 (14 pcs)',
    unitsPerStrip: 7,
    unitPrice: 35.0,
    stripPrice: 245.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, মূত্রনালী, টাইফয়েড জ্বর, কান ও গলার ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '108-184-025',
    availableDosages: '200 mg Capsule, 400 mg Capsule, 100 mg/5 ml Suspension',
  },
  {
    id: 'med-emixef-200',
    brandName: 'Emixef',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '200 mg',
    dosageForm: 'Capsule',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 35.0,
    stripPrice: 210.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, মূত্রনালী, টাইফয়েড জ্বর, কান ও গলার ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '198-204-025',
    availableDosages: '200 mg Capsule, 400 mg Capsule, 100 mg/5 ml Suspension',
  },
  {
    id: 'med-tcef-200',
    brandName: 'T-Cef',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '200 mg',
    dosageForm: 'Capsule',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 35.0,
    stripPrice: 210.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, মূত্রনালী, টাইফয়েড জ্বর, কান ও গলার ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '032-415-025',
    availableDosages: '200 mg Capsule, 400 mg Capsule, 100 mg/5 ml Suspension',
  },

  // =========================================================================
  // 7. Cefuroxime Axetil 500mg (2nd Gen Cephalosporin Antibiotic)
  // =========================================================================
  {
    id: 'med-kilbac-500',
    brandName: 'Kilbac',
    genericName: 'Cefuroxime Axetil',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 4 (12 pcs)',
    unitsPerStrip: 4,
    unitPrice: 45.0,
    stripPrice: 180.0,
    therapeuticClass: '2nd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, চর্ম, নরম কলা ও মূত্রনালীর সংক্রমণে ব্যবহৃত',
    darNo: '198-152-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 125 mg/5 ml Suspension, 750 mg IV Injection',
  },
  {
    id: 'med-cefotil-500',
    brandName: 'Cefotil',
    genericName: 'Cefuroxime Axetil',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 45.0,
    stripPrice: 270.0,
    therapeuticClass: '2nd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, চর্ম, নরম কলা ও মূত্রনালীর সংক্রমণে ব্যবহৃত',
    darNo: '018-315-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 125 mg/5 ml Suspension',
  },
  {
    id: 'med-furocef-500',
    brandName: 'Furocef',
    genericName: 'Cefuroxime Axetil',
    companyName: 'Renata PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 45.0,
    stripPrice: 270.0,
    therapeuticClass: '2nd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, চর্ম, নরম কলা ও মূত্রনালীর সংক্রমণে ব্যবহৃত',
    darNo: '108-221-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 125 mg/5 ml Suspension',
  },
  {
    id: 'med-ceroxa-500',
    brandName: 'Cerox-A',
    genericName: 'Cefuroxime Axetil',
    companyName: 'ACME Laboratories Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 4 (12 pcs)',
    unitsPerStrip: 4,
    unitPrice: 45.0,
    stripPrice: 180.0,
    therapeuticClass: '2nd Gen Cephalosporin Antibiotic',
    indication: 'শ্বাসতন্ত্র, চর্ম, নরম কলা ও মূত্রনালীর সংক্রমণে ব্যবহৃত',
    darNo: '024-275-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 125 mg/5 ml Suspension',
  },

  // =========================================================================
  // 8. Azithromycin 500mg (Macrolide Antibiotic)
  // =========================================================================
  {
    id: 'med-zimax-500',
    brandName: 'Zimax',
    genericName: 'Azithromycin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 6 (18 pcs)',
    unitsPerStrip: 6,
    unitPrice: 40.0,
    stripPrice: 240.0,
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'গলা ব্যথা, টনসিলাইটিস, সাইনোসাইটিস, নিউমোনিয়া ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '018-177-023',
    availableDosages: '250 mg Capsule, 500 mg Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-azithrocin-500',
    brandName: 'Azithrocin',
    genericName: 'Azithromycin',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 3 (12 pcs)',
    unitsPerStrip: 3,
    unitPrice: 38.0,
    stripPrice: 114.0,
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'গলা ব্যথা, টনসিলাইটিস, সাইনোসাইটিস, নিউমোনিয়া ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '012-215-023',
    availableDosages: '250 mg Capsule, 500 mg Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-zithrin-500',
    brandName: 'Zithrin',
    genericName: 'Azithromycin',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 3 (15 pcs)',
    unitsPerStrip: 3,
    unitPrice: 35.0,
    stripPrice: 105.0,
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'গলা ব্যথা, টনসিলাইটিস, সাইনোসাইটিস, নিউমোনিয়া ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '198-092-023',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-rozith-500',
    brandName: 'Rozith',
    genericName: 'Azithromycin',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 3 (12 pcs)',
    unitsPerStrip: 3,
    unitPrice: 38.0,
    stripPrice: 114.0,
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'গলা ব্যথা, টনসিলাইটিস, সাইনোসাইটিস, নিউমোনিয়া ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '319-099-023',
    availableDosages: '500 mg Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-azicin-500',
    brandName: 'Azicin',
    genericName: 'Azithromycin',
    companyName: 'ACME Laboratories Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 3 (12 pcs)',
    unitsPerStrip: 3,
    unitPrice: 35.0,
    stripPrice: 105.0,
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'গলা ব্যথা, টনসিলাইটিস, সাইনোসাইটিস, নিউমোনিয়া ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '024-184-023',
    availableDosages: '250 mg Capsule, 500 mg Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-zycin-500',
    brandName: 'Zycin',
    genericName: 'Azithromycin',
    companyName: 'Globe Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 35.0,
    stripPrice: 210.0,
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'গলা ব্যথা, টনসিলাইটিস, সাইনোসাইটিস, নিউমোনিয়া, ব্রংকাইটিস ও চর্মের ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '064-152-023',
    availableDosages: '250 mg Capsule, 500 mg Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-tridosil-500',
    brandName: 'Tridosil',
    genericName: 'Azithromycin',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 3 (12 pcs)',
    unitsPerStrip: 3,
    unitPrice: 35.0,
    stripPrice: 105.0,
    therapeuticClass: 'Macrolide Antibiotic',
    indication: 'গলা ব্যথা, টনসিলাইটিস, সাইনোসাইটিস, নিউমোনিয়া ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '198-144-023',
    availableDosages: '250 mg Capsule, 500 mg Tablet, 200 mg/5 ml Suspension',
  },

  // =========================================================================
  // 9. Ciprofloxacin 500mg & Fluconazole 50mg
  // =========================================================================
  {
    id: 'med-ciprocin-500',
    brandName: 'Ciprocin',
    genericName: 'Ciprofloxacin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 15.0,
    stripPrice: 150.0,
    therapeuticClass: 'Fluoroquinolone Antibiotic',
    indication: 'মূত্রনালীর সংক্রমণ, ডায়রিয়া, টাইফয়েড ও চর্মের ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '018-088-022',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 750 mg Tablet, 250 mg/5 ml Suspension',
  },
  {
    id: 'med-neofloxin-500',
    brandName: 'Neofloxin',
    genericName: 'Ciprofloxacin',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 15.0,
    stripPrice: 150.0,
    therapeuticClass: 'Fluoroquinolone Antibiotic',
    indication: 'মূত্রনালীর সংক্রমণ, ডায়রিয়া, টাইফয়েড ও চর্মের ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '012-095-022',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 250 mg/5 ml Suspension',
  },
  {
    id: 'med-beuflox-500',
    brandName: 'Beuflox',
    genericName: 'Ciprofloxacin',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 14.0,
    stripPrice: 140.0,
    therapeuticClass: 'Fluoroquinolone Antibiotic',
    indication: 'মূত্রনালীর সংক্রমণ, ডায়রিয়া, টাইফয়েড ও চর্মের ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত',
    darNo: '198-074-022',
    availableDosages: '500 mg Tablet, 250 mg/5 ml Suspension',
  },
  {
    id: 'med-flugal-50',
    brandName: 'Flugal',
    genericName: 'Fluconazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '50 mg',
    dosageForm: 'Capsule',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Systemic Antifungal',
    indication: 'দাদ, ছত্রাকজনিত চর্মরোগ ও ক্যানডিডিয়াসিস সংক্রমণে ব্যবহৃত',
    darNo: '018-165-028',
    availableDosages: '50 mg Capsule, 150 mg Capsule, 200 mg Capsule, 50 mg/5 ml Suspension',
  },
  {
    id: 'med-omastin-50',
    brandName: 'Omastin',
    genericName: 'Fluconazole',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '50 mg',
    dosageForm: 'Capsule',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Systemic Antifungal',
    indication: 'দাদ, ছত্রাকজনিত চর্মরোগ ও ক্যানডিডিয়াসিস সংক্রমণে ব্যবহৃত',
    darNo: '012-182-028',
    availableDosages: '50 mg Capsule, 150 mg Capsule, 50 mg/5 ml Suspension',
  },
  {
    id: 'med-lucanr-50',
    brandName: 'Lucan-R',
    genericName: 'Fluconazole',
    companyName: 'Renata PLC',
    strength: '50 mg',
    dosageForm: 'Capsule',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Systemic Antifungal',
    indication: 'দাদ, ছত্রাকজনিত চর্মরোগ ও ক্যানডিডিয়াসিস সংক্রমণে ব্যবহৃত',
    darNo: '108-159-028',
    availableDosages: '50 mg Capsule, 150 mg Capsule',
  },

  // =========================================================================
  // 10. Montelukast Sodium 10mg (Asthma & Allergic Rhinitis)
  // =========================================================================
  {
    id: 'med-monas-10',
    brandName: 'Monas',
    genericName: 'Montelukast Sodium',
    companyName: 'ACME Laboratories Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 15 (30 pcs)',
    unitsPerStrip: 15,
    unitPrice: 17.5,
    stripPrice: 262.5,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '024-312-061',
    availableDosages: '4 mg Chewable Tablet, 5 mg Chewable Tablet, 10 mg Tablet',
  },
  {
    id: 'med-montene-10',
    brandName: 'Montene',
    genericName: 'Montelukast Sodium',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 16.0,
    stripPrice: 160.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '018-415-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-aeron-10',
    brandName: 'Aeron',
    genericName: 'Montelukast Sodium',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 17.5,
    stripPrice: 175.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '319-185-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-montair-10',
    brandName: 'Montair',
    genericName: 'Montelukast Sodium',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 16.0,
    stripPrice: 160.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '198-281-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-montril-10',
    brandName: 'Montril',
    genericName: 'Montelukast Sodium',
    companyName: 'Aristopharma Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 16.0,
    stripPrice: 160.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '078-219-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-monocast-10',
    brandName: 'Monocast',
    genericName: 'Montelukast Sodium',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 16.0,
    stripPrice: 160.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '012-389-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-reversair-10',
    brandName: 'Reversair',
    genericName: 'Montelukast Sodium',
    companyName: 'ACI Limited',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 14 (28 pcs)',
    unitsPerStrip: 14,
    unitPrice: 17.5,
    stripPrice: 245.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '045-239-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-lumona-10',
    brandName: 'Lumona',
    genericName: 'Montelukast Sodium',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 14 (28 pcs)',
    unitsPerStrip: 14,
    unitPrice: 16.0,
    stripPrice: 224.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '211-189-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-mlucas-10',
    brandName: 'M-lucas',
    genericName: 'Montelukast Sodium',
    companyName: 'Popular Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 15 (30 pcs)',
    unitsPerStrip: 15,
    unitPrice: 17.0,
    stripPrice: 255.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist',
    indication: 'হাঁপানি (অ্যাজমা), দীর্ঘমেয়াদী কাশি ও অ্যালার্জিক রাইনাইটিস প্রতিরোধে ব্যবহৃত',
    darNo: '142-195-061',
    availableDosages: '4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },

  // =========================================================================
  // 11. Fexofenadine Hydrochloride 120mg & Cetirizine 10mg (Allergy)
  // =========================================================================
  {
    id: 'med-fexo-120',
    brandName: 'Fexo',
    genericName: 'Fexofenadine Hydrochloride',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '120 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Non-sedating Antihistamine',
    indication: 'হাঁচি, সর্দি, অ্যালার্জিক রাইনাইটিস ও চুলকানি উপশমে ব্যবহৃত',
    darNo: '018-241-014',
    availableDosages: '60 mg Tablet, 120 mg Tablet, 180 mg Tablet, 30 mg/5 ml Suspension',
  },
  {
    id: 'med-fenadin-120',
    brandName: 'Fenadin',
    genericName: 'Fexofenadine Hydrochloride',
    companyName: 'Renata PLC',
    strength: '120 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Non-sedating Antihistamine',
    indication: 'হাঁচি, সর্দি, অ্যালার্জিক রাইনাইটিস ও চুলকানি উপশমে ব্যবহৃত',
    darNo: '108-192-014',
    availableDosages: '60 mg Tablet, 120 mg Tablet, 180 mg Tablet, 30 mg/5 ml Suspension',
  },
  {
    id: 'med-axodin-120',
    brandName: 'Axodin',
    genericName: 'Fexofenadine Hydrochloride',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '120 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Non-sedating Antihistamine',
    indication: 'হাঁচি, সর্দি, অ্যালার্জিক রাইনাইটিস ও চুলকানি উপশমে ব্যবহৃত',
    darNo: '012-274-014',
    availableDosages: '60 mg Tablet, 120 mg Tablet, 180 mg Tablet, 30 mg/5 ml Suspension',
  },
  {
    id: 'med-fexofast-120',
    brandName: 'Fexofast',
    genericName: 'Fexofenadine Hydrochloride',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '120 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Non-sedating Antihistamine',
    indication: 'হাঁচি, সর্দি, অ্যালার্জিক রাইনাইটিস ও চুলকানি উপশমে ব্যবহৃত',
    darNo: '211-208-014',
    availableDosages: '60 mg Tablet, 120 mg Tablet, 180 mg Tablet',
  },
  {
    id: 'med-fixal-120',
    brandName: 'Fixal',
    genericName: 'Fexofenadine Hydrochloride',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '120 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Non-sedating Antihistamine',
    indication: 'হাঁচি, সর্দি, অ্যালার্জিক রাইনাইটিস ও চুলকানি উপশমে ব্যবহৃত',
    darNo: '032-198-014',
    availableDosages: '60 mg Tablet, 120 mg Tablet, 180 mg Tablet',
  },
  {
    id: 'med-alatrol-10',
    brandName: 'Alatrol',
    genericName: 'Cetirizine Hydrochloride',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '15 × 10 (150 pcs)',
    unitsPerStrip: 10,
    unitPrice: 3.0,
    stripPrice: 30.0,
    therapeuticClass: 'Antihistamine (Allergy)',
    indication: 'ঠান্ডা-সর্দি, হাঁচি, চুলকানি ও অ্যালার্জি নিরাময়ে ব্যবহৃত',
    darNo: '018-095-014',
    availableDosages: '10 mg Tablet, 5 mg/5 ml Syrup, Paediatric Drops',
  },
  {
    id: 'med-atrizin-10',
    brandName: 'Atrizin',
    genericName: 'Cetirizine Hydrochloride',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 3.0,
    stripPrice: 30.0,
    therapeuticClass: 'Antihistamine (Allergy)',
    indication: 'ঠান্ডা-সর্দি, হাঁচি, চুলকানি ও অ্যালার্জি নিরাময়ে ব্যবহৃত',
    darNo: '012-102-014',
    availableDosages: '10 mg Tablet, 5 mg/5 ml Syrup',
  },

  // =========================================================================
  // 12. Antihypertensives (Bizoran, Camlosart, Amdocal, Camlodin, Angilock)
  // =========================================================================
  {
    id: 'med-bizoran-5-20',
    brandName: 'Bizoran',
    genericName: 'Amlodipine + Olmesartan Medoxomil',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '5 mg + 20 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 15 (60 pcs)',
    unitsPerStrip: 15,
    unitPrice: 12.0,
    stripPrice: 180.0,
    therapeuticClass: 'Antihypertensive (Blood Pressure)',
    indication: 'উচ্চ রক্তচাপ (Hypertension) নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '012-409-032',
    availableDosages: '5 mg + 20 mg Tablet, 5 mg + 40 mg Tablet, 10 mg + 40 mg Tablet',
  },
  {
    id: 'med-camlosart-5-20',
    brandName: 'Camlosart',
    genericName: 'Amlodipine + Olmesartan Medoxomil',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 mg + 20 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Antihypertensive (Blood Pressure)',
    indication: 'উচ্চ রক্তচাপ (Hypertension) নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-455-032',
    availableDosages: '5 mg + 20 mg Tablet, 5 mg + 40 mg Tablet',
  },
  {
    id: 'med-orbas-5-20',
    brandName: 'Orbas',
    genericName: 'Amlodipine + Olmesartan Medoxomil',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '5 mg + 20 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 11.0,
    stripPrice: 110.0,
    therapeuticClass: 'Antihypertensive (Blood Pressure)',
    indication: 'উচ্চ রক্তচাপ (Hypertension) নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '198-390-032',
    availableDosages: '5 mg + 20 mg Tablet, 5 mg + 40 mg Tablet',
  },
  {
    id: 'med-olmezest-am-5-20',
    brandName: 'Olmezest AM',
    genericName: 'Amlodipine + Olmesartan Medoxomil',
    companyName: 'Drug International Ltd.',
    strength: '5 mg + 20 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Antihypertensive (Blood Pressure)',
    indication: 'উচ্চ রক্তচাপ (Hypertension) নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '154-301-032',
    availableDosages: '5 mg + 20 mg Tablet, 5 mg + 40 mg Tablet',
  },
  {
    id: 'med-amdocal-5',
    brandName: 'Amdocal',
    genericName: 'Amlodipine',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.5,
    stripPrice: 55.0,
    therapeuticClass: 'Calcium Channel Blocker (BP)',
    indication: 'উচ্চ রক্তচাপ ও এনজাইনা পেকটোরিস নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '012-088-031',
    availableDosages: '5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-camlodin-5',
    brandName: 'Camlodin',
    genericName: 'Amlodipine',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 14 (56 pcs)',
    unitsPerStrip: 14,
    unitPrice: 5.0,
    stripPrice: 70.0,
    therapeuticClass: 'Calcium Channel Blocker (BP)',
    indication: 'উচ্চ রক্তচাপ ও এনজাইনা পেকটোরিস নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-091-031',
    availableDosages: '5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-angilock-50',
    brandName: 'Angilock',
    genericName: 'Losartan Potassium',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '50 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Angiotensin II Antagonist (BP)',
    indication: 'উচ্চ রক্তচাপ ও হার্ট ফেইলিউর নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-205-032',
    availableDosages: '25 mg Tablet, 50 mg Tablet, 100 mg Tablet',
  },
  {
    id: 'med-osartil-50',
    brandName: 'Osartil',
    genericName: 'Losartan Potassium',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '50 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Angiotensin II Antagonist (BP)',
    indication: 'উচ্চ রক্তচাপ ও হার্ট ফেইলিউর নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '198-112-032',
    availableDosages: '25 mg Tablet, 50 mg Tablet, 100 mg Tablet',
  },

  // =========================================================================
  // 13. Cholesterol / Statins (Atorvastatin 10mg & Rosuvastatin 10mg)
  // =========================================================================
  {
    id: 'med-atova-10',
    brandName: 'Atova',
    genericName: 'Atorvastatin Calcium',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 11.0,
    stripPrice: 110.0,
    therapeuticClass: 'Lipid-Lowering Agent (Statin)',
    indication: 'রক্তে অতিরিক্ত কোলেস্টেরল ও ট্রাইগ্লিসারাইড কমাতে এবং হৃদরোগ প্রতিরোধে ব্যবহৃত',
    darNo: '012-218-038',
    availableDosages: '10 mg Tablet, 20 mg Tablet, 40 mg Tablet',
  },
  {
    id: 'med-anzitor-10',
    brandName: 'Anzitor',
    genericName: 'Atorvastatin Calcium',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Lipid-Lowering Agent (Statin)',
    indication: 'রক্তে অতিরিক্ত কোলেস্টেরল ও ট্রাইগ্লিসারাইড কমাতে এবং হৃদরোগ প্রতিরোধে ব্যবহৃত',
    darNo: '018-245-038',
    availableDosages: '10 mg Tablet, 20 mg Tablet, 40 mg Tablet',
  },
  {
    id: 'med-lipicon-10',
    brandName: 'Lipicon',
    genericName: 'Atorvastatin Calcium',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Lipid-Lowering Agent (Statin)',
    indication: 'রক্তে অতিরিক্ত কোলেস্টেরল ও ট্রাইগ্লিসারাইড কমাতে এবং হৃদরোগ প্রতিরোধে ব্যবহৃত',
    darNo: '211-190-038',
    availableDosages: '10 mg Tablet, 20 mg Tablet, 40 mg Tablet',
  },
  {
    id: 'med-rolip-10',
    brandName: 'Rolip',
    genericName: 'Rosuvastatin Calcium',
    companyName: 'Renata PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 24.0,
    stripPrice: 240.0,
    therapeuticClass: 'Lipid-Lowering Agent (Statin)',
    indication: 'রক্তে ক্ষতিকর LDL কোলেস্টেরল কমানো ও হার্ট অ্যাটাকের ঝুঁকি প্রতিরোধে ব্যবহৃত',
    darNo: '108-277-038',
    availableDosages: '5 mg Tablet, 10 mg Tablet, 20 mg Tablet',
  },
  {
    id: 'med-rocovas-10',
    brandName: 'Rocovas',
    genericName: 'Rosuvastatin Calcium',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 22.0,
    stripPrice: 220.0,
    therapeuticClass: 'Lipid-Lowering Agent (Statin)',
    indication: 'রক্তে ক্ষতিকর LDL কোলেস্টেরল কমানো ও হার্ট অ্যাটাকের ঝুঁকি প্রতিরোধে ব্যবহৃত',
    darNo: '198-341-038',
    availableDosages: '5 mg Tablet, 10 mg Tablet, 20 mg Tablet',
  },

  // =========================================================================
  // 14. Metformin HCl 500mg (Diabetes)
  // =========================================================================
  {
    id: 'med-comet-500',
    brandName: 'Comet',
    genericName: 'Metformin Hydrochloride',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Antidiabetic (Biguanide)',
    indication: 'টাইপ-২ ডায়াবেটিস রোগীদের রক্তের গ্লুকোজ নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-119-051',
    availableDosages: '500 mg Tablet, 850 mg Tablet, 500 mg XR Tablet, 1000 mg XR Tablet',
  },
  {
    id: 'med-informet-500',
    brandName: 'Informet',
    genericName: 'Metformin Hydrochloride',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Antidiabetic (Biguanide)',
    indication: 'টাইপ-২ ডায়াবেটিস রোগীদের রক্তের গ্লুকোজ নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '012-160-051',
    availableDosages: '500 mg Tablet, 850 mg Tablet, 500 mg XR Tablet',
  },
  {
    id: 'med-bigmet-500',
    brandName: 'Bigmet',
    genericName: 'Metformin Hydrochloride',
    companyName: 'Renata PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Antidiabetic (Biguanide)',
    indication: 'টাইপ-২ ডায়াবেটিস রোগীদের রক্তের গ্লুকোজ নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '108-145-051',
    availableDosages: '500 mg Tablet, 850 mg Tablet',
  },
  {
    id: 'med-daomin-500',
    brandName: 'Daomin',
    genericName: 'Metformin Hydrochloride',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 4.0,
    stripPrice: 40.0,
    therapeuticClass: 'Antidiabetic (Biguanide)',
    indication: 'টাইপ-২ ডায়াবেটিস রোগীদের রক্তের গ্লুকোজ নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '032-132-051',
    availableDosages: '500 mg Tablet, 850 mg Tablet',
  },

  // =========================================================================
  // 15. Calcium Carbonate + Vitamin D3 (500mg + 200IU)
  // =========================================================================
  {
    id: 'med-calbo-d',
    brandName: 'Calbo-D',
    genericName: 'Calcium Carbonate + Vitamin D3',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg + 200 IU',
    dosageForm: 'Tablet',
    packSize: '2 × 15 (30 pcs)',
    unitsPerStrip: 15,
    unitPrice: 8.0,
    stripPrice: 120.0,
    therapeuticClass: 'Calcium & Vitamin D3 Supplement',
    indication: 'ক্যালসিয়াম ও ভিটামিন ডি-এর ঘাটতি এবং হাড়ের ক্ষয়রোধে ব্যবহৃত',
    darNo: '018-302-072',
    availableDosages: '500 mg + 200 IU Tablet, 500 mg + 400 IU Tablet',
  },
  {
    id: 'med-ostocal-d',
    brandName: 'Ostocal D',
    genericName: 'Calcium Carbonate + Vitamin D3',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '500 mg + 200 IU',
    dosageForm: 'Tablet',
    packSize: '2 × 15 (30 pcs)',
    unitsPerStrip: 15,
    unitPrice: 8.0,
    stripPrice: 120.0,
    therapeuticClass: 'Calcium & Vitamin D3 Supplement',
    indication: 'ক্যালসিয়াম ও ভিটামিন ডি-এর ঘাটতি এবং হাড়ের ক্ষয়রোধে ব্যবহৃত',
    darNo: '211-165-072',
    availableDosages: '500 mg + 200 IU Tablet, Ostocal DX (600 mg + 400 IU)',
  },
  {
    id: 'med-coralcal-d',
    brandName: 'Coralcal-D',
    genericName: 'Calcium Carbonate + Vitamin D3',
    companyName: 'Radiant Pharmaceuticals Ltd.',
    strength: '500 mg + 200 IU',
    dosageForm: 'Tablet',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 13.0,
    stripPrice: 130.0,
    therapeuticClass: 'Calcium & Vitamin D3 Supplement',
    indication: 'কোরাল ক্যালসিয়াম ও ভিটামিন ডি-এর ঘাটতি এবং অস্টিওপোরোসিস প্রতিরোধে ব্যবহৃত',
    darNo: '285-088-072',
    availableDosages: '500 mg + 200 IU Tablet, Coralcal-DX (600 mg + 400 IU)',
  },
  {
    id: 'med-aristocal-d',
    brandName: 'Aristocal D',
    genericName: 'Calcium Carbonate + Vitamin D3',
    companyName: 'Aristopharma Ltd.',
    strength: '500 mg + 200 IU',
    dosageForm: 'Tablet',
    packSize: '2 × 15 (30 pcs)',
    unitsPerStrip: 15,
    unitPrice: 8.0,
    stripPrice: 120.0,
    therapeuticClass: 'Calcium & Vitamin D3 Supplement',
    indication: 'ক্যালসিয়াম ও ভিটামিন ডি-এর ঘাটতি এবং হাড়ের ক্ষয়রোধে ব্যবহৃত',
    darNo: '095-210-072',
    availableDosages: '500 mg + 200 IU Tablet',
  },

  // =========================================================================
  // 16. Domperidone Maleate 10mg (Anti-emetic / Prokinetic)
  // =========================================================================
  {
    id: 'med-omidon-10',
    brandName: 'Omidon',
    genericName: 'Domperidone Maleate',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 15 (150 pcs)',
    unitsPerStrip: 15,
    unitPrice: 3.5,
    stripPrice: 52.5,
    therapeuticClass: 'Prokinetic & Anti-emetic',
    indication: 'বমি ভাব, বমি, পেট ফাঁপা ও বদহজম নিরাময়ে ব্যবহৃত',
    darNo: '198-041-046',
    availableDosages: '10 mg Tablet, 5 mg/5 ml Suspension, Paediatric Drops',
  },
  {
    id: 'med-motigut-10',
    brandName: 'Motigut',
    genericName: 'Domperidone Maleate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 3.5,
    stripPrice: 35.0,
    therapeuticClass: 'Prokinetic & Anti-emetic',
    indication: 'বমি ভাব, বমি, পেট ফাঁপা ও বদহজম নিরাময়ে ব্যবহৃত',
    darNo: '018-092-046',
    availableDosages: '10 mg Tablet, 5 mg/5 ml Suspension, Paediatric Drops',
  },
  {
    id: 'med-deflux-10',
    brandName: 'Deflux',
    genericName: 'Domperidone Maleate',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 3.6,
    stripPrice: 36.0,
    therapeuticClass: 'Prokinetic & Anti-emetic',
    indication: 'বমি ভাব, বমি, পেট ফাঁপা ও বদহজম নিরাময়ে ব্যবহৃত',
    darNo: '012-104-046',
    availableDosages: '10 mg Tablet, 5 mg/5 ml Suspension',
  },
  {
    id: 'med-domin-10',
    brandName: 'Domin',
    genericName: 'Domperidone Maleate',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 3.0,
    stripPrice: 30.0,
    therapeuticClass: 'Prokinetic & Anti-emetic',
    indication: 'বমি ভাব, বমি, পেট ফাঁপা ও বদহজম নিরাময়ে ব্যবহৃত',
    darNo: '032-087-046',
    availableDosages: '10 mg Tablet, 5 mg/5 ml Suspension',
  },

  // =========================================================================
  // 17. Ketorolac Tromethamine 10mg (Moderate to Severe Pain)
  // =========================================================================
  {
    id: 'med-rolac-10',
    brandName: 'Rolac',
    genericName: 'Ketorolac Tromethamine',
    companyName: 'Renata PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 14 (56 pcs)',
    unitsPerStrip: 14,
    unitPrice: 12.0,
    stripPrice: 168.0,
    therapeuticClass: 'NSAID Analgesic',
    indication: 'তীব্র দাঁতব্যথা, অপারেশন পরবর্তী ব্যথা ও আঘাতজনিত ব্যথায় ব্যবহৃত',
    darNo: '108-199-011',
    availableDosages: '10 mg Tablet, 30 mg/ml Injection, 60 mg/2 ml Injection',
  },
  {
    id: 'med-toradolin-10',
    brandName: 'Toradolin',
    genericName: 'Ketorolac Tromethamine',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 10 (40 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'NSAID Analgesic',
    indication: 'তীব্র দাঁতব্যথা, অপারেশন পরবর্তী ব্যথা ও আঘাতজনিত ব্যথায় ব্যবহৃত',
    darNo: '018-278-011',
    availableDosages: '10 mg Tablet, 30 mg/ml Injection',
  },
  {
    id: 'med-zidolac-10',
    brandName: 'Zidolac',
    genericName: 'Ketorolac Tromethamine',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '4 × 10 (40 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'NSAID Analgesic',
    indication: 'তীব্র দাঁতব্যথা, অপারেশন পরবর্তী ব্যথা ও আঘাতজনিত ব্যথায় ব্যবহৃত',
    darNo: '012-265-011',
    availableDosages: '10 mg Tablet, 30 mg/ml Injection',
  },
  {
    id: 'med-winop-10',
    brandName: 'Winop',
    genericName: 'Ketorolac Tromethamine',
    companyName: 'ACI Limited',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'NSAID Analgesic',
    indication: 'তীব্র দাঁতব্যথা, অপারেশন পরবর্তী ব্যথা ও আঘাতজনিত ব্যথায় ব্যবহৃত',
    darNo: '045-182-011',
    availableDosages: '10 mg Tablet, 30 mg/ml Injection',
  },

  // =========================================================================
  // 18. Clopidogrel Bisulphate 75mg (Antiplatelet / Cardiac)
  // =========================================================================
  {
    id: 'med-anclog-75',
    brandName: 'Anclog',
    genericName: 'Clopidogrel Bisulphate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '75 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Antiplatelet (Cardiac)',
    indication: 'হার্ট অ্যাটাক ও স্ট্রোক প্রতিরোধে রক্ত জমাট বাঁধা রোধে ব্যবহৃত',
    darNo: '018-219-035',
    availableDosages: '75 mg Tablet, Anclog Plus (75 mg + 75 mg Aspirin)',
  },
  {
    id: 'med-noclog-75',
    brandName: 'Noclog',
    genericName: 'Clopidogrel Bisulphate',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '75 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Antiplatelet (Cardiac)',
    indication: 'হার্ট অ্যাটাক ও স্ট্রোক প্রতিরোধে রক্ত জমাট বাঁধা রোধে ব্যবহৃত',
    darNo: '211-144-035',
    availableDosages: '75 mg Tablet, Noclog Plus (75 mg + 75 mg Aspirin)',
  },
  {
    id: 'med-replet-75',
    brandName: 'Replet',
    genericName: 'Clopidogrel Bisulphate',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '75 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Antiplatelet (Cardiac)',
    indication: 'হার্ট অ্যাটাক ও স্ট্রোক প্রতিরোধে রক্ত জমাট বাঁধা রোধে ব্যবহৃত',
    darNo: '198-189-035',
    availableDosages: '75 mg Tablet, Replet Plus (75 mg + 75 mg Aspirin)',
  },
  {
    id: 'med-clopid-75',
    brandName: 'Clopid',
    genericName: 'Clopidogrel Bisulphate',
    companyName: 'Drug International Ltd.',
    strength: '75 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Antiplatelet (Cardiac)',
    indication: 'হার্ট অ্যাটাক ও স্ট্রোক প্রতিরোধে রক্ত জমাট বাঁধা রোধে ব্যবহৃত',
    darNo: '154-174-035',
    availableDosages: '75 mg Tablet',
  },

  // =========================================================================
  // 19. Clonazepam 0.5mg & Mebeverine HCl 135mg (Neurology & IBS)
  // =========================================================================
  {
    id: 'med-disopan-05',
    brandName: 'Disopan',
    genericName: 'Clonazepam',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '0.5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Benzodiazepine (Anxiolytic)',
    indication: 'প্যানিক ডিসঅর্ডার, দুশ্চিন্তা, অনিদ্রা ও খিঁচুনি নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '198-105-018',
    availableDosages: '0.5 mg Tablet, 1 mg Tablet, 2 mg Tablet',
  },
  {
    id: 'med-pase-05',
    brandName: 'Pase',
    genericName: 'Clonazepam',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '0.5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.5,
    stripPrice: 65.0,
    therapeuticClass: 'Benzodiazepine (Anxiolytic)',
    indication: 'প্যানিক ডিসঅর্ডার, দুশ্চিন্তা, অনিদ্রা ও খিঁচুনি নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '032-119-018',
    availableDosages: '0.5 mg Tablet, 1 mg Tablet, 2 mg Tablet',
  },
  {
    id: 'med-rostil-135',
    brandName: 'Rostil',
    genericName: 'Mebeverine Hydrochloride',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '135 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Antispasmodic (IBS)',
    indication: 'ইরিটেবল বাওয়েল সিনড্রোম (IBS), পেট কামড়ানো ও অন্ত্রের খিঁচুনি উপশমে ব্যবহৃত',
    darNo: '012-194-047',
    availableDosages: '135 mg Tablet, Rostil SR 200 mg Capsule',
  },
  {
    id: 'med-mebolin-135',
    brandName: 'Mebolin',
    genericName: 'Mebeverine Hydrochloride',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '135 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Antispasmodic (IBS)',
    indication: 'ইরিটেবল বাওয়েল সিনড্রোম (IBS), পেট কামড়ানো ও অন্ত্রের খিঁচুনি উপশমে ব্যবহৃত',
    darNo: '018-233-047',
    availableDosages: '135 mg Tablet, Mebolin SR 200 mg Capsule',
  },

  // =========================================================================
  // 20. Antacids, Scabicides, Topicals & Essential BD Pharmacy Brands
  // =========================================================================
  {
    id: 'med-entacyd-plus-tab',
    brandName: 'Entacyd Plus',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '400 mg + 400 mg + 30 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 2.5,
    stripPrice: 25.0,
    therapeuticClass: 'Antacid & Anti-flatulent (Entacyd+ / Entacid+)',
    indication: 'গ্যাস্ট্রিক, বুক জ্বালাপোড়া, অ্যাসিডিটি, পেট ফাঁপা ও বদহজম দ্রুত উপশমে ব্যবহৃত (Entacyd+ / Entacid+)',
    darNo: '018-041-012',
    availableDosages: '400 mg + 400 mg + 30 mg Chewable Tablet, 200 ml Suspension',
  },
  {
    id: 'med-entacyd-plus-susp',
    brandName: 'Entacyd Plus',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '200 ml Bottle',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (200 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 95.0,
    stripPrice: 95.0,
    therapeuticClass: 'Antacid & Anti-flatulent (Entacyd+ / Entacid+)',
    indication: 'গ্যাস্ট্রিক, বুক জ্বালাপোড়া, অ্যাসিডিটি, পেট ফাঁপা ও বদহজম দ্রুত উপশমে ব্যবহৃত (Entacyd+ / Entacid+)',
    darNo: '018-042-012',
    availableDosages: '200 ml Suspension, Chewable Tablet',
  },
  {
    id: 'med-flatameal-ds',
    brandName: 'Flatameal DS',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '200 ml Bottle',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (200 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 95.0,
    stripPrice: 95.0,
    therapeuticClass: 'Antacid & Anti-flatulent',
    indication: 'গ্যাস্ট্রিক, বুক জ্বালাপোড়া, অ্যাসিডিটি, পেট ফাঁপা ও বদহজম উপশমে ব্যবহৃত',
    darNo: '012-058-012',
    availableDosages: '200 ml Suspension, Chewable Tablet',
  },
  {
    id: 'med-asynta-max-tab',
    brandName: 'Asynta Max',
    genericName: 'Sodium Alginate + Potassium Bicarbonate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg + 100 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Alginate Antacid (Reflux Suppressant)',
    indication: 'গ্যাস্ট্রো-ইসোফেজিয়াল রিফ্লাক্স, গলা ও বুক জ্বালাপোড়া এবং গর্ভাবস্থায় অ্যাসিডিটিতে ব্যবহৃত',
    darNo: '018-512-012',
    availableDosages: 'Chewable Tablet, 200 ml Suspension (৳250)',
  },
  {
    id: 'med-lorix-plus-lotion',
    brandName: 'Lorix Plus',
    genericName: 'Permethrin + Crotamiton',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '5% + 0.1% (60 ml Lotion)',
    dosageForm: 'Gel',
    packSize: '1 × 1 (60 ml Lotion)',
    unitsPerStrip: 1,
    unitPrice: 100.0,
    stripPrice: 100.0,
    therapeuticClass: 'Topical Scabicide & Antipruritic (Lorix+ / Lorixplus)',
    indication: 'খোস-পাঁচড়া (Scabies), তীব্র চুলকানি ও পরজীবীজনিত চর্মরোগ নিরাময়ে ব্যবহৃত (Lorix+ / Lorixplus)',
    darNo: '032-318-064',
    availableDosages: '60 ml Lotion, 30 g Cream',
  },
  {
    id: 'med-lorix-cream',
    brandName: 'Lorix',
    genericName: 'Permethrin',
    companyName: 'Opsonin Pharma Ltd.',
    strength: '5% w/w (30 g Cream)',
    dosageForm: 'Gel',
    packSize: '1 × 1 (30 g Tube)',
    unitsPerStrip: 1,
    unitPrice: 60.0,
    stripPrice: 60.0,
    therapeuticClass: 'Topical Scabicide & Pediculicide',
    indication: 'খোস-পাঁচড়া (Scabies) এবং মাথার উকুন দূর করতে ব্যবহৃত',
    darNo: '032-214-064',
    availableDosages: '5% w/w (30 g Cream), 60 ml Lotion',
  },
  {
    id: 'med-scabex-cream',
    brandName: 'Scabex',
    genericName: 'Permethrin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5% w/w (30 g Cream)',
    dosageForm: 'Gel',
    packSize: '1 × 1 (30 g Tube)',
    unitsPerStrip: 1,
    unitPrice: 60.0,
    stripPrice: 60.0,
    therapeuticClass: 'Topical Scabicide & Pediculicide',
    indication: 'খোস-পাঁচড়া (Scabies) এবং মাথার উকুন দূর করতে ব্যবহৃত',
    darNo: '018-291-064',
    availableDosages: '5% w/w (30 g Cream)',
  },
  {
    id: 'med-permite-cream',
    brandName: 'Permite',
    genericName: 'Permethrin',
    companyName: 'ACI Limited',
    strength: '5% w/w (30 g Cream)',
    dosageForm: 'Gel',
    packSize: '1 × 1 (30 g Tube)',
    unitsPerStrip: 1,
    unitPrice: 60.0,
    stripPrice: 60.0,
    therapeuticClass: 'Topical Scabicide & Pediculicide',
    indication: 'খোস-পাঁচড়া (Scabies) এবং মাথার উকুন দূর করতে ব্যবহৃত',
    darNo: '045-261-064',
    availableDosages: '5% w/w (30 g Cream)',
  },
  {
    id: 'med-fungidal-cream',
    brandName: 'Fungidal',
    genericName: 'Miconazole Nitrate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '2% w/w (10 g Cream)',
    dosageForm: 'Gel',
    packSize: '1 × 1 (10 g Tube)',
    unitsPerStrip: 1,
    unitPrice: 40.0,
    stripPrice: 40.0,
    therapeuticClass: 'Topical Antifungal',
    indication: 'দাদ, ছত্রাকজনিত চর্মরোগ ও নখের সংক্রমণে ব্যবহৃত',
    darNo: '018-112-065',
    availableDosages: '2% w/w Cream, 2% w/w Oral Gel',
  },
  {
    id: 'med-bactrocin-oint',
    brandName: 'Bactrocin',
    genericName: 'Mupirocin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '2% w/w (10 g Ointment)',
    dosageForm: 'Gel',
    packSize: '1 × 1 (10 g Tube)',
    unitsPerStrip: 1,
    unitPrice: 140.0,
    stripPrice: 140.0,
    therapeuticClass: 'Topical Antibiotic Ointment',
    indication: 'ত্বকের ব্যাকটেরিয়াজনিত সংক্রমণ, ফোঁড়া, ক্ষত ও ইমপেটিগো নিরাময়ে ব্যবহৃত',
    darNo: '018-334-066',
    availableDosages: '2% w/w (10 g Ointment)',
  },
  {
    id: 'med-tofen-1',
    brandName: 'Tofen',
    genericName: 'Ketotifen Fumarate',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '1 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 2.5,
    stripPrice: 25.0,
    therapeuticClass: 'Anti-asthmatic & Antihistamine',
    indication: 'হাঁপানি প্রতিরোধ, দীর্ঘমেয়াদী সর্দি-কাশি ও অ্যালার্জি উপশমে ব্যবহৃত',
    darNo: '012-118-015',
    availableDosages: '1 mg Tablet, 1 mg/5 ml Syrup',
  },
  {
    id: 'med-algin-50',
    brandName: 'Algin',
    genericName: 'Tiemonium Methylsulphate',
    companyName: 'Renata PLC',
    strength: '50 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Antispasmodic (Visceral Pain)',
    indication: 'পেট ব্যথা, মাসিকের ব্যথা, পিত্তথলি ও মূত্রনালীর খিঁচুনিজনিত ব্যথায় ব্যবহৃত',
    darNo: '108-215-048',
    availableDosages: '50 mg Tablet, 10 mg/5 ml Syrup, 5 mg/2 ml Injection',
  },
  {
    id: 'med-flacol-40',
    brandName: 'Flacol',
    genericName: 'Simethicone',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '40 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 2.0,
    stripPrice: 20.0,
    therapeuticClass: 'Anti-flatulent (Gas Relief)',
    indication: 'শিশু ও বয়স্কদের পেট ফাঁপা, গ্যাস ও পেট কামড়ানো দ্রুত উপশমে ব্যবহৃত',
    darNo: '018-095-049',
    availableDosages: '40 mg Chewable Tablet, 67 mg/ml Paediatric Drops (15 ml)',
  },
  {
    id: 'med-amodis-400',
    brandName: 'Amodis',
    genericName: 'Metronidazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '400 mg',
    dosageForm: 'Tablet',
    packSize: '15 × 10 (150 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.7,
    stripPrice: 17.0,
    therapeuticClass: 'Antiprotozoal & Antibacterial',
    indication: 'আমাশয়, ডায়রিয়া, জিয়ার্ডিয়াসিস ও দাঁতের মাড়ির সংক্রমণে ব্যবহৃত',
    darNo: '018-019-029',
    availableDosages: '400 mg Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-filmet-400',
    brandName: 'Filmet',
    genericName: 'Metronidazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '400 mg',
    dosageForm: 'Tablet',
    packSize: '15 × 10 (150 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.7,
    stripPrice: 17.0,
    therapeuticClass: 'Antiprotozoal & Antibacterial',
    indication: 'আমাশয়, ডায়রিয়া, জিয়ার্ডিয়াসিস ও অ্যানেরোবিক ব্যাকটেরিয়ার সংক্রমণে ব্যবহৃত',
    darNo: '018-021-029',
    availableDosages: '400 mg Film Coated Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-almex-400',
    brandName: 'Almex',
    genericName: 'Albendazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '400 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 4 (40 pcs)',
    unitsPerStrip: 4,
    unitPrice: 5.0,
    stripPrice: 20.0,
    therapeuticClass: 'Anthelmintic (Anti-worm)',
    indication: 'গুঁড়া কৃমি, গোল কৃমি, ফিতা কৃমি ও বক্র কৃমি নির্মূলে ব্যবহৃত',
    darNo: '018-115-031',
    availableDosages: '400 mg Chewable Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-sintel-400',
    brandName: 'Sintel',
    genericName: 'Albendazole',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '400 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 4 (40 pcs)',
    unitsPerStrip: 4,
    unitPrice: 5.0,
    stripPrice: 20.0,
    therapeuticClass: 'Anthelmintic (Anti-worm)',
    indication: 'গুঁড়া কৃমি, গোল কৃমি, ফিতা কৃমি ও বক্র কৃমি নির্মূলে ব্যবহৃত',
    darNo: '198-118-031',
    availableDosages: '400 mg Chewable Tablet, 200 mg/5 ml Suspension',
  },
  {
    id: 'med-orsaline-n',
    brandName: 'Orsaline-N',
    genericName: 'Oral Rehydration Salts (ORS)',
    companyName: 'SMC Enterprise Ltd.',
    strength: '10.25 g Sachet (500 ml)',
    dosageForm: 'Sachet',
    packSize: '20 × 1 (20 Sachets Box)',
    unitsPerStrip: 20,
    unitPrice: 6.0,
    stripPrice: 120.0,
    therapeuticClass: 'Electrolyte & Rehydration Solution (Sachet)',
    indication: 'ডায়রিয়া, বমি ও অতিরিক্ত ঘামের কারণে শরীরের পানি ও লবণ শূন্যতা পূরণে ব্যবহৃত',
    darNo: '250-001-090',
    availableDosages: '10.25 g Sachet (500 ml Water), 20.5 g Sachet (1000 ml)',
  },
  {
    id: 'med-napa-syp-60',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '60 ml (120 mg/5 ml)',
    dosageForm: 'Syrup',
    packSize: '1 × 1 (60 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 35.0,
    stripPrice: 35.0,
    therapeuticClass: 'Analgesic & Antipyretic (Paediatric Syrup)',
    indication: 'শিশুদের জ্বর, মাথাব্যথা, দাঁতব্যথা ও টিকা পরবর্তী ব্যথা উপশমে ব্যবহৃত',
    darNo: '012-014-001',
    availableDosages: '60 ml Syrup, 100 ml Syrup, 15 ml Paediatric Drops, 125/250/500 mg Suppository, 500 mg Tablet',
  },
  {
    id: 'med-napa-syp-100',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '100 ml (120 mg/5 ml)',
    dosageForm: 'Syrup',
    packSize: '1 × 1 (100 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 50.0,
    stripPrice: 50.0,
    therapeuticClass: 'Analgesic & Antipyretic (Paediatric Syrup)',
    indication: 'শিশুদের জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের ব্যথা উপশমে ব্যবহৃত',
    darNo: '012-015-001',
    availableDosages: '60 ml Syrup, 100 ml Syrup, 15 ml Paediatric Drops, 125/250/500 mg Suppository, 500 mg Tablet',
  },
  {
    id: 'med-napa-supp-125',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '125 mg',
    dosageForm: 'Suppository',
    packSize: '2 × 5 (10 Suppositories)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Analgesic & Antipyretic (Rectal Suppository)',
    indication: 'শিশুদের তীব্র জ্বর ও বমি অবস্থায় দ্রুত জ্বর কমাতে ব্যবহৃত সাপোজিটরি',
    darNo: '012-016-001',
    availableDosages: '125 mg Suppository, 250 mg Suppository, 500 mg Suppository',
  },
  {
    id: 'med-napa-supp-250',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '250 mg',
    dosageForm: 'Suppository',
    packSize: '2 × 5 (10 Suppositories)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Analgesic & Antipyretic (Rectal Suppository)',
    indication: 'শিশু ও কিশোরদের তীব্র জ্বর ও ব্যথা দ্রুত কমাতে ব্যবহৃত সাপোজিটরি',
    darNo: '012-017-001',
    availableDosages: '125 mg Suppository, 250 mg Suppository, 500 mg Suppository',
  },
  {
    id: 'med-napa-supp-500',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Suppository',
    packSize: '2 × 5 (10 Suppositories)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Analgesic & Antipyretic (Rectal Suppository)',
    indication: 'বড়দের তীব্র জ্বর ও মুখে ওষুধ খেতে অক্ষম রোগীদের ক্ষেত্রে ব্যবহৃত সাপোজিটরি',
    darNo: '012-018-001',
    availableDosages: '125 mg Suppository, 250 mg Suppository, 500 mg Suppository',
  },
  {
    id: 'med-seclo-sachet-20',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '20 mg Oral Powder Sachet',
    dosageForm: 'Sachet',
    packSize: '1 × 10 (10 Sachets)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Proton Pump Inhibitor (Oral Suspension Sachet)',
    indication: 'দ্রুত কার্যকরী গ্যাস্ট্রিক আলসার ও বুক জ্বালাপোড়া উপশমে ব্যবহৃত স্যাচেট',
    darNo: '018-114-043',
    availableDosages: '20 mg Sachet, 40 mg Sachet, 20 mg Capsule, 40 mg Capsule',
  },
  {
    id: 'med-sergel-sachet-20',
    brandName: 'Sergel',
    genericName: 'Esomeprazole',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '20 mg Oral Granules Sachet',
    dosageForm: 'Sachet',
    packSize: '1 × 10 (10 Sachets)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Proton Pump Inhibitor (Oral Granules Sachet)',
    indication: 'গ্যাস্ট্রিক ও অ্যাসিড রিফ্লাক্স দ্রুত নিয়ন্ত্রণে ব্যবহৃত স্যাচেট',
    darNo: '319-047-043',
    availableDosages: '20 mg Sachet, 40 mg Sachet, 20 mg Capsule, 40 mg Capsule',
  },
  {
    id: 'med-monas-sachet-4',
    brandName: 'Monas',
    genericName: 'Montelukast Sodium',
    companyName: 'ACME Laboratories Ltd.',
    strength: '4 mg Oral Granules Sachet',
    dosageForm: 'Sachet',
    packSize: '1 × 15 (15 Sachets)',
    unitsPerStrip: 15,
    unitPrice: 12.0,
    stripPrice: 180.0,
    therapeuticClass: 'Leukotriene Receptor Antagonist (Paediatric Sachet)',
    indication: 'শিশুদের হাঁপানি, শ্বাসকষ্ট ও সর্দি-কাশি প্রতিরোধে ব্যবহৃত স্যাচেট',
    darNo: '024-315-061',
    availableDosages: '4 mg Sachet, 4 mg Tablet, 5 mg Tablet, 10 mg Tablet',
  },
  {
    id: 'med-brodil-inhaler-100',
    brandName: 'Brodil',
    genericName: 'Salbutamol',
    companyName: 'ACI Limited',
    strength: '100 mcg/puff (200 MD)',
    dosageForm: 'Inhaler',
    packSize: '1 × 1 (200 Metered Doses Inhaler)',
    unitsPerStrip: 1,
    unitPrice: 245.0,
    stripPrice: 245.0,
    therapeuticClass: 'Beta-2 Adrenergic Bronchodilator (Inhaler)',
    indication: 'হাঁপানি (Asthma) ও তীব্র শ্বাসকষ্ট তাৎক্ষণিক উপশমে ব্যবহৃত ইনহেলার',
    darNo: '045-190-062',
    availableDosages: '100 mcg/puff Inhaler, 100 ml Syrup, 4 mg Tablet',
  },
  {
    id: 'med-brodil-syp-100',
    brandName: 'Brodil',
    genericName: 'Salbutamol',
    companyName: 'ACI Limited',
    strength: '100 ml (2 mg/5 ml)',
    dosageForm: 'Syrup',
    packSize: '1 × 1 (100 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 40.0,
    stripPrice: 40.0,
    therapeuticClass: 'Beta-2 Adrenergic Bronchodilator (Syrup)',
    indication: 'শিশু ও বড়দের শ্বাসকষ্ট ও ব্রংকাইটিস জনিত কাশিতে ব্যবহৃত সিরাপ',
    darNo: '045-191-062',
    availableDosages: '100 ml Syrup, 50 ml Syrup, 100 mcg/puff Inhaler, 4 mg Tablet',
  },
  {
    id: 'med-clofenac-supp-50',
    brandName: 'Clofenac',
    genericName: 'Diclofenac Sodium',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '50 mg',
    dosageForm: 'Suppository',
    packSize: '2 × 5 (10 Suppositories)',
    unitsPerStrip: 10,
    unitPrice: 18.0,
    stripPrice: 180.0,
    therapeuticClass: 'NSAID Analgesic (Rectal Suppository)',
    indication: 'তীব্র ব্যথা ও অপারেশন পরবর্তী ব্যথা দ্রুত উপশমে ব্যবহৃত সাপোজিটরি',
    darNo: '018-149-011',
    availableDosages: '12.5 mg Suppository, 25 mg Suppository, 50 mg Suppository, 50 mg Tablet',
  },
  {
    id: 'med-zimax-susp-30',
    brandName: 'Zimax',
    genericName: 'Azithromycin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '30 ml (200 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (30 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 135.0,
    stripPrice: 135.0,
    therapeuticClass: 'Macrolide Antibiotic (Dry Suspension)',
    indication: 'শিশুদের গলা ব্যথা, টনসিলাইটিস, নিউমোনিয়া ও কানের সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '018-179-023',
    availableDosages: '15 ml Suspension, 30 ml Suspension, 50 ml Suspension, 250 mg Capsule, 500 mg Tablet',
  },
  {
    id: 'med-zycin-susp-30',
    brandName: 'Zycin',
    genericName: 'Azithromycin',
    companyName: 'Globe Pharmaceuticals Ltd.',
    strength: '30 ml (200 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (30 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 120.0,
    stripPrice: 120.0,
    therapeuticClass: 'Macrolide Antibiotic (Dry Suspension)',
    indication: 'শিশুদের গলা ব্যথা, টনসিলাইটিস, নিউমোনিয়া ও চর্মের সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '064-154-023',
    availableDosages: '15 ml Suspension, 30 ml Suspension, 50 ml Suspension, 250 mg Capsule, 500 mg Tablet',
  },
  {
    id: 'med-tory-90',
    brandName: 'Tory',
    genericName: 'Etoricoxib',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '90 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 14.0,
    stripPrice: 140.0,
    therapeuticClass: 'COX-2 Selective NSAID Analgesic',
    indication: 'বাতের ব্যথা, অস্টিওআর্থ্রাইটিস, গেঁটেবাত, কোমর ব্যথা ও দাঁতব্যথায় ব্যবহৃত',
    darNo: '018-388-013',
    availableDosages: '60 mg Tablet, 90 mg Tablet, 120 mg Tablet',
  },
  {
    id: 'med-etorix-90',
    brandName: 'Etorix',
    genericName: 'Etoricoxib',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '90 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 14.0,
    stripPrice: 140.0,
    therapeuticClass: 'COX-2 Selective NSAID Analgesic',
    indication: 'বাতের ব্যথা, অস্টিওআর্থ্রাইটিস, গেঁটেবাত, কোমর ব্যথা ও দাঁতব্যথায় ব্যবহৃত',
    darNo: '211-294-013',
    availableDosages: '60 mg Tablet, 90 mg Tablet, 120 mg Tablet',
  },
  {
    id: 'med-flexi-100',
    brandName: 'Flexi',
    genericName: 'Aceclofenac',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '100 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'NSAID Analgesic & Anti-inflammatory',
    indication: 'বাতের ব্যথা, গিঁটে ব্যথা, কোমর ব্যথা ও মাংসপেশির ব্যথায় ব্যবহৃত',
    darNo: '018-262-013',
    availableDosages: '100 mg Tablet, Flexi SR 200 mg Tablet',
  },
  {
    id: 'med-neurob-tab',
    brandName: 'Neuro-B',
    genericName: 'Vitamin B1 + Vitamin B6 + Vitamin B12',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '100 mg + 200 mg + 200 mcg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Neurotropic Vitamin B Complex',
    indication: 'হাত-পা ঝিনঝিন করা, অবশ ভাব, স্নায়ুবিক দুর্বলতা ও কোমর ব্যথায় ব্যবহৃত',
    darNo: '018-139-071',
    availableDosages: 'Film Coated Tablet, 3 ml Ampoule Injection',
  },
  {
    id: 'med-bextram-gold',
    brandName: 'Bextram Gold',
    genericName: 'Multivitamin & Multimineral (A-Z Gold)',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '32 Vitamins & Minerals',
    dosageForm: 'Tablet',
    packSize: '1 × 30 (30 pcs Container)',
    unitsPerStrip: 30,
    unitPrice: 11.5,
    stripPrice: 345.0,
    therapeuticClass: 'Complete Multivitamin & Multimineral',
    indication: 'শারীরিক দুর্বলতা, পুষ্টিহীনতা পূরণ ও রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিতে ব্যবহৃত',
    darNo: '012-298-072',
    availableDosages: '30 Tablets Bottle, 15 Tablets Bottle, Bextram Silver',
  },
  {
    id: 'med-filwel-gold',
    brandName: 'Filwel Gold',
    genericName: 'Multivitamin & Multimineral (A-Z Gold)',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '32 Vitamins & Minerals',
    dosageForm: 'Tablet',
    packSize: '1 × 30 (30 pcs Container)',
    unitsPerStrip: 30,
    unitPrice: 11.0,
    stripPrice: 330.0,
    therapeuticClass: 'Complete Multivitamin & Multimineral',
    indication: 'শারীরিক দুর্বলতা, পুষ্টিহীনতা পূরণ ও রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিতে ব্যবহৃত',
    darNo: '018-304-072',
    availableDosages: '30 Tablets Bottle, Filwel Silver, Filwel Kids Syrup',
  },
  {
    id: 'med-coralcal-d',
    brandName: 'Coralcal-D',
    genericName: 'Calcium (Coral Source) + Vitamin D3',
    companyName: 'Radiant Pharmaceuticals Ltd.',
    strength: '500 mg + 200 IU',
    dosageForm: 'Tablet',
    packSize: '6 × 10 (60 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Coral Calcium & Vitamin D3 Supplement',
    indication: 'হাড় ক্ষয় (অস্টিওপোরোসিস), ক্যালসিয়ামের ঘাটতি এবং গর্ভাবস্থায় ক্যালসিয়াম পূরণে ব্যবহৃত',
    darNo: '295-044-073',
    availableDosages: '500 mg + 200 IU Tablet, Coralcal-DX (600 mg + 400 IU)',
  },
  {
    id: 'med-rivotril-05',
    brandName: 'Rivotril',
    genericName: 'Clonazepam',
    companyName: 'Radiant Pharmaceuticals Ltd.',
    strength: '0.5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 9.0,
    stripPrice: 90.0,
    therapeuticClass: 'Benzodiazepine (Anxiolytic & Anticonvulsant)',
    indication: 'প্যানিক ডিসঅর্ডার, দুশ্চিন্তা, অনিদ্রা ও মৃগী রোগ নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '295-019-018',
    availableDosages: '0.5 mg Tablet, 1 mg Tablet, 2 mg Tablet',
  },
  {
    id: 'med-xelopan-05',
    brandName: 'Xelopan',
    genericName: 'Clonazepam',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '0.5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Benzodiazepine (Anxiolytic & Anticonvulsant)',
    indication: 'প্যানিক ডিসঅর্ডার, দুশ্চিন্তা, অনিদ্রা ও খিঁচুনি নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '211-162-018',
    availableDosages: '0.5 mg Tablet, 1 mg Tablet, 2 mg Tablet',
  },
  {
    id: 'med-secrin-2',
    brandName: 'Secrin',
    genericName: 'Glimepiride',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '2 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Sulfonylurea Antidiabetic',
    indication: 'টাইপ-২ ডায়াবেটিস রোগীদের রক্তের শর্করা নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-209-052',
    availableDosages: '1 mg Tablet, 2 mg Tablet, 3 mg Tablet, 4 mg Tablet',
  },
  {
    id: 'med-linatab-5',
    brandName: 'Linatab',
    genericName: 'Linagliptin',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '5 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 18.0,
    stripPrice: 180.0,
    therapeuticClass: 'DPP-4 Inhibitor Antidiabetic',
    indication: 'টাইপ-২ ডায়াবেটিস রোগীদের রক্তের শর্করা নিয়ন্ত্রণে ব্যবহৃত (কিডনি রোগীদের জন্যও নিরাপদ)',
    darNo: '198-341-053',
    availableDosages: '5 mg Tablet, Linatab M (5 mg + 500 mg / 850 mg / 1000 mg Metformin)',
  },
  {
    id: 'med-empa-10',
    brandName: 'Empa',
    genericName: 'Empagliflozin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Tablet',
    packSize: '2 × 10 (20 pcs)',
    unitsPerStrip: 10,
    unitPrice: 25.0,
    stripPrice: 250.0,
    therapeuticClass: 'SGLT2 Inhibitor Antidiabetic & Heart Failure',
    indication: 'টাইপ-২ ডায়াবেটিস, হার্ট ফেইলিউর এবং ক্রনিক কিডনি ডিজিজ নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-492-054',
    availableDosages: '10 mg Tablet, 25 mg Tablet, Empa Met',
  },
  {
    id: 'med-bislol-25',
    brandName: 'Bislol',
    genericName: 'Bisoprolol Fumarate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '2.5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Cardioselective Beta-Blocker',
    indication: 'উচ্চ রক্তচাপ, বুক ধড়ফড় করা, অ্যানজাইনা এবং হার্ট ফেইলিউর নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-311-038',
    availableDosages: '2.5 mg Tablet, 5 mg Tablet, 10 mg Tablet, Bislol Plus',
  },
  // ==================== XIMECLAV & CEFUROXIME + CLAVULANIC ACID ====================
  {
    id: 'med-ximeclav-500',
    brandName: 'Ximeclav',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '500 mg (500 mg + 125 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 55.0,
    stripPrice: 330.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'রেসিস্ট্যান্ট শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, সাইনোসাইটিস, মধ্যকর্ণের প্রদাহ, ইউটিআই ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '211-412-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Dry Suspension (125 mg + 31.25 mg/5 ml)',
  },
  {
    id: 'med-ximeclav-250',
    brandName: 'Ximeclav',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '250 mg (250 mg + 62.5 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 35.0,
    stripPrice: 210.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, সাইনোসাইটিস, মধ্যকর্ণের সংক্রমণ ও ইউটিআই-তে ব্যবহৃত',
    darNo: '211-411-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Dry Suspension',
  },
  {
    id: 'med-ximeclav-susp-70',
    brandName: 'Ximeclav',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '70 ml (125 mg + 31.25 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (70 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 280.0,
    stripPrice: 280.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor (Paediatric Suspension)',
    indication: 'শিশুদের নিউমোনিয়া, টনসিলাইটিস, কানের সংক্রমণ ও মূত্রনালীর সংক্রমণে ব্যবহৃত',
    darNo: '211-413-025',
    availableDosages: '70 ml Dry Suspension, 250 mg Tablet, 500 mg Tablet',
  },
  {
    id: 'med-cefotil-plus-500',
    brandName: 'Cefotil Plus',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg (500 mg + 125 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 55.0,
    stripPrice: 330.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, সাইনোসাইটিস, ইউটিআই ও অপারেশন পরবর্তী সংক্রমণে ব্যবহৃত',
    darNo: '018-451-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Dry Suspension',
  },
  {
    id: 'med-cefotil-plus-250',
    brandName: 'Cefotil Plus',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '250 mg (250 mg + 62.5 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 35.0,
    stripPrice: 210.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, সাইনোসাইটিস ও ইউটিআই-তে ব্যবহৃত',
    darNo: '018-450-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Dry Suspension',
  },
  {
    id: 'med-cefotil-plus-susp-70',
    brandName: 'Cefotil Plus',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '70 ml (125 mg + 31.25 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (70 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 280.0,
    stripPrice: 280.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor (Paediatric Suspension)',
    indication: 'শিশুদের নিউমোনিয়া, টনসিলাইটিস, কানের সংক্রমণ ও মূত্রনালীর সংক্রমণে ব্যবহৃত',
    darNo: '018-452-025',
    availableDosages: '70 ml Dry Suspension, 250 mg Tablet, 500 mg Tablet',
  },
  {
    id: 'med-furoclav-500',
    brandName: 'Furoclav',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '500 mg (500 mg + 125 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 55.0,
    stripPrice: 330.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'রেসিস্ট্যান্ট শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, সাইনোসাইটিস ও ইউটিআই-তে ব্যবহৃত',
    darNo: '198-401-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Suspension',
  },
  {
    id: 'med-cerox-cv-500',
    brandName: 'Cerox-CV',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '500 mg (500 mg + 125 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 55.0,
    stripPrice: 330.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, ইউটিআই ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '319-215-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Suspension',
  },
  {
    id: 'med-axim-cv-500',
    brandName: 'Axim CV',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Aristopharma Ltd.',
    strength: '500 mg (500 mg + 125 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 55.0,
    stripPrice: 330.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, ইউটিআই ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '031-319-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Suspension',
  },
  {
    id: 'med-kefuclav-500',
    brandName: 'Kefuclav',
    genericName: 'Cefuroxime Axetil + Clavulanic Acid',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg (500 mg + 125 mg)',
    dosageForm: 'Tablet',
    packSize: '2 × 6 (12 pcs)',
    unitsPerStrip: 6,
    unitPrice: 55.0,
    stripPrice: 330.0,
    therapeuticClass: '2nd Gen Cephalosporin + Beta-Lactamase Inhibitor Antibiotic',
    indication: 'শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস, ইউটিআই ও চর্মের সংক্রমণে ব্যবহৃত',
    darNo: '012-409-025',
    availableDosages: '250 mg Tablet, 500 mg Tablet, 70 ml Suspension',
  },

  // ==================== PROBIO SACHET & CAPSULE, ACE SUPP & DROPS ====================
  {
    id: 'med-probio-sachet-1g',
    brandName: 'Probio',
    genericName: 'Probiotic Combination (4 Billion CFU)',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '1 g Sachet (4 Billion CFU)',
    dosageForm: 'Sachet',
    packSize: '1 × 20 (20 Sachets Box | TP ৳383.82)',
    unitsPerStrip: 20,
    unitPrice: 22.0,
    stripPrice: 440.0,
    therapeuticClass: 'Probiotic Supplement (Oral Powder Sachet)',
    indication: 'ডায়রিয়া, অ্যান্টিবায়োটিক জনিত পেটের গোলযোগ, বদহজম ও অন্ত্রের উপকারী ব্যাকটেরিয়ার ভারসাম্য রক্ষায় ব্যবহৃত',
    darNo: '018-502-092',
    availableDosages: '1 g Sachet (20\'s Box), 4 Billion CFU Capsule (30\'s Box)',
  },
  {
    id: 'med-probio-cap',
    brandName: 'Probio',
    genericName: 'Probiotic Combination (4 Billion CFU)',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '4 Billion CFU',
    dosageForm: 'Capsule',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 22.0,
    stripPrice: 220.0,
    therapeuticClass: 'Probiotic Supplement (Capsule)',
    indication: 'ডায়রিয়া, আইবিএস (IBS), অ্যান্টিবায়োটিক জনিত ডায়রিয়া ও বদহজমে ব্যবহৃত',
    darNo: '018-501-092',
    availableDosages: '4 Billion CFU Capsule, 1 g Sachet (20\'s Box)',
  },
  {
    id: 'med-ace-supp-125',
    brandName: 'Ace',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '125 mg',
    dosageForm: 'Suppository',
    packSize: '2 × 5 (10 Suppositories)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'Analgesic & Antipyretic (Rectal Suppository)',
    indication: 'শিশুদের তীব্র জ্বর ও বমি অবস্থায় দ্রুত জ্বর কমাতে ব্যবহৃত সাপোজিটরি',
    darNo: '018-016-001',
    availableDosages: '125 mg Suppository, 250 mg Suppository, 500 mg Suppository, 15 ml Paediatric Drops, 60 ml Syrup, 500 mg Tablet',
  },
  {
    id: 'med-ace-supp-250',
    brandName: 'Ace',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '250 mg',
    dosageForm: 'Suppository',
    packSize: '2 × 5 (10 Suppositories)',
    unitsPerStrip: 10,
    unitPrice: 6.0,
    stripPrice: 60.0,
    therapeuticClass: 'Analgesic & Antipyretic (Rectal Suppository)',
    indication: 'শিশুদের তীব্র জ্বর ও ব্যথা দ্রুত কমাতে ব্যবহৃত সাপোজিটরি',
    darNo: '018-017-001',
    availableDosages: '125 mg Suppository, 250 mg Suppository, 500 mg Suppository',
  },
  {
    id: 'med-ace-supp-500',
    brandName: 'Ace',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg',
    dosageForm: 'Suppository',
    packSize: '2 × 5 (10 Suppositories)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Analgesic & Antipyretic (Rectal Suppository)',
    indication: 'বড়দের তীব্র জ্বর ও মুখে ওষুধ খেতে অক্ষম রোগীদের ক্ষেত্রে ব্যবহৃত সাপোজিটরি',
    darNo: '018-018-001',
    availableDosages: '125 mg Suppository, 250 mg Suppository, 500 mg Suppository',
  },
  {
    id: 'med-ace-pdrop-15',
    brandName: 'Ace',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '15 ml (80 mg/ml Paediatric Drops)',
    dosageForm: 'Drops',
    packSize: '1 × 1 (15 ml Bottle with Dropper)',
    unitsPerStrip: 1,
    unitPrice: 30.0,
    stripPrice: 30.0,
    therapeuticClass: 'Analgesic & Antipyretic (Paediatric Drops)',
    indication: 'নবজাতক ও ছোট শিশুদের জ্বর এবং টিকা পরবর্তী ব্যথা উপশমে ব্যবহৃত পেডিয়াট্রিক ড্রপস',
    darNo: '018-019-001',
    availableDosages: '15 ml Paediatric Drops, 60 ml Syrup, 125/250/500 mg Suppository',
  },

  // ==================== EYE DROPS (চোখের ড্রপ) ====================
  {
    id: 'med-vigamox-eye-5',
    brandName: 'Vigamox',
    genericName: 'Moxifloxacin Ophthalmic Solution',
    companyName: 'Radiant Pharmaceuticals Ltd.',
    strength: '5 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Sterile Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 150.0,
    stripPrice: 150.0,
    therapeuticClass: 'Ophthalmic Fluoroquinolone Antibiotic (Eye Drop)',
    indication: 'চোখ ওঠা (Bacterial Conjunctivitis), চোখের সংক্রমণ, লাল ভাব, পিঁচুটি পড়া ও চোখের অপারেশন পরবর্তী সংক্রমণে ব্যবহৃত',
    darNo: '295-110-081',
    availableDosages: '5 ml (0.5% w/v) Sterile Eye Drops',
  },
  {
    id: 'med-eyemox-eye-5',
    brandName: 'Eyemox',
    genericName: 'Moxifloxacin Ophthalmic Solution',
    companyName: 'Aristopharma Ltd.',
    strength: '5 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Sterile Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 100.0,
    stripPrice: 100.0,
    therapeuticClass: 'Ophthalmic Fluoroquinolone Antibiotic (Eye Drop)',
    indication: 'চোখের ব্যাকটেরিয়াজনিত সংক্রমণ, চোখ ওঠা, চোখ লাল হওয়া ও কর্নিয়ার আলসারে ব্যবহৃত চোখের ড্রপ',
    darNo: '031-244-081',
    availableDosages: '5 ml (0.5% w/v) Eye Drops, Eyemox-D (with Dexamethasone)',
  },
  {
    id: 'med-moxibac-eye-5',
    brandName: 'Moxibac',
    genericName: 'Moxifloxacin Ophthalmic Solution',
    companyName: 'Popular Pharmaceuticals PLC',
    strength: '5 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Sterile Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 100.0,
    stripPrice: 100.0,
    therapeuticClass: 'Ophthalmic Fluoroquinolone Antibiotic (Eye Drop)',
    indication: 'চোখের সংক্রমণ, চোখ ওঠা, চোখ দিয়ে পানি ও পিঁচুটি পড়া নিরাময়ে ব্যবহৃত চোখের ড্রপ',
    darNo: '115-210-081',
    availableDosages: '5 ml (0.5% w/v) Sterile Eye Drops',
  },
  {
    id: 'med-optimox-eye-5',
    brandName: 'Optimox',
    genericName: 'Moxifloxacin Ophthalmic Solution',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Sterile Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 100.0,
    stripPrice: 100.0,
    therapeuticClass: 'Ophthalmic Fluoroquinolone Antibiotic (Eye Drop)',
    indication: 'চোখের ব্যাকটেরিয়াজনিত সংক্রমণ, চোখ ওঠা ও চোখের অপারেশন পরবর্তী সংক্রমণে ব্যবহৃত চোখের ড্রপ',
    darNo: '018-395-081',
    availableDosages: '5 ml (0.5% w/v) Sterile Eye Drops',
  },
  {
    id: 'med-ocumox-eye-5',
    brandName: 'Ocumox',
    genericName: 'Moxifloxacin Ophthalmic Solution',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '5 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Sterile Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 100.0,
    stripPrice: 100.0,
    therapeuticClass: 'Ophthalmic Fluoroquinolone Antibiotic (Eye Drop)',
    indication: 'চোখের সংক্রমণ, কনজাংকটিভাইটিস ও কর্নিয়ার ক্ষত সারাতে ব্যবহৃত চোখের ড্রপ',
    darNo: '198-390-081',
    availableDosages: '5 ml (0.5% w/v) Sterile Eye Drops',
  },
  {
    id: 'med-ciprocin-eye-5',
    brandName: 'Ciprocin',
    genericName: 'Ciprofloxacin Ophthalmic & Otic Solution',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 ml (0.3% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Eye/Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 40.0,
    stripPrice: 40.0,
    therapeuticClass: 'Ophthalmic & Otic Antibiotic (Eye/Ear Drop)',
    indication: 'চোখ ওঠা, চোখের পাতার সংক্রমণ এবং কানের সংক্রমণে ব্যবহৃত ড্রপ',
    darNo: '018-174-081',
    availableDosages: '5 ml (0.3%) Eye/Ear Drop, Ciprocin-D Eye/Ear Drop, 500 mg Tablet',
  },
  {
    id: 'med-neofloxin-eye-5',
    brandName: 'Neofloxin',
    genericName: 'Ciprofloxacin Ophthalmic & Otic Solution',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '5 ml (0.3% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Eye/Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 40.0,
    stripPrice: 40.0,
    therapeuticClass: 'Ophthalmic & Otic Antibiotic (Eye/Ear Drop)',
    indication: 'চোখ ও কানের ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত ড্রপ',
    darNo: '012-178-081',
    availableDosages: '5 ml (0.3%) Eye/Ear Drop, 500 mg Tablet',
  },
  {
    id: 'med-tears-naturale-15',
    brandName: 'Tears Naturale II',
    genericName: 'Carboxymethylcellulose / Hypromellose + Dextran (Artificial Tears)',
    companyName: 'Radiant Pharmaceuticals Ltd.',
    strength: '15 ml (0.3% + 0.1%)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (15 ml Lubricant Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 185.0,
    stripPrice: 185.0,
    therapeuticClass: 'Ocular Lubricant / Artificial Tears (Eye Drop)',
    indication: 'চোখের শুষ্কতা (Dry Eye), চোখ জ্বালাপোড়া ও কম্পিউটার/মোবাইল ব্যবহারে চোখের ক্লান্তি দূর করতে ব্যবহৃত',
    darNo: '295-145-082',
    availableDosages: '15 ml Sterile Lubricant Eye Drops',
  },
  {
    id: 'med-freshfil-eye-10',
    brandName: 'Freshfil',
    genericName: 'Carboxymethylcellulose / Hypromellose + Dextran (Artificial Tears)',
    companyName: 'Aristopharma Ltd.',
    strength: '10 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (10 ml Lubricant Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 120.0,
    stripPrice: 120.0,
    therapeuticClass: 'Ocular Lubricant / Artificial Tears (Eye Drop)',
    indication: 'চোখের শুষ্কতা, খচখচে ভাব ও জ্বালাপোড়া উপশমে ব্যবহৃত কৃত্রিম অশ্রু (Artificial Tears)',
    darNo: '031-289-082',
    availableDosages: '10 ml Sterile Eye Drops',
  },
  {
    id: 'med-ocuwet-eye-10',
    brandName: 'Ocuwet',
    genericName: 'Carboxymethylcellulose / Hypromellose + Dextran (Artificial Tears)',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (10 ml Lubricant Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 110.0,
    stripPrice: 110.0,
    therapeuticClass: 'Ocular Lubricant / Artificial Tears (Eye Drop)',
    indication: 'চোখের শুষ্কতা ও জ্বালাপোড়া উপশমে ব্যবহৃত চোখের ড্রপ',
    darNo: '018-412-082',
    availableDosages: '10 ml Sterile Eye Drops',
  },
  {
    id: 'med-dexaflox-eye-5',
    brandName: 'Dexaflox',
    genericName: 'Moxifloxacin + Dexamethasone Ophthalmic Solution',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 ml (0.5% + 0.1%)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Sterile Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 130.0,
    stripPrice: 130.0,
    therapeuticClass: 'Antibiotic + Corticosteroid Ophthalmic (Eye Drop)',
    indication: 'চোখের ছানি অপারেশন পরবর্তী প্রদাহ ও ব্যাকটেরিয়াজনিত সংক্রমণ প্রতিরোধে ব্যবহৃত চোখের ড্রপ',
    darNo: '018-419-083',
    availableDosages: '5 ml Sterile Eye Drops',
  },
  {
    id: 'med-moxidex-eye-5',
    brandName: 'Moxidex',
    genericName: 'Moxifloxacin + Dexamethasone Ophthalmic Solution',
    companyName: 'Aristopharma Ltd.',
    strength: '5 ml (0.5% + 0.1%)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (5 ml Sterile Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 130.0,
    stripPrice: 130.0,
    therapeuticClass: 'Antibiotic + Corticosteroid Ophthalmic (Eye Drop)',
    indication: 'চোখের তীব্র প্রদাহ ও সংক্রমণ নিয়ন্ত্রণে ব্যবহৃত চোখের ড্রপ',
    darNo: '031-312-083',
    availableDosages: '5 ml Sterile Eye Drops',
  },
  {
    id: 'med-sq-mycetin-eye-10',
    brandName: 'SQ-Mycetin',
    genericName: 'Chloramphenicol Ophthalmic & Otic Solution',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 ml (0.5% w/v)',
    dosageForm: 'Eye Drop',
    packSize: '1 × 1 (10 ml Eye/Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 35.0,
    stripPrice: 35.0,
    therapeuticClass: 'Broad-Spectrum Ophthalmic & Otic Antibiotic',
    indication: 'চোখ ওঠা, চোখের পাতার সংক্রমণ ও কানের সংক্রমণে ব্যবহৃত ড্রপ',
    darNo: '018-092-081',
    availableDosages: '10 ml (0.5%) Eye/Ear Drops',
  },

  // ==================== EAR DROPS (কানের ড্রপ) ====================
  {
    id: 'med-ciprocin-ear-5',
    brandName: 'Ciprocin',
    genericName: 'Ciprofloxacin Ophthalmic & Otic Solution',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 ml (0.3% w/v Otic)',
    dosageForm: 'Ear Drop',
    packSize: '1 × 1 (5 ml Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 40.0,
    stripPrice: 40.0,
    therapeuticClass: 'Otic Fluoroquinolone Antibiotic (Ear Drop)',
    indication: 'কানের সংক্রমণ (Otitis Externa & Media), কান পাকা ও কান দিয়ে পুঁজ পড়ায় ব্যবহৃত কানের ড্রপ',
    darNo: '018-175-084',
    availableDosages: '5 ml (0.3%) Ear/Eye Drop, 500 mg Tablet',
  },
  {
    id: 'med-waxsol-ear-10',
    brandName: 'Waxsol',
    genericName: 'Clotrimazole / Docusate Sodium / Paradichlorobenzene Otic Solution (Ear Drops)',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '10 ml (0.5% w/v Docusate Sodium)',
    dosageForm: 'Ear Drop',
    packSize: '1 × 1 (10 ml Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 75.0,
    stripPrice: 75.0,
    therapeuticClass: 'Cerumenolytic (Ear Wax Softener Ear Drop)',
    indication: 'কানের শক্ত খৈল (Ear Wax) নরম করে সহজে বের করার জন্য ব্যবহৃত কানের ড্রপ',
    darNo: '319-188-084',
    availableDosages: '10 ml Ear Drops',
  },
  {
    id: 'med-soliwax-ear-10',
    brandName: 'Soliwax',
    genericName: 'Clotrimazole / Docusate Sodium / Paradichlorobenzene Otic Solution (Ear Drops)',
    companyName: 'Aristopharma Ltd.',
    strength: '10 ml (Ear Wax Dissolver)',
    dosageForm: 'Ear Drop',
    packSize: '1 × 1 (10 ml Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 60.0,
    stripPrice: 60.0,
    therapeuticClass: 'Cerumenolytic & Local Analgesic (Ear Drop)',
    indication: 'কানের জমাট বাঁধা ময়লা বা খৈল গলিয়ে পরিষ্কার করতে ও কানের ব্যথা কমাতে ব্যবহৃত কানের ড্রপ',
    darNo: '031-265-084',
    availableDosages: '10 ml Ear Drops',
  },
  {
    id: 'med-otocort-ear-5',
    brandName: 'Otocort',
    genericName: 'Ciprofloxacin + Dexamethasone Otic Solution',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 ml (0.3% + 0.1%)',
    dosageForm: 'Ear Drop',
    packSize: '1 × 1 (5 ml Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 75.0,
    stripPrice: 75.0,
    therapeuticClass: 'Antibiotic + Steroid Otic Solution (Ear Drop)',
    indication: 'কানের তীব্র সংক্রমণ, কান ব্যথা, কান চুলকানি ও প্রদাহ উপশমে ব্যবহৃত কানের ড্রপ',
    darNo: '018-340-084',
    availableDosages: '5 ml Sterile Ear Drops',
  },
  {
    id: 'med-clotrim-ear-10',
    brandName: 'Clotrim',
    genericName: 'Clotrimazole / Docusate Sodium / Paradichlorobenzene Otic Solution (Ear Drops)',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 ml (1% w/v Clotrimazole Otic)',
    dosageForm: 'Ear Drop',
    packSize: '1 × 1 (10 ml Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 55.0,
    stripPrice: 55.0,
    therapeuticClass: 'Antifungal Otic Solution (Ear Drop)',
    indication: 'কানের ছত্রাকজনিত সংক্রমণ (Otomycosis) ও কান চুলকানি নিরাময়ে ব্যবহৃত কানের ড্রপ',
    darNo: '018-219-084',
    availableDosages: '10 ml Ear Drops, 10 g Cream',
  },
  {
    id: 'med-gento-ear-5',
    brandName: 'Gento',
    genericName: 'Gentamicin Sulfate Ophthalmic & Otic Solution',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 ml (0.3% w/v)',
    dosageForm: 'Ear Drop',
    packSize: '1 × 1 (5 ml Ear/Eye Drop)',
    unitsPerStrip: 1,
    unitPrice: 30.0,
    stripPrice: 30.0,
    therapeuticClass: 'Aminoglycoside Antibiotic (Ear/Eye Drop)',
    indication: 'কানের সংক্রমণ, কান পাকা ও চোখের ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত ড্রপ',
    darNo: '018-112-084',
    availableDosages: '5 ml (0.3%) Ear/Eye Drops',
  },
  {
    id: 'med-otogen-c-ear-10',
    brandName: 'Otogen-C',
    genericName: 'Chloramphenicol + Clotrimazole + Beclomethasone Dipropionate + Lignocaine HCl',
    companyName: 'Popular Pharmaceuticals Ltd.',
    strength: '10 ml (Antibiotic, Antifungal & Local Analgesic)',
    dosageForm: 'Ear Drop',
    packSize: '1 × 1 (10 ml Ear Drop)',
    unitsPerStrip: 1,
    unitPrice: 85.0,
    stripPrice: 85.0,
    therapeuticClass: 'Comprehensive Otic Solution (Antibacterial + Antifungal + Analgesic Ear Drop)',
    indication: 'কানের তীব্র সংক্রমণ, কান ব্যথা, কান চুলকানি, কান পাকা ও ছত্রাক সংক্রমণ উপশমে ব্যবহৃত কম্বিনেশন কানের ড্রপ',
    darNo: '315-144-084',
    availableDosages: '10 ml Ear Drops',
  },
  {
    id: 'med-ostogen-c-eff-10',
    brandName: 'Ostogen C',
    genericName: 'Calcium Lactate Gluconate + Calcium Carbonate + Vitamin C',
    companyName: 'Renata Limited',
    strength: '1000 mg + 327 mg + 500 mg',
    dosageForm: 'Tablet',
    packSize: '1 × 10 (10 Effervescent Tablets)',
    unitsPerStrip: 10,
    unitPrice: 15.12,
    stripPrice: 151.2,
    therapeuticClass: 'Calcium & Vitamin C Supplement',
    indication: 'ক্যালসিয়াম ও ভিটামিন সি এর ঘাটতি পূরণ ও ইমিউনিটি বৃদ্ধিতে ব্যবহৃত এফারভেসেন্ট ট্যাবলেট',
    darNo: '042-312-043',
    availableDosages: '10 Effervescent Tablets per Tube',
  },

  // ==================== NASAL DROPS (নাকের ড্রপ) ====================
  {
    id: 'med-antazol-nasal-adult',
    brandName: 'Antazol',
    genericName: 'Xylometazoline Hydrochloride Nasal Drops',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '15 ml (0.1% w/v Adult)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (15 ml Nasal Drop)',
    unitsPerStrip: 1,
    unitPrice: 25.0,
    stripPrice: 25.0,
    therapeuticClass: 'Nasal Decongestant (Adult Nasal Drop)',
    indication: 'বড়দের সর্দি, অ্যালার্জি ও সাইনোসাইটিসের কারণে নাক বন্ধ হওয়া দ্রুত খুলতে ব্যবহৃত নাকের ড্রপ',
    darNo: '018-045-085',
    availableDosages: '15 ml (0.1% Adult) Nasal Drops, 15 ml (0.05% Paediatric) Nasal Drops',
  },
  {
    id: 'med-antazol-nasal-paed',
    brandName: 'Antazol',
    genericName: 'Xylometazoline Hydrochloride Nasal Drops',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '15 ml (0.05% w/v Paediatric)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (15 ml Children Nasal Drop)',
    unitsPerStrip: 1,
    unitPrice: 20.0,
    stripPrice: 20.0,
    therapeuticClass: 'Nasal Decongestant (Paediatric Nasal Drop)',
    indication: 'শিশুদের ঠান্ডা-সর্দিতে নাক বন্ধ হয়ে গেলে শ্বাসপ্রশ্বাস সহজ করতে ব্যবহৃত নাকের ড্রপ',
    darNo: '018-046-085',
    availableDosages: '15 ml (0.05% Paediatric) Nasal Drops, 15 ml (0.1% Adult) Nasal Drops',
  },
  {
    id: 'med-otrivin-nasal-10',
    brandName: 'Otrivin',
    genericName: 'Xylometazoline Hydrochloride Nasal Drops',
    companyName: 'Radiant Pharmaceuticals Ltd.',
    strength: '10 ml (0.1% w/v Adult)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (10 ml Nasal Drop/Spray)',
    unitsPerStrip: 1,
    unitPrice: 45.0,
    stripPrice: 45.0,
    therapeuticClass: 'Nasal Decongestant (Nasal Drop)',
    indication: 'সর্দি ও সাইনোসাইটিস জনিত নাক বন্ধ হওয়া তাৎক্ষণিক উপশমে ব্যবহৃত নাকের ড্রপ',
    darNo: '295-088-085',
    availableDosages: '10 ml (0.1% Adult), 10 ml (0.05% Paediatric)',
  },
  {
    id: 'med-afrin-nasal-adult',
    brandName: 'Afrin',
    genericName: 'Oxymetazoline Hydrochloride Nasal Drops',
    companyName: 'Aristopharma Ltd.',
    strength: '15 ml (0.05% w/v Adult)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (15 ml Nasal Drop)',
    unitsPerStrip: 1,
    unitPrice: 45.0,
    stripPrice: 45.0,
    therapeuticClass: 'Long-Acting Nasal Decongestant (Nasal Drop)',
    indication: '১২ ঘন্টা পর্যন্ত নাক বন্ধ ভাব দূর করতে ও সাইনাসের চাপ কমাতে ব্যবহৃত নাকের ড্রপ',
    darNo: '031-190-085',
    availableDosages: '15 ml (0.05% Adult) Nasal Drops, 15 ml (0.025% Paediatric) Nasal Drops',
  },
  {
    id: 'med-afrin-nasal-paed',
    brandName: 'Afrin',
    genericName: 'Oxymetazoline Hydrochloride Nasal Drops',
    companyName: 'Aristopharma Ltd.',
    strength: '15 ml (0.025% w/v Paediatric)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (15 ml Paediatric Nasal Drop)',
    unitsPerStrip: 1,
    unitPrice: 35.0,
    stripPrice: 35.0,
    therapeuticClass: 'Long-Acting Nasal Decongestant (Paediatric Nasal Drop)',
    indication: 'শিশুদের নাক বন্ধ ও সর্দি উপশমে ব্যবহৃত নাকের ড্রপ',
    darNo: '031-191-085',
    availableDosages: '15 ml (0.025% Paediatric), 15 ml (0.05% Adult)',
  },
  {
    id: 'med-rinozol-nasal-15',
    brandName: 'Rinozol',
    genericName: 'Oxymetazoline Hydrochloride Nasal Drops',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '15 ml (0.05% w/v Adult)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (15 ml Nasal Drop)',
    unitsPerStrip: 1,
    unitPrice: 42.0,
    stripPrice: 42.0,
    therapeuticClass: 'Long-Acting Nasal Decongestant (Nasal Drop)',
    indication: 'নাক বন্ধ ভাব ও সাইনোসাইটিসের উপসর্গ উপশমে ব্যবহৃত নাকের ড্রপ',
    darNo: '018-322-085',
    availableDosages: '15 ml (0.05% Adult), 15 ml (0.025% Paediatric)',
  },
  {
    id: 'med-norsol-nasal-15',
    brandName: 'Norsol',
    genericName: 'Sodium Chloride 0.9% Nasal Drops (Saline Nasal Solution)',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '15 ml (0.9% w/v Saline)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (15 ml Saline Nasal Drop)',
    unitsPerStrip: 1,
    unitPrice: 26.0,
    stripPrice: 26.0,
    therapeuticClass: 'Isotonic Saline Nasal Solution (Safe for Infants & Adults)',
    indication: 'নবজাতক, শিশু ও বড়দের নাকের শুষ্কতা এবং জমাট বাঁধা সর্দি পরিষ্কার করে নাক খোলা রাখতে ব্যবহৃত স্যালাইন নাকের ড্রপ',
    darNo: '018-248-085',
    availableDosages: '15 ml Nasal Drops, Norsol Nasal Spray',
  },
  {
    id: 'med-solo-nasal-15',
    brandName: 'Solo',
    genericName: 'Sodium Chloride 0.9% Nasal Drops (Saline Nasal Solution)',
    companyName: 'Opso Saline Ltd.',
    strength: '15 ml (0.9% w/v Saline)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (15 ml Saline Nasal Drop)',
    unitsPerStrip: 1,
    unitPrice: 25.0,
    stripPrice: 25.0,
    therapeuticClass: 'Isotonic Saline Nasal Solution (Nasal Drop)',
    indication: 'শিশু ও বড়দের বন্ধ নাক পরিষ্কার ও আর্দ্র রাখতে ব্যবহৃত স্যালাইন নাকের ড্রপ',
    darNo: '095-034-085',
    availableDosages: '15 ml Nasal Drops',
  },
  {
    id: 'med-flonaspray-nasal',
    brandName: 'Flonaspray',
    genericName: 'Fluticasone Propionate / Furoate Nasal Spray',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '50 mcg/spray (120 MD)',
    dosageForm: 'Nasal Drop',
    packSize: '1 × 1 (120 Metered Doses Nasal Spray)',
    unitsPerStrip: 1,
    unitPrice: 250.0,
    stripPrice: 250.0,
    therapeuticClass: 'Corticosteroid Allergic Rhinitis Nasal Spray',
    indication: 'অ্যালার্জিক রাইনাইটিস, বারবার হাঁচি, নাক দিয়ে পানি পড়া ও নাক বন্ধ হওয়া প্রতিরোধে ব্যবহৃত নাকের স্প্রে',
    darNo: '018-380-085',
    availableDosages: '50 mcg/spray (120 MD)',
  },

  // ==================== INSULIN ASPART (NOVOMIX 30), ODREL, CLOPID, RESERVE ====================
  {
    id: 'med-novomix-30-flexpen',
    brandName: 'Novomix 30 FlexPen',
    genericName: 'Insulin Aspart (30% Soluble + 70% Protamine Crystallised)',
    companyName: 'Eskayef Pharmaceuticals Ltd. (SK+F)',
    strength: '100 IU/ml (3 ml Pre-filled FlexPen)',
    dosageForm: 'Injection',
    packSize: '5 × 3 ml (1 FlexPen Price)',
    unitsPerStrip: 1,
    unitPrice: 750.0,
    stripPrice: 750.0,
    therapeuticClass: 'Biphasic Premixed Insulin Analogue (FlexPen)',
    indication: 'ডায়াবেটিস মেলাইটাস রোগীদের রক্তের শর্করা (Blood Sugar) দ্রুত ও দীর্ঘমেয়াদী নিয়ন্ত্রণে ব্যবহৃত ইনসুলিন পেন',
    darNo: '211-510-059',
    availableDosages: '100 IU/ml 3 ml FlexPen, Penfill Cartridge 3 ml',
  },
  {
    id: 'med-odrel-75',
    brandName: 'Odrel',
    genericName: 'Clopidogrel Bisulfate',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '75 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Antiplatelet Agent (Blood Thinner)',
    indication: 'হার্ট অ্যাটাক, স্ট্রোক প্রতিরোধ ও রক্তনালীতে রক্ত জমাট বাঁধা রোধে ব্যবহৃত',
    darNo: '012-265-039',
    availableDosages: '75 mg Tablet, Odrel Plus (75 mg + Aspirin 75 mg)',
  },
  {
    id: 'med-clopid-75',
    brandName: 'Clopid',
    genericName: 'Clopidogrel Bisulfate',
    companyName: 'Drug International Ltd.',
    strength: '75 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Antiplatelet Agent (Blood Thinner)',
    indication: 'হার্ট অ্যাটাক, স্ট্রোক প্রতিরোধ ও করোনারি স্টেন্ট পরবর্তী রক্ত পাতলা রাখতে ব্যবহৃত',
    darNo: '056-198-039',
    availableDosages: '75 mg Tablet, Clopid-AS (75 mg + 75 mg)',
  },
  {
    id: 'med-anclog-75',
    brandName: 'Anclog',
    genericName: 'Clopidogrel Bisulfate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '75 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Antiplatelet Agent (Blood Thinner)',
    indication: 'হার্ট অ্যাটাক ও স্ট্রোকের ঝুঁকি কমাতে এবং রক্ত জমাট বাঁধা প্রতিরোধে ব্যবহৃত',
    darNo: '018-277-039',
    availableDosages: '75 mg Tablet, Anclog Plus (75 mg + 75 mg)',
  },
  {
    id: 'med-reserve-100',
    brandName: 'Reserve',
    genericName: 'Aceclofenac',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '100 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 5.0,
    stripPrice: 50.0,
    therapeuticClass: 'NSAID Analgesic & Anti-inflammatory',
    indication: 'বাতের ব্যথা, কোমর ব্যথা, গিঁটে ব্যথা ও দাঁতব্যথা উপশমে ব্যবহৃত',
    darNo: '198-212-013',
    availableDosages: '100 mg Tablet, Reserve SR 200 mg Tablet',
  },

  // ==================== COMPLETE NAPA BRAND FAMILY (BEXIMCO) ====================
  {
    id: 'med-napa-rapid-500',
    brandName: 'Napa Rapid',
    genericName: 'Paracetamol (Actizorb Technology)',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '20 × 10 (200 pcs)',
    unitsPerStrip: 10,
    unitPrice: 1.3,
    stripPrice: 13.0,
    therapeuticClass: 'Fast-Acting Analgesic & Antipyretic',
    indication: 'দ্রুত জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের ব্যথা উপশমে ব্যবহৃত (সাধারণ প্যারাসিটামলের চেয়ে দ্বিগুণ দ্রুত শোষিত হয়)',
    darNo: '012-512-009',
    availableDosages: '500 mg Actizorb Tablet',
  },
  {
    id: 'med-napa-one-1000',
    brandName: 'Napa One',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '1000 mg',
    dosageForm: 'Tablet',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 2.25,
    stripPrice: 22.5,
    therapeuticClass: 'High-Strength Analgesic & Antipyretic',
    indication: 'প্রাপ্তবয়স্কদের তীব্র জ্বর, মাথাব্যথা ও শরীর ব্যথায় ব্যবহৃত ১০০০ মি.গ্রা. ট্যাবলেট',
    darNo: '012-540-009',
    availableDosages: '1000 mg Tablet',
  },
  {
    id: 'med-napa-extra-tab',
    brandName: 'Napa Extra',
    genericName: 'Paracetamol + Caffeine',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '500 mg + 65 mg',
    dosageForm: 'Tablet',
    packSize: '20 × 12 (240 pcs)',
    unitsPerStrip: 12,
    unitPrice: 2.5,
    stripPrice: 30.0,
    therapeuticClass: 'Analgesic & Antipyretic (Migraine & Severe Headache)',
    indication: 'তীব্র মাথাব্যথা, মাইগ্রেন, দাঁতব্যথা, সাইনোসাইটিস ও জ্বরের ব্যথায় ব্যবহৃত',
    darNo: '012-215-009',
    availableDosages: '500 mg + 65 mg Film Coated Tablet',
  },
  {
    id: 'med-napadol-tab',
    brandName: 'Napadol',
    genericName: 'Paracetamol + Tramadol Hydrochloride',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '325 mg + 37.5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Opioid + Non-Opioid Combination Analgesic',
    indication: 'মাঝারি থেকে তীব্র ব্যথা, কোমর ব্যথা, আঘাতজনিত ব্যথা ও অপারেশন পরবর্তী ব্যথায় ব্যবহৃত',
    darNo: '012-418-011',
    availableDosages: '325 mg + 37.5 mg Tablet',
  },
  {
    id: 'med-napa-pdrop-15',
    brandName: 'Napa',
    genericName: 'Paracetamol',
    companyName: 'Beximco Pharmaceuticals Ltd.',
    strength: '15 ml (80 mg/ml Paediatric Drops)',
    dosageForm: 'Drops',
    packSize: '1 × 1 (15 ml Bottle with Dropper)',
    unitsPerStrip: 1,
    unitPrice: 30.0,
    stripPrice: 30.0,
    therapeuticClass: 'Analgesic & Antipyretic (Paediatric Drops)',
    indication: 'নবজাতক ও ছোট শিশুদের জ্বর এবং টিকা পরবর্তী ব্যথা উপশমে ব্যবহৃত পেডিয়াট্রিক ড্রপস',
    darNo: '012-019-001',
    availableDosages: '15 ml Paediatric Drops, 60 ml Syrup, 100 ml Syrup, 125/250/500 mg Suppository',
  },

  // ==================== COMPLETE ACE BRAND FAMILY (SQUARE) ====================
  {
    id: 'med-ace-plus-tab',
    brandName: 'Ace Plus',
    genericName: 'Paracetamol + Caffeine',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg + 65 mg',
    dosageForm: 'Tablet',
    packSize: '20 × 10 (200 pcs)',
    unitsPerStrip: 10,
    unitPrice: 2.5,
    stripPrice: 25.0,
    therapeuticClass: 'Analgesic & Antipyretic (Migraine & Severe Headache)',
    indication: 'তীব্র মাথাব্যথা, মাইগ্রেন, দাঁতব্যথা ও জ্বরের ব্যথায় ব্যবহৃত',
    darNo: '018-219-009',
    availableDosages: '500 mg + 65 mg Tablet',
  },
  {
    id: 'med-ace-syp-60',
    brandName: 'Ace',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '60 ml (120 mg/5 ml)',
    dosageForm: 'Syrup',
    packSize: '1 × 1 (60 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 35.0,
    stripPrice: 35.0,
    therapeuticClass: 'Analgesic & Antipyretic (Paediatric Syrup)',
    indication: 'শিশুদের জ্বর, মাথাব্যথা, দাঁতব্যথা ও টিকা পরবর্তী ব্যথা উপশমে ব্যবহৃত সিরাপ',
    darNo: '018-014-001',
    availableDosages: '60 ml Syrup, 100 ml Syrup, 15 ml Paediatric Drops, 125/250/500 mg Suppository, 500 mg Tablet',
  },
  {
    id: 'med-ace-syp-100',
    brandName: 'Ace',
    genericName: 'Paracetamol',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '100 ml (120 mg/5 ml)',
    dosageForm: 'Syrup',
    packSize: '1 × 1 (100 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 50.0,
    stripPrice: 50.0,
    therapeuticClass: 'Analgesic & Antipyretic (Paediatric Syrup)',
    indication: 'শিশুদের জ্বর, মাথাব্যথা, দাঁতব্যথা ও শরীরের ব্যথা উপশমে ব্যবহৃত সিরাপ',
    darNo: '018-015-001',
    availableDosages: '60 ml Syrup, 100 ml Syrup, 15 ml Paediatric Drops, 125/250/500 mg Suppository',
  },

  // ==================== COMPLETE SECLO, SERGEL, MAXPRO, ZIMAX, CEF-3 VARIANTS ====================
  {
    id: 'med-seclo-mups-40',
    brandName: 'Seclo MUPS',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '40 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 10.0,
    stripPrice: 100.0,
    therapeuticClass: 'Proton Pump Inhibitor (MUPS Tablet)',
    indication: 'তীব্র গ্যাস্ট্রিক আলসার ও অ্যাসিড রিফ্লাক্স দ্রুত নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-613-043',
    availableDosages: '20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-seclo-inj-40',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '40 mg IV Vial',
    dosageForm: 'Injection',
    packSize: '1 × 1 (40 mg IV Vial + WFI)',
    unitsPerStrip: 1,
    unitPrice: 90.0,
    stripPrice: 90.0,
    therapeuticClass: 'Proton Pump Inhibitor (IV Injection)',
    indication: 'হাসপাতালে ভর্তি রোগীদের তীব্র গ্যাস্ট্রিক আলসার ও রক্তক্ষরণ প্রতিরোধে ব্যবহৃত আইভি ইনজেকশন',
    darNo: '018-115-043',
    availableDosages: '40 mg IV Injection, 20 mg Capsule, 40 mg Capsule, 20 mg Sachet',
  },
  {
    id: 'med-seclo-10',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '10 mg',
    dosageForm: 'Capsule',
    packSize: '10 × 10 (100 pcs)',
    unitsPerStrip: 10,
    unitPrice: 4.0,
    stripPrice: 40.0,
    therapeuticClass: 'Proton Pump Inhibitor (Gastric)',
    indication: 'হালকা গ্যাস্ট্রিক অ্যাসিডিটি ও পেটের অস্বস্তি নিরাময়ে ব্যবহৃত কম ডোজের সেকলো',
    darNo: '018-111-043',
    availableDosages: '10 mg Capsule, 20 mg Capsule, 40 mg Capsule, 20 mg MUPS, 40 mg MUPS',
  },
  {
    id: 'med-seclo-sachet-40',
    brandName: 'Seclo',
    genericName: 'Omeprazole',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '40 mg Oral Powder Sachet',
    dosageForm: 'Sachet',
    packSize: '1 × 10 (10 Sachets)',
    unitsPerStrip: 10,
    unitPrice: 15.0,
    stripPrice: 150.0,
    therapeuticClass: 'Proton Pump Inhibitor (Oral Suspension Sachet)',
    indication: 'তীব্র গ্যাস্ট্রিক আলসার ও বুক জ্বালাপোড়া উপশমে উচ্চমাত্রার সেকলো স্যাচেট',
    darNo: '018-116-043',
    availableDosages: '20 mg Sachet, 40 mg Sachet, 20 mg Capsule, 40 mg Capsule',
  },
  {
    id: 'med-sergel-mups-20',
    brandName: 'Sergel MUPS',
    genericName: 'Esomeprazole',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 8.0,
    stripPrice: 80.0,
    therapeuticClass: 'Proton Pump Inhibitor (MUPS Tablet)',
    indication: 'দ্রুত কার্যকরী গ্যাস্ট্রিক আলসার ও বুক জ্বালাপোড়া উপশমে ব্যবহৃত',
    darNo: '319-048-043',
    availableDosages: '20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-sergel-mups-40',
    brandName: 'Sergel MUPS',
    genericName: 'Esomeprazole',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '40 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 12.0,
    stripPrice: 120.0,
    therapeuticClass: 'Proton Pump Inhibitor (MUPS Tablet)',
    indication: 'তীব্র পেপটিক আলসার ও জার্ড (GERD) নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '319-049-043',
    availableDosages: '20 mg MUPS Tablet, 40 mg MUPS Tablet',
  },
  {
    id: 'med-sergel-inj-40',
    brandName: 'Sergel',
    genericName: 'Esomeprazole',
    companyName: 'Healthcare Pharmaceuticals Ltd.',
    strength: '40 mg IV Vial',
    dosageForm: 'Injection',
    packSize: '1 × 1 (40 mg IV Vial)',
    unitsPerStrip: 1,
    unitPrice: 90.0,
    stripPrice: 90.0,
    therapeuticClass: 'Proton Pump Inhibitor (IV Injection)',
    indication: 'তীব্র গ্যাস্ট্রিক ও আলসার রোগীদের জন্য আইভি ইনজেকশন',
    darNo: '319-050-043',
    availableDosages: '40 mg IV Injection, 20 mg Capsule, 40 mg Capsule, 20 mg Sachet',
  },
  {
    id: 'med-zimax-cap-250',
    brandName: 'Zimax',
    genericName: 'Azithromycin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '250 mg',
    dosageForm: 'Capsule',
    packSize: '1 × 6 (6 pcs)',
    unitsPerStrip: 6,
    unitPrice: 25.0,
    stripPrice: 150.0,
    therapeuticClass: 'Macrolide Antibiotic (Capsule)',
    indication: 'শ্বাসতন্ত্রের সংক্রমণ, টনসিলাইটিস ও চর্মের সংক্রমণে ব্যবহৃত ক্যাপসুল',
    darNo: '018-176-023',
    availableDosages: '250 mg Capsule, 500 mg Tablet, 15 ml / 30 ml / 50 ml Suspension, 500 mg IV Injection',
  },
  {
    id: 'med-zimax-susp-15',
    brandName: 'Zimax',
    genericName: 'Azithromycin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '15 ml (200 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (15 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 92.0,
    stripPrice: 92.0,
    therapeuticClass: 'Macrolide Antibiotic (Paediatric Dry Suspension)',
    indication: 'শিশুদের গলা ব্যথা, টনসিলাইটিস, নিউমোনিয়া ও কানের সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '018-178-023',
    availableDosages: '15 ml Suspension, 30 ml Suspension, 50 ml Suspension, 250 mg Capsule, 500 mg Tablet',
  },
  {
    id: 'med-zimax-susp-50',
    brandName: 'Zimax',
    genericName: 'Azithromycin',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '50 ml (200 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (50 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 195.0,
    stripPrice: 195.0,
    therapeuticClass: 'Macrolide Antibiotic (Dry Suspension)',
    indication: 'শিশুদের টনসিলাইটিস, নিউমোনিয়া, টাইফয়েড ও কানের সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '018-180-023',
    availableDosages: '15 ml Suspension, 30 ml Suspension, 50 ml Suspension, 250 mg Capsule, 500 mg Tablet',
  },
  {
    id: 'med-cef3-susp-30',
    brandName: 'Cef-3',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '30 ml (100 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (30 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 145.0,
    stripPrice: 145.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic (Suspension)',
    indication: 'শিশুদের টাইফয়েড জ্বর, নিউমোনিয়া, টনসিলাইটিস ও ইউটিআই সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '018-292-025',
    availableDosages: '30 ml Suspension, 50 ml Suspension, 21 ml Paediatric Drops, 200 mg Capsule, 400 mg DS Capsule',
  },
  {
    id: 'med-cef3-susp-50',
    brandName: 'Cef-3',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '50 ml (100 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (50 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 210.0,
    stripPrice: 210.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic (Suspension)',
    indication: 'শিশুদের টাইফয়েড জ্বর, শ্বাসতন্ত্র ও মূত্রনালীর সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '018-293-025',
    availableDosages: '30 ml Suspension, 50 ml Suspension, 21 ml Paediatric Drops, 200 mg Capsule, 400 mg DS Capsule',
  },
  {
    id: 'med-cef3-forte-50',
    brandName: 'Cef-3 Forte',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '50 ml (200 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (50 ml Double Strength Bottle)',
    unitsPerStrip: 1,
    unitPrice: 295.0,
    stripPrice: 295.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic (Forte Suspension)',
    indication: 'বড় শিশুদের টাইফয়েড ও তীব্র ব্যাকটেরিয়াজনিত সংক্রমণে ব্যবহৃত ডাবল স্ট্রেংথ সাসপেনশন',
    darNo: '018-294-025',
    availableDosages: '50 ml (200 mg/5 ml) Forte Suspension',
  },
  {
    id: 'med-cef3-pdrop-21',
    brandName: 'Cef-3',
    genericName: 'Cefixime Trihydrate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '21 ml (25 mg/ml Paediatric Drops)',
    dosageForm: 'Drops',
    packSize: '1 × 1 (21 ml Paediatric Drops)',
    unitsPerStrip: 1,
    unitPrice: 125.0,
    stripPrice: 125.0,
    therapeuticClass: '3rd Gen Cephalosporin Antibiotic (Paediatric Drops)',
    indication: 'নবজাতক ও ছোট শিশুদের সংক্রমণ ও নিউমোনিয়ায় ব্যবহৃত পেডিয়াট্রিক ড্রপস',
    darNo: '018-295-025',
    availableDosages: '21 ml Paediatric Drops, 30 ml / 50 ml Suspension, 200 mg Capsule',
  },

  // ==================== ORAL CONTRACEPTIVES, GYNECOLOGY, ANTIPROTOZOAL & MATERNAL CARE ====================
  {
    id: 'med-noret-28',
    brandName: 'Noret-28',
    genericName: 'Levonorgestrel + Ethinylestradiol + Ferrous Fumarate',
    companyName: 'SMC Enterprise Ltd.',
    strength: '0.15 mg + 0.03 mg (28 Pills Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 28 Tablets (1 Cycle Pack)',
    unitsPerStrip: 1,
    unitPrice: 40.0,
    stripPrice: 40.0,
    therapeuticClass: 'Oral Contraceptive Pill (Birth Control)',
    indication: 'জন্মবিরতিকরণ পিল, মাসিক নিয়মিতকরণ ও অনাকাঙ্ক্ষিত গর্ভধারণ প্রতিরোধে ব্যবহৃত (২৮টি পিলের পাতা)',
    darNo: '295-011-062',
    availableDosages: '0.15 mg + 0.03 mg (28 Pills Cycle), 1 Strip (28 Tabs)',
  },
  {
    id: 'med-noret-pill',
    brandName: 'Noret',
    genericName: 'Levonorgestrel + Ethinylestradiol + Ferrous Fumarate',
    companyName: 'SMC Enterprise Ltd.',
    strength: '0.15 mg + 0.03 mg (28 Pills Pack)',
    dosageForm: 'Tablet',
    packSize: '1 × 28 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 40.0,
    stripPrice: 40.0,
    therapeuticClass: 'Oral Contraceptive Pill (Birth Control)',
    indication: 'জন্মবিরতিকরণ পিল ও মাসিক নিয়মিতকরণে ব্যবহৃত (Noret-28 / নরেট-২৮)',
    darNo: '295-012-062',
    availableDosages: '0.15 mg + 0.03 mg (28 Pills Pack)',
  },
  {
    id: 'med-femicon-28',
    brandName: 'Femicon',
    genericName: 'Levonorgestrel + Ethinylestradiol + Ferrous Fumarate',
    companyName: 'SMC Enterprise Ltd.',
    strength: '0.15 mg + 0.03 mg (28 Pills Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 28 Tablets (1 Cycle Pack)',
    unitsPerStrip: 1,
    unitPrice: 45.0,
    stripPrice: 45.0,
    therapeuticClass: 'Oral Contraceptive Pill (Birth Control)',
    indication: 'জন্মবিরতিকরণ পিল (Femicon / Femicom — ফেমিকন ২৮টি পিলের পাতা), মাসিক নিয়মিতকরণ ও আয়রন ঘাটতি পূরণে ব্যবহৃত',
    darNo: '295-001-062',
    availableDosages: '0.15 mg + 0.03 mg (28 Pills Cycle)',
  },
  {
    id: 'med-microlon-21',
    brandName: 'Microlon',
    genericName: 'Desogestrel + Ethinylestradiol',
    companyName: 'Renata PLC',
    strength: '0.15 mg + 0.03 mg (21 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 21 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 90.0,
    stripPrice: 90.0,
    therapeuticClass: 'Low-Dose Oral Contraceptive Pill',
    indication: 'কম ডোজের জন্মবিরতিকরণ পিল ও অনিয়মিত মাসিক নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '108-412-062',
    availableDosages: '0.15 mg + 0.03 mg (21 Tabs Cycle), 0.5 mg (28 Tabs)',
  },
  {
    id: 'med-minicon-28',
    brandName: 'Minicon',
    genericName: 'Lynestrenol (Progestogen-Only Minipill)',
    companyName: 'SMC Enterprise Ltd.',
    strength: '0.5 mg (28 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 28 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 45.0,
    stripPrice: 45.0,
    therapeuticClass: 'Lactational Oral Contraceptive Pill (Minipill)',
    indication: 'স্তন্যদানকারী (দুধ দানকারী) মায়েদের জন্য নিরাপদ জন্মবিরতিকরণ পিল (মিনিকন)',
    darNo: '295-005-062',
    availableDosages: '0.5 mg (28 Tabs Cycle)',
  },
  {
    id: 'med-marvelon-21',
    brandName: 'Marvelon',
    genericName: 'Desogestrel + Ethinylestradiol',
    companyName: 'Nuvista Pharma PLC',
    strength: '0.15 mg + 0.03 mg (21 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 21 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 132.0,
    stripPrice: 132.0,
    therapeuticClass: '3rd Gen Oral Contraceptive Pill',
    indication: 'আধুনিক জন্মবিরতিকরণ পিল (মারভেলন), পিসিওএস ও অনিয়মিত মাসিক নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '041-088-062',
    availableDosages: '0.15 mg + 0.03 mg (21 Tabs Cycle)',
  },
  {
    id: 'med-ovastat-21',
    brandName: 'Ovastat',
    genericName: 'Desogestrel + Ethinylestradiol',
    companyName: 'Nuvista Pharma PLC',
    strength: '0.15 mg + 0.02 mg (21 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 21 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 95.0,
    stripPrice: 95.0,
    therapeuticClass: 'Oral Contraceptive Pill (Ovostat / Ovastat)',
    indication: 'জন্মবিরতিকরণ পিল এবং মাসিকের অনিয়ম ও অতিরিক্ত রক্তক্ষরণ নিয়ন্ত্রণে ব্যবহৃত (ওভোস্ট্যাট)',
    darNo: '041-091-062',
    availableDosages: '0.15 mg + 0.02 mg (21 Tabs Cycle), 2.5 mg + 0.05 mg (22 Tabs)',
  },
  {
    id: 'med-ovostat-gold-21',
    brandName: 'Ovostat Gold',
    genericName: 'Desogestrel + Ethinylestradiol',
    companyName: 'Nuvista Pharma PLC',
    strength: '0.15 mg + 0.02 mg (21 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 21 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 135.0,
    stripPrice: 135.0,
    therapeuticClass: 'Ultra Low-Dose Oral Contraceptive Pill',
    indication: 'আল্ট্রা লো-ডোজ জন্মবিরতিকরণ পিল ও হরমোনাল ভারসাম্য রক্ষায় ব্যবহৃত (ওভোস্ট্যাট গোল্ড)',
    darNo: '041-092-062',
    availableDosages: '0.15 mg + 0.02 mg (21 Tabs Cycle)',
  },
  {
    id: 'med-ovostat-22',
    brandName: 'Ovostat',
    genericName: 'Lynestrenol + Ethinylestradiol',
    companyName: 'Nuvista Pharma PLC',
    strength: '2.5 mg + 0.05 mg (22 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 22 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 95.0,
    stripPrice: 95.0,
    therapeuticClass: 'Oral Contraceptive Pill',
    indication: 'জন্মবিরতিকরণ পিল ও মাসিক নিয়মিতকরণে ব্যবহৃত (ওভোস্ট্যাট)',
    darNo: '041-090-062',
    availableDosages: '2.5 mg + 0.05 mg (22 Tabs Cycle)',
  },
  {
    id: 'med-zox-500',
    brandName: 'Zox',
    genericName: 'Nitazoxanide',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 6 (18 pcs)',
    unitsPerStrip: 6,
    unitPrice: 13.0,
    stripPrice: 78.0,
    therapeuticClass: 'Broad-spectrum Antiprotozoal & Antidiarrheal',
    indication: 'ডায়রিয়া, আমাশয়, জিয়ার্ডিয়াসিস ও পরজীবীজনিত পেটের সংক্রমণে ব্যবহৃত',
    darNo: '018-451-031',
    availableDosages: '500 mg Tablet, 30 ml Suspension (100 mg/5 ml), 60 ml Suspension (100 mg/5 ml)',
  },
  {
    id: 'med-zox-susp-30',
    brandName: 'Zox',
    genericName: 'Nitazoxanide',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '30 ml (100 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (30 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 45.0,
    stripPrice: 45.0,
    therapeuticClass: 'Antiprotozoal & Antidiarrheal (Paediatric Suspension)',
    indication: 'শিশুদের ডায়রিয়া, আমাশয় ও পেটের সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '018-452-031',
    availableDosages: '30 ml Suspension, 60 ml Suspension, 500 mg Tablet',
  },
  {
    id: 'med-zox-susp-60',
    brandName: 'Zox',
    genericName: 'Nitazoxanide',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '60 ml (100 mg/5 ml)',
    dosageForm: 'Suspension',
    packSize: '1 × 1 (60 ml Bottle)',
    unitsPerStrip: 1,
    unitPrice: 70.0,
    stripPrice: 70.0,
    therapeuticClass: 'Antiprotozoal & Antidiarrheal (Suspension)',
    indication: 'ডায়রিয়া, আমাশয় ও পরজীবীজনিত পেটের সংক্রমণে ব্যবহৃত সাসপেনশন',
    darNo: '018-453-031',
    availableDosages: '30 ml Suspension, 60 ml Suspension, 500 mg Tablet',
  },
  {
    id: 'med-aristomom-tab',
    brandName: 'Aristomom',
    genericName: 'Prenatal Multivitamin & Multimineral (Pregnancy & Lactation)',
    companyName: 'Aristopharma Ltd.',
    strength: 'Prenatal 15 Vitamins & Minerals',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 6.5,
    stripPrice: 65.0,
    therapeuticClass: 'Maternal & Prenatal Nutrition Supplement',
    indication: 'গর্ভাবস্থায় ও স্তন্যদানকালে মায়ের পুষ্টি, আয়রন, ফলিক অ্যাসিড ও ভিটামিনের ঘাটতি পূরণে ব্যবহৃত',
    darNo: '028-392-068',
    availableDosages: 'Prenatal Film Coated Tablet (30 pcs Container / Strip)',
  },
  {
    id: 'med-normens-5',
    brandName: 'Normens',
    genericName: 'Norethisterone Acetate',
    companyName: 'Renata PLC',
    strength: '5 mg',
    dosageForm: 'Tablet',
    packSize: '3 × 10 (30 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Progestogen (Menstrual Disorder & Period Control)',
    indication: 'মাসিকের অনিয়ম, অতিরিক্ত রক্তক্ষরণ (DUB), এন্ডোমেট্রিওসিস ও পিরিয়ড পিছিয়ে দিতে ব্যবহৃত',
    darNo: '108-194-062',
    availableDosages: '5 mg Tablet',
  },
  {
    id: 'med-menoral-5',
    brandName: 'Menoral',
    genericName: 'Norethisterone Acetate',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '5 mg',
    dosageForm: 'Tablet',
    packSize: '5 × 10 (50 pcs)',
    unitsPerStrip: 10,
    unitPrice: 7.0,
    stripPrice: 70.0,
    therapeuticClass: 'Progestogen (Menstrual Disorder & Period Control)',
    indication: 'মাসিকের অনিয়ম, অতিরিক্ত রক্তক্ষরণ ও পিরিয়ড নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '018-394-062',
    availableDosages: '5 mg Tablet',
  },
  {
    id: 'med-desolon-21',
    brandName: 'Desolon',
    genericName: 'Desogestrel + Ethinylestradiol',
    companyName: 'Renata PLC',
    strength: '0.15 mg + 0.03 mg (21 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 21 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 90.0,
    stripPrice: 90.0,
    therapeuticClass: '3rd Gen Oral Contraceptive Pill',
    indication: 'জন্মবিরতিকরণ পিল ও অনিয়মিত মাসিক নিয়ন্ত্রণে ব্যবহৃত',
    darNo: '108-415-062',
    availableDosages: '0.15 mg + 0.03 mg (21 Tabs Cycle)',
  },
  {
    id: 'med-bredicon-28',
    brandName: 'Bredicon',
    genericName: 'Lynestrenol (Progestogen-Only Minipill)',
    companyName: 'Renata PLC',
    strength: '0.5 mg (28 Tabs Cycle)',
    dosageForm: 'Tablet',
    packSize: '1 × 28 Tablets (1 Cycle Strip)',
    unitsPerStrip: 1,
    unitPrice: 55.0,
    stripPrice: 55.0,
    therapeuticClass: 'Lactational Oral Contraceptive Pill',
    indication: 'স্তন্যদানকারী মায়েদের জন্য নিরাপদ জন্মবিরতিকরণ পিল',
    darNo: '108-416-062',
    availableDosages: '0.5 mg (28 Tabs Cycle)',
  },
  {
    id: 'med-emcon-1',
    brandName: 'Emcon 1',
    genericName: 'Levonorgestrel (Emergency Contraceptive)',
    companyName: 'Renata PLC',
    strength: '1.5 mg (1 Tablet Pack)',
    dosageForm: 'Tablet',
    packSize: '1 × 1 Single Dose Tablet',
    unitsPerStrip: 1,
    unitPrice: 60.0,
    stripPrice: 60.0,
    therapeuticClass: 'Emergency Contraceptive Pill (ECP)',
    indication: 'অরক্ষিত সহবাসের ৭২ ঘণ্টার মধ্যে জরুরি গর্ভনিরোধক পিল হিসেবে ব্যবহৃত',
    darNo: '108-420-062',
    availableDosages: '1.5 mg Single Tablet',
  },
  {
    id: 'med-norix-1',
    brandName: 'Norix 1',
    genericName: 'Levonorgestrel (Emergency Contraceptive)',
    companyName: 'Square Pharmaceuticals PLC',
    strength: '1.5 mg (1 Tablet Pack)',
    dosageForm: 'Tablet',
    packSize: '1 × 1 Single Dose Tablet',
    unitsPerStrip: 1,
    unitPrice: 60.0,
    stripPrice: 60.0,
    therapeuticClass: 'Emergency Contraceptive Pill (ECP)',
    indication: 'অরক্ষিত সহবাসের ৭২ ঘণ্টার মধ্যে জরুরি গর্ভনিরোধক পিল হিসেবে ব্যবহৃত',
    darNo: '018-520-062',
    availableDosages: '1.5 mg Single Tablet',
  },
  {
    id: 'med-peuli-1',
    brandName: 'Peuli',
    genericName: 'Levonorgestrel (Emergency Contraceptive)',
    companyName: 'Incepta Pharmaceuticals Ltd.',
    strength: '1.5 mg (1 Tablet Pack)',
    dosageForm: 'Tablet',
    packSize: '1 × 1 Single Dose Tablet',
    unitsPerStrip: 1,
    unitPrice: 55.0,
    stripPrice: 55.0,
    therapeuticClass: 'Emergency Contraceptive Pill (ECP)',
    indication: 'জরুরি গর্ভনিরোধক পিল হিসেবে ৭২ ঘণ্টার মধ্যে ব্যবহৃত',
    darNo: '198-520-062',
    availableDosages: '1.5 mg Single Tablet',
  },
  {
    id: 'med-soma-ject',
    brandName: 'Soma-Ject',
    genericName: 'Medroxyprogesterone Acetate',
    companyName: 'SMC Enterprise Ltd.',
    strength: '150 mg/ml (3-Month IM Inj)',
    dosageForm: 'Injection',
    packSize: '1 × 1 ml Vial with Syringe',
    unitsPerStrip: 1,
    unitPrice: 65.0,
    stripPrice: 65.0,
    therapeuticClass: '3-Month Injectable Contraceptive',
    indication: '৩ মাস মেয়াদী জন্মবিরতিকরণ ইনজেকশন (সোমাজেক্ট)',
    darNo: '295-020-062',
    availableDosages: '150 mg/ml IM Injection',
  },
];

const _nationalDb = buildNationalMedicineDatabase(CURATED_BD_MEDICINES);

export const BD_MEDICINES_CATALOG: MedicineCatalogItem[] = _nationalDb.allMedicines.map((med) => ({
  ...med,
  purchasePrice: med.purchasePrice ?? Number((med.unitPrice * 0.88).toFixed(2)),
  isCoreProduct: true,
  isCustom: false,
}));
export const BD_GENERICS_DIRECTORY: GenericDirectoryEntry[] = _nationalDb.genericsDirectory;
export const BD_COMPANIES_DIRECTORY: CompanyDirectoryEntry[] = _nationalDb.companiesDirectory;

export const CATALOG_BY_ID = new Map<string, MedicineCatalogItem>();
export const CATALOG_BY_BRAND_STRENGTH = new Map<string, MedicineCatalogItem>();

for (const med of BD_MEDICINES_CATALOG) {
  CATALOG_BY_ID.set(med.id, med);
  const key = `${med.brandName.toLowerCase()}__${med.strength.toLowerCase()}`;
  if (!CATALOG_BY_BRAND_STRENGTH.has(key)) {
    CATALOG_BY_BRAND_STRENGTH.set(key, med);
  }
}

export function isCoreDatabaseMedicineId(id: string): boolean {
  if (!id) return false;
  if (CATALOG_BY_ID.has(id)) return true;
  const baseId = id.replace(/-var-\d+$/, '');
  return CATALOG_BY_ID.has(baseId);
}

export interface DosageFormMeta {
  value: MedicineCatalogItem['dosageForm'];
  shortCode: string;
  labelBn: string;
  unitLabelBn: string;
  packLabelBn: string;
  defaultStrengths: string[];
  defaultUnitsPerStrip: number;
}

export const DOSAGE_FORM_OPTIONS: DosageFormMeta[] = [
  {
    value: 'Tablet',
    shortCode: 'Tab',
    labelBn: 'Tab (ট্যাবলেট - mg)',
    unitLabelBn: 'পিস',
    packLabelBn: 'পাতা (১০ পিস)',
    defaultStrengths: ['5 mg', '10 mg', '20 mg', '40 mg', '50 mg', '75 mg', '100 mg', '250 mg', '500 mg', '665 mg XR', '1000 mg'],
    defaultUnitsPerStrip: 10,
  },
  {
    value: 'Capsule',
    shortCode: 'Cap',
    labelBn: 'Cap (ক্যাপসুল - mg)',
    unitLabelBn: 'পিস',
    packLabelBn: 'পাতা (১০ পিস)',
    defaultStrengths: ['10 mg', '20 mg', '40 mg', '50 mg', '75 mg', '150 mg', '200 mg', '250 mg', '400 mg', '500 mg'],
    defaultUnitsPerStrip: 10,
  },
  {
    value: 'Syrup',
    shortCode: 'Syp',
    labelBn: 'Syp (সিরাপ - ml)',
    unitLabelBn: 'বোতল',
    packLabelBn: 'বোতল (ml)',
    defaultStrengths: ['30 ml', '50 ml', '60 ml (120 mg/5 ml)', '100 ml', '120 ml', '200 ml'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Suspension',
    shortCode: 'Susp',
    labelBn: 'Susp (সাসপেনশন - ml)',
    unitLabelBn: 'বোতল',
    packLabelBn: 'বোতল (ml)',
    defaultStrengths: ['15 ml (200 mg/5 ml)', '30 ml (100 mg/5 ml)', '50 ml (100 mg/5 ml)', '60 ml', '70 ml (125 mg/5 ml)', '100 ml', '200 ml Bottle'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Suppository',
    shortCode: 'Supp',
    labelBn: 'Supp (সাপোজিটরি - mg)',
    unitLabelBn: 'সাপোজিটরি',
    packLabelBn: 'পাতা (১০টি)',
    defaultStrengths: ['12.5 mg', '25 mg', '50 mg', '125 mg', '250 mg', '500 mg'],
    defaultUnitsPerStrip: 10,
  },
  {
    value: 'Inhaler',
    shortCode: 'Inhaler',
    labelBn: 'Inhaler (ইনহেলার - mcg)',
    unitLabelBn: 'ইনহেলার',
    packLabelBn: 'ইনহেলার (২০০ পাফ)',
    defaultStrengths: ['100 mcg/puff (200 MD)', '200 mcg/puff (200 MD)', '250 mcg/puff (120 MD)'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Sachet',
    shortCode: 'Sachet',
    labelBn: 'Sachet (স্যাচেট - mg/g)',
    unitLabelBn: 'স্যাচেট',
    packLabelBn: 'বক্স (১০/২০ স্যাচেট)',
    defaultStrengths: ['1 g Sachet (4 Billion CFU)', '4 mg Granules Sachet', '10 mg Oral Sachet', '20 mg Oral Sachet', '40 mg Oral Sachet', '10.25 g Sachet (500 ml)'],
    defaultUnitsPerStrip: 20,
  },
  {
    value: 'Eye Drop',
    shortCode: 'Eye Drop',
    labelBn: 'Eye Drop (চোখের ড্রপ - ml)',
    unitLabelBn: 'বোতল',
    packLabelBn: '১ বোতল (Sterile Eye Drop)',
    defaultStrengths: ['5 ml (0.5% w/v)', '5 ml (0.3% w/v)', '5 ml (0.5% + 0.1%)', '10 ml (0.5% w/v)', '15 ml (Artificial Tears)'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Ear Drop',
    shortCode: 'Ear Drop',
    labelBn: 'Ear Drop (কানের ড্রপ - ml)',
    unitLabelBn: 'বোতল',
    packLabelBn: '১ বোতল (Otic Ear Drop)',
    defaultStrengths: ['5 ml (0.3% w/v Otic)', '5 ml (0.3% + 0.1%)', '10 ml (0.5% w/v Ear Wax)', '10 ml (1% w/v Antifungal)'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Nasal Drop',
    shortCode: 'Nasal Drop',
    labelBn: 'Nasal Drop (নাকের ড্রপ - ml)',
    unitLabelBn: 'বোতল',
    packLabelBn: '১ বোতল (Nasal Drop/Spray)',
    defaultStrengths: ['15 ml (0.1% w/v Adult)', '15 ml (0.05% w/v Paediatric)', '15 ml (0.9% w/v Saline)', '10 ml (0.1% w/v)', '50 mcg/spray (120 MD)'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Drops',
    shortCode: 'P-Drops',
    labelBn: 'P-Drops (শিশুদের মুখে খাওয়ার ড্রপ - ml)',
    unitLabelBn: 'বোতল',
    packLabelBn: '১ বোতল (ড্রপারসহ)',
    defaultStrengths: ['15 ml (80 mg/ml Paediatric Drops)', '15 ml (40 mg/0.6 ml)', '15 ml (20 mg/ml)', '21 ml Paediatric Drops'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Injection',
    shortCode: 'Inj',
    labelBn: 'Inj (ইনজেকশন/ইনসুলিন - mg/ml)',
    unitLabelBn: 'ভায়াল/পেন',
    packLabelBn: '১ ভায়াল/অ্যাম্পুল/পেন',
    defaultStrengths: ['100 IU/ml (3 ml Pre-filled FlexPen)', '30 mg/ml Inj', '40 mg IV Inj', '500 mg IV Inj', '1 g IV Inj'],
    defaultUnitsPerStrip: 1,
  },
  {
    value: 'Gel',
    shortCode: 'Gel/Cream',
    labelBn: 'Cream/Gel (ক্রিম/জেল - g/ml)',
    unitLabelBn: 'টিউব/বোতল',
    packLabelBn: '১ টিউব/বোতল',
    defaultStrengths: ['10 g Cream (2% w/w)', '15 g Gel (1% w/w)', '30 g Cream (5% w/w)', '60 ml Lotion (5% + 0.1%)'],
    defaultUnitsPerStrip: 1,
  },
];

export function getShortDosageForm(form: string): string {
  const f = form.toLowerCase();
  if (f.includes('eye')) return 'Eye Drop';
  if (f.includes('ear') || f.includes('otic')) return 'Ear Drop';
  if (f.includes('nasal')) return 'Nasal Drop';
  if (f.includes('tab')) return 'Tab';
  if (f.includes('cap')) return 'Cap';
  if (f.includes('syp') || f.includes('syrup')) return 'Syp';
  if (f.includes('susp')) return 'Susp';
  if (f.includes('supp')) return 'Supp';
  if (f.includes('inhal') || f.includes('inhel')) return 'Inhaler';
  if (f.includes('sach') || f.includes('sacet')) return 'Sachet';
  if (f.includes('inj')) return 'Inj';
  if (f.includes('drop')) return 'Drops';
  if (f.includes('gel') || f.includes('cream') || f.includes('oint') || f.includes('lotion')) return 'Gel/Cream';
  return form;
}

export function getUnitLabelForForm(form: string): string {
  const short = getShortDosageForm(form);
  if (
    short === 'Syp' ||
    short === 'Susp' ||
    short === 'Drops' ||
    short === 'Eye Drop' ||
    short === 'Ear Drop' ||
    short === 'Nasal Drop'
  ) {
    return 'বোতল';
  }
  if (short === 'Supp') return 'সাপোজিটরি';
  if (short === 'Inhaler') return 'ইনহেলার';
  if (short === 'Sachet') return 'স্যাচেট';
  if (short === 'Inj') return 'ভায়াল';
  if (short === 'Gel/Cream') return 'টিউব';
  return 'পিস';
}

/**
 * Extracts the root brand family key so sub-brands of the same medicine family
 * (e.g., Napa, Napa Extend, Napa Extra, Napadol, Napa Rapid, Napa One -> "napa";
 * Ace, Ace XR, Ace Plus -> "ace"; Seclo, Seclo MUPS -> "seclo") group together.
 */
export function getRootBrandFamily(brandName: string): string {
  const lower = brandName.trim().toLowerCase();
  if (!lower) return '';
  if (lower.startsWith('napa')) return 'napa';
  if (lower === 'ace' || lower.startsWith('ace ') || lower.startsWith('aceta')) return 'ace';
  return lower
    .replace(
      /[\s-]+(extend|extra|rapid|one|xr|er|sr|cr|dt|ds|ts|mups|plus|forte|max|cozycap|levo|paediatric|kids|junior|gold|silver|dx|d|as|am|hz|cv|30)\b.*$/i,
      ''
    )
    .trim();
}

/**
 * Formats a specific brand-family variant into a clear, pharmacist-friendly label
 * (e.g., "Napa (Tab · 500 mg)", "Napa Extend (Tab · 665 mg)", "Napadol (Tab · 325+37.5 mg)",
 * "Napa সিরাপ (Syp · 60 ml)", "Napa ড্রপ (Drops · 15 ml)", "Napa সাপোজিটরি (Supp · 250 mg)").
 */
export function formatBrandVariantLabel(
  variant: MedicineCatalogItem,
  _contextBrandName?: string
): string {
  const shortForm = getShortDosageForm(variant.dosageForm);
  const formBnMap: Record<string, string> = {
    Tab: 'ট্যাবলেট (Tab)',
    Cap: 'ক্যাপসুল (Cap)',
    Syp: 'সিরাপ (Syp)',
    Susp: 'সাসপেনশন (Susp)',
    Supp: 'সাপোজিটরি (Supp)',
    Drops: 'ড্রপ (Drops)',
    'Eye Drop': 'চোখের ড্রপ (Eye Drop)',
    'Ear Drop': 'কানের ড্রপ (Ear Drop)',
    'Nasal Drop': 'নাকের ড্রপ (Nasal Drop)',
    Inhaler: 'ইনহেলার (Inhaler)',
    Sachet: 'স্যাচেট (Sachet)',
    Inj: 'ইনজেকশন (Inj)',
    'Gel/Cream': 'ক্রিম/জেল (Gel)',
  };
  const formLabel = formBnMap[shortForm] || shortForm;
  return `${variant.brandName} — ${formLabel} · ${variant.strength}`;
}

/**
 * Returns ONLY the authentic variants that belong to the selected medicine/brand family
 * (e.g. for Napa: Napa Tab 500mg, Napa Rapid, Napa One, Napa Extend, Napa Extra, Napadol,
 * Napa Syrup 60ml/100ml, Napa Paediatric Drops 15ml, Napa Suppository 125/250/500mg).
 * Never pollutes the list with unrelated brands from other companies.
 */
export function getBrandFormAndStrengthVariants(
  catalog: MedicineCatalogItem[],
  brandName: string,
  _genericName?: string
): MedicineCatalogItem[] {
  const bLower = brandName.trim().toLowerCase();
  if (!bLower) return [];

  const rootFamily = getRootBrandFamily(brandName);
  const primaryRef =
    catalog.find((m) => m.brandName.toLowerCase() === bLower) ||
    catalog.find((m) => getRootBrandFamily(m.brandName) === rootFamily);

  const targetCompany = primaryRef?.companyName.toLowerCase();

  // Collect all items in the catalog that belong to this brand family and same company
  const familyMatches = catalog.filter((m) => {
    const mLower = m.brandName.toLowerCase();
    if (mLower === bLower) return true;
    const mRoot = getRootBrandFamily(m.brandName);
    if (mRoot === rootFamily) {
      return !targetCompany || m.companyName.toLowerCase() === targetCompany;
    }
    return false;
  });

  // Deduplicate by (brandName, shortForm, primaryNumber + normalized strength)
  const seenKeys = new Set<string>();
  const uniqueVariants: MedicineCatalogItem[] = [];

  for (const item of familyMatches) {
    const sForm = getShortDosageForm(item.dosageForm);
    const numMatch = item.strength.match(/(\d+(?:\.\d+)?)/);
    const pNum = numMatch ? numMatch[1] : item.strength.toLowerCase();
    const dedupKey = `${item.brandName.toLowerCase()}__${sForm}__${pNum}`;
    if (!seenKeys.has(dedupKey)) {
      seenKeys.add(dedupKey);
      uniqueVariants.push(item);
    }
  }

  // Sort in logical clinical order: Tablet -> Capsule -> Syrup -> Suspension -> Drops -> Eye/Ear/Nasal Drop -> Suppository -> Sachet -> Inhaler -> Injection -> Gel
  const formOrder: Record<string, number> = {
    Tab: 1,
    Cap: 2,
    Syp: 3,
    Susp: 4,
    Drops: 5,
    'Eye Drop': 6,
    'Ear Drop': 7,
    'Nasal Drop': 8,
    Supp: 9,
    Sachet: 10,
    Inhaler: 11,
    Inj: 12,
    'Gel/Cream': 13,
  };

  uniqueVariants.sort((a, b) => {
    const aExact = a.brandName.toLowerCase() === bLower ? 0 : 1;
    const bExact = b.brandName.toLowerCase() === bLower ? 0 : 1;
    const orderA = formOrder[getShortDosageForm(a.dosageForm)] || 99;
    const orderB = formOrder[getShortDosageForm(b.dosageForm)] || 99;
    if (orderA !== orderB) return orderA - orderB;
    if (aExact !== bExact) return aExact - bExact;
    return a.unitPrice - b.unitPrice;
  });

  if (uniqueVariants.length === 0 && primaryRef) {
    uniqueVariants.push(primaryRef);
  }

  uniqueVariants.sort((a, b) => {
    const aExact = a.brandName.toLowerCase() === bLower ? 0 : 1;
    const bExact = b.brandName.toLowerCase() === bLower ? 0 : 1;
    const orderA = formOrder[getShortDosageForm(a.dosageForm)] || 99;
    const orderB = formOrder[getShortDosageForm(b.dosageForm)] || 99;
    if (orderA !== orderB) return orderA - orderB;
    if (aExact !== bExact) return aExact - bExact;
    return a.unitPrice - b.unitPrice;
  });

  return uniqueVariants;
}

/**
 * Calculates the exact proportional price (unitPrice, stripPrice, purchasePrice, packSize, unitsPerStrip)
 * when a user selects or changes Dosage Form (Syp, Cap, Tab, Supp, Inhaler, Sachet, Eye Drop, Ear Drop, Nasal Drop, etc.) or Strength (mg, ml, mcg, g).
 */
export function calculateProportionalMedicinePrice(params: {
  catalog: MedicineCatalogItem[];
  brandName: string;
  genericName: string;
  targetForm: string;
  targetStrength: string;
  currentUnitPrice?: number;
}): {
  unitPrice: number;
  stripPrice: number;
  purchasePrice: number;
  packSize: string;
  unitsPerStrip: number;
  matchedItem?: MedicineCatalogItem;
} {
  const { catalog, brandName, genericName, targetForm, targetStrength } = params;
  const bLower = brandName.trim().toLowerCase();
  const gLower = genericName.trim().toLowerCase();
  const sLower = targetStrength.trim().toLowerCase();
  const fShort = getShortDosageForm(targetForm);

  // 1. Check if catalog has an exact match for this brand + form + strength
  const exactBrandMatch = catalog.find(
    (m) =>
      m.brandName.toLowerCase() === bLower &&
      getShortDosageForm(m.dosageForm) === fShort &&
      m.strength.toLowerCase() === sLower
  );
  if (exactBrandMatch) {
    return {
      unitPrice: exactBrandMatch.unitPrice,
      stripPrice: exactBrandMatch.stripPrice,
      purchasePrice:
        exactBrandMatch.purchasePrice ??
        Number((exactBrandMatch.unitPrice * 0.88).toFixed(2)),
      packSize: exactBrandMatch.packSize,
      unitsPerStrip: exactBrandMatch.unitsPerStrip,
      matchedItem: exactBrandMatch,
    };
  }

  // 2. Check if catalog has a match for this generic + form + strength
  const genericFormStrengthMatch = catalog.find(
    (m) =>
      m.genericName.toLowerCase() === gLower &&
      getShortDosageForm(m.dosageForm) === fShort &&
      m.strength.toLowerCase() === sLower
  );
  if (genericFormStrengthMatch) {
    return {
      unitPrice: genericFormStrengthMatch.unitPrice,
      stripPrice: genericFormStrengthMatch.stripPrice,
      purchasePrice:
        genericFormStrengthMatch.purchasePrice ??
        Number((genericFormStrengthMatch.unitPrice * 0.88).toFixed(2)),
      packSize: genericFormStrengthMatch.packSize,
      unitsPerStrip: genericFormStrengthMatch.unitsPerStrip,
      matchedItem: genericFormStrengthMatch,
    };
  }

  // 3. Find base reference medicine for this brand or generic
  const refMed =
    catalog.find((m) => m.brandName.toLowerCase() === bLower) ||
    catalog.find((m) => m.genericName.toLowerCase() === gLower);

  const parseNum = (str: string): number => {
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const targetNum = parseNum(targetStrength);
  const refNum = refMed ? parseNum(refMed.strength) : 20;
  const refBasePrice =
    refMed && refMed.unitPrice < 60
      ? refMed.unitPrice
      : params.currentUnitPrice && params.currentUnitPrice < 60
      ? params.currentUnitPrice
      : 6.0;

  let unitPrice = refBasePrice;
  let unitsPerStrip = 10;
  let packSize = '10 × 10 (100 pcs)';

  if (fShort === 'Syp' || fShort === 'Susp') {
    const mlMatch = sLower.match(/(\d+)\s*ml/);
    const mlVol = mlMatch ? parseInt(mlMatch[1], 10) : targetNum || 60;
    const isAntibiotic = refBasePrice >= 20;
    if (isAntibiotic) {
      if (mlVol <= 15) unitPrice = 85.0;
      else if (mlVol <= 30) unitPrice = 130.0;
      else if (mlVol <= 50) unitPrice = 185.0;
      else if (mlVol <= 70) unitPrice = 240.0;
      else unitPrice = Number((mlVol * 2.5).toFixed(2));
    } else {
      if (mlVol <= 30) unitPrice = 25.0;
      else if (mlVol <= 50) unitPrice = 32.0;
      else if (mlVol <= 60) unitPrice = 35.0;
      else if (mlVol <= 100) unitPrice = 55.0;
      else if (mlVol <= 120) unitPrice = 65.0;
      else if (mlVol <= 200) unitPrice = 95.0;
      else unitPrice = Number((mlVol * 0.55).toFixed(2));
    }
    unitsPerStrip = 1;
    packSize = `1 × 1 (${mlVol} ml Bottle)`;
  } else if (fShort === 'Supp') {
    const mgVal = targetNum || 125;
    if (mgVal <= 15) unitPrice = 8.0;
    else if (mgVal <= 30) unitPrice = 12.0;
    else if (mgVal <= 60) unitPrice = 16.0;
    else if (mgVal <= 125) unitPrice = 5.0;
    else if (mgVal <= 250) unitPrice = 6.0;
    else if (mgVal <= 500) unitPrice = 8.0;
    else unitPrice = Number((mgVal * 0.02).toFixed(2));
    unitsPerStrip = 10;
    packSize = '2 × 5 (10 Suppositories)';
  } else if (fShort === 'Inhaler') {
    const mcgVal = targetNum || 100;
    if (mcgVal <= 100) unitPrice = 250.0;
    else if (mcgVal <= 200) unitPrice = 320.0;
    else unitPrice = 380.0;
    unitsPerStrip = 1;
    packSize = '1 × 1 (200 Metered Doses Inhaler)';
  } else if (fShort === 'Sachet') {
    if (sLower.includes('4 billion') || sLower.includes('1 g')) {
      unitPrice = 22.0;
      unitsPerStrip = 20;
      packSize = '1 × 20 (20 Sachets Box)';
    } else if (sLower.includes('10.25') || sLower.includes('500 ml')) {
      unitPrice = 6.0;
      unitsPerStrip = 20;
      packSize = '1 × 20 (20 Sachets Box)';
    } else if (sLower.includes('20.5') || sLower.includes('1000 ml')) {
      unitPrice = 10.0;
      unitsPerStrip = 10;
      packSize = '1 × 10 (10 Sachets Box)';
    } else {
      const mgVal = targetNum || 20;
      if (mgVal <= 5) unitPrice = 12.0;
      else if (mgVal <= 10) unitPrice = 8.0;
      else if (mgVal <= 20) unitPrice = 10.0;
      else unitPrice = 15.0;
      unitsPerStrip = 10;
      packSize = '1 × 10 (10 Sachets Box)';
    }
  } else if (fShort === 'Eye Drop') {
    const mlMatch = sLower.match(/(\d+)\s*ml/);
    const mlVol = mlMatch ? parseInt(mlMatch[1], 10) : targetNum || 5;
    if (sLower.includes('0.5%')) unitPrice = 100.0;
    else if (sLower.includes('0.3%')) unitPrice = 40.0;
    else if (mlVol >= 10) unitPrice = 120.0;
    else unitPrice = 85.0;
    unitsPerStrip = 1;
    packSize = `1 × 1 (${mlVol} ml Sterile Eye Drop)`;
  } else if (fShort === 'Ear Drop') {
    const mlMatch = sLower.match(/(\d+)\s*ml/);
    const mlVol = mlMatch ? parseInt(mlMatch[1], 10) : targetNum || 5;
    if (sLower.includes('0.3% + 0.1%')) unitPrice = 75.0;
    else if (mlVol >= 10) unitPrice = 60.0;
    else unitPrice = 40.0;
    unitsPerStrip = 1;
    packSize = `1 × 1 (${mlVol} ml Ear Drop)`;
  } else if (fShort === 'Nasal Drop') {
    const mlMatch = sLower.match(/(\d+)\s*ml/);
    const mlVol = mlMatch ? parseInt(mlMatch[1], 10) : targetNum || 15;
    if (sLower.includes('spray') || sLower.includes('mcg')) unitPrice = 250.0;
    else if (sLower.includes('0.05%') && sLower.includes('paed')) unitPrice = 20.0;
    else if (sLower.includes('0.025%')) unitPrice = 35.0;
    else unitPrice = 26.0;
    unitsPerStrip = 1;
    packSize = `1 × 1 (${mlVol} ml Nasal Drop)`;
  } else if (fShort === 'Drops') {
    const mlMatch = sLower.match(/(\d+)\s*ml/);
    const mlVol = mlMatch ? parseInt(mlMatch[1], 10) : targetNum || 15;
    if (mlVol <= 5) unitPrice = 45.0;
    else if (mlVol <= 10) unitPrice = 32.0;
    else if (mlVol <= 15) unitPrice = 30.0;
    else unitPrice = 65.0;
    unitsPerStrip = 1;
    packSize = `1 × 1 (${mlVol} ml Drops)`;
  } else if (fShort === 'Inj') {
    const mgVal = targetNum || 40;
    if (sLower.includes('iu/ml') || sLower.includes('flexpen')) unitPrice = 750.0;
    else if (mgVal <= 40) unitPrice = 90.0;
    else if (mgVal <= 100) unitPrice = 75.0;
    else if (mgVal <= 250) unitPrice = 110.0;
    else if (mgVal <= 500) unitPrice = 150.0;
    else unitPrice = 220.0;
    unitsPerStrip = 1;
    packSize = '1 × 1 (1 Vial/Ampoule)';
  } else if (fShort === 'Gel/Cream') {
    const gVal = targetNum || 15;
    if (gVal <= 10) unitPrice = 45.0;
    else if (gVal <= 15) unitPrice = 55.0;
    else if (gVal <= 30) unitPrice = 65.0;
    else unitPrice = 100.0;
    unitsPerStrip = 1;
    packSize = `1 × 1 (${gVal} g/ml Tube)`;
  } else {
    // Tablet or Capsule: scale proportionally by mg ratio
    if (targetNum > 0 && refNum > 0 && targetNum !== refNum) {
      const ratio = targetNum / refNum;
      if (ratio >= 1.8) {
        unitPrice = Number((refBasePrice * Math.min(2.4, 0.72 * ratio)).toFixed(2));
      } else if (ratio > 1.0) {
        unitPrice = Number((refBasePrice * (1 + (ratio - 1) * 0.8)).toFixed(2));
      } else {
        unitPrice = Number(Math.max(0.75, refBasePrice * Math.max(0.45, ratio * 0.88)).toFixed(2));
      }
    } else {
      unitPrice = Number(refBasePrice.toFixed(2));
    }
    unitsPerStrip = refMed && refMed.unitsPerStrip > 1 ? refMed.unitsPerStrip : 10;
    packSize = refMed && refMed.unitsPerStrip > 1 ? refMed.packSize : '10 × 10 (100 pcs)';
  }

  const stripPrice = Number((unitPrice * unitsPerStrip).toFixed(2));
  const purchasePrice = Number((unitPrice * 0.88).toFixed(2));

  return {
    unitPrice,
    stripPrice,
    purchasePrice,
    packSize,
    unitsPerStrip,
  };
}

/**
 * Normalizes Bangladeshi pharmacy search queries so common shorthand and Bangla terms like
 * "সিরাপ", "ট্যাবলেট", "স্যাচেট", "ড্রপ", "আই ড্রপ", "ইয়ার ড্রপ", "সাপোজিটর", "ইনহেলার",
 * "entacid+", "lorix+", "ximeclav", "eyedrop", "eardrop", "nasaldrop", "syp", "cap", "tab", "supp", "inhelar", "sacet"
 * seamlessly match "Syrup", "Tablet", "Sachet", "Drops", "Eye Drop", "Ear Drop", "Suppository", "Inhaler", etc.
 */
export function normalizePharmaSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/আই\s*ড্রপ|চোখের\s*ড্রপ/g, 'eyedrop')
    .replace(/ইয়ার\s*ড্রপ|ইয়ার\s*ড্রপ|কানের\s*ড্রপ/g, 'eardrop')
    .replace(/নাজাল\s*ড্রপ|নাকের\s*ড্রপ/g, 'nasaldrop')
    .replace(/সিরাপ/g, 'syrup')
    .replace(/ট্যাবলেট/g, 'tablet')
    .replace(/ক্যাপসুল/g, 'capsule')
    .replace(/সাসপেনশন/g, 'suspension')
    .replace(/স্যাচেট|স্যাশে/g, 'sachet')
    .replace(/সাপোজিটরি|সাপোজিটর/g, 'suppository')
    .replace(/ইনহেলার/g, 'inhaler')
    .replace(/ইনজেকশন/g, 'injection')
    .replace(/ড্রপস|ড্রপ/g, 'drops')
    .replace(/জেল|ক্রিম|মলম/g, 'gel')
    .replace(/femicom|femikon|famicon|famicom/g, 'femicon')
    .replace(/ovastat|ovostet|ovastet/g, 'ovostat')
    .replace(/marvilon|mervelon|marbelon/g, 'marvelon')
    .replace(/microlan|mikrolon/g, 'microlon')
    .replace(/minikon|minicom/g, 'minicon')
    .replace(/noret\s*-?\s*28/g, 'noret')
    .replace(/normans|normen\b/g, 'normens')
    .replace(/aristomam|aristomum/g, 'aristomom')
    .replace(/dufaston/g, 'duphaston')
    .replace(/entacid/g, 'entacyd')
    .replace(/cyd/g, 'cid')
    .replace(/ynta/g, 'inta')
    .replace(/ximecalv|ximiclav|xemiclav/g, 'ximeclav')
    .replace(/eyedrops?/g, 'eyedrop')
    .replace(/eardrops?/g, 'eardrop')
    .replace(/nasaldrops?/g, 'nasaldrop')
    .replace(/\bsyp\b/g, 'syrup')
    .replace(/\bcap\b/g, 'capsule')
    .replace(/\btab\b/g, 'tablet')
    .replace(/\bsupp\b/g, 'suppository')
    .replace(/\bsusp\b/g, 'suspension')
    .replace(/\binhelar\b/g, 'inhaler')
    .replace(/\bsacet\b/g, 'sachet')
    .replace(/\binj\b/g, 'injection')
    .replace(/[^a-z0-9\u0980-\u09ff]/g, '');
}

export function getMedicineSearchMatchScore(m: MedicineCatalogItem, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 1;

  const bLow = m.brandName.toLowerCase();

  // FAST PATH 1: Exact brand name match (0ms execution, no regex)
  if (bLow === q) {
    return 1000;
  }

  // FAST PATH 2: Brand name starts with query (e.g. "Napa", "Seclo", "Otogen")
  if (bLow.startsWith(q)) {
    return 800;
  }

  // FAST PATH 3: Brand contains query or starts with brand+strength
  const brandAndStrength = `${bLow} ${m.strength.toLowerCase()}`;
  if (bLow.includes(q) || brandAndStrength.startsWith(q)) {
    return 600;
  }

  // FAST PATH 4: Generic name starts with or contains query
  const gLow = m.genericName.toLowerCase();
  if (gLow.startsWith(q)) return 350;
  if (gLow.includes(q)) return 250;

  // FAST PATH 5: Dosage form direct check
  const dLow = m.dosageForm.toLowerCase();
  if (dLow === q) return 500;

  // Normalized phonetic fallback for misspellings / Bengali inputs
  const normQ = normalizePharmaSearchText(q);
  if (!normQ) return 0;

  const normBrand = normalizePharmaSearchText(m.brandName);
  const normForm = normalizePharmaSearchText(m.dosageForm);
  const brandAndFormNorm = normalizePharmaSearchText(`${m.brandName} ${m.dosageForm}`);

  // Tier 0: Exact brand + dosage form match (e.g. "Napa Syrup", "Napa সিরাপ", "Seclo Sachet")
  if (brandAndFormNorm === normQ) {
    return 1200;
  }

  if (normBrand === normQ) {
    return 1000;
  }

  if (normForm === normQ) {
    return 900;
  }

  if (normBrand.startsWith(normQ)) {
    return 800;
  }

  if (normalizePharmaSearchText(brandAndStrength).startsWith(normQ)) {
    return 600;
  }

  const compositeText = `${m.brandName} ${m.strength} ${m.dosageForm} ${shortForm} ${m.genericName} ${m.companyName}`.toLowerCase();
  const normComposite = normalizePharmaSearchText(compositeText);

  // Check multi-token match
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every((tok) => {
      const normTok = normalizePharmaSearchText(tok);
      return (
        compositeText.includes(tok) ||
        (normTok.length > 0 && normComposite.includes(normTok))
      );
    });
    if (allTokensMatch) {
      const firstNorm = normalizePharmaSearchText(tokens[0]);
      const hasFormMatch = tokens.some((tok) => {
        const nt = normalizePharmaSearchText(tok);
        return nt.length > 0 && (normForm === nt || normForm.includes(nt));
      });
      if (bLow.startsWith(tokens[0]) || (firstNorm.length > 0 && normBrand.startsWith(firstNorm))) {
        return hasFormMatch ? 950 : 700;
      }
      return hasFormMatch ? 650 : 450;
    }
  }

  // Tier 4: Generic name starts with or contains query
  // Tier 4: Generic name starts with or contains query
const genericLower = m.genericName.toLowerCase();
if (genericLower.startsWith(q)) return 350;
if (genericLower.includes(q)) return 250;

  // Tier 5: Company, indication, or therapeutic class match
  if (
    compositeText.includes(q) ||
    m.indication.toLowerCase().includes(q) ||
    m.therapeuticClass.toLowerCase().includes(q)
  ) {
    return 100;
  }

  if (
    normQ.length > 0 &&
    (normComposite.includes(normQ) ||
      normalizePharmaSearchText(m.therapeuticClass).includes(normQ))
  ) {
    return 80;
  }

  return 0;
}

export function matchesMedicineQuery(m: MedicineCatalogItem, rawQuery: string): boolean {
  return getMedicineSearchMatchScore(m, rawQuery) > 0;
}

const FORM_SEARCH_KEYWORDS: { norm: string; form: MedicineCatalogItem['dosageForm']; short: string }[] = [
  { norm: 'eyedrop', form: 'Eye Drop', short: 'Eye Drop' },
  { norm: 'eardrop', form: 'Ear Drop', short: 'Ear Drop' },
  { norm: 'nasaldrop', form: 'Nasal Drop', short: 'Nasal Drop' },
  { norm: 'suppository', form: 'Suppository', short: 'Supp' },
  { norm: 'suspension', form: 'Suspension', short: 'Susp' },
  { norm: 'syrup', form: 'Syrup', short: 'Syp' },
  { norm: 'sachet', form: 'Sachet', short: 'Sachet' },
  { norm: 'inhaler', form: 'Inhaler', short: 'Inhaler' },
  { norm: 'drops', form: 'Drops', short: 'Drops' },
  { norm: 'injection', form: 'Injection', short: 'Inj' },
  { norm: 'capsule', form: 'Capsule', short: 'Cap' },
  { norm: 'tablet', form: 'Tablet', short: 'Tab' },
  { norm: 'gel', form: 'Gel', short: 'Gel/Cream' },
];

export function searchAndRankMedicines(
  catalog: MedicineCatalogItem[],
  rawQuery: string,
  limit?: number
): MedicineCatalogItem[] {
  const q = rawQuery.trim();
  if (!q) {
    return typeof limit === 'number' ? catalog.slice(0, limit) : catalog;
  }

  const scored: { item: MedicineCatalogItem; score: number; idx: number }[] = [];
  for (let i = 0; i < catalog.length; i++) {
    const m = catalog[i];
    const score = getMedicineSearchMatchScore(m, q);
    if (score > 0) {
      scored.push({ item: m, score, idx: i });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.idx - b.idx;
  });

  const ranked = scored.map((s) => s.item);

  // If query specifies a dosage form (e.g. "Napa Syrup", "Zox Sachet", "Femicom Syrup", "Monas Inhaler")
  // ensure the top matched brand has that exact dosage form variant at the top of results
  const normQ = normalizePharmaSearchText(q);
  const matchedFormMeta = FORM_SEARCH_KEYWORDS.find(
    (fk) => normQ.includes(fk.norm) && normQ.length > fk.norm.length
  );
  if (matchedFormMeta) {
    const brandPartNorm = normQ.replace(matchedFormMeta.norm, '').trim();
    if (brandPartNorm.length >= 2) {
      const baseBrandMed =
        ranked.find((m) => normalizePharmaSearchText(m.brandName).startsWith(brandPartNorm)) ||
        catalog.find((m) => normalizePharmaSearchText(m.brandName).startsWith(brandPartNorm));
      if (baseBrandMed) {
        const hasExactTop = ranked
          .slice(0, 5)
          .some(
            (m) =>
              normalizePharmaSearchText(m.brandName) ===
                normalizePharmaSearchText(baseBrandMed.brandName) &&
              getShortDosageForm(m.dosageForm) === matchedFormMeta.short
          );
        if (!hasExactTop) {
          const allVars = getBrandFormAndStrengthVariants(
            catalog,
            baseBrandMed.brandName,
            baseBrandMed.genericName
          );
          const formVars = allVars.filter(
            (v) => getShortDosageForm(v.dosageForm) === matchedFormMeta.short
          );
          if (formVars.length > 0) {
            const existingIds = new Set(formVars.map((fv) => fv.id));
            const rest = ranked.filter((r) => !existingIds.has(r.id));
            const combined = [...formVars, ...rest];
            return typeof limit === 'number' ? combined.slice(0, limit) : combined;
          }
        }
      }
    }
  }

  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
}

/**
 * Filters catalog medicines by selected Company, Generic, Dosage Form, and First Letter.
 * Returns authentic medicines matching the criteria without injecting fake dosage forms.
 */
export function getCompleteCompanyGenericItems(params: {
  catalog: MedicineCatalogItem[];
  selectedCompany?: string;
  selectedGeneric?: string;
  selectedDosageForm?: string;
  selectedLetter?: string;
}): MedicineCatalogItem[] {
  const {
    catalog = [],
    selectedCompany = 'ALL',
    selectedGeneric = 'ALL',
    selectedDosageForm = 'ALL',
    selectedLetter = 'ALL',
  } = params || {};
  const letter = !selectedLetter || selectedLetter === 'ALL' ? '' : selectedLetter.toLowerCase();
  const targetShortForm =
    !selectedDosageForm || selectedDosageForm === 'ALL' ? 'ALL' : getShortDosageForm(selectedDosageForm);

  return catalog.filter((m) => {
    if (selectedCompany !== 'ALL' && m.companyName !== selectedCompany) return false;
    if (selectedGeneric !== 'ALL' && m.genericName !== selectedGeneric) return false;
    if (letter && !m.brandName.toLowerCase().startsWith(letter)) return false;
    if (targetShortForm !== 'ALL' && getShortDosageForm(m.dosageForm) !== targetShortForm) return false;
    return true;
  });
}

export function getInvoiceFormPrefix(form: string): string {
  const short = getShortDosageForm(form).toLowerCase();
  if (short === 'gel/cream') return 'gel';
  if (short === 'surgical' || short === 'custom' || short === 'other') return 'item';
  return short || 'tab';
}

export function formatCleanMoney(val: number): string {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0';
  return String(Number(num.toFixed(2)));
}

export function formatCartItemInvoiceLine(
  item: {
    brandName: string;
    strength: string;
    dosageForm: string;
    unitPrice: number;
    qty: number;
    updateStock?: boolean;
  },
  index: number
): string {
  const prefix = getInvoiceFormPrefix(item.dosageForm);
  const unitStr = formatCleanMoney(item.unitPrice);
  const totalStr = formatCleanMoney(item.unitPrice * item.qty);
  const cleanBrand = (item.brandName || 'Custom Product').trim();
  const cleanStrength =
    item.strength && item.strength.trim() !== 'Standard' ? item.strength.trim() : '';
  const nameAndStrength = cleanStrength ? `${cleanBrand} ${cleanStrength}` : cleanBrand;
  const stockTag = item.updateStock === false ? ' [নন-স্টক/শুধু-বিল]' : '';
  return `${index + 1}.${prefix}.${nameAndStrength} (৳${unitStr}) × ${item.qty}=${totalStr}${stockTag}`;
}

export function formatPurchaseItemInvoiceLine(
  item: {
    brandName: string;
    strength: string;
    dosageForm: string;
    purchasePrice: number;
    qty: number;
    updateStock?: boolean;
    packUnit?: string;
    packCount?: number;
    packRate?: number;
    unitsPerPack?: number;
    packDetailFormula?: string;
  },
  index: number
): string {
  const prefix = getInvoiceFormPrefix(item.dosageForm);
  const isPack = Boolean(
    item.packUnit &&
    item.packUnit !== 'piece' &&
    item.packCount &&
    item.packCount > 0 &&
    item.packRate &&
    item.packRate > 0
  );
  const exactLineTotal = isPack
    ? Number((item.packRate! * item.packCount!).toFixed(2))
    : Number((item.purchasePrice * item.qty).toFixed(2));
  const unitStr = formatCleanMoney(item.purchasePrice);
  const totalStr = formatCleanMoney(exactLineTotal);
  const cleanBrand = (item.brandName || 'Custom Product').trim();
  const cleanStrength =
    item.strength && item.strength.trim() !== 'Standard' ? item.strength.trim() : '';
  const nameAndStrength = cleanStrength ? `${cleanBrand} ${cleanStrength}` : cleanBrand;
  const stockTag = item.updateStock === false ? ' [নন-স্টক/শুধু-বিল]' : '';

  let packDetail = '';
  if (item.packUnit && item.packUnit !== 'piece' && item.packCount && item.packCount > 0) {
    const unitLabel = item.packUnit === 'strip' ? 'পাতা' : item.packUnit === 'box' ? 'বক্স' : 'কার্টুন';
    const rateTag = item.packRate && item.packRate > 0 ? ` @৳${formatCleanMoney(item.packRate)}/দর` : '';
    const formulaStr = item.packDetailFormula
      ? ` (${item.packDetailFormula})`
      : item.packUnit === 'strip'
      ? ` (১*${item.unitsPerPack || 10})`
      : item.packUnit === 'box'
      ? ` (${item.unitsPerPack || 510} পিস)`
      : ` (১*${item.unitsPerPack || 48})`;
    packDetail = ` [${item.packCount} ${unitLabel}${formulaStr}${rateTag}]`;
  } else if (item.packUnit === 'piece' && item.packCount) {
    packDetail = ` [${item.qty} পিস]`;
  }

  return `${index + 1}.${prefix}.${nameAndStrength}${packDetail} (৳${unitStr}) × ${item.qty}=${totalStr}${stockTag}`;
}

export interface ParsedInvoiceItem {
  serial: number;
  formPrefix: string;
  brandAndStrength: string;
  cleanName?: string;
  packDetail?: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  tailText: string;
  formattedLine: string;
  rawLine: string;
  matchedMedicine?: MedicineCatalogItem;
}

function findCatalogMedicineByText(
  rawNameAndStrength: string,
  catalog: MedicineCatalogItem[] = CURATED_BD_MEDICINES
): MedicineCatalogItem | undefined {
  const source = catalog.length > 0 ? catalog : CURATED_BD_MEDICINES;
  const cleaned = rawNameAndStrength.trim().toLowerCase();
  const compact = cleaned.replace(/\s+/g, '');

  // 1. Exact match on brandName + strength
  const exact = source.find((m) => {
    const full = `${m.brandName} ${m.strength}`.toLowerCase();
    return full === cleaned || full.replace(/\s+/g, '') === compact;
  });
  if (exact) return exact;

  // 2. Match longest brandName prefix
  let bestMatch: MedicineCatalogItem | undefined;
  let bestLen = 0;
  for (const m of source) {
    const bLower = m.brandName.toLowerCase();
    if (cleaned === bLower || cleaned.startsWith(`${bLower} `)) {
      if (bLower.length > bestLen) {
        bestLen = bLower.length;
        bestMatch = m;
      } else if (
        bLower.length === bestLen &&
        bestMatch &&
        cleaned.replace(/\s+/g, '').includes(m.strength.toLowerCase().replace(/\s+/g, ''))
      ) {
        bestMatch = m;
      }
    }
  }
  return bestMatch;
}

export function formatTransactionItemsList(
  itemsSummary: string,
  catalog: MedicineCatalogItem[] = CURATED_BD_MEDICINES
): string[] {
  const raw = (itemsSummary || '').trim();
  if (!raw) return [];

  const rawLines = raw.includes('\n')
    ? raw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : raw
        .split(/,\s*(?=(?:\d+\.)?[A-Za-z\u0980-\u09FF])/)
        .map((s) => s.trim())
        .filter(Boolean);

  return rawLines.map((part, idx) => {
    // Already formatted: 1.cap.Seclo 20 mg (৳6) × 10=60
    const fullMatch = part.match(
      /^(\d+)\.([a-z\s/]+)\.(.+?)\s*\(৳([\d.]+)\)\s*[×x*]\s*(\d+)\s*=\s*([\d.]+)(.*)$/i
    );
    if (fullMatch) {
      const prefix = fullMatch[2].trim().toLowerCase();
      const nameStr = fullMatch[3].trim();
      const unitStr = formatCleanMoney(parseFloat(fullMatch[4]));
      const qtyNum = parseInt(fullMatch[5], 10) || 1;
      const totalStr = formatCleanMoney(parseFloat(fullMatch[6]));
      const tail = fullMatch[7] || '';
      return `${idx + 1}.${prefix}.${nameStr} (৳${unitStr}) × ${qtyNum}=${totalStr}${tail}`;
    }

    // Has price & qty: Seclo 20 mg (৳6) × 10 [optional =60]
    const priceQtyMatch = part.match(
      /^(?:(\d+)\.\s*)?(?:([a-z\s/]+)\.\s*)?(.+?)\s*\(৳([\d.]+)\)\s*[×x*]\s*(\d+)(?:\s*=\s*([\d.]+))?(.*)$/i
    );
    if (priceQtyMatch) {
      const explicitPrefix = priceQtyMatch[2]?.trim().toLowerCase();
      const nameStr = priceQtyMatch[3].trim();
      const unitNum = parseFloat(priceQtyMatch[4]) || 0;
      const qtyNum = parseInt(priceQtyMatch[5], 10) || 1;
      const totalNum = priceQtyMatch[6] ? parseFloat(priceQtyMatch[6]) : unitNum * qtyNum;
      const tail = priceQtyMatch[7] || '';
      const matchedMed = findCatalogMedicineByText(nameStr, catalog);
      const prefix = explicitPrefix || (matchedMed ? getInvoiceFormPrefix(matchedMed.dosageForm) : 'tab');
      return `${idx + 1}.${prefix}.${nameStr} (৳${formatCleanMoney(unitNum)}) × ${qtyNum}=${formatCleanMoney(totalNum)}${tail}`;
    }

    // Legacy without unit price: Seclo 20mg × 20 [pcs]
    const legacyQtyMatch = part.match(
      /^(?:(\d+)\.\s*)?(?:([a-z\s/]+)\.\s*)?(.+?)\s*[×x*]\s*(\d+)(?:\s*pcs)?(.*)$/i
    );
    if (legacyQtyMatch) {
      const explicitPrefix = legacyQtyMatch[2]?.trim().toLowerCase();
      const nameStr = legacyQtyMatch[3].trim();
      const qtyNum = parseInt(legacyQtyMatch[4], 10) || 1;
      const tail = legacyQtyMatch[5] || '';
      const matchedMed = findCatalogMedicineByText(nameStr, catalog);
      if (matchedMed) {
        const prefix = explicitPrefix || getInvoiceFormPrefix(matchedMed.dosageForm);
        const unitNum = matchedMed.unitPrice;
        const displayName = `${matchedMed.brandName} ${matchedMed.strength}`;
        return `${idx + 1}.${prefix}.${displayName} (৳${formatCleanMoney(unitNum)}) × ${qtyNum}=${formatCleanMoney(unitNum * qtyNum)}${tail}`;
      }
    }

    return part;
  });
}

export function parseTransactionItemsDetailed(
  itemsSummary: string,
  catalog: MedicineCatalogItem[] = CURATED_BD_MEDICINES
): ParsedInvoiceItem[] {
  const formattedLines = formatTransactionItemsList(itemsSummary, catalog);
  return formattedLines.map((line, idx) => {
    const match = line.match(
      /^(\d+)\.([a-z\s/]+)\.(.+?)\s*\(৳([\d.]+)\)\s*[×x*]\s*(\d+)\s*=\s*([\d.]+)(.*)$/i
    );
    if (match) {
      const serial = parseInt(match[1], 10) || idx + 1;
      const formPrefix = match[2].trim().toLowerCase();
      const brandAndStrength = match[3].trim();
      let cleanBrandAndStrength = brandAndStrength;
      let packDetail = '';
      const packMatch = brandAndStrength.match(/^(.*?)\s*\[(.*?)\]$/);
      if (packMatch) {
        cleanBrandAndStrength = packMatch[1].trim();
        packDetail = packMatch[2].trim();
      }
      const unitPrice = parseFloat(match[4]) || 0;
      const qty = parseInt(match[5], 10) || 1;
      const lineTotal = parseFloat(match[6]) || Number((unitPrice * qty).toFixed(2));
      const tailText = (match[7] || '').trim();
      const matchedMedicine = findCatalogMedicineByText(cleanBrandAndStrength, catalog);
      return {
        serial,
        formPrefix,
        brandAndStrength,
        cleanName: cleanBrandAndStrength,
        packDetail,
        unitPrice,
        qty,
        lineTotal,
        tailText,
        formattedLine: line,
        rawLine: line,
        matchedMedicine,
      };
    }
    return {
      serial: idx + 1,
      formPrefix: 'item',
      brandAndStrength: line,
      unitPrice: 0,
      qty: 1,
      lineTotal: 0,
      tailText: '',
      formattedLine: line,
      rawLine: line,
    };
  });
}

export function findMatchingInventoryRecord<
  T extends {
    id: string;
    medicineId: string;
    brandName: string;
    strength: string;
    dosageForm: string;
  }
>(
  inventory: T[],
  target: {
    inventoryId?: string;
    medicineId?: string;
    brandName: string;
    strength: string;
    dosageForm?: string;
  }
): T | undefined {
  if (target.inventoryId) {
    const byId = inventory.find((i) => i.id === target.inventoryId);
    if (byId) return byId;
  }
  if (target.medicineId) {
    const byMedId = inventory.find((i) => i.medicineId === target.medicineId);
    if (byMedId) return byMedId;
  }
  const bLower = target.brandName.trim().toLowerCase();
  const sLower = target.strength.trim().toLowerCase();
  if (target.dosageForm) {
    const fShort = getShortDosageForm(target.dosageForm);
    const byFull = inventory.find(
      (i) =>
        i.brandName.trim().toLowerCase() === bLower &&
        i.strength.trim().toLowerCase() === sLower &&
        getShortDosageForm(i.dosageForm) === fShort
    );
    if (byFull) return byFull;
  }
  return inventory.find(
    (i) =>
      i.brandName.trim().toLowerCase() === bLower &&
      i.strength.trim().toLowerCase() === sLower
  );
}

export function getInventoryStockForMedicine(
  inventory: {
    id: string;
    medicineId: string;
    brandName: string;
    strength: string;
    dosageForm: string;
    stockQty: number;
  }[],
  med: {
    id: string;
    brandName: string;
    strength: string;
    dosageForm: string;
  }
): number {
  const bLower = med.brandName.trim().toLowerCase();
  const sLower = med.strength.trim().toLowerCase();
  const fShort = getShortDosageForm(med.dosageForm);
  let total = 0;
  for (const item of inventory) {
    if (
      item.medicineId === med.id ||
      (item.brandName.trim().toLowerCase() === bLower &&
        item.strength.trim().toLowerCase() === sLower &&
        getShortDosageForm(item.dosageForm) === fShort)
    ) {
      total += item.stockQty;
    }
  }
  return total;
}

export function formatTransactionItemsText(
  itemsSummary: string,
  catalog: MedicineCatalogItem[] = CURATED_BD_MEDICINES
): string {
  const lines = formatTransactionItemsList(itemsSummary, catalog);
  return lines.length > 0 ? lines.join('\n') : itemsSummary;
}

export function dosageFormFromInvoicePrefix(prefix: string): string {
  const p = prefix.trim().toLowerCase();
  if (p === 'cap') return 'Capsule';
  if (p === 'syp') return 'Syrup';
  if (p === 'susp') return 'Suspension';
  if (p === 'supp') return 'Suppository';
  if (p === 'inhaler') return 'Inhaler';
  if (p === 'sachet') return 'Sachet';
  if (p === 'eye drop') return 'Eye Drop';
  if (p === 'ear drop') return 'Ear Drop';
  if (p === 'nasal drop') return 'Nasal Drop';
  if (p === 'drops') return 'Drops';
  if (p === 'inj') return 'Injection';
  if (p === 'gel' || p === 'gel/cream') return 'Gel';
  return 'Tablet';
}

function splitBrandAndStrengthText(rawText: string): { brandName: string; strength: string } {
  const cleaned = rawText.trim();
  const match = cleaned.match(/^(.+?)\s+(\d+[\d.\s+%a-zA-Z/()-]*)$/);
  if (match) {
    return {
      brandName: match[1].trim(),
      strength: match[2].trim(),
    };
  }
  return {
    brandName: cleaned || 'Medicine',
    strength: '',
  };
}

export function buildSaleCartFromTransaction(
  tx: Transaction,
  catalog: MedicineCatalogItem[],
  inventory: InventoryItem[]
): CartItem[] {
  const parsed = parseTransactionItemsDetailed(tx.itemsSummary, catalog);

  return parsed.map((pItem, idx) => {
    const med = pItem.matchedMedicine;
    const split = splitBrandAndStrengthText(pItem.brandAndStrength);
    const brandName = med ? med.brandName : split.brandName;
    const strength = med ? med.strength : split.strength;
    const dosageForm = med ? med.dosageForm : dosageFormFromInvoicePrefix(pItem.formPrefix);

    const invMatch = findMatchingInventoryRecord(inventory, {
      medicineId: med?.id,
      brandName,
      strength,
      dosageForm,
    });

    const medicineId = med?.id
      ? `${med.id}__edit_${idx}`
      : invMatch?.medicineId
      ? `${invMatch.medicineId}__edit_${idx}`
      : `custom-sale-${idx}-${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const baseCatalogPrice = invMatch ? invMatch.unitPrice : med ? med.unitPrice : pItem.unitPrice || 10;
    const unitPrice = pItem.unitPrice > 0 ? pItem.unitPrice : baseCatalogPrice;
    const basePurPrice = invMatch
      ? invMatch.purchasePrice
      : med && typeof med.purchasePrice === 'number' && med.purchasePrice > 0
      ? med.purchasePrice
      : Number((unitPrice * 0.88).toFixed(2));

    const currentStock = med
      ? getInventoryStockForMedicine(inventory, med)
      : invMatch
      ? invMatch.stockQty
      : 100;

    return {
      medicineId,
      inventoryId: invMatch?.id,
      brandName,
      genericName: med?.genericName || invMatch?.genericName || brandName,
      companyName: med?.companyName || invMatch?.companyName || 'Pharmaceuticals',
      strength,
      dosageForm,
      unitPrice,
      originalUnitPrice: baseCatalogPrice,
      purchasePrice: basePurPrice,
      originalPurchasePrice: basePurPrice,
      qty: Math.max(1, pItem.qty || 1),
      availableStock: currentStock > 0 ? currentStock : 100,
      updateStock: !pItem.tailText?.includes('নন-স্টক'),
    };
  });
}

export function buildPurchaseCartFromTransaction(
  tx: Transaction,
  catalog: MedicineCatalogItem[],
  inventory: InventoryItem[]
): PurchaseCartItem[] {
  const parsed = parseTransactionItemsDetailed(tx.itemsSummary, catalog);

  const items: PurchaseCartItem[] = parsed.map((pItem, idx) => {
    const med = pItem.matchedMedicine;
    const split = splitBrandAndStrengthText(pItem.brandAndStrength);
    const brandName = med ? med.brandName : split.brandName;
    const strength = med ? med.strength : split.strength;
    const dosageForm = med ? med.dosageForm : dosageFormFromInvoicePrefix(pItem.formPrefix);

    const invMatch = findMatchingInventoryRecord(inventory, {
      medicineId: med?.id,
      brandName,
      strength,
      dosageForm,
    });

    const medicineId = med?.id
      ? `${med.id}__edit_${idx}`
      : invMatch?.medicineId
      ? `${invMatch.medicineId}__edit_${idx}`
      : `custom-pur-${idx}-${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const isStrip = Boolean(pItem.packDetail?.includes('পাতা'));
    const isBox = Boolean(pItem.packDetail?.includes('বক্স'));
    const isCartoon = Boolean(pItem.packDetail?.includes('কার্টুন'));
    const packUnit: PurchasePackUnit = isStrip ? 'strip' : isBox ? 'box' : isCartoon ? 'cartoon' : 'piece';

    const countMatch = (pItem.packDetail || '').match(/(\d+)\s*(?:পাতা|বক্স|কার্টুন|পিস)?/);
    const packCount = countMatch ? Math.max(1, parseInt(countMatch[1], 10)) : 1;

    const formulaMatch = (pItem.packDetail || '').match(/\(([^)]+)\)/);
    let packDetailFormula = formulaMatch ? formulaMatch[1].trim() : '';
    if (!packDetailFormula) {
      packDetailFormula = packUnit === 'strip' ? '1*10' : packUnit === 'box' ? '1*10*10' : packUnit === 'cartoon' ? '1*48' : '১ পিস';
    }

    let unitsPerPack = 10;
    let stripsPerBox = 10;
    let pcsPerStrip = 10;

    if (packUnit === 'piece') {
      unitsPerPack = 1;
    } else if (packUnit === 'strip') {
      const parts = packDetailFormula.split('*').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
      unitsPerPack = parts.length >= 2 ? parts[0] * parts[1] : parts[0] || (med?.unitsPerStrip || 10);
      pcsPerStrip = unitsPerPack;
    } else if (packUnit === 'box') {
      const parts = packDetailFormula.split('*').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
      if (parts.length >= 3) {
        pcsPerStrip = parts[1];
        stripsPerBox = parts[2];
        unitsPerPack = parts[0] * parts[1] * parts[2];
      } else if (parts.length >= 2) {
        unitsPerPack = parts[0] * parts[1];
        stripsPerBox = parts[1];
      } else {
        unitsPerPack = 100;
        stripsPerBox = 10;
        pcsPerStrip = 10;
      }
    } else if (packUnit === 'cartoon') {
      const parts = packDetailFormula.split('*').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
      unitsPerPack = parts.length >= 2 ? parts[0] * parts[1] : parts[0] || 48;
    }

    const rateMatch = (pItem.packDetail || '').match(/@৳([\d.]+)\/দর/);
    let packRate = rateMatch ? parseFloat(rateMatch[1]) : 0;
    if ((!packRate || packRate <= 0) && packUnit !== 'piece' && pItem.lineTotal > 0 && packCount > 0) {
      packRate = Number((pItem.lineTotal / packCount).toFixed(2));
    }

    let purchasePrice = pItem.unitPrice;
    if ((!purchasePrice || purchasePrice <= 0) && packRate > 0 && unitsPerPack > 0) {
      purchasePrice = Number((packRate / unitsPerPack).toFixed(4));
    }
    if ((!purchasePrice || purchasePrice <= 0) && pItem.lineTotal > 0 && pItem.qty > 0) {
      purchasePrice = Number((pItem.lineTotal / pItem.qty).toFixed(4));
    }
    if (!purchasePrice || purchasePrice <= 0) {
      purchasePrice = med?.purchasePrice || (med ? Number((med.unitPrice * 0.88).toFixed(2)) : 8.8);
    }
    if (!packRate && packUnit !== 'piece') {
      packRate = Number((purchasePrice * unitsPerPack).toFixed(2));
    }

    const retailMrp = invMatch
      ? invMatch.unitPrice
      : med
      ? med.unitPrice
      : purchasePrice > 0
      ? Number((purchasePrice / 0.88).toFixed(2))
      : 10;

    const currentStock = med
      ? getInventoryStockForMedicine(inventory, med)
      : invMatch
      ? invMatch.stockQty
      : 0;

    const totalQty = pItem.qty > 0 ? pItem.qty : packCount * unitsPerPack;

    return {
      medicineId,
      inventoryId: invMatch?.id,
      brandName,
      genericName: med?.genericName || invMatch?.genericName || brandName,
      companyName:
        med?.companyName ||
        invMatch?.companyName ||
        tx.partyName.replace(/\s*\(ডিপো চালান\)\s*$/, '').trim() ||
        'Pharmaceuticals',
      strength,
      dosageForm,
      packSize: med?.packSize || invMatch?.packSize || packDetailFormula || '10 × 10 (100 pcs)',
      purchasePrice,
      unitPrice: retailMrp,
      qty: Math.max(1, totalQty),
      batchNo: invMatch?.batchNo || `B-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: invMatch?.expiryDate || '2028-06-30',
      availableStock: currentStock,
      updateStock: !pItem.tailText?.includes('নন-স্টক'),
      packUnit,
      packCount,
      unitsPerPack,
      packRate,
      packDetailFormula,
      stripsPerBox,
      pcsPerStrip,
    };
  });

  // Always append a trailing blank box so user can enter the next row immediately
  const blankRow: PurchaseCartItem = {
    medicineId: `box_${Date.now()}_blank`,
    brandName: '',
    genericName: '',
    companyName: tx.partyName.replace(/\s*\(ডিপো চালান\)\s*$/, '').trim() || BD_PHARMA_COMPANIES[0],
    strength: '',
    dosageForm: 'Tablet',
    packSize: '1*10',
    purchasePrice: 0,
    unitPrice: 0,
    qty: 10,
    batchNo: `B-${Math.floor(1000 + Math.random() * 9000)}`,
    expiryDate: '2028-06-30',
    availableStock: 0,
    updateStock: true,
    packUnit: 'strip',
    packCount: 1,
    unitsPerPack: 10,
    packRate: 0,
    packDetailFormula: '1*10',
    stripsPerBox: 10,
    pcsPerStrip: 10,
  };

  return [...items, blankRow];
}


