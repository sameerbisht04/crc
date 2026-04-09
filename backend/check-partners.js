require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const partners = await prisma.partner.findMany();
    console.log('All partners:', JSON.stringify(partners, null, 2));

    const pendingPartners = await prisma.partner.findMany({ where: { approved: false } });
    console.log('Pending partners:', JSON.stringify(pendingPartners, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();