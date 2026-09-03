import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
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

export class CreateUserDto {
  @ApiProperty({ description: 'User status ID', example: 1 })
  @IsInt()
  status_id: number;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;

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
      'Sucursal activa / principal. Si no envías billing_branch_ids, se trata como asignación única. null = acceso a todas (solo no POS).',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string | null;

  @ApiProperty({
    required: false,
    type: [String],
    description:
      'Sucursales asignadas. Vacío o omitido con billing_branch_id null = acceso a todas (solo no POS). POS requiere al menos una.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  billing_branch_ids?: string[];

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Sucursal principal. Debe estar en billing_branch_ids.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  primary_billing_branch_id?: string | null;

  @ApiProperty({
    required: false,
    description: 'Indica si el usuario opera en POS',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_pos_user?: boolean;

  @ApiProperty({
    required: false,
    description: 'Código numérico que se ingresa en el POS al vender. Aplica a vendedores y a terminales (p. ej. gerentes).',
    example: 33456,
  })
  @ValidateIf((dto: CreateUserDto) => dto.pos_user_code != null)
  @IsInt()
  @Min(1)
  pos_user_code?: number;

  @ApiProperty({
    required: false,
    enum: PosUserType,
    description: 'Tipo de terminal POS. Obligatorio si is_pos_user es true. AMBOS solo si es gerente.',
  })
  @ValidateIf((dto: CreateUserDto) => dto.is_pos_user === true)
  @IsEnum(PosUserType)
  pos_user_type?: PosUserType;

  @ApiProperty({
    required: false,
    description: 'Indica si el usuario es empleado (tab "Empleado" del modal)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_employee?: boolean;

  @ApiProperty({
    required: false,
    description: 'Indica si el usuario es gerente (tab "Gerente" del modal)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_manager?: boolean;

  @ApiProperty({
    required: false,
    type: EmployeeProfileDto,
    description: 'Datos de RH/nómina. Requerido cuando is_employee es true.',
  })
  @ValidateIf((dto: CreateUserDto) => dto.is_employee === true)
  @IsObject()
  @ValidateNested()
  @Type(() => EmployeeProfileDto)
  employee?: EmployeeProfileDto;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Almacenes de Mesa de Control asignados al usuario',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  warehouse_ids?: string[];
}
