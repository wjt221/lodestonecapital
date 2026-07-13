'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatCompactCurrency, formatDateTime } from '@/lib/utils'

const STAGE_ORDER = [
  'SOURCING', 'INITIAL_REVIEW', 'SCREENING', 'DILIGENCE',
  'IC_REVIEW', 'TERM_SHEET', 'LEGAL', 'CLOSED', 'PASSED', 'PORTFOLIO',
]

const STAGE_COLORS: Record<string, string> = {
  SOURCING: 'bg-slate-400',
  INITIAL_REVIEW: 'bg-blue-400',
  SCREENING: 'bg-yellow-400',
  DILIGENCE: 'bg-orange-400',
  IC_REVIEW: 'bg-purple-400',
  TERM_SHEET: 'bg-indigo-400',
  LEGAL: 'bg-pink-400',
  CLOSED: 'bg-green-500',
  PASSED: 'bg-red-400',
  PORTFOLIO: 'bg-emerald-500',
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  download: 'Downloaded',
  stage_change: 'Stage changed',
  provision: 'User provisioned',
  deprovision: 'User deprovisioned',
  access_grant: 'Access granted',
  access_revoke: 'Access revoked',
  approve: 'Approved',
  publish: 'Published',
  permission_denied: 'Access denied',
}

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery()

  const stageMap = stats
    ? Object.fromEntries(stats.dealsByStage.map((d) => [d.stage, d._count.id]))
    : {}

  const maxStageCount = stats
    ? Math.max(...stats.dealsByStage.map((d) => d._count.id), 1)
    : 1

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-400 text-sm mt-1">{today}</p>
        </div>
        <Link
          href="/dashboard/crm/deals/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0B1120] text-sm font-semibold rounded-lg hover:bg-[#b8973d] transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          New Deal
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Deals"
          value={isLoading ? '—' : String(stats?.activeDeals ?? 0)}
          subtitle="In pipeline"
          icon={<DealIcon />}
          accent="blue"
        />
        <StatCard
          title="Portfolio Companies"
          value={isLoading ? '—' : String(stats?.portfolioCompanies ?? 0)}
          subtitle="Active investments"
          icon={<PortfolioIcon />}
          accent="emerald"
        />
        <StatCard
          title="Total NAV"
          value={isLoading ? '—' : formatCompactCurrency(stats?.totalNAV ?? 0)}
          subtitle="Net asset value"
          icon={<NavIcon />}
          accent="gold"
        />
        <StatCard
          title="Open Alerts"
          value={isLoading ? '—' : String(stats?.openAlerts ?? 0)}
          subtitle="Requiring attention"
          icon={<AlertIcon />}
          accent={stats && stats.openAlerts > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        {/* Deal Pipeline — wider */}
        <div className="lg:col-span-3 bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Deal Pipeline</h2>
              <p className="text-xs text-slate-400 mt-0.5">Deals by stage</p>
            </div>
            <Link href="/dashboard/crm/deals" className="text-xs text-[#C9A84C] hover:text-[#b8973d] font-medium">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 h-2.5 bg-slate-100 rounded" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full" />
                  <div className="w-5 h-2.5 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {STAGE_ORDER.map((stage) => {
                const count = stageMap[stage] ?? 0
                const pct = count > 0 ? Math.max(4, (count / maxStageCount) * 100) : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 flex-shrink-0 tabular-nums">
                      {stage.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${STAGE_COLORS[stage] ?? 'bg-slate-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-5 text-right tabular-nums ${count > 0 ? 'text-slate-700' : 'text-slate-200'}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity — narrower */}
        <div className="lg:col-span-2 bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Audit log events</p>
            </div>
            <Link href="/dashboard/audit" className="text-xs text-[#C9A84C] hover:text-[#b8973d] font-medium">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 bg-slate-100 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.recentActivity.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ClockIcon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">No activity yet</p>
              <p className="text-xs text-slate-300 mt-0.5">Events appear as you work</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-72">
              {stats.recentActivity.map((event) => {
                const meta = event.metadata as Record<string, unknown> | null
                const result = (meta?.result as string) ?? 'success'
                const isError = result === 'failure' || result === 'denied'
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isError ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-400' : 'bg-blue-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug">
                        <span className="font-medium">{ACTION_LABELS[event.action] ?? event.action}</span>
                        {' '}
                        <span className="text-slate-400">{event.resourceType?.toLowerCase()}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {event.userEmail ? `${event.userEmail} · ` : ''}{formatDateTime(event.occurredAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'New Contact', href: '/dashboard/crm/contacts/new', desc: 'Add LP or founder' },
          { label: 'New Company', href: '/dashboard/crm/companies/new', desc: 'Add portfolio co.' },
          { label: 'Data Rooms', href: '/dashboard/dataroom', desc: 'Secure document sharing' },
          { label: 'Reports', href: '/dashboard/reporting', desc: 'LP letters & filings' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-4 hover:ring-[#C9A84C]/40 hover:shadow-md transition-all group"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#C9A84C] transition-colors">{item.label}</p>
            <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Security notice */}
      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-amber-600 text-xs">!</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-800">Security & Compliance</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Sessions expire after 15 minutes of inactivity or 8 hours total. All actions are logged for compliance (7-year retention per SEC Rule 17a-4).
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type Accent = 'blue' | 'emerald' | 'gold' | 'red'

function StatCard({ title, value, subtitle, icon, accent }: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  accent: Accent
}) {
  const accentClasses: Record<Accent, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    gold: 'bg-[#C9A84C]/10 text-[#C9A84C]',
    red: 'bg-red-50 text-red-500',
  }
  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${accentClasses[accent]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-1">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  )
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function DealIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function PortfolioIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function NavIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}
