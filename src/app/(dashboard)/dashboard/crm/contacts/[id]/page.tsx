'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatDate, formatDateTime } from '@/lib/utils'

const INTERACTION_ICONS: Record<string, string> = {
  EMAIL: '✉',
  CALL: '☎',
  MEETING: '◎',
  NOTE: '✏',
  CONFERENCE: '◈',
  INTRO: '⇌',
  FOLLOW_UP: '↺',
}

export default function ContactDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: contact, isLoading, error } = trpc.contact.get.useQuery({ id })

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Loading...</div>
  if (error) return <div className="p-8 text-red-500 text-sm">{error.message}</div>
  if (!contact) return null

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard/crm/contacts" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Contacts
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
              {contact.firstName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h1>
              {contact.title && (
                <p className="text-gray-600 mt-0.5">
                  {contact.title}
                  {contact.company && (
                    <> at <Link href={`/dashboard/crm/companies/${contact.company.id}`} className="text-blue-600 hover:text-blue-800">
                      {contact.company.name}
                    </Link></>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {contact.isLP && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">LP</span>}
            {contact.isFounder && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Founder</span>}
            {contact.isExpert && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Expert</span>}
            {contact.isInvestor && <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Investor</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Contact Info</h2>
            <dl className="space-y-3">
              {contact.email && (
                <div>
                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {contact.email}
                    </a>
                  </dd>
                </div>
              )}
              {contact.phone && (
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{contact.phone}</dd>
                </div>
              )}
              {contact.location && (
                <div>
                  <dt className="text-xs text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">{contact.location}</dd>
                </div>
              )}
              {contact.linkedInUrl && (
                <div>
                  <dt className="text-xs text-gray-500">LinkedIn</dt>
                  <dd>
                    <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800">
                      View Profile
                    </a>
                  </dd>
                </div>
              )}
              {contact.twitterHandle && (
                <div>
                  <dt className="text-xs text-gray-500">Twitter</dt>
                  <dd className="text-sm text-gray-900">@{contact.twitterHandle}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500">Added</dt>
                <dd className="text-sm text-gray-900">{formatDate(contact.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {contact.tags.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bio + Interactions */}
        <div className="col-span-2 space-y-6">
          {contact.bio && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Bio</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.bio}</p>
            </div>
          )}

          {/* Interaction History */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Interactions ({contact.interactions.length})</h2>
            </div>
            {contact.interactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No interactions logged yet.</p>
            ) : (
              <div className="space-y-3">
                {contact.interactions.map((interaction) => (
                  <div key={interaction.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                      {INTERACTION_ICONS[interaction.type] ?? '·'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{interaction.subject}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatDateTime(interaction.occurredAt)}
                        </span>
                      </div>
                      {interaction.notes && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{interaction.notes}</p>
                      )}
                      {interaction.user && (
                        <p className="text-xs text-gray-400 mt-0.5">By {interaction.user.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
