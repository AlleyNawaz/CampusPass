import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import type { EventResult } from "../events-explorer";

export const dynamic = "force-dynamic";

async function loadEvent(slug: string): Promise<EventResult | null> {
  try {
    const response = await fetch(
      `${process.env.API_PUBLIC_URL ?? "http://localhost:3001/v1"}/events`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { data: EventResult[] };
    return body.data.find((event) => event.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const freeTier = event.ticketTypes.find((tier) => tier.priceMinor === 0);

  return (
    <>
      <SiteHeader context="Event" />
      <main id="main" className="event-detail-shell">
        <section className="event-detail-cover art-violet">
          <span>{event.university.name}</span>
          <strong>{event.title.slice(0, 1)}</strong>
          <i>CP / EVENT</i>
        </section>
        <section className="event-detail-grid">
          <div className="event-detail-copy">
            <p className="micro-label">
              <span /> {event.society.name}
            </p>
            <h1>{event.title}</h1>
            <p className="event-detail-lede">
              A verified campus event from {event.society.name}. Reserve against
              real capacity and keep your entry pass ready in your CampusPass
              wallet.
            </p>
            <dl className="event-facts">
              <div>
                <dt>Date</dt>
                <dd>
                  {new Intl.DateTimeFormat("en-PK", {
                    dateStyle: "full",
                    timeZone: event.timezone,
                  }).format(startsAt)}
                </dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>
                  {new Intl.DateTimeFormat("en-PK", {
                    timeStyle: "short",
                    timeZone: event.timezone,
                  }).format(startsAt)}{" "}
                  –{" "}
                  {new Intl.DateTimeFormat("en-PK", {
                    timeStyle: "short",
                    timeZone: event.timezone,
                  }).format(endsAt)}
                </dd>
              </div>
              <div>
                <dt>University</dt>
                <dd>{event.university.name}</dd>
              </div>
            </dl>
          </div>
          <aside className="registration-card">
            <span className="step-index">REGISTRATION</span>
            <h2>{freeTier ? "Free entry" : "Registration unavailable"}</h2>
            <p>
              {freeTier
                ? `${freeTier.name} · secure one-time pass`
                : "Paid ticketing is intentionally disabled in this build."}
            </p>
            {freeTier ? (
              <Link
                className="solid-action wide"
                href={`/login?returnTo=/events/${event.slug}`}
              >
                Sign in to reserve <span>↗</span>
              </Link>
            ) : null}
            <small>
              Capacity and eligibility are confirmed by the server—not the
              browser.
            </small>
          </aside>
        </section>
      </main>
    </>
  );
}
