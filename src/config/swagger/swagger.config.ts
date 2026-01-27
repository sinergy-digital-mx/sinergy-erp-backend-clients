// src/config/swagger/swagger.config.ts
import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Synergy API')
    .setDescription('Synergy ERP Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
