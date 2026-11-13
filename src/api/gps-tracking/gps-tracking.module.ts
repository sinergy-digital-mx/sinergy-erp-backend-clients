import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsTrackingConfiguration } from '../../entities/gps-tracking/gps-tracking-configuration.entity';
import { Truck } from '../../entities/logistics/truck.entity';
import { Shipping } from '../../entities/logistics/shipping.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { GpsTrackingController } from './gps-tracking.controller';
import { GpsSecretCipherService } from './services/gps-secret-cipher.service';
import { GpsTrackingClientService } from './services/gps-tracking-client.service';
import { GpsTrackingService } from './services/gps-tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GpsTrackingConfiguration, Truck, Shipping]),
    AuthModule,
    RBACModule,
  ],
  controllers: [GpsTrackingController],
  providers: [GpsTrackingService, GpsTrackingClientService, GpsSecretCipherService],
  exports: [GpsTrackingService],
})
export class GpsTrackingModule {}
