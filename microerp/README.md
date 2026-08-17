# MicroERP

Sistema ERP para pequeñas empresas — **Programación III (ITLA)** · Next.js 16 + PostgreSQL + Prisma 7.

Cubre ventas (POS), inventario, clientes, proveedores, empleados, gastos, facturación, órdenes de compra, reportes, dashboard, notificaciones y auditoría, con autenticación JWT y control de acceso por roles (ADMIN, VENDEDOR, CONTADOR).

> Documentación completa del proyecto: [`../docs/GUIA_COMPLETA.md`](../docs/GUIA_COMPLETA.md) · Backlog de historias (CSV): [`../docs/jira-backlog.csv`](../docs/jira-backlog.csv) · Flujo de trabajo (GitFlow): [`../docs/GITFLOW.md`](../docs/GITFLOW.md)

## Requisitos

- Node.js 20+
- Docker (para PostgreSQL) o PostgreSQL 16 accesible

## Instalación

```bash
npm install

# PostgreSQL con Docker (puerto 5433)
docker run -d --name microerp-postgres \
  -e POSTGRES_USER=microerp -e POSTGRES_PASSWORD=microerp \
  -e POSTGRES_DB=microerp -p 5433:5432 postgres:16
```

Crear `.env` a partir de `.env.example`:

```env
DATABASE_URL="postgresql://microerp:microerp@localhost:5433/microerp"
JWT_SECRET="cambia-esta-clave-por-una-larga-y-secreta"
```

Aplicar migraciones y cargar datos demo:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Ejecución

```bash
npm run dev        # desarrollo → http://localhost:3000
npm run build      # build de producción
npm start          # servidor de producción
```

## Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@urban-shoes.com` | `Admin123!` |
| Vendedor | `carlos@urban-shoes.com` | `Vendedor123!` |
| Contador | `maria@urban-shoes.com` | `Contador123!` |

## Calidad

```bash
npm test                     # 33 pruebas unitarias (Vitest)
npm run test:coverage        # reporte de cobertura (mínimos en vitest.config.ts)
npx tsc --noEmit             # tipos: sin errores
npx eslint src --max-warnings 0   # lint: sin errores ni warnings
npm run build                # build de producción exitoso
```

## Estructura

```
prisma/          schema + migraciones + seed (Urban Shoes)
src/proxy.ts     guard de autenticación (Next 16)
src/lib/         auth (JWT), permisos RBAC, validadores (zod), utils, prisma
src/services/    lógica de negocio por módulo
src/app/api/     20 rutas REST protegidas por permiso
src/app/         login + módulos (dashboard, ventas, inventario, catálogos,
                 gastos, facturas, compras, reportes, configuración)
src/components/  Sidebar, NotificationBell, StatCard, SalesChart, CrudTable
```