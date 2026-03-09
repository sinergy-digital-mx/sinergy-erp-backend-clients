import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSOrder } from '../../entities/pos/pos-order.entity';
import { POSPayment } from '../../entities/pos/pos-payment.entity';
import { POSOrderLine } from '../../entities/pos/pos-order-line.entity';

// Report interfaces
export interface DailySalesReport {
  date: string;
  warehouse_id: string;
  total_sales: number;
  total_orders: number;
  average_ticket: number;
  total_tips: number;
  total_discounts: number;
  sales_by_payment_method: PaymentMethodSummary[];
  sales_by_waiter: WaiterSummary[];
  sales_by_hour: HourlySales[];
  top_products: ProductSummary[];
}

export interface PaymentMethodSummary {
  payment_method: string;
  total_amount: number;
  payment_count: number;
  percentage: number;
}

export interface WaiterSummary {
  waiter_id: string;
  waiter_name: string;
  total_sales: number;
  order_count: number;
  average_ticket: number;
  total_tips: number;
}

export interface HourlySales {
  hour: number;
  total_sales: number;
  order_count: number;
}

export interface ProductSummary {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface WaiterReport {
  waiter_id: string;
  waiter_name: string;
  date_from: string;
  date_to: string;
  total_sales: number;
  total_orders: number;
  average_ticket: number;
  total_tips: number;
}

export interface PaymentMethodReport {
  warehouse_id: string;
  date_from: string;
  date_to: string;
  payment_methods: PaymentMethodSummary[];
  total_amount: number;
}

@Injectable()
export class POSReportService {
  constructor(
    @InjectRepository(POSOrder)
    private posOrderRepo: Repository<POSOrder>,
    @InjectRepository(POSPayment)
    private posPaymentRepo: Repository<POSPayment>,
    @InjectRepository(POSOrderLine)
    private posOrderLineRepo: Repository<POSOrderLine>,
  ) {}

  /**
   * Get daily sales report for a specific warehouse and date
   * Requirements: 18.1-18.9
   */
  async getDailySalesReport(
    warehouseId: string,
    date: Date,
    tenantId: string,
  ): Promise<DailySalesReport> {
    // Set date range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all paid orders for the day
    const orders = await this.posOrderRepo.find({
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
        status: 'paid',
      },
      relations: ['waiter', 'payments', 'lines', 'lines.product'],
    });

    // Filter by date (paid_at)
    const dailyOrders = orders.filter(
      (order) =>
        order.paid_at &&
        order.paid_at >= startOfDay &&
        order.paid_at <= endOfDay,
    );

    // Calculate basic metrics
    const totalSales = dailyOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const totalOrders = dailyOrders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalTips = dailyOrders.reduce(
      (sum, order) => sum + Number(order.tip),
      0,
    );
    const totalDiscounts = dailyOrders.reduce(
      (sum, order) => sum + Number(order.discount),
      0,
    );

    // Calculate sales by payment method
    const salesByPaymentMethod = await this.calculateSalesByPaymentMethod(
      dailyOrders,
      totalSales,
    );

    // Calculate sales by waiter
    const salesByWaiter = this.calculateSalesByWaiter(dailyOrders);

    // Calculate sales by hour
    const salesByHour = this.calculateSalesByHour(dailyOrders);

    // Get top products
    const topProducts = this.calculateTopProducts(dailyOrders, 10);

    return {
      date: date.toISOString().split('T')[0],
      warehouse_id: warehouseId,
      total_sales: totalSales,
      total_orders: totalOrders,
      average_ticket: averageTicket,
      total_tips: totalTips,
      total_discounts: totalDiscounts,
      sales_by_payment_method: salesByPaymentMethod,
      sales_by_waiter: salesByWaiter,
      sales_by_hour: salesByHour,
      top_products: topProducts,
    };
  }

  /**
   * Get waiter performance report for a date range
   * Requirements: 18.1-18.9
   */
  async getWaiterPerformance(
    waiterId: string,
    dateFrom: Date,
    dateTo: Date,
    tenantId: string,
  ): Promise<WaiterReport> {
    // Get all paid orders for the waiter in the date range
    const orders = await this.posOrderRepo.find({
      where: {
        tenant_id: tenantId,
        waiter_id: waiterId,
        status: 'paid',
      },
      relations: ['waiter'],
    });

    // Filter by date range (paid_at)
    const filteredOrders = orders.filter(
      (order) =>
        order.paid_at && order.paid_at >= dateFrom && order.paid_at <= dateTo,
    );

    // Calculate metrics
    const totalSales = filteredOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const totalOrders = filteredOrders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalTips = filteredOrders.reduce(
      (sum, order) => sum + Number(order.tip),
      0,
    );

    // Get waiter name
    const waiterName =
      filteredOrders.length > 0 && filteredOrders[0].waiter
        ? `${filteredOrders[0].waiter.first_name || ''} ${filteredOrders[0].waiter.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown';

    return {
      waiter_id: waiterId,
      waiter_name: waiterName,
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: dateTo.toISOString().split('T')[0],
      total_sales: totalSales,
      total_orders: totalOrders,
      average_ticket: averageTicket,
      total_tips: totalTips,
    };
  }

  /**
   * Get top selling products for a warehouse and date range
   * Requirements: 18.1-18.9
   */
  async getTopProducts(
    warehouseId: string,
    dateFrom: Date,
    dateTo: Date,
    tenantId: string,
    limit: number = 10,
  ): Promise<ProductSummary[]> {
    // Get all paid orders in the date range
    const orders = await this.posOrderRepo.find({
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
        status: 'paid',
      },
      relations: ['lines', 'lines.product'],
    });

    // Filter by date range (paid_at)
    const filteredOrders = orders.filter(
      (order) =>
        order.paid_at && order.paid_at >= dateFrom && order.paid_at <= dateTo,
    );

    // Group by product and calculate totals
    const productMap = new Map<
      string,
      { product_id: string; product_name: string; quantity: number; revenue: number }
    >();

    filteredOrders.forEach((order) => {
      order.lines?.forEach((line) => {
        const productId = line.product_id;
        const existing = productMap.get(productId);

        if (existing) {
          existing.quantity += Number(line.quantity);
          existing.revenue += Number(line.line_total);
        } else {
          productMap.set(productId, {
            product_id: productId,
            product_name: line.product?.name || 'Unknown Product',
            quantity: Number(line.quantity),
            revenue: Number(line.line_total),
          });
        }
      });
    });

    // Convert to array and sort by quantity sold
    const products = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return products.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      quantity_sold: p.quantity,
      total_revenue: p.revenue,
    }));
  }

  /**
   * Get sales by hour for a specific warehouse and date
   * Requirements: 18.1-18.9
   */
  async getSalesByHour(
    warehouseId: string,
    date: Date,
    tenantId: string,
  ): Promise<HourlySales[]> {
    // Set date range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all paid orders for the day
    const orders = await this.posOrderRepo.find({
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
        status: 'paid',
      },
    });

    // Filter by date (paid_at)
    const dailyOrders = orders.filter(
      (order) =>
        order.paid_at &&
        order.paid_at >= startOfDay &&
        order.paid_at <= endOfDay,
    );

    return this.calculateSalesByHour(dailyOrders);
  }

  /**
   * Get sales by payment method for a warehouse and date range
   * Requirements: 18.1-18.9
   */
  async getSalesByPaymentMethod(
    warehouseId: string,
    dateFrom: Date,
    dateTo: Date,
    tenantId: string,
  ): Promise<PaymentMethodReport> {
    // Get all paid orders in the date range
    const orders = await this.posOrderRepo.find({
      where: {
        tenant_id: tenantId,
        warehouse_id: warehouseId,
        status: 'paid',
      },
      relations: ['payments'],
    });

    // Filter by date range (paid_at)
    const filteredOrders = orders.filter(
      (order) =>
        order.paid_at && order.paid_at >= dateFrom && order.paid_at <= dateTo,
    );

    // Calculate total sales
    const totalSales = filteredOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    // Calculate sales by payment method
    const paymentMethods = await this.calculateSalesByPaymentMethod(
      filteredOrders,
      totalSales,
    );

    return {
      warehouse_id: warehouseId,
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: dateTo.toISOString().split('T')[0],
      payment_methods: paymentMethods,
      total_amount: totalSales,
    };
  }

  // Private helper methods

  private async calculateSalesByPaymentMethod(
    orders: POSOrder[],
    totalSales: number,
  ): Promise<PaymentMethodSummary[]> {
    const paymentMethodMap = new Map<
      string,
      { amount: number; count: number }
    >();

    orders.forEach((order) => {
      order.payments?.forEach((payment) => {
        const method = payment.payment_method;
        const existing = paymentMethodMap.get(method);

        if (existing) {
          existing.amount += Number(payment.amount);
          existing.count += 1;
        } else {
          paymentMethodMap.set(method, {
            amount: Number(payment.amount),
            count: 1,
          });
        }
      });
    });

    return Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      payment_method: method,
      total_amount: data.amount,
      payment_count: data.count,
      percentage: totalSales > 0 ? (data.amount / totalSales) * 100 : 0,
    }));
  }

  private calculateSalesByWaiter(orders: POSOrder[]): WaiterSummary[] {
    const waiterMap = new Map<
      string,
      {
        waiter_id: string;
        waiter_name: string;
        total_sales: number;
        order_count: number;
        total_tips: number;
      }
    >();

    orders.forEach((order) => {
      const waiterId = order.waiter_id;
      const existing = waiterMap.get(waiterId);

      if (existing) {
        existing.total_sales += Number(order.total);
        existing.order_count += 1;
        existing.total_tips += Number(order.tip);
      } else {
        const waiterFullName = order.waiter
          ? `${order.waiter.first_name || ''} ${order.waiter.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown';
        
        waiterMap.set(waiterId, {
          waiter_id: waiterId,
          waiter_name: waiterFullName,
          total_sales: Number(order.total),
          order_count: 1,
          total_tips: Number(order.tip),
        });
      }
    });

    return Array.from(waiterMap.values()).map((waiter) => ({
      ...waiter,
      average_ticket:
        waiter.order_count > 0
          ? waiter.total_sales / waiter.order_count
          : 0,
    }));
  }

  private calculateSalesByHour(orders: POSOrder[]): HourlySales[] {
    // Initialize array with 24 hours
    const hourlyData: HourlySales[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      total_sales: 0,
      order_count: 0,
    }));

    orders.forEach((order) => {
      if (order.paid_at) {
        const hour = order.paid_at.getHours();
        hourlyData[hour].total_sales += Number(order.total);
        hourlyData[hour].order_count += 1;
      }
    });

    return hourlyData;
  }

  private calculateTopProducts(
    orders: POSOrder[],
    limit: number,
  ): ProductSummary[] {
    const productMap = new Map<
      string,
      { product_id: string; product_name: string; quantity: number; revenue: number }
    >();

    orders.forEach((order) => {
      order.lines?.forEach((line) => {
        const productId = line.product_id;
        const existing = productMap.get(productId);

        if (existing) {
          existing.quantity += Number(line.quantity);
          existing.revenue += Number(line.line_total);
        } else {
          productMap.set(productId, {
            product_id: productId,
            product_name: line.product?.name || 'Unknown Product',
            quantity: Number(line.quantity),
            revenue: Number(line.line_total),
          });
        }
      });
    });

    // Convert to array and sort by quantity sold
    const products = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return products.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      quantity_sold: p.quantity,
      total_revenue: p.revenue,
    }));
  }
}
