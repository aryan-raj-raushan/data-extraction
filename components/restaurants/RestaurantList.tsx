// components/restaurants/RestaurantList.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, UtensilsCrossed } from 'lucide-react';
import RestaurantCard from './RestaurantCard';

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
  area: string;
  city?: string;
  state?: string;
}

export default function RestaurantList({ area, city, state }: Readonly<Props>) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!area) return;
    const key = `${area}__${city}__${state}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setRestaurants([]);
      try {
        const params = new URLSearchParams({ area });
        if (city) params.set('city', city);
        if (state) params.set('state', state);
        const res = await fetch(`/api/restaurants?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        setRestaurants(data.restaurants || []);
      } catch (e) {
        fetchedRef.current = null;
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [area, city, state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-20 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-[13px]">Finding restaurants in {area}…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <AlertCircle size={24} className="text-red-400 opacity-60" />
        <div className="text-center">
          <p className="text-[13px] font-medium text-red-500">Something went wrong</p>
          <p className="mt-0.5 text-[12px] text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
        <UtensilsCrossed size={28} className="opacity-30" />
        <p className="text-[13px]">No restaurants found in {area}</p>
      </div>
    );
  }

  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-3 text-[11.5px] text-gray-400"
      >
        {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} found in{' '}
        <span className="font-medium text-gray-600">{area}</span>
      </motion.p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {restaurants.map((r, i) => (
          <RestaurantCard key={r.place_id} restaurant={r} index={i} />
        ))}
      </div>
    </div>
  );
}
