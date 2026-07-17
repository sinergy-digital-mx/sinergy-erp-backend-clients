import { PartialType } from '@nestjs/swagger';
import { CreateDivinoReservationFormatDto } from './create-divino-reservation-format.dto';

export class UpdateDivinoReservationFormatDto extends PartialType(
  CreateDivinoReservationFormatDto,
) {}
