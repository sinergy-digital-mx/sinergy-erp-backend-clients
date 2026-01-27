import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { setupSwagger } from './config/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  await app.listen(Number(process.env.APP_PORT) || 3000);
}
bootstrap();
