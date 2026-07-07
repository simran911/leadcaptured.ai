import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LeadCaptured.ai",
  description: "Privacy Policy for LeadCaptured.ai.",
};

export default function PrivacyPolicyPage() {
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
        <h1>Privacy Policy</h1>
        <p>
          LeadCaptured.ai (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or
          &quot;us&quot;) values your privacy and is committed to protecting your personal
          information. This Privacy Policy explains how we collect, use, disclose, and protect your
          information when you visit our website or use our services.
        </p>

        <h2>Information We Collect</h2>
        <p>We may collect the following information:</p>
        <ul>
          <li>Full Name</li>
          <li>Company Name</li>
          <li>Email Address</li>
          <li>Phone Number</li>
          <li>Business Information</li>
          <li>IP Address</li>
          <li>Browser Information</li>
          <li>Device Information</li>
          <li>Cookies and Analytics Data</li>
          <li>Any information you voluntarily provide through forms, chat, SMS, email, or phone.</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide our services</li>
          <li>Respond to inquiries</li>
          <li>Schedule appointments</li>
          <li>Send account updates</li>
          <li>Deliver requested information</li>
          <li>Send marketing communications only with your consent</li>
          <li>Improve our website and services</li>
          <li>Prevent fraud and maintain security</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>SMS Communications</h2>
        <p>
          By providing your mobile phone number and opting in, you consent to receive SMS messages
          from LeadCaptured.ai.
        </p>
        <p>These messages may include:</p>
        <ul>
          <li>Appointment reminders</li>
          <li>Service notifications</li>
          <li>Customer support updates</li>
          <li>Marketing promotions only where consent has been provided</li>
          <li>Account notifications</li>
        </ul>
        <p>Message frequency varies.</p>
        <p>Message and data rates may apply.</p>
        <p>Reply STOP at any time to unsubscribe.</p>
        <p>Reply HELP for assistance.</p>

        <h2>SMS Consent</h2>
        <p>
          SMS consent is collected only after you voluntarily provide your phone number and
          explicitly agree to receive SMS communications.
        </p>
        <p>SMS consent is not shared with third parties or affiliates for marketing purposes.</p>
        <p>
          We do not transfer, sell, rent, or share your mobile phone number or SMS consent with
          third parties or affiliates for their marketing purposes. SMS consent is used solely to
          provide the messaging services you have requested.
        </p>

        <h2>Email Communications</h2>
        <p>By providing your email address, you consent to receive emails related to:</p>
        <ul>
          <li>Account updates</li>
          <li>Service notifications</li>
          <li>Marketing communications</li>
          <li>Product announcements</li>
          <li>Educational content</li>
        </ul>
        <p>You may unsubscribe from marketing emails at any time.</p>

        <h2>Cookies and Tracking Technologies</h2>
        <p>We use cookies and similar technologies to:</p>
        <ul>
          <li>Improve website functionality</li>
          <li>Analyze website traffic</li>
          <li>Understand visitor behavior</li>
          <li>Personalize user experience</li>
        </ul>
        <p>
          You may disable cookies through your browser settings; however, some features may not
          function properly.
        </p>

        <h2>Data Sharing</h2>
        <p>
          We may share your information only with trusted service providers necessary to operate our
          business, including:
        </p>
        <ul>
          <li>CRM providers</li>
          <li>Cloud hosting providers</li>
          <li>Email delivery providers</li>
          <li>SMS delivery providers</li>
          <li>Payment processors</li>
          <li>Analytics providers</li>
        </ul>
        <p>These providers are contractually obligated to protect your information.</p>
        <p>We do not sell your personal information.</p>

        <h2>Data Security</h2>
        <p>
          We implement reasonable administrative, technical, and physical safeguards to protect your
          information against unauthorized access, disclosure, alteration, or destruction.
        </p>
        <p>
          While we strive to protect your information, no method of internet transmission is
          completely secure.
        </p>

        <h2>Data Retention</h2>
        <p>We retain personal information only for as long as necessary to:</p>
        <ul>
          <li>Provide our services</li>
          <li>Meet legal obligations</li>
          <li>Resolve disputes</li>
          <li>Enforce our agreements</li>
        </ul>

        <h2>Your Rights</h2>
        <p>You may request to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Delete your information, subject to legal obligations</li>
          <li>Withdraw marketing consent</li>
          <li>Opt out of SMS communications</li>
          <li>Opt out of marketing emails</li>
        </ul>
        <p>To exercise your rights, please contact us.</p>

        <h2>Children&apos;s Privacy</h2>
        <p>Our services are intended for individuals aged 18 years or older.</p>
        <p>We do not knowingly collect information from children under 18.</p>

        <h2>Third-Party Services</h2>
        <p>
          Our website may contain links to third-party websites. We are not responsible for the
          privacy practices of those websites.
        </p>

        <h2>Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy periodically. Any changes will be posted on this page
          with a revised effective date.
        </p>

        <h2>Contact Us</h2>
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
