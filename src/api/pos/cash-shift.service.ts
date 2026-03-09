import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashShift } from '../../entities/pos/cash-shift.entity';
import { POSPayment } from '../../entities/pos/pos-payment.entity';
import { OpenCashShiftDto } from './dto/open-cash-shift.dto';
import { CloseCashShiftDto } from './dto/close-cash-shift.dto';

export interface ShiftReport {
  shift: CashShift;
  payments: {
    total_payments: number;
    total_amount: number;
    by_method: Array<{
      payment_method: string;
      count: number;
      amount: number;
    }>;
  };
  cash_summary: {
    initial_cash: number;
    cash_payments: number;
    expected_cash: number;
    final_cash: number;
    difference: number;
  };
}

@Injectable()
export class CashShiftService {
  constructor(
    @InjectRepository(CashShift)
    private cashShiftRepo: Repository<CashShift>,
    @InjectRepository(POSPayment)
    private posPaymentRepo: Repository<POSPayment>,
  ) {}

  /**
   * Open a new cash shift
   * Requirements: 13.1-13.6
   */
  async openShift(
    dto: OpenCashShiftDto,
    tenantId: string,
    cashierId: string,
  ): Promise<CashShift> {
    // Validate no open shift exists for this cashier and warehouse
    await this.validateNoOpenShift(cashierId, dto.warehouse_id, tenantId);

    // Use opening_balance if initial_cash is not provided
    const initialCash = dto.initial_cash ?? dto.opening_balance ?? 0;

    const shift = this.cashShiftRepo.create({
      tenant_id: tenantId,
      warehouse_id: dto.warehouse_id,
      cashier_id: cashierId,
      initial_cash: initialCash,
      status: 'open',
      opened_at: new Date(),
      notes: dto.notes,
    });

    return this.cashShiftRepo.save(shift);
  }

  /**
   * Close a cash shift
   * Requirements: 14.1-14.7
   */
  async closeShift(
    shiftId: string,
    dto: CloseCashShiftDto,
    tenantId: string,
  ): Promise<CashShift> {
    const shift = await this.cashShiftRepo.findOne({
      where: { id: shiftId, tenant_id: tenantId },
    });

    if (!shift) {
      throw new NotFoundException(
        `Cash shift with ID ${shiftId} not found for this tenant`,
      );
    }

    if (shift.status !== 'open') {
      throw new BadRequestException(
        `Cannot close shift with status ${shift.status}`,
      );
    }

    // Calculate expected cash
    const expectedCash = await this.calculateExpectedCash(shiftId);

    // Update shift
    shift.final_cash = dto.final_cash;
    shift.expected_cash = expectedCash;
    shift.difference = Number(dto.final_cash) - Number(expectedCash);
    shift.status = 'closed';
    shift.closed_at = new Date();
    
    if (dto.notes) {
      shift.notes = shift.notes
        ? `${shift.notes}\nClosing notes: ${dto.notes}`
        : dto.notes;
    }

    return this.cashShiftRepo.save(shift);
  }

  /**
   * Get current open shift for a cashier
   * Requirements: 13.1-13.6
   */
  async getCurrentShift(
    cashierId: string,
    warehouseId: string,
    tenantId: string,
  ): Promise<CashShift | null> {
    return this.cashShiftRepo.findOne({
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
        cashier_id: cashierId,
        status: 'open',
      },
    });
  }

  /**
   * Get shift report with payment details
   * Requirements: 14.1-14.7
   */
  async getShiftReport(
    shiftId: string,
    tenantId: string,
  ): Promise<ShiftReport> {
    const shift = await this.cashShiftRepo.findOne({
      where: { id: shiftId, tenant_id: tenantId },
      relations: ['cashier', 'warehouse'],
    });

    if (!shift) {
      throw new NotFoundException(
        `Cash shift with ID ${shiftId} not found for this tenant`,
      );
    }

    // Get all payments for this shift
    const payments = await this.posPaymentRepo.find({
      where: { cash_shift_id: shiftId },
    });

    // Calculate payment summary
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Group by payment method
    const byMethod = payments.reduce((acc, payment) => {
      const method = payment.payment_method;
      if (!acc[method]) {
        acc[method] = { payment_method: method, count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += Number(payment.amount);
      return acc;
    }, {} as Record<string, { payment_method: string; count: number; amount: number }>);

    // Calculate cash summary
    const cashPayments = payments
      .filter((p) => p.payment_method === 'cash')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const expectedCash = Number(shift.initial_cash) + cashPayments;

    return {
      shift,
      payments: {
        total_payments: totalPayments,
        total_amount: totalAmount,
        by_method: Object.values(byMethod),
      },
      cash_summary: {
        initial_cash: Number(shift.initial_cash),
        cash_payments: cashPayments,
        expected_cash: expectedCash,
        final_cash: Number(shift.final_cash || 0),
        difference: Number(shift.difference || 0),
      },
    };
  }

  /**
   * Validate no open shift exists
   */
  private async validateNoOpenShift(
    cashierId: string,
    warehouseId: string,
    tenantId: string,
  ): Promise<void> {
    const existingShift = await this.getCurrentShift(
      cashierId,
      warehouseId,
      tenantId,
    );

    if (existingShift) {
      throw new BadRequestException(
        'You already have an open cash shift. Please close it before opening a new one.',
      );
    }
  }

  /**
   * Calculate expected cash for a shift
   */
  private async calculateExpectedCash(shiftId: string): Promise<number> {
    const shift = await this.cashShiftRepo.findOne({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException(`Cash shift with ID ${shiftId} not found`);
    }

    // Get all cash payments for this shift
    const cashPayments = await this.posPaymentRepo.find({
      where: {
        cash_shift_id: shiftId,
        payment_method: 'cash',
      },
    });

    const totalCashPayments = cashPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    return Number(shift.initial_cash) + totalCashPayments;
  }
}
