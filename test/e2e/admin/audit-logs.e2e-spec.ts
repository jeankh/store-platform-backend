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

describe("Admin audit log e2e tests", () => {
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

  it("GET /api/admin/audit-logs returns audit log entries for an authorized user", async () => {
    const { tenant, token } = await bootstrapOwner();
    await request(app.getHttpServer())
      .patch(`/api/admin/tenants/${tenant.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Tenant Updated" });
    const response = await request(app.getHttpServer())
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("tenant update creates an audit log entry", async () => {
    const { tenant, token } = await bootstrapOwner();
    await request(app.getHttpServer())
      .patch(`/api/admin/tenants/${tenant.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Tenant Updated" })
      .expect(200);
    const response = await request(app.getHttpServer())
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(
      response.body.some(
        (entry: { action: string }) => entry.action === "tenant.updated",
      ),
    ).toBe(true);
  });

  it("store creation creates an audit log entry", async () => {
    const { tenant, token } = await bootstrapOwner();
    await request(app.getHttpServer())
      .post(`/api/admin/tenants/${tenant.id}/stores`)
      .set("Authorization", `Bearer ${token}`)
      .send({ slug: "main-store", name: "Main Store" })
      .expect(201);
    const response = await request(app.getHttpServer())
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(
      response.body.some(
        (entry: { action: string }) => entry.action === "store.created",
      ),
    ).toBe(true);
  });

  it("role assignment creates an audit log entry", async () => {
    const { tenant, token } = await bootstrapOwner();
    const passwordService = new PasswordService();
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "staff@tenant.test",
        passwordHash: await passwordService.hash("super-secret-password"),
        status: UserStatus.ACTIVE,
        staffProfile: { create: { firstName: "Staff", lastName: "User" } },
      },
    });
    const role = await request(app.getHttpServer())
      .post("/api/admin/roles")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Manager",
        code: "manager",
        permissionCodes: ["store.read"],
      });
    await request(app.getHttpServer())
      .post(`/api/admin/users/${user.id}/roles`)
      .set("Authorization", `Bearer ${token}`)
      .send({ roleId: role.body.id })
      .expect(201);
    const response = await request(app.getHttpServer())
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(
      response.body.some(
        (entry: { action: string }) => entry.action === "role.assigned",
      ),
    ).toBe(true);
  });

  it("requesting audit logs without permission returns 403", async () => {
    const { tenant } = await bootstrapOwner();
    const token = await loginNoRoleUser(tenant.id);
    await request(app.getHttpServer())
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });
});
