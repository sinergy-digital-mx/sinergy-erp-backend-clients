import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosSession } from '../../entities/pos/pos-session.entity';
import { PosConfiguration } from '../../entities/billing/pos-configuration.entity';
import { PosSessionController } from './pos-session.controller';
import { PosSessionService } from './pos-session.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PosSession, PosConfiguration]),
    RBACModule,
  ],
  controllers: [PosSessionController],
  providers: [PosSessionService],
  exports: [PosSessionService],
})
export class PosSessionsModule {}
