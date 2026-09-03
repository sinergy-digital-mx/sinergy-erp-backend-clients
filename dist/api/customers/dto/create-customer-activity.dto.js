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
exports.CreateCustomerActivityDto = void 0;
const class_validator_1 = require("class-validator");
const customer_activity_entity_1 = require("../../../entities/customers/customer-activity.entity");
class CreateCustomerActivityDto {
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
exports.CreateCustomerActivityDto = CreateCustomerActivityDto;
__decorate([
    (0, class_validator_1.IsEnum)(customer_activity_entity_1.CustomerActivityType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerActivityDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(customer_activity_entity_1.CustomerActivityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerActivityDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomerActivityDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerActivityDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCustomerActivityDto.prototype, "duration_minutes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerActivityDto.prototype, "outcome", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerActivityDto.prototype, "follow_up_date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerActivityDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateCustomerActivityDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-customer-activity.dto.js.map