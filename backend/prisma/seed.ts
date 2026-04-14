import { PrismaClient, RoleName } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ────────────────────────────────────────────────────
  const roles: RoleName[] = ['CUSTOMER', 'SELLER', 'ADMIN'];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✔ Role: ${name}`);
  }

  // ─── Admin Account ────────────────────────────────────────────
  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    console.warn(
      '⚠️  Bỏ qua tạo admin: thiếu ADMIN_NAME, ADMIN_EMAIL hoặc ADMIN_PASSWORD trong .env'
    );
  } else {
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) throw new Error('Role ADMIN không tồn tại');

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        name: adminName,
        email: adminEmail,
        status: 'ACTIVE',
        accounts: {
          create: {
            username: adminEmail,
            password: hashedPassword,
            provider: 'LOCAL',
            is_verified: true,
          },
        },
        userRoles: {
          create: { role_id: adminRole.id },
        },
      },
    });

    console.log(`  ✔ Admin: ${adminUser.email}`);
  }

  console.log('✅ Seed hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
