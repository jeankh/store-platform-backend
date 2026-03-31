import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import {
  CustomerAuthRepository,
  UpdateCustomerProfileInput,
} from "../../domain/repositories/customer-auth.repository";
import { CUSTOMER_AUTH_REPOSITORY } from "../../domain/repositories/customer-auth.repository.token";

@Injectable()
export class AdminCustomerService {
  constructor(
    @Inject(CUSTOMER_AUTH_REPOSITORY)
    private readonly repository: CustomerAuthRepository,
  ) {}

  listCustomers(tenantId: string) {
    return this.repository.listCustomers(tenantId);
  }

  async getCustomer(customerId: string) {
    const customer = await this.repository.findCustomerById(customerId);

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    return customer;
  }

  async updateCustomer(input: UpdateCustomerProfileInput) {
    const customer = await this.repository.findCustomerById(input.customerId);

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    return this.repository.updateCustomerProfile(input);
  }
}
