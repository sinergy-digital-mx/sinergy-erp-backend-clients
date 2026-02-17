import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdPartyConfig } from '../../entities/integrations/third-party-config.entity';
import { ThirdPartyConfigService } from './services/third-party-config.service';
import { EncryptionService } from './services/encryption.service';
import { ThirdPartyConfigController } from './controllers/third-party-config.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([ThirdPartyConfig]), RBACModule],
  providers: [ThirdPartyConfigService, EncryptionService],
  controllers: [ThirdPartyConfigController],
  exports: [ThirdPartyConfigService, EncryptionService],
})
export class IntegrationsModule {}
