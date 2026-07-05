import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // const isProd = process.env.NODE_ENV === 'production';

  // app.use(
  //   helmet({
  //     contentSecurityPolicy: isProd ? undefined : false,
  //     crossOriginEmbedderPolicy: isProd,
  //     crossOriginResourcePolicy: {
  //       policy: 'cross-origin',
  //     },
  //   }),
  // );

  const config = new DocumentBuilder()
    .setTitle('club')
    .setDescription('panel management club')
    .setVersion('1.0.0')
    .build();

  app.use(compression());

  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.useGlobalFilters(new AllExceptionFilter(logger), new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const configSwagger: SwaggerCustomOptions = {
    useGlobalPrefix: true,
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/docs", app, documentFactory, configSwagger);

  await app.listen(3000);
}
bootstrap();
