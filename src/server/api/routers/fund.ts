import { z as _z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { requiresFundAccessCheck } from '@/server/auth/rbac'
import { getUserFundIds } from '@/server/auth/session'
import { FundCreateSchema, IdSchema, PaginationSchema } from '@/lib/validations'
import { z as zz } from 'zod'

const authedProcedure = publicProcedure.use(requireAuth)

export const fundRouter = router({
  list: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_READ_OWN))
    .input(PaginationSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input
      const user = ctx.user!

      let fundIds: string[] | undefined
      if (requiresFundAccessCheck(user.role)) {
        fundIds = await getUserFundIds(user.id)
      }

      const where = {
        ...(fundIds && { id: { in: fundIds } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { strategy: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [funds, total] = await Promise.all([
        ctx.db.fund.findMany({
          where,
          orderBy: { vintageYear: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            _count: { select: { portfolioCompanies: true, capitalAccounts: true } },
          },
        }),
        ctx.db.fund.count({ where }),
      ])

      return { funds, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  get: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_READ_OWN))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.user!

      // P-02: LP viewers can only access funds they have access to
      if (requiresFundAccessCheck(user.role)) {
        const fundIds = await getUserFundIds(user.id)
        if (!fundIds.includes(input.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this fund' })
        }
      }

      const fund = await ctx.db.fund.findUnique({
        where: { id: input.id },
        include: {
          portfolioCompanies: {
            include: {
              company: { select: { id: true, name: true, sector: true } },
            },
          },
          _count: {
            select: {
              capitalAccounts: true,
              investorReports: true,
              fundraisingLeads: true,
            },
          },
        },
      })
      if (!fund) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fund not found' })
      return fund
    }),

  create: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('create', 'Fund'))
    .input(FundCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { vintage: _v1, status: _s1, classification: _c1, ...rest } = input as typeof input & { vintage?: number; status?: string; classification?: string }
      const vintageYear = (input as unknown as { vintage?: number }).vintage
      const fund = await ctx.db.fund.create({
        data: { ...rest, ...(vintageYear !== undefined && { vintageYear }) } as never,
      })
      return fund
    }),

  update: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_WRITE))
    .use(auditLog('update', 'Fund'))
    .input(FundCreateSchema.partial().extend({ id: zz.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, vintage, status: _s2, classification: _c2, ...rest } = input as typeof input & { id: string; vintage?: number; status?: string; classification?: string }
      const fund = await ctx.db.fund.update({
        where: { id },
        data: { ...rest, ...(vintage !== undefined && { vintageYear: vintage }) } as never,
      })
      return fund
    }),

  grantAccess: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .use(auditLog('access_grant', 'FundAccess'))
    .input(zz.object({
      userId: zz.string().cuid(),
      fundId: zz.string().cuid(),
      canRead: zz.boolean().default(true),
      canWrite: zz.boolean().default(false),
      expiresAt: zz.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const access = await ctx.db.fundAccess.upsert({
        where: { userId_fundId: { userId: input.userId, fundId: input.fundId } },
        create: {
          userId: input.userId,
          fundId: input.fundId,
          canRead: input.canRead,
          canWrite: input.canWrite,
          grantedBy: ctx.user!.id,
          expiresAt: input.expiresAt,
        },
        update: {
          canRead: input.canRead,
          canWrite: input.canWrite,
          expiresAt: input.expiresAt,
        },
      })
      return access
    }),

  revokeAccess: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .use(auditLog('access_revoke', 'FundAccess'))
    .input(zz.object({ userId: zz.string().cuid(), fundId: zz.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.fundAccess.delete({
        where: { userId_fundId: { userId: input.userId, fundId: input.fundId } },
      })
      return { success: true }
    }),

  summary: authedProcedure
    .use(requirePermission(Permission.PORTFOLIO_READ_OWN))
    .query(async ({ ctx }) => {
      const user = ctx.user!
      let fundIds: string[] | undefined
      if (requiresFundAccessCheck(user.role)) {
        fundIds = await getUserFundIds(user.id)
      }

      const where = fundIds ? { id: { in: fundIds } } : {}

      const funds = await ctx.db.fund.findMany({
        where,
        select: {
          id: true,
          name: true,
          committedCapital: true,
          calledCapital: true,
          distributedCapital: true,
          nav: true,
          vintageYear: true,
          strategy: true,
        },
      })

      return funds
    }),
})
