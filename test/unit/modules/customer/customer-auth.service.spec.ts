import { describe, expect, it } from "vitest";

import { CustomerAuthService } from "src/modules/customer/application/services/customer-auth.service";
import { CustomerAuthRepository } from "src/modules/customer/domain/repositories/customer-auth.repository";
import { PasswordService } from "src/modules/identity/application/services/password.service";
import { TokenService } from "src/modules/identity/application/services/token.service";

class InMemoryCustomerRepository implements CustomerAuthRepository {
  tenants = new Map<string, { id: string; status: "ACTIVE" | "INACTIVE" }>();
  customers = new Map<string, any>();
  sessions = new Map<string, any>();

  async findTenantById(tenantId: string) {
    return this.tenants.get(tenantId) || null;
  }
  async findCustomerByEmail(tenantId: string, email: string) {
    return (
      Array.from(this.customers.values()).find(
        (customer) =>
          customer.tenantId === tenantId && customer.email === email,
      ) || null
    );
  }
  async findCustomerById(customerId: string) {
    return this.customers.get(customerId) || null;
  }
  async createCustomer(input: any) {
    const customer = {
      id: `customer-${this.customers.size + 1}`,
      tenantId: input.tenantId,
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
      status: "ACTIVE" as const,
      isGuest: false,
      lastLoginAt: null,
      tenantStatus: "ACTIVE" as const,
      preferences: {
        localeCode: null,
        currencyCode: null,
        marketingEmailOptIn: false,
        marketingSmsOptIn: false,
      },
    };
    this.customers.set(customer.id, customer);
    return customer;
  }
  async updateCustomerLastLoginAt(customerId: string, lastLoginAt: Date) {
    const customer = this.customers.get(customerId);
    if (customer) this.customers.set(customerId, { ...customer, lastLoginAt });
  }
  async createCustomerSession(input: any) {
    const session = {
      id: `session-${this.sessions.size + 1}`,
      customerId: input.customerId,
      refreshTokenHash: "",
      expiresAt: input.expiresAt,
      revokedAt: null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    };
    this.sessions.set(session.id, session);
    return session;
  }
  async updateCustomerSessionRefreshTokenHash(
    sessionId: string,
    refreshTokenHash: string,
  ) {
    const session = this.sessions.get(sessionId);
    this.sessions.set(sessionId, { ...session, refreshTokenHash });
  }
  async findCustomerSessionByRefreshTokenHash(refreshTokenHash: string) {
    return (
      Array.from(this.sessions.values()).find(
        (session) => session.refreshTokenHash === refreshTokenHash,
      ) || null
    );
  }
  async revokeCustomerSession(sessionId: string, revokedAt: Date) {
    const session = this.sessions.get(sessionId);
    if (session) this.sessions.set(sessionId, { ...session, revokedAt });
  }
  async updateCustomerProfile(input: any) {
    const customer = this.customers.get(input.customerId);
    const next = {
      ...customer,
      firstName: input.firstName ?? customer.firstName,
      lastName: input.lastName ?? customer.lastName,
      phone: input.phone ?? customer.phone,
      preferences: {
        ...customer.preferences,
        localeCode: input.localeCode ?? customer.preferences.localeCode,
        currencyCode: input.currencyCode ?? customer.preferences.currencyCode,
        marketingEmailOptIn:
          input.marketingEmailOptIn ?? customer.preferences.marketingEmailOptIn,
        marketingSmsOptIn:
          input.marketingSmsOptIn ?? customer.preferences.marketingSmsOptIn,
      },
    };
    this.customers.set(input.customerId, next);
    return next;
  }
  async listCustomerAddresses() {
    return [];
  }
  async findCustomerAddress() {
    return null;
  }
  async createCustomerAddress() {
    return {
      id: "address-1",
      customerId: "customer-1",
      label: null,
      firstName: "John",
      lastName: "Doe",
      company: null,
      line1: "123 Street",
      line2: null,
      city: "Paris",
      region: null,
      postalCode: "75001",
      countryCode: "FR",
      phone: null,
      isDefaultShipping: false,
      isDefaultBilling: false,
    };
  }
  async updateCustomerAddress() {
    return {
      id: "address-1",
      customerId: "customer-1",
      label: null,
      firstName: "John",
      lastName: "Doe",
      company: null,
      line1: "123 Street",
      line2: null,
      city: "Paris",
      region: null,
      postalCode: "75001",
      countryCode: "FR",
      phone: null,
      isDefaultShipping: false,
      isDefaultBilling: false,
    };
  }
  async deleteCustomerAddress() {
    return;
  }
  async listCustomers() {
    return Array.from(this.customers.values());
  }
}

describe("Customer auth unit tests", () => {
  it("registers a customer with valid tenant-scoped email", async () => {
    const repository = new InMemoryCustomerRepository();
    repository.tenants.set("tenant-1", { id: "tenant-1", status: "ACTIVE" });
    const service = new CustomerAuthService(
      repository,
      new PasswordService(),
      new TokenService(),
    );
    const result = await service.register({
      tenantId: "tenant-1",
      email: "customer@test.com",
      password: "super-secret-password",
      firstName: "John",
      lastName: "Doe",
    });
    expect(result.customer.email).toBe("customer@test.com");
    expect(result.accessToken).toContain(".");
  });

  it("rejects duplicate customer email in same tenant", async () => {
    const repository = new InMemoryCustomerRepository();
    repository.tenants.set("tenant-1", { id: "tenant-1", status: "ACTIVE" });
    const service = new CustomerAuthService(
      repository,
      new PasswordService(),
      new TokenService(),
    );
    await service.register({
      tenantId: "tenant-1",
      email: "customer@test.com",
      password: "super-secret-password",
      firstName: "John",
      lastName: "Doe",
    });
    await expect(
      service.register({
        tenantId: "tenant-1",
        email: "customer@test.com",
        password: "super-secret-password",
        firstName: "John",
        lastName: "Doe",
      }),
    ).rejects.toThrow("Customer 'customer@test.com' already exists");
  });

  it("logs in customer with valid credentials", async () => {
    const repository = new InMemoryCustomerRepository();
    repository.tenants.set("tenant-1", { id: "tenant-1", status: "ACTIVE" });
    const passwordService = new PasswordService();
    const service = new CustomerAuthService(
      repository,
      passwordService,
      new TokenService(),
    );
    const passwordHash = await passwordService.hash("super-secret-password");
    repository.customers.set("customer-1", {
      id: "customer-1",
      tenantId: "tenant-1",
      email: "customer@test.com",
      passwordHash,
      firstName: "John",
      lastName: "Doe",
      phone: null,
      status: "ACTIVE" as const,
      isGuest: false,
      lastLoginAt: null,
      tenantStatus: "ACTIVE" as const,
      preferences: {
        localeCode: null,
        currencyCode: null,
        marketingEmailOptIn: false,
        marketingSmsOptIn: false,
      },
    });
    const result = await service.login({
      tenantId: "tenant-1",
      email: "customer@test.com",
      password: "super-secret-password",
    });
    expect(result.customer.id).toBe("customer-1");
  });

  it("rejects invalid customer login", async () => {
    const repository = new InMemoryCustomerRepository();
    repository.tenants.set("tenant-1", { id: "tenant-1", status: "ACTIVE" });
    const service = new CustomerAuthService(
      repository,
      new PasswordService(),
      new TokenService(),
    );
    await expect(
      service.login({
        tenantId: "tenant-1",
        email: "missing@test.com",
        password: "super-secret-password",
      }),
    ).rejects.toThrow("Invalid customer credentials");
  });

  it("rejects invalid refresh token", async () => {
    const service = new CustomerAuthService(
      new InMemoryCustomerRepository(),
      new PasswordService(),
      new TokenService(),
    );
    await expect(
      service.refresh({ refreshToken: "bad-token" }),
    ).rejects.toThrow("Invalid customer refresh token");
  });
});
