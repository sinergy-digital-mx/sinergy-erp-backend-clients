"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCustomerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateCustomerDto {
    status_id;
    name;
    lastname;
    email;
    phone;
    phone_country;
    phone_code;
    country;
    company_name;
    website;
    group_id;
    additional_name;
    additional_lastname;
    additional_email;
    additional_phone;
    additional_phone_country;
    additional_phone_code;
    fiscal_rfc;
    fiscal_razon_social;
    fiscal_person_type;
    fiscal_address;
    fiscal_street;
    fiscal_exterior_number;
    fiscal_interior_number;
    fiscal_colonia;
    fiscal_localidad;
    fiscal_municipio;
    fiscal_country;
    fiscal_city;
    fiscal_state;
    fiscal_postal_code;
    warehouse_id;
    registered_fiscal_configuration_id;
    registered_billing_branch_id;
    registered_by_user_id;
    assigned_seller_user_id;
    credit_enabled;
    credit_days;
    credit_amount;
    auto_generate_invoice;
}
exports.CreateCustomerDto = CreateCustomerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer status ID', example: 1, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCustomerDto.prototype, "status_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer first name', example: 'John' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer last name', example: 'Doe', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer email', example: 'john@example.com', required: false }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Customer phone number (without country code)',
        example: '6647945661',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone country ISO code (2 letters)', example: 'MX', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phone_country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone country code', example: '+52', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phone_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer country', example: 'Mexico', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Company name', example: 'Acme Corporation', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "company_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Company website', example: 'https://example.com', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "website", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer group ID', example: 'uuid-here', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "group_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional contact first name', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "additional_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional contact last name', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "additional_lastname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional contact email', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === '' || value === null ? undefined : value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "additional_email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional contact phone (national number, same as principal phone field)',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "additional_phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional contact phone country ISO (2 letters)', example: 'MX', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "additional_phone_country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional contact phone country dial code', example: '+52', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "additional_phone_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'RFC del cliente', example: 'XAXX010101000', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_rfc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razon social fiscal', example: 'Comercializadora Demo SA de CV', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tipo de persona fiscal', example: 'moral', enum: ['fisica', 'moral', 'otro'], required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['fisica', 'moral', 'otro']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_person_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Direccion fiscal', example: 'Av. Reforma 100', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calle o nombre de vialidad (CSF SAT)', example: 'CALLE ESPANA', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_street", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Numero exterior (CSF SAT)', example: '736', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_exterior_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Numero interior (CSF SAT)', example: 'A', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_interior_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Colonia (CSF SAT)', example: 'JUAREZ', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_colonia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Localidad (CSF SAT, opcional)', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_localidad", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Municipio o alcaldia (CSF SAT)', example: 'Tijuana', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_municipio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pais catalogo SAT c_Pais', example: 'MEX', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' && value.trim() !== '' ? value.trim().toUpperCase() : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[A-Z]{3}$/, { message: 'El pais fiscal debe ser clave SAT de 3 letras (ej. MEX)' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ciudad fiscal (legado; preferir fiscal_municipio)', example: 'Tijuana', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Entidad federativa (CSF SAT)', example: 'Baja California', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Codigo postal fiscal (DomicilioFiscalReceptor CFDI 4.0)', example: '22040', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{5}$/, { message: 'El codigo postal fiscal debe tener 5 digitos' }),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fiscal_postal_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warehouse asignado al cliente', example: 'warehouse-uuid', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Razón social de registro (solo informativo)',
        example: 'fiscal-uuid',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "registered_fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sucursal donde se dio de alta el cliente (solo informativo)',
        example: 'branch-uuid',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "registered_billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Usuario que dio de alta el cliente. Si se omite, se usa el usuario de la sesión',
        example: 'user-uuid',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "registered_by_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Vendedor asignado al cliente (quien comisiona por default). Usuario con código POS',
        example: 'user-uuid',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "assigned_seller_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Atajo: activa crédito en todas las razones sociales. Preferir PUT /customers/:id/credits',
        example: false,
        required: false,
        default: false,
    }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === true || value === 1 || value === '1' || value === 'true')
            return true;
        if (value === false || value === 0 || value === '0' || value === 'false')
            return false;
        return value;
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCustomerDto.prototype, "credit_enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Días de crédito', example: 30, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCustomerDto.prototype, "credit_days", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Monto máximo de crédito', example: 15000, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCustomerDto.prototype, "credit_amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preferencia: al cobrar en POS, proponer generar factura de inmediato.',
        example: false,
        required: false,
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCustomerDto.prototype, "auto_generate_invoice", void 0);
//# sourceMappingURL=create-customer.dto.js.map