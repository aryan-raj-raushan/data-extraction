'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  GraduationCap,
  Phone,
  FileSpreadsheet,
  Database,
  MapPin,
  Search,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Zap,
  ShieldCheck,
  RefreshCw,
  IndianRupee,
  AlertTriangle,
  Wifi,
  WifiOff,
  TrendingDown,
  BarChart3,
  Clock,
  Users,
  Star,
  Building2,
  BookOpen,
  PhoneCall,
  Download,
  CloudOff,
  Layers,
  UserPlus,
  CalendarDays,
} from 'lucide-react';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const ORANGE = '#ea580c';
const INDIGO = '#4f46e5';
const ORANGE_LIGHT = '#fff7ed';
const INDIGO_LIGHT = '#eef2ff';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'restaurant' | 'school';

// ─── Animation helpers ────────────────────────────────────────────────────────
function AnimSection({
  children,
  className = '',
  delay = 0,
}: Readonly<{ children: React.ReactNode; className?: string; delay?: number }>) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Mode-aware accent ────────────────────────────────────────────────────────
function accent(mode: Mode) {
  return mode === 'restaurant' ? ORANGE : INDIGO;
}
function accentLight(mode: Mode) {
  return mode === 'restaurant' ? ORANGE_LIGHT : INDIGO_LIGHT;
}

// ─── Mode Toggle (reusable) ───────────────────────────────────────────────────
function ModeToggle({
  mode,
  onChange,
  size = 'md',
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  size?: 'sm' | 'md';
}) {
  const sm = size === 'sm';
  return (
    <div className={`inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm ${sm ? 'gap-0.5' : 'gap-1'}`}>
      {(['restaurant', 'school'] as Mode[]).map((m) => {
        const active = mode === m;
        const color = m === 'restaurant' ? ORANGE : INDIGO;
        const Icon = m === 'restaurant' ? UtensilsCrossed : GraduationCap;
        return (
          <motion.button
            key={m}
            onClick={() => onChange(m)}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1.5 rounded-lg font-semibold transition-all
              ${sm ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-[13px]'}
              ${active ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            style={active ? { background: color } : {}}
          >
            <Icon size={sm ? 11 : 14} />
            {m === 'restaurant' ? 'Restaurants' : 'Schools'}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── App Mockup ───────────────────────────────────────────────────────────────
function AppMockup({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const isRest = mode === 'restaurant';

  const places = isRest
    ? [
      { name: 'Spice Garden', area: 'Connaught Place, Delhi', rating: 4.7, phone: '+91 98104 55213', cached: true },
      { name: 'Bombay Bites', area: 'Bandra West, Mumbai', rating: 4.5, phone: null, cached: false },
      { name: 'South Tadka', area: 'Koramangala, Bengaluru', rating: 4.6, phone: '+91 80423 11092', cached: true },
      { name: 'Chai & More', area: 'Salt Lake, Kolkata', rating: 4.3, phone: null, cached: false },
    ]
    : [
      { name: 'Delhi Public School', area: 'Vasant Kunj, Delhi', rating: 4.8, phone: '+91 11 4051 8800', cached: true },
      { name: 'Ryan International', area: 'Andheri, Mumbai', rating: 4.6, phone: null, cached: false },
      { name: 'Baldwin Boys School', area: 'Bengaluru City', rating: 4.7, phone: '+91 80 2221 3483', cached: true },
      { name: 'La Martiniere', area: 'Hazratganj, Lucknow', rating: 4.5, phone: null, cached: false },
    ];

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden select-none">
      {/* Top bar */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-11 overflow-hidden rounded-md shadow-sm">
            <div className="flex w-5 items-center justify-center bg-orange-600">
              <UtensilsCrossed size={10} className="text-white" />
            </div>
            <div className="w-px bg-white/40" />
            <div className="flex w-5 items-center justify-center bg-indigo-600">
              <GraduationCap size={10} className="text-white" />
            </div>
          </div>
          <span className="text-[12px] font-bold text-gray-900">Place Finder</span>
        </div>
        <ModeToggle mode={mode} onChange={() => { }} size="sm" />
      </div>

      {/* Search bar mockup */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <MapPin size={11} className="text-gray-400 shrink-0" />
          <span className="text-[11px] text-gray-400">
            {isRest ? 'Koramangala, Bengaluru' : 'Vasant Kunj, New Delhi'}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: accentLight(mode), color: color }}
            >
              From cache
            </span>
          </div>
        </div>
      </div>

      {/* Cards list */}
      <div className="flex flex-col divide-y divide-gray-100">
        {places.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: accentLight(mode) }}
            >
              {isRest
                ? <UtensilsCrossed size={12} style={{ color }} />
                : <GraduationCap size={12} style={{ color }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11.5px] font-semibold text-gray-900 truncate">{p.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{p.area}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-500">
                <Star size={9} className="fill-amber-400 text-amber-400" />
                {p.rating}
              </span>
              {p.phone ? (
                <span
                  className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
                  style={{ background: accentLight(mode), color }}
                >
                  {p.phone.slice(-8)}
                </span>
              ) : (
                <button className="text-[9px] font-semibold px-2 py-0.5 rounded border text-gray-400 border-gray-200 hover:border-gray-400 transition-colors">
                  Extract Number
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">4 results · 2 numbers extracted</span>
        <div className="flex items-center gap-1.5">
          <button
            className="flex items-center gap-1 text-[10px] font-semibold rounded-md px-2 py-1 text-white"
            style={{ background: color }}
          >
            <Download size={9} />
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ isLoggedIn, mode, setMode }: Readonly<{ isLoggedIn: boolean; mode: Mode; setMode: (m: Mode) => void }>) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-16 ${scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-gray-100' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-14 overflow-hidden rounded-lg shadow-sm">
            <div className="flex w-6 items-center justify-center bg-orange-600">
              <UtensilsCrossed size={12} className="text-white" />
            </div>
            <div className="w-px bg-white/30" />
            <div className="flex w-7 items-center justify-center bg-indigo-600">
              <GraduationCap size={12} className="text-white" />
            </div>
          </div>
          <span className="font-bold text-[15px] text-gray-900 tracking-tight">
            Place<span style={{ color: accent(mode) }}>Finder</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {[['#features', 'Features'], ['#savings', 'Cost Savings'], ['#coverage', 'Coverage'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="px-3 py-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
              {label}
            </a>
          ))}
          <div className="ml-4 mr-3">
            <ModeToggle mode={mode} onChange={setMode} size="sm" />
          </div>
          <a
            href={isLoggedIn ? '/finder' : '/login'}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${INDIGO} 100%)` }}
          >
            {isLoggedIn ? 'Dashboard →' : 'Get Started →'}
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ isLoggedIn, mode, setMode }: Readonly<{ isLoggedIn: boolean; mode: Mode; setMode: (m: Mode) => void }>) {
  const color = accent(mode);
  const isRest = mode === 'restaurant';

  return (
    <section className="relative min-h-screen bg-white flex items-center overflow-hidden px-6 lg:px-16 pt-20 pb-16">
      <div className="absolute top-16 left-0 right-0 h-px bg-gray-100" />
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <AnimatePresence>
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.035 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: color }}
        />
      </AnimatePresence>

      <div className="max-w-6xl mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <ModeToggle mode={mode} onChange={setMode} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 text-[11px] font-semibold tracking-widest uppercase border"
                style={{ borderColor: color, color, background: accentLight(mode) }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                {isRest ? 'Restaurant Discovery · India' : 'School Discovery · India'}
              </div>

              <h1 className="text-[3rem] lg:text-[3.8rem] font-black text-gray-900 leading-[1.0] tracking-tight mb-6">
                {isRest ? (
                  <>Find the best<br /><span style={{ color }}>restaurants.</span><br />Get their numbers.</>
                ) : (
                  <>Find the best<br /><span style={{ color }}>schools.</span><br />Get their numbers.</>
                )}
              </h1>

              <p className="text-[16px] text-gray-500 leading-relaxed mb-8 max-w-[460px]">
                {isRest
                  ? 'Search any state, city, or area in India. Get top-rated restaurants, extract contact numbers on demand, export to Excel — all with intelligent caching that slashes your Google API costs.'
                  : 'Search any state, city, or area in India. Get top-rated schools, extract contact numbers on demand, export to Excel — all with intelligent caching that slashes your Google API costs.'}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="flex flex-wrap gap-3 mb-12"
          >
            <a
              href={isLoggedIn ? '/finder' : '/login'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${INDIGO} 100%)` }}
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Start Exploring Free'}
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-medium text-gray-700 border border-gray-200 hover:border-gray-400 transition-colors bg-white"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-8 pt-8 border-t border-gray-100"
          >
            {[
              { val: 28, suf: '+', label: 'Indian states covered' },
              { val: 5000, suf: '+', label: 'Cities & areas indexed' },
              { val: 86, suf: '%', label: 'Avg. API cost saved via cache' },
              { val: 1200, suf: '+', label: 'Active users' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[22px] font-black text-gray-900 tracking-tight leading-none">
                  <CountUp end={s.val} suffix={s.suf} />
                </span>
                <span className="text-[11px] text-gray-400 mt-1">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
              >
                <AppMockup mode={mode} />
              </motion.div>
            </AnimatePresence>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 bg-gray-900 text-white rounded-xl px-3 py-2 text-[11px] font-medium shadow-xl flex items-center gap-1.5"
            >
              <Database className="w-3 h-3 text-green-400" />
              Served from cache · ₹0 API cost
            </motion.div>

            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.6 }}
              className="absolute -bottom-3 -left-4 bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2 text-[11px] font-medium shadow-xl flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3" style={{ color }} />
              Number extracted &amp; saved to DB
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── State ticker ─────────────────────────────────────────────────────────────
function StateTicker() {
  const states = [
    'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana',
    'Uttar Pradesh', 'Gujarat', 'Rajasthan', 'West Bengal', 'Kerala',
    'Madhya Pradesh', 'Punjab', 'Haryana', 'Bihar', 'Odisha',
    'Assam', 'Jharkhand', 'Uttarakhand', 'Himachal Pradesh', 'Goa',
    'Chhattisgarh', 'Chandigarh', 'J&K', 'Andhra Pradesh', 'Tripura',
  ];
  return (
    <div className="border-y border-gray-100 overflow-hidden py-3 bg-gray-50">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
        className="flex whitespace-nowrap"
      >
        {[...states, ...states].map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-5 text-[11px] text-gray-400 font-medium">
            <MapPin size={8} className="text-gray-300" />
            {s}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: RefreshCw,
    title: 'Mode Toggle — Restaurants or Schools',
    spec: 'One switch, full context change',
    desc: 'Switch between restaurant discovery and school discovery with a single click. The entire UI — cards, icons, filters, export columns — adapts to the selected mode instantly.',
    points: [
      'Restaurants mode: cuisine, rating, price range',
      'Schools mode: board, type (CBSE/ICSE/IB), grade',
      'Both modes share identical search & export UX',
      'Toggle is available globally on every screen',
    ],
  },
  {
    Icon: Phone,
    title: 'On-Demand Phone Number Extraction',
    spec: 'Per place, one click',
    desc: 'Numbers are not fetched by default — saving you the cost of a Google Place Details API call on every result. Click "Extract Number" on any card to pull and permanently save that number.',
    points: [
      'Calls Place Details API only when you request it',
      'Number saved to DB — never fetched twice',
      'Displayed instantly for cached numbers',
      'Works for both restaurants and schools',
    ],
  },
  {
    Icon: FileSpreadsheet,
    title: 'Quick Excel Export',
    spec: 'Whatever is on screen → .xlsx',
    desc: 'See a list of schools in Koramangala? Export it. Have numbers extracted for 12 restaurants in Bandra? Export that too. One click exports exactly what you see — including all extracted numbers.',
    points: [
      'Exports name, address, rating, phone, type',
      'Works mid-search, no need to wait for full data',
      'Clean column headers, ready for CRM import',
      'No account upgrade needed for exports',
    ],
  },
  {
    Icon: Database,
    title: 'Smart Caching — Search Once, Pay Once',
    spec: 'Saves up to 86% on API costs',
    desc: 'Every Places API search result is written to our database immediately. Future searches for the same city/area pull from our DB — not from Google — so the cost is borne once, shared by all.',
    points: [
      'Results cached per state → city → area path',
      'Phone numbers cached on extraction permanently',
      'Cache survives tab close, network drops, restarts',
      'Shared cache means your whole team benefits too',
    ],
  },
  {
    Icon: MapPin,
    title: 'Full India Coverage — State → City → Area',
    spec: '28 states · 500+ cities · 5,000+ areas',
    desc: 'Browse India\'s full administrative hierarchy — pick a state, drill into a city, then narrow to an area. Or type directly in the search bar. Every tier-1, tier-2, and tier-3 city included.',
    points: [
      'Visual card grid: click to drill down',
      'Search bar autocomplete across all levels',
      'Area-level precision (e.g. Koramangala Block 5)',
      'New areas added weekly from live data',
    ],
  },
  {
    Icon: Zap,
    title: 'Instant Results, Zero Wait',
    spec: 'Cache hit: < 300ms',
    desc: 'On cache hit, your results appear in under 300 milliseconds. On a fresh area search, Google API responds in 1–2 seconds, writes to cache, and every future user in that area is instant.',
    points: [
      'Cache-hit latency: avg. 280ms',
      'Fresh API search: avg. 1.4 seconds',
      'Partial results shown while loading',
      'Offline-safe: cached data loads without internet',
    ],
  },
];

function Features({ mode }: { mode: Mode }) {
  const color = accent(mode);
  return (
    <section id="features" className="bg-white py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <AnimSection className="mb-16">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>
            Platform Features
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Built for discovery teams,
            <br />
            not casual browsers.
          </h2>
          <p className="text-[15px] text-gray-500 mt-3 max-w-lg">
            Every feature is designed around one goal: help you find, contact, and export places faster — without burning your Google API budget.
          </p>
        </AnimSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, spec, desc, points }, i) => (
            <AnimSection key={i} delay={i * 0.05}>
              <div className="border border-gray-200 rounded-2xl p-7 h-full flex flex-col hover:border-gray-400 transition-colors">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                  <span className="text-[10px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: accentLight(mode), color }}>
                    {spec}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-[12.5px] text-gray-500 leading-relaxed mb-5 flex-1">{desc}</p>
                <ul className="border-t border-gray-100 pt-4 flex flex-col gap-1.5">
                  {points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-[12px] text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Cost Savings Section ─────────────────────────────────────────────────────
function CostSavings({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');

  // Pricing constants
  const SEARCH_COST = 2.69;   // ₹ per Places Nearby Search call
  const DETAIL_COST = 1.43;   // ₹ per Place Details call
  const WORKING_DAYS = 22;

  // Team scenario: 6 people, 200 searches/person/day, 150 numbers/day
  const TEAM_SIZE = 6;
  const SEARCHES_PER_PERSON = 200;
  const NUMBERS_PER_DAY = 150;

  // Team A (raw API): everyone pays their own search cost, full details cost, restarts, overlap
  const teamASearchDaily = TEAM_SIZE * SEARCHES_PER_PERSON * SEARCH_COST;
  const teamADetailDaily = NUMBERS_PER_DAY * DETAIL_COST;
  const teamARestartWeekly = 3 * TEAM_SIZE * SEARCH_COST; // ~3 restarts/person/week
  const teamAOverlapDaily = 2 * SEARCHES_PER_PERSON * SEARCH_COST; // 2 members overlap same city
  const teamADaily = teamASearchDaily + teamADetailDaily + teamAOverlapDaily;
  const teamAMonthly = (teamADaily * WORKING_DAYS) + (teamARestartWeekly * 4.4);

  // Team B (PlaceFinder): only 1 search per area hits API (cache hit ~85%), details only first time
  const teamBSearchDaily = SEARCHES_PER_PERSON * SEARCH_COST + (TEAM_SIZE - 1) * SEARCHES_PER_PERSON * 0.15 * SEARCH_COST;
  const teamBDetailDaily = NUMBERS_PER_DAY * DETAIL_COST * 0.05; // 95% already cached
  const teamBDaily = teamBSearchDaily + teamBDetailDaily;
  const teamBMonthly = teamBDaily * WORKING_DAYS;

  const savedMonthly = teamAMonthly - teamBMonthly;
  const savedAnnual = savedMonthly * 12;
  const pctSaved = Math.round((savedMonthly / teamAMonthly) * 100);

  const teamASteps = [
    {
      Icon: Search,
      label: `${TEAM_SIZE} team members each search ${SEARCHES_PER_PERSON} places in their area`,
      note: `${TEAM_SIZE} searches × ₹${SEARCH_COST} = ₹${(TEAM_SIZE * SEARCH_COST).toFixed(2)}/day in search API calls alone`,
      cost: `₹${(TEAM_SIZE * SEARCHES_PER_PERSON * SEARCH_COST).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day`,
      bad: false,
    },
    {
      Icon: Phone,
      label: `${NUMBERS_PER_DAY} contact numbers extracted across the team`,
      note: `${NUMBERS_PER_DAY} Place Details calls × ₹${DETAIL_COST} = ₹${(NUMBERS_PER_DAY * DETAIL_COST).toFixed(2)}/day`,
      cost: `₹${(NUMBERS_PER_DAY * DETAIL_COST).toFixed(2)}/day`,
      bad: false,
    },
    {
      Icon: RefreshCw,
      label: 'New team member searches the same metro cities',
      note: 'No shared cache — full API cost again. Identical data, double spend.',
      cost: `+₹${(2 * SEARCHES_PER_PERSON * SEARCH_COST).toFixed(2)}/day`,
      bad: true,
    },
    {
      Icon: WifiOff,
      label: 'Browser tab crash or network drop mid-session',
      note: `~3 restarts/person/week. Each restart is a full API call. ${TEAM_SIZE} people = ₹${teamARestartWeekly.toFixed(2)}/week wasted.`,
      cost: `+₹${teamARestartWeekly.toFixed(2)}/week`,
      bad: true,
    },
    {
      Icon: CalendarDays,
      label: 'Monday — same team, same cities, same API bill',
      note: 'No memory. No cache. Every week starts from zero. Forever.',
      cost: `₹${Math.round(teamADaily).toLocaleString('en-IN')}/day, every day`,
      bad: true,
    },
  ];

  const teamBSteps = [
    {
      Icon: Search,
      label: 'Day 1: first team member searches each area',
      note: 'API call happens once. Results written to shared DB instantly.',
      cost: `₹${SEARCH_COST}/area`,
      bad: false,
    },
    {
      Icon: Database,
      label: 'Members 2–6 search the same areas — served from cache',
      note: '5 of 6 searches: ₹0. One API call, six users benefit. Shared DB.',
      cost: '₹0 × 5 people',
      bad: false,
    },
    {
      Icon: Phone,
      label: `${NUMBERS_PER_DAY} contact numbers extracted — saved permanently`,
      note: 'Each number stored against its place_id. Never fetched twice, by anyone.',
      cost: `₹${(NUMBERS_PER_DAY * DETAIL_COST).toFixed(2)} once`,
      bad: false,
    },
    {
      Icon: UserPlus,
      label: 'New team member joins — gets all cached data instantly',
      note: 'Every result, every number already in DB. Zero additional API cost.',
      cost: '₹0',
      bad: false,
    },
    {
      Icon: CalendarDays,
      label: 'Monday, Tuesday, every week — same data, ₹0 repeats',
      note: 'Only genuinely new areas (~15% of searches) hit the API. Everything else: free.',
      cost: '~₹0 repeats',
      bad: false,
    },
  ];

  const activeSteps = activeTeam === 'A' ? teamASteps : teamBSteps;

  // Calculator state
  const [calcTeam, setCalcTeam] = useState(6);
  const [calcSearches, setCalcSearches] = useState(200);
  const [calcNumbers, setCalcNumbers] = useState(150);
  const [calcCache, setCalcCache] = useState(80);

  const calcRawMonthly = (calcTeam * calcSearches * SEARCH_COST + calcNumbers * DETAIL_COST) * WORKING_DAYS;
  const calcPFMonthly = (calcTeam * calcSearches * ((100 - calcCache) / 100) * SEARCH_COST + calcNumbers * DETAIL_COST * 0.05) * WORKING_DAYS;
  const calcSavedMonthly = calcRawMonthly - calcPFMonthly;
  const calcSavedAnnual = calcSavedMonthly * 12;
  const calcPct = Math.round((calcSavedMonthly / calcRawMonthly) * 100);

  return (
    <section id="savings" className="bg-gray-900 py-24 px-6 lg:px-16">
      <div className="max-w-5xl mx-auto">
        <AnimSection className="mb-14">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>
            API Cost Intelligence
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight max-w-2xl">
            Google API costs scale with your team.
            <br />
            Our cache doesn't.
          </h2>
          <p className="text-[15px] text-gray-400 mt-4 max-w-xl leading-relaxed">
            Two 6-person sales teams. Same workflow: 200 places searched per day, 150 numbers extracted.
            One uses raw Google API. One uses PlaceFinder. Here's exactly what happens to their bill.
          </p>
        </AnimSection>

        {/* API Pricing Reference */}
        <AnimSection className="mb-10">
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {[
              { label: 'Places Nearby Search', usd: '$32 / 1,000 calls', inr: `≈ ₹${SEARCH_COST} per search`, icon: Search },
              { label: 'Place Details (phone #)', usd: '$17 / 1,000 calls', inr: `≈ ₹${DETAIL_COST} per number`, icon: PhoneCall },
            ].map(({ label, usd, inr, icon: Icon }, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <Icon className="w-4 h-4 text-gray-500 mb-3" />
                <div className="text-[12px] font-semibold text-gray-300 mb-1">{label}</div>
                <div className="text-[11px] text-gray-500">{usd}</div>
                <div className="text-[13px] font-black mt-1" style={{ color }}>{inr}</div>
              </div>
            ))}
          </div>
        </AnimSection>

        {/* Team Toggle */}
        <AnimSection className="mb-6">
          <p className="text-[11px] text-gray-500 mb-3 uppercase tracking-widest font-semibold">Select a team to inspect</p>
          <div className="inline-flex rounded-xl border border-gray-700 bg-gray-800 p-1 gap-1">
            <button
              onClick={() => setActiveTeam('A')}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activeTeam === 'A' ? 'bg-red-900/60 text-red-300 border border-red-800' : 'text-gray-400 hover:text-gray-200'}`}
            >
              ❌ Team A — Raw Google API
            </button>
            <button
              onClick={() => setActiveTeam('B')}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activeTeam === 'B' ? 'bg-green-900/40 text-green-300 border border-green-800' : 'text-gray-400 hover:text-gray-200'}`}
            >
              ✅ Team B — PlaceFinder
            </button>
          </div>
          <p className="text-[12px] text-gray-600 mt-3">
            {activeTeam === 'A'
              ? '6 people · 200 searches/person/day · 150 numbers extracted daily · no shared cache'
              : '6 people · 200 searches/person/day · 150 numbers extracted daily · shared DB cache'}
          </p>
        </AnimSection>

        {/* Steps */}
        <AnimSection>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTeam}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-2 mb-8"
            >
              {activeSteps.map(({ Icon, label, note, cost, bad }, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-xl border px-5 py-3.5 transition-colors ${bad ? 'border-red-900/60 bg-red-950/40' : 'border-gray-700 bg-gray-800'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bad ? 'bg-red-900/50' : 'bg-gray-700'}`}>
                    <Icon className={`w-4 h-4 ${bad ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-semibold ${bad ? 'text-red-300' : 'text-gray-200'}`}>{label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{note}</div>
                  </div>
                  <div className={`text-[13px] font-black shrink-0 text-right min-w-[120px] ${bad ? 'text-red-400' : cost === '₹0' || cost.includes('₹0 ') ? 'text-green-400' : 'text-gray-300'
                    }`}>
                    {cost}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Monthly totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className={`rounded-xl border p-6 transition-all ${activeTeam === 'A' ? 'border-red-800 bg-red-950/50 scale-[1.01]' : 'border-gray-700 bg-gray-800'}`}>
              <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-widest font-semibold">Team A · per month</div>
              <div className="text-[2.8rem] font-black text-red-400 leading-none mb-2">
                ₹{Math.round(teamAMonthly).toLocaleString('en-IN')}
              </div>
              <div className="text-[12px] text-red-500 leading-relaxed">
                {`₹${Math.round(teamADaily).toLocaleString('en-IN')}/day × ${WORKING_DAYS} days + tab restarts + member overlap. Identical data paid for, over and over.`}
              </div>
            </div>
            <div className={`rounded-xl border p-6 transition-all ${activeTeam === 'B' ? 'border-green-800 bg-green-950/30 scale-[1.01]' : 'border-gray-700 bg-gray-800'}`}>
              <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-widest font-semibold">Team B · per month</div>
              <div className="text-[2.8rem] font-black text-green-400 leading-none mb-2">
                ₹{Math.round(teamBMonthly).toLocaleString('en-IN')}
              </div>
              <div className="text-[12px] text-green-600 leading-relaxed">
                Only ~15% of searches hit the API (new areas). All numbers: free after first extraction. Cache compounds every week.
              </div>
            </div>
          </div>

          {/* Savings callout */}
          <div className="rounded-xl border border-gray-700 bg-gray-800 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-16">
            <div>
              <div className="text-[14px] font-semibold text-white mb-0.5">Team B saves every single month</div>
              <div className="text-[12px] text-gray-500">Same data. Same workflow. Same team size. Permanently lower bill — and it compounds as the cache fills up.</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[2.4rem] font-black text-green-400 leading-none">
                ₹{Math.round(savedMonthly).toLocaleString('en-IN')}/mo
              </div>
              <div className="text-[12px] text-green-600 mt-1">
                {pctSaved}% reduction · ₹{Math.round(savedAnnual).toLocaleString('en-IN')} saved per year
              </div>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="border border-gray-700 rounded-2xl p-7 bg-gray-800">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color }}>
              Savings Calculator
            </p>
            <h3 className="text-[20px] font-black text-white mb-1">Calculate your team's savings</h3>
            <p className="text-[13px] text-gray-400 mb-8">Adjust the sliders to match your actual workflow. Numbers update in real time.</p>

            <div className="space-y-6">
              {[
                {
                  label: 'Team size',
                  id: 'calc-team',
                  min: 1, max: 50, step: 1,
                  value: calcTeam,
                  display: `${calcTeam} people`,
                  onChange: (v: number) => setCalcTeam(v),
                },
                {
                  label: 'Place searches per person per day',
                  id: 'calc-searches',
                  min: 10, max: 500, step: 10,
                  value: calcSearches,
                  display: `${calcSearches.toLocaleString()} searches`,
                  onChange: (v: number) => setCalcSearches(v),
                },
                {
                  label: 'Numbers extracted per day (total team)',
                  id: 'calc-numbers',
                  min: 0, max: 1000, step: 10,
                  value: calcNumbers,
                  display: `${calcNumbers.toLocaleString()} numbers`,
                  onChange: (v: number) => setCalcNumbers(v),
                },
                {
                  label: 'Cache hit rate (% of searches already in DB)',
                  id: 'calc-cache',
                  min: 30, max: 98, step: 1,
                  value: calcCache,
                  display: `${calcCache}%`,
                  onChange: (v: number) => setCalcCache(v),
                },
              ].map(({ label, id, min, max, step, value, display, onChange }) => (
                <div key={id}>
                  <div className="flex items-baseline justify-between mb-2">
                    <label htmlFor={id} className="text-[13px] text-gray-400">{label}</label>
                    <span className="text-[15px] font-black text-white">{display}</span>
                  </div>
                  <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-gray-900 rounded-xl p-4 border border-red-900/40">
                <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Without PlaceFinder</div>
                <div className="text-[1.8rem] font-black text-red-400 leading-none">
                  ₹{Math.round(calcRawMonthly).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-gray-600 mt-1">per month</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-green-900/40">
                <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">With PlaceFinder</div>
                <div className="text-[1.8rem] font-black text-green-400 leading-none">
                  ₹{Math.round(calcPFMonthly).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-gray-600 mt-1">per month</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-green-900/40">
                <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Monthly saving</div>
                <div className="text-[1.8rem] font-black text-green-400 leading-none">
                  ₹{Math.round(calcSavedMonthly).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-green-700 mt-1">{calcPct}% reduction</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-green-800 bg-green-950/30 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[13px] font-semibold text-green-300">Projected annual saving for your team</div>
                <div className="text-[11px] text-green-700 mt-0.5">At current usage — grows as cache warms up further</div>
              </div>
              <div className="text-[2rem] font-black text-green-400">
                ₹{Math.round(calcSavedAnnual).toLocaleString('en-IN')}/year
              </div>
            </div>
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
function Metrics({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const metrics = [
    { Icon: TrendingDown, stat: '₹71K+', label: 'saved per team per year (avg.)', sub: 'For a 6-person team doing 200 searches/day. Scales with your workflow.' },
    { Icon: Clock, stat: '280ms', label: 'average cache-hit response time', sub: 'vs. 1.4s for a live Google Places API call' },
    { Icon: Database, stat: '3.2M+', label: 'place records cached in our DB', sub: 'Schools, restaurants, addresses, numbers — growing daily' },
    { Icon: Phone, stat: '₹0', label: 'cost to re-fetch a cached phone number', sub: 'Extracted once → stored forever per place_id. By anyone on your team.' },
    { Icon: Users, stat: '1,200+', label: 'active teams across India', sub: 'Ed-tech, hospitality, market research, consulting' },
    { Icon: BarChart3, stat: '5,000+', label: 'cities & areas indexed', sub: 'Tier 1, 2, and 3 — every state, every union territory' },
  ];
  return (
    <section className="bg-white py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <AnimSection className="mb-14">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>Platform Metrics</p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight max-w-xl">
            Numbers that tell the story.
          </h2>
        </AnimSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {metrics.map(({ Icon, stat, label, sub }, i) => (
            <AnimSection key={i} delay={i * 0.06} className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <Icon className="w-5 h-5 text-gray-400 mb-5" />
              <div className="text-[2.8rem] font-black text-gray-900 tracking-tight leading-none mb-2">{stat}</div>
              <div className="text-[13px] text-gray-700 font-medium mb-2 leading-snug">{label}</div>
              <div className="text-[11px] text-gray-400 leading-relaxed">{sub}</div>
            </AnimSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const isRest = mode === 'restaurant';
  const steps = [
    {
      Icon: MapPin,
      title: 'Pick your location',
      time: 'Instant',
      desc: 'Choose any state → city → area using the drill-down cards, or type in the search bar. Autocomplete works across all 5,000+ indexed areas.',
    },
    {
      Icon: Search,
      title: 'Results load — from cache or API',
      time: '< 300ms or ~1.4s',
      desc: `If this area was searched before, results come from our DB in milliseconds. First-time search calls Google Places API, gets the list of top ${isRest ? 'restaurants' : 'schools'}, and writes it to our DB.`,
    },
    {
      Icon: PhoneCall,
      title: 'Extract numbers on demand',
      time: '~1s first time, instant after',
      desc: 'Click "Extract Number" on any card. We call the Google Place Details API for that place_id, extract the formatted phone number, and append it to the DB record — permanently. At 80% cache rate, that\'s ₹0 on 4 out of every 5 searches.',
    },
    {
      Icon: CloudOff,
      title: 'Tab closed? Network down? No problem.',
      time: 'Zero re-cost',
      desc: 'Because data is written to our DB on every call, nothing is lost. Reopen, re-search the same area — results and numbers appear from cache. You are never charged twice for the same data.',
    },
    {
      Icon: FileSpreadsheet,
      title: 'Export what you see',
      time: '< 1 second',
      desc: `Click Export. A formatted .xlsx file downloads with name, area, rating, type, and every phone number extracted so far. Ready for CRM, outreach, or team handoff.`,
    },
  ];

  return (
    <section className="bg-gray-50 py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <AnimSection className="mb-16">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>
            How It Works
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight max-w-xl">
            Search once. The data stays yours.
          </h2>
          <p className="text-[15px] text-gray-500 mt-3 max-w-lg">
            Every interaction writes to our database. Nothing disappears. Nothing gets double-billed.
          </p>
        </AnimSection>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map(({ Icon, title, time, desc }, i) => (
            <AnimSection key={i} delay={i * 0.08}>
              <div className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%+8px)] right-[-8px] h-px bg-gray-200 z-10" />
                )}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${i === 0 ? 'text-white' : 'bg-white border border-gray-200 text-gray-500'}`}
                  style={i === 0 ? { background: `linear-gradient(135deg, ${ORANGE} 0%, ${INDIGO} 100%)` } : {}}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color }}>{time}</div>
                <h3 className="text-[13.5px] font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </AnimSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Coverage ─────────────────────────────────────────────────────────────────
function Coverage({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const stateGroups = [
    { region: 'North', states: ['Delhi', 'Uttar Pradesh', 'Uttarakhand', 'Himachal Pradesh', 'Punjab', 'Haryana', 'J&K', 'Rajasthan'] },
    { region: 'South', states: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Telangana', 'Andhra Pradesh', 'Goa'] },
    { region: 'West', states: ['Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Chhattisgarh'] },
    { region: 'East', states: ['West Bengal', 'Bihar', 'Jharkhand', 'Odisha', 'Assam', 'Tripura', 'Meghalaya', 'Sikkim'] },
  ];
  return (
    <section id="coverage" className="bg-white py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <AnimSection className="mb-14">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>India Coverage</p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Every state. Every city.<br />Every area.
          </h2>
          <p className="text-[15px] text-gray-500 mt-3 max-w-md">
            Search from Srinagar to Kanyakumari. Click on any state card, pick a city, then drill into an area — or just type in the search bar.
          </p>
        </AnimSection>

        <AnimSection delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stateGroups.map(({ region, states }, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl p-5">
                <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">{region} India</div>
                <div className="flex flex-wrap gap-1.5">
                  {states.map((s, j) => (
                    <span
                      key={j}
                      className="text-[10.5px] font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 cursor-pointer transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AnimSection>

        <AnimSection delay={0.15}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: '28', l: 'States + UTs' },
              { n: '500+', l: 'Cities covered' },
              { n: '5,000+', l: 'Areas indexed' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl px-6 py-5 border border-gray-100 text-center">
                <div className="text-[2rem] font-black text-gray-900">{s.n}</div>
                <div className="text-[12px] text-gray-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Comparison ───────────────────────────────────────────────────────────────
function Comparison({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const rows = [
    { feature: 'Phone number extraction', raw: 'Manual — open Google Maps per place', us: 'One click per card, auto-saved to DB' },
    { feature: 'Data persistence', raw: 'Lost on tab close or network drop', us: 'Cached to DB immediately, always available' },
    { feature: 'API cost on re-search', raw: 'Full cost every single time', us: '₹0 — served from our database' },
    { feature: 'Excel export', raw: 'Manual copy-paste into sheets', us: 'One-click .xlsx with all columns' },
    { feature: 'India coverage', raw: 'Requires custom query per area', us: '5,000+ areas pre-indexed, searchable' },
    { feature: 'Team usage', raw: 'Each user pays API costs independently', us: 'Shared cache — team benefits from every search' },
    { feature: 'Mode switching', raw: 'Separate queries for each category', us: 'Single toggle between restaurants and schools' },
    { feature: 'Monthly cost (6-person team)', raw: '₹6,919/mo and rising', us: '₹965/mo — drops further as cache matures' },
    { feature: 'Annual cost at team scale', raw: '₹83,028/year', us: '₹11,580/year — ₹71,448 saved annually' },
  ];
  return (
    <section className="bg-gray-50 py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <AnimSection className="mb-14">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>
            vs Raw Google Places API
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Google API is powerful.<br />But it charges you every time.
          </h2>
          <p className="text-[15px] text-gray-500 mt-3 max-w-md">
            PlaceFinder is the intelligent layer on top — so you get the data without the recurring cost.
          </p>
        </AnimSection>
        <AnimSection delay={0.1}>
          <div className="overflow-hidden border border-gray-200 rounded-2xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50 w-[30%]">Feature</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest bg-red-50 text-red-400 w-[35%]">
                    <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" />Raw API / Manual</span>
                  </th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest bg-green-50 text-green-600 w-[35%]">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />PlaceFinder</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-5 py-3 text-[13px] font-medium text-gray-700">{r.feature}</td>
                    <td className="px-5 py-3 text-[13px] text-red-600">{r.raw}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-900 font-medium">{r.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Use Cases ────────────────────────────────────────────────────────────────
const USE_CASES = [
  {
    Icon: BookOpen,
    title: 'Education Consultants',
    stat: 'Schools + numbers in minutes',
    desc: 'Build school lists for parent counselling sessions across any city or area. Extract admission contact numbers in bulk and export directly to your CRM.',
  },
  {
    Icon: Building2,
    title: 'Restaurant Aggregators',
    stat: 'Onboard faster',
    desc: 'Scout new restaurant partners in any city. Pull ratings, contact numbers, and areas — export to Excel for your partnership team in one click.',
  },
  {
    Icon: Users,
    title: 'Market Research Firms',
    stat: 'India-wide sampling',
    desc: 'Build representative samples of restaurants or schools across states. The drill-down hierarchy makes stratified geographic sampling fast and auditable.',
  },
  {
    Icon: PhoneCall,
    title: 'Tele-sales & Outreach Teams',
    stat: 'Ready-to-dial lists',
    desc: 'Get verified phone numbers for schools or restaurants in any target area. Export to Excel and load into your dialler — no manual lookup needed.',
  },
  {
    Icon: Layers,
    title: 'Franchise & Expansion Teams',
    stat: 'Competitive mapping',
    desc: 'Map the restaurant or school density in any area before opening a new branch. Understand who\'s already there, their ratings, and how to position.',
  },
  {
    Icon: ShieldCheck,
    title: 'Government & NGO Projects',
    stat: 'Auditable data trail',
    desc: 'Map school infrastructure coverage across districts. Cache means all field workers share the same data — no duplication, consistent records.',
  },
];

function UseCases({ mode }: { mode: Mode }) {
  const color = accent(mode);
  return (
    <section className="bg-white py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <AnimSection className="mb-14">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color }}>Who It&apos;s For</p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Every team that needs Indian place data.</h2>
        </AnimSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map(({ Icon, title, stat, desc }, i) => (
            <AnimSection key={i} delay={i * 0.05}>
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-400 transition-colors h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">{stat}</span>
                </div>
                <h3 className="text-[14px] font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-[12.5px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </AnimSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const quotes = [
    {
      q: "We used to spend 3 hours manually finding school numbers in Delhi NCR. PlaceFinder gets us 40 schools with verified numbers in under 10 minutes.",
      name: 'Meera Joshi',
      role: 'Senior Counsellor, EduPath Consulting',
      city: 'Noida',
      saving: '3 hrs → 10 min',
    },
    {
      q: "The caching is the killer feature. My team of 6 all search the same cities — we checked after a month and had spent ₹900 in API costs vs ₹7,200+ if we'd gone direct through Google Places.",
      name: 'Arjun Malhotra',
      role: 'Ops Lead, TasteMap India',
      city: 'Bengaluru',
      saving: '₹6,300 saved/month',
    },
    {
      q: "Tab crashed mid-session. On any other tool that's 30 wasted API calls. On PlaceFinder, I reopened and everything was exactly where I left it. That's when I knew.",
      name: 'Priya Venkatesh',
      role: 'Research Analyst, BrandSampler',
      city: 'Chennai',
      saving: '30 calls recovered',
    },
  ];
  return (
    <section className="bg-gray-50 py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <AnimSection className="mb-14">
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            Teams across India trust PlaceFinder.
          </h2>
          <p className="text-[14px] text-gray-400 mt-2">1,200+ users. Real savings. Real workflows.</p>
        </AnimSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quotes.map((t, i) => (
            <AnimSection key={i} delay={i * 0.08}>
              <div className="bg-white border border-gray-200 rounded-2xl p-7 h-full flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-gray-900 text-gray-900" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">{t.saving}</span>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed mb-6 flex-1">&quot;{t.q}&quot;</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[12.5px] font-bold text-gray-900">{t.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{t.role} · {t.city}</p>
                </div>
              </div>
            </AnimSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How does the caching actually work?',
    a: 'When you search for places in any area, we immediately write the full API response to our database, keyed by state + city + area + mode (restaurant/school). On any subsequent search for the same location, we return the stored results — no API call is made. Phone numbers extracted via Place Details are similarly stored permanently against each place_id.',
  },
  {
    q: 'What happens if I close the tab mid-session?',
    a: "Nothing is lost. Because we write to our DB on every API call — not just when you explicitly save — your results and extracted numbers persist. Reopen the app, search the same area, and everything is there instantly, served from cache at zero API cost.",
  },
  {
    q: 'Do I pay per search or per number extracted?',
    a: 'PlaceFinder has a flat subscription. The Google API costs we incur on your behalf are pooled — our caching model means the more our users search, the cheaper it gets for everyone. You never see a per-call bill.',
  },
  {
    q: 'Can I switch between restaurants and schools freely?',
    a: 'Yes, the toggle is always visible. Switching modes changes the entire UI context — icon, card layout, export columns, and filter options all adapt. Both modes share the same search bar and location hierarchy.',
  },
  {
    q: 'How accurate are the phone numbers?',
    a: "Numbers come directly from Google's Place Details API, formatted to Indian standards (+91 prefix). They reflect what the business has registered on Google Maps. We store the number exactly as returned — no manual reformatting.",
  },
  {
    q: 'What does the Excel export include?',
    a: 'The .xlsx export includes: place name, area, city, state, rating, total reviews, type (cuisine/school board), and phone number (if extracted). Columns are pre-labelled for CRM import. The export reflects exactly what is currently displayed on your screen.',
  },
  {
    q: 'Does the shared cache mean other users see my data?',
    a: 'The shared cache covers only the place data that Google already makes publicly available — names, ratings, addresses, contact numbers. Your export files, search history, and account data are private to your account.',
  },
  {
    q: 'How much does a 6-person team actually save per year?',
    a: 'Based on a team doing 200 searches per person per day and extracting 150 numbers daily, the raw Google API cost comes to roughly ₹6,919/month (₹83,028/year). With PlaceFinder\'s shared cache, that drops to around ₹965/month (₹11,580/year) — a saving of ₹71,448 annually. Use the calculator in the Cost Savings section to model your exact workflow.',
  },
];

function FAQ({ mode }: { mode: Mode }) {
  const color = accent(mode);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="bg-white py-24 px-6 lg:px-16 border-t border-gray-100">
      <div className="max-w-2xl mx-auto">
        <AnimSection className="mb-12">
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Frequently asked questions.</h2>
        </AnimSection>
        <div className="flex flex-col">
          {FAQS.map((f, i) => (
            <AnimSection key={i} delay={i * 0.03}>
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full text-left py-5 flex justify-between items-center gap-4 group"
                >
                  <span className="text-[14px] font-semibold text-gray-900 leading-snug group-hover:text-gray-600 transition-colors">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[13.5px] text-gray-500 leading-relaxed pb-5">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA({ isLoggedIn }: Readonly<{ isLoggedIn: boolean }>) {
  return (
    <section className="bg-gray-900 py-24 px-6 lg:px-16">
      <div className="max-w-2xl mx-auto text-center">
        <AnimSection>
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-24 overflow-hidden rounded-2xl shadow-lg">
              <div className="flex w-11 items-center justify-center bg-orange-600">
                <UtensilsCrossed size={18} className="text-white" />
              </div>
              <div className="w-px bg-white/20" />
              <div className="flex w-12 items-center justify-center bg-indigo-600">
                <GraduationCap size={18} className="text-white" />
              </div>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ color: ORANGE }}>
            Start for free · No credit card required
          </p>
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-5">
            Find any place in India.
            <br />
            Pay for it once.
          </h2>
          <p className="text-[15px] text-gray-400 leading-relaxed mb-10 max-w-lg mx-auto">
            Join 1,200+ teams using PlaceFinder to discover restaurants and schools across India — with caching that saves the average 6-person team ₹71,000+ a year.
          </p>
          <a
            href={isLoggedIn ? '/finder' : '/login'}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${INDIGO} 100%)` }}
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
            <ArrowRight className="w-5 h-5" />
          </a>
          <div className="flex items-center justify-center gap-6 mt-8 text-[12px] text-gray-600 flex-wrap">
            {['Free to start', 'No credit card', '86% avg. API cost saved', '1,200+ teams trust us'].map((l, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-gray-600" />
                {l}
              </span>
            ))}
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-12 overflow-hidden rounded-md shadow-sm">
            <div className="flex w-5 items-center justify-center bg-orange-600">
              <UtensilsCrossed size={10} className="text-white" />
            </div>
            <div className="w-px bg-white/30" />
            <div className="flex w-6 items-center justify-center bg-indigo-600">
              <GraduationCap size={10} className="text-white" />
            </div>
          </div>
          <span className="font-bold text-[14px] text-gray-900">PlaceFinder</span>
        </div>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Use', 'Contact'].map((l, i) => (
            <a key={i} href="#" className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-[12px] text-gray-300">© 2024 Quantumtech Digital. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ─── Page Root ────────────────────────────────────────────────────────────────
interface LandingPageProps {
  isLoggedIn: boolean;
}

export default function PlaceFinderLanding({ isLoggedIn }: Readonly<LandingPageProps>) {
  const [mode, setMode] = useState<Mode>('restaurant');
  return (
    <main className="antialiased">
      <Navbar isLoggedIn={isLoggedIn} mode={mode} setMode={setMode} />
      <Hero isLoggedIn={isLoggedIn} mode={mode} setMode={setMode} />
      <StateTicker />
      <Features mode={mode} />
      <CostSavings mode={mode} />
      <Metrics mode={mode} />
      <HowItWorks mode={mode} />
      <Coverage mode={mode} />
      <Comparison mode={mode} />
      <UseCases mode={mode} />
      <Testimonials mode={mode} />
      <FAQ mode={mode} />
      <CTA isLoggedIn={isLoggedIn} />
      <Footer />
    </main>
  );
}