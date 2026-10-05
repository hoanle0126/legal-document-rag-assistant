import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security: Helmet HTTP Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // Security: Strict CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Legal Document RAG Assistant API')
    .setDescription(
      'Hệ thống Trợ lý Trí tuệ Nhân tạo Tra cứu và Giải đáp Văn bản Quy phạm Pháp luật với Trích dẫn Xác thực Nguồn',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth - Xác thực người dùng')
    .addTag('Documents - Quản lý Văn bản Pháp luật')
    .addTag('RAG - Hỏi đáp Pháp lý')
    .addTag('Chat - Trợ lý Hỏi đáp Pháp lý')
    .addTag('Settings - Cấu hình Hệ thống')
    .addTag('Health - Giám sát Hệ thống')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Legal Document RAG Assistant - API Docs',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Server is running at http://localhost:${port}/api`);
  logger.log(`Swagger OpenAPI Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
