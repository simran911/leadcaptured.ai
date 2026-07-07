import type { Metadata } from "next";
import Script from "next/script";
import { AnalyticsTracker } from "../components/analytics/analytics-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadCaptured.ai",
  description: "AI-powered 24/7 call coverage for roofing businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsTracker />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HZ4Z2ZMJ6Y"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HZ4Z2ZMJ6Y');
          `}
        </Script>
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          strategy="afterInteractive"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a36c194acd135ae7967ccb0"
        />
        <Script
          src="https://link.salesengines.ai/js/form_embed.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
