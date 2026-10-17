import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main id="main" className="auth-shell">
      <Link className="brand" href="/">
        <span className="brand-mark">CP</span>
        <span>CampusPass</span>
      </Link>
      <LoginForm />
    </main>
  );
}
