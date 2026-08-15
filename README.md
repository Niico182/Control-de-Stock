# Control de Stock

Plataforma SaaS multi-empresa para gestionar inventario, ventas y alquileres.

## Características

- Multi-tenant con roles: superusuario, admin de empresa y empleados
- Productos con ID único, precio y stock (disponible, reservado, alquilado)
- Ventas con estados: preventa, completada y cancelada
- Alquileres con devolución, faltantes, historial y exportación PDF
- Reportes de ganancias mensuales
- Landing pública con SEO básico

## Stack

- Next.js 16 + TypeScript
- PostgreSQL + Prisma
- Auth.js (NextAuth v5)
- Tailwind CSS

## Requisitos

- Node.js 20+
- Docker (opcional, recomendado para PostgreSQL en producción)

## Instalación

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
copy .env.example .env
```

3. Ejecutar migraciones y seed (usa SQLite local por defecto):

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Para PostgreSQL en producción, cambiá `provider` en `prisma/schema.prisma` a `postgresql`, actualizá `DATABASE_URL` y usá `docker compose up -d`.

5. Iniciar la app:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Credenciales iniciales

Superusuario creado por seed:

- Email: `superadmin@controlstock.app`
- Password: `SuperAdmin123!`

Desde el panel superadmin podés crear empresas y admins.

## Scripts útiles

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run db:migrate` — migraciones
- `npm run db:seed` — datos iniciales
- `npm run db:studio` — Prisma Studio

## Seguridad

- Aislamiento por `companyId` en todas las operaciones
- RBAC con permisos delegables
- Panel autenticado con `noindex`
- Contraseñas hasheadas con bcrypt

## Despliegue

Recomendado: Vercel + Neon/Supabase PostgreSQL.

Variables requeridas:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
