-- Campus Delivery — Postgres schema for Supabase (matches Prisma)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Or prefer: set DATABASE_URL + DIRECT_URL in backend/.env and run `npx prisma migrate deploy`

-- Enums
CREATE TYPE "Role" AS ENUM ('STUDENT', 'PARTNER', 'ADMIN');
CREATE TYPE "OrderType" AS ENUM ('FOOD', 'GROCERIES', 'PARCEL');
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'COD');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');

-- User (students + admins in app DB)
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

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Partner (delivery partners)
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "earnings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- Order
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

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
