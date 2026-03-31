import { Inject, Injectable } from "@nestjs/common";

import { AuditLogFilters } from "../../domain/entities/audit-log-record";
import {
  AuditRepository,
  CreateAuditLogInput,
} from "../../domain/repositories/audit.repository";
import { AUDIT_REPOSITORY } from "../../domain/repositories/audit.repository.token";

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly repository: AuditRepository,
  ) {}

  record(input: CreateAuditLogInput) {
    return this.repository.create(input);
  }

  list(filters: AuditLogFilters) {
    return this.repository.list(filters);
  }
}
