'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { formatDateTime } from '@/lib/utils'

const RESULT_STYLES: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  failure: 'bg-red-50 text-red-600',
  denied: 'bg-orange-50 text-orange-700',
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [result, setResult] = useState<'success' | 'failure' | 'denied' | ''>('')
  const [page, setPage] = useState(1)

  const { data: summary } = trpc.audit.summary.useQuery()
  const { data, isLoading, error } = trpc.audit.list.useQuery({
    page,
    pageSize: 50,
    search: search || undefined,
    action: action || undefined,
    result: result || undefined,
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-sm text-slate-400 mt-1">Immutable record of all system actions — 7-year retention per SEC Rule 17a-4</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-5">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.total.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mt-1">Events (7 days)</p>
          </div>
          <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-5">
            <p className="text-2xl font-bold text-red-500 tabular-nums">{summary.denied.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mt-1">Permission Denials</p>
          </div>
          <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm p-5">
            <p className="text-2xl font-bold text-[#C9A84C] tabular-nums">{summary.downloads.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mt-1">Document Downloads</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search user, resource, IP..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
          />
        </div>
        <input
          type="text"
          placeholder="Action (e.g. download)"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 w-44 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
        />
        <select
          value={result}
          onChange={(e) => { setResult(e.target.value as typeof result); setPage(1) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
        >
          <option value="">All Results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading audit log…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center"><p className="text-sm text-red-500">{error.message}</p></div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Resource</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-xs">
                {data?.logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center font-sans">
                      <p className="text-sm text-slate-400">No audit events found</p>
                    </td>
                  </tr>
                ) : (
                  data?.logs.map((log) => {
                    const meta = log.metadata as Record<string, unknown> | null
                    const logResult = (meta?.result as string) ?? 'success'
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-2.5 text-slate-400 whitespace-nowrap tabular-nums">
                          {formatDateTime(log.occurredAt)}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600 max-w-[140px] truncate">
                          {log.userEmail ?? log.userId ?? '—'}
                        </td>
                        <td className="px-5 py-2.5 text-slate-900 font-semibold">{log.action}</td>
                        <td className="px-5 py-2.5 text-slate-500 hidden md:table-cell">
                          {log.resourceType}
                          {log.resourceId && <span className="text-slate-300"> / {log.resourceId.slice(0, 8)}…</span>}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium font-sans ${RESULT_STYLES[logResult] ?? 'bg-slate-100 text-slate-600'}`}>
                            {logResult}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-slate-400 hidden lg:table-cell">{log.ipAddress ?? '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {data && data.pages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <p className="text-xs text-slate-400 tabular-nums">{data.total.toLocaleString()} events</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pages} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">Next →</button>
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
