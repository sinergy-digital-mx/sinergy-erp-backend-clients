import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

@Entity('exchange_rates')
@Index('idx_exchange_rates_tenant_id', ['tenant_id'])
@Index('idx_exchange_rates_rate_date', ['rate_date'])
@Index('idx_exchange_rates_tenant_date', ['tenant_id', 'rate_date'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  tenant_id: string;

  @Column({ type: 'date' })
  @IsNotEmpty()
  rate_date: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.0001)
  exchange_rate: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
