import Link from "next/link";
import { SiteHeader } from "../components/site-header";

type FeaturedEvent = {
  slug: string;
  title: string;
  startsAt: string;
  timezone: string;
  university: { name: string };
  society: { name: string };
};

async function featuredEvent(): Promise<FeaturedEvent | null> {
  try {
    const response = await fetch(
      `${process.env.API_PUBLIC_URL ?? "http://localhost:3001/v1"}/events`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { data: FeaturedEvent[] };
    return body.data[0] ?? null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await featuredEvent();
  const eventDate = featured ? new Date(featured.startsAt) : null;
  return (
    <>
      <SiteHeader />
      <main id="main" className="home-main">
        <section className="new-hero">
          <div className="hero-editorial">
            <p className="micro-label">
              <span /> Built for campus life
            </p>
            <h1>
              Your campus,
              <br />
              <em>in motion.</em>
            </h1>
            <p className="hero-deck">
              Find the rooms where ideas turn into friendships. Reserve your
              place in seconds. Walk in with one trusted pass.
            </p>
            <div className="hero-actions-new">
              <Link className="solid-action" href="/events">
                Discover what’s on <span aria-hidden="true">↗</span>
              </Link>
              <Link className="quiet-action" href="/login">
                I already have a pass
              </Link>
            </div>
            <div className="hero-proof">
              <span>01</span>
              <p>
                <strong>Campus-first</strong> discovery, verified capacity, and
                one-scan entry.
              </p>
            </div>
          </div>

          <div className="hero-visual" aria-label="Featured CampusPass event">
            <div className="hero-poster">
              <div className="poster-grid" aria-hidden="true" />
              <div className="poster-topline">
                <span>CP / ISB</span>
                <span>2030</span>
              </div>
              <div className="poster-wordmark">
                <span>COME</span>
                <span>THROUGH</span>
              </div>
              <div className="poster-orbit" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="poster-footer">
                <span>Ideas.</span>
                <span>People.</span>
                <span>Momentum.</span>
              </div>
            </div>
            {featured && eventDate ? (
              <Link
                className="floating-event"
                href={`/events/${featured.slug}`}
              >
                <div className="floating-date">
                  <span>
                    {eventDate.toLocaleDateString("en-PK", {
                      month: "short",
                      timeZone: featured.timezone,
                    })}
                  </span>
                  <strong>
                    {eventDate.toLocaleDateString("en-PK", {
                      day: "2-digit",
                      timeZone: featured.timezone,
                    })}
                  </strong>
                </div>
                <div>
                  <small>Up next</small>
                  <strong>{featured.title}</strong>
                  <span>{featured.society.name}</span>
                </div>
                <b aria-hidden="true">↗</b>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="ticker" aria-label="CampusPass principles">
          <div>
            <span>Discover</span>
            <i>✦</i>
            <span>Reserve</span>
            <i>✦</i>
            <span>Show up</span>
            <i>✦</i>
            <span>Belong</span>
          </div>
        </section>

        <section className="manifesto" id="how-it-works">
          <div className="manifesto-heading">
            <p className="micro-label">
              <span /> The CampusPass way
            </p>
            <h2>
              Less admin.
              <br />
              <em>More atmosphere.</em>
            </h2>
          </div>
          <div className="manifesto-copy">
            <p>
              Campus events should feel electric—not buried under forms,
              screenshots, and chaotic group chats.
            </p>
            <p>
              CampusPass brings discovery, capacity, and entry into one calm
              flow, without putting student details inside the QR code.
            </p>
          </div>
        </section>

        <section className="steps-editorial">
          <article className="step-large">
            <span className="step-index">01 / DISCOVER</span>
            <div className="step-symbol symbol-discover" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <h3>Find your people.</h3>
            <p>
              Browse public, approved events from societies across your
              university. Search by the names and communities you already know.
            </p>
            <Link href="/events">
              Explore events <span>↗</span>
            </Link>
          </article>
          <article className="step-large inverse">
            <span className="step-index">02 / RESERVE</span>
            <div className="step-symbol symbol-reserve" aria-hidden="true">
              <i />
              <i />
            </div>
            <h3>Claim a real place.</h3>
            <p>
              Inventory stays under database authority, so “you’re in” means
              capacity has actually been reserved.
            </p>
            <Link href="/login">
              Open your account <span>↗</span>
            </Link>
          </article>
          <article className="step-large accent">
            <span className="step-index">03 / ARRIVE</span>
            <div className="step-symbol symbol-arrive" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <h3>One pass. One scan.</h3>
            <p>
              Your opaque ticket carries no student details and admits once
              through an authorized online scanner.
            </p>
            <Link href="/dashboard">
              See your passes <span>↗</span>
            </Link>
          </article>
        </section>

        <section className="closing-panel">
          <div>
            <p className="micro-label light">
              <span /> Tonight could be the start
            </p>
            <h2>
              Don’t hear about it
              <br />
              <em>the next morning.</em>
            </h2>
          </div>
          <Link className="round-action" href="/events">
            <span>
              See what’s
              <br />
              happening
            </span>
            <b aria-hidden="true">↗</b>
          </Link>
        </section>
      </main>
      <footer className="new-footer">
        <div className="app-brand">
          <span className="app-brand-mark">
            <span />
            <span />
          </span>
          <span>CampusPass</span>
        </div>
        <p>Local product preview · Synthetic university data only</p>
        <div>
          <Link href="/events">Discover</Link>
          <Link href="/login">Sign in</Link>
        </div>
      </footer>
    </>
  );
}
