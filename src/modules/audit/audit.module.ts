import { Module } from "@nestjs/common";

import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { AuditService } from "./application/services/audit.service";
import { AUDIT_REPOSITORY } from "./domain/repositories/audit.repository.token";
import { PrismaAuditRepository } from "./infrastructure/persistence/prisma-audit.repository";
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: AUDIT_REPOSITORY,
      useFactory: () => new PrismaAuditRepository(new PrismaService()),
    },
    AuditService,
  ],
  exports: [AuditService],
})
export class AuditModule {}
