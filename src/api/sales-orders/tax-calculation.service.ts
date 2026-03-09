import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

interface LineItemTotals {
  subtotal: number;
  iva_amount: number;
  ieps_amount: number;
  line_total: number;
}

interface OrderTotals {
  total_subtotal: number;
  total_iva: number;
  total_ieps: number;
  grand_total: number;
}

@Injectable()
export class TaxCalculationService {
  /**
   * Calculate line item totals including taxes
   */
  calculateLineItemTotals(
    quantity: number,
    unit_price: number,
    iva_percentage: number = 0,
    ieps_percentage: number = 0,
  ): LineItemTotals {
    const qty = new Decimal(quantity);
    const price = new Decimal(unit_price);
    const iva_pct = new Decimal(iva_percentage);
    const ieps_pct = new Decimal(ieps_percentage);

    // Calculate subtotal
    const subtotal = qty.times(price);

    // Calculate IVA and IEPS
    const iva_amount = subtotal.times(iva_pct).dividedBy(100);
    const ieps_amount = subtotal.times(ieps_pct).dividedBy(100);

    // Calculate line total
    const line_total = subtotal.plus(iva_amount).plus(ieps_amount);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      iva_amount: parseFloat(iva_amount.toFixed(2)),
      ieps_amount: parseFloat(ieps_amount.toFixed(2)),
      line_total: parseFloat(line_total.toFixed(2)),
    };
  }

  /**
   * Calculate order totals from line items
   */
  calculateOrderTotals(lineItems: any[]): OrderTotals {
    let total_subtotal = new Decimal(0);
    let total_iva = new Decimal(0);
    let total_ieps = new Decimal(0);

    for (const item of lineItems) {
      total_subtotal = total_subtotal.plus(new Decimal(item.subtotal));
      total_iva = total_iva.plus(new Decimal(item.iva_amount));
      total_ieps = total_ieps.plus(new Decimal(item.ieps_amount));
    }

    const grand_total = total_subtotal.plus(total_iva).plus(total_ieps);

    return {
      total_subtotal: parseFloat(total_subtotal.toFixed(2)),
      total_iva: parseFloat(total_iva.toFixed(2)),
      total_ieps: parseFloat(total_ieps.toFixed(2)),
      grand_total: parseFloat(grand_total.toFixed(2)),
    };
  }
}
