// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
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
import { S3Service } from '../../common/services/s3.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Customer,
            CustomerStatus,
            CustomerGroup,
            CustomerActivity,
            CustomerDocument,
            DocumentType,
        ]),
        RBACModule,
    ],
    providers: [
        CustomersService,
        CustomerGroupsService,
        CustomerActivitiesService,
        CustomerDocumentsService,
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
