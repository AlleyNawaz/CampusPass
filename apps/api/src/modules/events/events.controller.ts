import { Controller, Get, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../platform/prisma.service";

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiQuery({ name: "university", required: false })
  async list(@Query("university") universitySlug?: string) {
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
