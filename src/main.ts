import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'dotenv/config';
import { setupSwagger } from './config/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Clients or proxies that call /tenant/... without the global /api prefix would get 404
  // because routes are registered as /api/tenant/... . Normalize before routing.
  const httpServer = app.getHttpAdapter().getInstance();
  if (httpServer?.use) {
    httpServer.use((req: { url?: string }, _res: unknown, next: () => void) => {
      const u = req.url ?? '';
      if (u.startsWith('/tenant/') && !u.startsWith('/api/')) {
        req.url = `/api${u}`;
      }
      next();
    });
  }

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
  const productionOrigins = [
    'https://divino.sinergydigital.mx',
  ];
  const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server) send no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== 'production' && localDevOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }

      if (
        productionOrigins.includes(origin) ||
        /^https:\/\/([a-z0-9-]+\.)?sinergydigital\.mx$/.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Tenant-ID',
      'Cache-Control',
      'Pragma',
      'Expires',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
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
