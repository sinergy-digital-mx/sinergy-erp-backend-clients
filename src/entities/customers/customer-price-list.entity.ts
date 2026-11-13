import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PriceList } from '../products/price-list.entity';
import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from './customer.entity';

@Entity('customer_price_lists')
@Index('customer_price_list_unique', ['tenant_id', 'customer_id', 'price_list_id'], {
  unique: true,
})
@Index('customer_price_list_customer_index', ['tenant_id', 'customer_id'])
export class CustomerPriceList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: number;

  @ManyToOne(() => PriceList, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'price_list_id' })
  price_list: PriceList;

  @Column()
  price_list_id: string;

  @Column({ default: false })
  is_default: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
