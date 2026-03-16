'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import type { Role } from '@prisma/client'
import { hasAnyPermission, Permission } from '@/server/auth/rbac'

function CompassLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18.5" stroke="#C9A84C" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="13" stroke="#C9A84C" strokeWidth="0.6" strokeDasharray="2 3" />
      <path d="M20 5 L22.2 19 L20 21 L17.8 19 Z" fill="#C9A84C" />
      <path d="M20 35 L22.2 21 L20 19 L17.8 21 Z" fill="#475569" />
      <circle cx="20" cy="20" r="1.8" fill="#C9A84C" />
      <circle cx="20" cy="20" r="0.7" fill="#0F172A" />
      <line x1="20" y1="2" x2="20" y2="5" stroke="#C9A84C" strokeWidth="1.2" />
      <line x1="20" y1="35" x2="20" y2="38" stroke="#475569" strokeWidth="1.2" />
      <line x1="2" y1="20" x2="5" y2="20" stroke="#475569" strokeWidth="1.2" />
      <line x1="35" y1="20" x2="38" y2="20" stroke="#475569" strokeWidth="1.2" />
    </svg>
  )
}

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
      <div className="p-5 border-b border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0F172A] rounded-full flex items-center justify-center border border-amber-500/30">
            <CompassLogo size={22} />
          </div>
          <div>
            <p className="font-semibold text-sm tracking-wide">Lodestone Capital</p>
            <p className="text-xs text-gray-500 tracking-widest uppercase" style={{ fontSize: '9px' }}>Investment Management</p>
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
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-3 w-full text-left text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
