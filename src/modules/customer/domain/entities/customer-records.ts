export type CustomerStatusValue = "ACTIVE" | "INACTIVE";

export type CustomerPreferenceRecord = {
  localeCode: string | null;
  currencyCode: string | null;
  marketingEmailOptIn: boolean;
  marketingSmsOptIn: boolean;
};

export type CustomerRecord = {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: CustomerStatusValue;
  isGuest: boolean;
  lastLoginAt: Date | null;
  tenantStatus: "ACTIVE" | "INACTIVE";
  preferences: CustomerPreferenceRecord;
};

export type CustomerSessionRecord = {
  id: string;
  customerId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export type CustomerAddressRecord = {
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
};
