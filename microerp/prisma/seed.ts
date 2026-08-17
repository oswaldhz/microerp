import { PrismaClient, Role, PaymentMethod, CustomerLevel, InvoiceStatus, NotificationType } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Limpiando base de datos...')
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  console.log('Creando empresa Urban Shoes...')
  const company = await prisma.company.create({
    data: {
      name: 'Urban Shoes',
      rnc: '131-23456-7',
      address: 'Av. Winston Churchill 45, Santo Domingo',
      phone: '(809) 555-0100',
      currency: 'DOP',
    },
  })

  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const sellerPassword = await bcrypt.hash('Vendedor123!', 10)
  const accountantPassword = await bcrypt.hash('Contador123!', 10)

  await prisma.user.createMany({
    data: [
      {
        companyId: company.id,
        name: 'Oswald Peralta',
        email: 'admin@urban-shoes.com',
        passwordHash: adminPassword,
        role: Role.ADMIN,
      },
      {
        companyId: company.id,
        name: 'Carlos Vendedor',
        email: 'carlos@urban-shoes.com',
        passwordHash: sellerPassword,
        role: Role.VENDEDOR,
      },
      {
        companyId: company.id,
        name: 'María Contadora',
        email: 'maria@urban-shoes.com',
        passwordHash: accountantPassword,
        role: Role.CONTADOR,
      },
    ],
  })

  const supplier1 = await prisma.supplier.create({
    data: {
      companyId: company.id,
      name: 'Nike Distributor',
      contactName: 'Juan Rosario',
      phone: '(809) 555-0200',
      email: 'ventas@nikedistributor.com',
      address: 'Parque Industrial de Santiago',
    },
  })
  const supplier2 = await prisma.supplier.create({
    data: {
      companyId: company.id,
      name: 'Adidas Caribe',
      contactName: 'Laura Pérez',
      phone: '(809) 555-0300',
      email: 'contacto@adidascaribe.com',
      address: 'Zona Franca San Isidro',
    },
  })
  const supplier3 = await prisma.supplier.create({
    data: {
      companyId: company.id,
      name: 'Distribuidora XYZ',
      contactName: 'Pedro Gómez',
      phone: '(829) 555-0400',
      email: 'pedro@distxyz.com',
      address: 'Av. Duarte 120, La Vega',
    },
  })

  const sneakers = await prisma.category.create({ data: { companyId: company.id, name: 'Sneakers' } })
  const boots = await prisma.category.create({ data: { companyId: company.id, name: 'Botas' } })
  const sandals = await prisma.category.create({ data: { companyId: company.id, name: 'Sandalias' } })
  const formal = await prisma.category.create({ data: { companyId: company.id, name: 'Formal' } })
  const accessories = await prisma.category.create({ data: { companyId: company.id, name: 'Accesorios' } })

  const products = await prisma.product.createManyAndReturn({
    data: [
      { companyId: company.id, sku: 'NIK-AM-001', name: 'Nike Air Max', description: 'Zapatillas deportivas clásicas', categoryId: sneakers.id, purchasePrice: 4500, salePrice: 8950, stock: 15, minStock: 5, supplierId: supplier1.id },
      { companyId: company.id, sku: 'NIK-RN-002', name: 'Nike Revolution 7', description: 'Zapatillas de running', categoryId: sneakers.id, purchasePrice: 3800, salePrice: 7200, stock: 8, minStock: 4, supplierId: supplier1.id },
      { companyId: company.id, sku: 'ADI-SU-003', name: 'Adidas Superstar', description: 'Zapatillas urbanas', categoryId: sneakers.id, purchasePrice: 4200, salePrice: 8300, stock: 4, minStock: 5, supplierId: supplier2.id },
      { companyId: company.id, sku: 'ADI-GZ-004', name: 'Adidas Gazelle', description: 'Zapatillas clásicas', categoryId: sneakers.id, purchasePrice: 3900, salePrice: 7600, stock: 12, minStock: 4, supplierId: supplier2.id },
      { companyId: company.id, sku: 'TIM-CL-005', name: 'Timberland Classic', description: 'Bota clásica de cuero', categoryId: boots.id, purchasePrice: 6800, salePrice: 12500, stock: 6, minStock: 3, supplierId: supplier3.id },
      { companyId: company.id, sku: 'CAT-HR-006', name: 'Caterpillar Heritage', description: 'Bota de trabajo', categoryId: boots.id, purchasePrice: 5200, salePrice: 9800, stock: 3, minStock: 4, supplierId: supplier3.id },
      { companyId: company.id, sku: 'SKC-OR-007', name: 'Skechers Flex', description: 'Sandalias cómodas', categoryId: sandals.id, purchasePrice: 1500, salePrice: 2900, stock: 20, minStock: 6, supplierId: supplier3.id },
      { companyId: company.id, sku: 'SAL-VA-008', name: 'Salvatore Ferragamo', description: 'Zapato formal de vestir', categoryId: formal.id, purchasePrice: 9800, salePrice: 18500, stock: 2, minStock: 2, supplierId: supplier2.id },
      { companyId: company.id, sku: 'ACC-MD-009', name: 'Media deportiva (par)', description: 'Media de algodón deportiva', categoryId: accessories.id, purchasePrice: 150, salePrice: 350, stock: 80, minStock: 20, supplierId: supplier1.id },
      { companyId: company.id, sku: 'ACC-CR-010', name: 'Cordones (par)', description: 'Cordones de repuesto', categoryId: accessories.id, purchasePrice: 60, salePrice: 150, stock: 45, minStock: 15, supplierId: supplier1.id },
    ],
  })

  const customers = await prisma.customer.createManyAndReturn({
    data: [
      { companyId: company.id, name: 'Juan Pérez', email: 'juan.perez@gmail.com', phone: '(809) 555-1001', address: 'Ensanche La Paz 12', level: CustomerLevel.ORO },
      { companyId: company.id, name: 'María Rodríguez', email: 'maria.rod@gmail.com', phone: '(829) 555-1002', address: 'Naco, calle 3', level: CustomerLevel.PLATA },
      { companyId: company.id, name: 'Pedro Martínez', email: 'pedro.mtz@hotmail.com', phone: '(849) 555-1003', address: 'Los Prados 8', level: CustomerLevel.BRONCE },
      { companyId: company.id, name: 'Ana Gómez', email: 'ana.gomez@gmail.com', phone: '(809) 555-1004', address: 'Piantini 25', level: CustomerLevel.PLATA },
      { companyId: company.id, name: 'Luis Fernández', email: 'luis.fernandez@gmail.com', phone: '(829) 555-1005', address: 'Arroyo Hondo 7', level: CustomerLevel.BRONCE },
    ],
  })

  const employee1 = await prisma.employee.create({
    data: { companyId: company.id, name: 'Carlos Vendedor', position: 'Vendedor', phone: '(809) 555-2001', email: 'carlos@urban-shoes.com', salary: 22000, commission: 2 },
  })
  await prisma.employee.create({
    data: { companyId: company.id, name: 'Rosa Díaz', position: 'Vendedora', phone: '(809) 555-2002', email: 'rosa@urban-shoes.com', salary: 22000, commission: 2 },
  })
  await prisma.employee.create({
    data: { companyId: company.id, name: 'Miguel Santos', position: 'Encargado de inventario', phone: '(809) 555-2003', email: 'miguel@urban-shoes.com', salary: 26000, commission: 0 },
  })

  const now = new Date()

  async function makeSale(daysAgo: number, customerIndex: number, productIndexes: number[], quantities: number[], method: PaymentMethod, discount = 0) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(10 + (daysAgo % 8), 0, 0, 0)

    const last = await prisma.sale.findFirst({ where: { companyId: company.id }, orderBy: { number: 'desc' }, select: { number: true } })
    const number = (last?.number ?? 0) + 1

    let subtotal = 0
    const items = productIndexes.map((pi, idx) => {
      const p = products[pi]
      const unitPrice = Number(p.salePrice)
      const qty = quantities[idx]
      subtotal += unitPrice * qty
      return { p, qty, unitPrice }
    })
    const tax = Math.round(subtotal * 0.18 * 100) / 100
    const total = Math.round((subtotal - discount + tax) * 100) / 100

    await prisma.sale.create({
      data: {
        number,
        companyId: company.id,
        userId: (await prisma.user.findFirst({ where: { companyId: company.id, role: Role.VENDEDOR } }))!.id,
        employeeId: employee1.id,
        customerId: customers[customerIndex].id,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: method,
        createdAt: date,
        items: { create: items.map((i) => ({ productId: i.p.id, quantity: i.qty, unitPrice: i.unitPrice, subtotal: Math.round(i.unitPrice * i.qty * 100) / 100 })) },
        payments: { create: { amount: total, method, companyId: company.id, date } },
      },
    })
  }

  console.log('Generando ventas demo (30 días)...')
  await makeSale(1, 0, [0], [2], PaymentMethod.TARJETA)
  await makeSale(2, 1, [1, 8], [1, 3], PaymentMethod.EFECTIVO)
  await makeSale(3, 2, [4], [1], PaymentMethod.TARJETA)
  await makeSale(4, 3, [2, 9], [2, 2], PaymentMethod.EFECTIVO)
  await makeSale(5, 0, [0], [1], PaymentMethod.TRANSFERENCIA)
  await makeSale(6, 4, [7], [1], PaymentMethod.TARJETA)
  await makeSale(7, 1, [3], [2], PaymentMethod.EFECTIVO)
  await makeSale(9, 2, [0, 8], [1, 2], PaymentMethod.EFECTIVO)
  await makeSale(11, 3, [5], [1], PaymentMethod.TARJETA)
  await makeSale(13, 0, [1], [2], PaymentMethod.EFECTIVO)
  await makeSale(16, 4, [6], [3], PaymentMethod.EFECTIVO)
  await makeSale(19, 1, [2], [1], PaymentMethod.TARJETA)
  await makeSale(23, 2, [0], [3], PaymentMethod.EFECTIVO)
  await makeSale(27, 3, [3, 9], [1, 4], PaymentMethod.EFECTIVO)

  console.log('Generando gastos demo...')
  await prisma.expense.createMany({
    data: [
      { companyId: company.id, description: 'Electricidad', category: 'Servicios', amount: 3200, date: new Date(now.getFullYear(), now.getMonth(), 5) },
      { companyId: company.id, description: 'Internet + teléfono', category: 'Servicios', amount: 1500, date: new Date(now.getFullYear(), now.getMonth(), 6) },
      { companyId: company.id, description: 'Alquiler local', category: 'Alquiler', amount: 18500, date: new Date(now.getFullYear(), now.getMonth(), 1) },
      { companyId: company.id, description: 'Publicidad en Instagram', category: 'Publicidad', amount: 2500, date: new Date(now.getFullYear(), now.getMonth(), 10) },
      { companyId: company.id, description: 'Transporte de mercancía', category: 'Transporte', amount: 800, date: new Date(now.getFullYear(), now.getMonth(), 12) },
      { companyId: company.id, description: 'Materiales de empaque', category: 'Suministros', amount: 450, date: new Date(now.getFullYear(), now.getMonth(), 15) },
    ],
  })

  console.log('Generando facturas demo...')
  const inv1 = await prisma.invoice.create({
    data: {
      number: 1,
      companyId: company.id,
      customerId: customers[4].id,
      subtotal: 18500,
      tax: 3330,
      total: 21830,
      status: InvoiceStatus.PENDIENTE,
      issueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 13),
    },
  })
  await prisma.payment.create({
    data: { invoiceId: inv1.id, amount: 10000, method: PaymentMethod.TRANSFERENCIA, companyId: company.id },
  })

  const inv2 = await prisma.invoice.create({
    data: {
      number: 2,
      companyId: company.id,
      customerId: customers[0].id,
      subtotal: 8950,
      tax: 1611,
      total: 10561,
      status: InvoiceStatus.PENDIENTE,
      issueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
    },
  })
  await prisma.payment.create({
    data: { invoiceId: inv2.id, amount: 5000, method: PaymentMethod.EFECTIVO, companyId: company.id },
  })

  await prisma.invoice.create({
    data: {
      number: 3,
      companyId: company.id,
      customerId: customers[1].id,
      subtotal: 7600,
      tax: 1368,
      total: 8968,
      status: InvoiceStatus.PAGADA,
      issueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 22),
      payments: { create: [{ amount: 8968, method: PaymentMethod.TARJETA, companyId: company.id }] },
    },
  })

  console.log('Generando órdenes de compra demo...')
  await prisma.purchaseOrder.create({
    data: {
      number: 1,
      companyId: company.id,
      supplierId: supplier1.id,
      status: 'RECIBIDA',
      total: 18750,
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20),
      items: {
        create: [
          { productId: products[0].id, quantity: 3, unitPrice: 4500 },
          { productId: products[1].id, quantity: 1, unitPrice: 3750 },
        ],
      },
    },
  })
  await prisma.purchaseOrder.create({
    data: {
      number: 2,
      companyId: company.id,
      supplierId: supplier2.id,
      status: 'PENDIENTE',
      total: 8100,
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
      items: {
        create: [{ productId: products[2].id, quantity: 1, unitPrice: 8100 }],
      },
    },
  })

  console.log('Generando notificaciones demo...')
  await prisma.notification.createMany({
    data: [
      { companyId: company.id, type: NotificationType.STOCK_CRITICO, message: '"Adidas Superstar" tiene 4 unidades (mínimo: 5)' },
      { companyId: company.id, type: NotificationType.STOCK_CRITICO, message: '"Caterpillar Heritage" tiene 3 unidades (mínimo: 4)' },
      { companyId: company.id, type: NotificationType.PROVEEDOR_PENDIENTE, message: 'La factura #2 lleva 1 día pendiente y venció' },
      { companyId: company.id, type: NotificationType.RENDIMIENTO, message: 'Las ventas aumentaron 14% esta semana' },
      { companyId: company.id, type: NotificationType.CLIENTE, message: 'Juan Pérez realizó su décima compra' },
    ],
  })

  console.log('Seed completado ✔')
  console.log('Usuarios de prueba:')
  console.log('  admin@urban-shoes.com / Admin123!  (Administrador)')
  console.log('  carlos@urban-shoes.com / Vendedor123!  (Vendedor)')
  console.log('  maria@urban-shoes.com / Contador123!  (Contador)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())