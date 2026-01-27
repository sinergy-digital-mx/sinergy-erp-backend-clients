// src/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadActivitiesController } from './lead-activities.controller';
import { LeadActivitiesService } from './lead-activities.service';
import { Lead } from 'src/entities/leads/lead.entity';
import { LeadStatus } from 'src/entities/leads/lead-status.entity';
import { LeadActivity } from 'src/entities/leads/lead-activity.entity';
import { RBACTenant } from 'src/entities/rbac/tenant.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Lead, LeadStatus, LeadActivity, RBACTenant]),
        RBACModule,
    ],
    controllers: [LeadsController, LeadActivitiesController],
    providers: [LeadsService, LeadActivitiesService],
    exports: [LeadsService, LeadActivitiesService],
})
export class LeadsModule { }
