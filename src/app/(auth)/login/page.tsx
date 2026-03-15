'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CompassLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="20" cy="20" r="18.5" stroke="#C9A84C" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="13" stroke="#C9A84C" strokeWidth="0.6" strokeDasharray="2 3" />
      {/* North needle – gold */}
      <path d="M20 5 L22.2 19 L20 21 L17.8 19 Z" fill="#C9A84C" />
      {/* South needle – muted */}
      <path d="M20 35 L22.2 21 L20 19 L17.8 21 Z" fill="#475569" />
      {/* Center jewel */}
      <circle cx="20" cy="20" r="1.8" fill="#C9A84C" />
      <circle cx="20" cy="20" r="0.7" fill="#0F172A" />
      {/* Cardinal tick marks */}
      <line x1="20" y1="2" x2="20" y2="5" stroke="#C9A84C" strokeWidth="1.2" />
      <line x1="20" y1="35" x2="20" y2="38" stroke="#475569" strokeWidth="1.2" />
      <line x1="2" y1="20" x2="5" y2="20" stroke="#475569" strokeWidth="1.2" />
      <line x1="35" y1="20" x2="38" y2="20" stroke="#475569" strokeWidth="1.2" />
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials or account locked. Please try again.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#0F172A] flex-col justify-between p-14 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative flex items-center gap-3">
          <CompassLogo size={36} />
          <div>
            <div className="text-white font-semibold text-base tracking-wide">Lodestone Capital</div>
            <div className="text-slate-500 text-xs tracking-widest uppercase">Investment Management</div>
          </div>
        </div>

        <div className="relative">
          <div className="w-10 h-0.5 bg-amber-500 mb-8" />
          <h2 className="text-[2.6rem] font-bold text-white leading-[1.15] tracking-tight mb-6">
            Governance-Driven<br />Investing.
          </h2>
          <p className="text-slate-400 text-[0.95rem] leading-relaxed max-w-sm mb-12">
            Institutional-grade tools for managing private equity, real assets, and activist public equity strategies — built on a foundation of board-level governance.
          </p>

          <div className="grid grid-cols-3 gap-8">
            <div className="border-t border-slate-700 pt-4">
              <div className="text-amber-400 font-semibold text-sm mb-1">PE &amp; Debt</div>
              <div className="text-slate-500 text-xs leading-snug">$5M–$200M revenue businesses</div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <div className="text-amber-400 font-semibold text-sm mb-1">Real Estate</div>
              <div className="text-slate-500 text-xs leading-snug">Value-add income-producing assets</div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <div className="text-amber-400 font-semibold text-sm mb-1">Public Equity</div>
              <div className="text-slate-500 text-xs leading-snug">White Knight activist strategy</div>
            </div>
          </div>
        </div>

        <p className="relative text-slate-600 text-xs">
          © {new Date().getFullYear()} Lodestone Capital. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="mx-auto w-14 h-14 bg-[#0F172A] rounded-full flex items-center justify-center mb-4">
              <CompassLogo size={30} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lodestone Capital</h1>
            <p className="text-xs text-slate-500 mt-1 tracking-wider uppercase">Investment Management Platform</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {registered && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                Account created. You can now sign in.
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 text-sm transition-colors"
                placeholder="you@lodestonecapital.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 text-sm transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-slate-500 pt-1">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-amber-600 hover:text-amber-700 transition-colors">
                Create one
              </Link>
            </p>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400 leading-relaxed">
            Session expires after 15 min of inactivity or 8 hours total.<br />
            MFA required for RESTRICTED data access.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
