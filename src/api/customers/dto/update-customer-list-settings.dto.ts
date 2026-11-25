import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CUSTOMER_LIST_PREFILTERS } from '../utils/customer-list-settings.util';

export class UpdateCustomerListSettingsDto {
  @ApiProperty({
    enum: CUSTOMER_LIST_PREFILTERS,
    description:
      'off: el listado abre sin razón ni sucursal. sellers: solo quien no tiene customers:ViewAll entra con la suya. everyone: todos entran con la suya. En los tres casos el select permite ver todas.',
    example: 'sellers',
  })
  @IsIn(CUSTOMER_LIST_PREFILTERS)
  prefilter: (typeof CUSTOMER_LIST_PREFILTERS)[number];
}
