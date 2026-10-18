import { AccountClient } from "./account-client";
import { SiteHeader } from "../../components/site-header";

export default function AccountPage() {
  return (
    <>
      <SiteHeader context="Settings" />
      <main id="main" className="account-shell">
        <AccountClient />
      </main>
    </>
  );
}
