'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

const STAGES = [
  'SOURCING', 'INITIAL_REVIEW', 'SCREENING', 'DILIGENCE',
  'IC_REVIEW', 'TERM_SHEET', 'LEGAL',
]

export default function NewDealPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    stage: 'SOURCING',
    sourceChannel: 'inbound',
    sector: '',
    description: '',
    companyName: '',
  })
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState('')

  const { data: companies } = trpc.company.list.useQuery({ page: 1, pageSize: 100 })

  const createCompany = trpc.company.create.useMutation()

  const createDeal = trpc.deal.create.useMutation({
    onSuccess: (deal) => {
      router.push(`/dashboard/crm/deals/${deal.id}`)
    },
    onError: (e) => setError(e.message),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let resolvedCompanyId = companyId

    // If user typed a new company name instead of selecting, create it first
    if (!resolvedCompanyId && form.companyName.trim()) {
      try {
        const newCompany = await createCompany.mutateAsync({
          name: form.companyName.trim(),
          sector: form.sector || undefined,
        })
        resolvedCompanyId = newCompany.id
      } catch (err) {
        setError((err as Error).message)
        return
      }
    }

    createDeal.mutate({
      name: form.name,
      companyId: resolvedCompanyId || undefined,
      stage: form.stage as never,
      sourceChannel: form.sourceChannel as never,
    })
  }

  const isPending = createDeal.isPending || createCompany.isPending

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/crm/deals" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Deals
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Deal</h1>
        <p className="text-sm text-gray-500 mt-1">Add an investment opportunity to the pipeline</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project Horizon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select existing company...</option>
              {companies?.companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {!companyId && (
              <div className="mt-2">
                <input
                  value={form.companyName}
                  onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Or type a new company name..."
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Channel</label>
              <select
                value={form.sourceChannel}
                onChange={(e) => setForm(f => ({ ...f, sourceChannel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="intermediary">Intermediary</option>
                <option value="proprietary">Proprietary</option>
              </select>
            </div>
          </div>

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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/crm/deals"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
