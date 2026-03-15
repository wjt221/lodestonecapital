import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { queryAuditLogs } from '@/server/audit/logger'
import { PaginationSchema } from '@/lib/validations'
import { z } from 'zod'

const authedProcedure = publicProcedure.use(requireAuth)

export const auditRouter = router({
  list: authedProcedure
    .use(requirePermission(Permission.AUDIT_LOG_READ))
    .input(PaginationSchema.extend({
      actorId: z.string().cuid().optional(),
      action: z.string().optional(),
      resource: z.string().optional(),
      resourceId: z.string().optional(),
      result: z.enum(['success', 'failure', 'denied']).optional(),
      from: z.date().optional(),
      to: z.date().optional(),
    }))
    .query(async ({ input }) => {
      return queryAuditLogs({
        actorId: input.actorId,
        action: input.action as never,
        resource: input.resource as never,
        resourceId: input.resourceId,
        result: input.result,
        from: input.from,
        to: input.to,
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
      })
    }),

  summary: authedProcedure
    .use(requirePermission(Permission.AUDIT_LOG_READ))
    .query(async ({ ctx }) => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days

      const [total, denied, downloads] = await Promise.all([
        ctx.db.auditLog.count({ where: { occurredAt: { gte: since } } }),
        ctx.db.auditLog.count({ where: { occurredAt: { gte: since }, action: 'permission_denied' } }),
        ctx.db.auditLog.count({ where: { occurredAt: { gte: since }, action: 'download' } }),
      ])

      return { total, denied, downloads, since }
    }),
})
