import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Activity,
  CheckCircle2,
  Calendar,
  Send,
  MessageSquare,
  ChevronRight,
  PhoneCall,
  X,
  Smile,
  Layers,
  Search,
  ExternalLink,
  Check
} from 'lucide-react';

export interface DentalService {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  category: string;
  iconType: string;
  badgeColor: string;
  shortDesc: string;
  detailedDesc: string;
  symptoms: string[];
  procedureSteps: string[];
  benefits: string[];
  duration: string;
  careAdvice: string;
}

export const DENTAL_SERVICES_DATA: DentalService[] = [
  {
    id: 'checkup',
    number: 1,
    title: 'নিয়মিত দাঁতের পরীক্ষা ও পরামর্শ',
    subtitle: 'Regular Dental Checkup & Consultation',
    category: 'মৌলিক ও প্রতিরোধমূলক যত্ন',
    iconType: 'checkup',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shortDesc: 'মুখের স্বাস্থ্য সুরক্ষা ও প্রাথমিক অবস্থাতেই রোগ নির্ণয়ে বিশেষজ্ঞ ডেন্টিস্টের চেকআপ ও পরামর্শ।',
    detailedDesc: 'দাঁতের বড় ধরনের সমস্যা হওয়ার আগেই তা সনাক্ত করা সবচেয়ে বুদ্ধিমানের কাজ। নিয়মিত দাঁত ও মাড়ির পরীক্ষায় ক্ষুদ্রাতিক্ষুদ্র ক্ষয়, দাঁতের ফাঁকে খাবার আটকে থাকা, মাড়ির প্রাথমিক রক্তপাত এবং মুখের অভ্যন্তরীণ রোগের লক্ষণ সূক্ষ্মভাবে পরীক্ষা করা হয়।',
    symptoms: [
      'দাঁতে কোনো ব্যথা না থাকলেও প্রতি ৬ মাসে একবার পরীক্ষা',
      'মুখে দুর্গন্ধ বা দাঁতে সূক্ষ্ম কালচে ছোপ লক্ষ্য করলে',
      'ঠাণ্ডা বা গরম খাওয়ার পর হালকা শিরশির অনুভূতি',
      'মাড়িতে লালচে ভাব বা শক্ত খাবার খাওয়ার সময় অস্বস্তি'
    ],
    procedureSteps: [
      'মুখের সম্পূর্ণ দাঁত ও মাড়ির পুঙ্খানুপুঙ্খ ক্লিনিক্যাল পর্যবেক্ষণ',
      'প্রয়োজনীয় ডিজিটাল ডেন্টাল এক্স-রে স্ক্রিনিং',
      'সমস্যার মূল কারণ চিহ্নিতকরণ ও রোগীকে বিস্তারিত অবহিতকরণ',
      'চিকিৎসার সঠিক পরিকল্পনা ও প্রতিরোধমূলক জীবনযাত্রার পরামর্শ'
    ],
    benefits: [
      'ভবিষ্যতে জটিল ও ব্যয়বহুল চিকিৎসা থেকে রেহাই পাওয়া যায়',
      'প্রাথমিক পর্যায়ে দাঁতের ক্যারিজ বা গর্ত সহজেই সারিয়ে তোলা সম্ভব',
      'মুখের সতেজতা ও স্থায়ী মৌখিক সুস্বাস্থ্য বজায় থাকে'
    ],
    duration: '১৫ - ২০ মিনিট',
    careAdvice: 'দিনে দুবার সঠিক নিয়মে ব্রাশ করুন এবং প্রতি ৬ মাস অন্তর নিয়মিত দাঁত পরীক্ষা করান।'
  },
  {
    id: 'scaling',
    number: 2,
    title: 'দাঁত পরিষ্কার (স্কেলিং ও পলিশিং)',
    subtitle: 'Dental Scaling & Polishing',
    category: 'মাড়ি ও এনামেল সুরক্ষা',
    iconType: 'scaling',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    shortDesc: 'দাঁতের শক্ত পাথর (টারটার), প্লাক, কালচে দাগ ও মুখের দুর্গন্ধ দূর করে মাড়ির সুস্থতা রক্ষা।',
    detailedDesc: 'নিয়মিত ব্রাশ করার পরেও দাঁতের গোড়ায় লালা ও খাদ্যের কণা জমে শক্ত পাথরে (Calculus) রূপ নেয়। আমাদের আল্ট্রাসনিক স্কেলারের মৃদু কম্পন ও পানির প্রবাহের মাধ্যমে কোনো ক্ষয়রোধ ছাড়াই এই পাথর ও দাগ পুরোপুরি দূর করে দাঁতকে পলিশ করা হয়।',
    symptoms: [
      'ব্রাশ করার সময় মাড়ি দিয়ে রক্ত পড়া',
      'দাঁতের গোড়ায় হলুদ বা বাদামী শক্ত পাথরের স্তর জমা',
      'মুখের দীর্ঘস্থায়ী দুর্গন্ধ যা সাধারণ ব্রাশে যায় না',
      'পান, চা, কফি বা ধূমপানের দাগ দূর করতে'
    ],
    procedureSteps: [
      'আল্ট্রাসনিক স্কেলারের নিখুঁত কম্পন দিয়ে দাঁতের পাথর অপসারণ',
      'মাড়ির গভীরে জমে থাকা ক্ষতিকর প্লাক ও জীবাণু পরিষ্কার',
      'ফাইন পলিশিং পেস্টের সাহায্যে দাঁতের পৃষ্ঠ মসৃণ ও উজ্জ্বল করা',
      'মাড়ির সুরক্ষায় প্রয়োজনীয় মেডিকেটেড মাউথওয়াশ নির্দেশনা'
    ],
    benefits: [
      'মাড়ি থেকে রক্ত পড়া ও মাড়ির ইনফেকশন দ্রুত বন্ধ হয়',
      'দাঁতের এনামেল সুরক্ষিত থাকে ও দাঁতের আয়ুষ্কাল বাড়ে',
      'মুখের স্বাভাবিক উজ্জ্বলতা ও ফ্রেশ শ্বাস ফিরে আসে'
    ],
    duration: '৩০ - ৪০ মিনিট',
    careAdvice: 'স্কেলিংয়ের পর ২ দিন অতিরিক্ত গরম বা অতিরিক্ত ঠাণ্ডা পানীয় পরিহার করুন এবং ডাক্তারের নির্দেশিত মাউথওয়াশ ব্যবহার করুন।'
  },
  {
    id: 'braces',
    number: 3,
    title: 'ব্রেস (দাঁত সোজা করা)',
    subtitle: 'Braces & Orthodontic Teeth Straightening',
    category: 'অর্থোডন্টিক্স ও অ্যালাইনমেন্ট',
    iconType: 'braces',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    shortDesc: 'উঁচু-নিচু, খাঁজকাটা, আঁকাবাঁকা ও ফাঁকা দাঁত সোজা ও সুবিন্যস্ত করার সর্বাধুনিক চিকিৎসা।',
    detailedDesc: 'আঁকাবাঁকা বা উঁচু দাঁত শুধু চেহারার সৌন্দর্যই নষ্ট করে না, বরং খাবার চিবানো ও মুখের পরিষ্কার-পরিচ্ছন্নতায় জটিলতা সৃষ্টি করে। অর্থোডন্টিক ব্র্যাকেট ও ওয়্যারের মাধ্যমে ক্রমান্বয়ে নিখুঁত চাপে প্রতিটি দাঁতকে তার স্বাভাবিক সঠিক অবস্থানে ফিরিয়ে আনা হয়।',
    symptoms: [
      'দাঁত একটির ওপর আরেকটি উঠে থাকা (Crowded teeth)',
      'সামনের দাঁত স্বাভাবিকের চেয়ে বেশি উঁচু বা বাইরে বের হওয়া',
      'দাঁতের মাঝে অতিরিক্ত ফাঁকা বা গ্যাপ থাকা',
      'উপরের ও নিচের পাটি দাঁত ঠিকমতো না বসা (Bite problem)'
    ],
    procedureSteps: [
      'দাঁতের ডিজিটাল মাপ, ফটোগ্রাফি ও অর্থোডন্টিক স্টাডি মডেল তৈরি',
      'উচ্চমানের স্টেইনলেস স্টিল বা সিরামিক ব্র্যাকেট দাঁতে স্থাপন',
      'স্পেশালাইজড নিকেল-টাইটানিয়াম মেমোরি ওয়্যার সংযোগ',
      'প্রতি মাসে ফলোআপের মাধ্যমে দাঁতের কাঙ্ক্ষিত মুভমেন্ট পর্যবেক্ষণ'
    ],
    benefits: [
      'চেহারার সামগ্রিক গড়নে এনে দেয় অসাধারণ সামঞ্জস্য ও সৌন্দর্য',
      'সঠিক হাসির মাধ্যমে আত্মবিশ্বাস বহুলাংশে বৃদ্ধি পায়',
      'খাবার চিবানো সহজ হয় ও দাঁতের দীর্ঘস্থায়িত্ব নিশ্চিত হয়'
    ],
    duration: 'মাসিক ফলোআপ (কোর্সের সময়কাল দাঁতের অবস্থার ওপর নির্ভর করে)',
    careAdvice: 'ব্রেস পরা অবস্থায় শক্ত ও আঠালো খাদ্য এড়িয়ে চলুন এবং অর্থোডন্টিক স্পেশাল ব্রাশ ব্যবহার করুন।'
  },
  {
    id: 'cavity',
    number: 4,
    title: 'দাঁতের ক্যাভিটি ও মাড়ির চিকিৎসা',
    subtitle: 'Tooth Cavity & Gum Therapy',
    category: 'সংক্রমণ নিরাময় ও ফিলিং',
    iconType: 'cavity',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    shortDesc: 'দাঁতের ক্ষয়রোগ (ক্যাভিটি), গর্ত হওয়া, তীব্র শিরশির অনুভূতি ও ফোলা মাড়ির ফলপ্রসূ চিকিৎসা।',
    detailedDesc: 'দাঁতে মিষ্টি বা অ্যাসিডিক খাদ্যের ব্যাকটেরিয়া থেকে ডেন্টাল ক্যারিজ সৃষ্টি হয়। অবহেলা করলে এটি দ্রুত পাল্প বা স্নায়ু পর্যন্ত ছড়িয়ে তীব্র যন্ত্রণার কারণ হয়ে দাঁড়ায়। আমরা ক্ষতিগ্রস্ত অংশ পরিষ্কার করে মাড়ি ও দাঁতের সার্বিক সুস্থতা পুনরুদ্ধার করি।',
    symptoms: [
      'মিষ্টি বা টক খাবার খেলে দাঁতে তীক্ষ্ণ শিরশির অনুভূতি',
      'দাঁতের উপরিভাগে কালো বা বাদামী ছোট গর্ত লক্ষ্য করা',
      'দাঁতের ফাঁকে খাবার আটকে থাকা ও মাড়ি ফুলে যাওয়া',
      'চাপ দিলে বা চিবানোর সময় মাড়িতে মৃদু ব্যথা'
    ],
    procedureSteps: [
      'সংক্রামিত ও ক্যারিজ আক্রান্ত অংশের সূক্ষ্ম ক্লিনিং',
      'মাড়ির পকেটের অ্যান্টিসেপটিক ওয়াশ ও প্রদাহ নিবারণ',
      'এনামেল ও ডেন্টিন সুরক্ষায় বায়ো-কম্প্যাটিবল সিলিং',
      'প্রয়োজনীয় ক্ষেত্রে চিকিৎসাগত দীর্ঘমেয়াদী প্রেসক্রিপশন'
    ],
    benefits: [
      'রোগের বৃদ্ধি তাৎক্ষণিকভাবে প্রতিহত হয়',
      'ভবিষ্যতে রুট ক্যানাল বা দাঁত তোলার প্রয়োজনীয়তা এড়ানো যায়',
      'ব্যথামুক্ত আরামদায়ক খাবারের নিশ্চয়তা'
    ],
    duration: '২৫ - ৩৫ মিনিট',
    careAdvice: 'খাবার গ্রহণের পর মুখ ভালোভাবে কুলি করুন এবং ডেন্টাল ফ্লস ব্যবহারে যত্নবান হোন।'
  },
  {
    id: 'rct',
    number: 5,
    title: 'রুট ক্যানাল চিকিৎসা (RCT)',
    subtitle: 'Root Canal Treatment (RCT)',
    category: 'দাঁত সংরক্ষণ ও ব্যথাহীন প্রযুক্তি',
    iconType: 'rct',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    shortDesc: 'তীব্র ব্যথায় আক্রান্ত বা নষ্ট হয়ে যাওয়া দাঁত না ফেলে রোটারি সিস্টেমে ব্যথাহীন স্থায়ী সংরক্ষণ।',
    detailedDesc: 'দাঁতের ক্ষয় যখন স্নায়ু (Pulp) পর্যন্ত পৌঁছে যায়, তখন তীব্র অসহ্য ব্যথা শুরু হয়। অনেকেই ভুল করে দাঁত তুলে ফেলেন, কিন্তু আধুনিক ডেন্টিস্ট্রিতে রুট ক্যানাল করে দাঁতটিকে আজীবনের জন্য টিকিয়ে রাখা সম্ভব। অত্যাধুনিক রোটারি প্রযুক্তিতে ব্যথাহীনভাবে রুট ক্যানাল সম্পন্ন করা হয়।',
    symptoms: [
      'রাতে বা শুয়ে থাকলে অসহ্য দাঁতের যন্ত্রণা বেড়ে যাওয়া',
      'গরম চা বা খাবার খেলে তীব্র ও দীর্ঘস্থায়ী ব্যথা হওয়া',
      'দাঁতের গোড়ায় ফোড়া হওয়া বা মাড়ি দিয়ে পুঁজ পড়া',
      'অতীতে আঘাত পেয়ে দাঁতের রঙ কালচে বা কালশিটে হয়ে যাওয়া'
    ],
    procedureSteps: [
      'স্থানীয় অসাড়করণ (Local Anesthesia) দ্বারা সম্পূর্ণ ব্যথাহীন করা',
      'সংক্রামিত পাল্প টিস্যু ও স্নায়ু সম্পূর্ণ জীবাণুমুক্তভাবে অপসারণ',
      'ডিজিটাল রোটারি এন্ডোমোটরে ক্যানাল সুনির্দিষ্টভাবে পরিষ্কার ও শেপিং',
      'স্থায়ী গাটা-পার্চা (Gutta-Percha) দিয়ে ক্যানাল সম্পূর্ণ সিল ও বন্ধকরণ'
    ],
    benefits: [
      'আসল দাঁত স্থায়ীভাবে রক্ষা পায় — দাঁত ফেলতে হয় না',
      'তীব্র যন্ত্রণা ও মাড়ির প্রদাহ থেকে চিরতরে মুক্তি',
      'পরবর্তীতে ক্যাপ পরিয়ে সারাজীবন স্বাভাবিকভাবে চিবানো যায়'
    ],
    duration: '১ - ২ টি সংক্ষিপ্ত সিটিং',
    careAdvice: 'রুট ক্যানাল শেষ না হওয়া পর্যন্ত ওই পাশ দিয়ে শক্ত খাবার চিবাবেন না এবং চিকিৎসা শেষে ক্যাপ (ক্রাউন) লাগিয়ে নিন।'
  },
  {
    id: 'crown',
    number: 6,
    title: 'ক্যাপ (ক্রাউন) চিকিৎসা',
    subtitle: 'Dental Cap / Crown Restoration',
    category: 'স্থায়ী প্রোস্থেটিক্স ও সুরক্ষা',
    iconType: 'crown',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    shortDesc: 'ভাঙা, দুর্বল বা রুট ক্যানাল করা দাঁতের ওপর নিখুঁত কৃত্রিম স্থায়ী ক্যাপ বা ক্রাউন স্থাপন।',
    detailedDesc: 'রুট ক্যানাল করা বা ভেঙে যাওয়া দাঁত ভঙ্গুর হয়ে যায়। দাঁতের উপরিভাগে মজবুত ও আসল দাঁতের অনুরূপ ক্যাপ পরিয়ে দিলে দাঁতটি পুনরায় পাথর-কঠিন শক্তি অর্জন করে। আমরা পোরসেলিন ও প্রিমিয়াম জিরকোনিয়া ক্যাপ সরবরাহ করি।',
    symptoms: [
      'রুট ক্যানাল সম্পন্ন করার পর দাঁত ভাঙা রোধ করতে',
      'অতিরিক্ত ক্ষয়ে যাওয়া বা অর্ধেক ভেঙে যাওয়া দাঁত মজবুত করতে',
      'দাঁতের অস্বাভাবিক আকার বা বিশ্রী রঙ ঢেকে স্বাভাবিক রূপ দিতে',
      'খাবার চিবানোর শক্তি পুনরায় ফিরে পেতে'
    ],
    procedureSteps: [
      'দাঁতের নিখুঁত প্রিপারেশন ও সুনির্দিষ্ট পরিমাপ গ্রহণ',
      'রোগীর অন্যান্য দাঁতের শেড বা রঙের সাথে হুবহু কালার ম্যাচিং',
      'হাই-টেক ল্যাবে উচ্চমানের ক্রাউন নিখুঁতভাবে তৈরি',
      'স্থায়ী ডেন্টাল সিমেন্টের মাধ্যমে দাঁতের ওপর দৃঢ়ভাবে স্থাপন'
    ],
    benefits: [
      'দাঁত ভেঙে যাওয়ার ঝুঁকি চিরতরে দূর হয়',
      'আসল দাঁতের মতো রঙ, গঠন ও শক্তিমত্তা লাভ করে',
      'দশকের পর দশক স্বাচ্ছন্দ্যে ব্যবহারযোগ্য'
    ],
    duration: '২ টি ভিজিট (মাপ গ্রহণ ও ক্রাউন স্থাপন)',
    careAdvice: 'ক্যাপ পরা দাঁতেও সাধারণ দাঁতের মতোই নিয়মিত ব্রাশ ও পরিষ্কার বজায় রাখুন।'
  },
  {
    id: 'bridge',
    number: 7,
    title: 'ব্রিজ (দাঁত সংযোগ)',
    subtitle: 'Fixed Dental Bridge',
    category: 'স্থায়ী দাঁত প্রতিস্থাপন',
    iconType: 'bridge',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    shortDesc: 'এক বা একাধিক হারানো দাঁতের স্থানে অপারেশন ছাড়াই ফিক্সড ব্রিজ সেতুর মাধ্যমে স্থায়ী দাঁত সংযোজন।',
    detailedDesc: 'যদি আপনার একটি বা দুটি দাঁত পড়ে গিয়ে থাকে, তবে পাশের দাঁতের সহায়তা নিয়ে স্থায়ীভাবে ফিক্সড ব্রিজ তৈরি করা হয়। এটি মুখে স্থায়ীভাবে বসে থাকে, খুলতে হয় না এবং প্রাকৃতিক দাঁতের মতো খাবার চিবানোর পূর্ণ তৃপ্তি প্রদান করে।',
    symptoms: [
      'একটি বা একাধিক দাঁত পড়ে গিয়ে খাবার চিবানোতে সমস্যা',
      'দাঁত না থাকার কারণে পাশের দাঁতগুলো হেলে যাওয়া',
      'সামনের দাঁত হারানোর কারণে কথা বলা বা হাসিতে সংকোচ',
      'খোলার ঝামেলাহীন স্থায়ী দাঁতের সমাধান প্রত্যাশা'
    ],
    procedureSteps: [
      'ফাঁকা অংশের পাশের সাপোর্ট দাঁতগুলোর পরীক্ষা ও প্রিপারেশন',
      'ডিজিটাল বা নিখুঁত ইমপ্রেশন ম্যাটেরিয়ালে মাপ গ্রহণ',
      'উন্নত জিরকোনিয়া বা সিরামিক সেতু ল্যাবে কাস্টমাইজড তৈরি',
      'স্থায়ীভাবে মুখে সিল করে সম্পূর্ণ ব্যালান্সড বাইট নিশ্চিতকরণ'
    ],
    benefits: [
      'স্থায়ী ফিক্সড দাঁত — মুখে খোলার কোনো ঝামেলা নেই',
      'চেহারার স্বাভাবিক গঠন বজায় থাকে ও গাল ভেঙে যাওয়া রোধ করে',
      'খাবার ভালোভাবে চিবানো যায় ও হজম শক্তি ঠিক থাকে'
    ],
    duration: '৩ - ৫ কার্যদিবস (২ টি ভিজিট)',
    careAdvice: 'ব্রিজের নিচের অংশ পরিষ্কার রাখতে ইন্টারডেন্টাল ব্রাশ বা সুপার-ফ্লস ব্যবহার করুন।'
  },
  {
    id: 'denture',
    number: 8,
    title: 'ডেনচার (কৃত্রিম দাঁত)',
    subtitle: 'Complete & Partial Dentures',
    category: 'আংশিক ও সম্পূর্ণ কৃত্রিম দাঁত',
    iconType: 'denture',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    shortDesc: 'বয়স্ক বা একাধিক দাঁত হারানো প্রিয়জনদের জন্য সম্পূর্ণ অথবা আংশিক আধুনিক আরামদায়ক ডেনচার।',
    detailedDesc: 'বয়সজনিত কারণে বা অন্যান্য সমস্যায় যাদের অনেকগুলো অথবা সম্পূর্ণ পাটির দাঁত নেই, তাদের জন্য কাস্টম-মেড ডেনচার একটি চমৎকার সমাধান। আধুনিক লাইট-ওয়েট ও ফ্লেক্সিবল উপাদানে তৈরি ডেনচার মুখে খুব সুন্দরভাবে বসে এবং স্বাভাবিকভাবে কথা বলা ও খাওয়া নিশ্চিত করে।',
    symptoms: [
      'মুখের সকল বা অধিকাংশ দাঁত পড়ে যাওয়া',
      'খাবার চিবিয়ে খেতে না পারা ও হজমে মারাত্মক সমস্যা হওয়া',
      'দাঁত না থাকার কারণে স্পষ্ট কথা বলতে অসুবিধা হওয়া',
      'মুখের চামড়া কুঁচকে যাওয়া ও বার্ধক্যের ছাপ কমানোর জন্য'
    ],
    procedureSteps: [
      'মাড়ির সুস্থতা পর্যবেক্ষণ ও নিখুঁত প্রাথমিক মাপ গ্রহণ',
      'স্পেশাল ট্রে দিয়ে ফাইন ইমপ্রেশন ও বাইট রেজিস্ট্রেশন',
      'মোমের ট্রায়াল সেটের মাধ্যমে রোগীর হাসির সৌন্দর্য ও ফিটিং যাচাই',
      'চূড়ান্ত পলিশড ডেনচার ডেলিভারি ও ব্যবহারবিধি বুঝিয়ে দেওয়া'
    ],
    benefits: [
      'বয়স্ক মানুষরা সব ধরণের খাবার আনন্দের সাথে খেতে পারেন',
      'মুখ ও গালের আকৃতি তরুণ ও সুন্দর দেখায়',
      'সাশ্রয়ী মূল্যে সম্পূর্ণ মুখের দাঁতের অভাব পূরণ'
    ],
    duration: '৩ - ৪ টি ট্রায়াল সেশন',
    careAdvice: 'রাতে ঘুমানোর সময় ডেনচার পরিষ্কার পানিতে ভিজিয়ে রাখুন এবং সকালে ব্রাশ করে মুখে পরুন।'
  },
  {
    id: 'gum',
    number: 9,
    title: 'মাড়ি / পেরিওডন্টাল চিকিৎসা',
    subtitle: 'Periodontal Gum Treatment',
    category: 'মাড়ির সংক্রমণ ও পাইওরিয়া নিরাময়',
    iconType: 'gum',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shortDesc: 'মাড়ির ইনফেকশন, পাইওরিয়া, মাড়ি সরে যাওয়া ও দাঁত নড়ে যাওয়ার গভীর প্রতিরোধমূলক চিকিৎসা।',
    detailedDesc: 'পেরিওডন্টাল রোগ দাঁতের মূল ভিত্তি মাড়ি ও মাড়ির হাড়কে দুর্বল করে দেয়। ফলে ভালো দাঁতও অকালে নড়ে যায় বা পড়ে যায়। আমরা রুট প্ল্যানিং ও সাব-জিঞ্জাইভাল কিউরেটেজের মাধ্যমে মাড়ির গভীরের জীবাণু পরিষ্কার করে মাড়িকে পুনরায় শক্ত করি।',
    symptoms: [
      'মাড়ি ফুলে লাল হওয়া ও সামান্য ছোঁয়াতেই রক্ত পড়া',
      'দাঁত লম্বা দেখানো বা দাঁতের গোড়া থেকে মাড়ি নিচে নেমে যাওয়া',
      'দাঁত কিছুটা নড়বড়ে অনুভূত হওয়া বা মাড়ি দিয়ে পুঁজ বের হওয়া',
      'মুখের অসহনীয় দুর্গন্ধ যা আশেপাশে ছড়ায়'
    ],
    procedureSteps: [
      'পেরিওডন্টাল প্রোব দিয়ে মাড়ির পকেটের গভীরতা পরিমাপ',
      'ডিপ স্কেলিং ও রুট প্ল্যানিং দ্বারা দাঁতের শিকড় মসৃণ করা',
      'অ্যান্টিমাইক্রোবিয়াল মেডিকেশন প্রয়োগ করে ব্যাকটেরিয়া নির্মূল',
      'মাড়ির টিস্যু সুস্থ হওয়ার নিয়মিত পর্যবেক্ষণ ও ট্র্যাকিং'
    ],
    benefits: [
      'দাঁত নড়ে যাওয়া ও অকালে পড়ে যাওয়ার হাত থেকে রক্ষা পায়',
      'মাড়ি মজবুত হয়ে দাঁতকে শক্তভাবে আঁকড়ে ধরে',
      'মুখের স্বাস্থ্য সম্পূর্ণ দুর্গন্ধমুক্ত ও সতেজ হয়ে ওঠে'
    ],
    duration: '৩০ - ৫০ মিনিট',
    careAdvice: 'নরম ব্রাশ দিয়ে হালকা চাপে মাড়ির ম্যাসাজ করুন এবং নিয়মিত হালকা কুসুম গরম পানিতে লবণ দিয়ে কুলকুচি করুন।'
  },
  {
    id: 'filling',
    number: 10,
    title: 'ফিলিং (স্মাইল ডিজাইন / লাইট কিউর)',
    subtitle: 'Light Cure Composite Filling & Smile Design',
    category: 'নান্দনিক রূপ ও লেজার ফিলিং',
    iconType: 'filling',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    shortDesc: 'দাঁতের রঙের সাথে হুবহু মিলিয়ে স্থায়ী লাইট কিউর লেজার ফিলিং ও নান্দনিক স্মাইল ডিজাইন।',
    detailedDesc: 'আগের দিনের রূপালী বা কালচে ফিলিংয়ের দিন শেষ। আমরা ব্যবহার করি আন্তর্জাতিক মানের আল্ট্রা-ভায়োলেট লাইট কিউর কম্পোজিট রেজিন। এটি আপনার দাঁতের স্বাভাবিক রঙের সাথে এমনভাবে মিশে যায় যে কেউ বুঝতেই পারবে না দাঁতে কোনো ফিলিং বা মেরামত করা হয়েছে।',
    symptoms: [
      'দাঁতে ছোট বা মাঝারি আকারের গর্ত হওয়া',
      'সামনের দাঁতের কোণা ভেঙে যাওয়া বা চিপ হওয়া',
      'দাঁতের পুরনো কালো অ্যামালগাম ফিলিং পরিবর্তন করতে চাওয়া',
      'সামনের দাঁতের মধ্যবর্তী সূক্ষ্ম ফাঁক প্রাকৃতিক উপায়ে ভরাট করতে'
    ],
    procedureSteps: [
      'দাঁতের ক্ষয়িষ্ণু অংশ সম্পূর্ণ পরিষ্কার করে শেপ তৈরি',
      'বিশেষ এচিং ও বন্ডিং এজেন্ট দিয়ে মাইক্রোস্কোপিক গ্রিপ তৈরি',
      'রঙ মিলিয়ে লেয়ার বাই লেয়ার ন্যানো-কম্পোজিট রেজিন স্থাপন',
      'হাই-পাওয়ার ব্লু লাইট দিয়ে পলিমারাইজেশন ও ফাইন পলিশিং'
    ],
    benefits: [
      'দাঁত দেখতে ১০০% প্রাকৃতিক ও সুন্দর লাগে',
      'তাৎক্ষণিকভাবে শক্ত হয়ে যায়, একই দিনেই স্বাভাবিক খাওয়া সম্ভব',
      'ক্ষয়রোধ করে দাঁতের মূল অংশকে স্থায়ীভাবে সুস্থ রাখে'
    ],
    duration: '২০ - ৩০ মিনিট প্রতি দাঁত',
    careAdvice: 'ফিলিংয়ের পর নিয়মিত দাঁত পরিষ্কার রাখুন এবং দাঁত দিয়ে শক্ত বোতলের ছিপি বা কঠিন বস্তু খোলার চেষ্টা করবেন না।'
  }
];

export const PublicHealthcarePortal: React.FC = () => {
  const [selectedService, setSelectedService] = useState<DentalService | null>(null);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [targetFacility, setTargetFacility] = useState('ইকবাল ডেন্টাল কেয়ার-১');
  const [patientMessage, setPatientMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) return;

    const text = encodeURIComponent(
      `নাম: ${patientName.trim()}\nমোবাইল: ${patientPhone.trim()}\nশাখা: ${targetFacility}\nসমস্যা/পরামর্শ: ${patientMessage.trim() || 'সাধারণ স্বাস্থ্য ও দাঁতের পরামর্শ'}`
    );
    const waUrl = `https://wa.me/8801812358839?text=${text}`;
    setInquirySent(true);
    setTimeout(() => {
      window.location.href = waUrl;
    }, 400);
  };

  const handleBookSpecificService = (service: DentalService) => {
    setSelectedService(null);
    setTargetFacility('ইকবাল ডেন্টাল কেয়ার-১');
    setPatientMessage(`সেবা: ${service.title} (${service.subtitle})`);
    const elem = document.getElementById('contact');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper icon render based on iconType
  const renderServiceIcon = (type: string, className = 'w-6 h-6') => {
    switch (type) {
      case 'checkup':
        return (
          <div className="relative flex items-center justify-center">
            <Search className={className} />
          </div>
        );
      case 'scaling':
        return (
          <div className="relative flex items-center justify-center">
            <Sparkles className={className} />
          </div>
        );
      case 'braces':
        return (
          <div className="relative flex items-center justify-center">
            <Layers className={className} />
          </div>
        );
      case 'cavity':
        return (
          <div className="relative flex items-center justify-center">
            <Activity className={className} />
          </div>
        );
      case 'rct':
        return (
          <div className="relative flex items-center justify-center">
            <ShieldCheck className={className} />
          </div>
        );
      case 'crown':
        return (
          <div className="relative flex items-center justify-center">
            <Award className={className} />
          </div>
        );
      case 'bridge':
        return (
          <div className="relative flex items-center justify-center">
            <div className="flex items-center -space-x-1">
              <span className="w-2.5 h-3.5 bg-current rounded-t-sm opacity-80"></span>
              <span className="w-2.5 h-3.5 bg-current rounded-t-sm font-bold"></span>
              <span className="w-2.5 h-3.5 bg-current rounded-t-sm opacity-80"></span>
            </div>
          </div>
        );
      case 'denture':
        return (
          <div className="relative flex items-center justify-center">
            <Smile className={className} />
          </div>
        );
      case 'gum':
        return (
          <div className="relative flex items-center justify-center">
            <HeartPulse className={className} />
          </div>
        );
      case 'filling':
      default:
        return (
          <div className="relative flex items-center justify-center">
            <Smile className={className} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      {/* Top Notification Bar */}
      <div className="bg-teal-900 text-teal-100 text-xs py-2 px-4 border-b border-teal-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-xs sm:text-sm">
              ইকবাল হেলথকেয়ার নেটওয়ার্ক · সার্বক্ষণিক আসল ঔষধ ও আধুনিক দন্ত চিকিৎসা সেবা
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <a href="tel:01812358839" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <PhoneCall className="w-3.5 h-3.5 text-teal-300" />
              <span>জরুরি হটলাইন: ০১৮১২-৩৫৮৮৩৯</span>
            </a>
            <span className="hidden md:inline text-teal-400">|</span>
            <span className="hidden md:inline text-teal-200">সততা ও সেবায় বিশ্বস্ত</span>
          </div>
        </div>
      </div>

      {/* Main Header (Zero admin buttons, purely public) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-2 bg-white rounded-xs"></div>
                <div className="w-2 h-6 bg-white rounded-xs absolute"></div>
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                ইকবাল হেলথকেয়ার
              </h1>
              <p className="text-[11px] font-semibold text-teal-700">
                ইকবাল ফার্মেসী ও ইকবাল ডেন্টাল কেয়ার (শাখা ১ ও ২)
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-700">
            <a href="#pharmacy" className="hover:text-teal-700 transition-colors">ইকবাল ফার্মেসী</a>
            <a href="#dental1" className="hover:text-indigo-700 transition-colors">ডেন্টাল কেয়ার-১</a>
            <a href="#dental2" className="hover:text-blue-700 transition-colors">ডেন্টাল কেয়ার-২</a>
            <a href="#dental-services" className="hover:text-emerald-700 transition-colors">১০টি বিশেষায়িত সেবা</a>
            <a href="#contact" className="hover:text-teal-700 transition-colors">সিরিয়াল ও যোগাযোগ</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="tel:01812358839"
              className="px-4 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>সরাসরি কল করুন</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50/70 via-white to-slate-50 py-10 sm:py-14 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/90 text-teal-900 text-xs font-bold border border-teal-200 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>ডিজিডিএ অনুমোদিত মডেল ফার্মেসী ও অভিজ্ঞ ডেন্টিস্টের বিশেষায়িত ক্লিনিক</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              আপনার ও আপনার পরিবারের জন্য বিশ্বস্ত ফার্মেসী ও বিশেষায়িত ডেন্টাল কেয়ার
            </h2>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              ইকবাল হেলথকেয়ারে আমরা দিচ্ছি শতভাগ আসল ও সংরক্ষিত জীবনরক্ষাকারী ঔষধ, অভিজ্ঞ গ্র্যাজুয়েট দন্ত চিকিৎসকের চিকিৎসা এবং স্বাস্থ্যসেবার অনন্য নিশ্চয়তা।
            </p>

            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <a
                href="#pharmacy"
                className="px-5 py-2.5 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 shadow-sm transition-all"
              >
                ইকবাল ফার্মেসী পরিচিতি
              </a>
              <a
                href="#dental1"
                className="px-5 py-2.5 text-xs font-bold rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm transition-all"
              >
                ইকবাল ডেন্টাল কেয়ার-১
              </a>
              <a
                href="#dental2"
                className="px-5 py-2.5 text-xs font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-800 shadow-sm transition-all"
              >
                ইকবাল ডেন্টাল কেয়ার-২
              </a>
              <a
                href="#dental-services"
                className="px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>১০টি ডেন্টাল সেবা দেখুন</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900">১০০% আসল ঔষধ</p>
              <p className="text-[11px] text-slate-500">DGDA লাইসেন্সকৃত কোম্পানি</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900">অভিজ্ঞ ডেন্টিস্ট</p>
              <p className="text-[11px] text-slate-500">আধুনিক ব্যথাহীন চিকিৎসা</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900">সঠিক সময়সূচী</p>
              <p className="text-[11px] text-slate-500">প্রতিদিন নির্ধারিত শিফটে সেবা</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900">২টি ডেন্টাল শাখা</p>
              <p className="text-[11px] text-slate-500">চন্দ্রগঞ্জ ও ওদারহাট নোয়াখালী</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Institutions Showcase */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* 1. Iqbal Pharmacy */}
        <section id="pharmacy" className="scroll-mt-20">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-teal-700 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 text-teal-100 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span>লাইসেন্সধারী মডেল ফার্মেসী</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">ইকবাল ফার্মেসী</h3>
                <p className="text-xs sm:text-sm text-teal-100">
                  সর্বাধিক ঔষধের সমৃদ্ধ স্টক, সঠিক তাপমাত্রা নিয়ন্ত্রণ ও বিশ্বস্ত ফার্মাসিউটিক্যাল সেবা
                </p>
              </div>
              {/* Highlighted Time Badge matching user screenshot */}
              <div className="shrink-0 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-md border border-teal-100 text-center">
                <span className="block text-[11px] text-teal-800 font-bold uppercase tracking-wider">প্রতিদিনের সেবার সময়</span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  সকাল ৮টা থেকে দুপুর ১টা এবং বিকাল ৩টা থেকে রাত ১০টা
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 border-b pb-2">আমাদের ফার্মেসীর বৈশিষ্ট্য ও সুবিধাসমূহ</h4>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>২১,০০০+ অনুমোদিত ঔষধের ক্যাটালগ:</strong> স্কয়ার, বেক্সিমকো, ইনসেপ্টা, রেনাটা, অপসোনিনসহ সকল শীর্ষ কোম্পানির ঔষধ।</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>শীতাতপ নিয়ন্ত্রিত স্টোরেজ:</strong> ইনসুলিন, ভ্যাকসিন ও জীবনরক্ষাকারী ইনজেকশন সঠিক কুল চেইনে সংরক্ষিত।</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>ডিজিটাল ক্যাশ মেমো:</strong> প্রতিটি ক্রয়ে স্বচ্ছ দাম ও বিস্তারিত ভাউচার প্রিন্ট সুবিধা।</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>প্রেসক্রিপশন পরামর্শ:</strong> ঔষধ সেবনের সঠিক নিয়ম ও ডোজ বিষয়ক অভিজ্ঞ পরামর্শ।</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">ফার্মেসী যোগাযোগের ঠিকানা ও তথ্য</h4>
                <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">ঠিকানা:</strong>
                      <span className="text-rose-700 font-bold">নতুনহাট, দক্ষিণ বাজার, চন্দ্রগঞ্জ, লক্ষ্মীপুর।</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">ফোন / মোবাইল:</strong>
                      <a href="tel:01812358839" className="text-teal-800 font-black hover:underline text-sm">০১৮১২-৩৫৮৮৩৯</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">সেবার সময়:</strong>
                      <span className="text-rose-700 font-bold">সকাল ৮টা থেকে দুপুর ১টা এবং বিকাল ৩টা থেকে রাত ১০টা</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">ড্রাগ লাইসেন্স নম্বর:</strong>
                      <span className="text-rose-700 font-black text-base tracking-wide font-mono">LP-3577</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="tel:01812358839"
                    className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>ফার্মেসীতে সরাসরি কল দিন</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Iqbal Dental Care - Branch 1 */}
        <section id="dental1" className="scroll-mt-20">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-800 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-100 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>শাখা ১ · বিশেষজ্ঞ ডেন্টাল ক্লিনিক</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">ইকবাল ডেন্টাল কেয়ার-১</h3>
                <p className="text-xs sm:text-sm text-indigo-100">
                  আধুনিক ডিজিটাল প্রযুক্তিতে নিখুঁত ও আরামদায়ক দাঁতের সব ধরনের চিকিৎসা
                </p>
              </div>
              {/* Highlighted Time Badge matching user screenshot */}
              <div className="shrink-0 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-md border border-indigo-100 text-center">
                <span className="block text-[11px] text-indigo-800 font-bold uppercase tracking-wider">শাখা-১ চেম্বার সময়</span>
                <span className="text-xs sm:text-sm font-black text-rose-700 block">
                  সকাল ৮টা থেকে ১০টা এবং মাগরিবের নামাজের পর থেকে রাত ১০টা
                </span>
                <span className="text-xs font-black text-emerald-700 block">শুক্রবার সারাদিন</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-base font-bold text-slate-900">ডেন্টাল কেয়ার-১ এর বিশেষায়িত সেবাসমূহ</h4>
                  <a href="#dental-services" className="text-xs text-indigo-700 font-bold hover:underline">
                    ১০টি সেবাই দেখুন →
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'scaling') || null)}
                    className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-indigo-950 font-bold group-hover:text-indigo-700 transition-colors">১. স্কেলিং ও পলিশিং</strong>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">দাঁতের পাথর ও দুর্গন্ধ দূর করে মাড়ির সুস্থতা রক্ষা।</span>
                  </div>
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'rct') || null)}
                    className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-indigo-950 font-bold group-hover:text-indigo-700 transition-colors">২. রুট ক্যানাল চিকিৎসা</strong>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">অত্যাধুনিক রোটারি সিস্টেমে দাঁত না ফেলে ব্যথাহীন সংরক্ষণ।</span>
                  </div>
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'crown') || null)}
                    className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-indigo-950 font-bold group-hover:text-indigo-700 transition-colors">৩. ক্যাপ ও ক্রাউন</strong>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">জিরকোনিয়া ও সিরামিক ক্যাপে স্থায়ী দাঁত পুনরুদ্ধার।</span>
                  </div>
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'braces') || null)}
                    className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-indigo-950 font-bold group-hover:text-indigo-700 transition-colors">৪. ব্রেস (দাঁত সোজা করা)</strong>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">উঁচু-নিচু ও ফাঁকা দাঁত সোজা ও সুন্দর করার চিকিৎসা।</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-amber-900 font-semibold">
                    * উভয় ডেন্টাল শাখায় ১০টি বিশেষায়িত সেবাই সমান দক্ষতায় দেওয়া হয়।
                  </span>
                  <a href="#dental-services" className="text-xs font-bold text-amber-900 underline shrink-0 ml-2">
                    সকল সেবা বিস্তারিত
                  </a>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">চেম্বার ও সিরিয়াল গ্রহণের তথ্য</h4>
                <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">শাখা ১ ঠিকানা:</strong>
                      <span className="text-rose-700 font-bold">নতুনহাট, দক্ষিণ বাজার, চন্দ্রগঞ্জ, লক্ষ্মীপুর</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">চিকিৎসক:</strong>
                      <p className="text-rose-700 font-bold">ডেন্টিস্ট:- ইকবাল মাহমুদ</p>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        ডি.এম.টি.ডি (ডেন্টাল), এল.এম.এ.এফ (ঢাকা), আর.এম.পি (ঢাকা), ফার্মাসিস্ট, ওরাল এন্ড ডেন্টাল টেকনোলজিস্ট
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">রোগী দেখার সময়:</strong>
                      <span className="text-rose-700 font-bold block">
                        সকাল ৮টা-১০টা এবং মাগরিবের নামাজের পর থেকে রাত ১০টা।
                      </span>
                      <span className="text-emerald-700 font-bold block">শুক্রবার সারাদিন</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">সিরিয়াল বুকিং:</strong>
                      <a href="tel:01812358839" className="text-indigo-800 font-black hover:underline text-sm">০১৮১২-৩৫৮৮৩৯</a>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="tel:01812358839"
                    className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>শাখা-১ সিরিয়াল দিতে কল করুন</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Iqbal Dental Care - Branch 2 (Odarhat) */}
        <section id="dental2" className="scroll-mt-20">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-800 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-100 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5 text-blue-300" />
                  <span>শাখা ২ · বিশেষজ্ঞ ডেন্টাল ক্লিনিক</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">ইকবাল ডেন্টাল কেয়ার-২</h3>
                  <span className="text-sm font-semibold text-blue-200">(ওদারহাট ডেন্টাল কেয়ার)</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-100">
                  দাঁতের সৌন্দর্য বর্ধন, আঁকাবাঁকা দাঁত সোজা করা ও বিশেষায়িত শিশু দন্ত চিকিৎসা
                </p>
              </div>
              {/* Highlighted Time Badge matching user screenshot */}
              <div className="shrink-0 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-md border border-blue-100 text-center">
                <span className="block text-[11px] text-blue-800 font-bold uppercase tracking-wider">শাখা-২ চেম্বার সময়</span>
                <span className="text-xs sm:text-sm font-black text-rose-700 block">
                  সকাল ১০টা থেকে মাগরিবের নামাজের পূর্বে পর্যন্ত
                </span>
                <span className="text-xs font-black text-slate-700 block">শুক্রবার বন্ধ</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-base font-bold text-slate-900">ডেন্টাল কেয়ার-২ এর বিশেষ সুবিধাসমূহ</h4>
                  <a href="#dental-services" className="text-xs text-blue-700 font-bold hover:underline">
                    ১০টি সেবাই দেখুন →
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'braces') || null)}
                    className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-blue-950 font-bold group-hover:text-blue-700 transition-colors">১. অর্থোডন্টিক ব্রেসেস</strong>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">উঁচু-নিচু ও ফাঁকা দাঁত সোজা ও সুন্দর করার আধুনিক চিকিৎসা।</span>
                  </div>
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'filling') || null)}
                    className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-blue-950 font-bold group-hover:text-blue-700 transition-colors">২. স্মাইল ডিজাইন ও ফিলিং</strong>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">দাঁতের রঙের সাথে মিলিয়ে নিখুঁত ও স্থায়ী লেজার ফিলিং।</span>
                  </div>
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'bridge') || null)}
                    className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-blue-950 font-bold group-hover:text-blue-700 transition-colors">৩. ব্রিজ (দাঁত সংযোগ)</strong>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">স্থায়ী সেতু সংযোগের মাধ্যমে কৃত্রিম নিখুঁত দাঁত স্থাপন।</span>
                  </div>
                  <div
                    onClick={() => setSelectedService(DENTAL_SERVICES_DATA.find(s => s.id === 'denture') || null)}
                    className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-blue-950 font-bold group-hover:text-blue-700 transition-colors">৪. ডেনচার (কৃত্রিম দাঁত)</strong>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm">ক্লিক করুন</span>
                    </div>
                    <span className="text-slate-600 text-xs">বয়স্ক ও একাধিক দাঁত হারানোদের জন্য আরামদায়ক ডেনচার।</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-emerald-900 font-semibold">
                    * উভয় ডেন্টাল ক্লিনিকের সকল সেবা ও মান হুবহু এক এবং সমান যত্নশীল।
                  </span>
                  <a href="#dental-services" className="text-xs font-bold text-emerald-900 underline shrink-0 ml-2">
                    সকল সেবা বিস্তারিত
                  </a>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">শাখা ২ চেম্বার ও যোগাযোগের তথ্য</h4>
                <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">শাখা ২ ঠিকানা:</strong>
                      <span className="text-rose-700 font-bold">
                        ওদারহাট, দক্ষিণ বাজার, ইউনিয়ন পরিষদ রোড (পানা মিয়া স্কুল গেইট), সদর, নোয়াখালী।
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">কনসালট্যান্ট ডেন্টিস্ট:</strong>
                      <p className="text-rose-700 font-bold">ডেন্টিস্ট:- ইকবাল মাহমুদ</p>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        ডি.এম.টি.ডি (ডেন্টাল), এল.এম.এ.এফ (ঢাকা), আর.এম.পি (ঢাকা), ফার্মাসিস্ট, ওরাল এন্ড ডেন্টাল টেকনোলজিস্ট
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">রোগী দেখার সময়:</strong>
                      <span className="text-rose-700 font-bold block">
                        সকাল ১০টা থেকে মাগরিবের নামাজের পূর্বে পর্যন্ত।
                      </span>
                      <span className="text-slate-700 font-bold block">শুক্রবার বন্ধ।</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">সরাসরি বুকিং নম্বর:</strong>
                      <a href="tel:01812358839" className="text-blue-800 font-black hover:underline text-sm">০১৮১২-৩৫৮৮৩৯</a>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="tel:01812358839"
                    className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>শাখা-২ সিরিয়াল দিতে কল করুন</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Complete 10 Dental Services Showcase (Matching Image 10 exactly) */}
        <section id="dental-services" className="scroll-mt-20">
          <div className="bg-gradient-to-b from-teal-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-teal-800">
            {/* Header banner matching Image 10 */}
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-800/80 text-teal-200 text-xs font-bold border border-teal-700">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>সুস্থ দাঁত সুন্দর হাসি · আপনার সুন্দর হাসি আমার সেবা আপনার পাশে</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                ইকবাল ডেন্টাল কেয়ার — আমাদের সেবাসমূহ
              </h3>
              <p className="text-xs sm:text-sm text-teal-200 leading-relaxed">
                আপনার ও আপনার পরিবারের দাঁতের সার্বিক সেবায় আমরা আছি সবসময়। ডেন্টাল ক্লিনিক ১ ও ২ উভয় শাখাতেই এই ১০টি বিশেষায়িত চিকিৎসা প্রদান করা হয়।
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                  নির্দিষ্ট সেবার ওপর ক্লিক করে সম্পূর্ণ বিস্তারিত বিবরণ জানুন
                </span>
              </div>
            </div>

            {/* Flyer Banner Card & Official Poster Access */}
            <div className="mb-10 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-teal-300 shadow-md shrink-0 bg-slate-800">
                  <img
                    src="/assets/aistudio/IMG_20261026_205134_fce5fa9c.jpg"
                    alt="ইকবাল ডেন্টাল কেয়ার অফিসিয়াল ফ্লায়ার"
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setShowFlyerModal(true)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold tracking-wider text-teal-300 uppercase">অফিসিয়াল ব্যানার ও লিফলেট</span>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    ইকবাল ডেন্টাল কেয়ার পোস্টার ও গাইড
                  </h4>
                  <p className="text-xs text-slate-300">
                    আধুনিক প্রযুক্তিতে নির্ভুল ও নিরাপদ চিকিৎসা, ব্যথামুক্ত সেবা এবং সাশ্রয়ী মূল্য।
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFlyerModal(true)}
                  className="px-4 py-2 text-xs font-bold bg-white text-teal-950 hover:bg-teal-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-teal-800" />
                  <span>সম্পূর্ণ ব্যানার বড় করে দেখুন</span>
                </button>
                <a
                  href="tel:01812358839"
                  className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>কল: ০১৮১২-৩৫৮৮৩৯</span>
                </a>
              </div>
            </div>

            {/* 10 Distinct Service Cards (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {DENTAL_SERVICES_DATA.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className="bg-white rounded-xl p-4 text-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group border border-slate-100"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Number badge + Icon */}
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-900 font-black text-xs flex items-center justify-center border border-teal-200 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        {service.number}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {renderServiceIcon(service.iconType, 'w-4 h-4')}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                        {service.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {service.subtitle}
                      </p>
                    </div>

                    {/* Short Description */}
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                      {service.shortDesc}
                    </p>
                  </div>

                  {/* Bottom Action Hint */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-teal-700 group-hover:text-teal-900">
                    <span>বিস্তারিত দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Special Highlight Box: ক্যাপ ও ব্রিজ, ব্যথামুক্ত চিকিৎসা, পরিষ্কার-পরিচ্ছন্ন ক্লিনিক */}
            <div className="mt-8 pt-8 border-t border-teal-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-teal-900/60 p-4 rounded-xl border border-teal-700/60 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>ক্যাপ ও ব্রিজ বিশেষজ্ঞ সেবা</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  ডেন্টাল ক্যাপ (ক্রাউন) ও ডেন্টাল ব্রিজ (দাঁত সংযোগ) অত্যন্ত নিখুঁত ও ন্যাচারাল ফিনিশিংয়ে তৈরি করা হয়।
                </p>
              </div>

              <div className="bg-teal-900/60 p-4 rounded-xl border border-teal-700/60 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>আধুনিক ও সম্পূর্ণ পরিষ্কার-পরিচ্ছন্ন ক্লিনিক</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  ১০০% অটোক্লেভ জীবাণুমুক্ত যন্ত্রপাতি ও আন্তর্জাতিক মানের স্বাস্থ্যবিধি মেনে প্রতিটি চিকিৎসা পরিচালনা।
                </p>
              </div>

              <div className="bg-teal-900/60 p-4 rounded-xl border border-teal-700/60 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>ব্যথামুক্ত চিকিৎসা ও সাশ্রয়ী মূল্য</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  মৃদু অসাড়করণ পদ্ধতিতে ব্যথাহীন ডেন্টাল ট্রিটমেন্ট এবং সাধারণ মানুষের সাধ্যের মধ্যে ন্যায্য মূল্য।
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* 5. Online Appointment & Consultation Inquiry Form */}
        <section id="contact" className="scroll-mt-20">
          <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-teal-900/50">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                  অনলাইন অনুসন্ধান ও সরাসরি সিরিয়াল বুকিং
                </span>
                <h3 className="text-xl sm:text-3xl font-black">
                  ডাক্তার দেখাতে বা পরামর্শ নিতে তথ্য দিন
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  নিচের ফর্মটি পূরণ করে পাঠান। আমাদের টিম অতি দ্রুত আপনার সাথে ফোনে বা হোয়াটসঅ্যাপে যোগাযোগ করে সিরিয়াল নিশ্চিত করবে।
                </p>
              </div>

              {inquirySent && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ধন্যবাদ! আপনার বার্তা সরাসরি পাঠানো হয়েছে। শীঘ্রই কল দেওয়া হবে।</span>
                </div>
              )}

              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      রোগীর নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="যেমন: মোহাম্মদ রাশেদ"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="018XXXXXXXX"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      কোন প্রতিষ্ঠানে সেবা নিতে চান?
                    </label>
                    <select
                      value={targetFacility}
                      onChange={(e) => setTargetFacility(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="ইকবাল ফার্মেসী">ইকবাল ফার্মেসী (চন্দ্রগঞ্জ, লক্ষ্মীপুর)</option>
                      <option value="ইকবাল ডেন্টাল কেয়ার-১">ইকবাল ডেন্টাল কেয়ার-১ (চন্দ্রগঞ্জ, লক্ষ্মীপুর)</option>
                      <option value="ইকবাল ডেন্টাল কেয়ার-২">ইকবাল ডেন্টাল কেয়ার-২ (ওদারহাট, নোয়াখালী)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      সমস্যার বিবরণ বা সেবার নাম
                    </label>
                    <input
                      type="text"
                      value={patientMessage}
                      onChange={(e) => setPatientMessage(e.target.value)}
                      placeholder="যেমন: স্কেলিং / রুট ক্যানাল / দাঁতে ব্যথা"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-3 px-6 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>হোয়াটসঅ্যাপে সরাসরি সিরিয়াল বুকিং পাঠান</span>
                  </button>
                  <a
                    href="tel:01812358839"
                    className="w-full sm:w-auto py-3 px-5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-teal-400" />
                    <span>সরাসরি কল: ০১৮১২-৩৫৮৮৩৯</span>
                  </a>
                </div>
              </form>
            </div>
          </div>
        </section>

      </div>

      {/* Detailed Service Modal Dialog (Opens when any of the 10 service cards is clicked) */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center border border-white/20 shrink-0">
                  {renderServiceIcon(selectedService.iconType, 'w-6 h-6')}
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-700 text-[10px] font-bold text-teal-100 uppercase tracking-wider mb-1">
                    সেবা নং {selectedService.number} · {selectedService.category}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black leading-tight text-white">
                    {selectedService.title}
                  </h3>
                  <p className="text-xs text-teal-200">
                    {selectedService.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="p-1.5 rounded-lg bg-teal-950/40 text-teal-200 hover:text-white hover:bg-teal-950/60 transition-colors cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700">
              {/* Detailed Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>চিকিৎসার বিস্তারিত বিবরণ</span>
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {selectedService.detailedDesc}
                </p>
              </div>

              {/* Symptoms / When Needed */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  কখন এই চিকিৎসা গ্রহণ করবেন?
                </h4>
                <ul className="space-y-1.5">
                  {selectedService.symptoms.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/60">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-800 text-xs">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Procedure Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  চিকিৎসার ধাপ বা প্রক্রিয়া
                </h4>
                <div className="space-y-1.5">
                  {selectedService.procedureSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  প্রধান সুবিধা ও উপকারিতা
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {selectedService.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing & Care Advice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase">চিকিৎসার সময়কাল</span>
                  <span className="text-xs font-black text-slate-900">{selectedService.duration}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase">উপলব্ধ শাখা</span>
                  <span className="text-xs font-black text-teal-800">শাখা ১ ও শাখা ২ উভয়টিতে</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <strong className="block font-bold">পরামর্শ ও সতর্কতা:</strong>
                <p>{selectedService.careAdvice}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleBookSpecificService(selectedService)}
                className="w-full sm:flex-1 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>এই সেবার জন্য সিরিয়াল নিন</span>
              </button>
              <a
                href="tel:01812358839"
                className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>সরাসরি কল: ০১৮১২-৩৫৮৮৩৯</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Flyer Lightbox Modal */}
      {showFlyerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-700 overflow-hidden my-6">
            <div className="bg-teal-900 text-white px-4 py-3 flex items-center justify-between border-b border-teal-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold">ইকবাল ডেন্টাল কেয়ার — অফিশিয়াল পোস্টার ও সেবাসমূহ</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowFlyerModal(false)}
                className="p-1 rounded-md text-teal-200 hover:text-white hover:bg-teal-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4 bg-slate-900 max-h-[80vh] overflow-y-auto flex items-center justify-center">
              <img
                src="/assets/aistudio/IMG_20261026_205134_fce5fa9c.jpg"
                alt="ইকবাল ডেন্টাল কেয়ার ফুল ফ্লায়ার"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-100 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">হটলাইন: ০১৮১২-৩৫৮৮৩৯</span>
              <button
                type="button"
                onClick={() => setShowFlyerModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-md font-bold text-xs hover:bg-slate-900 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Footer (Strictly Informational - Zero Admin / Dashboard Links) */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-slate-200 text-sm">
              ইকবাল হেলথকেয়ার নেটওয়ার্ক
            </p>
            <p className="text-slate-400 text-xs">
              ইকবাল ফার্মেসী · ইকবাল ডেন্টাল কেয়ার-১ · ইকবাল ডেন্টাল কেয়ার-২
            </p>
          </div>
          <div className="space-y-1 text-center sm:text-right">
            <p className="text-slate-300 font-semibold">
              জরুরি হটলাইন: <a href="tel:01812358839" className="text-teal-400 font-bold hover:underline">০১৮১২-৩৫৮৮৩৯</a>
            </p>
            <p className="text-slate-500 text-[11px]">
              © ২০২৬ ইকবাল হেলথকেয়ার। সকল অধিকার সংরক্ষিত।
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
