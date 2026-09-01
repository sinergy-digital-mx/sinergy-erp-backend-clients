// src/customers/dto/create-customer.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsOptional,
    IsEmail,
    IsIn,
    Min,
    MaxLength,
    Matches,
    IsBoolean,
} from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ description: 'Customer status ID', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    status_id?: number;

    @ApiProperty({ description: 'Customer first name', example: 'John' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Customer last name', example: 'Doe', required: false })
    @IsString()
    @IsOptional()
    lastname?: string;

    @ApiProperty({ description: 'Customer email', example: 'john@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ 
        description: 'Customer phone number (without country code)', 
        example: '6647945661', 
        required: false
    })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ description: 'Phone country ISO code (2 letters)', example: 'MX', required: false })
    @IsString()
    @IsOptional()
    phone_country?: string;

    @ApiProperty({ description: 'Phone country code', example: '+52', required: false })
    @IsString()
    @IsOptional()
    phone_code?: string;

    @ApiProperty({ description: 'Customer country', example: 'Mexico', required: false })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiProperty({ description: 'Company name', example: 'Acme Corporation', required: false })
    @IsString()
    @IsOptional()
    company_name?: string;

    @ApiProperty({ description: 'Company website', example: 'https://example.com', required: false })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiProperty({ description: 'Customer group ID', example: 'uuid-here', required: false })
    @IsString()
    @IsOptional()
    group_id?: string;

    @ApiProperty({ description: 'Additional contact first name', required: false })
    @IsString()
    @IsOptional()
    additional_name?: string;

    @ApiProperty({ description: 'Additional contact last name', required: false })
    @IsString()
    @IsOptional()
    additional_lastname?: string;

    @ApiProperty({ description: 'Additional contact email', required: false })
    @Transform(({ value }) => (value === '' || value === null ? undefined : value))
    @IsOptional()
    @IsEmail()
    additional_email?: string;

    @ApiProperty({
        description: 'Additional contact phone (national number, same as principal phone field)',
        required: false,
    })
    @IsString()
    @IsOptional()
    additional_phone?: string;

    @ApiProperty({ description: 'Additional contact phone country ISO (2 letters)', example: 'MX', required: false })
    @IsString()
    @IsOptional()
    additional_phone_country?: string;

    @ApiProperty({ description: 'Additional contact phone country dial code', example: '+52', required: false })
    @IsString()
    @IsOptional()
    additional_phone_code?: string;

    @ApiProperty({ description: 'RFC del cliente', example: 'XAXX010101000', required: false })
    @IsString()
    @IsOptional()
    fiscal_rfc?: string;

    @ApiProperty({ description: 'Razon social fiscal', example: 'Comercializadora Demo SA de CV', required: false })
    @IsString()
    @IsOptional()
    fiscal_razon_social?: string;

    @ApiProperty({ description: 'Tipo de persona fiscal', example: 'moral', enum: ['fisica', 'moral', 'otro'], required: false })
    @IsString()
    @IsIn(['fisica', 'moral', 'otro'])
    @IsOptional()
    fiscal_person_type?: 'fisica' | 'moral' | 'otro';

    @ApiProperty({ description: 'Direccion fiscal', example: 'Av. Reforma 100', required: false })
    @IsString()
    @IsOptional()
    fiscal_address?: string;

    @ApiProperty({ description: 'Calle o nombre de vialidad (CSF SAT)', example: 'CALLE ESPANA', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    fiscal_street?: string;

    @ApiProperty({ description: 'Numero exterior (CSF SAT)', example: '736', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    fiscal_exterior_number?: string;

    @ApiProperty({ description: 'Numero interior (CSF SAT)', example: 'A', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    fiscal_interior_number?: string;

    @ApiProperty({ description: 'Colonia (CSF SAT)', example: 'JUAREZ', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(120)
    fiscal_colonia?: string;

    @ApiProperty({ description: 'Localidad (CSF SAT, opcional)', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(120)
    fiscal_localidad?: string;

    @ApiProperty({ description: 'Municipio o alcaldia (CSF SAT)', example: 'Tijuana', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(120)
    fiscal_municipio?: string;

    @ApiProperty({ description: 'Pais catalogo SAT c_Pais', example: 'MEX', required: false })
    @Transform(({ value }) =>
        typeof value === 'string' && value.trim() !== '' ? value.trim().toUpperCase() : value,
    )
    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{3}$/, { message: 'El pais fiscal debe ser clave SAT de 3 letras (ej. MEX)' })
    fiscal_country?: string;

    @ApiProperty({ description: 'Ciudad fiscal (legado; preferir fiscal_municipio)', example: 'Tijuana', required: false })
    @IsString()
    @IsOptional()
    fiscal_city?: string;

    @ApiProperty({ description: 'Entidad federativa (CSF SAT)', example: 'Baja California', required: false })
    @IsString()
    @IsOptional()
    fiscal_state?: string;

    @ApiProperty({ description: 'Codigo postal fiscal (DomicilioFiscalReceptor CFDI 4.0)', example: '22040', required: false })
    @IsString()
    @IsOptional()
    @Matches(/^\d{5}$/, { message: 'El codigo postal fiscal debe tener 5 digitos' })
    fiscal_postal_code?: string;

    @ApiProperty({ description: 'Warehouse asignado al cliente', example: 'warehouse-uuid', required: false })
    @IsString()
    @IsOptional()
    warehouse_id?: string;

    @ApiProperty({
        description: 'Razón social de registro (solo informativo)',
        example: 'fiscal-uuid',
        required: false,
    })
    @IsString()
    @IsOptional()
    registered_fiscal_configuration_id?: string;

    @ApiProperty({
        description: 'Sucursal donde se dio de alta el cliente (solo informativo)',
        example: 'branch-uuid',
        required: false,
    })
    @IsString()
    @IsOptional()
    registered_billing_branch_id?: string;

    @ApiProperty({
        description: 'Usuario que dio de alta el cliente. Si se omite, se usa el usuario de la sesión',
        example: 'user-uuid',
        required: false,
    })
    @IsString()
    @IsOptional()
    registered_by_user_id?: string;

    @ApiProperty({
        description: 'Vendedor asignado al cliente (quien comisiona por default). Usuario con código POS',
        example: 'user-uuid',
        required: false,
    })
    @IsString()
    @IsOptional()
    assigned_seller_user_id?: string;

    @ApiProperty({
        description:
            'Atajo: activa crédito en todas las razones sociales. Preferir PUT /customers/:id/credits',
        example: false,
        required: false,
        default: false,
    })
    @Transform(({ value }) => {
        if (value === true || value === 1 || value === '1' || value === 'true') return true;
        if (value === false || value === 0 || value === '0' || value === 'false') return false;
        return value;
    })
    @IsBoolean()
    @IsOptional()
    credit_enabled?: boolean;

    @ApiProperty({ description: 'Días de crédito', example: 30, required: false })
    @IsNumber()
    @Min(0)
    @IsOptional()
    credit_days?: number;

    @ApiProperty({ description: 'Monto máximo de crédito', example: 15000, required: false })
    @IsNumber()
    @Min(0)
    @IsOptional()
    credit_amount?: number;

    @ApiProperty({
        description: 'Preferencia: al cobrar en POS, proponer generar factura de inmediato.',
        example: false,
        required: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    auto_generate_invoice?: boolean;
}