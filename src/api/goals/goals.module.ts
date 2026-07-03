import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesGoal } from '../../entities/goals/sales-goal.entity';
import { SalesGoalsSettings } from '../../entities/goals/sales-goals-settings.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Role } from '../../entities/rbac/role.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesGoal, SalesGoalsSettings, BillingBranch, Role]),
    AuthModule,
    RBACModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
