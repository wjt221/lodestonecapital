import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '@/server/trpc/trpc'
import { requireAuth, requirePermission, auditLog } from '@/server/trpc/middleware'
import { Permission } from '@/server/auth/rbac'
import { DataRoomSchema, DataRoomFolderSchema, DataRoomAccessSchema, IdSchema, PaginationSchema } from '@/lib/validations'

const authedProcedure = publicProcedure.use(requireAuth)

export const dataroomRouter = router({
  list: authedProcedure
    .use(requirePermission(Permission.DATAROOM_READ_ASSIGNED))
    .input(PaginationSchema.extend({
      type: z.string().optional(),
      dealId: z.string().cuid().optional(),
      fundId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, type, dealId, fundId } = input
      const user = ctx.user!

      // For DATAROOM_READ_ASSIGNED (not DATAROOM_READ_ALL), filter to only assigned rooms
      const canReadAll =
        user.role === 'MANAGING_PARTNER' ||
        user.role === 'PARTNER' ||
        user.role === 'PRINCIPAL' ||
        user.role === 'INVESTOR_RELATIONS' ||
        user.role === 'COMPLIANCE' ||
        user.role === 'FUND_ACCOUNTANT'

      const where: Record<string, unknown> = {
        isActive: true,
        ...(type && { type }),
        ...(dealId && { dealId }),
        ...(fundId && { fundId }),
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(!canReadAll && {
          access: { some: { userId: user.id, revokedAt: null } },
        }),
      }

      const [rooms, total] = await Promise.all([
        ctx.db.dataRoom.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            deal: { select: { id: true, name: true } },
            fund: { select: { id: true, name: true } },
            _count: { select: { folders: true, access: true } },
          },
        }),
        ctx.db.dataRoom.count({ where }),
      ])

      return { rooms, total, page, pageSize, pages: Math.ceil(total / pageSize) }
    }),

  get: authedProcedure
    .use(requirePermission(Permission.DATAROOM_READ_ASSIGNED))
    .input(IdSchema)
    .query(async ({ ctx, input }) => {
      const user = ctx.user!

      const room = await ctx.db.dataRoom.findUnique({
        where: { id: input.id },
        include: {
          folders: {
            where: { parentId: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              children: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  documents: {
                    where: { isActive: true },
                    select: { id: true, name: true, fileSize: true, mimeType: true, createdAt: true },
                  },
                },
              },
              documents: {
                where: { isActive: true },
                select: { id: true, name: true, fileSize: true, mimeType: true, createdAt: true },
              },
            },
          },
          access: {
            where: { userId: user.id, revokedAt: null },
          },
          deal: { select: { id: true, name: true } },
          fund: { select: { id: true, name: true } },
        },
      })

      if (!room) throw new TRPCError({ code: 'NOT_FOUND' })

      const canReadAll =
        user.role === 'MANAGING_PARTNER' || user.role === 'PARTNER' ||
        user.role === 'COMPLIANCE' || user.role === 'INVESTOR_RELATIONS'

      // Verify access
      if (!canReadAll && room.access.length === 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this data room' })
      }

      return room
    }),

  create: authedProcedure
    .use(requirePermission(Permission.DATAROOM_MANAGE_ALL))
    .use(auditLog('create', 'DataRoom'))
    .input(DataRoomSchema)
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db.dataRoom.create({
        data: {
          ...input,
          createdById: ctx.user!.id,
        },
      })
      return room
    }),

  createFolder: authedProcedure
    .use(requirePermission(Permission.DATAROOM_UPLOAD))
    .use(auditLog('create', 'DataRoomFolder'))
    .input(DataRoomFolderSchema)
    .mutation(async ({ ctx, input }) => {
      const folder = await ctx.db.dataRoomFolder.create({ data: input })
      return folder
    }),

  grantAccess: authedProcedure
    .use(requirePermission(Permission.DATAROOM_MANAGE_INVESTOR))
    .use(auditLog('access_grant', 'DataRoomAccess'))
    .input(DataRoomAccessSchema)
    .mutation(async ({ ctx, input }) => {
      const access = await ctx.db.dataRoomAccess.upsert({
        where: { dataRoomId_userId: { dataRoomId: input.dataRoomId, userId: input.userId } },
        create: {
          dataRoomId: input.dataRoomId,
          userId: input.userId,
          canView: true,
          canDownload: input.permission === 'manage' || input.permission === 'upload',
          canUpload: input.permission === 'upload' || input.permission === 'manage',
          canManage: input.permission === 'manage',
          expiresAt: input.expiresAt,
          grantedById: ctx.user!.id,
        },
        update: {
          canDownload: input.permission === 'manage' || input.permission === 'upload',
          canUpload: input.permission === 'upload' || input.permission === 'manage',
          canManage: input.permission === 'manage',
          expiresAt: input.expiresAt,
          revokedAt: null,
        },
      })
      return access
    }),

  revokeAccess: authedProcedure
    .use(requirePermission(Permission.DATAROOM_MANAGE_INVESTOR))
    .use(auditLog('access_revoke', 'DataRoomAccess'))
    .input(z.object({ dataRoomId: z.string().cuid(), userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.dataRoomAccess.update({
        where: { dataRoomId_userId: { dataRoomId: input.dataRoomId, userId: input.userId } },
        data: { revokedAt: new Date(), revokedById: ctx.user!.id },
      })
      return { success: true }
    }),

  getDocumentDownloadUrl: authedProcedure
    .use(requirePermission(Permission.DOCUMENT_DOWNLOAD))
    .use(auditLog('download', 'DataRoomDocument'))
    .input(z.object({ documentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.dataRoomDocument.findUnique({
        where: { id: input.documentId, isActive: true },
        include: {
          folder: {
            include: {
              dataRoom: {
                include: {
                  access: {
                    where: { userId: ctx.user!.id, revokedAt: null },
                  },
                },
              },
            },
          },
        },
      })

      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })

      const room = doc.folder.dataRoom
      const user = ctx.user!

      // Verify download permission
      const userAccess = room.access[0]
      const isAdmin =
        user.role === 'MANAGING_PARTNER' || user.role === 'PARTNER' || user.role === 'COMPLIANCE'

      if (!isAdmin && (!userAccess || !userAccess.canDownload)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Download not permitted' })
      }

      // Log document access
      await ctx.db.documentAccessLog.create({
        data: {
          documentId: doc.id,
          userId: user.id,
          action: 'DOWNLOAD',
          ipAddress: (ctx.headers as Headers).get('x-forwarded-for') ?? '0.0.0.0',
          userAgent: (ctx.headers as Headers).get('user-agent') ?? 'unknown',
          downloadedAt: new Date(),
        },
      }).catch(() => undefined)

      // In production: generate pre-signed S3 URL with watermarking
      // Returning the S3 key here for the frontend to handle
      return { s3Key: doc.s3Key, fileName: doc.fileName, mimeType: doc.mimeType }
    }),
})
