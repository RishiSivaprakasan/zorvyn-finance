# Finance Dashboard Backend

## Tech
- Node.js + Express (TypeScript)
- PostgreSQL + Prisma
- JWT auth + RBAC (Viewer/Analyst/Admin)

## Setup
1. Create `backend/.env` from `.env.example` and fill `DATABASE_URL` and `JWT_SECRET`.
2. Install dependencies:
   - `npm install`
3. Run migrations + generate Prisma client:
   - `npm run prisma:migrate`
4. Seed dummy data (optional but recommended):
   - `npx prisma db seed`
5. Start dev server:
   - `npm run dev`

## API
Base URL: `/api`

### Auth
- **POST** `/auth/register`
- **POST** `/auth/login`
- **GET** `/auth/me`

### Users (Admin only)
- **POST** `/users`
- **GET** `/users`
- **GET** `/users/:id`
- **PATCH** `/users/:id`
- **POST** `/users/:id/deactivate`

### Financial Records
- **GET** `/records` (Analyst/Admin)
- **GET** `/records/:id` (Analyst/Admin)
- **POST** `/records` (Admin)
- **PATCH** `/records/:id` (Admin)
- **DELETE** `/records/:id` (Admin, soft delete)

### Dashboard
- **GET** `/dashboard/summary` (Viewer/Analyst/Admin)
- **GET** `/dashboard/category-totals?type=INCOME|EXPENSE` (Viewer/Analyst/Admin)
- **GET** `/dashboard/recent?limit=10` (Viewer/Analyst/Admin)
- **GET** `/dashboard/trends/monthly?months=6` (Viewer/Analyst/Admin)

## Role behavior
- **Viewer**
  - Can read dashboard endpoints
- **Analyst**
  - Can read dashboard endpoints
  - Can list/get financial records
- **Admin**
  - Full access to records
  - User management
  - Dashboard access

## Notes
- The first registered user is automatically bootstrapped as `ADMIN` (to avoid manual seeding).

## Seeded dummy users
The seed script creates a few users so you can quickly test RBAC and dashboard aggregation:
- `admin@zorvyn.local` (ADMIN)
- `analyst@zorvyn.local` (ANALYST)
- `viewer@zorvyn.local` (VIEWER)
- `inactive@zorvyn.local` (VIEWER, INACTIVE)

Password for all seeded users: `Password123!`
