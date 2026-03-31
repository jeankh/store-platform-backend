export type IdentityStatus = "ACTIVE" | "INACTIVE";

export type TenantRecord = {
  id: string;
  slug: string;
  name: string;
  status: IdentityStatus;
};

export type AuthUserRecord = {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  status: IdentityStatus;
  tenantStatus: IdentityStatus;
  firstName: string;
  lastName: string;
  lastLoginAt: Date | null;
};

export type AuthSessionRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};
