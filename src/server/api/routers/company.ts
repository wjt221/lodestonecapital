import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { CompanyCreateSchema, CompanyUpdateSchema, IdSchema, PaginationSchema } from '@/lib/validations'

const authedProcedure = publicProcedure.use(requireAuth)

export const companyRouter = router({
  list: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_READ))
    .input(PaginationSchema.extend({ sector: CompanyUpdateSchema.shape.sector }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, sector } = input
      const where = {
        ...(sector && { sector }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { sector: { contains: search, mode: 'insensitive' as const } },
            { headquarters: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [companies, total] = await Promise.all([
        ctx.db.company.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            _count: { select: { contacts: true, deals: true } },
          },
        }),
        ctx.db.company.count({ where }),
      ])

      return { companies, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  get: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_READ))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUnique({
        where: { id: input.id },
        include: {
          contacts: { select: { id: true, firstName: true, lastName: true, title: true, email: true } },
          deals: { select: { id: true, name: true, stage: true, priority: true }, take: 10 },
          _count: { select: { contacts: true, deals: true } },
        },
      })
      if (!company) throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
      return company
    }),

  create: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_WRITE))
    .use(auditLog('create', 'Company'))
    .input(CompanyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { yearFounded, classification, ...rest } = input as typeof input & { yearFounded?: number; classification?: string }
      const company = await ctx.db.company.create({
        data: {
          ...rest,
          ...(yearFounded && { foundedYear: yearFounded }),
          ...(classification && { dataClassification: classification as never }),
        } as never,
      })
      return company
    }),

  update: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_WRITE))
    .use(auditLog('update', 'Company'))
    .input(CompanyUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, yearFounded, classification, ...rest } = input as typeof input & { id: string; yearFounded?: number; classification?: string }
      const company = await ctx.db.company.update({
        where: { id },
        data: {
          ...rest,
          ...(yearFounded !== undefined && { foundedYear: yearFounded }),
          ...(classification && { dataClassification: classification as never }),
        } as never,
      })
      return company
    }),
})
