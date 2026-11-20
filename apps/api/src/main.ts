import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: 'https://your-frontend-domain.com', // Cannot be '*' when credentials is true
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
