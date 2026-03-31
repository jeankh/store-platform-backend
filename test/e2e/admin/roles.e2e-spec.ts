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

describe("Admin roles e2e tests", () => {
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

  async function bootstrapOwner(
    slug = "tenant-1",
    email = "owner@tenant.test",
  ) {
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name: slug,
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const response = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email,
        password: "super-secret-password",
        firstName: "Tenant",
        lastName: "Owner",
      });
    return { tenant, token: response.body.accessToken };
  }

  async function loginNoRoleUser(tenantId: string) {
    const passwordService = new PasswordService();
    const user = await prisma.user.create({
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
      .send({ tenantId, email: user.email, password: "super-secret-password" });
    return { token: response.body.accessToken as string, user };
  }

  it("GET /api/admin/permissions returns seeded permissions for an authorized user", async () => {
    const { token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .get("/api/admin/permissions")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("POST /api/admin/roles creates a role", async () => {
    const { token } = await bootstrapOwner();
    const response = await request(app.getHttpServer())
      .post("/api/admin/roles")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Manager",
        code: "manager",
        permissionCodes: ["store.read"],
      })
      .expect(201);
    expect(response.body.code).toBe("manager");
  });

  it("GET /api/admin/roles lists tenant roles", async () => {
    const { token } = await bootstrapOwner();
    await request(app.getHttpServer())
      .post("/api/admin/roles")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Manager",
        code: "manager",
        permissionCodes: ["store.read"],
      });
    const response = await request(app.getHttpServer())
      .get("/api/admin/roles")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("POST /api/admin/users/:userId/roles assigns a role to a user", async () => {
    const { tenant, token } = await bootstrapOwner();
    const { user } = await loginNoRoleUser(tenant.id);
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
  });

  it("assigning a role without permission returns 403", async () => {
    const { tenant, token } = await bootstrapOwner();
    const { token: noRoleToken, user } = await loginNoRoleUser(tenant.id);
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
      .set("Authorization", `Bearer ${noRoleToken}`)
      .send({ roleId: role.body.id })
      .expect(403);
  });

  it("assigning a role across tenant boundary returns 404", async () => {
    const first = await bootstrapOwner("tenant-1", "owner1@tenant.test");
    const second = await bootstrapOwner("tenant-2", "owner2@tenant.test");
    const role = await request(app.getHttpServer())
      .post("/api/admin/roles")
      .set("Authorization", `Bearer ${second.token}`)
      .send({
        name: "Other Manager",
        code: "other-manager",
        permissionCodes: ["store.read"],
      });
    const { user } = await loginNoRoleUser(first.tenant.id);
    await request(app.getHttpServer())
      .post(`/api/admin/users/${user.id}/roles`)
      .set("Authorization", `Bearer ${first.token}`)
      .send({ roleId: role.body.id })
      .expect(404);
  });
});
