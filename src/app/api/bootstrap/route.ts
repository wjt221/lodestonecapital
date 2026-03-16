import { NextResponse } from 'next/server'
import { db } from '@/server/db'

// One-time bootstrap endpoint to promote the first user to SUPER_ADMIN.
// Automatically disables itself once any SUPER_ADMIN exists.
export async function POST(req: Request) {
  const { email, secret } = await req.json()

  if (secret !== process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminExists = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  if (adminExists) {
    return NextResponse.json({ error: 'Bootstrap already complete' }, { status: 400 })
  }

  const user = await db.user.update({
    where: { email: email.toLowerCase() },
    data: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true, role: true },
  })

  return NextResponse.json({ success: true, user })
}
