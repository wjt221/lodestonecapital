'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { formatDate } from '@/lib/utils'

const ROLES = [
  'ANALYST', 'ASSOCIATE', 'PRINCIPAL', 'PARTNER', 'MANAGING_PARTNER',
  'INVESTOR_RELATIONS', 'COMPLIANCE', 'FUND_ACCOUNTANT', 'LP_VIEWER', 'READ_ONLY', 'SUPER_ADMIN',
] as const

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  MANAGING_PARTNER: 'bg-purple-100 text-purple-700',
  PARTNER: 'bg-indigo-100 text-indigo-700',
  PRINCIPAL: 'bg-blue-100 text-blue-700',
  ASSOCIATE: 'bg-cyan-100 text-cyan-700',
  ANALYST: 'bg-teal-100 text-teal-700',
  INVESTOR_RELATIONS: 'bg-green-100 text-green-700',
  COMPLIANCE: 'bg-yellow-100 text-yellow-700',
  FUND_ACCOUNTANT: 'bg-orange-100 text-orange-700',
  LP_VIEWER: 'bg-pink-100 text-pink-700',
  READ_ONLY: 'bg-gray-100 text-gray-600',
}

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'ANALYST', password: '' })
  const [error, setError] = useState('')

  const create = trpc.user.create.useMutation({
    onSuccess: () => { onSuccess(); onClose() },
    onError: (e) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 12) { setError('Password must be at least 12 characters.'); return }
    create.mutate({ name: form.name, email: form.email, role: form.role as never, password: form.password })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min 12 characters"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
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
    <div className="p-8">
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => utils.user.list.invalidate()}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Provision and manage platform users</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={isActive === undefined ? '' : String(isActive)}
          onChange={(e) => { setIsActive(e.target.value === '' ? undefined : e.target.value === 'true'); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading users...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error.message}</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MFA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">No users found.</td>
                  </tr>
                ) : (
                  data?.users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{u.name ?? u.email}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium ${u.mfaEnabled ? 'text-green-600' : 'text-red-500'}`}>
                          {u.mfaEnabled ? '✓ Enabled' : '✗ Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          {u.isActive && (
                            <button
                              onClick={() => deactivate.mutate({ id: u.id })}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            onClick={() => unlock.mutate({ id: u.id })}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
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
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                <span>{data.total} users total</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  <span className="px-3 py-1">Page {page} of {data.pages}</span>
                  <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
