# MicroERP — Guía Completa y Detallada del Proyecto

**Tarea final de Programación III · Instituto Tecnológico de las Américas (ITLA)**
**Metodología: Agile-Scrum · Alcance: Etapa 4 (sin Etapa 5)**

---

## 1. Portada

| Campo | Valor |
|---|---|
| **Institución** | Instituto Tecnológico de las Américas (ITLA) |
| **Asignatura** | Programación III |
| **Proyecto** | MicroERP — Sistema ERP para pequeñas empresas |
| **Metodología** | Agile-Scrum (con cronograma, product backlog, sprints y retrospectivas) |
| **Fecha** | Agosto 2026 |
| **Estudiante** | __________________________________ |
| **Matrícula** | __________________________________ |

---

## 2. Introducción

MicroERP es un sistema ERP (Enterprise Resource Planning) diseñado para pequeñas y medianas empresas dominicanas que necesitan digitalizar sus operaciones sin incurrir en costos de licenciamiento. La aplicación cubre el ciclo completo de operaciones comerciales: **ventas en punto de venta (POS), inventario, clientes, proveedores, empleados, gastos, facturación, órdenes de compra, reportes y un panel de control (dashboard)**.

El sistema se entrega como una **aplicación web funcional completa** (frontend + backend + base de datos) con datos de demostración cargados, lista para ser explorada y evaluada, acompañada de esta guía que documenta el proceso de desarrollo ágil.

---

## 3. Tecnologías Utilizadas

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | Next.js 16 (App Router, React 19, Tailwind CSS 4) | React Server Components, SEO, rendimiento; Tailwind acelera el diseño de la interfaz |
| **Backend** | Next.js API Routes (route handlers) | API unificada en el mismo proyecto; sin servidores adicionales |
| **Base de datos** | PostgreSQL 16 (Docker) | BD relacional robusta, gratuita, estándar en la industria |
| **ORM** | Prisma 7 (con driver adapter `@prisma/adapter-pg`) | Type-safe, migraciones versionadas, seed de datos |
| **Autenticación** | JWT (cookie httpOnly) + Next.js Proxy | Sesiones seguras del lado del servidor |
| **Autorización** | RBAC (control de acceso basado en roles) | 3 roles: ADMIN, VENDEDOR, CONTADOR con permisos granulares |
| **Gráficos** | Recharts | Dashboard y reportes visuales |
| **Pruebas** | Vitest 4 + Testing Library | 33 pruebas unitarias con cobertura de línea y ramas |
| **Calidad** | TypeScript estricto, ESLint 9, `tsc --noEmit`, `next build` | Cero errores de compilación, lint y build |

---

## 4. Objetivo General

Desarrollar un sistema ERP completo y funcional para pequeñas empresas utilizando metodología ágil, que permita gestionar ventas, inventario, finanzas y reportes en una sola plataforma web, con control de acceso por roles y un proceso de desarrollo documentado bajo Scrum.

### 4.1 Objetivos Específicos

1. Diseñar un modelo de datos relacional (16 entidades) que cubra las operaciones del negocio.
2. Implementar autenticación JWT con control de permisos por rol (RBAC).
3. Desarrollar módulos funcionales: POS de ventas, inventario, clientes, proveedores, empleados, gastos, facturas, compras, notificaciones, auditoría y reportes.
4. Proveer un dashboard ejecutivo con métricas de ventas, inventario y rendimiento.
5. Implementar reglas de negocio: ITBIS 18%, control de stock, numeración correlativa, devoluciones, pagos parciales de facturas.
6. Automatizar pruebas unitarias (33) y garantizar cero errores de lint, tipos y build.
7. Documentar el proceso ágil: cronograma, backlog, historias de usuario, sprints y plan de pruebas.

---

## 5. Alcance

### 5.1 Incluido (Etapa 4)

- **Autenticación y autorización**: login, logout, sesión JWT, 3 roles con permisos.
- **Dashboard**: métricas del día (ventas, ticket promedio, clientes, pedidos), gráfica de ventas de 7 días, productos con stock crítico.
- **Ventas (POS)**: carrito, búsqueda de productos, descuento, ITBIS automático, pago en efectivo/tarjeta/transferencia, devolución con reingreso de stock.
- **Inventario**: CRUD de productos y categorías, control de stock mínimo, ajuste de stock, sugerencia de compra (reposición), valorización al costo y al retail.
- **Clientes, Proveedores, Empleados**: CRUD completo con búsqueda y estadísticas.
- **Gastos**: registro y listado con filtros por rango de fechas y categorías.
- **Facturación**: facturas con estado, pagos parciales/totales (registro de pagos), cancelación.
- **Compras**: órdenes de compra, recepción (actualiza stock) y cancelación.
- **Reportes**: ventas por producto, por empleado, por cliente, rentabilidad y análisis de inventario, con exportación de datos.
- **Notificaciones**: stock crítico, proveedores pendientes y rendimiento (generadas automáticamente).
- **Auditoría**: registro de todas las operaciones sensibles (crear, actualizar, eliminar, pagar, recibir, cancelar).
- **Multitenencia**: soporte de múltiples empresas con cambio de empresa activa.
- **Datos de demostración**: seed con empresa "Urban Shoes", 3 usuarios, 10 productos, 14 ventas, facturas y órdenes de compra.

### 5.2 Excluido (Etapa 5 — fuera de alcance)

- Módulo de nómina (cálculo de salarios y pagos a empleados).
- Cuentas por pagar y por cobrar avanzadas con vencimientos automáticos.
- Importación/exportación masiva de datos.
- Aplicación móvil.

---

## 6. Cronograma del Proyecto

| Semana | Sprint | Actividades | Entregable |
|---|---|---|---|
| 1 | Sprint 0 | Configuración del proyecto (Next.js, Tailwind, Prisma, PostgreSQL en Docker), diseño del modelo de datos, planificación del backlog | Repositorio inicial + schema |
| 2 | Sprint 1 | Migración de BD, autenticación JWT + proxy, RBAC, seed de datos | Login funcional + seguridad |
| 3 | Sprint 2 | Módulo de ventas (POS) completo con devoluciones y reglas de negocio | Ventas operativas |
| 4 | Sprint 3 | Inventario (CRUD, stock mínimo, ajustes, recomendación) y catálogos (clientes, proveedores, empleados) | Gestión de catálogos |
| 5 | Sprint 4 | Gastos, facturación con pagos, órdenes de compra, notificaciones y auditoría | Finanzas y compras |
| 6 | Sprint 5 | Dashboard, reportes, multitenencia, refinamiento de UI | Panel ejecutivo |
| 7 | Sprint 6 | Pruebas automatizadas (33), corrección de errores, lint/typecheck/build, documentación final | Entrega final |

**Primer Release (Release 1)**: la totalidad del alcance de la Etapa 4 se entrega en un único release funcional al final del Sprint 6.

---

## 7. Roles del Equipo Scrum (simulados para el proyecto individual)

| Rol | Responsabilidad | Nombre |
|---|---|---|
| **Product Owner** | Define y prioriza el backlog, valida criterios de aceptación | [Estudiante] |
| **Scrum Master** | Facilita sprints, elimina impedimentos (ej.: bloqueo del tenant de Jira) | [Estudiante] |
| **Desarrollador** | Implementa historias, escribe pruebas, refactoriza | [Estudiante] |
| **QA** | Ejecuta el plan de pruebas y valida la definición de "Done" | [Estudiante] |

---

## 8. Product Backlog — Historias de Usuario

El backlog completo se entrega en dos formatos: esta guía (tabla resumida) y `docs/jira-backlog.csv` (compatible con importación a Jira Cloud).

Cada historia cumple: **formato de historia** ("Como... quiero... para..."), **criterios de aceptación** verificables y **story points** (Fibonacci: 1, 2, 3, 5, 8).

### Historia 1 — Autenticación de usuarios (8 pts)
**Como** usuario del sistema, **quiero** iniciar sesión con mi correo y contraseña, **para** acceder solo a las funciones que mi rol permite.

**Criterios de aceptación:**
- Dado un correo/contraseña válidos, cuando envío el formulario de login, entonces se crea una cookie httpOnly con el JWT y se redirige a `/dashboard`.
- Dado un correo o contraseña incorrectos, cuando envío el formulario, entonces se muestra el mensaje "Credenciales inválidas" sin redirigir.
- Dado un usuario no autenticado, cuando accedo a cualquier ruta protegida, entonces soy redirigido a `/login`.
- Dado un usuario autenticado, cuando hago clic en "Cerrar sesión", entonces la cookie se elimina y regreso a `/login`.
- La contraseña se almacena con hash bcrypt (nunca en texto plano).

### Historia 2 — Control de acceso por roles (RBAC) (5 pts)
**Como** administrador, **quiero** que cada rol tenga permisos específicos, **para** que vendedores y contadores no accedan a funciones que no les corresponden.

**Criterios de aceptación:**
- ADMIN accede a todos los módulos, incluidos auditoría, usuarios y empresas.
- VENDEDOR puede ver y crear ventas, ver inventario y clientes; **no** puede ver reportes, gastos, facturas ni auditoría.
- CONTADOR puede gestionar gastos y facturas, ver reportes e inventario; **no** puede gestionar inventario ni ver auditoría.
- Cuando un usuario sin permiso llama a una API, la respuesta es `403 Forbidden`.
- El menú lateral solo muestra las opciones permitidas para el rol.

### Historia 3 — POS de ventas con ITBIS (8 pts)
**Como** vendedor, **quiero** registrar ventas con un punto de venta rápido, **para** cobrar a los clientes de forma ágil y correcta.

**Criterios de aceptación:**
- Puedo agregar productos al carrito desde una lista buscable por nombre o SKU.
- Puedo aplicar un descuento global; el ITBIS (18%) se calcula sobre el subtotal menos el descuento.
- El total se redondea a 2 decimales y se muestra en formato RD$.
- Al confirmar, se genera la venta con número correlativo por empresa (V-0001, V-0002, …).
- El stock de cada producto disminuye automáticamente dentro de una transacción.
- No se permite vender más unidades de las disponibles (error "Stock insuficiente").
- Si un producto queda bajo su stock mínimo, se crea una notificación de stock crítico.

### Historia 4 — Devoluciones de ventas (3 pts)
**Como** vendedor, **quiero** devolver una venta completada, **para** revertir la operación cuando el cliente devuelve mercancía.

**Criterios de aceptación:**
- Solo se pueden devolver ventas en estado COMPLETADA.
- Al devolver, el stock de cada producto se incrementa y la venta pasa a estado DEVUELTA.
- Intentar devolver dos veces la misma venta muestra el error "La venta ya fue devuelta".

### Historia 5 — Gestión de inventario con stock mínimo (8 pts)
**Como** administrador, **quiero** administrar productos, categorías y niveles de stock, **para** no quedarme sin mercancía ni sobrecomprar.

**Criterios de aceptación:**
- CRUD de productos: nombre, SKU único, precios de compra/venta, stock, stock mínimo, categoría y proveedor.
- CRUD de categorías.
- El SKU no puede duplicarse (ni al crear ni al editar).
- Un producto con ventas registradas **no** puede eliminarse (integridad referencial).
- El módulo lista primero los productos con stock ≤ mínimo (filtro "stock bajo").
- El ajuste de stock no puede dejar el inventario en negativo y dispara notificación si queda bajo el mínimo.
- Se muestra la valorización del inventario al costo y al precio de venta.

### Historia 6 — Sugerencia de compra (reposición) (3 pts)
**Como** administrador, **quiero** saber cuántas unidades comprar de cada producto, **para** mantener cobertura de 14 días.

**Criterios de aceptación:**
- La sugerencia se calcula con la venta promedio de los últimos 30 días × 14 días menos el stock actual.
- Si el producto tiene cobertura suficiente, la sugerencia es 0.
- Si no hay ventas registradas pero el stock es bajo, se sugiere 2× el stock mínimo.

### Historia 7 — Catálogo de clientes (5 pts)
**Como** vendedor, **quiero** gestionar clientes, **para** registrar sus compras y conocer a los más valiosos.

**Criterios de aceptación:**
- CRUD de clientes (nombre, email, teléfono, RNC/RIF, dirección).
- Búsqueda por nombre, email o documento.
- La vista de detalle muestra total gastado, cantidad de compras, última compra y producto favorito.
- El reporte "Top clientes" ordena por monto total gastado (las 10 primeras posiciones).

### Historia 8 — Catálogo de proveedores y empleados (5 pts)
**Como** administrador, **quiero** gestionar proveedores y empleados, **para** mantener actualizados los datos de mis aliados comerciales y de mi equipo.

**Criterios de aceptación:**
- CRUD de proveedores (nombre, RNC, teléfono, email, dirección) con búsqueda.
- CRUD de empleados (nombre, email, teléfono, cargo, fecha de contratación, salario) con búsqueda.
- No se puede eliminar un proveedor con órdenes de compra asociadas ni un empleado con ventas asociadas.

### Historia 9 — Registro de gastos (3 pts)
**Como** contador, **quiero** registrar los gastos del negocio, **para** tener control de los egresos.

**Criterios de aceptación:**
- Creación de gastos con concepto, monto, fecha, categoría y método de pago.
- Listado con filtros por rango de fechas y categoría.
- Edición y eliminación de gastos propios de la empresa activa.

### Historia 10 — Facturación con pagos (5 pts)
**Como** contador, **quiero** emitir facturas y registrar sus pagos, **para** controlar las cuentas por cobrar.

**Criterios de aceptación:**
- Creación de facturas con número correlativo (F-0001…), cliente, subtotal, ITBIS y total.
- Estados: PENDIENTE → PARCIAL → PAGADA, y CANCELADA.
- Registro de pagos parciales o totales con método de pago; la factura se marca PAGADA cuando la suma de pagos ≥ total.
- No se permiten pagos que excedan el saldo pendiente.
- La cancelación solo aplica a facturas sin pagos (o se permite y se valida el saldo).

### Historia 11 — Órdenes de compra (5 pts)
**Como** administrador, **quiero** crear órdenes de compra y recibirlas, **para** reponer el inventario de forma controlada.

**Criterios de aceptación:**
- Creación de órdenes con proveedor, ítems (producto + cantidad) y total calculado.
- Número correlativo (OC-0001…), estados PENDIENTE, RECIBIDA, CANCELADA.
- Al recibir una orden, el stock de cada producto aumenta y el estado pasa a RECIBIDA.
- No se puede recibir ni cancelar una orden ya recibida o cancelada.
- Todo el proceso queda registrado en auditoría.

### Historia 12 — Dashboard ejecutivo (5 pts)
**Como** administrador, **quiero** ver en una sola pantalla las métricas del negocio, **para** tomar decisiones rápidas.

**Criterios de aceptación:**
- Muestra: ventas de hoy, ticket promedio del día, clientes nuevos del día y pedidos del día.
- Gráfica de ventas (monto y cantidad) de los últimos 7 días.
- Lista de productos con stock crítico.
- Se requiere permiso `dashboard.view` (todos los roles lo tienen).

### Historia 13 — Reportes (5 pts)
**Como** contador, **quiero** consultar reportes de ventas y rentabilidad, **para** analizar el desempeño del negocio.

**Criterios de aceptación:**
- Reportes: ventas por producto, ventas por empleado, top clientes, rentabilidad por producto y análisis de inventario.
- Filtros por rango de fechas (desde/hasta).
- Los montos son consistentes con las ventas registradas (total y cantidad).
- La respuesta de la API incluye solo ventas COMPLETADAS.

### Historia 14 — Notificaciones automáticas (3 pts)
**Como** administrador, **quiero** recibir notificaciones del sistema, **para** actuar a tiempo sobre stock crítico y proveedores.

**Criterios de aceptación:**
- Se generan automáticamente al: vender/ajustar stock bajo el mínimo (STOCK_CRITICO), existir órdenes pendientes con proveedor (PROVEEDOR_PENDIENTE) y por rendimiento (RENDIMIENTO).
- El campanario muestra la cantidad de notificaciones no leídas y se actualiza cada minuto.
- Marcar como leídas las notificaciones individualmente o todas.

### Historia 15 — Auditoría de operaciones (3 pts)
**Como** administrador, **quiero** ver el historial de operaciones sensibles, **para** supervisar el uso del sistema.

**Criterios de aceptación:**
- Cada crear/actualizar/eliminar/pagar/recibir/cancelar registra: usuario, empresa, acción, entidad, entidad afectada y detalles.
- La vista de auditoría lista los registros ordenados por fecha (recientes primero).
- Solo el rol ADMIN tiene acceso.

---

## 9. Criterios de Aceptación del Release (Definición de "Done")

- [x] Todas las historias del backlog implementadas y verificadas manualmente.
- [x] 33 pruebas automatizadas en verde (`npm test`).
- [x] Cero errores y cero warnings de ESLint (`eslint src`).
- [x] Cero errores de TypeScript (`tsc --noEmit`).
- [x] Build de producción exitoso (`next build`).
- [x] Datos de demostración cargados (seed) y accesibles con los 3 roles.
- [x] Guía completa y backlog documentados.

---

## 10. Plan de Pruebas

### 10.1 Estrategia

Se combinan pruebas **unitarias automatizadas** (Vitest, ejecutables con `npm test`) y **pruebas manuales de aceptación** (flujos críticos con datos reales del seed). La cobertura mínima exigida por el proyecto: 70% líneas, 70% funciones, 60% ramas y 70% sentencias (verificada con `npm run test:coverage`).

### 10.2 Pruebas automatizadas (33)

| Archivo | Prueba | Verifica |
|---|---|---|
| `src/lib/utils.test.ts` (5) | Redondeo a 2 decimales | `round2` correcto (incluye casos límite) |
| `src/lib/utils.test.ts` | Totales con ITBIS 18% | `computeTotals` base |
| `src/lib/utils.test.ts` | Descuento antes del ITBIS | Aplica descuento al subtotal gravable |
| `src/lib/utils.test.ts` | Total nunca negativo | Descuento > subtotal protege el total |
| `src/lib/utils.test.ts` | Formato RD$ | `formatMoney` con separadores y moneda |
| `src/lib/permissions.test.ts` (4) | ADMIN todo | Todos los permisos disponibles |
| `src/lib/permissions.test.ts` | VENDEDOR limitado | Sin reportes/auditoría/gastos |
| `src/lib/permissions.test.ts` | CONTADOR limitado | Sin inventario/auditoría; con reportes |
| `src/lib/permissions.test.ts` | `canAny` | Al menos un permiso requerido |
| `src/services/sales.service.test.ts` (9) | Numeración correlativa | 1 sin ventas; incrementa con últimas |
| `src/services/sales.service.test.ts` | Producto inexistente | Error "no existen" |
| `src/services/sales.service.test.ts` | Stock insuficiente | Error de stock |
| `src/services/sales.service.test.ts` | Venta en transacción | Número, subtotal, ITBIS, total y decremento de stock |
| `src/services/sales.service.test.ts` | Notificación stock crítico | Se crea al quedar bajo el mínimo |
| `src/services/sales.service.test.ts` | Devolución | Reingreso de stock y estado DEVUELTA |
| `src/services/sales.service.test.ts` | Doble devolución | Error "ya fue devuelta" |
| `src/services/sales.service.test.ts` | Listado y detalle | Límites, includes y error si no existe |
| `src/services/sales.service.test.ts` | Ventas por empleado | Agrupación con nombre |
| `src/services/products.service.test.ts` (11) | SKU duplicado | Error al crear y al editar |
| `src/services/products.service.test.ts` | Creación exitosa | Persiste con empresa |
| `src/services/products.service.test.ts` | Producto de otra empresa | Error "no encontrado" |
| `src/services/products.service.test.ts` | Eliminar con ventas | Error de integridad |
| `src/services/products.service.test.ts` | Eliminar sin ventas | Éxito |
| `src/services/products.service.test.ts` | Stock bajo | Filtrado correcto (incluye límite exacto) |
| `src/services/products.service.test.ts` | Ajuste negativo | Error si deja stock negativo |
| `src/services/products.service.test.ts` | Ajuste + notificación | Notificación bajo mínimo |
| `src/services/products.service.test.ts` | Recomendación con ventas | Promedio diario y sugerencia a 14 días |
| `src/services/products.service.test.ts` | Recomendación con cobertura | Sugerencia 0 |
| `src/services/products.service.test.ts` | Recomendación sin ventas | Sugerencia 2× mínimo |
| `src/services/products.service.test.ts` | Valorización | Costo y retail |

### 10.3 Pruebas manuales de aceptación (flujos críticos)

| # | Caso | Pasos | Resultado esperado |
|---|---|---|---|
| M1 | Login válido | `admin@urban-shoes.com` / `Admin123!` | Redirige a /dashboard con menú completo |
| M2 | Login inválido | Cualquier otro par | "Credenciales inválidas", sin redirigir |
| M3 | Acceso sin sesión | Abrir `/ventas` sin cookie | Redirige a /login |
| M4 | Venta completa | POS → agregar 2 Nike Air Max → confirmar | Venta V-0001, stock −2, total con ITBIS |
| M5 | Venta sin stock | Intentar vender 99 unidades | Error "Stock insuficiente" |
| M6 | Devolución | Devolver la venta M4 | Stock +2, estado DEVUELTA |
| M7 | Producto duplicado | Crear producto con SKU existente | Error de SKU |
| M8 | Stock crítico | Ajustar stock de un producto a 1 | Notificación STOCK_CRITICO creada |
| M9 | Recomendación | Abrir sugerencia de "Nike Air Max" | Cantidad sugerida para 14 días |
| M10 | Factura + pago | Crear factura, pagar 50%, pagar resto | Estados PENDIENTE → PARCIAL → PAGADA |
| M11 | Orden de compra | Crear OC y recibirla | Stock incrementado, estado RECIBIDA |
| M12 | Reporte | Reporte ventas por producto con rango | Totales consistentes con ventas |
| M13 | Roles | Login como `carlos@urban-shoes.com` | Menú sin gastos/reportes/auditoría; API 403 |
| M14 | Auditoría | Revisar /configuracion como ADMIN | Operaciones recientes listadas |

### 10.4 Plan de Automatización de Pruebas

1. `npm install` — instala dependencias (incluye Vitest y Testing Library).
2. `npm test` — ejecuta las 33 pruebas unitarias (modo CI, sin watch).
3. `npm run test:coverage` — ejecuta las pruebas y genera el reporte de cobertura en `coverage/` (umbrales mínimos configurados en `vitest.config.ts`).
4. `npx tsc --noEmit` — valida tipos en todo el proyecto.
5. `npx eslint src --max-warnings 0` — valida estilo y reglas de React/Next.
6. `npm run build` — genera el build de producción (requiere Docker/PostgreSQL para el prerenderizado de rutas dinámicas).

---

## 11. Arquitectura del Proyecto

```
microerp/
├── prisma/
│   ├── schema.prisma          # 16 modelos + 5 enums
│   ├── migrations/            # migraciones versionadas
│   └── seed.ts                # datos demo (Urban Shoes)
├── prisma.config.ts           # config Prisma 7 (driver pg + seed tsx)
├── src/
│   ├── proxy.ts               # guard de autenticación (Next 16)
│   ├── lib/
│   │   ├── auth.ts            # JWT, createSessionToken, getSession
│   │   ├── permissions.ts     # matriz RBAC (ADMIN/VENDEDOR/CONTADOR)
│   │   ├── validators.ts      # zod: schemas de todas las entidades
│   │   ├── utils.ts           # ITBIS, round2, formatMoney, fechas
│   │   ├── api-helpers.ts     # requirePermission, respuestas de error
│   │   └── prisma.ts          # cliente Prisma con adapter pg
│   ├── services/              # lógica de negocio por módulo
│   │   ├── sales.service.ts   # ventas + devoluciones + transacciones
│   │   ├── products.service.ts# productos, stock, recomendación
│   │   ├── customers.service.ts, suppliers.service.ts, employees.service.ts
│   │   ├── expenses.service.ts, invoices.service.ts, purchase-orders.service.ts
│   │   ├── dashboard.service.ts, reports.service.ts
│   │   ├── notifications.service.ts, audit.service.ts, companies.service.ts
│   ├── app/
│   │   ├── login/page.tsx            # pantalla de inicio de sesión
│   │   ├── (app)/                    # layout autenticado + sidebar por permisos
│   │   │   ├── dashboard/            # métricas + gráfica 7 días + stock crítico
│   │   │   ├── ventas/               # POS con carrito y devoluciones
│   │   │   ├── inventario/           # productos, categorías, ajustes, recomendación
│   │   │   ├── clientes/, proveedores/, empleados/, gastos/
│   │   │   ├── facturas/             # pagos y cancelación
│   │   │   ├── compras/              # órdenes de compra
│   │   │   ├── reportes/             # 5 reportes con filtros
│   │   │   └── configuracion/        # auditoría
│   │   └── api/                      # 20 rutas REST (ver sección 12)
│   └── components/                   # Sidebar, NotificationBell, StatCard, SalesChart, CrudTable
```

---

## 12. API REST

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Inicia sesión (JWT en cookie) |
| POST | `/api/auth/logout` | autenticado | Cierra sesión |
| GET | `/api/auth/me` | autenticado | Datos de la sesión actual |
| GET/POST | `/api/sales` | sales.view / sales.create | Lista / crea ventas |
| GET | `/api/sales/[id]` | sales.view | Detalle de venta |
| POST | `/api/sales/[id]/refund` | sales.refund | Devuelve una venta |
| GET/POST/PUT/DELETE | `/api/products` | inventory.view / inventory.manage | CRUD + filtros `low` y `recommendation` |
| GET/POST/PUT/DELETE | `/api/categories` | inventory.view / inventory.manage | CRUD categorías |
| GET/POST/PUT/DELETE | `/api/customers` | customers.view / customers.manage | CRUD + `stats` |
| GET/POST/PUT/DELETE | `/api/suppliers` | suppliers.view / suppliers.manage | CRUD proveedores |
| GET/POST/PUT/DELETE | `/api/employees` | employees.view / employees.manage | CRUD empleados |
| GET/POST/PUT/DELETE | `/api/expenses` | expenses.view / expenses.manage | CRUD + filtros de fechas |
| GET/POST/PUT/DELETE | `/api/invoices` | invoices.view / invoices.manage | CRUD facturas |
| POST | `/api/invoices/[id]/pay` | invoices.manage | Registra pago parcial/total |
| GET/POST | `/api/purchase-orders` | suppliers.view / inventory.manage | Lista / crea OC |
| POST | `/api/purchase-orders/[id]` | inventory.manage | Recibe (action=receive) o cancela |
| GET | `/api/reports?type=&from=&to=` | reports.view | 5 reportes |
| GET | `/api/dashboard` | dashboard.view | Métricas ejecutivas |
| GET/POST/PUT/DELETE | `/api/notifications` | autenticado | Lista, crea, marca leídas |
| GET/POST/PUT | `/api/companies` | companies.manage | Multitenencia |
| POST | `/api/companies/[id]/switch` | companies.manage | Cambia empresa activa |
| GET | `/api/audit` | audit.view | Registros de auditoría |

---

## 13. Reglas de Negocio Implementadas

1. **ITBIS 18%** sobre (subtotal − descuento); redondeo a 2 decimales.
2. **Numeración correlativa por empresa**: ventas `V-####`, facturas `F-####`, órdenes de compra `OC-####`.
3. **Stock nunca negativo**: validado en venta, devolución y ajustes.
4. **SKU único** por empresa.
5. **Integridad referencial**: no se elimina producto con ventas, proveedor con órdenes, empleado con ventas.
6. **Pagos de factura** no pueden exceder el saldo pendiente; PAGADA al cubrir el total.
7. **Devoluciones** solo sobre ventas COMPLETADAS y una única vez.
8. **Notificaciones automáticas** por eventos de negocio.
9. **Auditoría** de toda operación sensible con usuario y empresa.
10. **Multitenencia**: cada operación se ejecuta dentro de la empresa activa de la sesión.

---

## 14. Instalación y Ejecución (paso a paso)

### Requisitos previos
- Node.js 20+ (proyecto probado con Node 22 y Next.js 16.3.1)
- Docker Desktop (para PostgreSQL) o un PostgreSQL 16 accesible
- Git

### Pasos

```bash
# 1. Clonar y entrar al proyecto
git clone <url-del-repositorio> ProyectoERP
cd ProyectoERP/microerp

# 2. Instalar dependencias
npm install

# 3. Levantar PostgreSQL con Docker (o usar uno existente)
docker run -d --name microerp-postgres \
  -e POSTGRES_USER=microerp -e POSTGRES_PASSWORD=microerp \
  -e POSTGRES_DB=microerp -p 5433:5432 postgres:16

# 4. Configurar variables de entorno (copiar .env.example a .env)
#    DATABASE_URL="postgresql://microerp:microerp@localhost:5433/microerp"
#    JWT_SECRET="<clave-secreta-larga>"

# 5. Aplicar migraciones y cargar datos demo
npx prisma migrate deploy
npx prisma db seed

# 6. Ejecutar en modo desarrollo
npm run dev        # → http://localhost:3000
```

### Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@urban-shoes.com` | `Admin123!` |
| Vendedor | `carlos@urban-shoes.com` | `Vendedor123!` |
| Contador | `maria@urban-shoes.com` | `Contador123!` |

---

## 15. Retrospectiva y Lecciones Aprendidas

**Lo que funcionó**
- Next.js App Router con Server Components simplificó el desarrollo del frontend y la API en un solo proyecto.
- Prisma con migraciones versionadas y seed hizo reproducible la base de datos.
- El RBAC centralizado (`permissions.ts`) permitió proteger páginas y APIs con una sola función.
- Las transacciones de Prisma (`$transaction`) garantizaron la consistencia de ventas, devoluciones y recepción de órdenes.

**Impedimentos y soluciones**
- **Tenant de Jira suspendido (403 "suspended-payment")**: se sustituyó la sincronización en vivo por el backlog documentado en esta guía y el archivo `docs/jira-backlog.csv` (importable a cualquier Jira Cloud).
- **Prisma 7 requiere driver adapter**: se integró `@prisma/adapter-pg` en cliente y seed.
- **`next lint` deprecado en Next 16**: se usa ESLint 9 directamente (`npx eslint src`).
- **Regla `react-hooks/set-state-in-effect` (React Compiler)**: genera falsos positivos con el patrón estándar de data fetching; se documentó y desactivó con justificación en `eslint.config.mjs`.

---

## 16. Entregables

| Entregable | Ubicación |
|---|---|
| Código fuente completo (frontend + backend) | `microerp/` |
| Guía completa y detallada | `docs/GUIA_COMPLETA.md` |
| Backlog de historias de usuario (CSV para Jira) | `docs/jira-backlog.csv` |
| Modelo de datos | `microerp/prisma/schema.prisma` |
| Datos de demostración | `microerp/prisma/seed.ts` |
| Pruebas automatizadas (33) | `microerp/src/**/*.test.ts` |
| Configuración de cobertura | `microerp/vitest.config.ts` |
| README con instrucciones | `microerp/README.md` |