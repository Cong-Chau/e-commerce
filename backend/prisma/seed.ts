import { PrismaClient, RoleName } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Dữ liệu mẫu ─────────────────────────────────────────────────────────────

interface SeedUser {
  name: string;
  email: string;
  phone?: string;
  role: RoleName;
}

const SEED_USERS: SeedUser[] = [
  // Customers
  { name: 'Nguyễn Văn An',      email: 'nguyenvanan@gmail.com',     phone: '0901234501', role: 'CUSTOMER' },
  { name: 'Trần Thị Bình',      email: 'tranthibinh@gmail.com',     phone: '0901234502', role: 'CUSTOMER' },
  { name: 'Lê Hoàng Cường',     email: 'lehoangcuong@gmail.com',    phone: '0901234503', role: 'CUSTOMER' },
  { name: 'Phạm Thị Dung',      email: 'phamthidung@gmail.com',     phone: '0901234504', role: 'CUSTOMER' },
  { name: 'Hoàng Văn Em',       email: 'hoangvanem@gmail.com',      phone: '0901234505', role: 'CUSTOMER' },
  { name: 'Vũ Thị Phương',      email: 'vuthiphuong@gmail.com',     phone: '0901234506', role: 'CUSTOMER' },
  { name: 'Đặng Minh Quân',     email: 'dangminhquan@gmail.com',    phone: '0901234507', role: 'CUSTOMER' },
  { name: 'Bùi Thị Hoa',        email: 'buithihoa@gmail.com',       phone: '0901234508', role: 'CUSTOMER' },
  { name: 'Ngô Văn Inh',        email: 'ngovanin@gmail.com',        phone: '0901234509', role: 'CUSTOMER' },
  { name: 'Dương Thị Kim',      email: 'duongthikim@gmail.com',     phone: '0901234510', role: 'CUSTOMER' },
  { name: 'Lý Văn Long',        email: 'lyvanlong@gmail.com',       phone: '0901234511', role: 'CUSTOMER' },
  { name: 'Trương Thị Mai',     email: 'truongthimai@gmail.com',    phone: '0901234512', role: 'CUSTOMER' },
  // Sellers
  { name: 'Phan Văn Nam',       email: 'phanvannam@gmail.com',      phone: '0901234513', role: 'SELLER'   },
  { name: 'Đinh Thị Oanh',      email: 'dinhthioanh@gmail.com',     phone: '0901234514', role: 'SELLER'   },
  { name: 'Cao Minh Phúc',      email: 'caominhphuc@gmail.com',     phone: '0901234515', role: 'SELLER'   },
  { name: 'Lưu Thị Quỳnh',      email: 'luuthiquynh@gmail.com',     phone: '0901234516', role: 'SELLER'   },
  { name: 'Tô Văn Sơn',         email: 'tovanson@gmail.com',        phone: '0901234517', role: 'SELLER'   },
  { name: 'Mai Thị Thảo',       email: 'maithithao@gmail.com',      phone: '0901234518', role: 'SELLER'   },
  { name: 'Hồ Văn Uy',          email: 'hovanuy@gmail.com',         phone: '0901234519', role: 'SELLER'   },
  { name: 'Châu Thị Vân',       email: 'chauthivan@gmail.com',      phone: '0901234520', role: 'SELLER'   },
];

const DEFAULT_PASSWORD = 'Password@123';

// ─── Danh mục ─────────────────────────────────────────────────────────────────

const SEED_CATEGORIES = [
  'Thời Trang Nam',
  'Điện Thoại & Phụ Kiện',
  'Thiết Bị Điện Tử',
  'Máy Tính & Laptop',
  'Máy Ảnh & Máy Quay Phim',
  'Đồng Hồ',
  'Giày Dép Nam',
  'Thiết Bị Điện Gia Dụng',
  'Thể Thao & Du Lịch',
  'Ô Tô & Xe Máy & Xe Đạp',
  'Thời Trang Nữ',
  'Mẹ & Bé',
  'Nhà Cửa & Đời Sống',
  'Sắc Đẹp',
  'Sức Khỏe',
  'Giày Dép Nữ',
  'Túi Ví Nữ',
  'Phụ Kiện & Trang Sức Nữ',
  'Bách Hóa Online',
  'Nhà Sách Online',
  'Balo & Túi Ví Nam',
  'Đồ Chơi',
  'Chăm Sóc Thú Cưng',
  'Dụng Cụ và Thiết Bị Tiện Ích',
  'Thời Trang Trẻ Em',
  'Giặt Giũ & Chăm Sóc Nhà Cửa',
  'Voucher & Dịch Vụ',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Roles ──────────────────────────────────────────────────────
  console.log('📋 Tạo roles...');
  const roles: RoleName[] = ['CUSTOMER', 'SELLER', 'ADMIN'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✔ ${name}`);
  }

  // ── Admin ──────────────────────────────────────────────────────
  console.log('\n👑 Tạo tài khoản admin...');
  const adminName     = process.env.ADMIN_NAME;
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    console.warn('  ⚠️  Bỏ qua: thiếu ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD trong .env');
  } else {
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
    const hashed    = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
      where:  { email: adminEmail },
      update: {},
      create: {
        name: adminName, email: adminEmail, status: 'ACTIVE',
        accounts:  { create: { username: adminEmail, password: hashed, provider: 'LOCAL', is_verified: true } },
        userRoles: { create: { role_id: adminRole.id } },
      },
    });
    console.log(`  ✔ ${admin.email}`);
  }

  // ── Sample users ───────────────────────────────────────────────
  console.log('\n👥 Tạo 20 người dùng mẫu...');
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let created = 0;
  let skipped = 0;

  for (const u of SEED_USERS) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: u.role } });

    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.user.create({
      data: {
        name: u.name, email: u.email, phone: u.phone ?? null, status: 'ACTIVE',
        accounts:  { create: { username: u.email, password: hashed, provider: 'LOCAL', is_verified: true } },
        userRoles: { create: { role_id: role.id } },
      },
    });
    created++;
    console.log(`  ✔ [${u.role.padEnd(8)}] ${u.name} <${u.email}>`);
  }

  if (skipped > 0) console.log(`  ↩  Bỏ qua ${skipped} user đã tồn tại`);

  // ── Categories ─────────────────────────────────────────────────
  console.log('\n🗂️  Tạo danh mục...');
  let catCreated = 0;
  let catSkipped = 0;

  for (const name of SEED_CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { name, parent_id: null } });
    if (existing) {
      catSkipped++;
      continue;
    }
    await prisma.category.create({ data: { name, parent_id: null } });
    catCreated++;
    console.log(`  ✔ ${name}`);
  }

  if (catSkipped > 0) console.log(`  ↩  Bỏ qua ${catSkipped} danh mục đã tồn tại`);

  console.log(`\n✅ Seed hoàn tất!`);
  console.log(`   Users    — tạo mới: ${created}, bỏ qua: ${skipped}`);
  console.log(`   Danh mục — tạo mới: ${catCreated}, bỏ qua: ${catSkipped}`);
  console.log(`🔑 Mật khẩu mặc định: ${DEFAULT_PASSWORD}`);
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