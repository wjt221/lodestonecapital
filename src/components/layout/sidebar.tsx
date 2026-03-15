'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Role } from '@prisma/client'
import { hasAnyPermission, Permission } from '@/server/auth/rbac'

interface NavItem {
  label: string
  href: string
  requiredPermissions: Permission[]
  icon: string
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    requiredPermissions: [Permission.CRM_DEALS_READ_OWN, Permission.PORTFOLIO_READ_OWN],
    icon: '◈',
  },
  {
    label: 'Deals',
    href: '/dashboard/crm/deals',
    requiredPermissions: [Permission.CRM_DEALS_READ_OWN],
    icon: '⬡',
  },
  {
    label: 'Contacts',
    href: '/dashboard/crm/contacts',
    requiredPermissions: [Permission.CRM_CONTACTS_READ],
    icon: '◎',
  },
  {
    label: 'Companies',
    href: '/dashboard/crm/companies',
    requiredPermissions: [Permission.CRM_CONTACTS_READ],
    icon: '⬢',
  },
  {
    label: 'Portfolio',
    href: '/dashboard/portfolio',
    requiredPermissions: [Permission.PORTFOLIO_READ_OWN],
    icon: '◉',
  },
  {
    label: 'Data Rooms',
    href: '/dashboard/dataroom',
    requiredPermissions: [Permission.DATAROOM_READ_ASSIGNED],
    icon: '▣',
  },
  {
    label: 'Reports',
    href: '/dashboard/reporting',
    requiredPermissions: [Permission.REPORTS_READ_OWN_FUND],
    icon: '▦',
  },
  {
    label: 'Audit Log',
    href: '/dashboard/audit',
    requiredPermissions: [Permission.AUDIT_LOG_READ],
    icon: '▤',
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    requiredPermissions: [Permission.USER_PROVISION],
    icon: '◫',
  },
]

interface SidebarProps {
  userRole: Role
  userName: string
  userEmail: string
}

export function Sidebar({ userRole, userName, userEmail: _userEmail }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) =>
    hasAnyPermission(userRole, item.requiredPermissions),
  )

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            L
          </div>
          <div>
            <p className="font-semibold text-sm">Lodestone Capital</p>
            <p className="text-xs text-gray-400">Investment Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
            {userName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate">{userRole.replace('_', ' ')}</p>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST" className="mt-3">
          <button
            type="submit"
            className="w-full text-left text-xs text-gray-400 hover:text-gray-200 transition-colors px-0"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
