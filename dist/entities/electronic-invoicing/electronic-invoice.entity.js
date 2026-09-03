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
exports.ElectronicInvoice = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const user_entity_1 = require("../users/user.entity");
let ElectronicInvoice = class ElectronicInvoice {
    id;
    tenant;
    tenant_id;
    fiscal_configuration;
    fiscal_configuration_id;
    source_module;
    source_id;
    uuid;
    series;
    folio;
    tipo_comprobante;
    rfc_emisor;
    rfc_receptor;
    receptor_nombre;
    subtotal;
    total;
    currency;
    xml_unsigned;
    xml_stamped;
    xml_stamped_s3_key;
    pdf_stamped_s3_key;
    stamped_at;
    certificate_serial;
    sat_seal;
    sat_certificate_number;
    stamp_status;
    stamp_error_message;
    cancel_motivo;
    cancel_replacement_uuid;
    cancel_acuse_xml;
    cancel_sat_status_code;
    sat_status;
    sat_es_cancelable;
    sat_estatus_cancelacion;
    sat_codigo_estatus;
    sat_last_sync_at;
    sat_sync_enabled;
    metadata;
    creator;
    created_by;
    created_at;
    updated_at;
};
exports.ElectronicInvoice = ElectronicInvoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ElectronicInvoice.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", fiscal_configuration_entity_1.FiscalConfiguration)
], ElectronicInvoice.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "source_module", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "source_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "uuid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 25, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "series", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5, default: 'I' }),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "tipo_comprobante", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 13 }),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "rfc_emisor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 13 }),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "rfc_receptor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "receptor_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], ElectronicInvoice.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], ElectronicInvoice.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, default: 'MXN' }),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "xml_unsigned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "xml_stamped", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "xml_stamped_s3_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "pdf_stamped_s3_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "stamped_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "certificate_serial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "sat_seal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "sat_certificate_number", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'pending_stamp',
            'stamped',
            'stamp_error',
            'cancel_pending',
            'cancelled',
            'cancel_error',
        ],
        default: 'pending_stamp',
    }),
    __metadata("design:type", String)
], ElectronicInvoice.prototype, "stamp_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "stamp_error_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "cancel_motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "cancel_replacement_uuid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "cancel_acuse_xml", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "cancel_sat_status_code", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Vigente', 'Cancelado', 'No Encontrado', 'Desconocido'],
        nullable: true,
    }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "sat_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "sat_es_cancelable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "sat_estatus_cancelacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "sat_codigo_estatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "sat_last_sync_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], ElectronicInvoice.prototype, "sat_sync_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], ElectronicInvoice.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoice.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ElectronicInvoice.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ElectronicInvoice.prototype, "updated_at", void 0);
exports.ElectronicInvoice = ElectronicInvoice = __decorate([
    (0, typeorm_1.Entity)('electronic_invoices'),
    (0, typeorm_1.Index)('tenant_index', ['tenant_id']),
    (0, typeorm_1.Index)('idx_ei_source', ['tenant_id', 'source_module', 'source_id']),
    (0, typeorm_1.Index)('idx_ei_uuid', ['uuid']),
    (0, typeorm_1.Index)('idx_ei_sat_sync', ['stamp_status', 'sat_last_sync_at'])
], ElectronicInvoice);
//# sourceMappingURL=electronic-invoice.entity.js.map