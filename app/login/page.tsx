'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      router.push('/');
    } else {
      setError('Incorrect username or password.');
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 340, damping: 28 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-orange-600 shadow-sm">
            <UtensilsCrossed size={20} className="text-white" />
          </div>
          <h1 className="text-[22px] leading-none font-black tracking-tight text-gray-900">
            Restaurant Finder
          </h1>
          <p className="mt-2 text-[13px] text-gray-400">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="your-username"
                required
                className="w-full rounded-xl border border-gray-200 bg-[#FAFAF8] px-3.5 py-2.5 text-[13px] text-gray-900 transition-all outline-none placeholder:text-gray-300 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/10"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-[#FAFAF8] px-3.5 py-2.5 pr-10 text-[13px] text-gray-900 transition-all outline-none placeholder:text-gray-300 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-3 py-2.5"
                >
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span className="text-[12px] text-red-600">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Signing in…
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Sign in
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-gray-400">
          Contact your admin if you don&apos;t have access.
        </p>
      </motion.div>
    </div>
  );
}
