import Link from "next/link";
import { RegistrationForm } from "./registration-form";

export default function RegisterPage() {
  return (
    <main id="main" className="auth-shell">
      <Link className="brand" href="/">
        <span className="brand-mark">CP</span>
        <span>CampusPass</span>
      </Link>
      <RegistrationForm />
    </main>
  );
}
