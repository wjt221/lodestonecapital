import { redirect } from 'next/navigation'
import { auth } from '@/server/auth/config'
import { Sidebar } from '@/components/layout/sidebar'
import type { Role } from '@prisma/client'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = session.user as {
    id: string
    name: string
    email: string
    role: Role
    mfaEnabled: boolean
    lastActivityAt: number
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        userRole={user.role}
        userName={user.name ?? user.email}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
