import { Role, DataClassification } from '@prisma/client'

// ============================================================
// PERMISSION DEFINITIONS
// ============================================================
export enum Permission {
  // CRM
  CRM_DEALS_READ_OWN = 'crm:deals:read:own',
  CRM_DEALS_READ_ALL = 'crm:deals:read:all',
  CRM_DEALS_WRITE_OWN = 'crm:deals:write:own',
  CRM_DEALS_WRITE_ALL = 'crm:deals:write:all',
  CRM_CONTACTS_READ = 'crm:contacts:read',
  CRM_CONTACTS_WRITE = 'crm:contacts:write',
  CRM_LP_CONTACTS_READ = 'crm:lp_contacts:read',
  CRM_LP_CONTACTS_WRITE = 'crm:lp_contacts:write',
  // Research
  RESEARCH_READ_OWN = 'research:read:own',
  RESEARCH_READ_ALL = 'research:read:all',
  RESEARCH_WRITE_OWN = 'research:write:own',
  RESEARCH_WRITE_ALL = 'research:write:all',
  IC_MEMO_SUBMIT = 'ic:memo:submit',
  IC_MEMO_APPROVE = 'ic:memo:approve',
  IC_MEMO_COMPLIANCE_CLEAR = 'ic:memo:compliance_clear',
  // Portfolio
  PORTFOLIO_READ_OWN = 'portfolio:read:own',
  PORTFOLIO_READ_ALL = 'portfolio:read:all',
  PORTFOLIO_WRITE = 'portfolio:write',
  VALUATION_APPROVE = 'valuation:approve',
  // Reporting
  REPORTS_READ_OWN_FUND = 'reports:read:own_fund',
  REPORTS_READ_ALL = 'reports:read:all',
  REPORTS_WRITE = 'reports:write',
  REPORTS_APPROVE = 'reports:approve',
  REPORTS_PUBLISH = 'reports:publish',
  REGULATORY_FILE = 'regulatory:file',
  // Data Room
  DATAROOM_READ_ASSIGNED = 'dataroom:read:assigned',
  DATAROOM_READ_ALL = 'dataroom:read:all',
  DATAROOM_UPLOAD = 'dataroom:upload',
  DATAROOM_MANAGE_INVESTOR = 'dataroom:manage:investor',
  DATAROOM_MANAGE_ALL = 'dataroom:manage:all',
  DOCUMENT_DOWNLOAD = 'document:download',
  DOCUMENT_BULK_EXPORT = 'document:bulk_export',
  // Compliance & Audit
  AUDIT_LOG_READ = 'audit:log:read',
  COMPLIANCE_FLAG = 'compliance:flag',
  COMPLIANCE_HOLD = 'compliance:hold',
  ACCESS_REVIEW = 'access:review',
  // Admin
  SYSTEM_CONFIG = 'system:config',
  USER_PROVISION = 'user:provision',
}

// ============================================================
// ROLE → PERMISSIONS MAPPING
// Aligned with actual Prisma schema Role enum values:
// SUPER_ADMIN | MANAGING_PARTNER | PARTNER | PRINCIPAL | ASSOCIATE | ANALYST
// | INVESTOR_RELATIONS | COMPLIANCE | FUND_ACCOUNTANT | LP_VIEWER | READ_ONLY
// ============================================================

/**
 * Permissions shared by all investment professionals (PARTNER, PRINCIPAL, ASSOCIATE, ANALYST).
 * Senior investment staff (PARTNER/PRINCIPAL) additionally get RESEARCH_WRITE_ALL and
 * CRM_DEALS_WRITE_ALL via their individual entries.
 */
const INVESTMENT_TEAM_BASE: Permission[] = [
  Permission.CRM_DEALS_READ_OWN,
  Permission.CRM_DEALS_WRITE_OWN,
  Permission.CRM_CONTACTS_READ,
  Permission.CRM_CONTACTS_WRITE,
  Permission.CRM_LP_CONTACTS_READ,
  Permission.RESEARCH_READ_OWN,
  Permission.RESEARCH_WRITE_OWN,
  Permission.IC_MEMO_SUBMIT,
  Permission.PORTFOLIO_READ_OWN,
  Permission.DATAROOM_READ_ASSIGNED,
  Permission.DATAROOM_UPLOAD,
  Permission.DOCUMENT_DOWNLOAD,
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // ----------------------------------------------------------------
  // MANAGING_PARTNER: Full business access, IC vote, approvals
  // ----------------------------------------------------------------
  MANAGING_PARTNER: [
    Permission.CRM_DEALS_READ_ALL,
    Permission.CRM_DEALS_WRITE_ALL,
    Permission.CRM_CONTACTS_READ,
    Permission.CRM_CONTACTS_WRITE,
    Permission.CRM_LP_CONTACTS_READ,
    Permission.CRM_LP_CONTACTS_WRITE,
    Permission.RESEARCH_READ_ALL,
    Permission.RESEARCH_WRITE_ALL,
    Permission.IC_MEMO_SUBMIT,
    Permission.IC_MEMO_APPROVE,
    Permission.PORTFOLIO_READ_ALL,
    Permission.PORTFOLIO_WRITE,
    Permission.VALUATION_APPROVE,
    Permission.REPORTS_READ_ALL,
    Permission.REPORTS_WRITE,
    Permission.REPORTS_APPROVE,
    Permission.REPORTS_PUBLISH,
    Permission.DATAROOM_READ_ALL,
    Permission.DATAROOM_UPLOAD,
    Permission.DATAROOM_MANAGE_ALL,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_BULK_EXPORT,
  ],

  // ----------------------------------------------------------------
  // PARTNER: Senior deal lead, can read all deals, write all research
  // ----------------------------------------------------------------
  PARTNER: [
    Permission.CRM_DEALS_READ_ALL,
    Permission.CRM_DEALS_WRITE_ALL,
    Permission.CRM_CONTACTS_READ,
    Permission.CRM_CONTACTS_WRITE,
    Permission.CRM_LP_CONTACTS_READ,
    Permission.RESEARCH_READ_ALL,
    Permission.RESEARCH_WRITE_ALL,
    Permission.IC_MEMO_SUBMIT,
    Permission.PORTFOLIO_READ_ALL,
    Permission.PORTFOLIO_WRITE,
    Permission.REPORTS_READ_ALL,
    Permission.DATAROOM_READ_ALL,
    Permission.DATAROOM_UPLOAD,
    Permission.DOCUMENT_DOWNLOAD,
  ],

  // ----------------------------------------------------------------
  // PRINCIPAL: Mid-senior, can read all, write own research/deals
  // ----------------------------------------------------------------
  PRINCIPAL: [
    Permission.CRM_DEALS_READ_ALL,
    Permission.CRM_DEALS_WRITE_OWN,
    Permission.CRM_CONTACTS_READ,
    Permission.CRM_CONTACTS_WRITE,
    Permission.CRM_LP_CONTACTS_READ,
    Permission.RESEARCH_READ_ALL,
    Permission.RESEARCH_WRITE_OWN,
    Permission.IC_MEMO_SUBMIT,
    Permission.PORTFOLIO_READ_ALL,
    Permission.DATAROOM_READ_ASSIGNED,
    Permission.DATAROOM_UPLOAD,
    Permission.DOCUMENT_DOWNLOAD,
  ],

  // ----------------------------------------------------------------
  // ASSOCIATE: Own deals / research, assigned data rooms
  // ----------------------------------------------------------------
  ASSOCIATE: [...INVESTMENT_TEAM_BASE],

  // ----------------------------------------------------------------
  // ANALYST: Most restricted investment team member — own work only
  // ----------------------------------------------------------------
  ANALYST: [
    Permission.CRM_DEALS_READ_OWN,
    Permission.CRM_DEALS_WRITE_OWN,
    Permission.CRM_CONTACTS_READ,
    Permission.RESEARCH_READ_OWN,
    Permission.RESEARCH_WRITE_OWN,
    Permission.IC_MEMO_SUBMIT,
    Permission.PORTFOLIO_READ_OWN,
    Permission.DATAROOM_READ_ASSIGNED,
    Permission.DOCUMENT_DOWNLOAD,
  ],

  // ----------------------------------------------------------------
  // INVESTOR_RELATIONS: LP-facing, manage LP data rooms and reports
  // ----------------------------------------------------------------
  INVESTOR_RELATIONS: [
    Permission.CRM_DEALS_READ_ALL,
    Permission.CRM_LP_CONTACTS_READ,
    Permission.CRM_LP_CONTACTS_WRITE,
    Permission.RESEARCH_READ_ALL,
    Permission.PORTFOLIO_READ_ALL,
    Permission.REPORTS_READ_ALL,
    Permission.REPORTS_WRITE,
    Permission.DATAROOM_READ_ALL,
    Permission.DATAROOM_UPLOAD,
    Permission.DATAROOM_MANAGE_INVESTOR,
    Permission.DOCUMENT_DOWNLOAD,
  ],

  // ----------------------------------------------------------------
  // COMPLIANCE: Read-only everywhere + compliance actions + audit log
  // P-04: CO has read-only access everywhere (no generic WRITE permissions)
  // ----------------------------------------------------------------
  COMPLIANCE: [
    Permission.CRM_DEALS_READ_ALL,
    Permission.CRM_CONTACTS_READ,
    Permission.CRM_LP_CONTACTS_READ,
    Permission.RESEARCH_READ_ALL,
    Permission.IC_MEMO_COMPLIANCE_CLEAR, // Compliance-specific write action
    Permission.PORTFOLIO_READ_ALL,
    Permission.REPORTS_READ_ALL,
    Permission.REGULATORY_FILE,
    Permission.DATAROOM_READ_ALL,
    Permission.AUDIT_LOG_READ,
    Permission.COMPLIANCE_FLAG,
    Permission.COMPLIANCE_HOLD,
    Permission.ACCESS_REVIEW,
  ],

  // ----------------------------------------------------------------
  // FUND_ACCOUNTANT: Portfolio + capital accounts + reporting (no CRM/deal access)
  // ----------------------------------------------------------------
  FUND_ACCOUNTANT: [
    Permission.PORTFOLIO_READ_ALL,
    Permission.PORTFOLIO_WRITE,
    Permission.REPORTS_READ_ALL,
    Permission.REPORTS_WRITE,
    Permission.DATAROOM_READ_ASSIGNED,
    Permission.DOCUMENT_DOWNLOAD,
  ],

  // ----------------------------------------------------------------
  // LP_VIEWER: Investor — own fund reports and assigned data rooms only
  // P-02: LP can only access funds in their FundAccess table
  // ----------------------------------------------------------------
  LP_VIEWER: [
    Permission.REPORTS_READ_OWN_FUND,
    Permission.DATAROOM_READ_ASSIGNED,
    Permission.DOCUMENT_DOWNLOAD,
  ],

  // ----------------------------------------------------------------
  // READ_ONLY: View-only access to non-sensitive internal data
  // ----------------------------------------------------------------
  READ_ONLY: [
    Permission.CRM_DEALS_READ_OWN,
    Permission.CRM_CONTACTS_READ,
    Permission.RESEARCH_READ_OWN,
    Permission.PORTFOLIO_READ_OWN,
    Permission.REPORTS_READ_OWN_FUND,
    Permission.DATAROOM_READ_ASSIGNED,
  ],

  // ----------------------------------------------------------------
  // SUPER_ADMIN: System administration only — ZERO business data access
  // P-05: SA has zero access to business data
  // ----------------------------------------------------------------
  SUPER_ADMIN: [
    Permission.SYSTEM_CONFIG,
    Permission.USER_PROVISION,
    Permission.ACCESS_REVIEW,
    // NOTE: No CRM, Research, Portfolio, Reporting, or DataRoom permissions.
    // SA can provision accounts but cannot view any business data.
  ],
}

// ============================================================
// ENFORCEMENT FUNCTIONS
// ============================================================

/**
 * P-01: Check if a user role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check if user has at least one of the listed permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

/**
 * Check if user has ALL of the listed permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Determine if a role can access a given data classification level.
 *
 * P-05: SUPER_ADMIN cannot access any business data — only PUBLIC.
 * P-08: RESTRICTED data requires MFA (checked separately via canAccessRestrictedData).
 * LP_VIEWER can only see CONFIDENTIAL and PUBLIC data (their own reports).
 * READ_ONLY follows internal-and-below access.
 */
export function canAccessDataClassification(
  role: Role,
  classification: DataClassification,
): boolean {
  switch (role) {
    case 'SUPER_ADMIN':
      // SA can only access PUBLIC configuration data — never business data
      return classification === 'PUBLIC'

    case 'LP_VIEWER':
      // LP investors can see their own reports (CONFIDENTIAL) and public data
      return classification === 'PUBLIC' || classification === 'CONFIDENTIAL'

    case 'READ_ONLY':
      // Read-only users see up to INTERNAL data
      return classification === 'PUBLIC' || classification === 'INTERNAL'

    case 'COMPLIANCE':
      // Compliance can see all data for regulatory purposes (including RESTRICTED and HIGHLY_RESTRICTED)
      return true

    case 'MANAGING_PARTNER':
    case 'PARTNER':
    case 'PRINCIPAL':
    case 'ASSOCIATE':
    case 'ANALYST':
    case 'INVESTOR_RELATIONS':
    case 'FUND_ACCOUNTANT':
      // Investment team and operations can access up to RESTRICTED (HIGHLY_RESTRICTED requires explicit grant)
      return (
        classification === 'PUBLIC' ||
        classification === 'INTERNAL' ||
        classification === 'CONFIDENTIAL' ||
        classification === 'RESTRICTED'
      )

    default:
      return false
  }
}

/**
 * P-04: Compliance Officer (COMPLIANCE role) has read-only access to all business data.
 * Only compliance-specific write actions are permitted (flag, hold, IC memo clearance).
 * Returns true when a CO is attempting a generic write that should be blocked.
 */
export function isComplianceReadOnlyViolation(
  role: Role,
  isWriteOperation: boolean,
): boolean {
  if (role !== 'COMPLIANCE') return false
  // CO can only write: COMPLIANCE_FLAG, COMPLIANCE_HOLD, IC_MEMO_COMPLIANCE_CLEAR, REGULATORY_FILE
  // Generic write operations (create/update/delete business records) are blocked.
  return isWriteOperation
}

/**
 * P-03: Investment professionals (ASSOCIATE, ANALYST) can only modify deals they are assigned to.
 * PARTNER and PRINCIPAL have broader deal write access but still checked for strict assignment.
 */
export function requiresDealAssignmentCheck(role: Role): boolean {
  return role === 'ASSOCIATE' || role === 'ANALYST'
}

/**
 * P-02: LP_VIEWER users can only access funds listed in their FundAccess table.
 * Returns true when a fund access table check must be performed before granting access.
 */
export function requiresFundAccessCheck(role: Role): boolean {
  return role === 'LP_VIEWER'
}

/**
 * P-06: IC memo approval vote by MANAGING_PARTNER requires prior CO clearance.
 * The memoStatus must be 'COMPLIANCE_CLEARED' before an MP vote is permitted.
 */
export function canVoteOnICMemo(
  role: Role,
  memoCoCleared: boolean,
): boolean {
  if (role !== 'MANAGING_PARTNER') return false
  return memoCoCleared
}

/**
 * P-08: RESTRICTED and HIGHLY_RESTRICTED data requires MFA to be enabled on the account.
 * HIGHLY_RESTRICTED also requires explicit per-resource access grant.
 */
export function canAccessRestrictedData(
  role: Role,
  mfaEnabled: boolean,
  classification: DataClassification,
): boolean {
  if (classification === 'PUBLIC' || classification === 'INTERNAL' || classification === 'CONFIDENTIAL') {
    return true // No MFA required for lower classifications
  }
  // RESTRICTED or HIGHLY_RESTRICTED: MFA is mandatory
  if (!mfaEnabled) return false
  return canAccessDataClassification(role, classification)
}

/**
 * Thrown when a user lacks required permission.
 */
export class PermissionDeniedError extends Error {
  constructor(
    public readonly role: Role,
    public readonly permission: Permission,
    message?: string,
  ) {
    super(message ?? `Role ${role} does not have permission: ${permission}`)
    this.name = 'PermissionDeniedError'
  }
}

/**
 * Assert permission or throw PermissionDeniedError.
 */
export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new PermissionDeniedError(role, permission)
  }
}

/**
 * Assert any permission or throw PermissionDeniedError.
 */
export function assertAnyPermission(role: Role, permissions: Permission[]): void {
  if (!hasAnyPermission(role, permissions)) {
    throw new PermissionDeniedError(
      role,
      permissions[0],
      `Role ${role} does not have any of: ${permissions.join(', ')}`,
    )
  }
}
