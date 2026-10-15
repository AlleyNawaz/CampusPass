import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEV_AUTH_MODE === "true"
  ) {
    throw new Error("DEV_AUTH_MODE must never be enabled in production");
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 ===
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
  ) {
    throw new Error("Development credential key is forbidden in production");
  }
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.PUBLIC_WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("CampusPass API")
      .setDescription(
        "Local development contract. No live institution or payment integration is implied.",
      )
      .setVersion("0.1.0")
      .addApiKey(
        { type: "apiKey", in: "header", name: "x-demo-user-id" },
        "development-actor",
      )
      .build(),
  );
  SwaggerModule.setup("docs", app, document);
  await app.listen(Number(process.env.API_PORT ?? 3001), "0.0.0.0");
}

void bootstrap();
