// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersExportService } from './services/customers-export.service';
import { CustomerGroupsController } from './customer-groups.controller';
import { CustomerGroupsService } from './customer-groups.service';
import { CustomerActivitiesController } from './customer-activities.controller';
import { CustomerActivitiesService } from './customer-activities.service';
import { CustomerDocumentsController, DocumentTypesController } from './customer-documents.controller';
import { CustomerDocumentsService } from './customer-documents.service';
import { CustomerStatus } from '../../entities/customers/customer-status.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { CustomerGroup } from '../../entities/customers/customer-group.entity';
import { CustomerActivity } from '../../entities/customers/customer-activity.entity';
import { CustomerDocument } from '../../entities/customers/customer-document.entity';
import { DocumentType } from '../../entities/customers/document-type.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { User } from '../../entities/users/user.entity';
import { CustomerAddress } from '../../entities/customers/customer-address.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { Product } from '../../entities/products/product.entity';
import { S3Service } from '../../common/services/s3.service';
import { RBACModule } from '../rbac/rbac.module';
import { CustomerProductInsightsService } from './services/customer-product-insights.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Customer,
            CustomerStatus,
            CustomerGroup,
            CustomerActivity,
            CustomerDocument,
            DocumentType,
            Warehouse,
            BillingBranch,
            User,
            CustomerAddress,
            SalesOrder,
            SalesOrderDetail,
            Product,
        ]),
        RBACModule,
    ],
    providers: [
        CustomersService,
        CustomersExportService,
        CustomerGroupsService,
        CustomerActivitiesService,
        CustomerDocumentsService,
        CustomerProductInsightsService,
        S3Service,
    ],
    controllers: [
        CustomersController,
        CustomerGroupsController,
        CustomerActivitiesController,
        CustomerDocumentsController,
        DocumentTypesController,
    ],
})
export class CustomersModule { }
