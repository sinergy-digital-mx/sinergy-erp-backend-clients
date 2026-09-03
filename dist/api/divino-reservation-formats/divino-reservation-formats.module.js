"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DivinoReservationFormatsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const divino_reservation_format_entity_1 = require("../../entities/divino-reservation-formats/divino-reservation-format.entity");
const property_entity_1 = require("../../entities/properties/property.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const mailer_configuration_module_1 = require("../mailer-configuration/mailer-configuration.module");
const s3_service_1 = require("../../common/services/s3.service");
const divino_reservation_format_controller_1 = require("./divino-reservation-format.controller");
const divino_reservation_format_service_1 = require("./divino-reservation-format.service");
const divino_reservation_format_pdf_service_1 = require("./divino-reservation-format-pdf.service");
let DivinoReservationFormatsModule = class DivinoReservationFormatsModule {
};
exports.DivinoReservationFormatsModule = DivinoReservationFormatsModule;
exports.DivinoReservationFormatsModule = DivinoReservationFormatsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([divino_reservation_format_entity_1.DivinoReservationFormat, property_entity_1.Property, user_entity_1.User]),
            rbac_module_1.RBACModule,
            mailer_configuration_module_1.MailerConfigurationModule,
        ],
        controllers: [divino_reservation_format_controller_1.DivinoReservationFormatController],
        providers: [
            divino_reservation_format_service_1.DivinoReservationFormatService,
            divino_reservation_format_pdf_service_1.DivinoReservationFormatPdfService,
            s3_service_1.S3Service,
        ],
        exports: [divino_reservation_format_service_1.DivinoReservationFormatService],
    })
], DivinoReservationFormatsModule);
//# sourceMappingURL=divino-reservation-formats.module.js.map