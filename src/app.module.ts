import { Module } from "@nestjs/common";

import { AdminApiModule } from "./api/admin/admin-api.module";
import { StorefrontApiModule } from "./api/storefront/storefront-api.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./infrastructure/database/prisma/prisma.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AccessControlModule } from "./modules/access-control/access-control.module";
import { CartModule } from "./modules/cart/cart.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { CustomerModule } from "./modules/customer/customer.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { OrderModule } from "./modules/order/order.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { PromotionModule } from "./modules/promotion/promotion.module";
import { SearchModule } from "./modules/search/search.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { StoreModule } from "./modules/store/store.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { WebhookModule } from "./modules/webhook/webhook.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AdminApiModule,
    StorefrontApiModule,
    TenantModule,
    StoreModule,
    IdentityModule,
    AccessControlModule,
    AuditModule,
    CustomerModule,
    CatalogModule,
    PricingModule,
    PromotionModule,
    SearchModule,
    InventoryModule,
    CartModule,
    CheckoutModule,
    OrderModule,
    PaymentModule,
    ShippingModule,
    NotificationModule,
    WebhookModule,
  ],
})
export class AppModule {}
