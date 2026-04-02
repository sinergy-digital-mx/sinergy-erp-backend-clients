import { PartialType } from '@nestjs/swagger';
import { CreateUoMCatalogDto } from './create-uom-catalog.dto';

export class UpdateUoMCatalogDto extends PartialType(CreateUoMCatalogDto) {}
