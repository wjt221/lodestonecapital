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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-sm text-slate-400 mt-1">Founders, LPs, and industry experts</p>
        </div>
        <Link
          href="/dashboard/crm/contacts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0B1120] text-sm font-semibold rounded-lg hover:bg-[#b8973d] transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          New Contact
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
          />
        </div>
        <select
          value={isLP === undefined ? '' : String(isLP)}
          onChange={(e) => {
            setIsLP(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
        >
          <option value="">All Contacts</option>
          <option value="true">LPs Only</option>
          <option value="false">Non-LPs</option>
        </select>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading contacts…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center"><p className="text-sm text-red-500">{error.message}</p></div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Title</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.contacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <p className="text-sm text-slate-400">No contacts found</p>
                      <Link href="/dashboard/crm/contacts/new" className="mt-2 inline-block text-xs text-[#C9A84C] font-semibold">
                        + Add your first contact →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  data?.contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link href={`/dashboard/crm/contacts/${c.id}`} className="text-sm font-semibold text-slate-900 group-hover:text-[#C9A84C] transition-colors">
                          {c.firstName} {c.lastName}
                        </Link>
                        {c.email && <p className="text-xs text-slate-400 mt-0.5">{c.email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{c.title ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.company?.name ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {c.isLP && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">LP</span>}
                          {c.isFounder && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-md font-medium">Founder</span>}
                          {c.isExpert && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">Expert</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400 hidden lg:table-cell tabular-nums">{formatDate(c.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {data && data.pages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <p className="text-xs text-slate-400 tabular-nums">{data.total} contacts</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pages} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
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
