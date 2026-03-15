import { z } from 'zod'
import { Role, DataClassification, DealStage, FundraisingStage, DataRoomType } from '@prisma/client'

// ============================================================
// SHARED
// ============================================================
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const DateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
})

export const IdSchema = z.object({ id: z.string().cuid() })

// ============================================================
// USER
// ============================================================
export const UserCreateSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(255),
  role: z.nativeEnum(Role),
  accessExpiresAt: z.date().optional(),
})

export const UserUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(255).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  accessExpiresAt: z.date().optional(),
})

// ============================================================
// CRM
// ============================================================
export const ContactCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  title: z.string().max(255).optional(),
  companyId: z.string().cuid().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
  classification: z.nativeEnum(DataClassification).default('INTERNAL'),
})

export const ContactUpdateSchema = ContactCreateSchema.partial().extend({
  id: z.string().cuid(),
})

export const CompanyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  website: z.string().url().optional().or(z.literal('')),
  sector: z.string().max(100).optional(),
  subSector: z.string().max(100).optional(),
  headquarters: z.string().max(255).optional(),
  employeeCount: z.number().int().positive().optional(),
  yearFounded: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().max(5000).optional(),
  classification: z.nativeEnum(DataClassification).default('INTERNAL'),
})

export const CompanyUpdateSchema = CompanyCreateSchema.partial().extend({
  id: z.string().cuid(),
})

export const DealCreateSchema = z.object({
  name: z.string().min(1).max(255),
  companyId: z.string().cuid(),
  stage: z.nativeEnum(DealStage).default('SOURCING'),
  fundId: z.string().cuid().optional(),
  sourceChannel: z.enum(['inbound', 'outbound', 'intermediary', 'proprietary']),
  sourcedBy: z.string().cuid(),
  probabilityWeight: z.number().min(0).max(1).optional(),
  targetInvestment: z.number().positive().optional(),
  estimatedClose: z.date().optional(),
  passedReason: z.string().max(1000).optional(),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const DealUpdateSchema = DealCreateSchema.partial().extend({
  id: z.string().cuid(),
})

export const DealStageUpdateSchema = z.object({
  dealId: z.string().cuid(),
  toStage: z.nativeEnum(DealStage),
  notes: z.string().max(1000).optional(),
})

export const DealAssignmentSchema = z.object({
  dealId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.enum(['lead', 'support', 'reviewer']),
})

export const ScreeningScorecardSchema = z.object({
  dealId: z.string().cuid(),
  marketScore: z.number().int().min(1).max(5),
  teamScore: z.number().int().min(1).max(5),
  financialsScore: z.number().int().min(1).max(5),
  competitiveScore: z.number().int().min(1).max(5),
  fitScore: z.number().int().min(1).max(5),
  recommendation: z.enum(['advance', 'pass', 'hold']),
  notes: z.string().max(5000).optional(),
})

export const InteractionSchema = z.object({
  contactId: z.string().cuid(),
  type: z.enum(['email', 'call', 'meeting', 'note']),
  subject: z.string().min(1).max(255),
  body: z.string().max(10000).optional(),
  occurredAt: z.date(),
  classification: z.nativeEnum(DataClassification).default('INTERNAL'),
})

export const FundraisingLeadSchema = z.object({
  contactId: z.string().cuid(),
  fundId: z.string().cuid(),
  stage: z.nativeEnum(FundraisingStage).default('PROSPECT'),
  targetCommitment: z.number().positive().optional(),
  actualCommitment: z.number().positive().optional(),
  probability: z.number().min(0).max(1).optional(),
  notes: z.string().max(5000).optional(),
  ndaExecutedAt: z.date().optional(),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

// ============================================================
// RESEARCH
// ============================================================
export const ResearchNoteSchema = z.object({
  workspaceId: z.string().cuid(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  ddCategory: z.enum(['commercial', 'financial', 'legal', 'operational', 'esg', 'cyber', 'tax']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  keyFindings: z.array(z.string().max(500)).default([]),
  tags: z.array(z.string().max(100)).default([]),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const DDChecklistItemSchema = z.object({
  item: z.string().min(1).max(500),
  status: z.enum(['pending', 'in_progress', 'complete', 'flagged', 'na']),
  assignee: z.string().optional(),
  notes: z.string().max(2000).optional(),
  completedAt: z.date().optional(),
})

export const DDChecklistSchema = z.object({
  workspaceId: z.string().cuid(),
  category: z.enum(['commercial', 'financial', 'legal', 'operational', 'esg', 'cyber', 'tax']),
  items: z.array(DDChecklistItemSchema),
  ownerRole: z.nativeEnum(Role),
  completionGate: z.string().min(1).max(500),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const FinancialModelSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(1).max(255),
  version: z.number().int().min(1).default(1),
  assumptions: z.array(z.object({
    key: z.string(),
    value: z.unknown(),
    source: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    date: z.date(),
  })).default([]),
  scenarios: z.array(z.object({
    name: z.string(),
    description: z.string(),
    assumptions: z.record(z.unknown()),
  })).default([]),
  reviewStatus: z.enum(['draft', 'in_review', 'approved', 'rejected']).default('draft'),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const ICMemoSchema = z.object({
  dealId: z.string().cuid(),
  version: z.number().int().min(1).default(1),
  thesis: z.string().min(1),
  marketAnalysis: z.string().min(1),
  financialSummary: z.string().min(1),
  riskAssessment: z.string().min(1),
  termsProposed: z.string().min(1),
  recommendation: z.enum(['invest', 'pass', 'hold']),
  status: z.enum(['draft', 'submitted', 'co_cleared', 'scheduled', 'voted', 'approved', 'rejected']).default('draft'),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const ICMemoVoteSchema = z.object({
  memoId: z.string().cuid(),
  vote: z.enum(['approve', 'reject', 'abstain']),
  rationale: z.string().min(1).max(2000),
})

// ============================================================
// EXPERT ENGAGEMENTS & MEETINGS
// ============================================================
export const ExpertEngagementSchema = z.object({
  expertName: z.string().min(1).max(255),
  affiliation: z.string().min(1).max(255),
  topic: z.string().min(1).max(500),
  dealId: z.string().cuid().optional(),
  date: z.date(),
  durationMinutes: z.number().int().min(1).max(480),
  fee: z.number().positive().optional(),
  platform: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const MeetingRecordSchema = z.object({
  dealId: z.string().cuid().optional(),
  type: z.enum(['initial_mgmt', 'followup', 'site_visit', 'reference_check', 'expert_call']),
  participants: z.array(z.object({
    name: z.string(),
    title: z.string(),
    company: z.string(),
  })),
  date: z.date(),
  location: z.string().max(255).optional(),
  agenda: z.string().max(2000).optional(),
  notes: z.string().min(1),
  keyFindings: z.array(z.string().max(500)).default([]),
  ddCategory: z.enum(['commercial', 'financial', 'legal', 'operational', 'esg', 'cyber', 'tax']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  followUpItems: z.array(z.object({
    item: z.string(),
    owner: z.string(),
    dueDate: z.date(),
  })).default([]),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

// ============================================================
// PORTFOLIO
// ============================================================
export const FundCreateSchema = z.object({
  name: z.string().min(1).max(255),
  vintage: z.number().int().min(1990).max(2100),
  strategy: z.string().min(1).max(100),
  targetSize: z.number().positive().optional(),
  committedCapital: z.number().positive().optional(),
  calledCapital: z.number().min(0).optional(),
  distributedCapital: z.number().min(0).optional(),
  nav: z.number().min(0).optional(),
  status: z.enum(['fundraising', 'active', 'harvesting', 'terminated']).default('active'),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const PortfolioCompanySchema = z.object({
  fundId: z.string().cuid(),
  companyName: z.string().min(1).max(255),
  investmentDate: z.date(),
  initialInvestment: z.number().positive(),
  currentValuation: z.number().min(0).optional(),
  valuationDate: z.date().optional(),
  valuationMethod: z.enum(['market_comps', 'dcf', 'transaction_price', 'cost']).optional(),
  valuationBasis: z.enum(['Level 1', 'Level 2', 'Level 3']).optional(),
  ownership: z.number().min(0).max(100).optional(),
  boardSeat: z.boolean().default(false),
  status: z.enum(['active', 'realized', 'written_off']).default('active'),
  sector: z.string().max(100).optional(),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const PortfolioKPISchema = z.object({
  portfolioCompanyId: z.string().cuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM format'),
  revenue: z.number().optional(),
  ebitda: z.number().optional(),
  cashBalance: z.number().optional(),
  headcount: z.number().int().positive().optional(),
  customerCount: z.number().int().positive().optional(),
  revenueVsPlan: z.number().optional(),
  customMetrics: z.record(z.unknown()).optional(),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const ValuationHistorySchema = z.object({
  portfolioCompanyId: z.string().cuid(),
  valuationDate: z.date(),
  priorValue: z.number().min(0),
  newValue: z.number().min(0),
  method: z.enum(['market_comps', 'dcf', 'transaction_price', 'cost']),
  basis: z.enum(['Level 1', 'Level 2', 'Level 3']),
  rationale: z.string().min(1),
  thirdPartyReview: z.boolean().default(false),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const PortfolioAlertSchema = z.object({
  portfolioCompanyId: z.string().cuid(),
  type: z.enum(['financial', 'operational', 'esg', 'covenant']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  triggerMetric: z.string().max(100).optional(),
  triggerThreshold: z.string().max(100).optional(),
  triggerActual: z.string().max(100).optional(),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const CapitalAccountSchema = z.object({
  fundId: z.string().cuid(),
  investorUserId: z.string().cuid().optional(),
  investorName: z.string().min(1).max(255),
  commitment: z.number().positive(),
  calledAmount: z.number().min(0).default(0),
  distributedAmount: z.number().min(0).default(0),
  nav: z.number().min(0).default(0),
  ownership: z.number().min(0).max(100),
  classification: z.nativeEnum(DataClassification).default('RESTRICTED'),
})

export const CapitalTransactionSchema = z.object({
  capitalAccountId: z.string().cuid(),
  type: z.enum(['call', 'distribution', 'recallable', 'return_of_capital']),
  amount: z.number().positive(),
  date: z.date(),
  noticeDate: z.date().optional(),
  dueDate: z.date().optional(),
  status: z.enum(['pending', 'completed', 'overdue']).default('pending'),
  referenceNumber: z.string().max(100).optional(),
  classification: z.nativeEnum(DataClassification).default('RESTRICTED'),
})

// ============================================================
// REPORTING
// ============================================================
export const InvestorReportSchema = z.object({
  fundId: z.string().cuid(),
  type: z.enum(['quarterly_letter', 'capital_account', 'annual_audit', 'k1', 'esg', 'capital_call', 'distribution']),
  period: z.string().min(1).max(10),
  title: z.string().min(1).max(255),
  status: z.enum(['draft', 'in_review', 'mp_approved', 'co_approved', 'published']).default('draft'),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

// ============================================================
// DATA ROOM
// ============================================================
export const DataRoomSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(DataRoomType),
  dealId: z.string().cuid().optional(),
  fundId: z.string().cuid().optional(),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const DataRoomFolderSchema = z.object({
  dataRoomId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
  name: z.string().min(1).max(255),
  sortOrder: z.number().int().min(0).default(0),
  classification: z.nativeEnum(DataClassification).default('CONFIDENTIAL'),
})

export const DataRoomDocumentSchema = z.object({
  folderId: z.string().cuid(),
  name: z.string().min(1).max(255),
  classification: z.nativeEnum(DataClassification),
})

export const DataRoomAccessSchema = z.object({
  dataRoomId: z.string().cuid(),
  userId: z.string().cuid(),
  permission: z.enum(['read', 'upload', 'manage']),
  folders: z.array(z.string().cuid()).default([]),
  expiresAt: z.date(),
})

export const FundAccessSchema = z.object({
  userId: z.string().cuid(),
  fundId: z.string().cuid(),
  expiresAt: z.date(),
})
