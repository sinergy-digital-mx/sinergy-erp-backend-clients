"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const contract_document_entity_1 = require("../../entities/contracts/contract-document.entity");
const payment_entity_1 = require("../../entities/contracts/payment.entity");
const payment_document_entity_1 = require("../../entities/contracts/payment-document.entity");
const contracts_service_1 = require("./contracts.service");
const contracts_controller_1 = require("./contracts.controller");
const contracts_export_service_1 = require("./contracts-export.service");
const contract_pdf_service_1 = require("./contract-pdf.service");
const contract_documents_service_1 = require("./contract-documents.service");
const contract_documents_controller_1 = require("./contract-documents.controller");
const payment_documents_service_1 = require("./payment-documents.service");
const payment_documents_controller_1 = require("./payment-documents.controller");
const contracts_maintenance_service_1 = require("./contracts-maintenance.service");
const s3_service_1 = require("../../common/services/s3.service");
const rbac_module_1 = require("../rbac/rbac.module");
const payments_module_1 = require("./contract-payments/payments.module");
const hoa_payments_module_1 = require("./contract-hoa-payments/hoa-payments.module");
const downpayment_payments_module_1 = require("./contract-downpayment-payments/downpayment-payments.module");
let ContractsModule = class ContractsModule {
};
exports.ContractsModule = ContractsModule;
exports.ContractsModule = ContractsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([contract_entity_1.Contract, contract_document_entity_1.ContractDocument, payment_entity_1.Payment, payment_document_entity_1.PaymentDocument]),
            rbac_module_1.RBACModule,
            payments_module_1.PaymentsModule,
            hoa_payments_module_1.HoaPaymentsModule,
            downpayment_payments_module_1.DownpaymentPaymentsModule,
        ],
        providers: [
            contracts_service_1.ContractsService,
            contracts_export_service_1.ContractsExportService,
            contract_pdf_service_1.ContractPdfService,
            contract_documents_service_1.ContractDocumentsService,
            payment_documents_service_1.PaymentDocumentsService,
            contracts_maintenance_service_1.ContractsMaintenanceService,
            s3_service_1.S3Service,
        ],
        controllers: [
            contracts_controller_1.ContractsController,
            contract_documents_controller_1.ContractDocumentsController,
            payment_documents_controller_1.PaymentDocumentsController,
        ],
        exports: [contracts_service_1.ContractsService],
    })
], ContractsModule);
//# sourceMappingURL=contracts.module.js.map