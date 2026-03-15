import { auth } from '@/server/auth/config'
import { createServerCaller } from '@/lib/trpc/server'
import { formatCompactCurrency, formatDate } from '@/lib/utils'
import type { Role } from '@prisma/client'

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as { id: string; name: string; role: Role; lastActivityAt: number } | undefined

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Deals" value="—" subtitle="In pipeline" color="blue" />
        <StatCard title="Portfolio Companies" value="—" subtitle="Active investments" color="green" />
        <StatCard title="AUM" value="—" subtitle="Assets under management" color="purple" />
        <StatCard title="Open Alerts" value="—" subtitle="Requiring attention" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Pipeline</h2>
          <div className="space-y-3">
            {['Sourcing', 'Initial Review', 'Screening', 'Diligence', 'IC Review', 'Term Sheet'].map((stage) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stage}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-4">0</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Activity will appear here as you work</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <span className="text-amber-600 text-lg">⚠</span>
        <div>
          <p className="text-sm font-medium text-amber-800">Security Notice</p>
          <p className="text-xs text-amber-700 mt-1">
            Your session automatically expires after 15 minutes of inactivity or 8 hours total.
            All actions are logged for compliance purposes. Role: <strong>{user?.role}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    red: 'bg-red-50 text-red-700',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colorMap[color]} mb-4`}>
        <span className="text-lg font-bold">#</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}
