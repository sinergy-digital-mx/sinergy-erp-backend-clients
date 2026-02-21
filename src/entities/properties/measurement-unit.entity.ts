import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('measurement_units')
@Index('code_index', ['code'], { unique: true })
export class MeasurementUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  code: string; // m2, acres, ft2, yd2, ha, km2

  @Column({ length: 100 })
  name: string; // Metro cuadrado, Acres, etc

  @Column({ length: 10 })
  symbol: string; // m², ac, ft², yd², ha, km²

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['metric', 'imperial'], default: 'metric' })
  system: string;

  @OneToMany(() => Property, (property) => property.measurement_unit)
  properties: Property[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
