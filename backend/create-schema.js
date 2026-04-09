require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Creating database schema...');

    // Create enums
    await prisma.$executeRaw`
      CREATE TYPE "Role" AS ENUM ('STUDENT', 'PARTNER', 'ADMIN');
    `;
    console.log('Created Role enum');

    await prisma.$executeRaw`
      CREATE TYPE "OrderType" AS ENUM ('FOOD', 'GROCERIES', 'PARCEL');
    `;
    console.log('Created OrderType enum');

    await prisma.$executeRaw`
      CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'COD');
    `;
    console.log('Created PaymentMethod enum');

    await prisma.$executeRaw`
      CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
    `;
    console.log('Created OrderStatus enum');

    // Create tables
    await prisma.$executeRaw`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "Role" NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('Created User table');

    await prisma.$executeRaw`
      CREATE TABLE "Partner" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "approved" BOOLEAN NOT NULL DEFAULT false,
        "earnings" INTEGER NOT NULL DEFAULT 0,
        "passwordHash" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('Created Partner table');

    await prisma.$executeRaw`
      CREATE TABLE "Order" (
        "id" TEXT NOT NULL,
        "type" "OrderType" NOT NULL,
        "pickupLocation" TEXT NOT NULL,
        "dropLocation" TEXT NOT NULL,
        "notes" TEXT,
        "paymentMethod" "PaymentMethod" NOT NULL,
        "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
        "studentId" TEXT NOT NULL,
        "partnerId" TEXT,
        "amount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('Created Order table');

    // Create indexes
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
    `;
    console.log('Created User email index');

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");
    `;
    console.log('Created Partner email index');

    // Add foreign keys
    await prisma.$executeRaw`
      ALTER TABLE "Order" ADD CONSTRAINT "Order_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `;
    console.log('Added Order studentId foreign key');

    await prisma.$executeRaw`
      ALTER TABLE "Order" ADD CONSTRAINT "Order_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `;
    console.log('Added Order partnerId foreign key');

    console.log('Database schema created successfully!');

  } catch (e) {
    console.error('Error creating schema:', e);
  } finally {
    await prisma.$disconnect();
  }
})();