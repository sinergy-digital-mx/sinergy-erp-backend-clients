import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { typeOrmOptions } from './database/typeorm.options';
import { UsersModule } from './api/users/users.module';
import { LeadsModule } from './api/leads/leads.module';
import { CustomersModule } from './api/customers/customers.module';
import { AuthModule } from './api/auth/auth.module';
import { RBACModule } from './api/rbac/rbac.module';
import { EmailModule } from './api/email/email.module';
import { PropertiesModule } from './api/properties/properties.module';
import { ContractsModule } from './api/contracts/contracts.module';
import { TransactionsModule } from './api/transactions/transactions.module';
import { CatalogsModule } from './api/catalogs/catalogs.module';
import { VendorModule } from './api/vendor/vendor.module';
import { WarehouseModule } from './api/warehouse/warehouse.module';
import { CategoriesModule } from './api/categories/categories.module';
import { BillingModule } from './api/billing/billing.module';
import { ProductsModule } from './api/products/products.module';
import { UoMCatalogModule } from './api/uom-catalog/uom-catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmOptions),
    UsersModule,
    LeadsModule,
    CustomersModule,
    AuthModule,
    RBACModule,
    EmailModule,
    PropertiesModule,
    ContractsModule,
    TransactionsModule,
    CatalogsModule,
    VendorModule,
    WarehouseModule,
    CategoriesModule,
    BillingModule,
    UoMCatalogModule,
    ProductsModule,
  ],
})
export class AppModule { }
