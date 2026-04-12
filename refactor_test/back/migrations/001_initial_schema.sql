-- 001_initial_schema.sql
-- CE System - Full PostgreSQL Schema
-- All 16 tables + indexes

CREATE TABLE IF NOT EXISTS "dayOrder" (
  "id" SERIAL PRIMARY KEY,
  "date" DATE NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "weekDay" TEXT DEFAULT '',
  "comments" TEXT DEFAULT '',
  "passed" SMALLINT DEFAULT 0,
  "autoInserted" SMALLINT DEFAULT 0,
  "originalDayOrder" INTEGER DEFAULT NULL,
  "lastEditBy" TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_dayorder_date ON "dayOrder" ("date");
CREATE INDEX IF NOT EXISTS idx_dayorder_name ON "dayOrder" ("name");

CREATE TABLE IF NOT EXISTS "dayOrderEmployee" (
  "id" SERIAL PRIMARY KEY,
  "dayOrderId" INTEGER REFERENCES "dayOrder"("id"),
  "function" TEXT DEFAULT '',
  "name" TEXT DEFAULT '',
  "prevision" TEXT DEFAULT '',
  "arrival" TEXT DEFAULT '',
  "departure" TEXT DEFAULT '',
  "phone" TEXT DEFAULT '',
  "comments" TEXT DEFAULT '',
  "deleted" SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dayorderemployee_dayorderid ON "dayOrderEmployee" ("dayOrderId");

CREATE TABLE IF NOT EXISTS "dayOrderEmployeesList" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT DEFAULT '',
  "function" TEXT DEFAULT '',
  "phone" TEXT DEFAULT '',
  "type" TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "dayOrderEmployeesFunctions" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT DEFAULT '',
  "orderNumber" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "dayOrderEmployeesRemunerations" (
  "id" SERIAL PRIMARY KEY,
  "functionId" INTEGER REFERENCES "dayOrderEmployeesFunctions"("id"),
  "paymentType" TEXT DEFAULT 'day',
  "activity" TEXT DEFAULT '',
  "hourlyValue1" DECIMAL(10,2) DEFAULT 0,
  "hourlyValue2" DECIMAL(10,2) DEFAULT 0,
  "hourlyValue3" DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "dayOrderPayments" (
  "id" SERIAL PRIMARY KEY,
  "dayOrderId" INTEGER REFERENCES "dayOrder"("id"),
  "function" TEXT DEFAULT '',
  "employeeName" TEXT DEFAULT '',
  "arrival" TEXT DEFAULT '',
  "departure" TEXT DEFAULT '',
  "value" DECIMAL(10,2) DEFAULT 0,
  "comments" TEXT DEFAULT '',
  "activity" TEXT DEFAULT '',
  "tourHour" TEXT DEFAULT '',
  "paymentDate" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dayorderpayments_dayorderid ON "dayOrderPayments" ("dayOrderId");

CREATE TABLE IF NOT EXISTS "dayOrderAssociateGuidesInTours" (
  "id" SERIAL PRIMARY KEY,
  "dayOrderId" INTEGER REFERENCES "dayOrder"("id"),
  "tourHour" TEXT DEFAULT '',
  "activity" TEXT DEFAULT '',
  "language" TEXT DEFAULT '',
  "guide" TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" SERIAL PRIMARY KEY,
  "customerName" TEXT DEFAULT '',
  "customerType" TEXT DEFAULT '',
  "createdBy" TEXT DEFAULT '',
  "lastEditBy" TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON "customers" ("customerName");

CREATE TABLE IF NOT EXISTS "customerContacts" (
  "id" SERIAL PRIMARY KEY,
  "customerId" INTEGER REFERENCES "customers"("id"),
  "contactName" TEXT DEFAULT '',
  "contactContact" TEXT DEFAULT '',
  "contactOffice" TEXT DEFAULT '',
  "contactEmail" TEXT DEFAULT '',
  "createdBy" TEXT DEFAULT '',
  "lastEditBy" TEXT DEFAULT '',
  "deleted" SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_customercontacts_customerid ON "customerContacts" ("customerId");

CREATE TABLE IF NOT EXISTS "product" (
  "id" SERIAL PRIMARY KEY,
  "type" TEXT DEFAULT '',
  "category" TEXT DEFAULT 'atividade',
  "name" TEXT DEFAULT '',
  "duration" TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "variant" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER REFERENCES "product"("id") ON DELETE CASCADE,
  "pricingType" TEXT DEFAULT 'person',
  "priceAdult" DECIMAL(10,2) DEFAULT 0,
  "priceHalf" DECIMAL(10,2) DEFAULT 0,
  "priceNet" DECIMAL(10,2) DEFAULT 0,
  "priceBrazilian" DECIMAL(10,2) DEFAULT 0,
  "priceFree" DECIMAL(10,2) DEFAULT 0,
  "priceGroup" DECIMAL(10,2) DEFAULT 0,
  "paxLimit" INTEGER DEFAULT 0,
  "priceAdultHighSeason" DECIMAL(10,2) DEFAULT 0,
  "priceHalfHighSeason" DECIMAL(10,2) DEFAULT 0,
  "priceNetHighSeason" DECIMAL(10,2) DEFAULT 0,
  "priceFreeHighSeason" DECIMAL(10,2) DEFAULT 0,
  "priceBrazilianHighSeason" DECIMAL(10,2) DEFAULT 0,
  "priceGroupHighSeason" DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "settings" (
  "id" SERIAL PRIMARY KEY,
  "type" TEXT DEFAULT '',
  "value" TEXT DEFAULT '',
  "year" TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_settings_type ON "settings" ("type");

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT UNIQUE NOT NULL,
  "name" TEXT DEFAULT '',
  "permissions" TEXT DEFAULT '1',
  "password" TEXT DEFAULT '',
  "deleted" SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "tokens" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "token" TEXT NOT NULL,
  "creationDate" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tokens_token ON "tokens" ("token");

CREATE TABLE IF NOT EXISTS "tour" (
  "id" SERIAL PRIMARY KEY,
  "type" TEXT DEFAULT '',
  "orderRef" TEXT DEFAULT '',
  "platform" TEXT DEFAULT '',
  "activity" TEXT DEFAULT '',
  "adicional" TEXT DEFAULT '',
  "duration" TEXT DEFAULT '',
  "tourDate" DATE,
  "tourHour" TEXT DEFAULT '',
  "local" TEXT DEFAULT '',
  "status" TEXT DEFAULT '',
  "language" TEXT DEFAULT '',
  "client" TEXT DEFAULT '',
  "paxAdult" INTEGER DEFAULT 0,
  "paxHalf" INTEGER DEFAULT 0,
  "paxFree" INTEGER DEFAULT 0,
  "paxNet" INTEGER DEFAULT 0,
  "paxBrazilian" INTEGER DEFAULT 0,
  "currency" TEXT DEFAULT '',
  "paymentMethod" TEXT DEFAULT '',
  "totalValue" TEXT DEFAULT '',
  "numberOfGroups" INTEGER DEFAULT 0,
  "ceGuide" TEXT DEFAULT '',
  "clientName" TEXT DEFAULT '',
  "clientContact" TEXT DEFAULT '',
  "country" TEXT DEFAULT '',
  "emailSubject" TEXT DEFAULT '',
  "companionName" TEXT DEFAULT '',
  "companionContact" TEXT DEFAULT '',
  "commissioned" SMALLINT DEFAULT 0,
  "comments" TEXT DEFAULT '',
  "conversationHistory" TEXT DEFAULT '',
  "paymentStatus" TEXT DEFAULT '',
  "financialComments" TEXT DEFAULT '',
  "year" TEXT DEFAULT '',
  "dateOfRegistration" DATE,
  "createdBy" TEXT DEFAULT '',
  "lastEditBy" TEXT DEFAULT '',
  "origin" TEXT DEFAULT 'office',
  "dayOrderId" INTEGER REFERENCES "dayOrder"("id"),
  "isHighSeason" SMALLINT DEFAULT 0,
  "canceled" SMALLINT DEFAULT 0,
  "cancelReason" TEXT DEFAULT '',
  "lateCheck" SMALLINT DEFAULT 0,
  "paymentDate" DATE,
  "netValue" DECIMAL(10,2) DEFAULT 0,
  "company" TEXT DEFAULT '',
  "invoiceNumber" TEXT DEFAULT '',
  "accountNumber" TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_tour_tourdate ON "tour" ("tourDate");
CREATE INDEX IF NOT EXISTS idx_tour_year ON "tour" ("year");
CREATE INDEX IF NOT EXISTS idx_tour_canceled ON "tour" ("canceled");
CREATE INDEX IF NOT EXISTS idx_tour_dayorderid ON "tour" ("dayOrderId");
CREATE INDEX IF NOT EXISTS idx_tour_origin ON "tour" ("origin");

CREATE TABLE IF NOT EXISTS "comissions" (
  "id" SERIAL PRIMARY KEY,
  "tourId" INTEGER REFERENCES "tour"("id"),
  "orderRef" TEXT DEFAULT '',
  "comissionersName" TEXT DEFAULT '',
  "comissionersContact" TEXT DEFAULT '',
  "comissionCurrency" TEXT DEFAULT '',
  "comissionPrice" TEXT DEFAULT '',
  "comissionPaid" SMALLINT DEFAULT 0,
  "createdBy" TEXT DEFAULT '',
  "lastEditBy" TEXT DEFAULT '',
  "year" TEXT DEFAULT '',
  "dateOfRegistration" DATE,
  "deleted" SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comissions_tourid ON "comissions" ("tourId");
CREATE INDEX IF NOT EXISTS idx_comissions_deleted ON "comissions" ("deleted");

CREATE TABLE IF NOT EXISTS "changeRequests" (
  "id" SERIAL PRIMARY KEY,
  "type" TEXT DEFAULT '',
  "name" TEXT DEFAULT '',
  "oldValue" TEXT DEFAULT '',
  "newValue" TEXT DEFAULT '',
  "tourId" INTEGER REFERENCES "tour"("id"),
  "createdBy" TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_changerequests_tourid ON "changeRequests" ("tourId");

CREATE TABLE IF NOT EXISTS "numberOfGroups" (
  "id" SERIAL PRIMARY KEY,
  "date" DATE,
  "hour" TEXT DEFAULT '',
  "activity" TEXT DEFAULT '',
  "groups" INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_numberofgroups_date ON "numberOfGroups" ("date");

-- Seed initial settings
INSERT INTO "settings" ("type", "value", "year") VALUES ('orderRefCount', '0', '2025') ON CONFLICT DO NOTHING;
INSERT INTO "settings" ("type", "value", "year") VALUES ('CurrentYear', '2025', '2025') ON CONFLICT DO NOTHING;
INSERT INTO "settings" ("type", "value", "year") VALUES ('currentYear', '2025', '2025') ON CONFLICT DO NOTHING;
