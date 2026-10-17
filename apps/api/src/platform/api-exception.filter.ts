import { randomUUID } from "node:crypto";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

type ErrorRequest = {
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
};
type ErrorReply = {
  header(name: string, value: string): ErrorReply;
  status(code: number): ErrorReply;
  send(body: unknown): void;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<ErrorRequest>();
    const reply = http.getResponse<ErrorReply>();
    const supplied = request.headers?.["x-request-id"];
    const correlationId =
      typeof supplied === "string" && /^[A-Za-z0-9._-]{8,100}$/.test(supplied)
        ? supplied
        : randomUUID();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const response =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const record =
      response && typeof response === "object"
        ? (response as Record<string, unknown>)
        : undefined;
    const code =
      typeof record?.code === "string"
        ? record.code
        : status === 500
          ? "INTERNAL_ERROR"
          : `HTTP_${status}`;
    const message =
      status === 500
        ? "An unexpected error occurred"
        : typeof record?.message === "string"
          ? record.message
          : typeof response === "string"
            ? response
            : "Request failed";

    if (status >= 500) {
      const errorName =
        exception instanceof Error ? exception.name : "UnknownError";
      this.logger.error(
        `${correlationId} ${request.method ?? "UNKNOWN"} ${request.url ?? ""} ${errorName}`,
      );
    }
    reply.header("x-request-id", correlationId).status(status).send({
      error: { code, message, correlationId },
    });
  }
}
