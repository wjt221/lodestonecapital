'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { formatDateTime } from '@/lib/utils'

const RESULT_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failure: 'bg-red-100 text-red-700',
  denied: 'bg-orange-100 text-orange-700',
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Immutable record of all system actions (7-year retention)</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{summary.total.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Events (last 7 days)</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-600">{summary.denied.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Permission Denials</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600">{summary.downloads.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Document Downloads</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by user, resource, IP..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Action (e.g., download, create)"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={result}
          onChange={(e) => { setResult(e.target.value as typeof result); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading audit log...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error.message}</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                {data?.logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 font-sans">No audit events found.</td>
                  </tr>
                ) : (
                  data?.logs.map((log) => {
                    const meta = log.metadata as Record<string, unknown> | null
                    const logResult = (meta?.result as string) ?? 'success'
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                          {formatDateTime(log.occurredAt)}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {log.userEmail ?? log.userId ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-900 font-semibold">{log.action}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {log.resourceType}
                          {log.resourceId && <span className="text-gray-400"> / {log.resourceId.slice(0, 8)}…</span>}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium font-sans ${RESULT_COLORS[logResult] ?? 'bg-gray-100 text-gray-600'}`}>
                            {logResult}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400">{log.ipAddress ?? '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {data && data.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">{data.total.toLocaleString()} events</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Previous</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pages} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
