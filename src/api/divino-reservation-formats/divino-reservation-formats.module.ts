import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DivinoReservationFormat } from '../../entities/divino-reservation-formats/divino-reservation-format.entity';
import { Property } from '../../entities/properties/property.entity';
import { User } from '../../entities/users/user.entity';
import { RBACModule } from '../rbac/rbac.module';
import { MailerConfigurationModule } from '../mailer-configuration/mailer-configuration.module';
import { S3Service } from '../../common/services/s3.service';
import { DivinoReservationFormatController } from './divino-reservation-format.controller';
import { DivinoReservationFormatService } from './divino-reservation-format.service';
import { DivinoReservationFormatPdfService } from './divino-reservation-format-pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DivinoReservationFormat, Property, User]),
    RBACModule,
    MailerConfigurationModule,
  ],
  controllers: [DivinoReservationFormatController],
  providers: [
    DivinoReservationFormatService,
    DivinoReservationFormatPdfService,
    S3Service,
  ],
  exports: [DivinoReservationFormatService],
})
export class DivinoReservationFormatsModule {}
