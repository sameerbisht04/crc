require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const partnerId = 'cmnrqajwa0002rt8njm4engai'; // From the check-partners.js output
    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data: { approved: true }
    });
    console.log('Partner approved:', partner);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();