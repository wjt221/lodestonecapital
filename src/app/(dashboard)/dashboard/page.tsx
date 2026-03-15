'use client'

import { trpc } from '@/lib/trpc/client'
import { formatCompactCurrency, formatDateTime } from '@/lib/utils'

const STAGE_ORDER = [
  'SOURCING', 'INITIAL_REVIEW', 'SCREENING', 'DILIGENCE',
  'IC_REVIEW', 'TERM_SHEET', 'LEGAL', 'CLOSED', 'PASSED', 'PORTFOLIO',
]

const STAGE_COLORS: Record<string, string> = {
  SOURCING: 'bg-gray-400',
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Deals"
          value={isLoading ? '…' : String(stats?.activeDeals ?? 0)}
          subtitle="In pipeline"
          color="blue"
        />
        <StatCard
          title="Portfolio Companies"
          value={isLoading ? '…' : String(stats?.portfolioCompanies ?? 0)}
          subtitle="Active investments"
          color="green"
        />
        <StatCard
          title="Total NAV"
          value={isLoading ? '…' : formatCompactCurrency(stats?.totalNAV ?? 0)}
          subtitle="Net asset value"
          color="purple"
        />
        <StatCard
          title="Open Alerts"
          value={isLoading ? '…' : String(stats?.openAlerts ?? 0)}
          subtitle="Requiring attention"
          color={stats && stats.openAlerts > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Pipeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Deal Pipeline</h2>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 h-3 bg-gray-100 rounded" />
                  <div className="flex-1 h-2 bg-gray-100 rounded" />
                  <div className="w-4 h-3 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {STAGE_ORDER.map((stage) => {
                const count = stageMap[stage] ?? 0
                const pct = count > 0 ? Math.max(8, (count / maxStageCount) * 100) : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0">
                      {stage.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${STAGE_COLORS[stage] ?? 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-6 text-right ${count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.recentActivity.length ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Activity will appear here as you work</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((event) => {
                const meta = event.metadata as Record<string, unknown> | null
                const result = (meta?.result as string) ?? 'success'
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      result === 'failure' || result === 'denied' ? 'bg-red-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900">
                        <span className="font-medium">{ACTION_LABELS[event.action] ?? event.action}</span>
                        {' '}
                        <span className="text-gray-500">{event.resourceType}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
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

      {/* Security banner */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <span className="text-amber-600 mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-medium text-amber-800">Security Notice</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Sessions expire after 15 minutes of inactivity or 8 hours total.
            All actions are logged for compliance (7-year retention).
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, subtitle, color,
}: {
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colorMap[color]} mb-4 text-lg font-bold`}>
        {color === 'blue' ? '◈' : color === 'green' ? '◉' : color === 'purple' ? '$' : '!'}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  )
}
