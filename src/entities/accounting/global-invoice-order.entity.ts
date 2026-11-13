import { PrimaryGeneratedColumn, Column, Entity, Index } from 'typeorm';

@Entity('global_invoice_orders')
@Index('uq_global_invoice_order', ['global_invoice_id', 'sales_order_id'], { unique: true })
@Index('idx_global_invoice_order_sales', ['sales_order_id'])
export class GlobalInvoiceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  global_invoice_id: string;

  @Column()
  sales_order_id: string;
}

