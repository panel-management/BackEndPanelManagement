import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    { name: 'MMA', hasBeltSystem: false },
    { name: 'سیستم‌آ', hasBeltSystem: false },
  ];

  console.log(`number ${sportsToSeed.length} sport was found to be added.`);

  for (const sportData of sportsToSeed) {
    await prisma.sport.upsert({
      where: { name: sportData.name },
      update: { hasBeltSystem: sportData.hasBeltSystem },
      create: { name: sportData.name, hasBeltSystem: sportData.hasBeltSystem },
    });
    console.log(`Sports ${sportData.name} successfully processed.`);
  }

  console.log('--- success process added sport  ---');

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

  for (const beltColor of beltsToSeed) {
    await prisma.belt.upsert({
      where: { color: beltColor },
      update: {},
      create: { color: beltColor },
    });
  }

  console.log('--- success process added belt ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting from Prisma Client...');
    await prisma.$disconnect();
  });
