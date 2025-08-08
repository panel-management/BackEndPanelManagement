import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- پروسه Seed کردن شروع شد ---');

  const sportsToSeed = [
    'کاراته',
    'جودو',
    'جوجیتسو',
    'آیکیدو',
    'کندو',
    'ایایدو',
    'کیودو',
    'سومو',
    'تکواندو',
    'کونگ فو (ووشو)',
    'وینگ چون',
    'کونگ فو شائولین',
    'تای چی',
    'جیت کان دو',
    'موی تای',
    'بوکس',
    'کیک بوکسینگ',
    'شمشیربازی',
    'پانکریشن',
    'جوجیتسوی برزیلی',
    'کاپوئرا',
    'MMA',
    'سیستم‌آ',
  ];

  console.log(`تعداد ${sportsToSeed.length} ورزش برای اضافه شدن پیدا شد.`);

  for (const sportName of sportsToSeed) {
    console.log(`در حال تلاش برای اضافه کردن: ${sportName}`);

    await prisma.sport.upsert({
      where: { name: sportName },
      update: {},
      create: { name: sportName },
    });
  }

  console.log('--- پروسه Seed کردن با موفقیت به پایان رسید! ---');
}

main()
  .catch((e) => {
    console.error('خطایی در حین پروسه Seed رخ داد:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('در حال قطع اتصال از Prisma Client...');
    await prisma.$disconnect();
  });
