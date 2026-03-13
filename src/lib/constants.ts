// =============================================================================
// Lodestone Capital - Application Constants
// =============================================================================

export const DATA_CLASSIFICATION = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  CONFIDENTIAL: 'CONFIDENTIAL',
  RESTRICTED: 'RESTRICTED',
  HIGHLY_RESTRICTED: 'HIGHLY_RESTRICTED',
} as const

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGING_PARTNER: 'MANAGING_PARTNER',
  PARTNER: 'PARTNER',
  PRINCIPAL: 'PRINCIPAL',
  ASSOCIATE: 'ASSOCIATE',
  ANALYST: 'ANALYST',
  INVESTOR_RELATIONS: 'INVESTOR_RELATIONS',
  COMPLIANCE: 'COMPLIANCE',
  FUND_ACCOUNTANT: 'FUND_ACCOUNTANT',
  LP_VIEWER: 'LP_VIEWER',
  READ_ONLY: 'READ_ONLY',
} as const

export const SESSION = {
  INACTIVITY_TIMEOUT_MS:
    parseInt(process.env.SESSION_INACTIVITY_TIMEOUT_MINUTES || '15') * 60 * 1000,
  ABSOLUTE_TIMEOUT_MS:
    parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_HOURS || '8') * 60 * 60 * 1000,
  MAX_CONCURRENT_SESSIONS: 1,
} as const

export const AUDIT = {
  RETENTION_YEARS: parseInt(process.env.AUDIT_LOG_RETENTION_YEARS || '7'),
} as const

export const DEAL_STAGES = [
  'SOURCING',
  'INITIAL_REVIEW',
  'SCREENING',
  'DILIGENCE',
  'IC_REVIEW',
  'TERM_SHEET',
  'LEGAL',
  'CLOSED',
  'PASSED',
  'PORTFOLIO',
] as const

export const FUNDRAISING_STAGES = [
  'TARGET',
  'PROSPECT',
  'FIRST_MEETING',
  'DILIGENCE',
  'COMMITMENT',
  'SUBSCRIPTION',
  'FUNDED',
  'DECLINED',
] as const

export const DD_CATEGORIES = [
  'commercial',
  'financial',
  'legal',
  'operational',
  'esg',
  'cyber',
  'tax',
  'technical',
  'regulatory',
] as const

export const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

export const ALERT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'] as const

export const ALERT_CATEGORIES = ['financial', 'operational', 'esg', 'covenant', 'legal'] as const

export const REPORT_TYPES = [
  'QUARTERLY',
  'ANNUAL',
  'MONTHLY',
  'AD_HOC',
  'CAPITAL_ACCOUNT',
  'K1_TAX',
  'AUDITED_FINANCIALS',
] as const

export const REPORT_STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const

export const TRANSACTION_TYPES = [
  'CAPITAL_CALL',
  'DISTRIBUTION',
  'MANAGEMENT_FEE',
  'CARRIED_INTEREST',
  'RECALLABLE_DISTRIBUTION',
  'RETURN_OF_CAPITAL',
  'INCOME_DISTRIBUTION',
] as const

export const KPI_CATEGORIES = [
  'REVENUE',
  'PROFITABILITY',
  'GROWTH',
  'OPERATIONAL',
  'FINANCIAL',
  'CUSTOMER',
  'EMPLOYEE',
  'OTHER',
] as const

export const INTERACTION_TYPES = [
  'EMAIL',
  'CALL',
  'MEETING',
  'NOTE',
  'CONFERENCE',
  'INTRO',
  'FOLLOW_UP',
] as const

export const DATAROOM_TYPES = [
  'DEAL_DILIGENCE',
  'PORTFOLIO_COMPANY',
  'FUND_LP',
  'INTERNAL',
] as const

export const CHECKLIST_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'WAIVED',
  'NA',
] as const

export const EXPERT_ENGAGEMENT_STATUSES = [
  'IDENTIFIED',
  'OUTREACH',
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'DECLINED',
] as const

export const IC_MEMO_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'COMPLIANCE_REVIEW',
  'COMPLIANCE_CLEARED',
  'UNDER_VOTE',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const

// P-07: All access grants expire after 12 months
export const ACCESS_EXPIRY_MONTHS = 12

// Password policy
export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  MAX_AGE_DAYS: 90,
  HISTORY_COUNT: 12,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const

// File upload constraints
export const UPLOAD = {
  MAX_FILE_SIZE_BYTES: 500 * 1024 * 1024, // 500 MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
} as const
