# Sistema de Intercambio de Comisiones

Sistema universitario que permite a alumnos solicitar cambios de comisión y a profesores gestionar sus cursos. Desarrollado como proyecto académico de Ingeniería de Software II.

---

## Estado del proyecto

| Capa | Estado | Descripción |
|------|--------|-------------|
| **Backend** | ✅ Operativo | NestJS 11 + Prisma 7 + Supabase Auth |
| **Frontend** | ✅ Operativo | Next.js 16 + React 19 + Tailwind v4 |
| **Auth** | ✅ Operativo | Supabase Auth con sesión persistente y rutas por rol |
| **Mensajería** | ✅ Operativo | Chat en tiempo real vía Supabase Realtime |
| **Gestión de comisiones** | ✅ Operativo | CRUD de alumnos, horarios y eventos por parte del profesor |
| **Intercambios** | 🔄 En desarrollo | Matching entre alumnos para cambio de comisión |

---

## Stack tecnológico

### Backend — `apps/api`

| Tecnología | Versión | Uso |
|---|---|---|
| NestJS | 11 | Framework principal |
| Prisma | 7 | ORM + migraciones |
| PostgreSQL | — | Base de datos (via Supabase) |
| `@prisma/adapter-pg` | 7 | Conexión directa con pg |
| Supabase Auth | — | Autenticación JWT (JWKS) |
| `jose` | 6 | Verificación JWT en AuthGuard |
| Swagger | 11 | Documentación de API (`/api/docs`) |
| `class-validator` | — | Validación de DTOs |
| Jest | 30 | Testing unitario y e2e |

### Frontend — `apps/frontend`

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16 | Framework React (App Router) |
| React | 19 | UI |
| Tailwind CSS | v4 | Estilos |
| `@supabase/ssr` | 0.10 | Supabase con SSR (cookies) |
| `@supabase/supabase-js` | 2 | Realtime, Auth, queries |

---

## Estructura del monorepo

```
matching-comisiones/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # AuthGuard JWKS + /auth/me
│   │   │   │   ├── comisiones/ # CRUD comisiones, alumnos, horarios, eventos
│   │   │   │   ├── intercambios/  # Solicitudes de cambio de comisión
│   │   │   │   ├── mensajes/   # Mensajería
│   │   │   │   ├── usuarios/   # CRUD usuarios, búsqueda por DNI
│   │   │   │   ├── profesores/ # Módulo profesor
│   │   │   │   ├── academico/  # Materias, carreras
│   │   │   │   └── notificaciones/
│   │   │   ├── common/         # Filtros globales, pipes, guards
│   │   │   └── prisma/         # PrismaService
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── seed.ts
│   │       └── migrations/
│   └── frontend/               # Frontend Next.js (App Router)
│       ├── src/app/
│       │   ├── (principal)/    # Rutas autenticadas
│       │   │   ├── comision/   # Vista alumno de su comisión
│       │   │   ├── calendario/ # Calendario del alumno
│       │   │   ├── mensajes/   # Mensajería
│       │   │   ├── perfil/     # Perfil de usuario
│       │   │   └── profesor/   # Vista y gestión del profesor
│       │   │       └── [id_comision]/  # Gestión detallada de comisión
│       │   └── login/
│       ├── componentes/        # Componentes reutilizables
│       ├── servicios/          # Capa de servicios (API client)
│       └── tipos/              # Tipos TypeScript compartidos
└── docs/                       # Documentación académica
```

---

## Levantar el proyecto

### Requisitos

- Node.js 20+
- Una instancia de [Supabase](https://supabase.com) (project URL + anon key + service key)

### Backend

```bash
cd apps/api

# Variables de entorno
cp .env.example .env   # Completar con credenciales de Supabase

# Instalar dependencias
npm install

# Sincronizar schema con la base de datos
npx prisma migrate deploy

# Seed inicial (crea materias, comisiones, usuarios de prueba)
npm run db:seed

# Desarrollo
npm run start:dev
```

La API queda disponible en `http://localhost:3000`.  
Swagger en `http://localhost:3000/api/docs`.

### Frontend

```bash
cd apps/frontend

# Variables de entorno
cp env.local.example .env.local   # Completar con URL y anon key de Supabase

# Instalar dependencias
npm install

# Desarrollo
npm run dev
```

El frontend queda disponible en `http://localhost:3001`.

---

## Usuarios de prueba (seed)

| Rol | DNI | Contraseña |
|-----|-----|------------|
| Profesor | — | Ver seed.ts |
| Alumno | 40000001 – 40000008 | Ver seed.ts |

---

## Módulos implementados

### Gestión de comisión (Profesor)
- Agregar y dar de baja alumnos (con confirmación)
- Reincorporar alumnos dados de baja
- Agregar, editar y dar de baja horarios semanales recurrentes
- Agregar, editar y dar de baja eventos del calendario
- Visualización en calendario cuadriculado filtrable

### Vista del alumno
- Vista de su comisión activa con calendario
- Mensajería en tiempo real con su comisión

### Mensajería
- Chat por comisión con Supabase Realtime
- Badges de rol (Profesor / Alumno)
- Indicador de mensajes no leídos
- Notificaciones para conversaciones no activas

### Auth
- Login con Supabase Auth
- Sesión persistente con cookies (SSR-safe)
- Redirección automática según rol al iniciar sesión
- Protección de rutas por rol (alumno / profesor)



**Materia**: Ingeniería de Software II  
**Año**: 2025
