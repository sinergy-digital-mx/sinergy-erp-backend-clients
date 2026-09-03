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
exports.MeasurementUnit = void 0;
const typeorm_1 = require("typeorm");
const property_entity_1 = require("./property.entity");
let MeasurementUnit = class MeasurementUnit {
    id;
    code;
    name;
    symbol;
    description;
    system;
    properties;
    created_at;
};
exports.MeasurementUnit = MeasurementUnit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MeasurementUnit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, unique: true }),
    __metadata("design:type", String)
], MeasurementUnit.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], MeasurementUnit.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], MeasurementUnit.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MeasurementUnit.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['metric', 'imperial'], default: 'metric' }),
    __metadata("design:type", String)
], MeasurementUnit.prototype, "system", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => property_entity_1.Property, (property) => property.measurement_unit),
    __metadata("design:type", Array)
], MeasurementUnit.prototype, "properties", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], MeasurementUnit.prototype, "created_at", void 0);
exports.MeasurementUnit = MeasurementUnit = __decorate([
    (0, typeorm_1.Entity)('measurement_units'),
    (0, typeorm_1.Index)('code_index', ['code'], { unique: true })
], MeasurementUnit);
//# sourceMappingURL=measurement-unit.entity.js.map