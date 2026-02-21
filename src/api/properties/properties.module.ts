import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../../entities/properties/property.entity';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { PropertiesService } from './properties.service';
import { PropertyGroupsService } from './property-groups.service';
import { PropertiesController } from './properties.controller';
import { PropertyGroupsController } from './property-groups.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyGroup, MeasurementUnit]),
    RBACModule,
  ],
  providers: [PropertiesService, PropertyGroupsService],
  controllers: [PropertiesController, PropertyGroupsController],
  exports: [PropertiesService, PropertyGroupsService],
})
export class PropertiesModule {}
