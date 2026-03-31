import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus, UserStatus } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { configureApplication } from "src/bootstrap/app-bootstrap";
import { PasswordService } from "src/modules/identity/application/services/password.service";
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

describe("Admin store settings e2e tests", () => {
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
    if (app) {
      await app.close();
    }
    await prisma.$disconnect();
  });

  async function bootstrapOwner() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant 1",
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

    return {
      tenant,
      storeId: store.body.id,
      token: auth.body.accessToken as string,
    };
  }

  async function loginNoRoleUser(tenantId: string) {
    const passwordService = new PasswordService();
    await prisma.user.create({
      data: {
        tenantId,
        email: "staff@tenant.test",
        passwordHash: await passwordService.hash("super-secret-password"),
        status: UserStatus.ACTIVE,
        staffProfile: { create: { firstName: "Staff", lastName: "User" } },
      },
    });

    const response = await request(app.getHttpServer())
      .post("/api/admin/auth/login")
      .send({
        tenantId,
        email: "staff@tenant.test",
        password: "super-secret-password",
      });

    return response.body.accessToken as string;
  }

  it("GET /api/admin/stores/:storeId/settings returns store settings", async () => {
    const { storeId, token } = await bootstrapOwner();

    const response = await request(app.getHttpServer())
      .get(`/api/admin/stores/${storeId}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.storeId).toBe(storeId);
    expect(response.body.defaultLocale).toBe("en");
  });

  it("PATCH /api/admin/stores/:storeId/settings updates store settings", async () => {
    const { storeId, token } = await bootstrapOwner();

    const response = await request(app.getHttpServer())
      .patch(`/api/admin/stores/${storeId}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Main Store Display",
        supportEmail: "support@store.com",
        supportPhone: "+123456",
        timezone: "Europe/Paris",
        logoUrl: "https://cdn.test/logo.png",
        primaryColor: "#112233",
        secondaryColor: "#ffffff",
      })
      .expect(200);

    expect(response.body.displayName).toBe("Main Store Display");
    expect(response.body.logoUrl).toBe("https://cdn.test/logo.png");
  });

  it("updating store settings without permission returns 403", async () => {
    const { tenant, storeId } = await bootstrapOwner();
    const token = await loginNoRoleUser(tenant.id);

    await request(app.getHttpServer())
      .patch(`/api/admin/stores/${storeId}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Blocked" })
      .expect(403);
  });

  it("requesting settings for a missing store returns 404", async () => {
    const { token } = await bootstrapOwner();

    await request(app.getHttpServer())
      .get(`/api/admin/stores/${randomUUID()}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});
