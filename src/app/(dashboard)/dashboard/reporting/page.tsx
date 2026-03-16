'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
}

export default function ReportingPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, error } = trpc.reporting.listReports.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    status: status || undefined,
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Quarterly letters, capital accounts, and regulatory filings</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search reports..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prepared By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">No reports found.</td>
                </tr>
              ) : (
                data?.reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(r as typeof r & { fund?: { name: string } }).fund?.name ?? r.fundId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.type.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(r as typeof r & { preparedBy?: { name?: string; email: string } }).preparedBy?.name ?? r.preparedById ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(r.createdAt)}</td>
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
