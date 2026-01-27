import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { setupSwagger } from './config/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://localhost:8080',
      'https://divino.sinergydigital.mx',
      'https://*.sinergydigital.mx',
      '*' // Temporary wildcard - remove in production
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Tenant-ID'
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  setupSwagger(app);

  await app.listen(Number(process.env.APP_PORT) || 3000);
}
bootstrap();
