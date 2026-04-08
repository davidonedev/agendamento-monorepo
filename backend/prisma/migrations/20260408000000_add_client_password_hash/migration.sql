-- AlterTable: adiciona coluna passwordHash (nullable) na tabela clients
ALTER TABLE "clients" ADD COLUMN "passwordHash" TEXT;
