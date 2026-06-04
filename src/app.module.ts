import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { typeOrmModuleOptions } from './database/typeorm.options';
import { UsersModule } from './api/users/users.module';
import { LeadsModule } from './api/leads/leads.module';
import { CustomersModule } from './api/customers/customers.module';
import { AuthModule } from './api/auth/auth.module';
import { RBACModule } from './api/rbac/rbac.module';
import { EmailModule } from './api/email/email.module';
import { PropertiesModule } from './api/properties/properties.module';
import { ContractsModule } from './api/contracts/contracts.module';
import { CatalogsModule } from './api/catalogs/catalogs.module';
import { VendorModule } from './api/vendor/vendor.module';
import { WarehouseModule } from './api/warehouse/warehouse.module';
import { CategoriesModule } from './api/categories/categories.module';
import { BillingModule } from './api/billing/billing.module';
import { PosConfigurationModule } from './api/pos-configuration/pos-configuration.module';
import { PosSessionsModule } from './api/pos-sessions/pos-sessions.module';
import { UoMCatalogModule } from './api/uom-catalog/uom-catalog.module';
import { ProductsModule } from './api/products/products.module';
import { MailerConfigurationModule } from './api/mailer-configuration/mailer-configuration.module';
import { EmailTemplatesModule } from './api/email-templates/email-templates.module';
import { PurchaseOrdersModule } from './api/purchase-orders/purchase-orders.module';
import { InventoryModule } from './api/inventory/inventory.module';
import { SalesOrdersModule } from './api/sales-orders/sales-orders.module';
import { SalesReportsModule } from './api/sales-reports/sales-reports.module';
import { ExchangeRateModule } from './api/exchange-rate/exchange-rate.module';
import { DivinoDashboardModule } from './api/divino-dashboard/divino-dashboard.module';
import { PermissionVersionGuard } from './api/auth/guards/permission-version.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmModuleOptions),
    UsersModule,
    LeadsModule,
    CustomersModule,
    AuthModule,
    RBACModule,
    EmailModule,
    MailerConfigurationModule,
    EmailTemplatesModule,
    PropertiesModule,
    ContractsModule,
    CatalogsModule,
    VendorModule,
    WarehouseModule,
    CategoriesModule,
    BillingModule,
    PosConfigurationModule,
    PosSessionsModule,
    UoMCatalogModule,
    ProductsModule,
    PurchaseOrdersModule,
    InventoryModule,
    SalesOrdersModule,
    SalesReportsModule,
    ExchangeRateModule,
    DivinoDashboardModule,
  ],
  providers: [],
})
export class AppModule { }
