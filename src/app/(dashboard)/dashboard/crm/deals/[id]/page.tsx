'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatDate, formatDateTime, formatCompactCurrency } from '@/lib/utils'

const STAGES = [
  'SOURCING', 'INITIAL_REVIEW', 'SCREENING', 'DILIGENCE',
  'IC_REVIEW', 'TERM_SHEET', 'LEGAL', 'CLOSED', 'PASSED', 'PORTFOLIO',
]

const STAGE_COLORS: Record<string, string> = {
  SOURCING: 'bg-gray-100 text-gray-700',
  INITIAL_REVIEW: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  DILIGENCE: 'bg-orange-100 text-orange-700',
  IC_REVIEW: 'bg-purple-100 text-purple-700',
  TERM_SHEET: 'bg-indigo-100 text-indigo-700',
  LEGAL: 'bg-pink-100 text-pink-700',
  CLOSED: 'bg-green-100 text-green-700',
  PASSED: 'bg-red-100 text-red-700',
  PORTFOLIO: 'bg-emerald-100 text-emerald-700',
}

export default function DealDetailPage() {
  const params = useParams()
  const _router = useRouter()
  const id = params.id as string
  const [stageNotes, setStageNotes] = useState('')
  const [showStageModal, setShowStageModal] = useState(false)
  const [targetStage, setTargetStage] = useState('')

  const utils = trpc.useUtils()

  const { data: deal, isLoading, error } = trpc.deal.get.useQuery({ id })

  const changeStage = trpc.deal.changeStage.useMutation({
    onSuccess: () => {
      utils.deal.get.invalidate({ id })
      utils.deal.stageHistory.invalidate({ id })
      setShowStageModal(false)
      setStageNotes('')
    },
  })

  const { data: history } = trpc.deal.stageHistory.useQuery({ id })

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Loading deal...</div>
  if (error) return <div className="p-8 text-red-500 text-sm">{error.message}</div>
  if (!deal) return null

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/crm/deals" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Deals
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
            {deal.company && (
              <p className="text-gray-500 mt-1">
                <Link href={`/dashboard/crm/companies/${deal.company.id}`} className="text-blue-600 hover:text-blue-800">
                  {deal.company.name}
                </Link>
                {deal.company.sector && <span className="text-gray-400"> · {deal.company.sector}</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STAGE_COLORS[deal.stage] ?? 'bg-gray-100 text-gray-600'}`}>
              {deal.stage.replace(/_/g, ' ')}
            </span>
            <button
              onClick={() => setShowStageModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Change Stage
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Deal info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Deal Overview</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stage</dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.stage.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sector</dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.sector ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Geography</dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.geography ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source Channel</dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.sourceChannel ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check Size (Min)</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.checkSizeMin ? formatCompactCurrency(Number(deal.checkSizeMin)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check Size (Max)</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.checkSizeMax ? formatCompactCurrency(Number(deal.checkSizeMax)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entry Valuation</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.entryValuation ? formatCompactCurrency(Number(deal.entryValuation)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target Ownership</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.targetOwnership ? `${(Number(deal.targetOwnership) * 100).toFixed(1)}%` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.revenue ? formatCompactCurrency(Number(deal.revenue)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">EBITDA</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.ebitda ? formatCompactCurrency(Number(deal.ebitda)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">IC Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.icDate ? formatDate(deal.icDate) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Classification</dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.dataClassification}</dd>
              </div>
            </dl>
            {deal.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</dt>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.description}</p>
              </div>
            )}
          </div>

          {/* Research Workspace link */}
          {deal.researchWorkspace && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Research Workspace</h2>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">{deal.researchWorkspace.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {deal.researchWorkspace._count.notes} notes ·{' '}
                    {deal.researchWorkspace._count.ddChecklists} checklists ·{' '}
                    {deal.researchWorkspace._count.financialModels} models
                  </p>
                </div>
                <span className="text-xs text-gray-400">Research tools</span>
              </div>
            </div>
          )}

          {/* Data Room link */}
          {deal.dataRoom && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Data Room</h2>
              <Link
                href={`/dashboard/dataroom/${deal.dataRoom.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-blue-600">{deal.dataRoom.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {deal.dataRoom.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          )}

          {/* Stage History */}
          {history && history.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Stage History</h2>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {h.fromStage ? (
                          <>
                            <span className="font-medium">{h.fromStage.replace(/_/g, ' ')}</span>
                            {' → '}
                            <span className="font-medium">{h.toStage.replace(/_/g, ' ')}</span>
                          </>
                        ) : (
                          <span className="font-medium">Created as {h.toStage.replace(/_/g, ' ')}</span>
                        )}
                      </p>
                      {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(h.changedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignments */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Deal Team</h2>
            {deal.assignments.length === 0 ? (
              <p className="text-xs text-gray-400">No team members assigned</p>
            ) : (
              <div className="space-y-2">
                {deal.assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                      {a.user.name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{a.user.name ?? a.user.email}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {a.role}{a.isPrimary ? ' · Lead' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500">Priority</dt>
                <dd className="text-sm text-gray-900">{'★'.repeat(deal.priority)}{'☆'.repeat(5 - deal.priority)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">{formatDate(deal.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Updated</dt>
                <dd className="text-sm text-gray-900">{formatDate(deal.updatedAt)}</dd>
              </div>
              {deal.tags.length > 0 && (
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {deal.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Stage Change Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Deal Stage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select stage...</option>
                  {STAGES.filter((s) => s !== deal.stage).map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for stage change..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStageModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (targetStage) {
                    changeStage.mutate({
                      dealId: id,
                      toStage: targetStage as never,
                      notes: stageNotes || undefined,
                    })
                  }
                }}
                disabled={!targetStage || changeStage.isPending}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {changeStage.isPending ? 'Saving...' : 'Change Stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
