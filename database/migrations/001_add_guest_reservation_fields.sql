-- Migration: Add guest reservation fields to Reservation table
-- This allows reservations without authenticated users

ALTER TABLE "Reservation" 
ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Make userId nullable to allow guest reservations
ALTER TABLE "Reservation" 
ALTER COLUMN "userId" DROP NOT NULL;