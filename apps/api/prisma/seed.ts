import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ids = {
  university: "10000000-0000-4000-8000-000000000001",
  campus: "10000000-0000-4000-8000-000000000002",
  society: "10000000-0000-4000-8000-000000000003",
  venue: "10000000-0000-4000-8000-000000000004",
  gate: "10000000-0000-4000-8000-000000000005",
  event: "10000000-0000-4000-8000-000000000006",
  ticketType: "10000000-0000-4000-8000-000000000007",
  student: "10000000-0000-4000-8000-000000000008",
  scanner: "10000000-0000-4000-8000-000000000009",
  scanSession: "10000000-0000-4000-8000-000000000010",
};

async function main() {
  await prisma.university.upsert({
    where: { id: ids.university },
    update: {},
    create: {
      id: ids.university,
      slug: "demo-university",
      name: "Demo University",
      status: "ACTIVE",
    },
  });
  await prisma.campus.upsert({
    where: { id: ids.campus },
    update: {},
    create: {
      id: ids.campus,
      universityId: ids.university,
      slug: "main",
      name: "Main Campus",
    },
  });
  await prisma.society.upsert({
    where: { id: ids.society },
    update: {},
    create: {
      id: ids.society,
      universityId: ids.university,
      slug: "demo-society",
      name: "Demo Society",
      status: "APPROVED",
    },
  });
  await prisma.venue.upsert({
    where: { id: ids.venue },
    update: {},
    create: {
      id: ids.venue,
      universityId: ids.university,
      campusId: ids.campus,
      name: "Demo Hall",
      capacity: 100,
      addressText: "Synthetic campus venue",
    },
  });
  await prisma.venueGate.upsert({
    where: { id: ids.gate },
    update: {},
    create: {
      id: ids.gate,
      universityId: ids.university,
      venueId: ids.venue,
      label: "Gate A",
    },
  });
  for (const user of [
    {
      id: ids.student,
      emailNormalized: "student@example.invalid",
      displayName: "Demo Student",
    },
    {
      id: ids.scanner,
      emailNormalized: "scanner@example.invalid",
      displayName: "Demo Scanner",
    },
  ]) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        ...user,
        universityId: ids.university,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
  }
  const startsAt = new Date("2030-10-15T10:00:00.000Z");
  const endsAt = new Date("2030-10-15T12:00:00.000Z");
  await prisma.event.upsert({
    where: { id: ids.event },
    update: { startsAt, endsAt },
    create: {
      id: ids.event,
      universityId: ids.university,
      campusId: ids.campus,
      societyId: ids.society,
      venueId: ids.venue,
      slug: "demo-open-house",
      title: "CampusPass Demo Open House",
      description: "Synthetic event data for local development only.",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      startsAt,
      endsAt,
      capacity: 100,
      policyVersion: "demo-v1",
    },
  });
  await prisma.ticketType.upsert({
    where: { id: ids.ticketType },
    update: {
      salesStart: new Date("2026-10-15T00:00:00.000Z"),
      salesEnd: startsAt,
    },
    create: {
      id: ids.ticketType,
      universityId: ids.university,
      eventId: ids.event,
      name: "Free admission",
      priceMinor: 0,
      perUserLimit: 1,
      salesStart: new Date("2026-10-15T00:00:00.000Z"),
      salesEnd: startsAt,
      inventory: { create: { universityId: ids.university, capacity: 100 } },
    },
  });
  await prisma.eventStaff.upsert({
    where: {
      eventId_gateId_userId: {
        eventId: ids.event,
        gateId: ids.gate,
        userId: ids.scanner,
      },
    },
    update: {
      revokedAt: null,
      validFrom: new Date("2026-10-15T00:00:00.000Z"),
      validUntil: endsAt,
    },
    create: {
      universityId: ids.university,
      eventId: ids.event,
      gateId: ids.gate,
      userId: ids.scanner,
      role: "GATE_STAFF",
      validFrom: new Date("2026-10-15T00:00:00.000Z"),
      validUntil: endsAt,
    },
  });
  await prisma.scanSession.upsert({
    where: { id: ids.scanSession },
    update: { endedAt: null },
    create: {
      id: ids.scanSession,
      universityId: ids.university,
      eventId: ids.event,
      gateId: ids.gate,
      scannerId: ids.scanner,
      deviceLabel: "Synthetic scanner",
    },
  });
  process.stdout.write(`${JSON.stringify(ids, null, 2)}\n`);
}

main().finally(() => prisma.$disconnect());
