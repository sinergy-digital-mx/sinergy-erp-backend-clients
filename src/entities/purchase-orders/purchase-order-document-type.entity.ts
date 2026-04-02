import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('inv_s_purchase_order_document_types')
@Index('name_index', ['name'], { unique: true })
export class PurchaseOrderDocumentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
