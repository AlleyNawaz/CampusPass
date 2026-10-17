"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "../../lib/api";

type LoginResult = {
  status: "AUTHENTICATED" | "MFA_REQUIRED" | "MFA_ENROLLMENT_REQUIRED";
};

export function LoginForm() {
  const [step, setStep] = useState<"login" | "verify" | "enroll">("login");
  const [enrollment, setEnrollment] = useState<{
    secret: string;
    otpauthUri: string;
  }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<LoginResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      if (result.status === "AUTHENTICATED") {
        window.location.replace("/account");
        return;
      }
      if (result.status === "MFA_ENROLLMENT_REQUIRED") {
        const details = await apiRequest<{
          secret: string;
          otpauthUri: string;
        }>("/auth/mfa/enroll/start", { method: "POST" });
        setEnrollment(details);
        setStep("enroll");
      } else {
        setStep("verify");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function completeMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest(
        step === "enroll" ? "/auth/mfa/enroll/confirm" : "/auth/mfa/verify",
        {
          method: "POST",
          body: JSON.stringify({ code: form.get("code") }),
        },
      );
      window.location.replace("/account");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Verification failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (step !== "login") {
    return (
      <form className="auth-form" onSubmit={completeMfa}>
        <h1>{step === "enroll" ? "Set up MFA" : "Verify your identity"}</h1>
        {enrollment ? (
          <div className="security-note">
            <p>Add this key to your authenticator, then enter its code.</p>
            <code>{enrollment.secret}</code>
            <a href={enrollment.otpauthUri}>Open authenticator app</a>
          </div>
        ) : null}
        <label>
          Six-digit code
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button primary" disabled={busy} type="submit">
          {busy ? "Verifying…" : "Verify"}
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={login}>
      <p className="eyebrow">Secure account access</p>
      <h1>Sign in to CampusPass</h1>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="current-password"
          required
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button primary" disabled={busy} type="submit">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
