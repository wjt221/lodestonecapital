'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatDate } from '@/lib/utils'

const STAGE_STYLES: Record<string, string> = {
  SOURCING: 'bg-slate-100 text-slate-700',
  INITIAL_REVIEW: 'bg-blue-50 text-blue-700',
  SCREENING: 'bg-yellow-50 text-yellow-700',
  DILIGENCE: 'bg-orange-50 text-orange-700',
  IC_REVIEW: 'bg-purple-50 text-purple-700',
  TERM_SHEET: 'bg-indigo-50 text-indigo-700',
  LEGAL: 'bg-pink-50 text-pink-700',
  CLOSED: 'bg-green-50 text-green-700',
  PASSED: 'bg-red-50 text-red-600',
  PORTFOLIO: 'bg-emerald-50 text-emerald-700',
}

const STAGES = Object.keys(STAGE_STYLES)

export default function DealsPage() {
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = trpc.deal.list.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    stage: stage || undefined,
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deal Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">Track and manage investment opportunities</p>
        </div>
        <Link
          href="/dashboard/crm/deals/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0B1120] text-sm font-semibold rounded-lg hover:bg-[#b8973d] transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          New Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
          />
        </div>
        <select
          value={stage}
          onChange={(e) => { setStage(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading deals…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Sector</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Lead</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.deals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <EmptyIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No deals found</p>
                        <p className="text-xs text-slate-400">Create your first deal to start tracking opportunities</p>
                        <Link
                          href="/dashboard/crm/deals/new"
                          className="mt-1 text-xs text-[#C9A84C] hover:text-[#b8973d] font-semibold"
                        >
                          + Create deal →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/crm/deals/${deal.id}`}
                          className="text-sm font-semibold text-slate-900 group-hover:text-[#C9A84C] transition-colors"
                        >
                          {deal.name}
                        </Link>
                        {deal.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{deal.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {deal.company?.name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STAGE_STYLES[deal.stage] ?? 'bg-slate-100 text-slate-600'}`}>
                          {deal.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                        {deal.sector ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                        {deal.assignments[0]?.user?.name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400 hidden lg:table-cell tabular-nums">
                        {formatDate(deal.updatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <p className="text-xs text-slate-400 tabular-nums">
                  {(page - 1) * 25 + 1}–{Math.min(page * 25, data.total)} of {data.total} deals
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
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

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}
