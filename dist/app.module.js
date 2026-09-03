"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_options_1 = require("./database/typeorm.options");
const users_module_1 = require("./api/users/users.module");
const leads_module_1 = require("./api/leads/leads.module");
const customers_module_1 = require("./api/customers/customers.module");
const auth_module_1 = require("./api/auth/auth.module");
const rbac_module_1 = require("./api/rbac/rbac.module");
const email_module_1 = require("./api/email/email.module");
const properties_module_1 = require("./api/properties/properties.module");
const contracts_module_1 = require("./api/contracts/contracts.module");
const catalogs_module_1 = require("./api/catalogs/catalogs.module");
const vendor_module_1 = require("./api/vendor/vendor.module");
const warehouse_module_1 = require("./api/warehouse/warehouse.module");
const categories_module_1 = require("./api/categories/categories.module");
const billing_module_1 = require("./api/billing/billing.module");
const electronic_invoicing_module_1 = require("./api/electronic-invoicing/electronic-invoicing.module");
const pos_shifts_module_1 = require("./api/pos-shifts/pos-shifts.module");
const uom_catalog_module_1 = require("./api/uom-catalog/uom-catalog.module");
const products_module_1 = require("./api/products/products.module");
const mailer_configuration_module_1 = require("./api/mailer-configuration/mailer-configuration.module");
const email_templates_module_1 = require("./api/email-templates/email-templates.module");
const purchase_orders_module_1 = require("./api/purchase-orders/purchase-orders.module");
const inventory_module_1 = require("./api/inventory/inventory.module");
const sales_orders_module_1 = require("./api/sales-orders/sales-orders.module");
const quotations_module_1 = require("./api/quotations/quotations.module");
const sales_reports_module_1 = require("./api/sales-reports/sales-reports.module");
const customer_sales_reports_module_1 = require("./api/customer-sales-reports/customer-sales-reports.module");
const accounting_module_1 = require("./api/accounting/accounting.module");
const exchange_rate_module_1 = require("./api/exchange-rate/exchange-rate.module");
const divino_dashboard_module_1 = require("./api/divino-dashboard/divino-dashboard.module");
const divino_reservation_formats_module_1 = require("./api/divino-reservation-formats/divino-reservation-formats.module");
const goals_module_1 = require("./api/goals/goals.module");
const global_discounts_module_1 = require("./api/global-discounts/global-discounts.module");
const employees_module_1 = require("./api/employees/employees.module");
const employee_portal_module_1 = require("./api/employee-portal/employee-portal.module");
const trucks_module_1 = require("./api/trucks/trucks.module");
const shippings_module_1 = require("./api/shippings/shippings.module");
const warehouse_control_module_1 = require("./api/warehouse-control/warehouse-control.module");
const madereria_inventory_import_module_1 = require("./api/madereria-inventory-import/madereria-inventory-import.module");
const self_invoice_module_1 = require("./api/self-invoice/self-invoice.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot(typeorm_options_1.typeOrmModuleOptions),
            users_module_1.UsersModule,
            leads_module_1.LeadsModule,
            customers_module_1.CustomersModule,
            auth_module_1.AuthModule,
            rbac_module_1.RBACModule,
            email_module_1.EmailModule,
            mailer_configuration_module_1.MailerConfigurationModule,
            email_templates_module_1.EmailTemplatesModule,
            properties_module_1.PropertiesModule,
            contracts_module_1.ContractsModule,
            catalogs_module_1.CatalogsModule,
            vendor_module_1.VendorModule,
            warehouse_module_1.WarehouseModule,
            categories_module_1.CategoriesModule,
            billing_module_1.BillingModule,
            electronic_invoicing_module_1.ElectronicInvoicingModule,
            pos_shifts_module_1.PosShiftsModule,
            uom_catalog_module_1.UoMCatalogModule,
            products_module_1.ProductsModule,
            purchase_orders_module_1.PurchaseOrdersModule,
            inventory_module_1.InventoryModule,
            sales_orders_module_1.SalesOrdersModule,
            quotations_module_1.QuotationsModule,
            sales_reports_module_1.SalesReportsModule,
            customer_sales_reports_module_1.CustomerSalesReportsModule,
            accounting_module_1.AccountingModule,
            exchange_rate_module_1.ExchangeRateModule,
            divino_dashboard_module_1.DivinoDashboardModule,
            divino_reservation_formats_module_1.DivinoReservationFormatsModule,
            goals_module_1.GoalsModule,
            global_discounts_module_1.GlobalDiscountsModule,
            employees_module_1.EmployeesModule,
            employee_portal_module_1.EmployeePortalModule,
            trucks_module_1.TrucksModule,
            shippings_module_1.ShippingsModule,
            warehouse_control_module_1.WarehouseControlModule,
            madereria_inventory_import_module_1.MadereriaInventoryImportModule,
            self_invoice_module_1.SelfInvoiceModule,
        ],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map