import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { AccessControlService } from "src/modules/access-control/application/services/access-control.service";
import { AccessControlRepository } from "src/modules/access-control/domain/repositories/access-control.repository";
import { AuditService } from "src/modules/audit/application/services/audit.service";

class InMemoryAccessControlRepository implements AccessControlRepository {
  permissions = [
    {
      id: "p1",
      code: "role.read",
      name: "Read role",
      resource: "role",
      action: "read",
    },
    {
      id: "p2",
      code: "role.create",
      name: "Create role",
      resource: "role",
      action: "create",
    },
    {
      id: "p3",
      code: "user.assign_role",
      name: "Assign role",
      resource: "user",
      action: "assign_role",
    },
  ];
  roles: Array<{
    id: string;
    tenantId: string;
    name: string;
    code: string;
    isSystem: boolean;
    permissionCodes: string[];
  }> = [];
  userPermissions = new Map<string, string[]>();

  async seedSystemPermissions() {
    return;
  }

  async listPermissions() {
    return this.permissions;
  }

  async createRole(input: {
    tenantId: string;
    name: string;
    code: string;
    permissionCodes: string[];
    isSystem?: boolean;
  }) {
    const existingRole = this.roles.find(
      (role) => role.tenantId === input.tenantId && role.code === input.code,
    );
    if (existingRole) {
      throw new Error("duplicate role");
    }

    const role = {
      id: `role-${this.roles.length + 1}`,
      tenantId: input.tenantId,
      name: input.name,
      code: input.code,
      isSystem: input.isSystem || false,
      permissionCodes: input.permissionCodes,
    };
    this.roles.push(role);
    return role;
  }

  async listRoles(tenantId: string) {
    return this.roles.filter((role) => role.tenantId === tenantId);
  }

  async assignRole(input: {
    userId: string;
    roleId: string;
    tenantId: string;
  }) {
    const role = this.roles.find((entry) => entry.id === input.roleId);
    if (!role || role.tenantId !== input.tenantId) {
      throw new Error("invalid role assignment");
    }

    this.userPermissions.set(input.userId, [...role.permissionCodes]);
  }

  async getUserPermissionCodes(userId: string) {
    return this.userPermissions.get(userId) || [];
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Access control module unit tests", () => {
  it("seeds system permissions", async () => {
    const service = new AccessControlService(
      new InMemoryAccessControlRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await expect(service.seedSystemPermissions()).resolves.toBeUndefined();
  });

  it("creates a tenant role with a valid name and code", async () => {
    const service = new AccessControlService(
      new InMemoryAccessControlRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const role = await service.createRole("user-1", {
      tenantId: "tenant-1",
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });
    expect(role.code).toBe("manager");
  });

  it("rejects a duplicate role code within a tenant", async () => {
    const service = new AccessControlService(
      new InMemoryAccessControlRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createRole("user-1", {
      tenantId: "tenant-1",
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });
    await expect(
      service.createRole("user-1", {
        tenantId: "tenant-1",
        name: "Manager 2",
        code: "manager",
        permissionCodes: ["role.read"],
      }),
    ).rejects.toThrow("duplicate role");
  });

  it("assigns a role to a user", async () => {
    const service = new AccessControlService(
      new InMemoryAccessControlRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const role = await service.createRole("user-1", {
      tenantId: "tenant-1",
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });
    await service.assignRole("user-1", {
      tenantId: "tenant-1",
      userId: "user-2",
      roleId: role.id,
    });
    await expect(
      service.ensurePermission("user-2", "role.read"),
    ).resolves.toBeUndefined();
  });

  it("rejects assigning a role from another tenant", async () => {
    const service = new AccessControlService(
      new InMemoryAccessControlRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const role = await service.createRole("user-1", {
      tenantId: "tenant-1",
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });
    await expect(
      service.assignRole("user-1", {
        tenantId: "tenant-2",
        userId: "user-2",
        roleId: role.id,
      }),
    ).rejects.toThrow("Role not found");
  });

  it("resolves a user effective permission set from assigned roles", async () => {
    const service = new AccessControlService(
      new InMemoryAccessControlRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const role = await service.createRole("user-1", {
      tenantId: "tenant-1",
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read", "role.create"],
    });
    await service.assignRole("user-1", {
      tenantId: "tenant-1",
      userId: "user-2",
      roleId: role.id,
    });
    await expect(
      service.ensurePermission("user-2", "role.create"),
    ).resolves.toBeUndefined();
  });

  it("allows a request when the required permission is present", async () => {
    const repository = new InMemoryAccessControlRepository();
    repository.userPermissions.set("user-1", ["role.read"]);
    const service = new AccessControlService(
      repository,
      new AuditServiceStub() as unknown as AuditService,
    );
    await expect(
      service.ensurePermission("user-1", "role.read"),
    ).resolves.toBeUndefined();
  });

  it("denies a request when the required permission is absent", async () => {
    const service = new AccessControlService(
      new InMemoryAccessControlRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await expect(
      service.ensurePermission("user-1", "role.read"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
