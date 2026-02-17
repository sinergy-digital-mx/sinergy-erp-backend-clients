import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('phone_countries')
@Index('phone_country_code_index', ['phone_code'])
@Index('phone_country_name_index', ['country_name'])
export class PhoneCountry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    country_name: string;

    @Column({ length: 3 })
    country_code: string; // ISO 3166-1 alpha-2 (e.g., 'US', 'MX', 'ES')

    @Column({ length: 20 })
    phone_code: string; // e.g., '+1', '+52', '+34'

    @Column({ type: 'text', nullable: true })
    flag_emoji: string; // e.g., '🇺🇸', '🇲🇽'

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
