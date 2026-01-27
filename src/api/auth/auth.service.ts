// src/api/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({
            where: { email },
            relations: ['tenant', 'status'],
        });

        if (!user) throw new UnauthorizedException();

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException();

        user.last_login_at = new Date();
        await this.userRepo.save(user);

        const payload = {
            sub: user.id,
            tenant_id: user.tenant.id,
            status: user.status.code,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
