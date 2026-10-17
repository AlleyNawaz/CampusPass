import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { PrismaService } from "../../platform/prisma.service";
import { RateLimit } from "../../platform/rate-limit.decorator";
import { RateLimitGuard } from "../../platform/rate-limit.guard";

const universitySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(100);

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiQuery({ name: "university", required: false })
  @RateLimit({ name: "events-list", limit: 120, windowSeconds: 60 })
  @UseGuards(RateLimitGuard)
  async list(@Query("university") universitySlug?: string) {
    if (
      universitySlug &&
      !universitySlugSchema.safeParse(universitySlug).success
    ) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid university query parameter",
      });
    }
    const events = await this.prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        ...(universitySlug ? { university: { slug: universitySlug } } : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        startsAt: true,
        endsAt: true,
        timezone: true,
        university: { select: { name: true, slug: true } },
        society: { select: { name: true, slug: true } },
        ticketTypes: {
          where: { active: true },
          select: { id: true, name: true, priceMinor: true, currency: true },
        },
      },
      orderBy: { startsAt: "asc" },
      take: 50,
    });
    return { data: events, nextCursor: null };
  }
}
