import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { IdSchema, PaginationSchema } from '@/lib/validations'

const authedProcedure = publicProcedure.use(requireAuth)

export const portfolioRouter = router({
  companies: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_READ_OWN))
    .input(PaginationSchema.extend({
      fundId: z.string().cuid().optional(),
      status: z.string().optional(),
      isRealized: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, fundId, status, isRealized } = input

      const where = {
        ...(fundId && { fundId }),
        ...(status && { status }),
        ...(typeof isRealized === 'boolean' && { isRealized }),
        ...(search && {
          company: {
            name: { contains: search, mode: 'insensitive' as const },
          },
        }),
      }

      const [companies, total] = await Promise.all([
        ctx.db.portfolioCompany.findMany({
          where,
          orderBy: { investmentDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            company: { select: { id: true, name: true, sector: true, website: true } },
            fund: { select: { id: true, name: true } },
            kpis: { orderBy: { periodEnd: 'desc' }, take: 1 },
            alerts: { where: { resolvedAt: null }, select: { id: true, severity: true, category: true } },
          },
        }),
        ctx.db.portfolioCompany.count({ where }),
      ])

      return { companies, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  getCompany: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_READ_OWN))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.portfolioCompany.findUnique({
        where: { id: input.id },
        include: {
          company: true,
          fund: { select: { id: true, name: true, vintageYear: true } },
          kpis: { orderBy: { periodEnd: 'desc' }, take: 12 },
          valuationHistory: { orderBy: { valuationDate: 'desc' }, take: 10 },
          alerts: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      })
      if (!company) throw new TRPCError({ code: 'NOT_FOUND' })
      return company
    }),

  addCompany: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('create', 'PortfolioCompany'))
    .input(z.object({
      fundId: z.string().cuid(),
      companyId: z.string().cuid(),
      dealId: z.string().cuid().optional(),
      investmentDate: z.date(),
      initialInvestment: z.number().positive(),
      totalInvested: z.number().positive(),
      currentOwnership: z.number().min(0).max(1),
      boardSeat: z.boolean().default(false),
      status: z.string().default('ACTIVE'),
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.portfolioCompany.create({ data: input as never })
      return company
    }),

  updateCompany: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('update', 'PortfolioCompany'))
    .input(z.object({
      id: z.string().cuid(),
      currentValuation: z.number().optional(),
      moic: z.number().optional(),
      irr: z.number().optional(),
      status: z.string().optional(),
      isRealized: z.boolean().optional(),
      realizedDate: z.date().optional(),
      exitType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const company = await ctx.db.portfolioCompany.update({ where: { id }, data: data as never })
      return company
    }),

  addKPI: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('create', 'PortfolioKPI'))
    .input(z.object({
      portfolioCompanyId: z.string().cuid(),
      category: z.enum(['REVENUE', 'PROFITABILITY', 'GROWTH', 'OPERATIONAL', 'FINANCIAL', 'CUSTOMER', 'EMPLOYEE', 'OTHER']),
      metricName: z.string().min(1).max(255),
      metricValue: z.number(),
      unit: z.string().optional(),
      periodStart: z.date(),
      periodEnd: z.date(),
      isProjection: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const kpi = await ctx.db.portfolioKPI.create({ data: input as never })
      return kpi
    }),

  addValuation: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('create', 'ValuationHistory'))
    .input(z.object({
      portfolioCompanyId: z.string().cuid(),
      valuationDate: z.date(),
      fairValue: z.number().positive(),
      valuationMethod: z.string().min(1),
      preMoney: z.number().optional(),
      postMoney: z.number().optional(),
      notes: z.string().optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { portfolioCompanyId, fairValue, ...rest } = input
      const valuation = await ctx.db.$transaction(async (tx) => {
        const val = await tx.valuationHistory.create({
          data: { portfolioCompanyId, fairValue, ...rest } as never,
        })
        await tx.portfolioCompany.update({
          where: { id: portfolioCompanyId },
          data: { currentValuation: fairValue },
        })
        return val
      })
      return valuation
    }),

  addAlert: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('create', 'PortfolioAlert'))
    .input(z.object({
      portfolioCompanyId: z.string().cuid(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      category: z.string().min(1),
      title: z.string().min(1).max(255),
      description: z.string().min(1),
      recommendedAction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const alert = await ctx.db.portfolioAlert.create({ data: input as never })
      return alert
    }),

  resolveAlert: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('update', 'PortfolioAlert'))
    .input(z.object({ alertId: z.string().cuid(), resolution: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const alert = await ctx.db.portfolioAlert.update({
        where: { id: input.alertId },
        data: {
          resolvedAt: new Date(),
          resolvedById: ctx.user!.id,
          resolutionNotes: input.resolution,
          status: 'RESOLVED',
        },
      })
      return alert
    }),

  overview: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_READ_OWN))
    .query(async ({ ctx }) => {
      const [totalCompanies, activeCompanies, alertCount] = await Promise.all([
        ctx.db.portfolioCompany.count(),
        ctx.db.portfolioCompany.count({ where: { isRealized: false } }),
        ctx.db.portfolioAlert.count({ where: { resolvedAt: null } }),
      ])

      return { totalCompanies, activeCompanies, alertCount }
    }),
})
