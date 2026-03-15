import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { requiresDealAssignmentCheck } from '@/server/auth/rbac'
import { checkDealAssignment } from '@/server/auth/session'
import {
  DealCreateSchema,
  DealUpdateSchema,
  DealStageUpdateSchema,
  IdSchema,
  PaginationSchema,
} from '@/lib/validations'

const authedProcedure = publicProcedure.use(requireAuth)

export const dealRouter = router({
  list: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_READ_OWN))
    .input(PaginationSchema.extend({
      stage: z.string().optional(),
      assignedToMe: z.boolean().optional(),
      sector: z.string().optional(),
      fundId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, sortBy, sortOrder, stage, assignedToMe, sector, fundId } = input
      const user = ctx.user!

      // P-03: analysts/associates only see assigned deals
      const needsAssignmentFilter = requiresDealAssignmentCheck(user.role)

      const where: Record<string, unknown> = {
        ...(stage && { stage }),
        ...(sector && { sector }),
        ...(fundId && { targetFundId: fundId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sector: { contains: search, mode: 'insensitive' } },
          ],
        }),
      }

      if (needsAssignmentFilter || assignedToMe) {
        where.assignments = { some: { userId: user.id } }
      }

      const orderBy = sortBy ? { [sortBy]: sortOrder } : { updatedAt: 'desc' as const }

      const [deals, total] = await Promise.all([
        ctx.db.deal.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            company: { select: { id: true, name: true, sector: true } },
            assignments: {
              where: { isPrimary: true },
              include: { user: { select: { id: true, name: true, email: true } } },
              take: 1,
            },
            _count: { select: { assignments: true } },
          },
        }),
        ctx.db.deal.count({ where }),
      ])

      return { deals, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  get: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_READ_OWN))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.deal.findUnique({
        where: { id: input.id },
        include: {
          company: true,
          assignments: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          stageHistory: { orderBy: { changedAt: 'desc' }, take: 10 },
          researchWorkspace: {
            include: {
              _count: { select: { notes: true, ddChecklists: true, financialModels: true } },
            },
          },
          dataRoom: { select: { id: true, name: true, isActive: true } },
        },
      })
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })

      // P-03: check assignment for restricted roles
      const user = ctx.user!
      if (requiresDealAssignmentCheck(user.role)) {
        const assigned = await checkDealAssignment(user.id, deal.id)
        if (!assigned) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to this deal' })
      }

      return deal
    }),

  create: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_WRITE_OWN))
    .use(auditLog('create', 'Deal'))
    .input(DealCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { fundId, sourcedBy, probabilityWeight, targetInvestment, estimatedClose, passedReason, classification, ...rest } = input as typeof input & {
        fundId?: string
        sourcedBy?: string
        probabilityWeight?: number
        targetInvestment?: number
        estimatedClose?: Date
        passedReason?: string
        classification?: string
      }

      const deal = await ctx.db.deal.create({
        data: {
          name: rest.name,
          companyId: rest.companyId,
          stage: rest.stage,
          sourceChannel: rest.sourceChannel,
          sourceContact: sourcedBy,
          targetFundId: fundId,
          dataClassification: classification as never,
          assignments: {
            create: {
              userId: ctx.user!.id,
              role: 'lead',
              isPrimary: true,
            },
          },
        },
        include: { company: { select: { id: true, name: true } } },
      })

      // Create research workspace automatically
      await ctx.db.researchWorkspace.create({
        data: {
          dealId: deal.id,
          name: `${deal.name} - Research`,
          ownerId: ctx.user!.id,
        },
      }).catch(() => undefined)

      return deal
    }),

  update: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_WRITE_OWN))
    .use(auditLog('update', 'Deal'))
    .input(DealUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, fundId, sourcedBy, probabilityWeight, targetInvestment, estimatedClose, passedReason, classification, ...rest } = input as typeof input & {
        id: string
        fundId?: string
        sourcedBy?: string
        probabilityWeight?: number
        targetInvestment?: number
        estimatedClose?: Date
        passedReason?: string
        classification?: string
      }
      const user = ctx.user!

      // P-03: analysts/associates can only edit assigned deals
      if (requiresDealAssignmentCheck(user.role)) {
        const assigned = await checkDealAssignment(user.id, id)
        if (!assigned) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to this deal' })
      }

      const deal = await ctx.db.deal.update({
        where: { id },
        data: {
          ...rest,
          ...(fundId && { targetFundId: fundId }),
          ...(sourcedBy && { sourceContact: sourcedBy }),
          ...(classification && { dataClassification: classification as never }),
        } as never,
        include: { company: { select: { id: true, name: true } } },
      })
      return deal
    }),

  changeStage: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_WRITE_OWN))
    .use(auditLog('stage_change', 'Deal'))
    .input(DealStageUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { dealId, toStage: stage, notes } = input
      const user = ctx.user!

      const existing = await ctx.db.deal.findUnique({ where: { id: dealId }, select: { stage: true } })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })

      if (requiresDealAssignmentCheck(user.role)) {
        const assigned = await checkDealAssignment(user.id, dealId)
        if (!assigned) throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const [deal] = await ctx.db.$transaction([
        ctx.db.deal.update({ where: { id: dealId }, data: { stage } }),
        ctx.db.dealStageHistory.create({
          data: {
            dealId,
            fromStage: existing.stage,
            toStage: stage,
            changedById: user.id,
            notes,
          },
        }),
      ])

      return deal
    }),

  assignUser: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_WRITE_ALL))
    .use(auditLog('update', 'DealAssignment'))
    .input(z.object({
      dealId: z.string().cuid(),
      userId: z.string().cuid(),
      role: z.string().min(1).max(50),
      isPrimary: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const assignment = await ctx.db.dealAssignment.upsert({
        where: { dealId_userId: { dealId: input.dealId, userId: input.userId } },
        create: {
          dealId: input.dealId,
          userId: input.userId,
          role: input.role,
          isPrimary: input.isPrimary,
        },
        update: { role: input.role, isPrimary: input.isPrimary },
      })
      return assignment
    }),

  stageHistory: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_READ_OWN))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.dealStageHistory.findMany({
        where: { dealId: input.id },
        orderBy: { changedAt: 'desc' },
        include: {
          deal: { select: { name: true } },
        },
      })
    }),

  pipeline: authedProcedure
    .use(requirePermission(Permission.CRM_DEALS_READ_OWN))
    .query(async ({ ctx }) => {
      const user = ctx.user!
      const needsFilter = requiresDealAssignmentCheck(user.role)

      const where = needsFilter
        ? { assignments: { some: { userId: user.id } } }
        : {}

      const deals = await ctx.db.deal.groupBy({
        by: ['stage'],
        where,
        _count: { id: true },
      })

      return deals
    }),
})
