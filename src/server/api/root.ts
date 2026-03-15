import { router } from '@/server/trpc/trpc'
import { userRouter } from './routers/user'
import { dealRouter } from './routers/deal'
import { contactRouter } from './routers/contact'
import { companyRouter } from './routers/company'
import { fundRouter } from './routers/fund'
import { portfolioRouter } from './routers/portfolio'
import { dataroomRouter } from './routers/dataroom'
import { reportingRouter } from './routers/reporting'
import { auditRouter } from './routers/audit'
import { dashboardRouter } from './routers/dashboard'

export const appRouter = router({
  user: userRouter,
  deal: dealRouter,
  contact: contactRouter,
  company: companyRouter,
  fund: fundRouter,
  portfolio: portfolioRouter,
  dataroom: dataroomRouter,
  reporting: reportingRouter,
  audit: auditRouter,
  dashboard: dashboardRouter,
})

export type AppRouter = typeof appRouter
