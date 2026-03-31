import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

import { PasswordService } from "src/modules/identity/application/services/password.service";
import { TokenService } from "src/modules/identity/application/services/token.service";

import {
  CustomerAlreadyExistsError,
  CustomerInactiveError,
  CustomerInvalidCredentialsError,
  CustomerInvalidRefreshTokenError,
  CustomerProfileNotFoundError,
  CustomerTenantNotFoundError,
} from "../errors/customer-auth.errors";
import { CustomerRecord } from "../../domain/entities/customer-records";
import { CustomerAuthRepository } from "../../domain/repositories/customer-auth.repository";
import { CUSTOMER_AUTH_REPOSITORY } from "../../domain/repositories/customer-auth.repository.token";

@Injectable()
export class CustomerAuthService {
  constructor(
    @Inject(CUSTOMER_AUTH_REPOSITORY)
    private readonly repository: CustomerAuthRepository,
    @Inject(PasswordService)
    private readonly passwordService: PasswordService,
    @Inject(TokenService)
    private readonly tokenService: TokenService,
  ) {}

  async register(input: {
    tenantId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const tenant = await this.repository.findTenantById(input.tenantId);

    if (!tenant) {
      throw new CustomerTenantNotFoundError(input.tenantId);
    }

    const existingCustomer = await this.repository.findCustomerByEmail(
      input.tenantId,
      input.email,
    );

    if (existingCustomer) {
      throw new CustomerAlreadyExistsError(input.email);
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const customer = await this.repository.createCustomer({
      tenantId: input.tenantId,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
    });

    const tokens = await this.issueSession(
      customer,
      input.ipAddress,
      input.userAgent,
    );

    return {
      customer,
      ...tokens,
    };
  }

  async login(input: {
    tenantId: string;
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const customer = await this.repository.findCustomerByEmail(
      input.tenantId,
      input.email,
    );

    if (!customer) {
      throw new CustomerInvalidCredentialsError();
    }

    if (customer.status !== "ACTIVE") {
      throw new CustomerInactiveError(customer.id);
    }

    const isValidPassword = customer.passwordHash
      ? await this.passwordService.verify(input.password, customer.passwordHash)
      : false;

    if (!isValidPassword) {
      throw new CustomerInvalidCredentialsError();
    }

    const lastLoginAt = new Date();
    await this.repository.updateCustomerLastLoginAt(customer.id, lastLoginAt);

    const nextCustomer = {
      ...customer,
      lastLoginAt,
    };

    const tokens = await this.issueSession(
      nextCustomer,
      input.ipAddress,
      input.userAgent,
    );

    return {
      customer: nextCustomer,
      ...tokens,
    };
  }

  async refresh(input: {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const refreshTokenHash = this.hashRefreshToken(input.refreshToken);
    const session =
      await this.repository.findCustomerSessionByRefreshTokenHash(
        refreshTokenHash,
      );

    if (!session) {
      throw new CustomerInvalidRefreshTokenError();
    }

    const payload = this.tokenService.verifyRefreshToken({
      token: input.refreshToken,
      revokedAt: session.revokedAt,
    });

    const customer = await this.repository.findCustomerById(payload.sub);

    if (!customer) {
      throw new CustomerProfileNotFoundError(payload.sub);
    }

    if (customer.status !== "ACTIVE") {
      throw new CustomerInactiveError(customer.id);
    }

    await this.repository.revokeCustomerSession(session.id, new Date());

    const tokens = await this.issueSession(
      customer,
      input.ipAddress,
      input.userAgent,
    );

    return {
      customer,
      ...tokens,
    };
  }

  async logout(input: { refreshToken: string }) {
    const refreshTokenHash = this.hashRefreshToken(input.refreshToken);
    const session =
      await this.repository.findCustomerSessionByRefreshTokenHash(
        refreshTokenHash,
      );

    if (!session) {
      throw new CustomerInvalidRefreshTokenError();
    }

    await this.repository.revokeCustomerSession(session.id, new Date());
  }

  async me(customerId: string) {
    const customer = await this.repository.findCustomerById(customerId);

    if (!customer) {
      throw new CustomerProfileNotFoundError(customerId);
    }

    return customer;
  }

  private async issueSession(
    customer: CustomerRecord,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.repository.createCustomerSession({
      customerId: customer.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    const tokens = this.tokenService.createTokenPair({
      userId: customer.id,
      tenantId: customer.tenantId,
      sessionId: session.id,
    });

    const refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);

    await this.repository.updateCustomerSessionRefreshTokenHash(
      session.id,
      refreshTokenHash,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash("sha256").update(refreshToken).digest("hex");
  }
}
