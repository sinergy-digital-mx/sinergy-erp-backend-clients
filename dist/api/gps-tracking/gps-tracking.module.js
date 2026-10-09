"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GpsTrackingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const gps_tracking_configuration_entity_1 = require("../../entities/gps-tracking/gps-tracking-configuration.entity");
const truck_entity_1 = require("../../entities/logistics/truck.entity");
const shipping_entity_1 = require("../../entities/logistics/shipping.entity");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const gps_tracking_controller_1 = require("./gps-tracking.controller");
const gps_secret_cipher_service_1 = require("./services/gps-secret-cipher.service");
const gps_tracking_client_service_1 = require("./services/gps-tracking-client.service");
const gps_tracking_service_1 = require("./services/gps-tracking.service");
let GpsTrackingModule = class GpsTrackingModule {
};
exports.GpsTrackingModule = GpsTrackingModule;
exports.GpsTrackingModule = GpsTrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([gps_tracking_configuration_entity_1.GpsTrackingConfiguration, truck_entity_1.Truck, shipping_entity_1.Shipping]),
            auth_module_1.AuthModule,
            rbac_module_1.RBACModule,
        ],
        controllers: [gps_tracking_controller_1.GpsTrackingController],
        providers: [gps_tracking_service_1.GpsTrackingService, gps_tracking_client_service_1.GpsTrackingClientService, gps_secret_cipher_service_1.GpsSecretCipherService],
        exports: [gps_tracking_service_1.GpsTrackingService],
    })
], GpsTrackingModule);
//# sourceMappingURL=gps-tracking.module.js.map