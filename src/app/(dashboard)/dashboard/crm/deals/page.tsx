'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatDate } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  SOURCING: 'bg-gray-100 text-gray-700',
  INITIAL_REVIEW: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  DILIGENCE: 'bg-orange-100 text-orange-700',
  IC_REVIEW: 'bg-purple-100 text-purple-700',
  TERM_SHEET: 'bg-indigo-100 text-indigo-700',
  LEGAL: 'bg-pink-100 text-pink-700',
  CLOSED: 'bg-green-100 text-green-700',
  PASSED: 'bg-red-100 text-red-700',
  PORTFOLIO: 'bg-emerald-100 text-emerald-700',
}

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage investment opportunities</p>
        </div>
        <Link
          href="/dashboard/crm/deals/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search deals..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={stage}
          onChange={(e) => { setStage(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Stages</option>
          {Object.keys(STAGE_COLORS).map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading deals...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error.message}</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.deals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                      No deals found. Create your first deal to get started.
                    </td>
                  </tr>
                ) : (
                  data?.deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/crm/deals/${deal.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {deal.name}
                        </Link>
                        {deal.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{deal.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {deal.company?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[deal.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                          {deal.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{deal.sector ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {deal.assignments[0]?.user?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(deal.updatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, data.total)} of {data.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                  >
                    Next
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
