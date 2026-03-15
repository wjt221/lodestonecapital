import {
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  requiresDealAssignmentCheck,
  requiresFundAccessCheck,
} from '@/server/auth/rbac'

describe('RBAC - hasPermission', () => {
  it('grants MANAGING_PARTNER all core permissions', () => {
    expect(hasPermission('MANAGING_PARTNER', Permission.CRM_DEALS_READ_ALL)).toBe(true)
    expect(hasPermission('MANAGING_PARTNER', Permission.PORTFOLIO_WRITE)).toBe(true)
    expect(hasPermission('MANAGING_PARTNER', Permission.REPORTS_APPROVE)).toBe(true)
    expect(hasPermission('MANAGING_PARTNER', Permission.USER_PROVISION)).toBe(true)
    expect(hasPermission('MANAGING_PARTNER', Permission.AUDIT_LOG_READ)).toBe(true)
  })

  it('restricts ANALYST from write-all operations', () => {
    expect(hasPermission('ANALYST', Permission.CRM_DEALS_WRITE_ALL)).toBe(false)
    expect(hasPermission('ANALYST', Permission.PORTFOLIO_WRITE)).toBe(false)
    expect(hasPermission('ANALYST', Permission.USER_PROVISION)).toBe(false)
    expect(hasPermission('ANALYST', Permission.REPORTS_APPROVE)).toBe(false)
    expect(hasPermission('ANALYST', Permission.AUDIT_LOG_READ)).toBe(false)
  })

  it('allows ANALYST to read and write own deals', () => {
    expect(hasPermission('ANALYST', Permission.CRM_DEALS_READ_OWN)).toBe(true)
    expect(hasPermission('ANALYST', Permission.CRM_DEALS_WRITE_OWN)).toBe(true)
    expect(hasPermission('ANALYST', Permission.CRM_CONTACTS_READ)).toBe(true)
  })

  it('restricts LP_VIEWER to fund-specific reports only', () => {
    expect(hasPermission('LP_VIEWER', Permission.REPORTS_READ_OWN_FUND)).toBe(true)
    expect(hasPermission('LP_VIEWER', Permission.REPORTS_READ_ALL)).toBe(false)
    expect(hasPermission('LP_VIEWER', Permission.CRM_DEALS_READ_OWN)).toBe(false)
    expect(hasPermission('LP_VIEWER', Permission.CRM_CONTACTS_READ)).toBe(false)
  })

  it('grants LP_VIEWER document download', () => {
    expect(hasPermission('LP_VIEWER', Permission.DOCUMENT_DOWNLOAD)).toBe(true)
    expect(hasPermission('LP_VIEWER', Permission.DATAROOM_READ_ASSIGNED)).toBe(true)
  })

  it('restricts READ_ONLY to read permissions only', () => {
    expect(hasPermission('READ_ONLY', Permission.CRM_DEALS_READ_OWN)).toBe(true)
    expect(hasPermission('READ_ONLY', Permission.CRM_DEALS_WRITE_OWN)).toBe(false)
    expect(hasPermission('READ_ONLY', Permission.CRM_CONTACTS_WRITE)).toBe(false)
  })

  it('grants COMPLIANCE audit log access', () => {
    expect(hasPermission('COMPLIANCE', Permission.AUDIT_LOG_READ)).toBe(true)
    expect(hasPermission('COMPLIANCE', Permission.IC_MEMO_COMPLIANCE_CLEAR)).toBe(true)
    expect(hasPermission('COMPLIANCE', Permission.COMPLIANCE_FLAG)).toBe(true)
  })

  it('grants SUPER_ADMIN all permissions', () => {
    expect(hasPermission('SUPER_ADMIN', Permission.USER_PROVISION)).toBe(true)
    expect(hasPermission('SUPER_ADMIN', Permission.SYSTEM_CONFIG)).toBe(true)
    expect(hasPermission('SUPER_ADMIN', Permission.AUDIT_LOG_READ)).toBe(true)
  })

  it('grants FUND_ACCOUNTANT portfolio read and capital account management', () => {
    expect(hasPermission('FUND_ACCOUNTANT', Permission.PORTFOLIO_READ_ALL)).toBe(true)
    expect(hasPermission('FUND_ACCOUNTANT', Permission.REPORTS_WRITE)).toBe(true)
    expect(hasPermission('FUND_ACCOUNTANT', Permission.CRM_DEALS_WRITE_OWN)).toBe(false)
  })

  it('grants PARTNER IC memo approval', () => {
    expect(hasPermission('PARTNER', Permission.IC_MEMO_APPROVE)).toBe(true)
    expect(hasPermission('ASSOCIATE', Permission.IC_MEMO_APPROVE)).toBe(false)
  })
})

describe('RBAC - hasAnyPermission', () => {
  it('returns true when user has at least one of the permissions', () => {
    expect(
      hasAnyPermission('ANALYST', [Permission.CRM_DEALS_READ_OWN, Permission.USER_PROVISION])
    ).toBe(true)
  })

  it('returns false when user has none of the permissions', () => {
    expect(
      hasAnyPermission('LP_VIEWER', [Permission.USER_PROVISION, Permission.SYSTEM_CONFIG])
    ).toBe(false)
  })

  it('returns false for empty permissions array', () => {
    expect(hasAnyPermission('MANAGING_PARTNER', [])).toBe(false)
  })
})

describe('RBAC - requiresDealAssignmentCheck', () => {
  it('returns true for ANALYST and ASSOCIATE', () => {
    expect(requiresDealAssignmentCheck('ANALYST')).toBe(true)
    expect(requiresDealAssignmentCheck('ASSOCIATE')).toBe(true)
  })

  it('returns false for senior roles', () => {
    expect(requiresDealAssignmentCheck('MANAGING_PARTNER')).toBe(false)
    expect(requiresDealAssignmentCheck('PARTNER')).toBe(false)
    expect(requiresDealAssignmentCheck('PRINCIPAL')).toBe(false)
  })
})

describe('RBAC - requiresFundAccessCheck', () => {
  it('returns true for LP_VIEWER', () => {
    expect(requiresFundAccessCheck('LP_VIEWER')).toBe(true)
  })

  it('returns false for internal roles', () => {
    expect(requiresFundAccessCheck('MANAGING_PARTNER')).toBe(false)
    expect(requiresFundAccessCheck('ANALYST')).toBe(false)
    expect(requiresFundAccessCheck('INVESTOR_RELATIONS')).toBe(false)
  })
})

describe('RBAC - ROLE_PERMISSIONS completeness', () => {
  const allRoles = Object.keys(ROLE_PERMISSIONS)

  it('defines permissions for all roles', () => {
    const expectedRoles = [
      'SUPER_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'PRINCIPAL',
      'ASSOCIATE', 'ANALYST', 'INVESTOR_RELATIONS', 'COMPLIANCE',
      'FUND_ACCOUNTANT', 'LP_VIEWER', 'READ_ONLY',
    ]
    for (const role of expectedRoles) {
      expect(allRoles).toContain(role)
    }
  })

  it('all roles have at least one permission', () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      expect(perms.length).toBeGreaterThan(0), `${role} has no permissions`
    }
  })

  it('no role has duplicate permissions', () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      const unique = new Set(perms)
      expect(unique.size).toBe(perms.length), `${role} has duplicate permissions`
    }
  })
})
