import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { requiresFundAccessCheck } from '@/server/auth/rbac'
import { getUserFundIds } from '@/server/auth/session'
import { InvestorReportSchema, CapitalAccountSchema, CapitalTransactionSchema, IdSchema, PaginationSchema } from '@/lib/validations'

const authedProcedure = publicProcedure.use(requireAuth)

export const reportingRouter = router({
  listReports: authedProcedure
    .use(requirePermission(Permission.REPORTS_READ_OWN_FUND))
    .input(PaginationSchema.extend({
      fundId: z.string().cuid().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, fundId, status, type } = input
      const user = ctx.user!

      let fundIds: string[] | undefined
      if (requiresFundAccessCheck(user.role)) {
        fundIds = await getUserFundIds(user.id)
      }

      const where = {
        ...(fundId && { fundId }),
        ...(fundIds && { fundId: { in: fundIds } }),
        ...(status && { status }),
        ...(type && { type }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [reports, total] = await Promise.all([
        ctx.db.investorReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            fund: { select: { id: true, name: true } },
          },
        }),
        ctx.db.investorReport.count({ where }),
      ])

      return { reports, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  getReport: authedProcedure
    .use(requirePermission(Permission.REPORTS_READ_OWN_FUND))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.user!

      const report = await ctx.db.investorReport.findUnique({
        where: { id: input.id },
        include: {
          fund: { select: { id: true, name: true } },
        },
      })

      if (!report) throw new TRPCError({ code: 'NOT_FOUND' })

      // P-02: LP viewers can only see reports for their funds
      if (requiresFundAccessCheck(user.role)) {
        const fundIds = await getUserFundIds(user.id)
        if (!fundIds.includes(report.fundId)) {
          throw new TRPCError({ code: 'FORBIDDEN' })
        }
        // LP viewers can only see published reports
        if (report.status !== 'PUBLISHED') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Report not yet published' })
        }
      }

      return report
    }),

  createReport: authedProcedure
    .use(requirePermission(Permission.REPORTS_WRITE))
    .use(auditLog('create', 'InvestorReport'))
    .input(InvestorReportSchema)
    .mutation(async ({ ctx, input }) => {
      const typeMap: Record<string, string> = {
        quarterly_letter: 'QUARTERLY',
        capital_account: 'CAPITAL_ACCOUNT',
        annual_audit: 'AUDITED_FINANCIALS',
        k1: 'K1_TAX',
        esg: 'AD_HOC',
        capital_call: 'CAPITAL_ACCOUNT',
        distribution: 'AD_HOC',
      }

      const report = await ctx.db.investorReport.create({
        data: {
          fundId: input.fundId,
          type: (typeMap[input.type] ?? 'AD_HOC') as never,
          title: input.title,
          status: 'DRAFT',
          periodStart: new Date(),
          periodEnd: new Date(),
          preparedById: ctx.user!.id,
          dataClassification: (input.classification ?? 'CONFIDENTIAL') as never,
        },
      })
      return report
    }),

  approveReport: authedProcedure
    .use(requirePermission(Permission.REPORTS_APPROVE))
    .use(auditLog('approve', 'InvestorReport'))
    .input(z.object({ reportId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.investorReport.update({
        where: { id: input.reportId },
        data: { status: 'APPROVED', approvedById: ctx.user!.id },
      })
      return report
    }),

  publishReport: authedProcedure
    .use(requirePermission(Permission.REPORTS_PUBLISH))
    .use(auditLog('publish', 'InvestorReport'))
    .input(z.object({ reportId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.investorReport.update({
        where: { id: input.reportId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      })
      return report
    }),

  capitalAccounts: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_READ_ALL))
    .input(PaginationSchema.extend({ fundId: z.string().cuid().optional() }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, fundId } = input
      const where = { ...(fundId && { fundId }) }

      const [accounts, total] = await Promise.all([
        ctx.db.capitalAccount.findMany({
          where,
          orderBy: { lpName: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { fund: { select: { id: true, name: true } } },
        }),
        ctx.db.capitalAccount.count({ where }),
      ])

      return { accounts, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  createCapitalAccount: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('create', 'CapitalAccount'))
    .input(CapitalAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const { calledAmount, distributedAmount, investorUserId, investorName, ownership, classification, ...rest } = input as typeof input & {
        calledAmount?: number
        distributedAmount?: number
        investorUserId?: string
        investorName: string
        ownership: number
        classification?: string
      }

      const account = await ctx.db.capitalAccount.create({
        data: {
          fundId: rest.fundId,
          lpName: investorName,
          commitment: rest.commitment,
          calledCapital: calledAmount ?? 0,
          distributedCapital: distributedAmount ?? 0,
        } as never,
      })
      return account
    }),

  createCapitalTransaction: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('create', 'CapitalTransaction'))
    .input(CapitalTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const typeMap: Record<string, string> = {
        call: 'CAPITAL_CALL',
        distribution: 'DISTRIBUTION',
        recallable: 'RECALLABLE_DISTRIBUTION',
        return_of_capital: 'RETURN_OF_CAPITAL',
      }

      const { type, date, status, referenceNumber, ...rest } = input as typeof input & {
        type: string
        date: Date
        status?: string
        referenceNumber?: string
      }

      const tx = await ctx.db.capitalTransaction.create({
        data: {
          ...rest,
          type: (typeMap[type] ?? type) as never,
          effectiveDate: date,
          referenceNumber,
        } as never,
      })
      return tx
    }),
})
