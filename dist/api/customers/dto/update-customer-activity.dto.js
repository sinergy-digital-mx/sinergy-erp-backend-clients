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
exports.UpdateCustomerActivityDto = void 0;
const class_validator_1 = require("class-validator");
const customer_activity_entity_1 = require("../../../entities/customers/customer-activity.entity");
class UpdateCustomerActivityDto {
    type;
    status;
    title;
    description;
    duration_minutes;
    outcome;
    follow_up_date;
    notes;
    metadata;
}
exports.UpdateCustomerActivityDto = UpdateCustomerActivityDto;
__decorate([
    (0, class_validator_1.IsEnum)(customer_activity_entity_1.CustomerActivityType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerActivityDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(customer_activity_entity_1.CustomerActivityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerActivityDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerActivityDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerActivityDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateCustomerActivityDto.prototype, "duration_minutes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerActivityDto.prototype, "outcome", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerActivityDto.prototype, "follow_up_date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerActivityDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateCustomerActivityDto.prototype, "metadata", void 0);
//# sourceMappingURL=update-customer-activity.dto.js.map