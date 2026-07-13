'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { formatDate } from '@/lib/utils'

const ROLES = [
  'ANALYST', 'ASSOCIATE', 'PRINCIPAL', 'PARTNER', 'MANAGING_PARTNER',
  'INVESTOR_RELATIONS', 'COMPLIANCE', 'FUND_ACCOUNTANT', 'LP_VIEWER', 'READ_ONLY', 'SUPER_ADMIN',
] as const

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700',
  MANAGING_PARTNER: 'bg-purple-50 text-purple-700',
  PARTNER: 'bg-indigo-50 text-indigo-700',
  PRINCIPAL: 'bg-blue-50 text-blue-700',
  ASSOCIATE: 'bg-cyan-50 text-cyan-700',
  ANALYST: 'bg-teal-50 text-teal-700',
  INVESTOR_RELATIONS: 'bg-emerald-50 text-emerald-700',
  COMPLIANCE: 'bg-yellow-50 text-yellow-700',
  FUND_ACCOUNTANT: 'bg-orange-50 text-orange-700',
  LP_VIEWER: 'bg-pink-50 text-pink-700',
  READ_ONLY: 'bg-slate-100 text-slate-500',
}

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'ANALYST', password: '' })
  const [formError, setFormError] = useState('')

  const create = trpc.user.create.useMutation({
    onSuccess: () => { onSuccess(); onClose() },
    onError: (e) => setFormError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (form.password.length < 12) { setFormError('Password must be at least 12 characters.'); return }
    create.mutate({ name: form.name, email: form.email, role: form.role as never, password: form.password })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Add New User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none w-6 h-6 flex items-center justify-center">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] focus:bg-white transition-colors"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] focus:bg-white transition-colors"
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] focus:bg-white transition-colors"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Temporary Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] focus:bg-white transition-colors"
              placeholder="Min 12 characters"
            />
          </div>
          {formError && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-xs text-red-600">{formError}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 px-4 py-2 bg-[#C9A84C] text-[#0B1120] text-sm font-semibold rounded-lg hover:bg-[#b8973d] disabled:opacity-50 transition-colors"
            >
              {create.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState<boolean | undefined>(true)
  const [page, setPage] = useState(1)
  const [showInvite, setShowInvite] = useState(false)

  const utils = trpc.useUtils()

  const { data, isLoading, error } = trpc.user.list.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    isActive,
  })

  const deactivate = trpc.user.deactivate.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  })

  const unlock = trpc.user.unlock.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => utils.user.list.invalidate()}
        />
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">Provision and manage platform users</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0B1120] text-sm font-semibold rounded-lg hover:bg-[#b8973d] transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          Add User
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
          />
        </div>
        <select
          value={isActive === undefined ? '' : String(isActive)}
          onChange={(e) => { setIsActive(e.target.value === '' ? undefined : e.target.value === 'true'); setPage(1) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
        >
          <option value="true">Active Users</option>
          <option value="false">Inactive</option>
          <option value="">All Users</option>
        </select>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading users…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center"><p className="text-sm text-red-500">{error.message}</p></div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">MFA</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Last Login</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="text-sm text-slate-400">No users found</p>
                    </td>
                  </tr>
                ) : (
                  data?.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-900">{u.name ?? u.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ROLE_STYLES[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`text-xs font-semibold ${u.mfaEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {u.mfaEnabled ? '✓ Enabled' : '✗ Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400 hidden md:table-cell tabular-nums">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-3">
                          {u.isActive && (
                            <button
                              onClick={() => deactivate.mutate({ id: u.id })}
                              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            onClick={() => unlock.mutate({ id: u.id })}
                            className="text-xs font-medium text-[#C9A84C] hover:text-[#b8973d] transition-colors"
                          >
                            Unlock
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {data && data.pages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs text-slate-400 tabular-nums">{data.total} users total · Page {page} of {data.pages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">Next →</button>
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
