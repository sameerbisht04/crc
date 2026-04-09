require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRaw`
      ALTER TABLE "Partner" ADD COLUMN "usn" TEXT NOT NULL DEFAULT '';
    `;
    console.log('Added usn column');

    await prisma.$executeRaw`
      ALTER TABLE "Partner" ADD COLUMN "collegeYear" TEXT NOT NULL DEFAULT '';
    `;
    console.log('Added collegeYear column');

    await prisma.$executeRaw`
      ALTER TABLE "Partner" ADD COLUMN "enrollmentNo" TEXT NOT NULL DEFAULT '';
    `;
    console.log('Added enrollmentNo column');

    await prisma.$executeRaw`
      ALTER TABLE "Partner" ADD COLUMN "idCardUrl" TEXT NOT NULL DEFAULT '';
    `;
    console.log('Added idCardUrl column');

    console.log('Migration completed successfully!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();