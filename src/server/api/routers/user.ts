import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { UserCreateSchema, UserUpdateSchema, IdSchema, PaginationSchema } from '@/lib/validations'
import { hash } from 'bcryptjs'

const authedProcedure = publicProcedure.use(requireAuth)

export const userRouter = router({
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().max(255),
      password: z.string().min(12),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({ where: { email: input.email.toLowerCase() } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'An account with this email already exists.' })

      const passwordHash = await hash(input.password, 12)

      const user = await ctx.db.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          role: 'ANALYST',
          passwordHash,
          isActive: true,
        },
        select: { id: true, email: true, name: true, role: true },
      })
      return user
    }),


  list: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .input(PaginationSchema.extend({
      isActive: z.boolean().optional(),
      role: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, sortBy, sortOrder, isActive, role } = input
      const where = {
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(role && { role: role as never }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' as const }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            mfaEnabled: true,
            lastLoginAt: true,
            createdAt: true,
            _count: { select: { dealAssignments: true } },
          },
        }),
        ctx.db.user.count({ where }),
      ])

      return { users, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  get: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          mfaEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          failedLoginCount: true,
          lockedUntil: true,
          fundAccess: {
            include: { fund: { select: { id: true, name: true } } },
          },
        },
      })
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      return user
    }),

  create: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .use(auditLog('provision', 'User'))
    .input(UserCreateSchema.extend({ password: z.string().min(12) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({ where: { email: input.email.toLowerCase() } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Email already exists' })

      const passwordHash = await hash(input.password, 12)

      const user = await ctx.db.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          role: input.role,
          passwordHash,
          isActive: true,
        },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      })
      return user
    }),

  update: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .use(auditLog('update', 'User'))
    .input(UserUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, accessExpiresAt: _, ...data } = input
      const user = await ctx.db.user.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
      })
      return user
    }),

  deactivate: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .use(auditLog('deprovision', 'User'))
    .input(IdSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: input.id },
        data: { isActive: false },
        select: { id: true, email: true, isActive: true },
      })
      return user
    }),

  unlock: authedProcedure
    .use(requirePermission(Permission.USER_PROVISION))
    .use(auditLog('update', 'User'))
    .input(IdSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.id },
        data: { lockedUntil: null, failedLoginCount: 0 },
      })
      return { success: true }
    }),

  me: authedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        lastLoginAt: true,
      },
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),
})
