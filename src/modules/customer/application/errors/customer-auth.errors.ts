export class CustomerTenantNotFoundError extends Error {
  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' was not found`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CustomerAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Customer '${email}' already exists`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CustomerInvalidCredentialsError extends Error {
  constructor() {
    super("Invalid customer credentials");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CustomerInactiveError extends Error {
  constructor(customerId: string) {
    super(`Customer '${customerId}' is inactive`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CustomerProfileNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer '${customerId}' was not found`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CustomerInvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid customer refresh token");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
