import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      mfaEnabled: boolean
      lastActivityAt: number
    }
  }
  interface User {
    id: string
    email: string
    name: string | null
    role: Role
    mfaEnabled: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    mfaEnabled: boolean
    lastActivityAt: number
    absoluteExpiresAt: number
  }
}
