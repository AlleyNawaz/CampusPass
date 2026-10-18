import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedActor } from "../../auth/auth.types";
import { CsrfGuard } from "../../auth/csrf.guard";
import { CurrentActor } from "../../auth/current-actor.decorator";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { SessionAuthGuard } from "../../auth/session-auth.guard";
import { RateLimit } from "../../platform/rate-limit.decorator";
import { RateLimitGuard } from "../../platform/rate-limit.guard";
import { updateStudentProfileSchema } from "./students.schemas";
import { StudentsService } from "./students.service";

@Controller("students/me")
@Roles("STUDENT")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get("dashboard")
  @RateLimit({
    name: "student-dashboard",
    limit: 60,
    windowSeconds: 60,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard, RolesGuard)
  dashboard(@CurrentActor() actor: AuthenticatedActor) {
    return this.students.dashboard(actor);
  }

  @Patch("profile")
  @RateLimit({
    name: "student-profile-update",
    limit: 10,
    windowSeconds: 60,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard, CsrfGuard, RolesGuard)
  updateProfile(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: unknown,
  ) {
    const parsed = updateStudentProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      });
    }
    return this.students.updateProfile(actor, parsed.data);
  }
}
