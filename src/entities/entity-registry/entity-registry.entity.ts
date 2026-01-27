// src/entities/entity-registry.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('entity_registry')
export class EntityRegistry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;
}
