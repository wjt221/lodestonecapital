import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { requiresDealAssignmentCheck, requiresFundAccessCheck } from '@/server/auth/rbac'
import { getUserFundIds } from '@/server/auth/session'

const authedProcedure = publicProcedure.use(requireAuth)

export const dashboardRouter = router({
  stats: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_READ_OWN))
    .query(async ({ ctx }) => {
      const user = ctx.user!
      const needsDealFilter = requiresDealAssignmentCheck(user.role)
      const needsFundFilter = requiresFundAccessCheck(user.role)

      const dealWhere = needsDealFilter
        ? { assignments: { some: { userId: user.id } } }
        : {}

      let fundIds: string[] | undefined
      if (needsFundFilter) {
        fundIds = await getUserFundIds(user.id)
      }

      const portfolioWhere = fundIds ? { fundId: { in: fundIds }, isRealized: false } : { isRealized: false }

      const [
        activeDeals,
        dealsByStage,
        portfolioCompanies,
        openAlerts,
        funds,
      ] = await Promise.all([
        ctx.db.deal.count({
          where: {
            ...dealWhere,
            stage: { notIn: ['CLOSED', 'PASSED', 'PORTFOLIO'] },
          },
        }),
        ctx.db.deal.groupBy({
          by: ['stage'],
          where: dealWhere,
          _count: { id: true },
        }),
        ctx.db.portfolioCompany.count({ where: portfolioWhere }),
        ctx.db.portfolioAlert.count({ where: { resolvedAt: null } }),
        ctx.db.fund.findMany({
          where: fundIds ? { id: { in: fundIds } } : {},
          select: { nav: true, committedCapital: true, calledCapital: true },
        }),
      ])

      const totalNAV = funds.reduce((sum, f) => sum + Number(f.nav ?? 0), 0)
      const totalAUM = funds.reduce((sum, f) => sum + Number(f.committedCapital ?? 0), 0)

      // Recent audit events (last 7 days)
      const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentActivity = await ctx.db.auditLog.findMany({
        where: { occurredAt: { gte: since7Days } },
        orderBy: { occurredAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          userEmail: true,
          occurredAt: true,
          metadata: true,
        },
      })

      return {
        activeDeals,
        dealsByStage,
        portfolioCompanies,
        openAlerts,
        totalNAV,
        totalAUM,
        recentActivity,
      }
    }),
})
