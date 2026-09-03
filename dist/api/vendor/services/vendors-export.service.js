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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorsExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vendor_entity_1 = require("../../../entities/vendor/vendor.entity");
const vendor_type_enum_1 = require("../../../entities/vendor/vendor-type.enum");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
let VendorsExportService = class VendorsExportService {
    vendorRepo;
    columns = [
        { header: 'Código', key: 'vendor_code', width: 14 },
        { header: 'Nombre', key: 'name', width: 24 },
        { header: 'Empresa', key: 'company_name', width: 24 },
        { header: 'Tipo', key: 'vendor_type', width: 14 },
        { header: 'Estatus', key: 'status', width: 12 },
        { header: 'RFC', key: 'rfc', width: 16 },
        { header: 'Razón social', key: 'razon_social', width: 26 },
        { header: 'Tipo persona', key: 'persona_type', width: 16 },
        { header: 'ID fiscal', key: 'tax_id', width: 16 },
        { header: 'Nombre legal', key: 'legal_name', width: 24 },
        { header: 'Calle', key: 'street', width: 24 },
        { header: 'Ciudad', key: 'city', width: 16 },
        { header: 'Estado', key: 'state', width: 16 },
        { header: 'CP', key: 'zip_code', width: 10 },
        { header: 'País', key: 'country', width: 14 },
        { header: 'Banco', key: 'bank_name', width: 18 },
        { header: 'Titular', key: 'bank_account_holder', width: 22 },
        { header: 'Cuenta', key: 'bank_account_number', width: 18 },
        { header: 'CLABE', key: 'bank_clabe', width: 20 },
        { header: 'SWIFT', key: 'bank_swift_bic', width: 14 },
        { header: 'IBAN', key: 'bank_iban', width: 22 },
        { header: 'Moneda banco', key: 'bank_currency', width: 14 },
        { header: 'Días crédito', key: 'credit_days', width: 14, type: 'integer' },
        { header: 'Límite crédito', key: 'credit_limit', width: 16, type: 'currency' },
        { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
    ];
    constructor(vendorRepo) {
        this.vendorRepo = vendorRepo;
    }
    async exportVendors(tenantId, filters) {
        const vendors = await this.fetchVendors(tenantId, filters);
        const rows = vendors.map((v) => ({
            vendor_code: v.vendor_code ?? '',
            name: v.name ?? '',
            company_name: v.company_name ?? '',
            vendor_type: this.formatVendorType(v.vendor_type),
            status: v.status === 'active' ? 'Activo' : 'Inactivo',
            rfc: v.rfc ?? '',
            razon_social: v.razon_social ?? '',
            persona_type: v.persona_type ?? '',
            tax_id: v.tax_id ?? '',
            legal_name: v.legal_name ?? '',
            street: v.street ?? '',
            city: v.city ?? '',
            state: v.state ?? '',
            zip_code: v.zip_code ?? '',
            country: v.country ?? '',
            bank_name: v.bank_name ?? '',
            bank_account_holder: v.bank_account_holder ?? '',
            bank_account_number: v.bank_account_number ?? '',
            bank_clabe: v.bank_clabe ?? '',
            bank_swift_bic: v.bank_swift_bic ?? '',
            bank_iban: v.bank_iban ?? '',
            bank_currency: v.bank_currency ?? '',
            credit_days: v.credit_days ?? '',
            credit_limit: v.credit_limit != null && v.credit_limit !== '' ? (0, excel_export_util_1.num)(v.credit_limit) : '',
            created_at: (0, excel_export_util_1.formatExportDateTime)(v.created_at),
        }));
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Proveedores',
            title: 'Reporte de proveedores',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Registros: ${rows.length}`,
                this.describeFilters(filters),
            ]),
            columns: this.columns,
            rows,
            headerColor: 'FF0D7377',
            titleColor: 'FF095456',
        });
    }
    getFilename() {
        return `proveedores-${new Date().toISOString().slice(0, 10)}.xlsx`;
    }
    async fetchVendors(tenantId, query) {
        const qb = this.vendorRepo
            .createQueryBuilder('vendor')
            .where('vendor.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            qb.andWhere(`(LOWER(vendor.name) LIKE LOWER(:search)
          OR LOWER(vendor.company_name) LIKE LOWER(:search)
          OR LOWER(vendor.rfc) LIKE LOWER(:search)
          OR LOWER(vendor.tax_id) LIKE LOWER(:search)
          OR LOWER(vendor.legal_name) LIKE LOWER(:search))`, { search: `%${query.search}%` });
        }
        if (query?.status) {
            qb.andWhere('vendor.status = :status', { status: query.status });
        }
        if (query?.state) {
            qb.andWhere('vendor.state = :state', { state: query.state });
        }
        if (query?.country) {
            qb.andWhere('vendor.country = :country', { country: query.country });
        }
        if (query?.vendor_type) {
            qb.andWhere('vendor.vendor_type = :vendor_type', {
                vendor_type: query.vendor_type,
            });
        }
        qb.orderBy('vendor.created_at', 'DESC');
        return qb.getMany();
    }
    formatVendorType(type) {
        if (type === vendor_type_enum_1.VendorType.INTERNATIONAL)
            return 'Internacional';
        if (type === vendor_type_enum_1.VendorType.NATIONAL)
            return 'Nacional';
        return type ?? '';
    }
    describeFilters(filters) {
        const parts = [];
        if (filters.search)
            parts.push(`Búsqueda: ${filters.search}`);
        if (filters.status) {
            parts.push(`Estatus: ${filters.status === 'active' ? 'Activo' : 'Inactivo'}`);
        }
        if (filters.vendor_type) {
            parts.push(`Tipo: ${this.formatVendorType(filters.vendor_type)}`);
        }
        if (filters.state)
            parts.push(`Estado: ${filters.state}`);
        if (filters.country)
            parts.push(`País: ${filters.country}`);
        return parts.join(' | ');
    }
};
exports.VendorsExportService = VendorsExportService;
exports.VendorsExportService = VendorsExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VendorsExportService);
//# sourceMappingURL=vendors-export.service.js.map