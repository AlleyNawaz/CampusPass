import Link from "next/link";

const trustPoints = [
  [
    "Inventory first",
    "Capacity stays under database authority—never a browser counter.",
  ],
  [
    "One credential",
    "Opaque, high-entropy QR tokens contain no student or contact details.",
  ],
  [
    "Online authority",
    "A successful scan requires an assigned operator and an atomic server decision.",
  ],
] as const;

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="CampusPass home">
          <span className="brand-mark" aria-hidden="true">
            CP
          </span>
          <span>CampusPass</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/events">Explore events</Link>
          <a href="#how-it-works">How it works</a>
          <span className="status-pill">Local foundation</span>
        </nav>
      </header>

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Campus events, operated with confidence</p>
            <h1>
              One ticket.
              <br />
              One scan.
              <br />
              <span>One entry.</span>
            </h1>
            <p className="lede">
              Discover events, reserve verified capacity, and move through the
              gate with a ticket designed for one authoritative redemption.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/events">
                Explore the demo
              </Link>
              <a className="button secondary" href="#pilot-note">
                Read the trust note
              </a>
            </div>
            <p className="fine-print">
              NUST-first product hypothesis. No institutional partnership or
              approval is claimed.
            </p>
          </div>

          <div
            className="ticket-stage"
            aria-label="Illustration of an event ticket"
          >
            <div className="orbit orbit-one" aria-hidden="true" />
            <div className="orbit orbit-two" aria-hidden="true" />
            <article className="ticket-card">
              <div className="ticket-topline">
                <span>DEMO PASS</span>
                <span>PKR 0</span>
              </div>
              <div>
                <p className="ticket-kicker">Demo University · Main Campus</p>
                <h2>Open House</h2>
                <p>Friday · 4:00 PM · Demo Hall</p>
              </div>
              <div className="ticket-footer">
                <div
                  className="qr-placeholder"
                  aria-label="Decorative QR placeholder; not a valid credential"
                >
                  {Array.from({ length: 49 }, (_, index) => (
                    <i
                      key={index}
                      className={index % 3 === 0 || index % 7 === 0 ? "on" : ""}
                    />
                  ))}
                </div>
                <div>
                  <strong>Gate A</strong>
                  <span>Online validation required</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="trust-strip" aria-label="Product boundaries">
          <span>PKR ready</span>
          <span>Asia/Karachi</span>
          <span>No PII in QR</span>
          <span>Payments disabled</span>
        </section>

        <section className="section" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">The reliable path</p>
            <h2>Clarity before confetti.</h2>
            <p>
              CampusPass prioritizes accurate capacity, scoped access, and
              trustworthy admission before optional growth features.
            </p>
          </div>
          <div className="cards">
            {trustPoints.map(([title, text], index) => (
              <article className="feature-card" key={title}>
                <span className="step">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pilot-note" id="pilot-note">
          <div>
            <p className="eyebrow">Honest status</p>
            <h2>Built for a pilot. Not pretending one exists.</h2>
          </div>
          <p>
            This build uses synthetic development data. University
            authorization, society participation, identity verification, payment
            providers, and production operations remain unverified and gated.
          </p>
        </section>
      </main>

      <footer>
        <span>CampusPass · Foundation build</span>
        <span>English · Urdu-ready</span>
      </footer>
    </>
  );
}
