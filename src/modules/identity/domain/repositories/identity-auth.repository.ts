import {
  AuthSessionRecord,
  AuthUserRecord,
  RefreshTokenRecord,
  TenantRecord,
} from "../entities/auth-records";

export type CreateBootstrapAdminInput = {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

export type CreateAuthSessionInput = {
  userId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type StoreRefreshTokenInput = {
  userId: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface IdentityAuthRepository {
  findTenantById(tenantId: string): Promise<TenantRecord | null>;
  hasBootstrapOwner(tenantId: string): Promise<boolean>;
  createBootstrapAdmin(
    input: CreateBootstrapAdminInput,
  ): Promise<AuthUserRecord>;
  findUserByEmail(
    tenantId: string,
    email: string,
  ): Promise<AuthUserRecord | null>;
  findUserById(userId: string): Promise<AuthUserRecord | null>;
  updateLastLoginAt(userId: string, lastLoginAt: Date): Promise<void>;
  createAuthSession(input: CreateAuthSessionInput): Promise<AuthSessionRecord>;
  storeRefreshToken(input: StoreRefreshTokenInput): Promise<RefreshTokenRecord>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(refreshTokenId: string, revokedAt: Date): Promise<void>;
}
