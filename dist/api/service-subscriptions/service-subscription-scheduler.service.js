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
var ServiceSubscriptionScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceSubscriptionScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const service_subscription_billing_service_1 = require("./service-subscription-billing.service");
let ServiceSubscriptionScheduler = ServiceSubscriptionScheduler_1 = class ServiceSubscriptionScheduler {
    billing;
    logger = new common_1.Logger(ServiceSubscriptionScheduler_1.name);
    constructor(billing) {
        this.billing = billing;
    }
    async billDueMonths() {
        this.logger.log('Revisando suscripciones de servicio del mes');
        await this.billing.billDuePeriods();
    }
};
exports.ServiceSubscriptionScheduler = ServiceSubscriptionScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_6AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServiceSubscriptionScheduler.prototype, "billDueMonths", null);
exports.ServiceSubscriptionScheduler = ServiceSubscriptionScheduler = ServiceSubscriptionScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [service_subscription_billing_service_1.ServiceSubscriptionBillingService])
], ServiceSubscriptionScheduler);
//# sourceMappingURL=service-subscription-scheduler.service.js.map