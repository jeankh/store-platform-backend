export type AuditLogRecord = {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type AuditLogFilters = {
  tenantId: string;
  actorUserId?: string;
  action?: string;
};
