import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { StoreService } from "../../../application/services/store.service";
import { CreateStoreDto } from "../dto/create-store.dto";
import { AddStoreCurrencyDto } from "../dto/add-store-currency.dto";
import { AddStoreLocaleDto } from "../dto/add-store-locale.dto";
import { UpdateStoreDto } from "../dto/update-store.dto";
import { UpdateStoreSettingsDto } from "../dto/update-store-settings.dto";
import { UpdateStoreTaxConfigDto } from "../dto/update-store-tax-config.dto";

@Controller("admin")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminStoreController {
  constructor(
    @Inject(StoreService) private readonly storeService: StoreService,
  ) {}

  @Post("tenants/:tenantId/stores")
  @RequirePermission("store.create")
  create(
    @AuthUser() user: AuthenticatedUser,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Body() body: CreateStoreDto,
  ) {
    return this.storeService.create(user.userId, user.tenantId, tenantId, body);
  }

  @Get("tenants/:tenantId/stores")
  @RequirePermission("store.read")
  listByTenant(
    @AuthUser() user: AuthenticatedUser,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
  ) {
    return this.storeService.listByTenant(user.tenantId, tenantId);
  }

  @Get("stores/:storeId")
  @RequirePermission("store.read")
  getById(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
  ) {
    return this.storeService.getById(user.tenantId, storeId);
  }

  @Patch("stores/:storeId")
  @RequirePermission("store.update")
  update(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Body() body: UpdateStoreDto,
  ) {
    return this.storeService.update(user.userId, user.tenantId, storeId, body);
  }

  @Get("stores/:storeId/settings")
  @RequirePermission("store.settings.read")
  getSettings(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
  ) {
    return this.storeService.getSettings(user.tenantId, storeId);
  }

  @Patch("stores/:storeId/settings")
  @RequirePermission("store.settings.update")
  updateSettings(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Body() body: UpdateStoreSettingsDto,
  ) {
    return this.storeService.updateSettings(
      user.userId,
      user.tenantId,
      storeId,
      body,
    );
  }

  @Post("stores/:storeId/locales")
  @RequirePermission("store.locale.update")
  addLocale(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Body() body: AddStoreLocaleDto,
  ) {
    return this.storeService.addLocale(
      user.userId,
      user.tenantId,
      storeId,
      body,
    );
  }

  @Get("stores/:storeId/locales")
  @RequirePermission("store.locale.read")
  listLocales(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
  ) {
    return this.storeService.listLocales(user.tenantId, storeId);
  }

  @Patch("stores/:storeId/locales/:localeCode")
  @RequirePermission("store.locale.update")
  removeLocale(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Param("localeCode") localeCode: string,
  ) {
    return this.storeService.removeLocale(
      user.userId,
      user.tenantId,
      storeId,
      localeCode,
    );
  }

  @Post("stores/:storeId/currencies")
  @RequirePermission("store.currency.update")
  addCurrency(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Body() body: AddStoreCurrencyDto,
  ) {
    return this.storeService.addCurrency(
      user.userId,
      user.tenantId,
      storeId,
      body,
    );
  }

  @Get("stores/:storeId/currencies")
  @RequirePermission("store.currency.read")
  listCurrencies(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
  ) {
    return this.storeService.listCurrencies(user.tenantId, storeId);
  }

  @Patch("stores/:storeId/currencies/:currencyCode")
  @RequirePermission("store.currency.update")
  removeCurrency(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Param("currencyCode") currencyCode: string,
  ) {
    return this.storeService.removeCurrency(
      user.userId,
      user.tenantId,
      storeId,
      currencyCode,
    );
  }

  @Get("stores/:storeId/tax-config")
  @RequirePermission("store.tax.read")
  getTaxConfig(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
  ) {
    return this.storeService.getTaxConfig(user.tenantId, storeId);
  }

  @Patch("stores/:storeId/tax-config")
  @RequirePermission("store.tax.update")
  upsertTaxConfig(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Body() body: UpdateStoreTaxConfigDto,
  ) {
    return this.storeService.upsertTaxConfig(
      user.userId,
      user.tenantId,
      storeId,
      body,
    );
  }
}
