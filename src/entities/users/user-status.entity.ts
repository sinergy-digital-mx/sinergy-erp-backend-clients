// src/entities/users/user-status.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_status')
export class UserStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;
}
