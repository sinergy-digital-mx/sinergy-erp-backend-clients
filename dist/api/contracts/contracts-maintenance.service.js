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
var ContractsMaintenanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsMaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("typeorm");
let ContractsMaintenanceService = ContractsMaintenanceService_1 = class ContractsMaintenanceService {
    dataSource;
    logger = new common_1.Logger(ContractsMaintenanceService_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async updateOverdueAndBalance() {
        this.logger.log('Starting daily maintenance: updating overdue payments and balances');
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            const overdueResult = await queryRunner.query(`UPDATE contract_payments p
         SET is_overdue = 1
         WHERE p.payment_date < CURDATE()
           AND p.status != 'pagado'
           AND p.is_overdue = 0`);
            this.logger.log(`✅ Marked ${overdueResult.affectedRows} payments as overdue`);
            const hasHoaPaymentsTable = await queryRunner.hasTable('contract_hoa_payments');
            if (hasHoaPaymentsTable) {
                const hoaOverdueResult = await queryRunner.query(`UPDATE contract_hoa_payments p
           SET is_overdue = 1
           WHERE p.due_date < CURDATE()
             AND p.status IN ('pendiente', 'parcial')
             AND p.is_overdue = 0`);
                this.logger.log(`✅ Marked ${hoaOverdueResult.affectedRows || 0} HOA payments as overdue`);
            }
            const hasDownpaymentPaymentsTable = await queryRunner.hasTable('contract_downpayment_payments');
            if (hasDownpaymentPaymentsTable) {
                const downpaymentOverdueResult = await queryRunner.query(`UPDATE contract_downpayment_payments p
           SET is_overdue = 1
           WHERE p.due_date < CURDATE()
             AND p.status IN ('pendiente', 'parcial')
             AND p.is_overdue = 0`);
                this.logger.log(`✅ Marked ${downpaymentOverdueResult.affectedRows || 0} downpayment payments as overdue`);
            }
            const balanceResult = await queryRunner.query(`UPDATE contracts c
         SET
           remaining_balance = GREATEST(
             0,
             c.total_price - c.down_payment - COALESCE((
               SELECT SUM(
                 CASE
                   WHEN p.status = 'pagado' THEN p.amount
                   WHEN p.status = 'parcial' THEN p.amount_paid
                   ELSE 0
                 END
               )
               FROM contract_payments p
               WHERE p.contract_id = c.id
             ), 0)
           ),
           monthly_payment = CASE
             WHEN c.down_payment_financed = 1 AND c.payment_months > 0 THEN ROUND(
               COALESCE(c.down_payment_target, 0) / c.payment_months,
               2
             )
             WHEN c.payment_months > 0 THEN ROUND(
               (c.total_price - c.down_payment) / c.payment_months,
               2
             )
             ELSE c.monthly_payment
           END
         WHERE c.status = 'activo'`);
            this.logger.log(`✅ Updated remaining_balance for ${balanceResult.affectedRows} contracts`);
            const summary = await queryRunner.query(`SELECT 
           COUNT(DISTINCT c.id) as total_active_contracts,
           (SELECT COUNT(*) FROM contract_payments WHERE is_overdue = 1) as total_overdue_payments,
           (SELECT SUM(remaining_balance) FROM contracts WHERE status = 'activo') as total_remaining_balance
         FROM contracts c
         WHERE c.status = 'activo'`);
            this.logger.log(`📊 Summary: ${JSON.stringify(summary[0])}`);
        }
        catch (error) {
            this.logger.error('❌ Error during maintenance:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.ContractsMaintenanceService = ContractsMaintenanceService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContractsMaintenanceService.prototype, "updateOverdueAndBalance", null);
exports.ContractsMaintenanceService = ContractsMaintenanceService = ContractsMaintenanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], ContractsMaintenanceService);
//# sourceMappingURL=contracts-maintenance.service.js.map