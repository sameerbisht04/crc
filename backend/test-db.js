require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Connected to database successfully');

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('Database version:', result);

  } catch (e) {
    console.error('Database connection error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();