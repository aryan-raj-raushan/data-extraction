// components/places/PlaceFinder.tsx
//
// Replaces RestaurantFinder.tsx
// Adds a Restaurant ↔ School mode toggle in the header.
// Switching mode resets the drill-down to the state list and clears search.

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ChevronRight,
  Search,
  X,
  ArrowLeft,
  MapPin,
  UtensilsCrossed,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import locations from '@/constants/json/cities.json';
import statesRaw from '@/constants/json/states.json';
import PlaceList from './PlaceList';
import { signOut } from 'next-auth/react';
import type { PlaceMode } from '@/lib/cache/placeCache';

// ── types ─────────────────────────────────────────────────────────────────────

type FlatState = { type: 'flat'; areas: string[] };
type NestedState = { type: 'nested'; cities: Record<string, string[]> };
type LocationState = FlatState | NestedState;

type Step =
  | { view: 'states' }
  | { view: 'cities'; state: string }
  | { view: 'areas'; state: string; city: string }
  | { view: 'places'; state: string; city?: string; area: string };

// ── helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ── animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 4 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

const segVariants: Variants = {
  hidden: { opacity: 0, x: 8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { opacity: 0, x: -4, transition: { duration: 0.1 } },
};

// ── mode toggle ───────────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: PlaceMode; onChange: (m: PlaceMode) => void }) {
  return (
    <div className="flex items-center rounded-full border border-gray-200 bg-gray-100 p-0.5">
      {(['restaurant', 'school'] as PlaceMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
            mode === m
              ? m === 'restaurant'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {m === 'restaurant' ? <UtensilsCrossed size={13} /> : <GraduationCap size={13} />}
          {m === 'restaurant' ? 'Restaurants' : 'Schools'}
        </button>
      ))}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function PlaceFinder() {
  const [mode, setMode] = useState<PlaceMode>('restaurant');
  const [step, setStep] = useState<Step>({ view: 'states' });
  const [search, setSearch] = useState('');

  const states: string[] = statesRaw;

  function handleModeChange(newMode: PlaceMode) {
    if (newMode === mode) return;
    setMode(newMode);
    // Reset drill-down so data doesn't bleed between modes
    setStep({ view: 'states' });
    setSearch('');
  }

  // ── location helpers ────────────────────────────────────────────────────────

  function getStateData(stateName: string): LocationState | null {
    return (locations as Record<string, LocationState>)[slugify(stateName)] ?? null;
  }

  function getCitiesForState(stateName: string): string[] {
    const data = getStateData(stateName);
    if (!data) return [];
    return data.type === 'flat' ? data.areas : Object.keys(data.cities);
  }

  function getAreasForCity(stateName: string, city: string): string[] {
    const data = getStateData(stateName);
    if (!data || data.type !== 'nested') return [];
    return data.cities[city.toLowerCase()] ?? [];
  }

  // ── derived list ────────────────────────────────────────────────────────────

  const listItems = useMemo(() => {
    const q = search.toLowerCase();
    if (step.view === 'states') return states.filter((s) => s.toLowerCase().includes(q));
    if (step.view === 'cities')
      return getCitiesForState(step.state).filter((c) => c.toLowerCase().includes(q));
    if (step.view === 'areas')
      return getAreasForCity(step.state, step.city).filter((a) => a.toLowerCase().includes(q));
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, search]);

  // ── click handlers ──────────────────────────────────────────────────────────

  function onSelectState(stateName: string) {
    const data = getStateData(stateName);
    setSearch('');
    if (!data) return;
    setStep({ view: 'cities', state: stateName });
  }

  function onSelectCity(city: string) {
    if (step.view !== 'cities') return;
    const data = getStateData(step.state);
    setSearch('');
    if (!data) return;
    if (data.type === 'flat') {
      setStep({ view: 'places', state: step.state, area: city });
      return;
    }
    const areas = getAreasForCity(step.state, city);
    if (areas.length > 0) {
      setStep({ view: 'areas', state: step.state, city });
    } else {
      setStep({ view: 'places', state: step.state, city, area: city });
    }
  }

  function onSelectArea(area: string) {
    if (step.view !== 'areas') return;
    setSearch('');
    setStep({ view: 'places', state: step.state, city: step.city, area });
  }

  function goBack() {
    setSearch('');
    if (step.view === 'cities') setStep({ view: 'states' });
    else if (step.view === 'areas') setStep({ view: 'cities', state: step.state });
    else if (step.view === 'places') {
      if (step.city) {
        const areas = getAreasForCity(step.state, step.city);
        if (areas.length > 0) setStep({ view: 'areas', state: step.state, city: step.city });
        else setStep({ view: 'cities', state: step.state });
      } else {
        setStep({ view: 'cities', state: step.state });
      }
    }
  }

  function jumpTo(view: 'states' | 'cities' | 'areas') {
    setSearch('');
    if (view === 'states') setStep({ view: 'states' });
    else if (view === 'cities' && 'state' in step) setStep({ view: 'cities', state: step.state });
    else if (view === 'areas' && 'city' in step && step.city)
      setStep({ view: 'areas', state: step.state, city: step.city });
  }

  // ── breadcrumbs ─────────────────────────────────────────────────────────────

  type Seg = { label: string; onClick: () => void; active: boolean };
  const segments: Seg[] = [
    { label: 'India', onClick: () => jumpTo('states'), active: step.view === 'states' },
  ];
  if ('state' in step)
    segments.push({
      label: step.state,
      onClick: () => jumpTo('cities'),
      active: step.view === 'cities',
    });
  if ('city' in step && step.city)
    segments.push({
      label: step.city,
      onClick: () => jumpTo('areas'),
      active: step.view === 'areas',
    });
  if (step.view === 'places') segments.push({ label: step.area, onClick: () => {}, active: true });

  const headings: Record<string, string> = {
    states: 'Select a state',
    cities: `Cities in ${'state' in step ? step.state : ''}`,
    areas: `Areas in ${'city' in step && step.city ? step.city : ''}`,
    places:
      mode === 'school'
        ? `Schools in ${'area' in step ? step.area : ''}`
        : `Restaurants in ${'area' in step ? step.area : ''}`,
  };

  const clickFns: Record<string, (item: string) => void> = {
    states: onSelectState,
    cities: onSelectCity,
    areas: onSelectArea,
  };

  // accent colour derived from mode
  const accent =
    mode === 'school'
      ? {
          bg: 'bg-blue-600',
          border: 'border-blue-400/20',
          focusRing: 'focus:border-blue-400 focus:ring-blue-400/10',
          hover: 'hover:border-blue-200',
          chevron: 'group-hover:text-blue-500',
        }
      : {
          bg: 'bg-orange-600',
          border: 'border-orange-400/20',
          focusRing: 'focus:border-orange-400 focus:ring-orange-400/10',
          hover: 'hover:border-orange-200',
          chevron: 'group-hover:text-orange-500',
        };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Brand header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${accent.bg}`}
            >
              {mode === 'school' ? (
                <GraduationCap size={18} className="text-white" />
              ) : (
                <UtensilsCrossed size={18} className="text-white" />
              )}
            </div>
            <div>
              <h1 className="text-[17px] leading-none font-medium tracking-tight text-gray-900">
                {mode === 'school' ? 'School Finder' : 'Restaurant Finder'}
              </h1>
              <p className="mt-0.5 text-xs text-gray-400">
                {mode === 'school'
                  ? 'Find the best schools across India'
                  : 'Discover the best restaurants across India'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle mode={mode} onChange={handleModeChange} />

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-500 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-700"
              title="Sign out"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>

        {/* Breadcrumb / location bar */}
        <div className="mb-6 flex w-fit max-w-full items-center gap-0 overflow-x-auto rounded-full border border-gray-200 bg-gray-50 px-1.5 py-1">
          <AnimatePresence mode="popLayout">
            {segments.map((seg, i) => (
              <motion.div
                key={seg.label}
                variants={segVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex items-center"
              >
                {i > 0 && (
                  <span className="mx-[-2px] flex-shrink-0 text-[11px] text-gray-300 select-none">
                    ›
                  </span>
                )}
                <button
                  onClick={seg.onClick}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap transition-all duration-150 ${
                    seg.active
                      ? 'border border-gray-200 bg-white text-gray-800 shadow-sm'
                      : 'text-gray-400 hover:bg-white/80 hover:text-gray-700'
                  }`}
                >
                  {i === 0 && <MapPin size={11} className="flex-shrink-0" />}
                  {seg.label}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* View header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step.view !== 'states' && (
              <>
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <span className="text-xs text-gray-200">|</span>
              </>
            )}
            <h2 className="text-[13px] font-medium text-gray-600">{headings[step.view]}</h2>
          </div>

          {step.view !== 'places' && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-400">
              {listItems.length} {step.view}
            </span>
          )}
        </div>

        {/* Search */}
        {step.view !== 'places' && (
          <div className="relative mb-4">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${step.view}…`}
              className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-8 pl-8 text-[13px] text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:ring-2 ${accent.focusRing}`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* States / Cities / Areas grid */}
        <AnimatePresence mode="wait">
          {step.view !== 'places' && (
            <motion.div
              key={step.view + mode}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ minHeight: 320 }}
            >
              {listItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                  {mode === 'school' ? (
                    <GraduationCap size={28} className="opacity-30" />
                  ) : (
                    <UtensilsCrossed size={28} className="opacity-30" />
                  )}
                  <p className="text-[13px]">No results for &quot;{search}&quot;</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {listItems.map((item) => (
                    <motion.button
                      key={item}
                      variants={itemVariants}
                      onClick={() => clickFns[step.view]?.(item)}
                      whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}
                      whileTap={{ scale: 0.97 }}
                      className={`group flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-[12.5px] font-medium shadow-sm transition-all duration-150 hover:shadow-md ${accent.hover}`}
                    >
                      <span className="truncate text-gray-800">{item}</span>
                      <ChevronRight
                        size={13}
                        className={`flex-shrink-0 text-gray-300 transition-colors ${accent.chevron}`}
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Places list */}
        <AnimatePresence mode="wait">
          {step.view === 'places' && (
            <motion.div
              key={`places-${step.area}-${mode}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <PlaceList area={step.area} city={step.city} state={step.state} mode={mode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
