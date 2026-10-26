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
  PhoneCall
} from 'lucide-react';

export const PublicHealthcarePortal: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'pharmacy' | 'dental1' | 'dental2'>('all');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [targetFacility, setTargetFacility] = useState('ইকবাল ডেন্টাল কেয়ার-১');
  const [patientMessage, setPatientMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) return;

    // Build WhatsApp message link or simulate instant confirmed registration
    const text = encodeURIComponent(
      `নাম: ${patientName.trim()}\nমোবাইল: ${patientPhone.trim()}\nশাখা: ${targetFacility}\nসমস্যা/পরামর্শ: ${patientMessage.trim() || 'সাধারণ পরামর্শ'}`
    );
    const waUrl = `https://wa.me/8801812358839?text=${text}`;
    setInquirySent(true);
    setTimeout(() => {
      window.location.href = waUrl;
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Notification Bar */}
      <div className="bg-teal-900 text-teal-100 text-xs py-2 px-4 border-b border-teal-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">ইকবাল হেলথকেয়ার নেটওয়ার্ক · সার্বক্ষণিক আসল ঔষধ ও আধুনিক দন্ত চিকিৎসা সেবা</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <a href="tel:01812358839" className="hover:text-white flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-teal-300" />
              <span>জরুরি হটলাইন: ০১৮১২-৩৫৮৮৩৯</span>
            </a>
            <span className="hidden md:inline text-teal-400">|</span>
            <span className="hidden md:inline">২৪ ঘণ্টা সেবা উন্মুক্ত</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-2 bg-white rounded-xs"></div>
                <div className="w-2 h-5 bg-white rounded-xs absolute"></div>
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                ইকবাল হেলথকেয়ার
              </h1>
              <p className="text-[11px] font-semibold text-teal-700">
                ইকবাল ফার্মেসী ও ইকবাল ডেন্টাল কেয়ার (শাখা ১ ও ২)
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <a href="#pharmacy" className="hover:text-teal-700 transition-colors">ইকবাল ফার্মেসী</a>
            <a href="#dental1" className="hover:text-teal-700 transition-colors">ডেন্টাল কেয়ার-১</a>
            <a href="#dental2" className="hover:text-teal-700 transition-colors">ডেন্টাল কেয়ার-২</a>
            <a href="#services" className="hover:text-teal-700 transition-colors">সেবাসমূহ</a>
            <a href="#contact" className="hover:text-teal-700 transition-colors">যোগাযোগ ও সিরিয়াল</a>
          </nav>

          <a
            href="tel:01812358839"
            className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>সরাসরি কল করুন</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50/70 via-white to-slate-50 py-12 sm:py-16 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>ডিজিডিএ অনুমোদিত ড্রাগ লাইসেন্স ও অভিজ্ঞ দন্ত চিকিৎসকের তত্ত্বাবধানে পরিচালিত</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              আপনার ও আপনার পরিবারের জন্য বিশ্বস্ত ফার্মেসী ও বিশেষায়িত ডেন্টাল কেয়ার
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              ইকবাল হেলথকেয়ারে আমরা দিচ্ছি শতভাগ আসল ও সংরক্ষিত জীবনরক্ষাকারী ঔষধ, অভিজ্ঞ গ্র্যাজুয়েট দন্ত চিকিৎসকের চিকিৎসা এবং স্বাস্থ্যসেবার অনন্য নিশ্চয়তা।
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
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
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">১০০% আসল ঔষধ</p>
              <p className="text-xs text-slate-500">DGDA নিবন্ধিত কোম্পানি সরবরাহ</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">অভিজ্ঞ বিডিএস ডাক্তার</p>
              <p className="text-xs text-slate-500">আধুনিক দন্ত চিকিৎসা সেবা</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">২৪ ঘণ্টা সার্ভিস</p>
              <p className="text-xs text-slate-500">জরুরি সেবা ও ডেলিভারি</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">২টি ডেন্টাল শাখা</p>
              <p className="text-xs text-slate-500">শহরের সহজ ও সুবিধাজনক স্থানে</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Institutions Showcase */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* 1. Iqbal Pharmacy */}
        <section id="pharmacy" className="scroll-mt-20">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-teal-700 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 text-teal-100 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span>লাইসেন্সধারী মডেল ফার্মেসী</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-black tracking-tight">ইকবাল ফার্মেসী</h3>
                <p className="text-xs sm:text-sm text-teal-100">
                  সর্বাধিক ঔষধের সমৃদ্ধ স্টক, সঠিক তাপমাত্রা নিয়ন্ত্রণ ও বিশ্বস্ত ফার্মাসিউটিক্যাল সেবা
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-lg bg-white text-teal-800 font-bold text-xs shadow-xs">
                  ২৪ ঘণ্টা খোলা
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 border-b pb-2">আমাদের ফার্মেসীর বৈশিষ্ট্য ও সুবিধাসমূহ</h4>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>২১,০০০+ অনুমোদিত ঔষধের ক্যাটালগ:</strong> স্কয়ার, বেক্সিমকো, ইনসেপ্টা, রেনাটা, অপসোনিনসহ সকল শীর্ষ কোম্পানির ঔষধ।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>শীতাতপ নিয়ন্ত্রিত স্টোরেজ:</strong> ইনসুলিন, ভ্যাকসিন ও জীবনরক্ষাকারী ইনজেকশন সঠিক কুল চেইনে সংরক্ষিত।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>ডিজিটাল ক্যাশ মেমো:</strong> প্রতিটি ক্রয়ে স্বচ্ছ দাম ও বিস্তারিত ভাউচার প্রিন্ট সুবিধা।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>প্রেসক্রিপশন পরামর্শ:</strong> ঔষধ সেবনের সঠিক নিয়ম ও ডোজ বিষয়ক অভিজ্ঞ পরামর্শ।</span>
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
                      <span>প্রধান সড়ক, বাজার এলাকা, ইকবাল হেলথকেয়ার কমপ্লেক্স</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">ফোন / মোবাইল:</strong>
                      <a href="tel:01812358839" className="text-teal-700 font-bold hover:underline">০১৮১২-৩৫৮৮৩৯</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">সেবার সময়:</strong>
                      <span>২৪ ঘণ্টা দিন-রাত উন্মুক্ত (সপ্তাহে ৭ দিন)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">ড্রাগ লাইসেন্স নম্বর:</strong>
                      <span className="font-mono text-slate-800">DGDA-PL-2024-8839</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="tel:01812358839"
                    className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
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
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-100 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>শাখা ১ · বিশেষজ্ঞ ডেন্টাল ক্লিনিক</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-black tracking-tight">ইকবাল ডেন্টাল কেয়ার-১</h3>
                <p className="text-xs sm:text-sm text-indigo-100">
                  আধুনিক ডিজিটাল প্রযুক্তিতে নিখুঁত ও আরামদায়ক দাঁতের সব ধরনের চিকিৎসা
                </p>
              </div>
              <div className="shrink-0">
                <span className="px-3.5 py-1.5 rounded-lg bg-indigo-900 text-indigo-100 font-bold text-xs border border-indigo-700">
                  চেম্বার: বিকাল ৪টা - রাত ৯টা
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 border-b pb-2">ডেন্টাল কেয়ার-১ এর বিশেষায়িত সেবাসমূহ</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                    <strong className="text-indigo-900 block mb-1">স্কেলিং ও পলিশিং</strong>
                    <span>দাঁতের পাথর ও দুর্গন্ধ দূর করে মাড়ির সুস্থতা রক্ষা।</span>
                  </div>
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                    <strong className="text-indigo-900 block mb-1">রুট ক্যানেল ট্রিটমেন্ট (RCT)</strong>
                    <span>অত্যাধুনিক রোটারি সিস্টেমে দাঁত না ফেলে ব্যথাহীন সংরক্ষণ।</span>
                  </div>
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                    <strong className="text-indigo-900 block mb-1">লাইট কিউর ফিলিং</strong>
                    <span>দাঁতের রঙের সাথে মিলিয়ে প্রাকৃতিক ও স্থায়ী ফিলিং।</span>
                  </div>
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                    <strong className="text-indigo-900 block mb-1">ক্যাপ ও ব্রিজ (Crown & Bridge)</strong>
                    <span>পোরসেলিন ও জিরকোনিয়া ক্যাপের মাধ্যমে নিখুঁত দাঁত প্রতিস্থাপন।</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  * সম্পূর্ণ জীবাণুমুক্ত (Autoclaved) আধুনিক যন্ত্রপাতি দ্বারা প্রতিটি চিকিৎসা সম্পন্ন করা হয়।
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">চেম্বার ও সিরিয়াল গ্রহণের তথ্য</h4>
                <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">শাখা ১ ঠিকানা:</strong>
                      <span>ইকবাল কমপ্লেক্স (২য় তলা), ইকবাল ফার্মেসী সংলগ্ন</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">চিকিৎসক:</strong>
                      <span>অভিজ্ঞ বিডিএস (BDS), পিজিটি (ডেন্টাল সার্জারি) চিকিৎসকবৃন্দ</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">রোগী দেখার সময়:</strong>
                      <span>প্রতিদিন বিকাল ৪:০০ টা হতে রাত ৯:০০ টা পর্যন্ত (শুক্রবার সকাল ৯:০০ - দুপুর ১২:৩০)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">সিরিয়াল বুকিং:</strong>
                      <a href="tel:01812358839" className="text-indigo-700 font-bold hover:underline">০১৮১২-৩৫৮৮৩৯</a>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="tel:01812358839"
                    className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>শাখা-১ সিরিয়াল দিতে কল করুন</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Iqbal Dental Care - Branch 2 */}
        <section id="dental2" className="scroll-mt-20">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-800 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-100 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5 text-blue-300" />
                  <span>শাখা ২ · কসমেটিক ও অ্যাডভান্সড ডেন্টাল</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-black tracking-tight">ইকবাল ডেন্টাল কেয়ার-২</h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  দাঁতের সৌন্দর্য বর্ধন, আঁকাবাঁকা দাঁত সোজা করা ও বিশেষায়িত শিশু দন্ত চিকিৎসা
                </p>
              </div>
              <div className="shrink-0">
                <span className="px-3.5 py-1.5 rounded-lg bg-blue-900 text-blue-100 font-bold text-xs border border-blue-700">
                  চেম্বার: সকাল ১০টা - রাত ৮টা
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 border-b pb-2">ডেন্টাল কেয়ার-২ এর বিশেষ সুবিধাসমূহ</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                    <strong className="text-blue-900 block mb-1">অর্থোডন্টিক ব্রেসেস</strong>
                    <span>উঁচু-নিচু ও ফাঁকা দাঁত সোজা ও সুন্দর করার আধুনিক চিকিৎসা।</span>
                  </div>
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                    <strong className="text-blue-900 block mb-1">শিশুদের বিশেষ দন্ত সেবা</strong>
                    <span>ভয় ও ব্যথামুক্ত পরিবেশে শিশুদের দুধদাঁতের যত্ন ও চিকিৎসা।</span>
                  </div>
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                    <strong className="text-blue-900 block mb-1">স্মাইল ডিজাইন ও হোয়াইটনিং</strong>
                    <span>দাঁতের হলুদ ভাব দূর করে ঝকঝকে হাসির নিশ্চয়তা।</span>
                  </div>
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                    <strong className="text-blue-900 block mb-1">সার্জিক্যাল উইজডম এক্সট্রাকশন</strong>
                    <span>আক্কেল দাঁতের জটিল ব্যথা ও অস্ত্রোপচারহীন সমাধান।</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  * অত্যাধুনিক স্যানিটাইজেশন ও ডিজিটাল এক্স-রে রিপোর্ট তাৎক্ষণিক প্রদানের ব্যবস্থা রয়েছে।
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">শাখা ২ চেম্বার ও যোগাযোগের তথ্য</h4>
                <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">শাখা ২ ঠিকানা:</strong>
                      <span>সিটি প্লাজা মার্কেট (১ম তলা), স্টেশন রোড মোড়</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">কনসালট্যান্ট ডেন্টিস্ট:</strong>
                      <span>বিডিএস, পিজিটি (অর্থোডন্টিক্স ও ওরাল সার্জারি)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">রোগী দেখার সময়:</strong>
                      <span>প্রতিদিন সকাল ১০:০০ টা হতে দুপুর ২:০০ টা এবং বিকাল ৫:০০ টা হতে রাত ৮:৩০ টা</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900">সরাসরি বুকিং নম্বর:</strong>
                      <a href="tel:01812358839" className="text-blue-700 font-bold hover:underline">০১৮১২-৩৫৮৮৩৯</a>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="tel:01812358839"
                    className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>শাখা-২ সিরিয়াল দিতে কল করুন</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Combined Services & Doctor Schedule */}
        <section id="services" className="scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              আমাদের সকল স্বাস্থ্য ও চিকিৎসা সেবাসমূহ
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              একই নির্ভরযোগ্য নেটওয়ার্কে আপনার সম্পূর্ণ ঔষধ ও দাঁতের স্বাস্থ্য সুরক্ষা
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                💊
              </div>
              <h4 className="text-base font-bold text-slate-900">আসল ঔষধ ও জীবনরক্ষাকারী ইনজেকশন</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ডায়াবেটিস, প্রেশার, গ্যাস্ট্রিক, হৃদরোগ ও কিডনি চিকিৎসার সকল দেশি-বিদেশি জেনুইন ঔষধ সঠিক তাপমাত্রায় সার্বক্ষণিক মজুদ।
              </p>
              <div className="text-xs text-teal-700 font-semibold pt-1">
                স্থান: ইকবাল ফার্মেসী (২৪ ঘণ্টা)
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                🦷
              </div>
              <h4 className="text-base font-bold text-slate-900">দাঁতের সংরক্ষণ ও রুট ক্যানেল</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ব্যথাযুক্ত ও গর্ত হওয়া দাঁত তুলে না ফেলে দীর্ঘমেয়াদে ব্যবহারের উপযোগী করে তোলার সর্বাধুনিক রুট ক্যানেল ও ক্যাপ চিকিৎসা।
              </p>
              <div className="text-xs text-indigo-700 font-semibold pt-1">
                স্থান: ইকবাল ডেন্টাল কেয়ার-১
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                ✨
              </div>
              <h4 className="text-base font-bold text-slate-900">স্মাইল ডিজাইন ও আঁকাবাঁকা দাঁত</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                অর্থোডন্টিক ব্রেসেস ও কসমেটিক ফিলিংয়ের মাধ্যমে দাঁতের গঠন সুন্দর করে আকর্ষণীয় ও আত্মবিশ্বাসী হাসির পূর্ণাঙ্গ সলিউশন।
              </p>
              <div className="text-xs text-blue-700 font-semibold pt-1">
                স্থান: ইকবাল ডেন্টাল কেয়ার-২
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
                  অনলাইন অনুসন্ধান ও সরাসরি বুকিং
                </span>
                <h3 className="text-xl sm:text-3xl font-black">
                  ডাক্তার দেখাতে বা পরামর্শ নিতে তথ্য দিন
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  নিচের ফর্মটি পূরণ করে পাঠান। আমাদের টিম অতি দ্রুত আপনার সাথে যোগাযোগ করে সিরিয়াল নিশ্চিত করবে।
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
                      <option value="ইকবাল ফার্মেসী">ইকবাল ফার্মেসী (ঔষধ ও সাধারণ স্বাস্থ্য)</option>
                      <option value="ইকবাল ডেন্টাল কেয়ার-১">ইকবাল ডেন্টাল কেয়ার-১ (স্কেলিং ও রুট ক্যানেল)</option>
                      <option value="ইকবাল ডেন্টাল কেয়ার-২">ইকবাল ডেন্টাল কেয়ার-২ (ব্রেসেস ও বিশেষায়িত)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      সমস্যার বিবরণ / পরামর্শ
                    </label>
                    <input
                      type="text"
                      value={patientMessage}
                      onChange={(e) => setPatientMessage(e.target.value)}
                      placeholder="দাঁতে ব্যথা / স্কেলিং / ঔষধ খোঁজ"
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

      {/* Public Footer (Strictly Informational - No Admin/Dashboard Buttons) */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-slate-200 text-sm">
              ইকবাল হেলথকেয়ার গ্রুপ
            </p>
            <p className="text-slate-400">
              ইকবাল ফার্মেসী · ইকবাল ডেন্টাল কেয়ার-১ · ইকবাল ডেন্টাল কেয়ার-২
            </p>
          </div>
          <div className="space-y-1 text-center sm:text-right">
            <p className="text-slate-400">
              হটলাইন: <a href="tel:01812358839" className="text-teal-400 font-bold hover:underline">০১৮১২-৩৫৮৮৩৯</a>
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
