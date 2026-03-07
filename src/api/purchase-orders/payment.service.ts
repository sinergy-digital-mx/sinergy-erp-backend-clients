import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/purchase-orders/payment.entity';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PurchaseOrderService } from './purchase-order.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private repo: Repository<Payment>,
    private poService: PurchaseOrderService,
  ) {}

  async recordPayment(
    purchaseOrderId: string,
    dto: RecordPaymentDto,
    tenantId: string,
  ): Promise<Payment> {
    // Verify PO exists and belongs to tenant
    const po = await this.poService.findOne(purchaseOrderId, tenantId);

    if (po.status === 'Cancelada') {
      throw new ConflictException('Cannot record payment for a cancelled purchase order');
    }

    const payment = this.repo.create({
      purchase_order_id: purchaseOrderId,
      payment_date: new Date(dto.payment_date),
      payment_amount: dto.payment_amount,
      payment_method: dto.payment_method,
      reference_number: dto.reference_number,
    });

    const saved = await this.repo.save(payment);

    // Update PO payment status
    await this.updatePaymentStatus(purchaseOrderId, tenantId);

    return saved;
  }

  async getPaymentInfo(purchaseOrderId: string, tenantId: string): Promise<any> {
    const po = await this.poService.findOne(purchaseOrderId, tenantId);

    const payments = await this.repo.find({
      where: { purchase_order_id: purchaseOrderId },
    });

    return {
      payment_status: po.payment_status,
      payment_date: po.payment_date,
      payment_amount: po.payment_amount,
      payment_method: po.payment_method,
      remaining_amount: po.remaining_amount,
      payments: payments,
    };
  }

  private async updatePaymentStatus(purchaseOrderId: string, tenantId: string): Promise<void> {
    const po = await this.poService.findOne(purchaseOrderId, tenantId);

    const payments = await this.repo.find({
      where: { purchase_order_id: purchaseOrderId },
    });

    let totalPaid = new Decimal(0);
    for (const payment of payments) {
      totalPaid = totalPaid.plus(new Decimal(payment.payment_amount));
    }

    const grandTotal = new Decimal(po.grand_total);

    if (totalPaid.equals(0)) {
      po.payment_status = 'No pagado';
      po.payment_amount = 0;
      po.remaining_amount = parseFloat(grandTotal.toFixed(2));
    } else if (totalPaid.greaterThanOrEqualTo(grandTotal)) {
      po.payment_status = 'Pagada';
      po.payment_amount = parseFloat(totalPaid.toFixed(2));
      po.remaining_amount = 0;
    } else {
      po.payment_status = 'Parcial';
      po.payment_amount = parseFloat(totalPaid.toFixed(2));
      po.remaining_amount = parseFloat(grandTotal.minus(totalPaid).toFixed(2));
    }

    // Update payment_date to the latest payment date
    if (payments.length > 0) {
      const latestPayment = payments.reduce((latest, current) =>
        new Date(current.payment_date) > new Date(latest.payment_date) ? current : latest,
      );
      po.payment_date = latestPayment.payment_date;
    }

    await this.poService['repo'].save(po);
  }
}
