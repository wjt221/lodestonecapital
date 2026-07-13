'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatCompactCurrency, formatPercent } from '@/lib/utils'

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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portfolio</h1>
          <p className="text-sm text-slate-400 mt-1">Active and realized investments</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search portfolio..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
          />
        </div>
        <select
          value={fundId}
          onChange={(e) => { setFundId(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
        >
          <option value="">All Funds</option>
          {funds?.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading portfolio…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center"><p className="text-sm text-red-500">{error.message}</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Fund</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Invested</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Current Value</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">MOIC</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Ownership</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm text-slate-400">No portfolio companies found</p>
                  </td>
                </tr>
              ) : (
                data?.companies.map((pc) => (
                  <tr key={pc.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/portfolio/${pc.id}`} className="text-sm font-semibold text-slate-900 group-hover:text-[#C9A84C] transition-colors">
                        {pc.company.name}
                      </Link>
                      {pc.company.sector && (
                        <p className="text-xs text-slate-400 mt-0.5">{pc.company.sector}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{pc.fund.name}</td>
                    <td className="px-5 py-3.5 text-sm text-right font-medium text-slate-900 tabular-nums">
                      {pc.totalInvested ? formatCompactCurrency(Number(pc.totalInvested)) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right font-medium text-slate-900 hidden md:table-cell tabular-nums">
                      {pc.currentValuation ? formatCompactCurrency(Number(pc.currentValuation)) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right tabular-nums">
                      {pc.moic ? (
                        <span className={`font-bold ${Number(pc.moic) >= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {Number(pc.moic).toFixed(2)}x
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right text-slate-500 hidden lg:table-cell tabular-nums">
                      {pc.currentOwnership ? formatPercent(Number(pc.currentOwnership) / 100) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {pc.alerts.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-600">
                          {pc.alerts.length} alert{pc.alerts.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}
