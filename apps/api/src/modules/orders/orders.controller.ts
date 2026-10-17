import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { freeRegistrationRequestSchema } from "@campuspass/contracts";
import type { AuthenticatedActor } from "../../auth/auth.types";
import { CsrfGuard } from "../../auth/csrf.guard";
import { CurrentActor } from "../../auth/current-actor.decorator";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { SessionAuthGuard } from "../../auth/session-auth.guard";
import { toHttpError } from "../../platform/domain-http";
import { RateLimit } from "../../platform/rate-limit.decorator";
import { RateLimitGuard } from "../../platform/rate-limit.guard";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("free")
  @Roles("STUDENT")
  @RateLimit({
    name: "free-order",
    limit: 20,
    windowSeconds: 60,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard, CsrfGuard, RolesGuard)
  @ApiHeader({ name: "idempotency-key", required: true })
  async register(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @CurrentActor() actor: AuthenticatedActor,
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
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)) {
      throw new BadRequestException({ code: "IDEMPOTENCY_KEY_REQUIRED" });
    }
    try {
      return await this.orders.createFreeRegistration(
        actor,
        parsed.data,
        idempotencyKey,
      );
    } catch (error) {
      toHttpError(error);
    }
  }
}
