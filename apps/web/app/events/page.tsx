import { SiteHeader } from "../../components/site-header";
import { EventsExplorer, type EventResult } from "./events-explorer";

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
      <SiteHeader context="Discover" />
      <main id="main" className="discover-shell">
        <section className="discover-intro">
          <p className="micro-label">
            <span /> Islamabad · Campus events
          </p>
          <h1>
            Find your next
            <br />
            <em>good story.</em>
          </h1>
          <p>
            Workshops, talks, competitions, and nights worth leaving your room
            for—curated across your campus.
          </p>
        </section>
        {unavailable ? (
          <section className="empty-state refined" role="status">
            <span aria-hidden="true">↻</span>
            <h2>The local API is unavailable</h2>
            <p>
              Start PostgreSQL and the API, then retry. No cached private event
              data is shown.
            </p>
            <a className="button secondary" href="/events">
              Retry
            </a>
          </section>
        ) : events.length === 0 ? (
          <section className="empty-state refined">
            <h2>No public demo events yet</h2>
            <p>Seed the local database to add one synthetic event.</p>
          </section>
        ) : (
          <EventsExplorer events={events} />
        )}
      </main>
    </>
  );
}
