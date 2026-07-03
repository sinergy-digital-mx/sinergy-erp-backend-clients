import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrder } from './sales-order.entity';
import { User } from '../users/user.entity';
import { PosSalePaymentMethod } from '../pos/pos-sale-payment-method.enum';
import { SalesOrderPaymentDocument } from './sales-order-payment-document.entity';

@Entity('inv_s_sales_order_payments')
@Index('idx_so_payments_tenant', ['tenant_id'])
@Index('idx_so_payments_order_id', ['sales_order_id'])
@Index('idx_so_payments_date', ['payment_date'])
export class SalesOrderPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  sales_order_id: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['MXN', 'USD'],
    default: 'MXN',
  })
  currency: string;

  @Column({
    type: 'enum',
    enum: PosSalePaymentMethod,
  })
  payment_method: PosSalePaymentMethod;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference_number: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** Origen: detalle de orden o cobranza POS. */
  @Column({ type: 'varchar', length: 20, default: 'manual' })
  source: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column()
  created_by: string;

  @OneToMany(() => SalesOrderPaymentDocument, (doc) => doc.payment)
  documents: SalesOrderPaymentDocument[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
