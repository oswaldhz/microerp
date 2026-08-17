import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { requireSession, badRequest, serverError } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const MAX_SIZE = 2 * 1024 * 1024

export async function POST(request: Request) {
  const session = await getSession()
  const checked = requireSession(session)
  if (checked instanceof NextResponse) return checked

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return badRequest('Se requiere un archivo de imagen')

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return badRequest('Formato no permitido: usa JPG, PNG o WebP')
    if (file.size > MAX_SIZE) return badRequest('La imagen no puede superar 2 MB')

    const bytes = Buffer.from(await file.arrayBuffer())
    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(dir, { recursive: true })
    const filename = `${randomUUID()}${ext}`
    await writeFile(path.join(dir, filename), bytes)

    const avatar = `/uploads/avatars/${filename}`
    await prisma.user.update({ where: { id: checked.userId }, data: { avatar } })
    return NextResponse.json({ url: avatar })
  } catch (error) {
    return serverError(error)
  }
}