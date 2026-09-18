import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerActivity } from '../../entities/customers/customer-activity.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { User } from '../../entities/users/user.entity';
import { RBACModule } from '../rbac/rbac.module';
import { CrmInboxController } from './crm-inbox.controller';
import { CrmInboxExportService } from './services/crm-inbox-export.service';
import { CrmInboxService } from './services/crm-inbox.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerActivity, Customer, User]),
    RBACModule,
  ],
  controllers: [CrmInboxController],
  providers: [CrmInboxService, CrmInboxExportService],
  exports: [CrmInboxService],
})
export class CrmModule {}
