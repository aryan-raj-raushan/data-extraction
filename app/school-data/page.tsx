/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  UtensilsCrossed,
  X,
  SlidersHorizontal,
  Home,
} from 'lucide-react';
import type { School } from '@/types/school';
import { getAllStateNames } from '@/lib/school/locations';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const ORANGE = '#ea580c';
const INDIGO = '#4f46e5';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

interface ApiResponse {
  data: School[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Inline Navbar (shared style with the landing page) ───────────────────────
function SchoolNavbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-14 overflow-hidden rounded-lg shadow-sm">
            <div className="flex w-6 items-center justify-center bg-orange-600">
              <UtensilsCrossed size={12} className="text-white" />
            </div>
            <div className="w-px bg-white/30" />
            <div className="flex w-7 items-center justify-center bg-indigo-600">
              <GraduationCap size={12} className="text-white" />
            </div>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900">
            Place<span style={{ color: INDIGO }}>Finder</span>
          </span>
        </Link>

        {/* Centre breadcrumb */}
        <div className="hidden items-center gap-2 text-[13px] text-gray-400 md:flex">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-gray-700">
            <Home size={13} />
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">School Data</span>
        </div>

        {/* Right CTA */}
        <Link
          href="/"
          className="rounded-lg border border-gray-200 px-4 py-1.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
        >
          ← Back to Home
        </Link>
      </div>
    </nav>
  );
}

// ─── Inline Footer ────────────────────────────────────────────────────────────
function SchoolFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-5 lg:px-10">
      <div className="mx-auto flex max-w-350 flex-col items-center justify-between gap-3 md:flex-row">
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
          <span className="text-[14px] font-bold text-gray-900">PlaceFinder</span>
        </div>
        <div className="flex gap-5">
          {['Privacy Policy', 'Terms of Use', 'Contact'].map((l) => (
            <a
              key={l}
              href="#"
              className="text-[12px] text-gray-400 transition-colors hover:text-gray-700"
            >
              {l}
            </a>
          ))}
        </div>
        <p className="text-[12px] text-gray-300">
          © 2024 Quantumtech Digital. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─── Filter pill (shows active filter as a removable tag) ─────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-indigo-400 hover:text-indigo-700">
        <X size={10} />
      </button>
    </span>
  );
}

// ─── Category badge (strips the leading number from e.g. "10-Secondary …") ────
function CategoryBadge({ value }: { value?: string }) {
  if (!value) return <span className="text-gray-300">—</span>;
  // Strip "N-" prefix common in UDISE data
  const clean = value.replace(/^\d+-/, '').trim();
  return (
    <span
      className="inline-block max-w-40 truncate rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
      title={clean}
    >
      {clean}
    </span>
  );
}

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusBadge({ value }: { value?: string }) {
  const clean = value?.trim().replace(/^\d+-/, '') ?? '';
  const isOp = clean.toLowerCase().includes('operational');
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium ${isOp ? 'text-emerald-700' : 'text-gray-400'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isOp ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {clean || '—'}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SchoolDataPage() {
  const [state, setState] = useState('Bihar');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [rows, setRows] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [blockOptions, setBlockOptions] = useState<string[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const states = useMemo(() => getAllStateNames(), []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [state, district, block]);

  // Load districts
  useEffect(() => {
    if (!state) {
      setDistrictOptions([]);
      return;
    }
    setDistrict('');
    setBlock('');
    setMetaLoading(true);
    fetch(`/api/school-data/meta?state=${encodeURIComponent(state)}`)
      .then((r) => r.json())
      .then((d) => setDistrictOptions(d.districts ?? []))
      .catch(() => setDistrictOptions([]))
      .finally(() => setMetaLoading(false));
  }, [state]);

  // Load blocks
  useEffect(() => {
    if (!state || !district) {
      setBlockOptions([]);
      return;
    }
    setBlock('');
    fetch(
      `/api/school-data/meta?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`,
    )
      .then((r) => r.json())
      .then((d) => setBlockOptions(d.blocks ?? []))
      .catch(() => setBlockOptions([]));
  }, [state, district]);

  const buildParams = useCallback(
    (overrides: Record<string, string | number> = {}) => {
      const params = new URLSearchParams();
      if (state) params.set('state', state);
      if (district) params.set('district', district);
      if (block) params.set('block', block);
      if (search) params.set('search', search);
      params.set('page', String(overrides.page ?? page));
      params.set('limit', String(overrides.limit ?? limit));
      return params;
    },
    [state, district, block, search, page, limit],
  );

  // Fetch data
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/school-data?${buildParams()}`)
      .then((r) => {
        if (!r.ok) throw new Error('failed');
        return r.json();
      })
      .then((d: ApiResponse) => {
        setRows(d.data);
        setTotal(d.total);
        setTotalPages(d.totalPages);
      })
      .catch(() => setError('Could not load school data. Please try again.'))
      .finally(() => setLoading(false));
  }, [state, district, block, search, page, limit]);

  async function handleExport() {
    setExporting(true);
    try {
      const params = buildParams();
      params.delete('page');
      params.delete('limit');
      const res = await fetch(`/api/school-data/export?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'school-data-export.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  // Active filter pills
  const activeFilters: { label: string; clear: () => void }[] = [
    ...(state ? [{ label: state, clear: () => setState('') }] : []),
    ...(district ? [{ label: district, clear: () => setDistrict('') }] : []),
    ...(block ? [{ label: block, clear: () => setBlock('') }] : []),
    ...(search
      ? [
          {
            label: `"${search}"`,
            clear: () => {
              setSearchInput('');
              setSearch('');
            },
          },
        ]
      : []),
  ];

  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SchoolNavbar />

      {/* ── Page body — fixed layout so table is always viewport-sized ── */}
      <div
        className="flex flex-1 flex-col px-6 lg:px-10"
        style={{ paddingTop: '4.5rem' /* navbar height */ }}
      >
        {/* ── Page header ── */}
        <div className="flex flex-wrap items-end justify-between gap-4 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <GraduationCap size={16} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">School Data</h1>
            </div>
            <p className="ml-10 text-[12.5px] text-gray-500">
              {loading
                ? 'Loading…'
                : `${total.toLocaleString('en-IN')} schools match current filters`}
            </p>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting || total === 0 || loading}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${INDIGO} 100%)` }}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export to Excel
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
            <SlidersHorizontal size={12} />
            Filters
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* State */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-600">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-900 shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none"
              >
                <option value="">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                District {metaLoading && <span className="ml-1 text-gray-300">(loading…)</span>}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!state || metaLoading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-900 shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">All districts</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Block */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-600">Block</label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                disabled={!district}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-900 shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">All blocks</option>
                {blockOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                School name
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-8 text-[13px] text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-300 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              <span className="text-[11px] font-semibold text-gray-400">Active:</span>
              {activeFilters.map((f) => (
                <FilterPill key={f.label} label={f.label} onRemove={f.clear} />
              ))}
              <button
                onClick={() => {
                  setState('');
                  setDistrict('');
                  setBlock('');
                  setSearchInput('');
                  setSearch('');
                }}
                className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Table wrapper — fills remaining viewport height ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Toolbar above table */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <span>Rows per page</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-gray-200 px-2 py-1 text-[12px] text-gray-700 focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            {!loading && total > 0 && (
              <span className="text-[12px] text-gray-400">
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {startRow}–{endRow}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gray-700">{total.toLocaleString('en-IN')}</span>
              </span>
            )}
          </div>

          {/* Scrollable table */}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                <tr>
                  {[
                    { label: 'UDISE Code', w: 'w-[130px]' },
                    { label: 'School Name', w: 'min-w-[240px]' },
                    { label: 'State', w: 'w-[110px]' },
                    { label: 'District', w: 'w-[130px]' },
                    { label: 'Block', w: 'w-[130px]' },
                    { label: 'Category', w: 'w-[180px]' },
                    { label: 'Type', w: 'w-[120px]' },
                    { label: 'Status', w: 'w-[130px]' },
                  ].map(({ label, w }) => (
                    <th
                      key={label}
                      className={`${w} px-4 py-3 text-[10.5px] font-bold tracking-wider text-gray-500 uppercase`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-indigo-400" />
                      <p className="text-[13px] text-gray-400">Loading schools…</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <p className="text-[13px] font-semibold text-red-500">{error}</p>
                      <button
                        onClick={() => setPage(1)}
                        className="mt-2 text-[12px] text-indigo-500 underline"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <GraduationCap className="mx-auto mb-3 h-8 w-8 text-gray-200" />
                      <p className="text-[13px] font-semibold text-gray-500">
                        No schools match these filters
                      </p>
                      <p className="mt-1 text-[12px] text-gray-400">
                        Try clearing a filter or broadening your search
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr
                      key={r._id}
                      className={`group transition-colors hover:bg-indigo-50/40 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
                    >
                      {/* UDISE Code */}
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] text-gray-400">{r.udise_code}</span>
                      </td>

                      {/* School Name — primary column, darkest text */}
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] leading-snug font-semibold text-gray-900">
                          {r.school_name}
                        </span>
                      </td>

                      {/* State */}
                      <td className="px-4 py-2.5 text-[12.5px] text-gray-700">{r.state}</td>

                      {/* District */}
                      <td className="px-4 py-2.5 text-[12.5px] text-gray-700">{r.district}</td>

                      {/* Block */}
                      <td className="px-4 py-2.5 text-[12.5px] text-gray-600">{r.block || '—'}</td>

                      {/* Category — badge strips number prefix */}
                      <td className="px-4 py-2.5">
                        <CategoryBadge value={r.school_category} />
                      </td>

                      {/* Type — strip prefix */}
                      <td className="px-4 py-2.5 text-[12px] text-gray-600">
                        {r.school_type?.replace(/^\d+-/, '').trim() || '—'}
                      </td>

                      {/* Status — green dot */}
                      <td className="px-4 py-2.5">
                        <StatusBadge value={r.school_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination — always visible at bottom of the panel */}
          <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
            <span className="text-[12px] text-gray-400">
              Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
              <span className="font-semibold text-gray-700">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1.5">
              {/* First page */}
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="flex h-8 items-center justify-center rounded-lg border border-gray-200 px-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-30"
              >
                «
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page number pills — show up to 5 around current */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-semibold transition-colors ${
                      p === page
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>

              {/* Last page */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="flex h-8 items-center justify-center rounded-lg border border-gray-200 px-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-30"
              >
                »
              </button>
            </div>
          </div>
        </div>

        {/* Breathe at the bottom */}
        <div className="h-5 flex-shrink-0" />
      </div>

      <SchoolFooter />
    </div>
  );
}
