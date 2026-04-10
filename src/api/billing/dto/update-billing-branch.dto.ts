import { PartialType } from '@nestjs/swagger';
import { CreateBillingBranchDto } from './create-billing-branch.dto';

export class UpdateBillingBranchDto extends PartialType(CreateBillingBranchDto) {}
