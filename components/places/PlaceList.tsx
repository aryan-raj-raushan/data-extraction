// components/places/PlaceList.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, UtensilsCrossed, GraduationCap, Download } from 'lucide-react';
import PlaceCard, { type Place } from './PlaceCard';
import type { PlaceMode } from '@/lib/cache/placeCache';

interface Props {
  area: string;
  city?: string;
  state?: string;
  mode: PlaceMode;
}

// ── Excel export ──────────────────────────────────────────────────────────────
// Uses SheetJS (xlsx) loaded from CDN via dynamic script tag (no npm install needed)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadXLSX(): Promise<any> {
  // If already loaded by a prior call, use the cached global
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalWindow = window as Window & { XLSX?: any };
  if (globalWindow.XLSX) {
    return globalWindow.XLSX;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve(globalWindow.XLSX!);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function formatRow(p: Place, mode: PlaceMode) {
  const base = {
    Name: p.name,
    Address: p.formatted_address ?? '',
    'Contact Number': p.formatted_phone_number ?? '',
    'Google Rating': p.rating ?? '',
    'Total Reviews': p.user_ratings_total ?? '',
    Status:
      p.opening_hours?.open_now !== undefined ? (p.opening_hours.open_now ? 'Open' : 'Closed') : '',
    'Google Maps': `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
  };
  if (mode === 'restaurant') {
    return {
      ...base,
      'Price Level': p.price_level ? '₹'.repeat(p.price_level) : '',
    };
  }
  return base;
}

async function exportToExcel(places: Place[], area: string, mode: PlaceMode) {
  const XLSX = await loadXLSX();
  const rows = places.map((p) => formatRow(p, mode));
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 36 }, // Name
    { wch: 50 }, // Address
    { wch: 18 }, // Contact
    { wch: 14 }, // Rating
    { wch: 14 }, // Reviews
    { wch: 10 }, // Status
    { wch: 55 }, // Maps
    { wch: 14 }, // Price (restaurant only)
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = mode === 'school' ? 'Schools' : 'Restaurants';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = `${mode === 'school' ? 'schools' : 'restaurants'}-${area
    .toLowerCase()
    .replace(/\s+/g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlaceList({ area, city, state, mode }: Readonly<Props>) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  // Fetch places whenever area / city / state / mode changes
  useEffect(() => {
    if (!area) return;
    const key = `${mode}__${area}__${city}__${state}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setPlaces([]);
      try {
        const params = new URLSearchParams({ area, mode });
        if (city) params.set('city', city);
        if (state) params.set('state', state);
        const res = await fetch(`/api/places?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        setPlaces(data.places ?? []);
      } catch (e) {
        fetchedRef.current = null;
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [area, city, state, mode]);

  // Update phone in state after extraction
  const handlePhoneExtracted = useCallback((placeId: string, phone: string) => {
    setPlaces((prev) =>
      prev.map((p) => (p.place_id === placeId ? { ...p, formatted_phone_number: phone } : p)),
    );
  }, []);

  // Excel export
  async function handleExport() {
    setExporting(true);
    try {
      await exportToExcel(places, area, mode);
    } finally {
      setExporting(false);
    }
  }

  const label = mode === 'school' ? 'schools' : 'restaurants';
  const EmptyIcon = mode === 'school' ? GraduationCap : UtensilsCrossed;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-20 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-[13px]">
          Finding {label} in {area}…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <AlertCircle size={24} className="text-red-400 opacity-60" />
        <p className="text-[13px] font-medium text-red-500">Something went wrong</p>
        <p className="text-[12px] text-red-400">{error}</p>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
        <EmptyIcon size={28} className="opacity-30" />
        <p className="text-[13px]">
          No {label} found in {area}
        </p>
      </div>
    );
  }

  const accentColor = mode === 'school' ? 'blue' : 'orange';

  return (
    <div>
      {/* Header row */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-3 flex items-center justify-between"
      >
        <p className="text-[11.5px] text-gray-400">
          {places.length} {label} found in <span className="font-medium text-gray-600">{area}</span>
        </p>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleExport}
          disabled={exporting}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            accentColor === 'blue'
              ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
          }`}
        >
          {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          Export Excel
        </motion.button>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {places.map((p, i) => (
          <PlaceCard
            key={p.place_id}
            place={p}
            index={i}
            area={area}
            mode={mode}
            onPhoneExtracted={handlePhoneExtracted}
          />
        ))}
      </div>
    </div>
  );
}
