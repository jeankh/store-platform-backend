import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";

import { CustomerAddressRecord } from "../../domain/entities/customer-records";
import {
  CreateCustomerAddressInput,
  CustomerAuthRepository,
  UpdateCustomerAddressInput,
} from "../../domain/repositories/customer-auth.repository";
import { CUSTOMER_AUTH_REPOSITORY } from "../../domain/repositories/customer-auth.repository.token";

@Injectable()
export class CustomerAddressService {
  constructor(
    @Inject(CUSTOMER_AUTH_REPOSITORY)
    private readonly repository: CustomerAuthRepository,
  ) {}

  list(customerId: string) {
    return this.repository.listCustomerAddresses(customerId);
  }

  async create(
    input: CreateCustomerAddressInput,
  ): Promise<CustomerAddressRecord> {
    return this.repository.createCustomerAddress(input);
  }

  async update(
    input: UpdateCustomerAddressInput,
  ): Promise<CustomerAddressRecord> {
    const address = await this.repository.findCustomerAddress(input.addressId);

    if (!address || address.customerId !== input.customerId) {
      throw new NotFoundException("Customer address not found");
    }

    return this.repository.updateCustomerAddress(input);
  }

  async remove(customerId: string, addressId: string): Promise<void> {
    const address = await this.repository.findCustomerAddress(addressId);

    if (!address || address.customerId !== customerId) {
      throw new NotFoundException("Customer address not found");
    }

    await this.repository.deleteCustomerAddress(addressId);
  }
}
