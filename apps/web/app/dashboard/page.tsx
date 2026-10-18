import { SiteHeader } from "../../components/site-header";
import { StudentDashboard } from "./student-dashboard";

export default function DashboardPage() {
  return (
    <>
      <SiteHeader context="Student" />
      <main id="main" className="dashboard-shell">
        <StudentDashboard />
      </main>
    </>
  );
}
