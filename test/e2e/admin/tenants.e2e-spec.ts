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

describe("Admin tenant e2e tests", () => {
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

  it("POST /api/admin/tenants creates a tenant with a valid payload", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/admin/tenants")
      .send({
        slug: "tenant-public",
        name: "Tenant Public",
      })
      .expect(201);

    expect(response.body.slug).toBe("tenant-public");
  });

  it("GET /api/admin/tenants returns tenants for an authorized user", async () => {
    const { token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .get("/api/admin/tenants")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("GET /api/admin/tenants/:tenantId returns a tenant when found", async () => {
    const { tenant, token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .get(`/api/admin/tenants/${tenant.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.id).toBe(tenant.id);
  });

  it("PATCH /api/admin/tenants/:tenantId updates tenant fields", async () => {
    const { tenant, token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .patch(`/api/admin/tenants/${tenant.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Tenant Updated" })
      .expect(200);
    expect(response.body.name).toBe("Tenant Updated");
  });

  it("listing tenants without permission returns 403", async () => {
    const { tenant } = await bootstrapOwner();
    const token = await loginNoRoleUser(tenant.id);
    await request(app.getHttpServer())
      .get("/api/admin/tenants")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("requesting an unknown tenant returns 404", async () => {
    const { token } = await bootstrapOwner();
    await request(app.getHttpServer())
      .get(`/api/admin/tenants/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});
