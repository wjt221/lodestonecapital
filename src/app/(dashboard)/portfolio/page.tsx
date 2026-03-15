'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatCompactCurrency, formatDate, formatPercent } from '@/lib/utils'

export default function PortfolioPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [fundId, setFundId] = useState('')

  const { data, isLoading, error } = trpc.portfolio.companies.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    fundId: fundId || undefined,
  })

  const { data: funds } = trpc.fund.summary.useQuery()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-sm text-gray-500 mt-1">Active and realized investments</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search portfolio companies..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={fundId}
          onChange={(e) => { setFundId(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Funds</option>
          {funds?.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error.message}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invested</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MOIC</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ownership</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">No portfolio companies found.</td>
                </tr>
              ) : (
                data?.companies.map((pc) => (
                  <tr key={pc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/portfolio/${pc.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {pc.company.name}
                      </Link>
                      {pc.company.sector && <p className="text-xs text-gray-400">{pc.company.sector}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pc.fund.name}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {pc.totalInvested ? formatCompactCurrency(Number(pc.totalInvested)) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {pc.currentValuation ? formatCompactCurrency(Number(pc.currentValuation)) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {pc.moic ? (
                        <span className={Number(pc.moic) >= 1 ? 'text-green-700' : 'text-red-600'}>
                          {Number(pc.moic).toFixed(2)}x
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {pc.currentOwnership ? formatPercent(Number(pc.currentOwnership) / 100) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {pc.alerts.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          {pc.alerts.length} alert{pc.alerts.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
