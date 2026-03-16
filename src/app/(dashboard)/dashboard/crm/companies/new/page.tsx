'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

export default function NewCompanyPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    website: '',
    sector: '',
    subSector: '',
    headquarters: '',
    description: '',
    employeeCount: '',
    yearFounded: '',
  })
  const [error, setError] = useState('')

  const create = trpc.company.create.useMutation({
    onSuccess: (company) => {
      router.push(`/dashboard/crm/companies/${company.id}`)
    },
    onError: (e) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    create.mutate({
      name: form.name,
      website: form.website || undefined,
      sector: form.sector || undefined,
      subSector: form.subSector || undefined,
      headquarters: form.headquarters || undefined,
      description: form.description || undefined,
      employeeCount: form.employeeCount ? parseInt(form.employeeCount) : undefined,
      yearFounded: form.yearFounded ? parseInt(form.yearFounded) : undefined,
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/crm/companies" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Companies
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Company</h1>
        <p className="text-sm text-gray-500 mt-1">Add a company to your investment universe</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                value={form.sector}
                onChange={(e) => setForm(f => ({ ...f, sector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select sector...</option>
                <option>Technology</option>
                <option>Healthcare</option>
                <option>Financial Services</option>
                <option>Real Estate</option>
                <option>Consumer</option>
                <option>Industrials</option>
                <option>Energy</option>
                <option>Business Services</option>
                <option>Media &amp; Entertainment</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-sector</label>
              <input
                value={form.subSector}
                onChange={(e) => setForm(f => ({ ...f, subSector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. SaaS, Fintech"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headquarters</label>
              <input
                value={form.headquarters}
                onChange={(e) => setForm(f => ({ ...f, headquarters: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New York, NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employees</label>
              <input
                type="number"
                min="1"
                value={form.employeeCount}
                onChange={(e) => setForm(f => ({ ...f, employeeCount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Founded</label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={form.yearFounded}
                onChange={(e) => setForm(f => ({ ...f, yearFounded: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2015"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of what the company does..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/crm/companies"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
