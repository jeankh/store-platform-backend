import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { configureApplication } from "src/bootstrap/app-bootstrap";
import { AppModule } from "src/app.module";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/e_com_backend";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function resetDatabase() {
  await prisma.customerAddress.deleteMany();
  await prisma.customerSession.deleteMany();
  await prisma.customerPreference.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.storeTaxConfig.deleteMany();
  await prisma.storeCurrency.deleteMany();
  await prisma.storeLocale.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();
}

describe("Storefront customer profile e2e tests", () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    if (app) await app.close();
    await prisma.$disconnect();
  });

  async function registerCustomer() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const register = await request(app.getHttpServer())
      .post("/api/storefront/auth/register")
      .send({
        tenantId: tenant.id,
        email: "customer@test.com",
        password: "super-secret-password",
        firstName: "John",
        lastName: "Doe",
      });
    return { tenant, token: register.body.accessToken as string };
  }

  it("GET /api/storefront/customers/me", async () => {
    const { token } = await registerCustomer();
    const response = await request(app.getHttpServer())
      .get("/api/storefront/customers/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.email).toBe("customer@test.com");
  });

  it("PATCH /api/storefront/customers/me", async () => {
    const { token } = await registerCustomer();
    const response = await request(app.getHttpServer())
      .patch("/api/storefront/customers/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Jane",
        localeCode: "fr-FR",
        marketingEmailOptIn: true,
      })
      .expect(200);
    expect(response.body.firstName).toBe("Jane");
    expect(response.body.preferences.localeCode).toBe("fr-FR");
  });
});
