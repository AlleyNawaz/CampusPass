"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type EventResult = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  university: { name: string; slug: string };
  society: { name: string; slug: string };
  ticketTypes: Array<{
    id: string;
    name: string;
    priceMinor: number;
    currency: string;
  }>;
};

const artClasses = ["art-violet", "art-coral", "art-cobalt", "art-lime"];

export function EventsExplorer({ events }: { events: EventResult[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "free">("all");
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter(
      (event) =>
        (filter === "all" ||
          event.ticketTypes.some((tier) => tier.priceMinor === 0)) &&
        (!normalized ||
          [event.title, event.society.name, event.university.name].some(
            (value) => value.toLowerCase().includes(normalized),
          )),
    );
  }, [events, filter, query]);

  return (
    <>
      <div className="discovery-toolbar">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search events</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, societies, universities"
          />
        </label>
        <div className="filter-pills" aria-label="Event filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
            type="button"
          >
            All events
          </button>
          <button
            className={filter === "free" ? "active" : ""}
            onClick={() => setFilter("free")}
            type="button"
          >
            Free entry
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <section className="empty-state refined" role="status">
          <span aria-hidden="true">✦</span>
          <h2>No events match that search</h2>
          <p>Try a society name, university, or clear the free-event filter.</p>
          <button
            className="text-action"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            type="button"
          >
            Reset filters
          </button>
        </section>
      ) : (
        <div className="editorial-event-grid">
          {visible.map((event, index) => {
            const date = new Date(event.startsAt);
            const isFree = event.ticketTypes.some(
              (tier) => tier.priceMinor === 0,
            );
            return (
              <article className="editorial-event-card" key={event.id}>
                <Link
                  className="event-card-link"
                  href={`/events/${event.slug}`}
                >
                  <div
                    className={`event-cover ${artClasses[index % artClasses.length]}`}
                  >
                    <span className="cover-campus">
                      {event.university.name}
                    </span>
                    <strong>{event.title.slice(0, 1)}</strong>
                    <span className="cover-stamp">
                      CP / {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="event-card-content">
                    <div
                      className="date-tile"
                      aria-label={date.toLocaleDateString("en-PK")}
                    >
                      <span>
                        {date.toLocaleDateString("en-PK", {
                          month: "short",
                          timeZone: event.timezone,
                        })}
                      </span>
                      <strong>
                        {date.toLocaleDateString("en-PK", {
                          day: "2-digit",
                          timeZone: event.timezone,
                        })}
                      </strong>
                    </div>
                    <div className="event-card-copy">
                      <h2>{event.title}</h2>
                      <p>{event.society.name}</p>
                      <span>
                        {new Intl.DateTimeFormat("en-PK", {
                          weekday: "short",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: event.timezone,
                        }).format(date)}
                        <i>·</i>
                        {isFree ? "Free" : "Paid registration unavailable"}
                      </span>
                    </div>
                    <span className="event-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
