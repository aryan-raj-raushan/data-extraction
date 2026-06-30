// components/places/PlaceList.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  UtensilsCrossed,
  GraduationCap,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import PlaceCard, { type Place } from './PlaceCard';
import type { PlaceMode } from '@/lib/cache/placeCache';

interface Props {
  area: string;
  city?: string;
  state?: string;
  mode: PlaceMode;
  /** Notifies the parent whenever this list starts/stops fetching, so it can
   *  lock down navigation controls (mode toggle, back, breadcrumbs, etc.) */
  onLoadingChange?: (loading: boolean) => void;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const PAGE_SIZE = 20;

// ── Excel export ──────────────────────────────────────────────────────────────
// Uses SheetJS (xlsx) loaded from CDN via dynamic script tag (no npm install needed)
// Exports ALL pages (re-fetches the full set at a large pageSize) so the
// downloaded file isn't limited to whatever page the user happens to be on.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadXLSX(): Promise<any> {
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

async function exportToExcel(
  area: string,
  city: string | undefined,
  state: string | undefined,
  mode: PlaceMode,
) {
  // Pull the full cached set in one shot (cache is already warm, so this is a
  // fast DB read, not a fresh Google call).
  const params = new URLSearchParams({ area, mode, page: '1', pageSize: '100' });
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  const res = await fetch(`/api/places?${params.toString()}`);
  const data = await res.json();
  const places: Place[] = data.places ?? [];

  const XLSX = await loadXLSX();
  const rows = places.map((p) => formatRow(p, mode));
  const ws = XLSX.utils.json_to_sheet(rows);

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

// ── Pagination controls ──────────────────────────────────────────────────────

function PageButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-gray-900 text-white'
          : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

function Pager({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      <PageButton onClick={() => onPageChange(page - 1)} disabled={!hasPrevPage}>
        <ChevronLeft size={14} />
      </PageButton>
      {buildPageNumbers(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-[12px] text-gray-300">
            …
          </span>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onPageChange(p)}>
            {p}
          </PageButton>
        ),
      )}
      <PageButton onClick={() => onPageChange(page + 1)} disabled={!hasNextPage}>
        <ChevronRight size={14} />
      </PageButton>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlaceList({ area, city, state, mode, onLoadingChange }: Readonly<Props>) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const fetchedKeyRef = useRef<string | null>(null);

  // Reset to page 1 whenever the area/city/state/mode changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [area, city, state, mode]);

  // Fetch the current page whenever area / city / state / mode / page changes
  useEffect(() => {
    if (!area) return;
    const key = `${mode}__${area}__${city}__${state}__${page}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          area,
          mode,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (city) params.set('city', city);
        if (state) params.set('state', state);
        const res = await fetch(`/api/places?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        setPlaces(data.places ?? []);
        setPagination(data.pagination ?? null);
      } catch (e) {
        fetchedKeyRef.current = null;
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [area, city, state, mode, page]);

  // Let the parent (PlaceFinder) know whenever a fetch or export is in
  // flight so it can lock down navigation controls.
  useEffect(() => {
    onLoadingChange?.(loading || exporting);
  }, [loading, exporting, onLoadingChange]);

  useEffect(() => {
    return () => onLoadingChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update phone in state after extraction
  const handlePhoneExtracted = useCallback((placeId: string, phone: string) => {
    setPlaces((prev) =>
      prev.map((p) => (p.place_id === placeId ? { ...p, formatted_phone_number: phone } : p)),
    );
  }, []);

  // Excel export (full set, all pages)
  async function handleExport() {
    setExporting(true);
    try {
      await exportToExcel(area, city, state, mode);
    } finally {
      setExporting(false);
    }
  }

  function handlePageChange(newPage: number) {
    if (!pagination) return;
    const clamped = Math.min(Math.max(newPage, 1), pagination.totalPages);
    if (clamped === page) return;
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const label = mode === 'school' ? 'schools' : 'restaurants';
  const EmptyIcon = mode === 'school' ? GraduationCap : UtensilsCrossed;

  if (loading && places.length === 0) {
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
          {pagination ? (
            <>
              Showing {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} {label} in{' '}
              <span className="font-medium text-gray-600">{area}</span>
            </>
          ) : (
            <>
              {places.length} {label} found in{' '}
              <span className="font-medium text-gray-600">{area}</span>
            </>
          )}
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
      <div
        className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
          loading ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {places.map((p, i) => (
          <PlaceCard
            key={p.place_id}
            place={p}
            index={(pagination ? (pagination.page - 1) * pagination.pageSize : 0) + i}
            area={area}
            mode={mode}
            onPhoneExtracted={handlePhoneExtracted}
          />
        ))}
      </div>

      {pagination && <Pager pagination={pagination} onPageChange={handlePageChange} />}
    </div>
  );
}
