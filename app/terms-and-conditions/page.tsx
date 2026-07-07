import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | LeadCaptured.ai",
  description: "Terms and Conditions for LeadCaptured.ai and Full Sail Productions SMS messaging.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="legal-page">
      <section className="legal-card">
        <a className="legal-back" href="/">
          Back to Home
        </a>
        <a className="legal-logo" href="/">
          LeadCaptured<span>.ai</span>
        </a>
        <h1>Terms &amp; Conditions</h1>

        <h2>Use of Services</h2>
        <p>
          By using LeadCaptured.ai or submitting information through our website, you agree that Full
          Sail Productions may contact you regarding appointments, customer support, follow-ups, and
          service-related communications.
        </p>

        <h2>SMS Messaging Terms</h2>
        <p>
          If you opt in to SMS messaging, Full Sail Productions may send messages related to
          appointments, customer support, follow-ups, and promotional offers.
        </p>
        <ul>
          <li>Types of SMS: appointments, support, follow-ups, and promotional offers.</li>
          <li>Message frequency varies.</li>
          <li>Message and data rates may apply.</li>
          <li>Reply STOP to unsubscribe at any time.</li>
          <li>Reply HELP for assistance.</li>
          <li>Consent to receive SMS messages is not a condition of purchase.</li>
        </ul>

        <h2>No Sale of SMS Consent</h2>
        <p>
          We do not sell or share your SMS consent or mobile number with third parties for marketing
          purposes.
        </p>

        <h2>Changes to These Terms</h2>
        <p>
          We may update these Terms &amp; Conditions from time to time. Updates will be posted on
          this page.
        </p>
      </section>
    </main>
  );
}
