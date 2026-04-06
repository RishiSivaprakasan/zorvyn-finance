/// <reference types="node" />

import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zorvyn.local' },
    create: {
      email: 'admin@zorvyn.local',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    update: {
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@zorvyn.local' },
    create: {
      email: 'analyst@zorvyn.local',
      name: 'Analyst',
      passwordHash,
      role: 'ANALYST',
      status: 'ACTIVE',
    },
    update: {
      name: 'Analyst',
      passwordHash,
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@zorvyn.local' },
    create: {
      email: 'viewer@zorvyn.local',
      name: 'Viewer',
      passwordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
    update: {
      name: 'Viewer',
      passwordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'inactive@zorvyn.local' },
    create: {
      email: 'inactive@zorvyn.local',
      name: 'Inactive User',
      passwordHash,
      role: 'VIEWER',
      status: 'INACTIVE',
    },
    update: {
      name: 'Inactive User',
      passwordHash,
      role: 'VIEWER',
      status: 'INACTIVE',
    },
  });

  const seededUserIds = [admin.id, analyst.id, viewer.id];

  await prisma.financialRecord.deleteMany({
    where: { userId: { in: seededUserIds } },
  });

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const monthsAgo = (n: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - n);
    return d;
  };
  const atNoon = (d: Date) => {
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    return x;
  };

  const pick = <T,>(arr: T[], idx: number) => arr[idx % arr.length];
  const asMoney = (n: number) => new Prisma.Decimal(n.toFixed(2));
  const makeMonthDate = (monthsBack: number, day: number) => {
    const d = monthsAgo(monthsBack);
    d.setDate(day);
    return atNoon(d);
  };

  const expenseCategories = ['Transport', 'Dining'];

  const records: Array<Prisma.FinancialRecordCreateManyInput> = [];

  // Generate ~18 months of data, around 60-90 records total.
  // Pattern: admin gets monthly salary + a few expenses; analyst gets freelance + expenses; viewer gets light spending.
  const monthsToGenerate = 16;

  for (let m = 0; m < monthsToGenerate; m++) {
    // Admin income (salary)
    records.push({
      userId: admin.id,
      amount: asMoney(5200 + (m % 3) * 50),
      type: 'INCOME',
      category: 'Salary',
      date: makeMonthDate(m, 1),
      notes: 'Monthly salary',
    });

    // Admin expenses (2 per month)
    for (let i = 0; i < 2; i++) {
      const idx = m * 7 + i;
      const cat = pick(expenseCategories, idx);
      const base = 25 + (idx % 10) * 7;
      records.push({
        userId: admin.id,
        amount: asMoney(base + (cat === 'Utilities' ? 60 : 0)),
        type: 'EXPENSE',
        category: cat,
        date: makeMonthDate(m, 5 + i * 9),
        notes: null,
      });
    }

    // Analyst income (freelance every month, sometimes extra)
    const analystIncomeCount = m % 4 === 0 ? 2 : 1;
    for (let i = 0; i < analystIncomeCount; i++) {
      const idx = m * 11 + i;
      records.push({
        userId: analyst.id,
        amount: asMoney(180 + (idx % 8) * 35),
        type: 'INCOME',
        category: 'Freelance',
        date: makeMonthDate(m, 8 + i * 10),
        notes: 'Invoice paid',
      });
    }

    // Analyst expenses (1 per month)
    {
      const idx = m * 13;
      const cat = pick(expenseCategories, idx);
      records.push({
        userId: analyst.id,
        amount: asMoney(30 + (idx % 10) * 6),
        type: 'EXPENSE',
        category: cat,
        date: makeMonthDate(m, 18),
        notes: null,
      });
    }

    // Viewer expenses (0-1 per month)
    if (m % 2 === 0) {
      const idx = m * 5;
      const cat = pick(expenseCategories, idx);
      records.push({
        userId: viewer.id,
        amount: asMoney(8 + (idx % 7) * 3.25),
        type: 'EXPENSE',
        category: cat,
        date: makeMonthDate(m, 22),
        notes: null,
      });
    }
  }

  // Add a few "very recent" records so the Recent Activity widget looks alive.
  const recentBoost: Array<Prisma.FinancialRecordCreateManyInput> = [
    {
      userId: admin.id,
      amount: new Prisma.Decimal('85.40'),
      type: 'EXPENSE',
      category: 'Dining',
      date: daysAgo(3),
      notes: 'Weekly groceries',
    },
    {
      userId: analyst.id,
      amount: new Prisma.Decimal('49.99'),
      type: 'EXPENSE',
      category: 'Transport',
      date: daysAgo(6),
      notes: 'Subscription',
    },
    {
      userId: viewer.id,
      amount: new Prisma.Decimal('15.25'),
      type: 'EXPENSE',
      category: 'Dining',
      date: daysAgo(1),
      notes: null,
    },
  ];

  records.push(...recentBoost);

  await prisma.financialRecord.createMany({ data: records });

  // eslint-disable-next-line no-console
  console.log('Seed complete');
  // eslint-disable-next-line no-console
  console.log('Users:');
  // eslint-disable-next-line no-console
  console.log('- admin@zorvyn.local (ADMIN)');
  // eslint-disable-next-line no-console
  console.log('- analyst@zorvyn.local (ANALYST)');
  // eslint-disable-next-line no-console
  console.log('- viewer@zorvyn.local (VIEWER)');
  // eslint-disable-next-line no-console
  console.log('- inactive@zorvyn.local (INACTIVE)');
  // eslint-disable-next-line no-console
  console.log(`Password for all: ${password}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
