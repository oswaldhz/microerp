import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { requirePermission, badRequest, serverError } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { emitBrandingEvent } from '@/lib/branding-events'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const MAX_SIZE = 2 * 1024 * 1024

export async function POST(request: Request) {
  const session = await getSession()
  const checked = requirePermission(session, 'companies.manage')
  if (checked instanceof NextResponse) return checked

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return badRequest('Se requiere un archivo de imagen')
    if (file.size === 0) return badRequest('El archivo está vacío')

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return badRequest('Formato no permitido: usa JPG, PNG o WebP')
    if (file.size > MAX_SIZE) return badRequest('La imagen no puede superar 2 MB')

    const bytes = Buffer.from(await file.arrayBuffer())
    const isPng =
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    const isWebp =
      bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
    if (!isPng && !isJpeg && !isWebp) return badRequest('Formato no permitido: usa JPG, PNG o WebP')
    const dir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    await mkdir(dir, { recursive: true })
    const filename = `${randomUUID()}${ext}`
    await writeFile(path.join(dir, filename), bytes)

    const logo = `/uploads/logos/${filename}`
    await prisma.company.update({ where: { id: checked.companyId }, data: { logo } })
    emitBrandingEvent(checked.companyId)
    return NextResponse.json({ url: logo })
  } catch (error) {
    return serverError(error)
  }
}