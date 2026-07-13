'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatDate } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  DEAL_DILIGENCE: 'Deal Diligence',
  PORTFOLIO_COMPANY: 'Portfolio Company',
  FUND_LP: 'Fund / LP',
  INTERNAL: 'Internal',
}

export default function DataRoomPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')

  const { data, isLoading, error } = trpc.dataroom.list.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    type: type || undefined,
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Rooms</h1>
          <p className="text-sm text-slate-400 mt-1">Secure document sharing with access controls</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search data rooms..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
          />
        </div>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading data rooms…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center"><p className="text-sm text-red-500">{error.message}</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Deal / Fund</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Folders</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Users</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.rooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm text-slate-400">No data rooms found</p>
                  </td>
                </tr>
              ) : (
                data?.rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/dataroom/${room.id}`} className="text-sm font-semibold text-slate-900 group-hover:text-[#C9A84C] transition-colors">
                        {room.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{TYPE_LABELS[room.type] ?? room.type}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                      {room.deal?.name ?? room.fund?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-center font-semibold text-slate-700">{room._count.folders}</td>
                    <td className="px-5 py-3.5 text-sm text-center font-semibold text-slate-700">{room._count.access}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        room.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {room.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 hidden lg:table-cell tabular-nums">{formatDate(room.updatedAt)}</td>
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
