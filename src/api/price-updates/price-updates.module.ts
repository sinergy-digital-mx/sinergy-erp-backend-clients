import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { PriceUpdatesController } from './price-updates.controller';
import { PriceUpdatesService } from './price-updates.service';

@Module({
  imports: [AuthModule, RBACModule],
  controllers: [PriceUpdatesController],
  providers: [PriceUpdatesService],
})
export class PriceUpdatesModule {}
