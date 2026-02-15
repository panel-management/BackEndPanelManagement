import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function main() {
  const sportsToSeed = [
    { name: 'کاراته', hasBeltSystem: true },
    { name: 'جودو', hasBeltSystem: true },
    { name: 'جوجیتسو', hasBeltSystem: true },
    { name: 'آیکیدو', hasBeltSystem: true },
    { name: 'کندو', hasBeltSystem: true },
    { name: 'ایایدو', hasBeltSystem: true },
    { name: 'کیودو', hasBeltSystem: true },
    { name: 'تکواندو', hasBeltSystem: true },
    { name: 'کونگ فو (ووشو)', hasBeltSystem: true },
    { name: 'وینگ چون', hasBeltSystem: true },
    { name: 'کونگ فو شائولین', hasBeltSystem: true },
    { name: 'تای چی', hasBeltSystem: true },
    { name: 'جیت کان دو', hasBeltSystem: true },
    { name: 'جوجیتسوی برزیلی', hasBeltSystem: true },
    { name: 'کاپوئرا', hasBeltSystem: true },
    { name: 'سومو', hasBeltSystem: false },
    { name: 'موی تای', hasBeltSystem: false },
    { name: 'کشتی', hasBeltSystem: false },
    { name: 'بوکس', hasBeltSystem: false },
    { name: 'کیک بوکسینگ', hasBeltSystem: false },
    { name: 'شمشیربازی', hasBeltSystem: false },
    { name: 'پانکریشن', hasBeltSystem: false },
    { name: 'سیستم‌آ', hasBeltSystem: false },
    { name: 'MMA', hasBeltSystem: false },
    { name: 'باشگاه عمومی', hasBeltSystem: false },
    { name: 'شنا', hasBeltSystem: false },
    { name: 'ژیمناستیک', hasBeltSystem: false },
    { name: 'دوچرخه‌سواری', hasBeltSystem: false },
    { name: 'دو و میدانی', hasBeltSystem: false },
    { name: 'والیبال', hasBeltSystem: false },
    { name: 'بسکتبال', hasBeltSystem: false },
    { name: 'فوتبال', hasBeltSystem: false },
    { name: 'فوتسال', hasBeltSystem: false },
    { name: 'هندبال', hasBeltSystem: false },
    { name: 'تنیس', hasBeltSystem: false },
    { name: 'تنیس روی میز', hasBeltSystem: false },
    { name: 'بدمینتون', hasBeltSystem: false },
  ];

  const beltsToSeed = [
    'سفید',
    'خاکستری',
    'زرد',
    'نارنجی',
    'سبز',
    'آبی',
    'بنفش',
    'قهوه‌ای',
    'قرمز',
    'قرمز/سیاه',
    'قرمز/سفید',
    'مشکی',
    'صورتی',
    'طلایی',
    'نقره‌ای',
  ];

  const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER
  const adminNationalCode = process.env.ADMIN_NATIONAL_CODE

  if (!adminPhoneNumber || !adminNationalCode) {
    throw new Error('❌ متغیرهای ADMIN_PHONE_NUMBER یا ADMIN_NATIONAL_CODE در فایل .env یافت نشدند.');
  }

  console.log('🌱 Starting seeding...');

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      sportsToSeed.map((sport) =>
        tx.sport.upsert({
          where: { name: sport.name },
          update: { hasBeltSystem: sport.hasBeltSystem },
          create: sport,
        }),
      ),
    )

    await Promise.all(
      beltsToSeed.map((color) =>
        tx.belt.upsert({
          where: { color },
          update: {},
          create: { color },
        }),
      ),
    )

    await tx.users.upsert({
      where: { phoneNumber: adminPhoneNumber },
      update: {},
      create: {
        phoneNumber: adminPhoneNumber,
        fullName: 'ادمین',
        nationalCode: adminNationalCode,
        type: 0,
      },
    })
  })

  console.log('✅ Seed completed successfully')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
