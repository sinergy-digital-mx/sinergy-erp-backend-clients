// src/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadActivitiesController } from './lead-activities.controller';
import { LeadActivitiesService } from './lead-activities.service';
import { LeadGroupsController } from './lead-groups.controller';
import { LeadGroupsService } from './lead-groups.service';
import { Lead } from 'src/entities/leads/lead.entity';
import { LeadStatus } from 'src/entities/leads/lead-status.entity';
import { LeadActivity } from 'src/entities/leads/lead-activity.entity';
import { LeadAddress } from 'src/entities/leads/lead-address.entity';
import { LeadGroup } from 'src/entities/leads/lead-group.entity';
import { RBACTenant } from 'src/entities/rbac/tenant.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Lead, LeadStatus, LeadActivity, LeadAddress, LeadGroup, RBACTenant]),
        RBACModule,
    ],
    providers: [
        LeadsService,
        LeadActivitiesService,
        LeadGroupsService,
    ],
    controllers: [LeadsController, LeadActivitiesController, LeadGroupsController],
    exports: [LeadsService, LeadActivitiesService, LeadGroupsService],
})
export class LeadsModule { }
