import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../../entities/properties/property.entity';
import { Contract } from '../../entities/contracts/contract.entity';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { PropertiesService } from './properties.service';
import { PropertyImportService } from './property-import.service';
import { PropertyGroupsService } from './property-groups.service';
import { PropertiesController } from './properties.controller';
import { PropertyGroupsController } from './property-groups.controller';
import { RBACModule } from '../rbac/rbac.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyGroup, MeasurementUnit, Contract]),
    RBACModule,
    CustomersModule,
  ],
  providers: [PropertiesService, PropertyGroupsService, PropertyImportService],
  controllers: [PropertiesController, PropertyGroupsController],
  exports: [PropertiesService, PropertyGroupsService],
})
export class PropertiesModule {}
