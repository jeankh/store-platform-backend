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
  await prisma.variantAttributeValue.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
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

describe("Admin catalog taxonomy e2e tests", () => {
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

  async function bootstrapOwnerAndStore() {
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
        firstName: "Owner",
        lastName: "User",
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

  it("POST /api/admin/categories creates a category", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndStore();
    const response = await request(app.getHttpServer())
      .post("/api/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ tenantId: tenant.id, storeId, slug: "summer", name: "Summer" })
      .expect(201);
    expect(response.body.slug).toBe("summer");
  });
  it("GET /api/admin/categories lists categories", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndStore();
    await request(app.getHttpServer())
      .post("/api/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ tenantId: tenant.id, storeId, slug: "summer", name: "Summer" });
    const response = await request(app.getHttpServer())
      .get("/api/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
  it("POST /api/admin/collections creates a collection", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndStore();
    const response = await request(app.getHttpServer())
      .post("/api/admin/collections")
      .set("Authorization", `Bearer ${token}`)
      .send({ tenantId: tenant.id, storeId, slug: "summer", name: "Summer" })
      .expect(201);
    expect(response.body.slug).toBe("summer");
  });
  it("GET /api/admin/collections lists collections", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndStore();
    await request(app.getHttpServer())
      .post("/api/admin/collections")
      .set("Authorization", `Bearer ${token}`)
      .send({ tenantId: tenant.id, storeId, slug: "summer", name: "Summer" });
    const response = await request(app.getHttpServer())
      .get("/api/admin/collections")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
});
