'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Phone, MapPin, ExternalLink, UtensilsCrossed, Copy, Check } from 'lucide-react';

interface Restaurant {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  opening_hours?: { open_now?: boolean };
  price_level?: number;
}

interface Props {
  restaurant: Restaurant;
  index: number;
}

const PRICE_LABELS: Record<number, string> = {
  1: '₹',
  2: '₹₹',
  3: '₹₹₹',
  4: '₹₹₹₹',
};

const RANK_CONFIG = [
  {
    badge: 'bg-amber-400 text-amber-900 border-amber-400',
    numSize: 'text-base',
    hash: 'text-[9px]',
    shadow: true,
  },
  {
    badge: 'bg-gray-200 text-gray-700 border-gray-300',
    numSize: 'text-sm',
    hash: 'text-[8px]',
    shadow: true,
  },
  {
    badge: 'bg-orange-200 text-orange-900 border-orange-300',
    numSize: 'text-[13px]',
    hash: 'text-[8px]',
    shadow: true,
  },
];
const DEFAULT_RANK = {
  badge: 'bg-gray-100 text-gray-400 border-gray-200',
  numSize: 'text-xs',
  hash: 'text-[7px]',
  shadow: false,
};

function PhoneRow({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Phone size={13} className="flex-shrink-0 text-orange-500" />
        <span className="truncate text-sm font-bold tracking-wide text-gray-900">{number}</span>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy number'}
        className={`flex flex-shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors ${
          copied
            ? 'border-green-200 bg-green-50 text-green-600'
            : 'border-orange-200 bg-white text-orange-500 hover:bg-orange-50'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1"
            >
              <Check size={10} strokeWidth={3} /> Copied
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1"
            >
              <Copy size={10} strokeWidth={2} /> Copy
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default function RestaurantCard({ restaurant, index }: Props) {
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`;
  const isOpen = restaurant.opening_hours?.open_now;
  const rank = RANK_CONFIG[index] ?? DEFAULT_RANK;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 28,
        delay: Math.min(index * 0.04, 0.32),
      }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {/* Top band */}
      <div className="relative flex h-16 flex-shrink-0 items-center justify-center border-b border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
        <UtensilsCrossed size={20} className="text-orange-200" />

        {/* Rank badge */}
        <div className="absolute top-2 left-2">
          <div
            className={`flex items-baseline gap-px rounded-full border px-2 py-0.5 leading-none select-none ${rank.badge} ${rank.shadow ? 'shadow-sm' : ''}`}
          >
            <span className={`${rank.hash} mr-px font-semibold opacity-60`}>#</span>
            <span className={`${rank.numSize} font-extrabold tracking-tight`}>{index + 1}</span>
          </div>
        </div>

        {/* Top-right badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {isOpen !== undefined && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold ${
                isOpen ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
              }`}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          )}
          {restaurant.price_level && (
            <span className="rounded-full border border-orange-100 bg-white px-1.5 py-0.5 text-[10px] leading-none font-semibold text-orange-600">
              {PRICE_LABELS[restaurant.price_level]}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Name */}
        <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold text-gray-900">
          {restaurant.name}
        </h3>

        {/* Rating */}
        {restaurant.rating && (
          <div className="flex items-center gap-1">
            <Star size={12} className="flex-shrink-0 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-800">
              {restaurant.rating.toFixed(1)}
            </span>
            {restaurant.user_ratings_total && (
              <span className="text-[11px] text-gray-400">
                ({restaurant.user_ratings_total.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {restaurant.formatted_address && (
          <div className="flex items-start gap-1">
            <MapPin size={11} className="mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-2 text-[11px] leading-relaxed text-gray-400">
              {restaurant.formatted_address}
            </span>
          </div>
        )}

        {/* Phone — hero element */}
        <div className="mt-1">
          {restaurant.formatted_phone_number ? (
            <PhoneRow number={restaurant.formatted_phone_number} />
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5">
              <Phone size={13} className="flex-shrink-0 text-gray-300" />
              <span className="text-[11px] text-gray-300 italic">Number not available</span>
            </div>
          )}
        </div>

        {/* Maps link */}
        <div className="mt-auto border-t border-gray-100 pt-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-500 transition-colors hover:text-orange-600"
          >
            <ExternalLink size={11} />
            View on Google Maps
          </a>
        </div>
      </div>
    </motion.div>
  );
}
