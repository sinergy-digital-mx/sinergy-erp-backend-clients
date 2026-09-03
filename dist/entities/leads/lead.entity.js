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
exports.Lead = void 0;
const typeorm_1 = require("typeorm");
const lead_status_entity_1 = require("./lead-status.entity");
const lead_address_entity_1 = require("./lead-address.entity");
const lead_activity_entity_1 = require("./lead-activity.entity");
const lead_group_entity_1 = require("./lead-group.entity");
const tenant_entity_1 = require("../rbac/tenant.entity");
const email_thread_entity_1 = require("../email/email-thread.entity");
let Lead = class Lead {
    id;
    tenant;
    tenant_id;
    status;
    group;
    group_id;
    name;
    lastname;
    email;
    phone;
    phone_country;
    phone_code;
    source;
    company_name;
    company_phone;
    website;
    addresses;
    activities;
    emailThreads;
    assigned_rep_id;
    email_contacted;
    first_email_sent_at;
    customer_answered;
    customer_answered_at;
    agent_replied_back;
    agent_replied_back_at;
    last_email_thread_status;
    last_email_thread_id;
    email_thread_count;
    created_at;
};
exports.Lead = Lead;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Lead.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], Lead.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], Lead.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_status_entity_1.LeadStatus),
    (0, typeorm_1.JoinColumn)({ name: 'status_id' }),
    __metadata("design:type", lead_status_entity_1.LeadStatus)
], Lead.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_group_entity_1.LeadGroup, group => group.leads),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", lead_group_entity_1.LeadGroup)
], Lead.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lead.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lead.prototype, "lastname", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lead.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lead.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2 }),
    __metadata("design:type", String)
], Lead.prototype, "phone_country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5 }),
    __metadata("design:type", String)
], Lead.prototype, "phone_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "company_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "company_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lead_address_entity_1.LeadAddress, address => address.lead),
    __metadata("design:type", Array)
], Lead.prototype, "addresses", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lead_activity_entity_1.LeadActivity, activity => activity.lead),
    __metadata("design:type", Array)
], Lead.prototype, "activities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => email_thread_entity_1.EmailThread, thread => thread.lead),
    __metadata("design:type", Array)
], Lead.prototype, "emailThreads", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "assigned_rep_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Lead.prototype, "email_contacted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Lead.prototype, "first_email_sent_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Lead.prototype, "customer_answered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Lead.prototype, "customer_answered_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Lead.prototype, "agent_replied_back", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Lead.prototype, "agent_replied_back_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "last_email_thread_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "last_email_thread_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Lead.prototype, "email_thread_count", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Lead.prototype, "created_at", void 0);
exports.Lead = Lead = __decorate([
    (0, typeorm_1.Entity)('leads')
], Lead);
//# sourceMappingURL=lead.entity.js.map