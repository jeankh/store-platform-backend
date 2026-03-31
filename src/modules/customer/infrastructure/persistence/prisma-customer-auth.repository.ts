import { Injectable } from "@nestjs/common";
import { CustomerStatus, TenantStatus } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  CustomerAddressRecord,
  CustomerRecord,
  CustomerSessionRecord,
} from "../../domain/entities/customer-records";
import {
  CreateCustomerAddressInput,
  CreateCustomerInput,
  CreateCustomerSessionInput,
  CustomerAuthRepository,
  UpdateCustomerAddressInput,
  UpdateCustomerProfileInput,
} from "../../domain/repositories/customer-auth.repository";

@Injectable()
export class PrismaCustomerAuthRepository implements CustomerAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTenantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    return tenant ? { id: tenant.id, status: tenant.status } : null;
  }

  async findCustomerByEmail(
    tenantId: string,
    email: string,
  ): Promise<CustomerRecord | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, email },
      include: { tenant: true, preferences: true },
    });

    return customer ? this.mapCustomer(customer) : null;
  }

  async findCustomerById(customerId: string): Promise<CustomerRecord | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { tenant: true, preferences: true },
    });

    return customer ? this.mapCustomer(customer) : null;
  }

  async createCustomer(input: CreateCustomerInput): Promise<CustomerRecord> {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId: input.tenantId,
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        preferences: {
          create: {},
        },
      },
      include: { tenant: true, preferences: true },
    });

    return this.mapCustomer(customer);
  }

  async updateCustomerLastLoginAt(
    customerId: string,
    lastLoginAt: Date,
  ): Promise<void> {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { lastLoginAt },
    });
  }

  async createCustomerSession(
    input: CreateCustomerSessionInput,
  ): Promise<CustomerSessionRecord> {
    const session = await this.prisma.customerSession.create({
      data: {
        customerId: input.customerId,
        refreshTokenHash: "",
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    return this.mapSession(session);
  }

  async updateCustomerSessionRefreshTokenHash(
    sessionId: string,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { refreshTokenHash },
    });
  }

  async findCustomerSessionByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<CustomerSessionRecord | null> {
    const session = await this.prisma.customerSession.findFirst({
      where: { refreshTokenHash },
    });
    return session ? this.mapSession(session) : null;
  }

  async revokeCustomerSession(
    sessionId: string,
    revokedAt: Date,
  ): Promise<void> {
    await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { revokedAt },
    });
  }

  async updateCustomerProfile(
    input: UpdateCustomerProfileInput,
  ): Promise<CustomerRecord> {
    const customer = await this.prisma.customer.update({
      where: { id: input.customerId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        preferences: {
          upsert: {
            update: {
              localeCode: input.localeCode,
              currencyCode: input.currencyCode,
              marketingEmailOptIn: input.marketingEmailOptIn,
              marketingSmsOptIn: input.marketingSmsOptIn,
            },
            create: {
              localeCode: input.localeCode,
              currencyCode: input.currencyCode,
              marketingEmailOptIn: input.marketingEmailOptIn || false,
              marketingSmsOptIn: input.marketingSmsOptIn || false,
            },
          },
        },
      },
      include: { tenant: true, preferences: true },
    });

    return this.mapCustomer(customer);
  }

  async listCustomerAddresses(
    customerId: string,
  ): Promise<CustomerAddressRecord[]> {
    const addresses = await this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "asc" }],
    });

    return addresses.map((address) => this.mapAddress(address));
  }

  async findCustomerAddress(
    addressId: string,
  ): Promise<CustomerAddressRecord | null> {
    const address = await this.prisma.customerAddress.findUnique({
      where: { id: addressId },
    });
    return address ? this.mapAddress(address) : null;
  }

  async createCustomerAddress(
    input: CreateCustomerAddressInput,
  ): Promise<CustomerAddressRecord> {
    const address = await this.prisma.$transaction(async (tx) => {
      if (input.isDefaultShipping) {
        await tx.customerAddress.updateMany({
          where: { customerId: input.customerId },
          data: { isDefaultShipping: false },
        });
      }

      if (input.isDefaultBilling) {
        await tx.customerAddress.updateMany({
          where: { customerId: input.customerId },
          data: { isDefaultBilling: false },
        });
      }

      return tx.customerAddress.create({
        data: {
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
        },
      });
    });

    return this.mapAddress(address);
  }

  async updateCustomerAddress(
    input: UpdateCustomerAddressInput,
  ): Promise<CustomerAddressRecord> {
    const address = await this.prisma.$transaction(async (tx) => {
      if (input.isDefaultShipping) {
        await tx.customerAddress.updateMany({
          where: { customerId: input.customerId },
          data: { isDefaultShipping: false },
        });
      }

      if (input.isDefaultBilling) {
        await tx.customerAddress.updateMany({
          where: { customerId: input.customerId },
          data: { isDefaultBilling: false },
        });
      }

      return tx.customerAddress.update({
        where: { id: input.addressId },
        data: {
          label: input.label,
          firstName: input.firstName,
          lastName: input.lastName,
          company: input.company,
          line1: input.line1,
          line2: input.line2,
          city: input.city,
          region: input.region,
          postalCode: input.postalCode,
          countryCode: input.countryCode,
          phone: input.phone,
          isDefaultShipping: input.isDefaultShipping,
          isDefaultBilling: input.isDefaultBilling,
        },
      });
    });

    return this.mapAddress(address);
  }

  async deleteCustomerAddress(addressId: string): Promise<void> {
    await this.prisma.customerAddress.delete({ where: { id: addressId } });
  }

  async listCustomers(tenantId: string): Promise<CustomerRecord[]> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      include: { tenant: true, preferences: true },
      orderBy: { createdAt: "asc" },
    });

    return customers.map((customer) => this.mapCustomer(customer));
  }

  private mapCustomer(customer: {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: CustomerStatus;
    isGuest: boolean;
    lastLoginAt: Date | null;
    tenant: { status: TenantStatus };
    preferences: {
      localeCode: string | null;
      currencyCode: string | null;
      marketingEmailOptIn: boolean;
      marketingSmsOptIn: boolean;
    } | null;
  }): CustomerRecord {
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      email: customer.email,
      passwordHash: customer.passwordHash,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      status: customer.status,
      isGuest: customer.isGuest,
      lastLoginAt: customer.lastLoginAt,
      tenantStatus: customer.tenant.status,
      preferences: {
        localeCode: customer.preferences?.localeCode || null,
        currencyCode: customer.preferences?.currencyCode || null,
        marketingEmailOptIn: customer.preferences?.marketingEmailOptIn || false,
        marketingSmsOptIn: customer.preferences?.marketingSmsOptIn || false,
      },
    };
  }

  private mapSession(session: {
    id: string;
    customerId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): CustomerSessionRecord {
    return {
      id: session.id,
      customerId: session.customerId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  }

  private mapAddress(address: {
    id: string;
    customerId: string;
    label: string | null;
    firstName: string;
    lastName: string;
    company: string | null;
    line1: string;
    line2: string | null;
    city: string;
    region: string | null;
    postalCode: string;
    countryCode: string;
    phone: string | null;
    isDefaultShipping: boolean;
    isDefaultBilling: boolean;
  }): CustomerAddressRecord {
    return {
      id: address.id,
      customerId: address.customerId,
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      phone: address.phone,
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    };
  }
}
