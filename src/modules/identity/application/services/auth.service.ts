import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

import {
  BootstrapAlreadyCompletedError,
  CurrentUserNotFoundError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  TenantInactiveError,
  TenantNotFoundError,
  UserInactiveError,
} from "../errors/auth.errors";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { AuthUserRecord } from "../../domain/entities/auth-records";
import { IdentityAuthRepository } from "../../domain/repositories/identity-auth.repository";
import { IDENTITY_AUTH_REPOSITORY } from "../../domain/repositories/identity-auth.repository.token";

type IssueSessionInput = {
  user: AuthUserRecord;
  ipAddress?: string;
  userAgent?: string;
};

type BootstrapAdminInput = {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ipAddress?: string;
  userAgent?: string;
};

type LoginInput = {
  tenantId: string;
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
};

type RefreshInput = {
  refreshToken: string;
};

type LogoutInput = {
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(IDENTITY_AUTH_REPOSITORY)
    private readonly repository: IdentityAuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async bootstrapAdmin(input: BootstrapAdminInput) {
    const tenant = await this.repository.findTenantById(input.tenantId);

    if (!tenant) {
      throw new TenantNotFoundError(input.tenantId);
    }

    const hasBootstrapOwner = await this.repository.hasBootstrapOwner(
      input.tenantId,
    );

    if (hasBootstrapOwner) {
      throw new BootstrapAlreadyCompletedError(input.tenantId);
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = await this.repository.createBootstrapAdmin({
      tenantId: input.tenantId,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const tokens = await this.issueSession({
      user,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      user,
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await this.repository.findUserByEmail(
      input.tenantId,
      input.email,
    );

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (user.status !== "ACTIVE") {
      throw new UserInactiveError(user.id);
    }

    if (user.tenantStatus !== "ACTIVE") {
      throw new TenantInactiveError(user.tenantId);
    }

    const isValidPassword = await this.passwordService.verify(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const lastLoginAt = new Date();
    await this.repository.updateLastLoginAt(user.id, lastLoginAt);

    const nextUser = {
      ...user,
      lastLoginAt,
    };
    const tokens = await this.issueSession({
      user: nextUser,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      user: nextUser,
      ...tokens,
    };
  }

  async refresh(input: RefreshInput) {
    const tokenHash = this.hashRefreshToken(input.refreshToken);
    const refreshTokenRecord =
      await this.repository.findRefreshTokenByHash(tokenHash);

    if (!refreshTokenRecord) {
      throw new InvalidRefreshTokenError();
    }

    const payload = this.tokenService.verifyRefreshToken({
      token: input.refreshToken,
      revokedAt: refreshTokenRecord.revokedAt,
    });

    const user = await this.repository.findUserById(payload.sub);

    if (!user) {
      throw new CurrentUserNotFoundError(payload.sub);
    }

    if (user.status !== "ACTIVE") {
      throw new UserInactiveError(user.id);
    }

    if (user.tenantStatus !== "ACTIVE") {
      throw new TenantInactiveError(user.tenantId);
    }

    const tokenPair = this.tokenService.createTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      sessionId: refreshTokenRecord.sessionId,
    });

    await this.repository.storeRefreshToken({
      userId: user.id,
      sessionId: refreshTokenRecord.sessionId,
      tokenHash: this.hashRefreshToken(tokenPair.refreshToken),
      expiresAt: new Date(tokenPair.refreshPayload.exp * 1000),
    });

    return {
      user,
      ...tokenPair,
    };
  }

  async logout(input: LogoutInput) {
    const tokenHash = this.hashRefreshToken(input.refreshToken);
    const refreshTokenRecord =
      await this.repository.findRefreshTokenByHash(tokenHash);

    if (!refreshTokenRecord) {
      throw new InvalidRefreshTokenError();
    }

    await this.repository.revokeRefreshToken(refreshTokenRecord.id, new Date());
  }

  async getCurrentProfile(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new CurrentUserNotFoundError(userId);
    }

    return user;
  }

  private async issueSession(input: IssueSessionInput) {
    const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const session = await this.repository.createAuthSession({
      userId: input.user.id,
      expiresAt: sessionExpiresAt,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
    });

    const tokenPair = this.tokenService.createTokenPair({
      userId: input.user.id,
      tenantId: input.user.tenantId,
      sessionId: session.id,
    });

    await this.repository.storeRefreshToken({
      userId: input.user.id,
      sessionId: session.id,
      tokenHash: this.hashRefreshToken(tokenPair.refreshToken),
      expiresAt: new Date(tokenPair.refreshPayload.exp * 1000),
    });

    return tokenPair;
  }

  private hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
