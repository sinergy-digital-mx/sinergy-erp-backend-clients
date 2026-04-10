import { PartialType } from '@nestjs/swagger';
import { CreatePosConfigurationDto } from './create-pos-configuration.dto';

export class UpdatePosConfigurationDto extends PartialType(CreatePosConfigurationDto) {}