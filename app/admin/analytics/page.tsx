import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "../../../components/analytics/analytics-dashboard";
import { isAnalyticsAdminAuthenticated } from "../../../lib/analytics-auth";
import { getAnalyticsSnapshot } from "../../../lib/analytics-store";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  if (!(await isAnalyticsAdminAuthenticated())) {
    redirect("/admin/analytics/login");
  }

  return <AnalyticsDashboard initialSnapshot={getAnalyticsSnapshot()} />;
}
