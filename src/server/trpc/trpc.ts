import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { db } from '@/server/db'
import type { Role } from '@prisma/client'

export interface TRPCContext {
  db: typeof db
  session: {
    user: {
      id: string
      email: string
      name: string
      role: Role
      mfaEnabled: boolean
      lastActivityAt: number
    }
  } | null
  user: {
    id: string
    email: string
    name: string | null
    role: Role
    isActive: boolean
    mfaEnabled: boolean
    lastLoginAt: Date | null
    fundAccess: { fundId: string; expiresAt: Date | null }[]
  } | null
  headers: Headers
}

export async function createTRPCContext(opts: {
  headers: Headers
}): Promise<TRPCContext> {
  return {
    db,
    session: null,
    user: null,
    headers: opts.headers,
  }
}

export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const middleware = t.middleware
export const publicProcedure = t.procedure
export const mergeRouters = t.mergeRouters
