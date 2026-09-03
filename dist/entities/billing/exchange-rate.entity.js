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
exports.ExchangeRate = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let ExchangeRate = class ExchangeRate {
    id;
    tenant_id;
    rate_date;
    exchange_rate;
    notes;
    created_at;
    updated_at;
};
exports.ExchangeRate = ExchangeRate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExchangeRate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExchangeRate.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExchangeRate.prototype, "rate_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], ExchangeRate.prototype, "exchange_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ExchangeRate.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ExchangeRate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ExchangeRate.prototype, "updated_at", void 0);
exports.ExchangeRate = ExchangeRate = __decorate([
    (0, typeorm_1.Entity)('exchange_rates'),
    (0, typeorm_1.Index)('idx_exchange_rates_tenant_id', ['tenant_id']),
    (0, typeorm_1.Index)('idx_exchange_rates_rate_date', ['rate_date']),
    (0, typeorm_1.Index)('idx_exchange_rates_tenant_date', ['tenant_id', 'rate_date'])
], ExchangeRate);
//# sourceMappingURL=exchange-rate.entity.js.map