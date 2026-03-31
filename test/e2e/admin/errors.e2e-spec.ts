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
  await prisma.storeSettings.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();
}

describe("Admin error handling e2e tests", () => {
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
    await app.close();
    await prisma.$disconnect();
  });

  async function bootstrapOwner() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: "tenant-1",
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const response = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Tenant",
        lastName: "Owner",
      });
    return { tenant, token: response.body.accessToken };
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

  it("returns 400 with the agreed error shape for an invalid request body", async () => {
    const { token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .get("/api/admin/tenants/not-a-uuid")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
    expect(response.body.error).toBeDefined();
  });

  it("returns 401 with the agreed error shape for an unauthorized request", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/admin/auth/me")
      .expect(401);
    expect(response.body.statusCode).toBe(401);
    expect(response.body.message).toBeDefined();
    expect(response.body.error).toBeDefined();
  });

  it("returns 403 with the agreed error shape for a forbidden request", async () => {
    const { tenant } = await bootstrapOwner();
    const token = await loginNoRoleUser(tenant.id);
    const response = await request(app.getHttpServer())
      .get("/api/admin/permissions")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(response.body.statusCode).toBe(403);
    expect(response.body.message).toBeDefined();
    expect(response.body.error).toBeDefined();
  });

  it("returns 404 with the agreed error shape for a missing resource", async () => {
    const { token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .get(`/api/admin/tenants/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
    expect(response.body.statusCode).toBe(404);
    expect(response.body.message).toBeDefined();
    expect(response.body.error).toBeDefined();
  });
});
