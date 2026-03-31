export class TenantNotFoundError extends Error {
  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' was not found`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BootstrapAlreadyCompletedError extends Error {
  constructor(tenantId: string) {
    super(`Bootstrap owner already exists for tenant '${tenantId}'`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UserInactiveError extends Error {
  constructor(userId: string) {
    super(`User '${userId}' is inactive`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TenantInactiveError extends Error {
  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' is inactive`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CurrentUserNotFoundError extends Error {
  constructor(userId: string) {
    super(`Current user '${userId}' was not found`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
