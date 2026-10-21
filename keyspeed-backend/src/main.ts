import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { mongoSanitizeMiddleware } from './common/middleware/mongo-sanitize.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permissive for Swagger UI and local development
      crossOriginEmbedderPolicy: false,
    }),
  );

  // NoSQL Injection Sanitization
  app.use(mongoSanitizeMiddleware);

  // Cookie parser middleware
  app.use(cookieParser());

  // Global prefix /api
  app.setGlobalPrefix('api');

  // Hardened CORS configuration
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger Documentation setup at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('KeySpeed API')
    .setDescription('KeySpeed v1 - Real-time Multiplayer Typing Game Backend REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`KeySpeed backend running on: http://localhost:${port}/api`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
