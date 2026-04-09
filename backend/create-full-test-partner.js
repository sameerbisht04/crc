require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const partner = await prisma.partner.create({
      data: {
        email: 'newpartner@example.com',
        name: 'John Doe',
        phone: '9876543210',
        passwordHash: 'dummy',
        usn: 'PES2020CS001',
        collegeYear: '3rd Year',
        enrollmentNo: 'ENR20201234',
        idCardUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        approved: false
      }
    });
    console.log('Created test partner with all details:', partner);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();