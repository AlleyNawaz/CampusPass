import Link from "next/link";

export function SiteHeader({ context }: { context?: string }) {
  return (
    <header className="app-header">
      <Link className="app-brand" href="/" aria-label="CampusPass home">
        <span className="app-brand-mark" aria-hidden="true">
          <span />
          <span />
        </span>
        <span>CampusPass</span>
        {context ? <em>{context}</em> : null}
      </Link>
      <nav className="app-nav" aria-label="Primary navigation">
        <Link href="/events">Discover</Link>
        <a href="/#how-it-works">How it works</a>
        <Link className="nav-sign-in" href="/login">
          Sign in
        </Link>
        <Link className="nav-cta" href="/dashboard">
          My passes
          <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  );
}
