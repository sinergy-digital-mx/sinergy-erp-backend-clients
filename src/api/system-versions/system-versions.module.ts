import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemVersion } from '../../entities/system-versions/system-version.entity';
import { RBACModule } from '../rbac/rbac.module';
import { SystemVersionsController } from './system-versions.controller';
import { SystemVersionsService } from './system-versions.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemVersion]), RBACModule],
  controllers: [SystemVersionsController],
  providers: [SystemVersionsService],
  exports: [SystemVersionsService],
})
export class SystemVersionsModule {}
