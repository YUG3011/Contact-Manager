
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
