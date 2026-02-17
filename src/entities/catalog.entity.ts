import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum CatalogType {
    PHONE_COUNTRY = 'phone_country',
    INDUSTRY = 'industry',
    LEAD_SOURCE = 'lead_source',
    CUSTOMER_TYPE = 'customer_type',
    ACTIVITY_TYPE = 'activity_type',
}

@Entity('catalogs')
@Index('catalog_type_index', ['catalog_type'])
@Index('catalog_code_index', ['code'])
@Index('catalog_name_index', ['name'])
export class Catalog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: CatalogType,
    })
    catalog_type: CatalogType;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 50 })
    code: string; // e.g., 'US', 'MX' for phone countries

    @Column({ length: 100, nullable: true })
    value: string; // e.g., '+1', '+52' for phone countries

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>; // For additional data like flag_emoji, etc.

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
