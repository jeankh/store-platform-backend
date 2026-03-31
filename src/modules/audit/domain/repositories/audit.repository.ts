import { AuditLogFilters, AuditLogRecord } from "../entities/audit-log-record";

export type CreateAuditLogInput = {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export interface AuditRepository {
  create(input: CreateAuditLogInput): Promise<AuditLogRecord>;
  list(filters: AuditLogFilters): Promise<AuditLogRecord[]>;
}
