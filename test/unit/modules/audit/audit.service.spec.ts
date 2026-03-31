import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { AuditRepository } from "src/modules/audit/domain/repositories/audit.repository";

class InMemoryAuditRepository implements AuditRepository {
  logs: Array<{
    id: string;
    tenantId: string;
    actorUserId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }> = [];

  async create(input: {
    tenantId: string;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }) {
    const log = {
      id: `log-${this.logs.length + 1}`,
      tenantId: input.tenantId,
      actorUserId: input.actorUserId || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata || null,
      createdAt: new Date(Date.now() + this.logs.length),
    };
    this.logs.unshift(log);
    return log;
  }

  async list(filters: {
    tenantId: string;
    actorUserId?: string;
    action?: string;
  }) {
    return this.logs.filter((log) => {
      if (log.tenantId !== filters.tenantId) return false;
      if (filters.actorUserId && log.actorUserId !== filters.actorUserId)
        return false;
      if (filters.action && log.action !== filters.action) return false;
      return true;
    });
  }
}

describe("Audit module unit tests", () => {
  it("creates an audit entry with actor, action, entity type, entity id, and metadata", async () => {
    const service = new AuditService(new InMemoryAuditRepository());
    const log = await service.record({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      action: "tenant.created",
      entityType: "tenant",
      entityId: "tenant-1",
      metadata: { slug: "tenant-1" },
    });
    expect(log.action).toBe("tenant.created");
    expect(log.metadata).toEqual({ slug: "tenant-1" });
  });

  it("allows an audit entry with optional metadata omitted", async () => {
    const service = new AuditService(new InMemoryAuditRepository());
    const log = await service.record({
      tenantId: "tenant-1",
      action: "tenant.read",
      entityType: "tenant",
      entityId: "tenant-1",
    });
    expect(log.metadata).toBeNull();
  });

  it("filters audit logs by tenant", async () => {
    const repository = new InMemoryAuditRepository();
    const service = new AuditService(repository);
    await service.record({
      tenantId: "tenant-1",
      action: "tenant.created",
      entityType: "tenant",
      entityId: "t1",
    });
    await service.record({
      tenantId: "tenant-2",
      action: "tenant.created",
      entityType: "tenant",
      entityId: "t2",
    });
    const logs = await service.list({ tenantId: "tenant-1" });
    expect(logs).toHaveLength(1);
    expect(logs[0].tenantId).toBe("tenant-1");
  });

  it("filters audit logs by actor or action when supported", async () => {
    const repository = new InMemoryAuditRepository();
    const service = new AuditService(repository);
    await service.record({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      action: "tenant.created",
      entityType: "tenant",
      entityId: "t1",
    });
    await service.record({
      tenantId: "tenant-1",
      actorUserId: "user-2",
      action: "role.assigned",
      entityType: "role",
      entityId: "r1",
    });
    const byActor = await service.list({
      tenantId: "tenant-1",
      actorUserId: "user-1",
    });
    const byAction = await service.list({
      tenantId: "tenant-1",
      action: "role.assigned",
    });
    expect(byActor).toHaveLength(1);
    expect(byAction).toHaveLength(1);
  });
});
