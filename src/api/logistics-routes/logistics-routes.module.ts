import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsRoute } from '../../entities/logistics/logistics-route.entity';
import { Module as ModuleEntity, TenantModule } from '../../entities/rbac';
import { LogisticsRoutesController } from './logistics-routes.controller';
import { LogisticsRoutesService } from './logistics-routes.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogisticsRoute, ModuleEntity, TenantModule])],
  controllers: [LogisticsRoutesController],
  providers: [LogisticsRoutesService],
  exports: [LogisticsRoutesService],
})
export class LogisticsRoutesModule {}
