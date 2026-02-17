import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities/transactions/transaction.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, EntityRegistry]),
    RBACModule,
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
