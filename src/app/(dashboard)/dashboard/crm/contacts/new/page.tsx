'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

export default function NewContactPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    linkedinUrl: '',
    notes: '',
    isLP: false,
    isFounder: false,
    isExpert: false,
    isInvestor: false,
  })
  const [error, setError] = useState('')

  const { data: companies } = trpc.company.list.useQuery({ page: 1, pageSize: 100 })
  const [companyId, setCompanyId] = useState('')

  const create = trpc.contact.create.useMutation({
    onSuccess: (contact) => {
      router.push(`/dashboard/crm/contacts/${contact.id}`)
    },
    onError: (e) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    create.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      title: form.title || undefined,
      companyId: companyId || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      notes: form.notes || undefined,
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/crm/contacts" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Contacts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Contact</h1>
        <p className="text-sm text-gray-500 mt-1">Add a founder, investor, or expert to your network</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CEO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select company...</option>
                {companies?.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://linkedin.com/in/janesmith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Type</label>
            <div className="flex gap-6">
              {(['isLP', 'isFounder', 'isExpert', 'isInvestor'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  {key.replace('is', '')}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any relevant background or context..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/crm/contacts"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
