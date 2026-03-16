'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatDate } from '@/lib/utils'

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLP, setIsLP] = useState<boolean | undefined>()

  const { data, isLoading, error } = trpc.contact.list.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    isLP,
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Founders, investors, and industry experts</p>
        </div>
        <Link
          href="/dashboard/crm/contacts/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Contact
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={isLP === undefined ? '' : String(isLP)}
          onChange={(e) => {
            setIsLP(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Contacts</option>
          <option value="true">LPs Only</option>
          <option value="false">Non-LPs</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading contacts...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error.message}</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.contacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">
                      No contacts found.
                    </td>
                  </tr>
                ) : (
                  data?.contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/crm/contacts/${c.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {c.firstName} {c.lastName}
                        </Link>
                        {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.title ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.company?.name ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {c.isLP && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">LP</span>}
                          {c.isFounder && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Founder</span>}
                          {c.isExpert && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Expert</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(c.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {data && data.pages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {data.total} contacts
                </p>
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
