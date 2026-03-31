-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "primary_color" TEXT,
ADD COLUMN     "secondary_color" TEXT,
ADD COLUMN     "support_email" TEXT,
ADD COLUMN     "support_phone" TEXT,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "store_locales" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "locale_code" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_locales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_currencies" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "currency_code" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_tax_configs" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "country_code" TEXT NOT NULL,
    "region_code" TEXT,
    "tax_inclusive" BOOLEAN NOT NULL DEFAULT false,
    "tax_provider" TEXT,
    "tax_calculation_strategy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_tax_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_locales_store_id_locale_code_key" ON "store_locales"("store_id", "locale_code");

-- CreateIndex
CREATE UNIQUE INDEX "store_currencies_store_id_currency_code_key" ON "store_currencies"("store_id", "currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "store_tax_configs_store_id_key" ON "store_tax_configs"("store_id");

-- AddForeignKey
ALTER TABLE "store_locales" ADD CONSTRAINT "store_locales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_currencies" ADD CONSTRAINT "store_currencies_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_tax_configs" ADD CONSTRAINT "store_tax_configs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
