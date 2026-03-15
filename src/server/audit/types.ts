export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'download'
  | 'export'
  | 'share'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'mfa_challenge'
  | 'permission_denied'
  | 'flag'
  | 'hold'
  | 'release'
  | 'publish'
  | 'archive'
  | 'restore'
  | 'provision'
  | 'deprovision'
  | 'stage_change'
  | 'access_grant'
  | 'access_revoke'

export type AuditResult = 'success' | 'failure' | 'denied'

export type AuditResource =
  | 'User'
  | 'Contact'
  | 'Company'
  | 'Deal'
  | 'DealAssignment'
  | 'FundraisingLead'
  | 'ResearchWorkspace'
  | 'ResearchNote'
  | 'DDChecklist'
  | 'FinancialModel'
  | 'ICMemo'
  | 'ExpertEngagement'
  | 'MeetingRecord'
  | 'Fund'
  | 'PortfolioCompany'
  | 'PortfolioKPI'
  | 'ValuationHistory'
  | 'PortfolioAlert'
  | 'CapitalAccount'
  | 'CapitalTransaction'
  | 'InvestorReport'
  | 'DataRoom'
  | 'DataRoomFolder'
  | 'DataRoomDocument'
  | 'DataRoomAccess'
  | 'DocumentAccessLog'
  | 'AuditLog'
  | 'Session'
  | 'Permission'
  | 'System'
  | 'FundAccess'

export interface AuditContext {
  actorId: string
  actorEmail?: string
  ipAddress: string
  userAgent: string
  geoLocation?: string
}

export interface AuditEventInput {
  actorId: string
  subjectId?: string
  action: AuditAction
  resource: AuditResource
  resourceId: string
  details?: Record<string, unknown>
  ipAddress: string
  userAgent: string
  geoLocation?: string
  result: AuditResult
  failReason?: string
}

export interface AuditLogFilter {
  actorId?: string
  action?: AuditAction
  resource?: AuditResource
  resourceId?: string
  result?: AuditResult
  from?: Date
  to?: Date
  page?: number
  pageSize?: number
  search?: string
}
