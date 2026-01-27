// src/entities/leads/lead-status.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('lead_status')
export class LeadStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;
}
