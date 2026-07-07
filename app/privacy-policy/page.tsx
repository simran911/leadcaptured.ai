import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LeadCaptured.ai",
  description: "Privacy Policy for LeadCaptured.ai and Full Sail Productions SMS communications.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <section className="legal-card">
        <a className="legal-back" href="/">
          Back to Home
        </a>
        <a className="legal-logo" href="/">
          LeadCaptured<span>.ai</span>
        </a>
        <h1>Privacy Policy</h1>

        <h2>SMS Consent</h2>
        <p>
          By providing your phone number and opting in, you consent to receive SMS messages from
          Full Sail Productions regarding appointments, customer support, follow-ups, and
          promotional offers. Message frequency varies. Message and data rates may apply. Reply STOP
          to unsubscribe or HELP for assistance. Consent is not a condition of purchase.
        </p>

        <h2>Sharing of SMS Information</h2>
        <p>
          We do not sell or share your SMS consent or mobile number with third parties for marketing
          purposes.
        </p>
        <p>
          SMS opt-in and phone numbers collected for SMS communications are not shared with third
          parties or affiliates for marketing purposes.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We may collect contact details you provide, including your name, email address, phone
          number, company name, and appointment details so we can respond to inquiries and provide
          requested services.
        </p>

        <h2>How We Use Information</h2>
        <p>
          We use submitted information to schedule appointments, provide customer support, follow up
          with leads, communicate about our services, and improve the LeadCaptured.ai experience.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions, contact Full Sail Productions through the contact options provided
          on LeadCaptured.ai.
        </p>
      </section>
    </main>
  );
}
