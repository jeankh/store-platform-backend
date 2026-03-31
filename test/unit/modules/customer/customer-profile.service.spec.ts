import { describe, expect, it } from "vitest";

import { CustomerProfileService } from "src/modules/customer/application/services/customer-profile.service";
import { CustomerAuthRepository } from "src/modules/customer/domain/repositories/customer-auth.repository";

class InMemoryCustomerRepository implements CustomerAuthRepository {
  customer = {
    id: "customer-1",
    tenantId: "tenant-1",
    email: "customer@test.com",
    passwordHash: "hash",
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
  };
  async findTenantById() {
    return null;
  }
  async findCustomerByEmail() {
    return null;
  }
  async findCustomerById(customerId: string) {
    return customerId === "customer-1" ? this.customer : null;
  }
  async createCustomer() {
    return this.customer;
  }
  async updateCustomerLastLoginAt() {
    return;
  }
  async createCustomerSession() {
    return {
      id: "session-1",
      customerId: "customer-1",
      refreshTokenHash: "",
      expiresAt: new Date(),
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    };
  }
  async updateCustomerSessionRefreshTokenHash() {
    return;
  }
  async findCustomerSessionByRefreshTokenHash() {
    return null;
  }
  async revokeCustomerSession() {
    return;
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
    return [this.customer];
  }
  async updateCustomerProfile(input: any) {
    this.customer = {
      ...this.customer,
      firstName: input.firstName ?? this.customer.firstName,
      lastName: input.lastName ?? this.customer.lastName,
      phone: input.phone ?? this.customer.phone,
      preferences: {
        ...this.customer.preferences,
        localeCode: input.localeCode ?? this.customer.preferences.localeCode,
        currencyCode:
          input.currencyCode ?? this.customer.preferences.currencyCode,
        marketingEmailOptIn:
          input.marketingEmailOptIn ??
          this.customer.preferences.marketingEmailOptIn,
        marketingSmsOptIn:
          input.marketingSmsOptIn ??
          this.customer.preferences.marketingSmsOptIn,
      },
    };
    return this.customer;
  }
}

describe("Customer profile unit tests", () => {
  it("returns and updates customer profile", async () => {
    const repository = new InMemoryCustomerRepository();
    const service = new CustomerProfileService(repository);
    const profile = await service.getProfile("customer-1");
    expect(profile.email).toBe("customer@test.com");
    const updated = await service.updateProfile({
      customerId: "customer-1",
      firstName: "Jane",
      localeCode: "fr-FR",
    });
    expect(updated.firstName).toBe("Jane");
    expect(updated.preferences.localeCode).toBe("fr-FR");
  });
});
