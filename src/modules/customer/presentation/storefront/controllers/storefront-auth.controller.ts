import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthCustomer } from "../auth-customer.decorator";
import { AuthenticatedCustomer } from "../authenticated-customer.interface";
import { CustomerAccessTokenGuard } from "../customer-access-token.guard";
import { LoginCustomerDto } from "../dto/login-customer.dto";
import { LogoutCustomerDto } from "../dto/logout-customer.dto";
import { RefreshCustomerTokenDto } from "../dto/refresh-customer-token.dto";
import { RegisterCustomerDto } from "../dto/register-customer.dto";
import { CustomerAuthService } from "../../../application/services/customer-auth.service";

@Controller("storefront/auth")
export class StorefrontAuthController {
  constructor(
    @Inject(CustomerAuthService)
    private readonly customerAuthService: CustomerAuthService,
  ) {}

  @Post("register")
  register(@Body() body: RegisterCustomerDto) {
    return this.customerAuthService.register(body);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() body: LoginCustomerDto) {
    return this.customerAuthService.login(body);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() body: RefreshCustomerTokenDto) {
    return this.customerAuthService.refresh(body);
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Body() body: LogoutCustomerDto) {
    await this.customerAuthService.logout(body);
  }

  @Get("me")
  @UseGuards(CustomerAccessTokenGuard)
  me(@AuthCustomer() customer: AuthenticatedCustomer) {
    return this.customerAuthService.me(customer.customerId);
  }
}
