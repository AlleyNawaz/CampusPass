import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { freeRegistrationRequestSchema } from "@campuspass/contracts";
import { readDevActor } from "../../platform/dev-actor";
import { toHttpError } from "../../platform/domain-http";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("free")
  @ApiHeader({ name: "idempotency-key", required: true })
  async register(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ) {
    const parsed = freeRegistrationRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      });
    const keyValue = headers["idempotency-key"];
    const idempotencyKey = Array.isArray(keyValue) ? keyValue[0] : keyValue;
    if (!idempotencyKey || idempotencyKey.length > 200) {
      throw new BadRequestException({ code: "IDEMPOTENCY_KEY_REQUIRED" });
    }
    try {
      return await this.orders.createFreeRegistration(
        readDevActor(headers),
        parsed.data,
        idempotencyKey,
      );
    } catch (error) {
      toHttpError(error);
    }
  }
}
