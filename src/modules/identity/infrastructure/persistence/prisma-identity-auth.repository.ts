import { Inject, Injectable } from "@nestjs/common";
import { TenantStatus, UserStatus } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  AuthSessionRecord,
  AuthUserRecord,
  RefreshTokenRecord,
  TenantRecord,
} from "../../domain/entities/auth-records";
import {
  CreateAuthSessionInput,
  CreateBootstrapAdminInput,
  IdentityAuthRepository,
  StoreRefreshTokenInput,
} from "../../domain/repositories/identity-auth.repository";
import { SYSTEM_PERMISSIONS } from "src/modules/access-control/domain/constants/system-permissions";

@Injectable()
export class PrismaIdentityAuthRepository implements IdentityAuthRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findTenantById(tenantId: string): Promise<TenantRecord | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
    };
  }

  async hasBootstrapOwner(tenantId: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { tenantId } });

    return count > 0;
  }

  async createBootstrapAdmin(
    input: CreateBootstrapAdminInput,
  ): Promise<AuthUserRecord> {
    const user = await this.prisma.$transaction(async (tx) => {
      for (const permission of SYSTEM_PERMISSIONS) {
        await tx.permission.upsert({
          where: { code: permission.code },
          update: {
            name: permission.name,
            resource: permission.resource,
            action: permission.action,
          },
          create: permission,
        });
      }

      const user = await tx.user.create({
        data: {
          tenantId: input.tenantId,
          email: input.email,
          passwordHash: input.passwordHash,
          status: UserStatus.ACTIVE,
          staffProfile: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        },
        include: {
          tenant: true,
          staffProfile: true,
        },
      });

      const permissions = await tx.permission.findMany();
      const ownerRole = await tx.role.upsert({
        where: {
          tenantId_code: {
            tenantId: input.tenantId,
            code: "tenant_owner",
          },
        },
        update: {},
        create: {
          tenantId: input.tenantId,
          name: "Tenant Owner",
          code: "tenant_owner",
          isSystem: true,
        },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: ownerRole.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
        },
      });

      return user;
    });

    return this.mapUser(user);
  }

  async findUserByEmail(
    tenantId: string,
    email: string,
  ): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, email },
      include: {
        tenant: true,
        staffProfile: true,
      },
    });

    return user ? this.mapUser(user) : null;
  }

  async findUserById(userId: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        staffProfile: true,
      },
    });

    return user ? this.mapUser(user) : null;
  }

  async updateLastLoginAt(userId: string, lastLoginAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt },
    });
  }

  async createAuthSession(
    input: CreateAuthSessionInput,
  ): Promise<AuthSessionRecord> {
    const session = await this.prisma.authSession.create({
      data: {
        userId: input.userId,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  }

  async storeRefreshToken(
    input: StoreRefreshTokenInput,
  ): Promise<RefreshTokenRecord> {
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });

    return {
      id: refreshToken.id,
      userId: refreshToken.userId,
      sessionId: refreshToken.sessionId,
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      revokedAt: refreshToken.revokedAt,
    };
  }

  async findRefreshTokenByHash(
    tokenHash: string,
  ): Promise<RefreshTokenRecord | null> {
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
    });

    if (!refreshToken) {
      return null;
    }

    return {
      id: refreshToken.id,
      userId: refreshToken.userId,
      sessionId: refreshToken.sessionId,
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      revokedAt: refreshToken.revokedAt,
    };
  }

  async revokeRefreshToken(
    refreshTokenId: string,
    revokedAt: Date,
  ): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenId },
      data: { revokedAt },
    });
  }

  private mapUser(user: {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    status: UserStatus;
    lastLoginAt: Date | null;
    tenant: { status: TenantStatus };
    staffProfile: { firstName: string; lastName: string } | null;
  }): AuthUserRecord {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      passwordHash: user.passwordHash,
      status: user.status,
      tenantStatus: user.tenant.status,
      firstName: user.staffProfile?.firstName || "",
      lastName: user.staffProfile?.lastName || "",
      lastLoginAt: user.lastLoginAt,
    };
  }
}
