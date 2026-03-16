-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'PRINCIPAL', 'ASSOCIATE', 'ANALYST', 'INVESTOR_RELATIONS', 'COMPLIANCE', 'FUND_ACCOUNTANT', 'LP_VIEWER', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'HIGHLY_RESTRICTED');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('SOURCING', 'INITIAL_REVIEW', 'SCREENING', 'DILIGENCE', 'IC_REVIEW', 'TERM_SHEET', 'LEGAL', 'CLOSED', 'PASSED', 'PORTFOLIO');

-- CreateEnum
CREATE TYPE "FundraisingStage" AS ENUM ('TARGET', 'PROSPECT', 'FIRST_MEETING', 'DILIGENCE', 'COMMITMENT', 'SUBSCRIPTION', 'FUNDED', 'DECLINED');

-- CreateEnum
CREATE TYPE "DataRoomType" AS ENUM ('DEAL_DILIGENCE', 'PORTFOLIO_COMPANY', 'FUND_LP', 'INTERNAL');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'NOTE', 'CONFERENCE', 'INTRO', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "KPICategory" AS ENUM ('REVENUE', 'PROFITABILITY', 'GROWTH', 'OPERATIONAL', 'FINANCIAL', 'CUSTOMER', 'EMPLOYEE', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CAPITAL_CALL', 'DISTRIBUTION', 'MANAGEMENT_FEE', 'CARRIED_INTEREST', 'RECALLABLE_DISTRIBUTION', 'RETURN_OF_CAPITAL', 'INCOME_DISTRIBUTION');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('QUARTERLY', 'ANNUAL', 'MONTHLY', 'AD_HOC', 'CAPITAL_ACCOUNT', 'K1_TAX', 'AUDITED_FINANCIALS');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'WAIVED', 'NA');

-- CreateEnum
CREATE TYPE "ExpertEngagementStatus" AS ENUM ('IDENTIFIED', 'OUTREACH', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ANALYST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "passwordChangedAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "FundAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canAdmin" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "FundAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "linkedInUrl" TEXT,
    "twitterHandle" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "timezone" TEXT,
    "tags" TEXT[],
    "isFounder" BOOLEAN NOT NULL DEFAULT false,
    "isInvestor" BOOLEAN NOT NULL DEFAULT false,
    "isExpert" BOOLEAN NOT NULL DEFAULT false,
    "isLP" BOOLEAN NOT NULL DEFAULT false,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "website" TEXT,
    "description" TEXT,
    "sector" TEXT,
    "subSector" TEXT,
    "stage" TEXT,
    "foundedYear" INTEGER,
    "headquarters" TEXT,
    "country" TEXT,
    "employeeCount" INTEGER,
    "revenueRange" TEXT,
    "linkedInUrl" TEXT,
    "crunchbaseUrl" TEXT,
    "pitchbookId" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'SOURCING',
    "description" TEXT,
    "sector" TEXT,
    "geography" TEXT,
    "targetFundId" TEXT,
    "checkSizeMin" DECIMAL(18,2),
    "checkSizeMax" DECIMAL(18,2),
    "targetOwnership" DECIMAL(5,4),
    "entryValuation" DECIMAL(18,2),
    "revenue" DECIMAL(18,2),
    "revenueGrowth" DECIMAL(8,4),
    "ebitda" DECIMAL(18,2),
    "sourceChannel" TEXT,
    "sourceContact" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "passReason" TEXT,
    "icDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealAssignment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealStageHistory" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fromStage" "DealStage",
    "toStage" "DealStage" NOT NULL,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DealStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningScorecard" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "marketSize" INTEGER,
    "marketSizeNotes" TEXT,
    "teamStrength" INTEGER,
    "teamStrengthNotes" TEXT,
    "productDiff" INTEGER,
    "productDiffNotes" TEXT,
    "businessModel" INTEGER,
    "businessModelNotes" TEXT,
    "traction" INTEGER,
    "tractionNotes" TEXT,
    "competition" INTEGER,
    "competitionNotes" TEXT,
    "financials" INTEGER,
    "financialsNotes" TEXT,
    "timing" INTEGER,
    "timingNotes" TEXT,
    "thesisAlignment" INTEGER,
    "thesisAlignmentNotes" TEXT,
    "totalScore" DECIMAL(5,2),
    "recommendation" TEXT,
    "summaryNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dealId" TEXT,
    "companyId" TEXT,
    "contactId" TEXT,
    "userId" TEXT,
    "followUpAt" TIMESTAMP(3),
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundraisingLead" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "contactId" TEXT,
    "name" TEXT NOT NULL,
    "stage" "FundraisingStage" NOT NULL DEFAULT 'PROSPECT',
    "targetAllocation" DECIMAL(18,2),
    "committedAmount" DECIMAL(18,2),
    "fundedAmount" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "investorType" TEXT,
    "geography" TEXT,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "nextActionDate" TIMESTAMP(3),
    "nextActionNote" TEXT,
    "passReason" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundraisingLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchWorkspace" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchNote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
    "tags" TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DDChecklist" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DDChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialModel" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "description" TEXT,
    "s3Key" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "assumptions" JSONB,
    "outputs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICMemo" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "executiveSummary" TEXT,
    "investmentThesis" TEXT,
    "companyOverview" TEXT,
    "marketAnalysis" TEXT,
    "competitiveLandscape" TEXT,
    "teamAssessment" TEXT,
    "financialAnalysis" TEXT,
    "riskFactors" TEXT,
    "dealTerms" TEXT,
    "recommendation" TEXT,
    "appendices" JSONB,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
    "publishedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ICMemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertEngagement" (
    "id" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "coordinatorId" TEXT,
    "expertName" TEXT NOT NULL,
    "expertTitle" TEXT,
    "expertCompany" TEXT,
    "expertExpertise" TEXT[],
    "status" "ExpertEngagementStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "honorarium" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "topics" TEXT[],
    "keyFindings" TEXT,
    "conflictsChecked" BOOLEAN NOT NULL DEFAULT false,
    "conflictNotes" TEXT,
    "recordingConsent" BOOLEAN NOT NULL DEFAULT false,
    "transcriptS3Key" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingRecord" (
    "id" TEXT NOT NULL,
    "dealId" TEXT,
    "title" TEXT NOT NULL,
    "meetingType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT[],
    "agenda" TEXT,
    "notes" TEXT,
    "actionItems" JSONB,
    "recordedById" TEXT,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "vintageYear" INTEGER,
    "targetSize" DECIMAL(18,2),
    "committedCapital" DECIMAL(18,2),
    "calledCapital" DECIMAL(18,2),
    "distributedCapital" DECIMAL(18,2),
    "nav" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "strategy" TEXT,
    "geography" TEXT[],
    "sectors" TEXT[],
    "managementFeeRate" DECIMAL(5,4),
    "carriedInterestRate" DECIMAL(5,4),
    "hurdleRate" DECIMAL(5,4),
    "investmentPeriodEnd" TIMESTAMP(3),
    "fundTermEnd" TIMESTAMP(3),
    "gpEntityName" TEXT,
    "lpEntityName" TEXT,
    "custodian" TEXT,
    "auditor" TEXT,
    "legalCounsel" TEXT,
    "taxAdvisor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioCompany" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dealId" TEXT,
    "investmentDate" TIMESTAMP(3) NOT NULL,
    "initialInvestment" DECIMAL(18,2) NOT NULL,
    "totalInvested" DECIMAL(18,2) NOT NULL,
    "currentOwnership" DECIMAL(5,4) NOT NULL,
    "fullyDilutedOwnership" DECIMAL(5,4),
    "boardSeat" BOOLEAN NOT NULL DEFAULT false,
    "observerSeat" BOOLEAN NOT NULL DEFAULT false,
    "currentValuation" DECIMAL(18,2),
    "moic" DECIMAL(8,4),
    "irr" DECIMAL(8,4),
    "realizedProceeds" DECIMAL(18,2),
    "unrealizedValue" DECIMAL(18,2),
    "isRealized" BOOLEAN NOT NULL DEFAULT false,
    "realizedDate" TIMESTAMP(3),
    "exitType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "securityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioKPI" (
    "id" TEXT NOT NULL,
    "portfolioCompanyId" TEXT NOT NULL,
    "category" "KPICategory" NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DECIMAL(18,4) NOT NULL,
    "unit" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "isProjection" BOOLEAN NOT NULL DEFAULT false,
    "sourceDocument" TEXT,
    "notes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationHistory" (
    "id" TEXT NOT NULL,
    "portfolioCompanyId" TEXT NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "preMoney" DECIMAL(18,2),
    "postMoney" DECIMAL(18,2),
    "sharePrice" DECIMAL(18,6),
    "impliedValuation" DECIMAL(18,2),
    "fairValue" DECIMAL(18,2) NOT NULL,
    "valuationMethod" TEXT NOT NULL,
    "roundType" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioAlert" (
    "id" TEXT NOT NULL,
    "portfolioCompanyId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendedAction" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalAccount" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "lpName" TEXT NOT NULL,
    "lpEntityType" TEXT,
    "commitment" DECIMAL(18,2) NOT NULL,
    "calledCapital" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "uncalledCapital" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "distributedCapital" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nav" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "moic" DECIMAL(8,4),
    "irr" DECIMAL(8,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "bankAccountRef" TEXT,
    "taxId" TEXT,
    "contactId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "closingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalTransaction" (
    "id" TEXT NOT NULL,
    "capitalAccountId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "settledDate" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "description" TEXT,
    "wireConfirmation" TEXT,
    "isRecallable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorReport" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "preparedById" TEXT,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "s3Key" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
    "distributionList" TEXT[],
    "distributedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoom" (
    "id" TEXT NOT NULL,
    "type" "DataRoomType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dealId" TEXT,
    "fundId" TEXT,
    "portfolioCompanyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "downloadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "printEnabled" BOOLEAN NOT NULL DEFAULT false,
    "nda" BOOLEAN NOT NULL DEFAULT true,
    "ndaTemplateKey" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoomFolder" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRoomFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoomDocument" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksum" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "kmsKeyId" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRoomDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksum" TEXT,
    "changeNotes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoomAccess" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "ndaSigned" BOOLEAN NOT NULL DEFAULT false,
    "ndaSignedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,

    CONSTRAINT "DataRoomAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "downloadedAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "resourceName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "statusCode" INTEGER,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "integrityHash" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "FundAccess_userId_idx" ON "FundAccess"("userId");

-- CreateIndex
CREATE INDEX "FundAccess_fundId_idx" ON "FundAccess"("fundId");

-- CreateIndex
CREATE UNIQUE INDEX "FundAccess_userId_fundId_key" ON "FundAccess"("userId", "fundId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Contact_isLP_idx" ON "Contact"("isLP");

-- CreateIndex
CREATE INDEX "Contact_isFounder_idx" ON "Contact"("isFounder");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_sector_idx" ON "Company"("sector");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");

-- CreateIndex
CREATE INDEX "Deal_targetFundId_idx" ON "Deal"("targetFundId");

-- CreateIndex
CREATE INDEX "Deal_createdAt_idx" ON "Deal"("createdAt");

-- CreateIndex
CREATE INDEX "DealAssignment_dealId_idx" ON "DealAssignment"("dealId");

-- CreateIndex
CREATE INDEX "DealAssignment_userId_idx" ON "DealAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DealAssignment_dealId_userId_key" ON "DealAssignment"("dealId", "userId");

-- CreateIndex
CREATE INDEX "DealStageHistory_dealId_idx" ON "DealStageHistory"("dealId");

-- CreateIndex
CREATE INDEX "DealStageHistory_changedAt_idx" ON "DealStageHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScreeningScorecard_dealId_key" ON "ScreeningScorecard"("dealId");

-- CreateIndex
CREATE INDEX "ScreeningScorecard_dealId_idx" ON "ScreeningScorecard"("dealId");

-- CreateIndex
CREATE INDEX "Interaction_dealId_idx" ON "Interaction"("dealId");

-- CreateIndex
CREATE INDEX "Interaction_contactId_idx" ON "Interaction"("contactId");

-- CreateIndex
CREATE INDEX "Interaction_companyId_idx" ON "Interaction"("companyId");

-- CreateIndex
CREATE INDEX "Interaction_userId_idx" ON "Interaction"("userId");

-- CreateIndex
CREATE INDEX "Interaction_occurredAt_idx" ON "Interaction"("occurredAt");

-- CreateIndex
CREATE INDEX "FundraisingLead_fundId_idx" ON "FundraisingLead"("fundId");

-- CreateIndex
CREATE INDEX "FundraisingLead_stage_idx" ON "FundraisingLead"("stage");

-- CreateIndex
CREATE INDEX "FundraisingLead_contactId_idx" ON "FundraisingLead"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchWorkspace_dealId_key" ON "ResearchWorkspace"("dealId");

-- CreateIndex
CREATE INDEX "ResearchWorkspace_dealId_idx" ON "ResearchWorkspace"("dealId");

-- CreateIndex
CREATE INDEX "ResearchWorkspace_ownerId_idx" ON "ResearchWorkspace"("ownerId");

-- CreateIndex
CREATE INDEX "ResearchNote_workspaceId_idx" ON "ResearchNote"("workspaceId");

-- CreateIndex
CREATE INDEX "ResearchNote_authorId_idx" ON "ResearchNote"("authorId");

-- CreateIndex
CREATE INDEX "DDChecklist_workspaceId_idx" ON "DDChecklist"("workspaceId");

-- CreateIndex
CREATE INDEX "DDChecklist_status_idx" ON "DDChecklist"("status");

-- CreateIndex
CREATE INDEX "FinancialModel_workspaceId_idx" ON "FinancialModel"("workspaceId");

-- CreateIndex
CREATE INDEX "ICMemo_workspaceId_idx" ON "ICMemo"("workspaceId");

-- CreateIndex
CREATE INDEX "ICMemo_authorId_idx" ON "ICMemo"("authorId");

-- CreateIndex
CREATE INDEX "ICMemo_status_idx" ON "ICMemo"("status");

-- CreateIndex
CREATE INDEX "ExpertEngagement_dealId_idx" ON "ExpertEngagement"("dealId");

-- CreateIndex
CREATE INDEX "ExpertEngagement_contactId_idx" ON "ExpertEngagement"("contactId");

-- CreateIndex
CREATE INDEX "ExpertEngagement_status_idx" ON "ExpertEngagement"("status");

-- CreateIndex
CREATE INDEX "MeetingRecord_dealId_idx" ON "MeetingRecord"("dealId");

-- CreateIndex
CREATE INDEX "MeetingRecord_recordedById_idx" ON "MeetingRecord"("recordedById");

-- CreateIndex
CREATE INDEX "MeetingRecord_occurredAt_idx" ON "MeetingRecord"("occurredAt");

-- CreateIndex
CREATE INDEX "Fund_name_idx" ON "Fund"("name");

-- CreateIndex
CREATE INDEX "Fund_isActive_idx" ON "Fund"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCompany_companyId_key" ON "PortfolioCompany"("companyId");

-- CreateIndex
CREATE INDEX "PortfolioCompany_fundId_idx" ON "PortfolioCompany"("fundId");

-- CreateIndex
CREATE INDEX "PortfolioCompany_companyId_idx" ON "PortfolioCompany"("companyId");

-- CreateIndex
CREATE INDEX "PortfolioCompany_investmentDate_idx" ON "PortfolioCompany"("investmentDate");

-- CreateIndex
CREATE INDEX "PortfolioCompany_isRealized_idx" ON "PortfolioCompany"("isRealized");

-- CreateIndex
CREATE INDEX "PortfolioKPI_portfolioCompanyId_idx" ON "PortfolioKPI"("portfolioCompanyId");

-- CreateIndex
CREATE INDEX "PortfolioKPI_category_idx" ON "PortfolioKPI"("category");

-- CreateIndex
CREATE INDEX "PortfolioKPI_periodEnd_idx" ON "PortfolioKPI"("periodEnd");

-- CreateIndex
CREATE INDEX "ValuationHistory_portfolioCompanyId_idx" ON "ValuationHistory"("portfolioCompanyId");

-- CreateIndex
CREATE INDEX "ValuationHistory_valuationDate_idx" ON "ValuationHistory"("valuationDate");

-- CreateIndex
CREATE INDEX "PortfolioAlert_portfolioCompanyId_idx" ON "PortfolioAlert"("portfolioCompanyId");

-- CreateIndex
CREATE INDEX "PortfolioAlert_severity_idx" ON "PortfolioAlert"("severity");

-- CreateIndex
CREATE INDEX "PortfolioAlert_status_idx" ON "PortfolioAlert"("status");

-- CreateIndex
CREATE INDEX "CapitalAccount_fundId_idx" ON "CapitalAccount"("fundId");

-- CreateIndex
CREATE INDEX "CapitalAccount_lpName_idx" ON "CapitalAccount"("lpName");

-- CreateIndex
CREATE INDEX "CapitalTransaction_capitalAccountId_idx" ON "CapitalTransaction"("capitalAccountId");

-- CreateIndex
CREATE INDEX "CapitalTransaction_type_idx" ON "CapitalTransaction"("type");

-- CreateIndex
CREATE INDEX "CapitalTransaction_effectiveDate_idx" ON "CapitalTransaction"("effectiveDate");

-- CreateIndex
CREATE INDEX "InvestorReport_fundId_idx" ON "InvestorReport"("fundId");

-- CreateIndex
CREATE INDEX "InvestorReport_type_idx" ON "InvestorReport"("type");

-- CreateIndex
CREATE INDEX "InvestorReport_status_idx" ON "InvestorReport"("status");

-- CreateIndex
CREATE INDEX "InvestorReport_periodEnd_idx" ON "InvestorReport"("periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "DataRoom_dealId_key" ON "DataRoom"("dealId");

-- CreateIndex
CREATE INDEX "DataRoom_type_idx" ON "DataRoom"("type");

-- CreateIndex
CREATE INDEX "DataRoom_dealId_idx" ON "DataRoom"("dealId");

-- CreateIndex
CREATE INDEX "DataRoom_fundId_idx" ON "DataRoom"("fundId");

-- CreateIndex
CREATE INDEX "DataRoom_isActive_idx" ON "DataRoom"("isActive");

-- CreateIndex
CREATE INDEX "DataRoomFolder_dataRoomId_idx" ON "DataRoomFolder"("dataRoomId");

-- CreateIndex
CREATE INDEX "DataRoomFolder_parentId_idx" ON "DataRoomFolder"("parentId");

-- CreateIndex
CREATE INDEX "DataRoomDocument_folderId_idx" ON "DataRoomDocument"("folderId");

-- CreateIndex
CREATE INDEX "DataRoomDocument_uploadedById_idx" ON "DataRoomDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "DataRoomDocument_isActive_idx" ON "DataRoomDocument"("isActive");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "DataRoomAccess_dataRoomId_idx" ON "DataRoomAccess"("dataRoomId");

-- CreateIndex
CREATE INDEX "DataRoomAccess_userId_idx" ON "DataRoomAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DataRoomAccess_dataRoomId_userId_key" ON "DataRoomAccess"("dataRoomId", "userId");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_documentId_idx" ON "DocumentAccessLog"("documentId");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_userId_idx" ON "DocumentAccessLog"("userId");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_viewedAt_idx" ON "DocumentAccessLog"("viewedAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_idx" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundAccess" ADD CONSTRAINT "FundAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundAccess" ADD CONSTRAINT "FundAccess_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_targetFundId_fkey" FOREIGN KEY ("targetFundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageHistory" ADD CONSTRAINT "DealStageHistory_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningScorecard" ADD CONSTRAINT "ScreeningScorecard_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundraisingLead" ADD CONSTRAINT "FundraisingLead_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundraisingLead" ADD CONSTRAINT "FundraisingLead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchWorkspace" ADD CONSTRAINT "ResearchWorkspace_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchWorkspace" ADD CONSTRAINT "ResearchWorkspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNote" ADD CONSTRAINT "ResearchNote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ResearchWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNote" ADD CONSTRAINT "ResearchNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DDChecklist" ADD CONSTRAINT "DDChecklist_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ResearchWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialModel" ADD CONSTRAINT "FinancialModel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ResearchWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ICMemo" ADD CONSTRAINT "ICMemo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ResearchWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ICMemo" ADD CONSTRAINT "ICMemo_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertEngagement" ADD CONSTRAINT "ExpertEngagement_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertEngagement" ADD CONSTRAINT "ExpertEngagement_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRecord" ADD CONSTRAINT "MeetingRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRecord" ADD CONSTRAINT "MeetingRecord_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioCompany" ADD CONSTRAINT "PortfolioCompany_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioCompany" ADD CONSTRAINT "PortfolioCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioKPI" ADD CONSTRAINT "PortfolioKPI_portfolioCompanyId_fkey" FOREIGN KEY ("portfolioCompanyId") REFERENCES "PortfolioCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationHistory" ADD CONSTRAINT "ValuationHistory_portfolioCompanyId_fkey" FOREIGN KEY ("portfolioCompanyId") REFERENCES "PortfolioCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAlert" ADD CONSTRAINT "PortfolioAlert_portfolioCompanyId_fkey" FOREIGN KEY ("portfolioCompanyId") REFERENCES "PortfolioCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalAccount" ADD CONSTRAINT "CapitalAccount_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalTransaction" ADD CONSTRAINT "CapitalTransaction_capitalAccountId_fkey" FOREIGN KEY ("capitalAccountId") REFERENCES "CapitalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorReport" ADD CONSTRAINT "InvestorReport_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoom" ADD CONSTRAINT "DataRoom_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoom" ADD CONSTRAINT "DataRoom_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoom" ADD CONSTRAINT "DataRoom_portfolioCompanyId_fkey" FOREIGN KEY ("portfolioCompanyId") REFERENCES "PortfolioCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomFolder" ADD CONSTRAINT "DataRoomFolder_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "DataRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomFolder" ADD CONSTRAINT "DataRoomFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DataRoomFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomDocument" ADD CONSTRAINT "DataRoomDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DataRoomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomDocument" ADD CONSTRAINT "DataRoomDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DataRoomDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomAccess" ADD CONSTRAINT "DataRoomAccess_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "DataRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomAccess" ADD CONSTRAINT "DataRoomAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DataRoomDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

