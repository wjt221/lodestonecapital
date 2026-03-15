import 'server-only'
import { headers } from 'next/headers'
import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/trpc/trpc'
import { t } from '@/server/trpc/trpc'

const createCaller = t.createCallerFactory(appRouter)

export async function createServerCaller() {
  const headersList = await headers()
  const ctx = await createTRPCContext({ headers: headersList })
  return createCaller(ctx)
}
