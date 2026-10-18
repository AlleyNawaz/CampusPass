"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Session = {
  userId: string;
  tenantId: string | null;
  roles: string[];
  mfaVerified: boolean;
  account: {
    email: string;
    displayName: string;
    locale: string;
    timezone: string;
    emailVerified: boolean;
    university: { name: string; slug: string } | null;
  };
};

export function AccountClient() {
  const [session, setSession] = useState<Session>();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<Session>("/auth/session")
      .then(setSession)
      .catch(() => window.location.replace("/login"));
  }, []);

  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const profile = await apiRequest<{
        displayName: string;
        locale: string;
        timezone: string;
      }>("/students/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: form.get("displayName"),
          locale: form.get("locale"),
          timezone: form.get("timezone"),
        }),
      });
      setSession((current) =>
        current
          ? { ...current, account: { ...current.account, ...profile } }
          : current,
      );
      setNotice("Account settings saved.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Settings could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setError("New passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
        }),
      });
      event.currentTarget.reset();
      setNotice("Password changed. Other signed-in sessions were revoked.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Password could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <p role="status">Checking your secure session…</p>;
  return (
    <div className="settings-layout">
      <section>
        <p className="eyebrow">Account settings</p>
        <h1>Your CampusPass profile</h1>
        <p className="muted-copy">Signed in as {session.account.email}</p>
        <dl className="security-summary">
          <div>
            <dt>University</dt>
            <dd>{session.account.university?.name ?? "Platform account"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              {session.account.emailVerified
                ? "Verified"
                : "Pending verification"}
            </dd>
          </div>
          <div>
            <dt>MFA</dt>
            <dd>
              {session.mfaVerified
                ? "Verified this session"
                : "Not required for this role"}
            </dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{session.roles.join(", ")}</dd>
          </div>
        </dl>
      </section>
      <form className="auth-form" onSubmit={updateProfile}>
        <h2>Personal details</h2>
        <label>
          Display name
          <input
            name="displayName"
            defaultValue={session.account.displayName}
            minLength={2}
            maxLength={120}
            autoComplete="name"
            required
          />
        </label>
        <label>
          Language
          <input
            name="locale"
            defaultValue={session.account.locale}
            pattern="[a-z]{2}(-[A-Z]{2})?"
            maxLength={20}
            required
          />
        </label>
        <label>
          Time zone
          <input
            name="timezone"
            defaultValue={session.account.timezone}
            maxLength={100}
            required
          />
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="form-success" role="status">
            {notice}
          </p>
        ) : null}
        <button className="button primary" disabled={busy} type="submit">
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>
      <form className="auth-form" onSubmit={changePassword}>
        <h2>Change password</h2>
        <p className="muted-copy">
          Changing your password revokes every other active session.
        </p>
        <label>
          Current password
          <input
            name="currentPassword"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          New password
          <input
            name="newPassword"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm new password
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
        {notice ? (
          <p className="form-success" role="status">
            {notice}
          </p>
        ) : null}
        <button className="button primary" disabled={busy} type="submit">
          {busy ? "Updating…" : "Update password"}
        </button>
        <button className="button secondary" onClick={logout} type="button">
          Sign out securely
        </button>
      </form>
    </div>
  );
}
