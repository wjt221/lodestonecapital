import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { ContactCreateSchema, ContactUpdateSchema, IdSchema, PaginationSchema } from '@/lib/validations'

const authedProcedure = publicProcedure.use(requireAuth)

export const contactRouter = router({
  list: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_READ))
    .input(PaginationSchema.extend({
      isLP: z.boolean().optional(),
      isFounder: z.boolean().optional(),
      companyId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, isLP, isFounder, companyId } = input

      const where = {
        ...(typeof isLP === 'boolean' && { isLP }),
        ...(typeof isFounder === 'boolean' && { isFounder }),
        ...(companyId && { companyId }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { title: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [contacts, total] = await Promise.all([
        ctx.db.contact.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            company: { select: { id: true, name: true } },
          },
        }),
        ctx.db.contact.count({ where }),
      ])

      return { contacts, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  get: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_READ))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.id },
        include: {
          company: true,
          interactions: {
            orderBy: { occurredAt: 'desc' },
            take: 20,
            include: { user: { select: { id: true, name: true } } },
          },
        },
      })
      if (!contact) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' })
      return contact
    }),

  create: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_WRITE))
    .use(auditLog('create', 'Contact'))
    .input(ContactCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.email) {
        const existing = await ctx.db.contact.findUnique({ where: { email: input.email } })
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Contact with this email already exists' })
      }

      const { linkedinUrl, notes, classification, ...rest } = input as typeof input & { linkedinUrl?: string; notes?: string; classification?: string }
      const contact = await ctx.db.contact.create({
        data: {
          ...rest,
          ...(linkedinUrl && { linkedInUrl: linkedinUrl }),
          ...(notes && { bio: notes }),
          ...(classification && { dataClassification: classification as never }),
        } as never,
        include: { company: { select: { id: true, name: true } } },
      })
      return contact
    }),

  update: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_WRITE))
    .use(auditLog('update', 'Contact'))
    .input(ContactUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, linkedinUrl, notes, classification, ...rest } = input as typeof input & { id: string; linkedinUrl?: string; notes?: string; classification?: string }
      const contact = await ctx.db.contact.update({
        where: { id },
        data: {
          ...rest,
          ...(linkedinUrl !== undefined && { linkedInUrl: linkedinUrl }),
          ...(notes !== undefined && { bio: notes }),
          ...(classification && { dataClassification: classification as never }),
        } as never,
        include: { company: { select: { id: true, name: true } } },
      })
      return contact
    }),

  logInteraction: authedProcedure
    .use(requirePermission(Permission.CRM_CONTACTS_WRITE))
    .use(auditLog('create', 'Contact'))
    .input(z.object({
      contactId: z.string().cuid(),
      type: z.string(),
      subject: z.string().min(1).max(255),
      notes: z.string().optional(),
      occurredAt: z.date(),
      dealId: z.string().cuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const interaction = await ctx.db.interaction.create({
        data: {
          contactId: input.contactId,
          type: input.type as never,
          subject: input.subject,
          notes: input.notes,
          occurredAt: input.occurredAt,
          dealId: input.dealId,
          userId: ctx.user!.id,
        },
      })
      return interaction
    }),
})
