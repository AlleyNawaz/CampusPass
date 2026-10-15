import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { redeemTicketRequestSchema } from "@campuspass/contracts";
import { readDevActor } from "../../platform/dev-actor";
import { toHttpError } from "../../platform/domain-http";
import { AdmissionService } from "./admission.service";

@ApiTags("admission")
@Controller("scanner")
export class AdmissionController {
  constructor(private readonly admission: AdmissionService) {}

  @Post("redeem")
  @ApiHeader({ name: "x-demo-role", schema: { example: "GATE_STAFF" } })
  async redeem(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ) {
    const parsed = redeemTicketRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      });
    try {
      return await this.admission.redeem(readDevActor(headers), parsed.data);
    } catch (error) {
      toHttpError(error);
    }
  }
}
