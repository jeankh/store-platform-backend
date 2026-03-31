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

describe("Admin store currencies e2e tests", () => {
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
  async function bootstrapOwner() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const auth = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Tenant",
        lastName: "Owner",
      });
    const store = await request(app.getHttpServer())
      .post(`/api/admin/tenants/${tenant.id}/stores`)
      .set("Authorization", `Bearer ${auth.body.accessToken}`)
      .send({ slug: "main-store", name: "Main Store" });
    return { storeId: store.body.id, token: auth.body.accessToken as string };
  }
  it("POST /api/admin/stores/:storeId/currencies adds a currency", async () => {
    const { storeId, token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .post(`/api/admin/stores/${storeId}/currencies`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currencyCode: "EUR" })
      .expect(201);
    expect(response.body.currencyCode).toBe("EUR");
  });
  it("GET /api/admin/stores/:storeId/currencies lists currencies", async () => {
    const { storeId, token } = await bootstrapOwner();
    await request(app.getHttpServer())
      .post(`/api/admin/stores/${storeId}/currencies`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currencyCode: "EUR" });
    const response = await request(app.getHttpServer())
      .get(`/api/admin/stores/${storeId}/currencies`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
  it("DELETE /api/admin/stores/:storeId/currencies/:currencyCode removes a currency", async () => {
    const { storeId, token } = await bootstrapOwner();
    await request(app.getHttpServer())
      .post(`/api/admin/stores/${storeId}/currencies`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currencyCode: "USD" });
    await request(app.getHttpServer())
      .post(`/api/admin/stores/${storeId}/currencies`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currencyCode: "EUR" });
    await request(app.getHttpServer())
      .patch(`/api/admin/stores/${storeId}/currencies/EUR`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});
