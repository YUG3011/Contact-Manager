
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request, context: any) {
  const resolvedParams = await Promise.resolve(context.params)
  const { id } = resolvedParams as { id: string }
  const contact = await prisma.contact.findUnique({ where: { id } })
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(contact)
}

export async function PATCH(req: Request, context: any) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams as { id: string }
    const body = await req.json()

    const emailNorm = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phoneNorm = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (emailNorm) {
      const existingEmail = await prisma.contact.findFirst({
        where: { email: emailNorm, NOT: { id } },
      })
      if (existingEmail)
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      body.email = emailNorm
    }

    if (phoneNorm) {
      const existingPhone = await prisma.contact.findFirst({
        where: { phone: phoneNorm, NOT: { id } },
      })
      if (existingPhone)
        return NextResponse.json({ error: 'Phone already exists' }, { status: 409 })
      body.phone = phoneNorm
    }

    const updated = await prisma.contact.update({ where: { id }, data: body })
    revalidatePath('/contacts')
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams as { id: string }
    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
