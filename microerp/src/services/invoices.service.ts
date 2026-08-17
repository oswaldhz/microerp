import { prisma } from '@/lib/prisma'
import { round2 } from '@/lib/utils'
import { InvoiceStatus, NotificationType, PaymentMethod } from '@/generated/prisma/enums'

export interface InvoiceInput {
  customerId?: string | null
  subtotal: number
  tax?: number
  dueDate?: Date | null
}

export async function nextInvoiceNumber(companyId: string): Promise<number> {
  const last = await prisma.invoice.findFirst({
    where: { companyId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  return (last?.number ?? 0) + 1
}

export async function createInvoice(companyId: string, data: InvoiceInput) {
  const subtotal = round2(data.subtotal)
  const tax = round2(data.tax ?? 0)
  const total = round2(subtotal + tax)
  const number = await nextInvoiceNumber(companyId)

  return prisma.invoice.create({
    data: {
      number,
      companyId,
      customerId: data.customerId ?? null,
      subtotal,
      tax,
      total,
      status: InvoiceStatus.PENDIENTE,
      dueDate: data.dueDate ?? null,
    },
    include: { customer: true },
  })
}

export async function updateInvoice(invoiceId: string, companyId: string, data: InvoiceInput) {
  const existing = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId } })
  if (!existing) throw new Error('Factura no encontrada')
  if (existing.status !== InvoiceStatus.PENDIENTE) {
    throw new Error('Solo se pueden editar facturas pendientes')
  }
  const subtotal = round2(data.subtotal)
  const tax = round2(data.tax ?? 0)
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      customerId: data.customerId ?? null,
      subtotal,
      tax,
      total: round2(subtotal + tax),
      dueDate: data.dueDate ?? null,
    },
    include: { customer: true },
  })
}

export async function cancelInvoice(invoiceId: string, companyId: string) {
  const existing = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId } })
  if (!existing) throw new Error('Factura no encontrada')
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.CANCELADA },
  })
}

export async function registerInvoicePayment(
  invoiceId: string,
  companyId: string,
  amount: number,
  method: PaymentMethod,
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { payments: true },
    })
    if (!invoice) throw new Error('Factura no encontrada')
    if (invoice.status === InvoiceStatus.CANCELADA) throw new Error('No se puede pagar una factura cancelada')

    const paidSoFar = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0)
    const remaining = round2(Number(invoice.total) - paidSoFar)
    if (amount > remaining) throw new Error(`El monto excede el saldo pendiente (${remaining.toFixed(2)})`)

    const payment = await tx.payment.create({
      data: { invoiceId, amount, method, companyId },
    })

    const newPaid = round2(paidSoFar + amount)
    let status = invoice.status
    if (newPaid >= Number(invoice.total)) {
      status = InvoiceStatus.PAGADA
      await tx.invoice.update({ where: { id: invoiceId }, data: { status } })
    }

    if (status !== InvoiceStatus.PAGADA && invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
      await tx.notification.create({
        data: {
          type: NotificationType.PROVEEDOR_PENDIENTE,
          companyId,
          message: `La factura #${invoice.number} tiene saldo pendiente y venció`,
        },
      })
    }

    return { payment, status, remaining: round2(remaining - amount) }
  })
}

export async function listInvoices(companyId: string, opts: { status?: InvoiceStatus; limit?: number } = {}) {
  return prisma.invoice.findMany({
    where: { companyId, ...(opts.status ? { status: opts.status } : {}) },
    orderBy: { issueDate: 'desc' },
    take: opts.limit ?? 100,
    include: {
      customer: { select: { id: true, name: true } },
      payments: { select: { id: true, amount: true, method: true, date: true } },
    },
  })
}

export async function getInvoice(invoiceId: string, companyId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: { customer: true, payments: true },
  })
  if (!invoice) throw new Error('Factura no encontrada')
  return invoice
}