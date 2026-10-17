import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./platform/api-exception.filter";
import { sessionCookieName } from "./auth/auth.constants";
import { validateAuthenticationEnvironment } from "./auth/auth.environment";
import {
  approvedWebOrigins,
  requestBodyLimit,
  validateApiEnvironment,
} from "./platform/security.environment";

async function bootstrap() {
  validateAuthenticationEnvironment();
  validateApiEnvironment();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: requestBodyLimit(),
      trustProxy: process.env.TRUST_PROXY === "true",
    }),
    {
      bufferLogs: true,
    },
  );
  // Nest and the plugin resolve separate, compatible Fastify type instances in
  // this workspace; the runtime plugin contract is Fastify 5 on both sides.
  await app.register(fastifyCookie as never);
  await app.register(fastifyHelmet as never, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
  });
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({
    origin: approvedWebOrigins(),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Idempotency-Key",
      "X-CSRF-Token",
      "X-Request-Id",
    ],
    maxAge: 600,
  });

  if (process.env.NODE_ENV !== "production") {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("CampusPass API")
        .setDescription(
          "Local development contract. No live institution or payment integration is implied.",
        )
        .setVersion("0.1.0")
        .addCookieAuth(
          sessionCookieName(),
          { type: "apiKey", in: "cookie", name: sessionCookieName() },
          "session",
        )
        .build(),
    );
    SwaggerModule.setup("docs", app, document);
  }
  await app.listen(
    Number(process.env.API_PORT ?? 3001),
    process.env.API_HOST ??
      (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  );
}

void bootstrap();
