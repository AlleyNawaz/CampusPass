import Link from "next/link";

type EventResult = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  timezone: string;
  university: { name: string };
  society: { name: string };
  ticketTypes: Array<{
    id: string;
    name: string;
    priceMinor: number;
    currency: string;
  }>;
};

export const dynamic = "force-dynamic";

async function loadEvents(): Promise<{
  events: EventResult[];
  unavailable: boolean;
}> {
  try {
    const response = await fetch(
      `${process.env.API_PUBLIC_URL ?? "http://localhost:3001/v1"}/events`,
      { cache: "no-store" },
    );
    if (!response.ok) return { events: [], unavailable: true };
    const body = (await response.json()) as { data: EventResult[] };
    return { events: body.data, unavailable: false };
  } catch {
    return { events: [], unavailable: true };
  }
}

export default async function EventsPage() {
  const { events, unavailable } = await loadEvents();
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">CP</span>
          <span>CampusPass</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <span className="status-pill">Synthetic data only</span>
        </nav>
      </header>
      <main id="main" className="events-shell">
        <div className="section-heading">
          <p className="eyebrow">Explore</p>
          <h1>Events worth showing up for.</h1>
          <p>
            Only approved public events should appear here. This local build
            intentionally uses synthetic records.
          </p>
        </div>
        {unavailable ? (
          <section className="empty-state" role="status">
            <span aria-hidden="true">↻</span>
            <h2>The local API is unavailable</h2>
            <p>
              Start PostgreSQL and the API, then retry. No cached private event
              data is shown.
            </p>
            <Link className="button secondary" href="/events">
              Retry
            </Link>
          </section>
        ) : events.length === 0 ? (
          <section className="empty-state">
            <h2>No public demo events yet</h2>
            <p>Seed the local database to add one synthetic event.</p>
          </section>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <article className="event-card" key={event.id}>
                <div className="event-art" aria-hidden="true">
                  <span>{event.title.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="event-body">
                  <p className="ticket-kicker">
                    {event.university.name} · {event.society.name}
                  </p>
                  <h2>{event.title}</h2>
                  <p>
                    {new Intl.DateTimeFormat("en-PK", {
                      dateStyle: "long",
                      timeStyle: "short",
                      timeZone: event.timezone,
                    }).format(new Date(event.startsAt))}
                  </p>
                  <p className="price">
                    {event.ticketTypes.some((tier) => tier.priceMinor === 0)
                      ? "Free registration"
                      : "Paid tickets disabled"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
