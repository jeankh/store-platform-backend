import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  AuditLogFilters,
  AuditLogRecord,
} from "../../domain/entities/audit-log-record";
import {
  AuditRepository,
  CreateAuditLogInput,
} from "../../domain/repositories/audit.repository";

@Injectable()
export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    const log = await this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata || undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });

    return {
      id: log.id,
      tenantId: log.tenantId,
      actorUserId: log.actorUserId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: (log.metadata as Record<string, unknown> | null) || null,
      createdAt: log.createdAt,
    };
  }

  async list(filters: AuditLogFilters): Promise<AuditLogRecord[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId: filters.tenantId,
        actorUserId: filters.actorUserId,
        action: filters.action,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return logs.map((log) => ({
      id: log.id,
      tenantId: log.tenantId,
      actorUserId: log.actorUserId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: (log.metadata as Record<string, unknown> | null) || null,
      createdAt: log.createdAt,
    }));
  }
}
