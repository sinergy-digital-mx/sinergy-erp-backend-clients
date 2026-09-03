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
exports.LeadsStatsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class LeadsStatsDto {
    total_leads;
    contacted_via_email;
    customer_responded;
    customer_responded_no_reply;
    awaiting_agent_reply;
    conversation_active;
    not_contacted;
}
exports.LeadsStatsDto = LeadsStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of leads',
        example: 500
    }),
    __metadata("design:type", Number)
], LeadsStatsDto.prototype, "total_leads", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of leads contacted via email',
        example: 450
    }),
    __metadata("design:type", Number)
], LeadsStatsDto.prototype, "contacted_via_email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of leads where customer responded',
        example: 200
    }),
    __metadata("design:type", Number)
], LeadsStatsDto.prototype, "customer_responded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of leads contacted but customer has not replied',
        example: 250
    }),
    __metadata("design:type", Number)
], LeadsStatsDto.prototype, "customer_responded_no_reply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of leads where customer replied but agent has not replied back (awaiting agent response)',
        example: 75
    }),
    __metadata("design:type", Number)
], LeadsStatsDto.prototype, "awaiting_agent_reply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of leads with active conversation (both parties have exchanged messages)',
        example: 125
    }),
    __metadata("design:type", Number)
], LeadsStatsDto.prototype, "conversation_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of leads not yet contacted',
        example: 50
    }),
    __metadata("design:type", Number)
], LeadsStatsDto.prototype, "not_contacted", void 0);
//# sourceMappingURL=leads-stats.dto.js.map