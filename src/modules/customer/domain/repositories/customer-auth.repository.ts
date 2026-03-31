import {
  CustomerAddressRecord,
  CustomerRecord,
  CustomerSessionRecord,
} from "../entities/customer-records";

export type CreateCustomerInput = {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

export type CreateCustomerSessionInput = {
  customerId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type UpdateCustomerProfileInput = {
  customerId: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  localeCode?: string | null;
  currencyCode?: string | null;
  marketingEmailOptIn?: boolean;
  marketingSmsOptIn?: boolean;
};

export type CreateCustomerAddressInput = {
  customerId: string;
  label?: string | null;
  firstName: string;
  lastName: string;
  company?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode: string;
  countryCode: string;
  phone?: string | null;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type UpdateCustomerAddressInput = {
  addressId: string;
  customerId: string;
  label?: string | null;
  firstName?: string;
  lastName?: string;
  company?: string | null;
  line1?: string;
  line2?: string | null;
  city?: string;
  region?: string | null;
  postalCode?: string;
  countryCode?: string;
  phone?: string | null;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export interface CustomerAuthRepository {
  findTenantById(
    tenantId: string,
  ): Promise<{ id: string; status: "ACTIVE" | "INACTIVE" } | null>;
  findCustomerByEmail(
    tenantId: string,
    email: string,
  ): Promise<CustomerRecord | null>;
  findCustomerById(customerId: string): Promise<CustomerRecord | null>;
  createCustomer(input: CreateCustomerInput): Promise<CustomerRecord>;
  updateCustomerLastLoginAt(
    customerId: string,
    lastLoginAt: Date,
  ): Promise<void>;
  createCustomerSession(
    input: CreateCustomerSessionInput,
  ): Promise<CustomerSessionRecord>;
  updateCustomerSessionRefreshTokenHash(
    sessionId: string,
    refreshTokenHash: string,
  ): Promise<void>;
  findCustomerSessionByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<CustomerSessionRecord | null>;
  revokeCustomerSession(sessionId: string, revokedAt: Date): Promise<void>;
  updateCustomerProfile(
    input: UpdateCustomerProfileInput,
  ): Promise<CustomerRecord>;
  listCustomerAddresses(customerId: string): Promise<CustomerAddressRecord[]>;
  findCustomerAddress(addressId: string): Promise<CustomerAddressRecord | null>;
  createCustomerAddress(
    input: CreateCustomerAddressInput,
  ): Promise<CustomerAddressRecord>;
  updateCustomerAddress(
    input: UpdateCustomerAddressInput,
  ): Promise<CustomerAddressRecord>;
  deleteCustomerAddress(addressId: string): Promise<void>;
  listCustomers(tenantId: string): Promise<CustomerRecord[]>;
}
