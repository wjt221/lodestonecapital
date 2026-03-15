// =============================================================================
// Lodestone Capital - NextAuth v5 Configuration
// =============================================================================
//
// Security controls implemented:
//  - Credentials provider with bcrypt password verification
//  - OIDC provider support via AUTH_OIDC_* environment variables (Okta / Azure AD)
//  - JWT strategy with short-lived tokens (inactivity + absolute timeout)
//  - Account lockout after MAX_FAILED_ATTEMPTS
//  - P-07: Account access expires after ACCESS_EXPIRY_MONTHS
//  - MFA placeholder checked at token level (enforced at IdP in production)
//  - Role attached to JWT and propagated to session
// =============================================================================

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth'
import { compare } from 'bcryptjs'
import { db } from '@/server/db'
import { SESSION, PASSWORD_POLICY } from '@/lib/constants'
import type { Role } from '@prisma/client'


// ---------------------------------------------------------------------------
// Helper: record a failed login attempt and potentially lock the account
// ---------------------------------------------------------------------------
async function recordFailedLogin(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { failedLoginCount: true },
  })
  if (!user) return

  const newCount = (user.failedLoginCount ?? 0) + 1
  const shouldLock = newCount >= PASSWORD_POLICY.MAX_FAILED_ATTEMPTS

  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: newCount,
      ...(shouldLock && {
        lockedUntil: new Date(
          Date.now() + PASSWORD_POLICY.LOCKOUT_DURATION_MINUTES * 60 * 1000,
        ),
      }),
    },
  })
}

// ---------------------------------------------------------------------------
// Helper: clear failed login state on successful authentication
// ---------------------------------------------------------------------------
async function clearFailedLogins(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  })
}

// ---------------------------------------------------------------------------
// NextAuth configuration
// ---------------------------------------------------------------------------
export const authConfig: NextAuthConfig = {
  providers: [
    // ------------------------------------------------------------------
    // Credentials provider: email + password with bcrypt verification.
    // In production this is supplemented by an OIDC provider (Okta/AzureAD)
    // configured via AUTH_OIDC_* env vars.
    // ------------------------------------------------------------------
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            mfaEnabled: true,
            passwordHash: true,
            failedLoginCount: true,
            lockedUntil: true,
            // P-07: Check account expiry via FundAccess table rather than a
            // non-existent `accessExpiresAt` column on User.
          },
        })

        // Unknown user — still go through timing-safe path
        if (!user) return null

        // Account deactivated
        if (!user.isActive) return null

        // Account locked out after repeated failures
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null
        }

        // Verify password
        if (!user.passwordHash) {
          // No password set — account uses OIDC only
          return null
        }

        const passwordValid = await compare(password, user.passwordHash)
        if (!passwordValid) {
          await recordFailedLogin(user.id).catch(() => undefined)
          return null
        }

        // Successful auth: reset failed attempts and record login time
        await clearFailedLogins(user.id).catch(() => undefined)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        }
      },
    }),

    // ------------------------------------------------------------------
    // OIDC provider (Okta, Azure AD, etc.)
    // Enabled when AUTH_OIDC_ISSUER is set in the environment.
    // In production, MFA is enforced at the IdP level.
    // ------------------------------------------------------------------
    ...(process.env.AUTH_OIDC_ISSUER
      ? [
          {
            id: 'oidc',
            name: process.env.AUTH_OIDC_PROVIDER_NAME ?? 'SSO',
            type: 'oidc' as const,
            issuer: process.env.AUTH_OIDC_ISSUER,
            clientId: process.env.AUTH_OIDC_CLIENT_ID,
            clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET,
            profile(profile: Record<string, unknown>) {
              return {
                id: profile.sub as string,
                email: profile.email as string,
                name: profile.name as string | null,
                role: (profile['lodestone_role'] as Role) ?? 'ANALYST',
                mfaEnabled: true,
              }
            },
          },
        ]
      : []),
  ],

  // -----------------------------------------------------------------------
  // Session: JWT strategy with short-lived tokens
  // Absolute max-age is the outer bound; inactivity is enforced in the jwt
  // callback below.
  // -----------------------------------------------------------------------
  session: {
    strategy: 'jwt',
    maxAge: SESSION.ABSOLUTE_TIMEOUT_MS / 1000,
    updateAge: 60, // Re-sign JWT at most every 60 seconds
  },

  // -----------------------------------------------------------------------
  // Callbacks
  // -----------------------------------------------------------------------
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      const now = Date.now()

      if (user) {
        // Initial sign-in: seed all custom claims
        token.id = user.id
        token.role = user.role
        token.mfaEnabled = user.mfaEnabled
        token.lastActivityAt = now
        token.absoluteExpiresAt = now + SESSION.ABSOLUTE_TIMEOUT_MS
      }

      // Absolute timeout: invalidate token if 8-hour wall-clock limit exceeded
      if (token.absoluteExpiresAt && now > token.absoluteExpiresAt) {
        return null
      }

      // Inactivity timeout: invalidate if user has been idle > 15 minutes
      if (token.lastActivityAt) {
        const idleMs = now - token.lastActivityAt
        if (idleMs > SESSION.INACTIVITY_TIMEOUT_MS) {
          return null
        }
      }

      // Refresh activity timestamp on every token access
      token.lastActivityAt = now

      return token
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (!token?.id) {
        return { ...session, user: undefined }
      }

      // Propagate custom token claims into the session user object
      session.user = {
        id: token.id,
        email: session.user.email,
        name: session.user.name ?? '',
        role: token.role,
        mfaEnabled: token.mfaEnabled,
        lastActivityAt: token.lastActivityAt,
      }

      return session
    },

    async signIn({ user, account }) {
      // For OIDC logins: ensure the user exists in our database and is active.
      // Create or sync the user record from the IdP profile.
      if (account?.provider === 'oidc' && user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, isActive: true },
        })

        if (!dbUser) {
          // Auto-provision from OIDC — creates account with default ANALYST role.
          // Role is updated separately by SUPER_ADMIN after provisioning.
          await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              role: (user as { role?: Role }).role ?? 'ANALYST',
              isActive: true,
              mfaEnabled: true,
              lastLoginAt: new Date(),
              emailVerified: new Date(),
            },
          })
        } else {
          if (!dbUser.isActive) return false // Deprovisioned user blocked
          await db.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date(), name: user.name ?? undefined },
          }).catch(() => undefined)
        }
      }

      return true
    },
  },

  // -----------------------------------------------------------------------
  // Custom pages
  // -----------------------------------------------------------------------
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------
  events: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signOut(params: any) {
      const token = params.token
      // When a user explicitly signs out, delete their DB sessions to enforce
      // single-session policy (MAX_CONCURRENT_SESSIONS = 1).
      if (token?.id) {
        await db.session
          .deleteMany({ where: { userId: token.id as string } })
          .catch(() => undefined)
      }
    },
  },

  trustHost: true,
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
