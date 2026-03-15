'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatDate, formatCompactCurrency, formatPercent } from '@/lib/utils'

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  MEDIUM: 'bg-orange-50 border-orange-200 text-orange-800',
  HIGH: 'bg-red-50 border-red-200 text-red-800',
  CRITICAL: 'bg-red-100 border-red-300 text-red-900',
}

export default function PortfolioCompanyDetailPage() {
  const params = useParams()
  const id = params.id as string

  const utils = trpc.useUtils()

  const { data: pc, isLoading, error } = trpc.portfolio.getCompany.useQuery({ id })

  const resolveAlert = trpc.portfolio.resolveAlert.useMutation({
    onSuccess: () => utils.portfolio.getCompany.invalidate({ id }),
  })

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Loading...</div>
  if (error) return <div className="p-8 text-red-500 text-sm">{error.message}</div>
  if (!pc) return null

  const latestKPIs = pc.kpis.slice(0, 6)
  const openAlerts = pc.alerts.filter((a) => !a.resolvedAt)

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/portfolio" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Portfolio
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pc.company.name}</h1>
            <p className="text-gray-500 mt-1">
              {pc.company.sector && <span>{pc.company.sector} · </span>}
              <span>{pc.fund.name}</span>
              {pc.fund.vintageYear && <span className="text-gray-400"> ({pc.fund.vintageYear})</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {openAlerts.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {openAlerts.length} open alert{openAlerts.length > 1 ? 's' : ''}
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              pc.isRealized ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
            }`}>
              {pc.isRealized ? 'Realized' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Invested"
          value={formatCompactCurrency(Number(pc.totalInvested))}
        />
        <MetricCard
          label="Current Value"
          value={pc.currentValuation ? formatCompactCurrency(Number(pc.currentValuation)) : '—'}
        />
        <MetricCard
          label="MOIC"
          value={pc.moic ? `${Number(pc.moic).toFixed(2)}x` : '—'}
          highlight={pc.moic ? Number(pc.moic) >= 1 : undefined}
        />
        <MetricCard
          label="Ownership"
          value={formatPercent(Number(pc.currentOwnership))}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-6">
          {/* Investment Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Investment Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Investment Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(pc.investmentDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Initial Investment</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCompactCurrency(Number(pc.initialInvestment))}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Board Seat</dt>
                <dd className="mt-1 text-sm text-gray-900">{pc.boardSeat ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Observer Seat</dt>
                <dd className="mt-1 text-sm text-gray-900">{pc.observerSeat ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">IRR</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {pc.irr ? `${(Number(pc.irr) * 100).toFixed(1)}%` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Realized Proceeds</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {pc.realizedProceeds ? formatCompactCurrency(Number(pc.realizedProceeds)) : '—'}
                </dd>
              </div>
              {pc.exitType && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exit Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pc.exitType}</dd>
                </div>
              )}
              {pc.realizedDate && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Realized Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(pc.realizedDate)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* KPIs */}
          {latestKPIs.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recent KPIs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 pb-2">Metric</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-2">Category</th>
                      <th className="text-right text-xs font-medium text-gray-500 pb-2">Value</th>
                      <th className="text-right text-xs font-medium text-gray-500 pb-2">Period End</th>
                      <th className="text-right text-xs font-medium text-gray-500 pb-2">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {latestKPIs.map((kpi) => (
                      <tr key={kpi.id}>
                        <td className="py-2 font-medium text-gray-900">{kpi.metricName}</td>
                        <td className="py-2 text-gray-500">{kpi.category}</td>
                        <td className="py-2 text-right text-gray-900">
                          {Number(kpi.metricValue).toLocaleString()}{kpi.unit ? ` ${kpi.unit}` : ''}
                        </td>
                        <td className="py-2 text-right text-gray-400">{formatDate(kpi.periodEnd)}</td>
                        <td className="py-2 text-right">
                          {kpi.isProjection && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Proj.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valuation History */}
          {pc.valuationHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Valuation History</h2>
              <div className="space-y-3">
                {pc.valuationHistory.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCompactCurrency(Number(v.fairValue))}
                      </p>
                      <p className="text-xs text-gray-500">{v.valuationMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{formatDate(v.valuationDate)}</p>
                      {v.notes && <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{v.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Open Alerts */}
          {openAlerts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Open Alerts</h2>
              <div className="space-y-2">
                {openAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded border text-xs ${SEVERITY_COLORS[alert.severity] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 line-clamp-2">{alert.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="opacity-70">{alert.severity}</span>
                      <button
                        onClick={() => {
                          const resolution = prompt('Resolution notes:')
                          if (resolution) {
                            resolveAlert.mutate({ alertId: alert.id, resolution })
                          }
                        }}
                        className="underline opacity-70 hover:opacity-100"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Company</h2>
            <dl className="space-y-2">
              {pc.company.website && (
                <div>
                  <dt className="text-xs text-gray-500">Website</dt>
                  <dd>
                    <a href={pc.company.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 truncate block max-w-full">
                      {pc.company.website}
                    </a>
                  </dd>
                </div>
              )}
              {pc.company.description && (
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Description</dt>
                  <dd className="text-xs text-gray-700 line-clamp-4">{pc.company.description}</dd>
                </div>
              )}
              {pc.deal && (
                <div>
                  <dt className="text-xs text-gray-500">Deal</dt>
                  <dd>
                    <Link href={`/dashboard/crm/deals/${pc.deal.id}`} className="text-xs text-blue-600 hover:text-blue-800">
                      {pc.deal.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label, value, highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${
        highlight === true ? 'text-green-700' :
        highlight === false ? 'text-red-600' :
        'text-gray-900'
      }`}>
        {value}
      </p>
    </div>
  )
}
