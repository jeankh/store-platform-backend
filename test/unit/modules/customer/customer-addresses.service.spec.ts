import { describe, expect, it } from "vitest";

import { CustomerAddressService } from "src/modules/customer/application/services/customer-address.service";
import { CustomerAuthRepository } from "src/modules/customer/domain/repositories/customer-auth.repository";

class InMemoryCustomerRepository implements CustomerAuthRepository {
  addresses = new Map<string, any>();
  async findTenantById() {
    return null;
  }
  async findCustomerByEmail() {
    return null;
  }
  async findCustomerById() {
    return null;
  }
  async createCustomer() {
    return {
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
  async updateCustomerProfile() {
    return {
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
  }
  async listCustomerAddresses(customerId: string) {
    return Array.from(this.addresses.values()).filter(
      (address) => address.customerId === customerId,
    );
  }
  async findCustomerAddress(addressId: string) {
    return this.addresses.get(addressId) || null;
  }
  async createCustomerAddress(input: any) {
    const address = {
      id: `address-${this.addresses.size + 1}`,
      customerId: input.customerId,
      label: input.label || null,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company || null,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      region: input.region || null,
      postalCode: input.postalCode,
      countryCode: input.countryCode,
      phone: input.phone || null,
      isDefaultShipping: input.isDefaultShipping || false,
      isDefaultBilling: input.isDefaultBilling || false,
    };
    if (address.isDefaultShipping || address.isDefaultBilling) {
      for (const [id, current] of this.addresses.entries()) {
        if (current.customerId === input.customerId)
          this.addresses.set(id, {
            ...current,
            isDefaultShipping: address.isDefaultShipping
              ? false
              : current.isDefaultShipping,
            isDefaultBilling: address.isDefaultBilling
              ? false
              : current.isDefaultBilling,
          });
      }
    }
    this.addresses.set(address.id, address);
    return address;
  }
  async updateCustomerAddress(input: any) {
    const current = this.addresses.get(input.addressId);
    const next = { ...current, ...input };
    if (input.isDefaultShipping || input.isDefaultBilling) {
      for (const [id, existing] of this.addresses.entries()) {
        if (existing.customerId === input.customerId)
          this.addresses.set(id, {
            ...existing,
            isDefaultShipping: input.isDefaultShipping
              ? false
              : existing.isDefaultShipping,
            isDefaultBilling: input.isDefaultBilling
              ? false
              : existing.isDefaultBilling,
          });
      }
    }
    this.addresses.set(input.addressId, next);
    return next;
  }
  async deleteCustomerAddress(addressId: string) {
    this.addresses.delete(addressId);
  }
  async listCustomers() {
    return [];
  }
}

describe("Customer addresses unit tests", () => {
  it("adds customer address", async () => {
    const service = new CustomerAddressService(
      new InMemoryCustomerRepository(),
    );
    const address = await service.create({
      customerId: "customer-1",
      firstName: "John",
      lastName: "Doe",
      line1: "123 Street",
      city: "Paris",
      postalCode: "75001",
      countryCode: "FR",
    });
    expect(address.customerId).toBe("customer-1");
  });

  it("sets default shipping and billing correctly", async () => {
    const repository = new InMemoryCustomerRepository();
    const service = new CustomerAddressService(repository);
    await service.create({
      customerId: "customer-1",
      firstName: "John",
      lastName: "Doe",
      line1: "123 Street",
      city: "Paris",
      postalCode: "75001",
      countryCode: "FR",
      isDefaultShipping: true,
    });
    const second = await service.create({
      customerId: "customer-1",
      firstName: "Jane",
      lastName: "Doe",
      line1: "456 Street",
      city: "Paris",
      postalCode: "75002",
      countryCode: "FR",
      isDefaultShipping: true,
      isDefaultBilling: true,
    });
    const addresses = await service.list("customer-1");
    expect(
      addresses.filter((address) => address.isDefaultShipping),
    ).toHaveLength(1);
    expect(addresses.find((address) => address.isDefaultShipping)?.id).toBe(
      second.id,
    );
    expect(addresses.find((address) => address.isDefaultBilling)?.id).toBe(
      second.id,
    );
  });

  it("rejects cross-customer address access", async () => {
    const repository = new InMemoryCustomerRepository();
    const service = new CustomerAddressService(repository);
    const address = await service.create({
      customerId: "customer-1",
      firstName: "John",
      lastName: "Doe",
      line1: "123 Street",
      city: "Paris",
      postalCode: "75001",
      countryCode: "FR",
    });
    await expect(
      service.update({
        addressId: address.id,
        customerId: "customer-2",
        city: "Lyon",
      }),
    ).rejects.toThrow("Customer address not found");
  });
});
