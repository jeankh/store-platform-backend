import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { AuthService } from "src/modules/identity/application/services/auth.service";
import { PasswordService } from "src/modules/identity/application/services/password.service";
import { TokenService } from "src/modules/identity/application/services/token.service";
import {
  AuthSessionRecord,
  AuthUserRecord,
  RefreshTokenRecord,
  TenantRecord,
} from "src/modules/identity/domain/entities/auth-records";
import {
  CreateAuthSessionInput,
  CreateBootstrapAdminInput,
  IdentityAuthRepository,
  StoreRefreshTokenInput,
} from "src/modules/identity/domain/repositories/identity-auth.repository";

class InMemoryIdentityAuthRepository implements IdentityAuthRepository {
  tenants = new Map<string, TenantRecord>();
  users = new Map<string, AuthUserRecord>();
  sessions = new Map<string, AuthSessionRecord>();
  refreshTokens = new Map<string, RefreshTokenRecord>();
  bootstrapOwners = new Set<string>();

  async findTenantById(tenantId: string) {
    return this.tenants.get(tenantId) || null;
  }

  async hasBootstrapOwner(tenantId: string) {
    return this.bootstrapOwners.has(tenantId);
  }

  async createBootstrapAdmin(input: CreateBootstrapAdminInput) {
    const user: AuthUserRecord = {
      id: randomUUID(),
      tenantId: input.tenantId,
      email: input.email,
      passwordHash: input.passwordHash,
      status: "ACTIVE",
      tenantStatus: "ACTIVE",
      firstName: input.firstName,
      lastName: input.lastName,
      lastLoginAt: null,
    };

    this.users.set(user.id, user);
    this.bootstrapOwners.add(input.tenantId);

    return user;
  }

  async findUserByEmail(tenantId: string, email: string) {
    return (
      Array.from(this.users.values()).find(
        (user) => user.tenantId === tenantId && user.email === email,
      ) || null
    );
  }

  async findUserById(userId: string) {
    return this.users.get(userId) || null;
  }

  async updateLastLoginAt(userId: string, lastLoginAt: Date) {
    const user = this.users.get(userId);

    if (!user) {
      return;
    }

    this.users.set(userId, {
      ...user,
      lastLoginAt,
    });
  }

  async createAuthSession(input: CreateAuthSessionInput) {
    const session: AuthSessionRecord = {
      id: randomUUID(),
      userId: input.userId,
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    };

    this.sessions.set(session.id, session);

    return session;
  }

  async storeRefreshToken(input: StoreRefreshTokenInput) {
    const refreshToken: RefreshTokenRecord = {
      id: randomUUID(),
      userId: input.userId,
      sessionId: input.sessionId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };

    this.refreshTokens.set(refreshToken.id, refreshToken);

    return refreshToken;
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return (
      Array.from(this.refreshTokens.values()).find(
        (refreshToken) => refreshToken.tokenHash === tokenHash,
      ) || null
    );
  }

  async revokeRefreshToken(refreshTokenId: string, revokedAt: Date) {
    const refreshToken = this.refreshTokens.get(refreshTokenId);

    if (!refreshToken) {
      return;
    }

    this.refreshTokens.set(refreshTokenId, {
      ...refreshToken,
      revokedAt,
    });
  }
}

async function createIdentityHarness() {
  const repository = new InMemoryIdentityAuthRepository();
  const passwordService = new PasswordService();
  const tokenService = new TokenService();
  const tenant: TenantRecord = {
    id: "tenant-1",
    slug: "tenant-1",
    name: "Tenant 1",
    status: "ACTIVE",
  };

  repository.tenants.set(tenant.id, tenant);

  return {
    repository,
    passwordService,
    tokenService,
    authService: new AuthService(repository, passwordService, tokenService),
    tenant,
  };
}

describe("Identity module unit tests", () => {
  describe("password and token logic", () => {
    it("hashes a password before storage", async () => {
      const service = new PasswordService();
      const hashedPassword = await service.hash("super-secret-password");

      expect(hashedPassword).not.toBe("super-secret-password");
      expect(hashedPassword).toContain(":");
    });

    it("verifies a correct password successfully", async () => {
      const service = new PasswordService();
      const hashedPassword = await service.hash("super-secret-password");

      await expect(
        service.verify("super-secret-password", hashedPassword),
      ).resolves.toBe(true);
    });

    it("rejects an incorrect password", async () => {
      const service = new PasswordService();
      const hashedPassword = await service.hash("super-secret-password");

      await expect(
        service.verify("wrong-password", hashedPassword),
      ).resolves.toBe(false);
    });

    it("creates access and refresh tokens with expected payload fields", () => {
      const service = new TokenService();
      const tokenPair = service.createTokenPair({
        userId: "user-1",
        tenantId: "tenant-1",
        sessionId: "session-1",
      });

      expect(tokenPair.accessToken).toContain(".");
      expect(tokenPair.refreshToken).toContain(".");
      expect(tokenPair.accessPayload.sub).toBe("user-1");
      expect(tokenPair.accessPayload.tenantId).toBe("tenant-1");
      expect(tokenPair.accessPayload.sessionId).toBe("session-1");
      expect(tokenPair.accessPayload.type).toBe("access");
      expect(tokenPair.refreshPayload.type).toBe("refresh");
      expect(tokenPair.refreshPayload.exp).toBeGreaterThan(
        tokenPair.accessPayload.exp,
      );

      expect(service.verifyAccessToken(tokenPair.accessToken)).toMatchObject({
        sub: "user-1",
        tenantId: "tenant-1",
        sessionId: "session-1",
        type: "access",
      });
    });

    it("rejects refresh when token is expired or revoked", () => {
      const service = new TokenService();
      const expiredTokenPair = service.createTokenPair({
        userId: "user-1",
        tenantId: "tenant-1",
        sessionId: "session-1",
        refreshTtlSeconds: -10,
      });

      expect(() =>
        service.verifyRefreshToken({
          token: expiredTokenPair.refreshToken,
        }),
      ).toThrow("Token has expired");

      const validTokenPair = service.createTokenPair({
        userId: "user-1",
        tenantId: "tenant-1",
        sessionId: "session-1",
      });

      expect(() =>
        service.verifyRefreshToken({
          token: validTokenPair.refreshToken,
          revokedAt: new Date(),
        }),
      ).toThrow("Refresh token has been revoked");
    });
  });

  describe("auth use cases", () => {
    it("bootstraps the first tenant admin successfully", async () => {
      const { authService, repository, passwordService, tenant } =
        await createIdentityHarness();

      const result = await authService.bootstrapAdmin({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Tenant",
        lastName: "Owner",
      });

      expect(result.user.email).toBe("owner@tenant.test");
      expect(result.accessToken).toContain(".");
      expect(result.refreshToken).toContain(".");
      await expect(
        passwordService.verify(
          "super-secret-password",
          result.user.passwordHash,
        ),
      ).resolves.toBe(true);
      expect(repository.sessions.size).toBe(1);
      expect(repository.refreshTokens.size).toBe(1);
    });

    it("rejects bootstrap when tenant does not exist", async () => {
      const { authService } = await createIdentityHarness();

      await expect(
        authService.bootstrapAdmin({
          tenantId: "missing-tenant",
          email: "owner@tenant.test",
          password: "super-secret-password",
          firstName: "Tenant",
          lastName: "Owner",
        }),
      ).rejects.toThrow("Tenant 'missing-tenant' was not found");
    });

    it("rejects bootstrap if a bootstrap owner already exists for the tenant", async () => {
      const { authService, repository, tenant } = await createIdentityHarness();
      repository.bootstrapOwners.add(tenant.id);

      await expect(
        authService.bootstrapAdmin({
          tenantId: tenant.id,
          email: "owner@tenant.test",
          password: "super-secret-password",
          firstName: "Tenant",
          lastName: "Owner",
        }),
      ).rejects.toThrow(
        `Bootstrap owner already exists for tenant '${tenant.id}'`,
      );
    });

    it("logs in with valid credentials", async () => {
      const { authService, repository, passwordService, tenant } =
        await createIdentityHarness();
      const passwordHash = await passwordService.hash("super-secret-password");
      const user: AuthUserRecord = {
        id: "user-1",
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash,
        status: "ACTIVE",
        tenantStatus: "ACTIVE",
        firstName: "Tenant",
        lastName: "Owner",
        lastLoginAt: null,
      };

      repository.users.set(user.id, user);

      const result = await authService.login({
        tenantId: tenant.id,
        email: user.email,
        password: "super-secret-password",
      });

      expect(result.user.id).toBe(user.id);
      expect(result.user.lastLoginAt).toBeInstanceOf(Date);
      expect(result.accessPayload.sub).toBe(user.id);
      expect(repository.sessions.size).toBe(1);
      expect(repository.refreshTokens.size).toBe(1);
    });

    it("rejects login for invalid email or password", async () => {
      const { authService, repository, passwordService, tenant } =
        await createIdentityHarness();

      repository.users.set("user-1", {
        id: "user-1",
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: await passwordService.hash("super-secret-password"),
        status: "ACTIVE",
        tenantStatus: "ACTIVE",
        firstName: "Tenant",
        lastName: "Owner",
        lastLoginAt: null,
      });

      await expect(
        authService.login({
          tenantId: tenant.id,
          email: "missing@tenant.test",
          password: "super-secret-password",
        }),
      ).rejects.toThrow("Invalid credentials");

      await expect(
        authService.login({
          tenantId: tenant.id,
          email: "owner@tenant.test",
          password: "wrong-password",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("rejects login for inactive user", async () => {
      const { authService, repository, passwordService, tenant } =
        await createIdentityHarness();

      repository.users.set("user-1", {
        id: "user-1",
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: await passwordService.hash("super-secret-password"),
        status: "INACTIVE",
        tenantStatus: "ACTIVE",
        firstName: "Tenant",
        lastName: "Owner",
        lastLoginAt: null,
      });

      await expect(
        authService.login({
          tenantId: tenant.id,
          email: "owner@tenant.test",
          password: "super-secret-password",
        }),
      ).rejects.toThrow("User 'user-1' is inactive");
    });

    it("rejects login for inactive tenant", async () => {
      const { authService, repository, passwordService, tenant } =
        await createIdentityHarness();

      repository.users.set("user-1", {
        id: "user-1",
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: await passwordService.hash("super-secret-password"),
        status: "ACTIVE",
        tenantStatus: "INACTIVE",
        firstName: "Tenant",
        lastName: "Owner",
        lastLoginAt: null,
      });

      await expect(
        authService.login({
          tenantId: tenant.id,
          email: "owner@tenant.test",
          password: "super-secret-password",
        }),
      ).rejects.toThrow(`Tenant '${tenant.id}' is inactive`);
    });

    it("returns the current authenticated profile", async () => {
      const { authService, repository, passwordService, tenant } =
        await createIdentityHarness();
      const user: AuthUserRecord = {
        id: "user-1",
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: await passwordService.hash("super-secret-password"),
        status: "ACTIVE",
        tenantStatus: "ACTIVE",
        firstName: "Tenant",
        lastName: "Owner",
        lastLoginAt: null,
      };

      repository.users.set(user.id, user);

      await expect(authService.getCurrentProfile(user.id)).resolves.toEqual(
        user,
      );
      await expect(
        authService.getCurrentProfile("missing-user"),
      ).rejects.toThrow("Current user 'missing-user' was not found");
    });

    it("revokes the current refresh token on logout", async () => {
      const { authService, repository, passwordService, tenant } =
        await createIdentityHarness();

      repository.users.set("user-1", {
        id: "user-1",
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: await passwordService.hash("super-secret-password"),
        status: "ACTIVE",
        tenantStatus: "ACTIVE",
        firstName: "Tenant",
        lastName: "Owner",
        lastLoginAt: null,
      });

      const loginResult = await authService.login({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
      });

      await authService.logout({
        refreshToken: loginResult.refreshToken,
      });

      const refreshTokenRecord = Array.from(
        repository.refreshTokens.values(),
      )[0];

      expect(refreshTokenRecord.revokedAt).toBeInstanceOf(Date);

      await expect(
        authService.refresh({
          refreshToken: loginResult.refreshToken,
        }),
      ).rejects.toThrow("Refresh token has been revoked");

      await expect(
        authService.logout({
          refreshToken: "invalid-refresh-token",
        }),
      ).rejects.toThrow("Invalid refresh token");
    });
  });
});
