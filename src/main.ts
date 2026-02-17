import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'dotenv/config';
import { setupSwagger } from './config/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation and transformation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://localhost:3001',
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

  // Set global API prefix
  app.setGlobalPrefix('api');

  setupSwagger(app);

  const port = Number(process.env.APP_PORT) || 3000;
  console.log(`[BOOTSTRAP] Starting server on port ${port}...`);
  await app.listen(port);
  console.log(`[BOOTSTRAP] Server is running on port ${port}`);
}
bootstrap().catch(err => {
  console.error('[BOOTSTRAP] Error starting server:', err);
  process.exit(1);
});
