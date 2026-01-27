// src/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Lead } from 'src/entities/leads/lead.entity';
import { LeadStatus } from 'src/entities/leads/lead-status.entity';
import { Tenant } from 'src/entities/tenant/tenant.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Lead, LeadStatus, Tenant])],
    controllers: [LeadsController],
    providers: [LeadsService],
})
export class LeadsModule { }
