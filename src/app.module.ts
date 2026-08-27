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
import { ElectronicInvoicingModule } from './api/electronic-invoicing/electronic-invoicing.module';
import { PosShiftsModule } from './api/pos-shifts/pos-shifts.module';
import { UoMCatalogModule } from './api/uom-catalog/uom-catalog.module';
import { ProductsModule } from './api/products/products.module';
import { MailerConfigurationModule } from './api/mailer-configuration/mailer-configuration.module';
import { EmailTemplatesModule } from './api/email-templates/email-templates.module';
import { PurchaseOrdersModule } from './api/purchase-orders/purchase-orders.module';
import { InventoryModule } from './api/inventory/inventory.module';
import { SalesOrdersModule } from './api/sales-orders/sales-orders.module';
import { SalesReportsModule } from './api/sales-reports/sales-reports.module';
import { AccountingModule } from './api/accounting/accounting.module';
import { ExchangeRateModule } from './api/exchange-rate/exchange-rate.module';
import { DivinoDashboardModule } from './api/divino-dashboard/divino-dashboard.module';
import { DivinoReservationFormatsModule } from './api/divino-reservation-formats/divino-reservation-formats.module';
import { GoalsModule } from './api/goals/goals.module';
import { GlobalDiscountsModule } from './api/global-discounts/global-discounts.module';
import { EmployeesModule } from './api/employees/employees.module';
import { EmployeePortalModule } from './api/employee-portal/employee-portal.module';
import { TrucksModule } from './api/trucks/trucks.module';
import { ShippingsModule } from './api/shippings/shippings.module';
import { WarehouseControlModule } from './api/warehouse-control/warehouse-control.module';
import { MadereriaInventoryImportModule } from './api/madereria-inventory-import/madereria-inventory-import.module';
import { SelfInvoiceModule } from './api/self-invoice/self-invoice.module';
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
    ElectronicInvoicingModule,
    PosShiftsModule,
    UoMCatalogModule,
    ProductsModule,
    PurchaseOrdersModule,
    InventoryModule,
    SalesOrdersModule,
    SalesReportsModule,
    AccountingModule,
    ExchangeRateModule,
    DivinoDashboardModule,
    DivinoReservationFormatsModule,
    GoalsModule,
    GlobalDiscountsModule,
    EmployeesModule,
    EmployeePortalModule,
    TrucksModule,
    ShippingsModule,
    WarehouseControlModule,
    MadereriaInventoryImportModule,
    SelfInvoiceModule,
  ],
  providers: [],
})
export class AppModule { }
