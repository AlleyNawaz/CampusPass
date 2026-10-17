"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Session = {
  userId: string;
  tenantId: string | null;
  roles: string[];
  mfaVerified: boolean;
};

export function AccountClient() {
  const [session, setSession] = useState<Session>();

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

  if (!session) return <p role="status">Checking your secure session…</p>;
  return (
    <section className="auth-form">
      <p className="eyebrow">Authenticated account</p>
      <h1>Welcome back</h1>
      <p>Roles: {session.roles.join(", ")}</p>
      <p>MFA: {session.mfaVerified ? "verified" : "not required"}</p>
      <button className="button secondary" onClick={logout} type="button">
        Sign out securely
      </button>
    </section>
  );
}
