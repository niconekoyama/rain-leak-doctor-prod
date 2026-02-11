'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Phone, Mail, MessageCircle, CheckCircle, Clock, Shield, Camera,
  Thermometer, Anchor, Menu, X, ArrowRight, Star, MapPin, Facebook,
  Twitter, Instagram, Youtube, QrCode
} from 'lucide-react';

/* ─── CDN画像URL ─── */
const DROCO_ICON_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/ELNpEvIEfboRmDZK.JPG";
const LIXIL_BADGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/wfZmTUcclzuIfRlQ.jpg";
const APP_SCREEN_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/oylOHNGclDdJmgSY.png";
const LINE_QR_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/sinUyDDoZiwkuSTf.png";
const LINE_URL = "https://lin.ee/ioKJtwL";

/* 事例画像 */
const CASE1_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/exsGOXOrEctfStxs.jpg";
const CASE2_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/hltxasSSptiKyZMB.jpg";

/* 技術画像 */
const TECH1_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/RciaIHwWHJzzLEMm.jpg";
const TECH2_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/LVAFAVIkukHzqdOP.jpg";
const TECH3_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663225698766/RCnTtXAwkPEPRuOc.jpg";

/* ─── カウントアップフック ─── */
function useCountUp({ end, duration = 2000, decimals = 0 }: { end: number; duration?: number; decimals?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(parseFloat((eased * end).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, decimals]);

  return { ref, displayValue: decimals > 0 ? value.toFixed(decimals) : value };
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      const headerHeight = isScrolled ? 64 : 80;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ═══════════ Header ═══════════ */}
      <header className={`fixed top-0 z-50 w-full transition-all duration-300 border-b ${isScrolled ? 'h-16 bg-white/90 backdrop-blur-md shadow-sm border-slate-200' : 'h-20 bg-transparent border-transparent'}`}>
        <div className="container flex h-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white font-bold ${isScrolled ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}>
              AI
            </div>
            <span className={`font-bold tracking-tight ${isScrolled ? 'text-lg text-primary' : 'text-xl text-white'}`}>
              雨漏りドクター
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['サービス', '料金', '事例', 'お客様の声'].map((item, i) => {
              const hrefs = ['#services', '#pricing', '#cases', '#testimonials'];
              return (
                <a key={i} href={hrefs[i]} onClick={(e) => smoothScroll(e, hrefs[i])} className={`text-sm font-bold transition-colors relative group ${isScrolled ? 'text-slate-600 hover:text-primary' : 'text-slate-100 hover:text-white'}`}>
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              className={`lg:hidden p-2 rounded-md ${!isScrolled ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <div className="hidden md:flex gap-3">
              <a href="tel:0120-410-654" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-bold border-2 transition-colors ${!isScrolled ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' : 'border-primary text-primary hover:bg-primary/5'}`}>
                <Phone className="h-4 w-4 mr-2" />
                0120-410-654
              </a>
              <Link href="/diagnosis" className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold bg-accent text-primary hover:bg-accent/90 shadow-lg shadow-accent/20 border-none transition-colors">
                <Camera className="h-4 w-4 mr-2" />
                AI診断 (無料)
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ Mobile Menu ═══════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-primary/90 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-3/4 max-w-sm bg-white shadow-2xl">
            <div className="flex flex-col p-6 h-full">
              <div className="flex justify-end mb-8">
                <button className="p-2 rounded-md hover:bg-slate-100" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-slate-500" />
                </button>
              </div>
              <nav className="flex flex-col space-y-6 text-center">
                {['サービス', '料金', '事例', 'お客様の声'].map((item, i) => {
                  const hrefs = ['#services', '#pricing', '#cases', '#testimonials'];
                  return (
                    <a key={i} href={hrefs[i]} onClick={(e) => smoothScroll(e, hrefs[i])} className="text-xl font-bold text-slate-700 hover:text-primary">
                      {item}
                    </a>
                  );
                })}
              </nav>
              <div className="mt-auto space-y-4">
                <Link href="/diagnosis" className="flex items-center justify-center w-full px-6 py-3 rounded-md bg-accent text-primary font-bold text-lg">
                  <Camera className="h-5 w-5 mr-2" /> AI診断を始める
                </Link>
                <a href={LINE_URL} className="flex items-center justify-center w-full px-6 py-3 rounded-md border-2 border-line text-line font-bold text-lg">
                  LINEで相談
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ Hero Section ═══════════ */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-primary">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-accent/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary"></div>
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                <span className="text-accent text-xs md:text-sm font-bold tracking-wide">最短48時間で現地対応可能</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.2] tracking-tight">
                雨漏り修繕の<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">「適正価格」</span>を<br />
                AIが算出します。
              </h1>

              <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                <strong className="text-white">AI＋職人</strong> のダブルチェックで、
                <span className="text-accent font-bold text-2xl mx-1">3分</span>で
                損をしない修繕費用がわかります。<br />
                大阪・京都・兵庫・奈良・滋賀・和歌山対応。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <Link href="/diagnosis" className="inline-flex items-center justify-center h-14 px-8 bg-accent text-primary hover:bg-accent/90 text-lg font-bold rounded-full shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] transition-all transform hover:-translate-y-1">
                  <Camera className="h-5 w-5 mr-2" />
                  無料でAI診断を試す
                </Link>
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-14 px-8 bg-transparent text-white border border-white/30 hover:bg-white/10 text-lg font-bold rounded-full transition-colors">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  LINEで相談
                </a>
              </div>

              <div className="pt-6 flex flex-wrap gap-4 justify-center lg:justify-start text-sm font-medium text-slate-300">
                {['見積だけOK', '無理な勧誘なし', '建設業許可取得済'].map((txt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent" /> {txt}
                  </div>
                ))}
              </div>

              {/* 提携先バッジ（控えめ） */}
              <div className="pt-2 flex items-center gap-2 justify-center lg:justify-start">
                <img src={LIXIL_BADGE_URL} alt="LIXILリフォームネット" className="w-5 h-5 rounded-sm object-contain opacity-60" />
                <span className="text-xs text-slate-400">LIXILリフォームネット加盟店</span>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-64 md:w-80 lg:w-96 aspect-[9/19] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden transform rotate-[-6deg] hover:rotate-0 transition-transform duration-700 z-10">
                <div className="absolute inset-0 bg-white">
                  <img src={APP_SCREEN_URL} alt="AI診断画面" className="w-full h-full object-cover" />
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/20 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-bold">AI診断完了</div>
                        <div className="text-sm font-black text-primary">¥58,000〜 修繕可能</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-accent/20 rounded-full blur-[80px] -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Stats Section ═══════════ */}
      <StatsSection />

      {/* ═══════════ Services (3つの約束) ═══════════ */}
      <section id="services" className="py-24 bg-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary mb-6">
              雨漏りドクター<br className="md:hidden" /> <span className="text-accent">3つの約束</span>
            </h2>
            <p className="text-slate-600 text-lg">
              透明性と技術力で、お客様に損をさせない修繕を実現します。<br />
              AIと職人の技術を組み合わせた新しい修理の形です。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { Icon: CheckCircle, title: "必要な工事だけ", desc: "過剰な提案は一切しません。AI診断と現地調査で根拠を明示し、本当に必要な箇所だけを修繕します。" },
              { Icon: Shield, title: "最適な手法だけ", desc: "ドローンは必要時のみ。サーモカメラ、散水試験など、建物に応じた最適な調査手法を選択します。" },
              { Icon: Camera, title: "証拠が残る", desc: "赤外線画像・散水動画・報告書で全て記録。保険申請にも使える詳細な証拠を提供します。" }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-md shadow-primary/20">
                  <item.Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Pricing Section ═══════════ */}
      <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block bg-accent text-primary px-3 py-1 rounded-full text-sm font-bold mb-4">明朗会計</span>
            <h2 className="text-3xl md:text-4xl font-black mb-4">追加費用のない安心料金</h2>
            <p className="text-slate-400">事前承認なしの追加費用は一切ありません。</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-accent font-bold text-lg mb-2">AI 3分診断</h3>
              <div className="text-4xl font-bold mt-2 mb-6">¥0</div>
              <ul className="space-y-3 text-sm text-slate-300 mb-6">
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-accent flex-shrink-0" /> 最短3分で結果表示</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-accent flex-shrink-0" /> 保険適用の目安判定</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-accent flex-shrink-0" /> 概算費用レンジ提示</li>
              </ul>
              <Link href="/diagnosis" className="block w-full text-center py-3 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors">
                今すぐ診断
              </Link>
            </div>

            {/* Light Plan */}
            <div className="bg-white rounded-xl p-6 text-slate-900 shadow-xl">
              <h3 className="text-primary font-bold text-lg mb-2">ライト現地診断</h3>
              <div className="text-4xl font-bold mt-2 mb-6">¥8,800</div>
              <ul className="space-y-3 text-sm text-slate-600 mb-6">
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> 平日9〜18時対応</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> 目視調査＋湿度計測</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> 簡易報告書（写真付）</li>
              </ul>
              <a href="tel:0120-410-654" className="block w-full text-center py-3 rounded-md border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors">
                予約する
              </a>
            </div>

            {/* Standard Plan (Featured) */}
            <div className="relative bg-primary rounded-xl p-6 text-white border-2 border-accent shadow-2xl scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-primary px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                人気 No.1
              </div>
              <h3 className="text-accent font-bold text-lg mb-2">スタンダード</h3>
              <div className="text-4xl font-bold mt-2 mb-6">¥33,000<span className="text-lg font-normal opacity-70">〜</span></div>
              <ul className="space-y-3 text-sm text-slate-100 mb-6">
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-accent flex-shrink-0" /> 赤外線サーモグラフィ</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-accent flex-shrink-0" /> 散水試験（漏水再現）</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-accent flex-shrink-0" /> 保険申請用報告書</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-accent flex-shrink-0" /> ドローン（必要時）</li>
              </ul>
              <a href="tel:0120-410-654" className="block w-full text-center py-3 rounded-md bg-accent text-primary hover:bg-accent/90 font-bold h-12 leading-6 transition-colors">
                予約する
              </a>
            </div>

            {/* Repair Plan */}
            <div className="bg-white rounded-xl p-6 text-slate-900 shadow-xl">
              <h3 className="text-primary font-bold text-lg mb-2">一次止水</h3>
              <div className="text-4xl font-bold mt-2 mb-6">¥22,000<span className="text-lg font-normal opacity-70">〜</span></div>
              <ul className="space-y-3 text-sm text-slate-600 mb-6">
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> 応急処置（72h以内）</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> シール打ち替え/防水</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0" /> 30日間無料再訪保証</li>
              </ul>
              <a href="tel:0120-410-654" className="block w-full text-center py-3 rounded-md border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors">
                今すぐ電話
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Steps Section ═══════════ */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary mb-4">5つのステップで安心修繕</h2>
            <p className="text-slate-600">AI診断から本復旧まで、一貫したサポート体制</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-slate-100 -z-0"></div>
            <div className="grid md:grid-cols-5 gap-8">
              {[
                { step: "01", title: "AI診断", desc: "写真3枚で概算。保険目安と費用レンジを即表示します。", time: "3分" },
                { step: "02", title: "日程確定", desc: "最短48hで現地訪問の日程を調整します。", time: "最短48h" },
                { step: "03", title: "現地診断", desc: "必要に応じドローン／サーモで原因を特定。", time: "即日〜" },
                { step: "04", title: "一次止水", desc: "原則72h以内を目指して応急処置を実施します。", time: "72h以内" },
                { step: "05", title: "本復旧", desc: "報告書を納品し、根本修繕を実施します。", time: "工事後" },
              ].map((item, i) => (
                <div key={i} className="relative bg-white md:bg-transparent pt-4 md:pt-0">
                  <div className="w-24 h-24 mx-auto bg-white border-4 border-primary rounded-full flex items-center justify-center text-2xl font-black text-primary shadow-lg mb-6 relative z-10">
                    {item.step}
                  </div>
                  <div className="text-center px-2">
                    <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                    <span className="inline-block mb-3 bg-accent/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{item.time}</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Cases Section ═══════════ */}
      <section id="cases" className="py-24 bg-slate-50">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-primary mb-4">修繕事例</h2>
              <p className="text-slate-600">証拠に基づく確実な診断と、再発を防ぐ根本修繕</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Case 1 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer border border-slate-100">
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img src={CASE1_IMG} alt="スレート屋根の割れ修繕" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute bottom-4 left-4 z-20 text-white">
                  <span className="inline-block bg-accent text-primary px-2 py-0.5 rounded text-xs font-bold mb-2">風災適用</span>
                  <h3 className="text-xl font-bold">スレート屋根の割れ修繕</h3>
                  <p className="text-sm opacity-90">大阪狭山市 / 費用 ¥58,000</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="block text-slate-400 text-xs">症状</span>
                    <span className="font-medium text-slate-700">天井のシミ、カビ臭</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs">処置</span>
                    <span className="font-medium text-slate-700">割れ補修＋棟板金</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 p-3 rounded-lg">
                  <Camera className="h-4 w-4" /> 証拠資料：サーモグラフィ、散水動画
                </div>
              </div>
            </div>

            {/* Case 2 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer border border-slate-100">
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img src={CASE2_IMG} alt="外壁シーリング打替え" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute bottom-4 left-4 z-20 text-white">
                  <span className="inline-block bg-accent text-primary px-2 py-0.5 rounded text-xs font-bold mb-2">全額適用</span>
                  <h3 className="text-xl font-bold">外壁シーリング打替え</h3>
                  <p className="text-sm opacity-90">尼崎市 / 費用 ¥98,000</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="block text-slate-400 text-xs">症状</span>
                    <span className="font-medium text-slate-700">サッシ周りの黒カビ</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs">処置</span>
                    <span className="font-medium text-slate-700">ロープ作業＋打替え</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 p-3 rounded-lg">
                  <Camera className="h-4 w-4" /> 証拠資料：ロープ撮影動画、劣化写真
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Tech Section ═══════════ */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary mb-4">技術と安全への取り組み</h2>
            <p className="text-slate-600">必要なツールだけを選択。事実ベースの報告書で確実にサポートします。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: TECH1_IMG, Icon: Thermometer, title: "赤外線サーモグラフィ", desc: "温度差で水の侵入経路を可視化。壁を壊さずに原因を特定します。" },
              { img: TECH2_IMG, Icon: Clock, title: "散水試験", desc: "実際に水をかけて漏水を再現。確実な原因特定が可能です。" },
              { img: TECH3_IMG, Icon: Anchor, title: "ロープアクセス", desc: "足場不要で安全に高所調査。住宅街でも近隣に迷惑をかけません。" }
            ].map((item, i) => (
              <div key={i} className="group text-center">
                <div className="relative overflow-hidden rounded-2xl mb-6 shadow-md aspect-video">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                  <item.Icon className="h-5 w-5 text-accent" /> {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Testimonials ═══════════ */}
      <section id="testimonials" className="py-24 bg-primary text-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">お客様の声</h2>
            <p className="text-slate-300">実際にご利用いただいたお客様からの声をご紹介します</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "M様", area: "大阪市旭区 / 50代女性", txt: "他社では屋根全体の葺き替えを提案されましたが、AI診断で部分修繕で済むと分かり、火災保険で全額カバーできました。" },
              { name: "T様", area: "大阪狭山市 / 40代男性", txt: "48時間以内に現地診断に来ていただき、72時間で一次止水を完了。迅速な対応と丁寧な説明で安心できました。" },
              { name: "K様", area: "尼崎市 / 60代女性", txt: "ロープアクセスで足場不要だったので、近所に迷惑をかけずに済みました。診断報告書も写真付きで詳しく信頼できました。" }
            ].map((item, i) => (
              <div key={i} className="bg-primary-dark rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 text-yellow-400 fill-current" />)}
                </div>
                <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{item.area}</p>
                <p className="text-sm leading-relaxed opacity-90">&ldquo;{item.txt}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ LINE Add Friend ═══════════ */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="rounded-xl p-6 bg-gradient-to-br from-line to-line-dark text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-40 h-40 bg-white rounded-lg p-3 flex items-center justify-center">
                  <img src={LINE_QR_URL} alt="LINE公式アカウントQRコード" className="w-full h-full object-contain rounded" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">LINE で診断結果を受け取る</h3>
                <p className="mb-4 opacity-90">
                  友だち追加すると、AI診断結果や予約確認をLINEで受け取れます。<br />
                  24時間365日、自動応答でご質問にお答えします。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-line rounded-md font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" />
                    友だち追加
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm opacity-90 text-center md:text-left">
                ✅ AI診断結果をLINEで即座に受信
                <span className="mx-2">|</span>
                ✅ 予約確認・リマインダー通知
                <span className="mx-2">|</span>
                ✅ 24時間自動応答
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Final CTA ═══════════ */}
      <section className="py-24 bg-gradient-to-br from-accent to-primary text-white text-center">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            写真3枚でOK。<br />今すぐAIが概算します。
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90 font-medium">
            スマホで撮って送るだけ。<br className="md:hidden" />最短3分で保険適用の目安まで分かります。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/diagnosis" className="inline-flex items-center justify-center h-16 px-8 text-xl font-bold bg-white text-primary hover:bg-slate-100 shadow-xl rounded-md transition-colors">
              <Camera className="h-6 w-6 mr-2" /> AI診断を始める (無料)
            </Link>
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-16 px-8 text-xl font-bold bg-line hover:bg-line-dark text-white shadow-xl rounded-md transition-colors">
              <MessageCircle className="h-6 w-6 mr-2" /> LINEで相談
            </a>
          </div>
          <div className="mt-8">
            <a href="tel:0120-410-654" className="inline-flex items-center text-white/80 hover:text-white font-bold transition-colors">
              <Phone className="h-5 w-5 mr-2" /> お電話での相談はこちら：0120-410-654
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="bg-primary-dark text-white">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* 会社情報 */}
            <div>
              <h3 className="text-lg font-bold mb-4">AI雨漏りドクター</h3>
              <p className="text-sm text-white/80 mb-4">
                AI技術と職人の経験を融合し、適正価格で確実な雨漏り修繕を提供します。
              </p>
            </div>

            {/* サービス */}
            <div>
              <h3 className="text-lg font-bold mb-4">サービス</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/diagnosis" className="text-white/80 hover:text-white transition-colors">AI診断</Link></li>
                <li><a href="#services" className="text-white/80 hover:text-white transition-colors">現地診断</a></li>
                <li><a href="#pricing" className="text-white/80 hover:text-white transition-colors">料金プラン</a></li>
                <li><a href="#cases" className="text-white/80 hover:text-white transition-colors">施工事例</a></li>
              </ul>
            </div>

            {/* 会社概要 */}
            <div>
              <h3 className="text-lg font-bold mb-4">会社概要</h3>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>〒535-0031<br />大阪府大阪市旭区高殿2-12-6</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>営業時間：9:00〜18:00<br />（土日祝も対応可）</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a href="tel:0120-410-654" className="hover:text-white transition-colors">0120-410-654</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a href="mailto:drone@loki-group.com" className="hover:text-white transition-colors">drone@loki-group.com</a>
                </li>
              </ul>
            </div>

            {/* 法的情報 */}
            <div>
              <h3 className="text-lg font-bold mb-4">法的情報</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-white/80 hover:text-white transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/terms" className="text-white/80 hover:text-white transition-colors">利用規約</Link></li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-white/60 mb-2">建設業許可</p>
                <p className="text-sm text-white/80">（般ー6）笖161998号</p>
              </div>
            </div>
          </div>
        </div>

        {/* コピーライト＋運営元＋提携先 */}
        <div className="border-t border-white/10">
          <div className="container py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-4">
              <div className="flex items-center gap-2">
                <img src={DROCO_ICON_URL} alt="ドロコ" className="w-6 h-6 rounded-sm object-contain" />
                <span className="text-xs text-white/50">運営：株式会社ドローン工務店</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={LIXIL_BADGE_URL} alt="LIXILリフォームネット" className="w-6 h-6 rounded-sm object-contain" />
                <span className="text-xs text-white/50">LIXILリフォームネット加盟店</span>
              </div>
            </div>
            <p className="text-center text-sm text-white/60">
              &copy; {new Date().getFullYear()} 株式会社ドローン工務店. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Stats Sub-component ─── */
function StatsSection() {
  const stat1 = useCountUp({ end: 1247, duration: 2000 });
  const stat2 = useCountUp({ end: 57, duration: 2000 });
  const stat3 = useCountUp({ end: 12, duration: 2000 });
  const stat4 = useCountUp({ end: 4.8, duration: 2000, decimals: 1 });

  return (
    <section className="relative -mt-10 z-20 container px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
          {[
            { ref: stat1.ref, val: stat1.displayValue, unit: "", label: "AI診断 累計" },
            { ref: stat2.ref, val: stat2.displayValue, unit: "分", label: "最短診断時間" },
            { ref: stat3.ref, val: stat3.displayValue, unit: "社", label: "提携職人" },
            { ref: stat4.ref, val: stat4.displayValue, unit: "", label: "Google評価" }
          ].map((item, i) => (
            <div key={i} ref={item.ref} className="text-center px-2">
              <div className="text-3xl md:text-4xl font-black text-primary">
                {item.val}<span className="text-lg font-bold ml-1">{item.unit}</span>
              </div>
              <div className="text-xs md:text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
