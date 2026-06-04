import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { RBACModule } from '../rbac/rbac.module';
import { DivinoDashboardController } from './divino-dashboard.controller';
import { DivinoDashboardService } from './divino-dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract]), RBACModule],
  controllers: [DivinoDashboardController],
  providers: [DivinoDashboardService],
  exports: [DivinoDashboardService],
})
export class DivinoDashboardModule {}
