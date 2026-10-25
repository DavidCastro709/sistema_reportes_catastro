-- Ejecutar primero en PostgreSQL conectado a la base de datos "catastro".
-- El script usa IF NOT EXISTS para poder volver a ejecutarse parcialmente sin perder datos.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportVisibility" AS ENUM ('ALL_USERS', 'OWNER_ONLY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" VARCHAR(254) NOT NULL UNIQUE,
  "fullName" VARCHAR(160) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT PRIMARY KEY,
  "title" VARCHAR(180) NOT NULL,
  "folio" VARCHAR(40) NOT NULL UNIQUE,
  "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
  "visibility" "ReportVisibility" NOT NULL DEFAULT 'ALL_USERS',
  "parameters" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Report_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Report_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReportRow" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "cadastralId" VARCHAR(80) NOT NULL,
  "description" VARCHAR(240) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "income" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReportRow_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT,
  "action" VARCHAR(80) NOT NULL,
  "entity" VARCHAR(80) NOT NULL,
  "entityId" VARCHAR(80) NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" VARCHAR(64),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "User_role_isActive_idx" ON "User"("role", "isActive");
CREATE INDEX IF NOT EXISTS "Report_status_createdAt_idx" ON "Report"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Report_ownerUserId_status_idx" ON "Report"("ownerUserId", "status");
CREATE INDEX IF NOT EXISTS "ReportRow_reportId_idx" ON "ReportRow"("reportId");
CREATE INDEX IF NOT EXISTS "ReportRow_cadastralId_idx" ON "ReportRow"("cadastralId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

COMMIT;
