import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PosUserType } from '../../../entities/users/pos-user-type.enum';
import { EmployeeProfileDto } from '../../employees/dto/employee-profile.dto';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  status_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language_code?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Sucursal asignada. null = acceso a todas. Obligatorio si is_pos_user es true.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_pos_user?: boolean;

  @ApiProperty({
    required: false,
    description: 'Código numérico del usuario (solo aplica cuando is_pos_user es false)',
    example: 33456,
  })
  @ValidateIf((dto: UpdateUserDto) => dto.is_pos_user !== true && dto.pos_user_code != null)
  @IsInt()
  @Min(1)
  pos_user_code?: number;

  @ApiProperty({
    required: false,
    enum: PosUserType,
    description: 'Tipo de terminal POS. Obligatorio si is_pos_user es true. AMBOS solo si es gerente.',
  })
  @ValidateIf((dto: UpdateUserDto) => dto.is_pos_user === true)
  @IsEnum(PosUserType)
  pos_user_type?: PosUserType;

  @ApiProperty({
    required: false,
    description: 'Indica si el usuario es empleado (tab "Empleado" del modal)',
  })
  @IsOptional()
  @IsBoolean()
  is_employee?: boolean;

  @ApiProperty({
    required: false,
    description: 'Indica si el usuario es gerente (tab "Gerente" del modal)',
  })
  @IsOptional()
  @IsBoolean()
  is_manager?: boolean;

  @ApiProperty({
    required: false,
    type: EmployeeProfileDto,
    description: 'Datos de RH/nómina a actualizar. Se aplica un upsert del perfil.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmployeeProfileDto)
  employee?: EmployeeProfileDto;
}
