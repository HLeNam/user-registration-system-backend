import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CustomValidationPipe } from 'src/common/pipes/validation.pipe';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from 'src/common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('query parser', 'extended');

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'https://your-frontend-domain.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(new CustomValidationPipe());

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global filters (order matters!)
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📋 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
