"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

export function RegistrationForm() {
  const invitationToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          invitationToken: form.get("invitationToken"),
          displayName: form.get("displayName"),
          password: form.get("password"),
        }),
      });
      setComplete(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Registration failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (complete) {
    return (
      <section className="auth-form" aria-live="polite">
        <p className="eyebrow">Account created</p>
        <h1>You’re ready to sign in.</h1>
        <p className="muted-copy">
          Your invitation was verified and has now been consumed. Continue with
          the email address the invitation was sent to.
        </p>
        <Link className="button primary" href="/login">
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <form className="auth-form" onSubmit={register}>
      <p className="eyebrow">Student registration</p>
      <h1>Create your CampusPass account</h1>
      <p className="muted-copy">
        Registration requires a single-use invitation issued to your verified
        university email address.
      </p>
      <label>
        Invitation token
        <input
          name="invitationToken"
          defaultValue={invitationToken}
          minLength={32}
          maxLength={256}
          autoComplete="off"
          required
        />
      </label>
      <label>
        Full name
        <input
          name="displayName"
          minLength={2}
          maxLength={120}
          autoComplete="name"
          required
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
        />
      </label>
      <label>
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button primary" disabled={busy} type="submit">
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="auth-footnote">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
