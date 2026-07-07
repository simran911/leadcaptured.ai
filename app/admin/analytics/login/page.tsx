import { redirect } from "next/navigation";
import { isAnalyticsAdminAuthenticated } from "../../../../lib/analytics-auth";
import styles from "../../../../components/analytics/analytics-dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function AnalyticsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAnalyticsAdminAuthenticated()) {
    redirect("/admin/analytics");
  }

  const params = await searchParams;

  return (
    <main className={styles.loginShell}>
      <form className={styles.loginCard} action="/api/analytics/login" method="post">
        <span className={styles.eyebrow}>Admin Analytics</span>
        <h1>Real-Time Website Analytics</h1>
        <p>Enter the analytics admin password to view the live dashboard.</p>
        <label>
          Password
          <input
            autoComplete="current-password"
            autoFocus
            name="password"
            placeholder="Analytics password"
            type="password"
          />
        </label>
        {params.error && <div className={styles.loginError}>Incorrect password.</div>}
        <button type="submit">Sign in</button>
        <small>
          Set <code>ANALYTICS_ADMIN_PASSWORD</code> in production. Local fallback:
          <code> leadcaptured-admin</code>
        </small>
      </form>
    </main>
  );
}
