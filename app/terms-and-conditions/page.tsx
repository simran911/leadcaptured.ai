import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | LeadCaptured.ai",
  description: "Terms and Conditions for LeadCaptured.ai.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="legal-page">
      <section className="legal-card">
        <a className="legal-back" href="/">
          <span aria-hidden="true">&larr;</span>
          <span className="sr-only">Back to home</span>
        </a>
        <a className="legal-logo" href="/">
          LeadCaptured<span>.ai</span>
        </a>
        <h1>Terms &amp; Conditions</h1>
        <p>Welcome to LeadCaptured.ai.</p>
        <p>
          By accessing or using our website and services, you agree to these Terms and Conditions.
        </p>

        <h2>Services</h2>
        <p>
          LeadCaptured.ai provides AI-powered lead generation, customer engagement, appointment
          scheduling, automation, CRM integration, AI chat, SMS communication, email communication,
          and related business services.
        </p>

        <h2>Eligibility</h2>
        <p>You must be at least 18 years old to use our services.</p>

        <h2>User Responsibilities</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate information</li>
          <li>Maintain the confidentiality of your account</li>
          <li>Use our services legally</li>
          <li>Not misuse or attempt to disrupt our services</li>
        </ul>

        <h2>SMS Program</h2>
        <p>
          By providing your mobile number and opting in, you agree to receive SMS messages from
          LeadCaptured.ai.
        </p>
        <p>
          By checking the SMS consent box on our forms, you expressly consent to receive SMS
          messages from LeadCaptured.ai. Your consent is not a condition of purchasing any goods or
          services. You may opt out at any time by replying STOP.
        </p>
        <p>Messages may include:</p>
        <ul>
          <li>Appointment reminders</li>
          <li>Customer support updates</li>
          <li>Account notifications</li>
          <li>Marketing promotions</li>
          <li>Service updates</li>
        </ul>
        <p>Message frequency varies.</p>
        <p>Message and data rates may apply.</p>

        <h2>Opt-Out</h2>
        <p>You may opt out at any time by replying:</p>
        <p>STOP</p>
        <p>After opting out, you will no longer receive SMS marketing messages.</p>

        <h2>Help</h2>
        <p>You may request assistance by replying:</p>
        <p>HELP</p>
        <p>or contact us at:</p>
        <p>
          Email: <a href="mailto:support@leadcaptured.ai">support@leadcaptured.ai</a>
        </p>
        <p>
          Phone: <a href="tel:+14156866966">(415) 686-6966</a>
        </p>

        <h2>Carrier Disclaimer</h2>
        <p>Wireless carriers are not liable for delayed or undelivered messages.</p>

        <h2>Email Communications</h2>
        <p>
          By providing your email address, you agree to receive service-related communications and,
          where consent has been provided, marketing emails.
        </p>
        <p>You may unsubscribe from marketing emails at any time.</p>

        <h2>Intellectual Property</h2>
        <p>
          All content, branding, logos, software, text, graphics, and materials on this website are
          owned by LeadCaptured.ai and are protected under applicable intellectual property laws.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, LeadCaptured.ai shall not be liable for any
          indirect, incidental, consequential, special, or punitive damages arising from the use of
          our services.
        </p>

        <h2>Indemnification</h2>
        <p>
          You agree to indemnify and hold LeadCaptured.ai harmless from claims arising from your use
          of the website or violation of these Terms.
        </p>

        <h2>Privacy</h2>
        <p>Your use of our services is also governed by our Privacy Policy.</p>
        <p>
          View our Privacy Policy here: <a href="/privacy-policy">https://leadcaptured.ai/privacy-policy</a>
        </p>

        <h2>Modifications</h2>
        <p>
          We reserve the right to modify these Terms at any time. Continued use of the website
          constitutes acceptance of any revised Terms.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms shall be governed by the applicable laws of the jurisdiction in which
          LeadCaptured.ai operates.
        </p>

        <h2>Contact Information</h2>
        <p>LeadCaptured.ai</p>
        <p>
          Email: <a href="mailto:support@leadcaptured.ai">support@leadcaptured.ai</a>
        </p>
        <p>
          Phone: <a href="tel:+14156866966">(415) 686-6966</a>
        </p>
        <p>
          Website: <a href="https://leadcaptured.ai">https://leadcaptured.ai</a>
        </p>
      </section>
    </main>
  );
}
