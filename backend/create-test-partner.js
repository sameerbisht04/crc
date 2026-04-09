require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const partner = await prisma.partner.create({
      data: {
        email: 'testpartner@example.com',
        name: 'Test Partner',
        phone: '1234567890',
        passwordHash: 'dummy',
        approved: false
      }
    });
    console.log('Created test partner:', partner);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();