"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Dashboard = {
  profile: {
    displayName: string;
    email: string;
    timezone: string;
    emailVerified: boolean;
    university: { name: string; slug: string };
  };
  summary: { activeTickets: number; upcomingEvents: number; bookings: number };
  tickets: Array<{
    id: string;
    status: string;
    credential: string | null;
    event: {
      slug: string;
      title: string;
      startsAt: string;
      timezone: string;
      venue: { name: string; addressText: string };
    };
    ticketType: { name: string };
  }>;
  orders: Array<{
    id: string;
    status: string;
    createdAt: string;
    event: { title: string };
    items: Array<{ quantity: number; ticketType: { name: string } }>;
  }>;
};

export function StudentDashboard() {
  const [data, setData] = useState<Dashboard>();
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Dashboard>("/students/me/dashboard")
      .then(setData)
      .catch((caught) => {
        if (
          caught &&
          typeof caught === "object" &&
          "status" in caught &&
          caught.status === 401
        ) {
          window.location.replace("/login?returnTo=/dashboard");
          return;
        }
        setError(
          caught instanceof Error ? caught.message : "Dashboard unavailable.",
        );
      });
  }, []);

  if (error) {
    return (
      <section className="empty-state" role="alert">
        <h1>We couldn’t load your dashboard</h1>
        <p>{error}</p>
        <button
          className="button secondary"
          onClick={() => window.location.reload()}
          type="button"
        >
          Retry
        </button>
      </section>
    );
  }
  if (!data)
    return (
      <p className="loading-state" role="status">
        Loading your passes…
      </p>
    );

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">{data.profile.university.name}</p>
          <h1>Welcome, {data.profile.displayName.split(" ")[0]}.</h1>
          <p className="muted-copy">
            Your bookings and active entry credentials, directly from
            CampusPass.
          </p>
        </div>
        <Link className="button primary" href="/events">
          Find an event
        </Link>
      </section>
      <section className="metric-grid" aria-label="Account summary">
        <article>
          <strong>{data.summary.activeTickets}</strong>
          <span>Active passes</span>
        </article>
        <article>
          <strong>{data.summary.upcomingEvents}</strong>
          <span>Upcoming events</span>
        </article>
        <article>
          <strong>{data.summary.bookings}</strong>
          <span>Total bookings</span>
        </article>
      </section>
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">Wallet</p>
            <h2>Your tickets</h2>
          </div>
        </div>
        {data.tickets.length === 0 ? (
          <div className="empty-state compact">
            <h3>No tickets yet</h3>
            <p>Reserve a free event pass to see it here.</p>
          </div>
        ) : (
          <div className="wallet-grid">
            {data.tickets.map((ticket) => (
              <article className="wallet-card" key={ticket.id}>
                <div className="ticket-topline">
                  <span>{ticket.status}</span>
                  <span>{ticket.ticketType.name}</span>
                </div>
                <div>
                  <p className="ticket-kicker">{ticket.event.venue.name}</p>
                  <h3>{ticket.event.title}</h3>
                  <p>
                    {new Intl.DateTimeFormat("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: ticket.event.timezone,
                    }).format(new Date(ticket.event.startsAt))}
                  </p>
                </div>
                <div className="credential-panel">
                  <span>Secure credential</span>
                  <code>
                    {ticket.credential ?? "Unavailable for this ticket state"}
                  </code>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="dashboard-section">
        <p className="eyebrow">History</p>
        <h2>Bookings</h2>
        {data.orders.length === 0 ? (
          <p className="muted-copy">No booking history yet.</p>
        ) : (
          <div className="history-list">
            {data.orders.map((order) => (
              <article key={order.id}>
                <div>
                  <strong>{order.event.title}</strong>
                  <span>
                    {order.items
                      .map(
                        (item) => `${item.quantity} × ${item.ticketType.name}`,
                      )
                      .join(", ")}
                  </span>
                </div>
                <div>
                  <strong>{order.status}</strong>
                  <span>
                    {new Intl.DateTimeFormat("en-PK", {
                      dateStyle: "medium",
                    }).format(new Date(order.createdAt))}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
