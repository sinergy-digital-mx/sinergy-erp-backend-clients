// src/api/leads/dto/update-lead-activity.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateLeadActivityDto } from './create-lead-activity.dto';

export class UpdateLeadActivityDto extends PartialType(CreateLeadActivityDto) {}