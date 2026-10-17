import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { redeemTicketRequestSchema } from "@campuspass/contracts";
import type { AuthenticatedActor } from "../../auth/auth.types";
import { CsrfGuard } from "../../auth/csrf.guard";
import { CurrentActor } from "../../auth/current-actor.decorator";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { SessionAuthGuard } from "../../auth/session-auth.guard";
import { toHttpError } from "../../platform/domain-http";
import { RateLimit } from "../../platform/rate-limit.decorator";
import { RateLimitGuard } from "../../platform/rate-limit.guard";
import { AdmissionService } from "./admission.service";

@ApiTags("admission")
@Controller("scanner")
export class AdmissionController {
  constructor(private readonly admission: AdmissionService) {}

  @Post("redeem")
  @Roles("GATE_STAFF")
  @RateLimit({
    name: "ticket-redeem",
    limit: 240,
    windowSeconds: 60,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard, CsrfGuard, RolesGuard)
  async redeem(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: unknown,
  ) {
    const parsed = redeemTicketRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      });
    try {
      return await this.admission.redeem(actor, parsed.data);
    } catch (error) {
      toHttpError(error);
    }
  }
}
