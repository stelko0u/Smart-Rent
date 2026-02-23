-- Smart Rent Database Schema
-- PostgreSQL schema replacing Prisma ORM

-- Enums
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'COMPANY');
CREATE TYPE "CarType" AS ENUM ('SEDAN', 'HATCHBACK', 'SUV', 'COUPE', 'CONVERTIBLE', 'CABRIO', 'WAGON', 'VAN', 'PICKUP', 'COMBI', 'OTHER');
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC', 'OTHER');
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRICITY');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'RETURNED', 'CANCELLED');

-- Tables
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "role" "Role" DEFAULT 'USER' NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    "emailVerified" BOOLEAN DEFAULT false NOT NULL,
    "companyId" INTEGER REFERENCES "Company"("id")
);

CREATE TABLE "Company" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "maintenancePercent" DECIMAL DEFAULT 0 NOT NULL,
    "ownerId" INTEGER UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
);

CREATE TABLE "Office" (
    "id" SERIAL PRIMARY KEY,
    "companyId" INTEGER NOT NULL REFERENCES "Company"("id"),
    "name" VARCHAR(255),
    "address" VARCHAR(255),
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
);

CREATE TABLE "Car" (
    "id" SERIAL PRIMARY KEY,
    "make" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "year" INTEGER NOT NULL,
    "pricePerDay" DECIMAL NOT NULL,
    "ownerId" INTEGER NOT NULL REFERENCES "User"("id"),
    "images" TEXT[],
    "companyId" INTEGER REFERENCES "Company"("id"),
    "officeId" INTEGER REFERENCES "Office"("id"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    "carType" "CarType" NOT NULL,
    "transmissionType" "TransmissionType" NOT NULL,
    "fuelType" "FuelType" NOT NULL
);

CREATE TABLE "Reservation" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES "User"("id"), -- Made nullable for guest reservations
    "carId" INTEGER NOT NULL REFERENCES "Car"("id"),
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "status" "ReservationStatus" DEFAULT 'PENDING' NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "firstName" VARCHAR(255), -- Guest reservation fields
    "lastName" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "notes" TEXT,
    UNIQUE("carId", "startDate", "endDate")
);

CREATE TABLE "Review" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"("id"),
    "carId" INTEGER NOT NULL REFERENCES "Car"("id"),
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PasswordResetToken" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT (gen_random_uuid()::text),
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP
);

-- Foreign Key Constraints
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_ownedCompany_fkey" FOREIGN KEY ("id") REFERENCES "Company"("ownerId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Office" ADD CONSTRAINT "Office_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Car" ADD CONSTRAINT "Car_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Car" ADD CONSTRAINT "Car_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Car" ADD CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review" ADD CONSTRAINT "Review_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for better performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

CREATE INDEX "Company_email_idx" ON "Company"("email");
CREATE INDEX "Company_ownerId_idx" ON "Company"("ownerId");

CREATE INDEX "Office_companyId_idx" ON "Office"("companyId");

CREATE INDEX "Car_ownerId_idx" ON "Car"("ownerId");
CREATE INDEX "Car_companyId_idx" ON "Car"("companyId");
CREATE INDEX "Car_officeId_idx" ON "Car"("officeId");
CREATE INDEX "Car_carType_idx" ON "Car"("carType");

CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
CREATE INDEX "Reservation_carId_idx" ON "Reservation"("carId");
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");
CREATE INDEX "Reservation_startDate_idx" ON "Reservation"("startDate");

CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_carId_idx" ON "Review"("carId");

CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");