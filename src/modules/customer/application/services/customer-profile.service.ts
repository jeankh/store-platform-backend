import { Inject, Injectable } from "@nestjs/common";

import { CustomerProfileNotFoundError } from "../errors/customer-auth.errors";
import {
  CustomerAuthRepository,
  UpdateCustomerProfileInput,
} from "../../domain/repositories/customer-auth.repository";
import { CUSTOMER_AUTH_REPOSITORY } from "../../domain/repositories/customer-auth.repository.token";

@Injectable()
export class CustomerProfileService {
  constructor(
    @Inject(CUSTOMER_AUTH_REPOSITORY)
    private readonly repository: CustomerAuthRepository,
  ) {}

  async getProfile(customerId: string) {
    const customer = await this.repository.findCustomerById(customerId);

    if (!customer) {
      throw new CustomerProfileNotFoundError(customerId);
    }

    return customer;
  }

  updateProfile(input: UpdateCustomerProfileInput) {
    return this.repository.updateCustomerProfile(input);
  }
}
