import { PrismaClient, TenantStatus } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { configureApplication } from "src/bootstrap/app-bootstrap";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/e_com_backend";

import { AppModule } from "src/app.module";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
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

describe("Admin auth e2e tests", () => {
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

  it("POST /api/admin/auth/bootstrap creates the first admin for a tenant", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: "tenant-1",
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
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
      })
      .expect(201);

    expect(response.body.user.email).toBe("owner@tenant.test");
    expect(response.body.accessToken).toContain(".");
    expect(response.body.refreshToken).toContain(".");
  });

  it("POST /api/admin/auth/login returns tokens for valid credentials", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: "tenant-1",
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });

    await request(app.getHttpServer()).post("/api/admin/auth/bootstrap").send({
      tenantId: tenant.id,
      email: "owner@tenant.test",
      password: "super-secret-password",
      firstName: "Tenant",
      lastName: "Owner",
    });

    const response = await request(app.getHttpServer())
      .post("/api/admin/auth/login")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
      })
      .expect(200);

    expect(response.body.accessToken).toContain(".");
    expect(response.body.refreshToken).toContain(".");
  });

  it("GET /api/admin/auth/me returns the current user for a valid access token", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: "tenant-1",
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });

    const bootstrapResponse = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Tenant",
        lastName: "Owner",
      });

    const response = await request(app.getHttpServer())
      .get("/api/admin/auth/me")
      .set("Authorization", `Bearer ${bootstrapResponse.body.accessToken}`)
      .expect(200);

    expect(response.body.email).toBe("owner@tenant.test");
  });

  it("POST /api/admin/auth/refresh issues a new access token from a valid refresh token", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: "tenant-1",
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });

    const bootstrapResponse = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Tenant",
        lastName: "Owner",
      });

    const response = await request(app.getHttpServer())
      .post("/api/admin/auth/refresh")
      .send({
        refreshToken: bootstrapResponse.body.refreshToken,
      })
      .expect(200);

    expect(response.body.accessToken).toContain(".");
    expect(response.body.refreshToken).toContain(".");
  });

  it("POST /api/admin/auth/logout revokes the current session or token", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: "tenant-1",
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });

    const bootstrapResponse = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Tenant",
        lastName: "Owner",
      });

    await request(app.getHttpServer())
      .post("/api/admin/auth/logout")
      .send({
        refreshToken: bootstrapResponse.body.refreshToken,
      })
      .expect(204);

    await request(app.getHttpServer())
      .post("/api/admin/auth/refresh")
      .send({
        refreshToken: bootstrapResponse.body.refreshToken,
      })
      .expect(500);
  });

  it("GET /api/admin/auth/me returns 401 for an unauthorized request", async () => {
    await request(app.getHttpServer()).get("/api/admin/auth/me").expect(401);
  });
});
