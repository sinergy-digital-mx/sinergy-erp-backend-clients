import { Injectable } from '@nestjs/common';
import { ReceiptLotMode, ReceivedItemDto } from '../dto/receive-purchase-order.dto';

/**
 * Service for calculating received totals (subtotal, IVA, IEPS, and total)
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
@Injectable()
export class TotalCalculatorService {
  private getEffectiveQuantity(item: ReceivedItemDto): number {
    const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
    const lotMode = item.lot_mode || (hasLots ? ReceiptLotMode.MULTIPLE : ReceiptLotMode.SINGLE);
    if (lotMode === ReceiptLotMode.MULTIPLE) {
      return (item.lots || []).reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
    }
    return Number(item.quantity || 0);
  }

  /**
   * Calculate the received subtotal by summing (quantity × unit_total) for all items
   * Validates: Requirement 5.1
   *
   * @param items Array of received items
   * @returns Received subtotal rounded to 2 decimal places
   */
  calculateReceivedSubtotal(items: ReceivedItemDto[]): number {
    const subtotal = items.reduce((sum, item) => {
      return sum + this.getEffectiveQuantity(item) * item.unit_total;
    }, 0);

    return this.roundToCurrency(subtotal);
  }

  /**
   * Calculate the received IVA total by summing (iva_unit × quantity) for all items
   * Validates: Requirement 5.2
   *
   * @param items Array of received items
   * @returns Received IVA total rounded to 2 decimal places
   */
  calculateReceivedIvaTotal(items: ReceivedItemDto[]): number {
    const ivaTotal = items.reduce((sum, item) => {
      return sum + item.iva_unit * this.getEffectiveQuantity(item);
    }, 0);

    return this.roundToCurrency(ivaTotal);
  }

  /**
   * Calculate the received IEPS total by summing (ieps_unit × quantity) for all items
   * Validates: Requirement 5.3
   *
   * @param items Array of received items
   * @returns Received IEPS total rounded to 2 decimal places
   */
  calculateReceivedIepsTotal(items: ReceivedItemDto[]): number {
    const iepsTotal = items.reduce((sum, item) => {
      return sum + item.ieps_unit * this.getEffectiveQuantity(item);
    }, 0);

    return this.roundToCurrency(iepsTotal);
  }

  /**
   * Calculate the received total as (subtotal + iva_total + ieps_total)
   * Validates: Requirement 5.4
   *
   * @param items Array of received items
   * @returns Received total rounded to 2 decimal places
   */
  calculateReceivedTotal(items: ReceivedItemDto[]): number {
    const subtotal = this.calculateReceivedSubtotal(items);
    const ivaTotal = this.calculateReceivedIvaTotal(items);
    const iepsTotal = this.calculateReceivedIepsTotal(items);

    const total = subtotal + ivaTotal + iepsTotal;
    return this.roundToCurrency(total);
  }

  /**
   * Round a number to 2 decimal places for currency precision
   *
   * @param value The value to round
   * @returns Value rounded to 2 decimal places
   */
  private roundToCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
