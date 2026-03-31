import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { AdminCustomerService } from "../../../application/services/admin-customer.service";
import { UpdateAdminCustomerDto } from "../dto/update-admin-customer.dto";

@Controller("admin/customers")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminCustomersController {
  constructor(
    @Inject(AdminCustomerService)
    private readonly adminCustomerService: AdminCustomerService,
  ) {}

  @Get()
  @RequirePermission("customer.read")
  list(@AuthUser() user: AuthenticatedUser) {
    return this.adminCustomerService.listCustomers(user.tenantId);
  }

  @Get(":customerId")
  @RequirePermission("customer.read")
  getById(@Param("customerId", new ParseUUIDPipe()) customerId: string) {
    return this.adminCustomerService.getCustomer(customerId);
  }

  @Patch(":customerId")
  @RequirePermission("customer.update")
  update(
    @Param("customerId", new ParseUUIDPipe()) customerId: string,
    @Body() body: UpdateAdminCustomerDto,
  ) {
    return this.adminCustomerService.updateCustomer({ customerId, ...body });
  }
}
