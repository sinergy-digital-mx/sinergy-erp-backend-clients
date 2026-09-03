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
exports.PhoneCountry = void 0;
const typeorm_1 = require("typeorm");
let PhoneCountry = class PhoneCountry {
    id;
    country_name;
    country_code;
    phone_code;
    flag_emoji;
    is_active;
    created_at;
    updated_at;
};
exports.PhoneCountry = PhoneCountry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PhoneCountry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], PhoneCountry.prototype, "country_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3 }),
    __metadata("design:type", String)
], PhoneCountry.prototype, "country_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], PhoneCountry.prototype, "phone_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PhoneCountry.prototype, "flag_emoji", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], PhoneCountry.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PhoneCountry.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PhoneCountry.prototype, "updated_at", void 0);
exports.PhoneCountry = PhoneCountry = __decorate([
    (0, typeorm_1.Entity)('phone_countries'),
    (0, typeorm_1.Index)('phone_country_code_index', ['phone_code']),
    (0, typeorm_1.Index)('phone_country_name_index', ['country_name'])
], PhoneCountry);
//# sourceMappingURL=phone-country.entity.js.map