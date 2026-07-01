"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const faqs = [
  {
    question: "How quickly can I get started?",
    answer:
      "Our AI receptionist can be fully configured and live within 24 hours of signing up. We provide a simple onboarding process where you input your business details, services, and calendar availability, and our system takes care of the rest.",
  },
  {
    question: "Do I need to provide my own phone number?",
    answer:
      "Our AI receptionist can be fully configured and live within 24 hours of signing up. We provide a simple onboarding process where you input your business details, services, and calendar availability, and our system takes care of the rest.",
  },
  {
    question: "What if I need to cancel?",
    answer:
      "Our AI receptionist can be fully configured and live within 24 hours of signing up. We provide a simple onboarding process where you input your business details, services, and calendar availability, and our system takes care of the rest.",
  },
  {
    question: "How does the AI learn about my business?",
    answer:
      "Our AI receptionist can be fully configured and live within 24 hours of signing up. We provide a simple onboarding process where you input your business details, services, and calendar availability, and our system takes care of the rest.",
  },
  {
    question: "Can I customize the AI's responses?",
    answer:
      "Our AI receptionist can be fully configured and live within 24 hours of signing up. We provide a simple onboarding process where you input your business details, services, and calendar availability, and our system takes care of the rest.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "Our AI receptionist can be fully configured and live within 24 hours of signing up. We provide a simple onboarding process where you input your business details, services, and calendar availability, and our system takes care of the rest.",
  },
];

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  employees: string;
};

type VoiceLeadDetail = Partial<Pick<LeadForm, "name" | "email" | "phone">>;

type VoiceLeadResponse = {
  ok: boolean;
  lead: (VoiceLeadDetail & {
    appointmentAccepted?: boolean;
  }) | null;
};

declare global {
  interface Window {
    prefillLeadCaptureForm?: (details: VoiceLeadDetail) => void;
  }
}

function Icon({ name }: { name: string }) {
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L9 10.7a16 16 0 0 0 4.3 4.3l1.27-1.27a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function Logo({ centered = false }: { centered?: boolean }) {
  return (
    <a className={centered ? "logo logo-center" : "logo"} href="#top">
      <Icon name="shield" />
      <span>
        LeadCaptured<span>.ai</span>
      </span>
    </a>
  );
}

function Calculator() {
  const [missedCalls, setMissedCalls] = useState(15);
  const [jobValue, setJobValue] = useState(9000);
  const [closeRate, setCloseRate] = useState(30);
  const [helpOpen, setHelpOpen] = useState(false);
  const productCost = 4764;

  const totals = useMemo(() => {
    const weeklyLoss = missedCalls * jobValue * (closeRate / 100);
    const monthlyLoss = weeklyLoss * 4;
    const annualLoss = monthlyLoss * 12;
    const annualRoi = Math.round((annualLoss / productCost) * 100);

    return {
      weeklyLoss,
      monthlyLoss,
      annualLoss,
      annualRoi,
    };
  }, [closeRate, jobValue, missedCalls]);

  return (
    <section className="section calculator-section pattern" id="calculator">
      <div className="section-heading">
        <h1>
          ROOFERS: Calculate how much you<br />
          are losing
          <br />
          <span>by using voicemail</span>
        </h1>
      </div>

      <div className="calculator-card">
        <button
          className="help-button"
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="Open calculator instructions"
        >
          <span className="help-play-icon" aria-hidden="true" />
        </button>
        <div className="calculator-card-heading">
          <h2>
            Your <span>Real Loss Calculator</span>
          </h2>
          <p>See exactly how much revenue you're losing to missed calls every month.</p>
        </div>
        <Slider
          label="Calls/Week to VM (after hours and weekends)"
          value={missedCalls}
          min={0}
          max={100}
          step={1}
          display={String(missedCalls)}
          onChange={setMissedCalls}
        />
        <Slider
          label="Average Job Value"
          value={jobValue}
          min={1000}
          max={25000}
          step={500}
          display={currency(jobValue)}
          onChange={setJobValue}
        />
        <Slider
          label="Close Rate"
          value={closeRate}
          min={5}
          max={80}
          step={1}
          display={String(closeRate) + "%"}
          onChange={setCloseRate}
        />

        <div className="calc-divider" />

        <div className="loss-grid">
          <div>
            <span>Monthly Loss</span>
            <strong className="loss">{currency(totals.monthlyLoss)}</strong>
          </div>
          <div>
            <span>Annual Loss</span>
            <strong className="loss">{currency(totals.annualLoss)}</strong>
          </div>
        </div>
      </div>

      {helpOpen && (
        <div className="help-modal" role="dialog" aria-modal="true" aria-label="Calculator instructions">
          <div className="help-modal-panel">
            <button
              className="help-modal-close"
              type="button"
              onClick={() => setHelpOpen(false)}
              aria-label="Close calculator instructions"
            >
              X
            </button>
            <h3>INSTRUCTIONS</h3>
            <p>
              Step 1 - Adjust top slider to show the number of calls that go to voicemail in a
              WEEK. Total your after-hours and weekend calls, then add in those you miss during
              working hours.
            </p>
            <p>Step 2 - Enter your average job size by adjusting the middle slider.</p>
            <p>Step 3 - In the bottom slider, put the average percentage of bids you win.</p>
            <p>Step 4 - See the results and rejoice.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <label className="slider-row">
      <span className="slider-top">
        <span>{label}</span>
        <strong>{display}</strong>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--range-progress": String(percent) + "%" } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function currency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatCallDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return minutes + ":" + String(remainingSeconds).padStart(2, "0");
}

function getVoiceWidget() {
  return document.querySelector("chat-widget") as
    | (HTMLElement & { shadowRoot?: ShadowRoot | null })
    | null;
}

function clickWidgetControl(patterns: RegExp[]) {
  const root = getVoiceWidget()?.shadowRoot;

  if (!root) {
    return false;
  }

  const controls = Array.from(
    root.querySelectorAll<HTMLElement>("button, [role='button'], a, .lc_text-widget--phone-icon"),
  );

  const control = controls.find((element) => {
    const label = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.textContent,
      element.className?.toString(),
    ]
      .filter(Boolean)
      .join(" ");

    return patterns.some((pattern) => pattern.test(label));
  });

  control?.click();

  return Boolean(control);
}

function widgetLooksIdle() {
  const root = getVoiceWidget()?.shadowRoot;

  if (!root) {
    return false;
  }

  const text = root.textContent ?? "";
  const hasEndStateText = /call ended|call complete|call disconnected|start call|talk|call now/i.test(text);
  const hasCallingText = /calling|connected|listening|mute|end call|hang up/i.test(text);

  return hasEndStateText && !hasCallingText;
}

function VoiceAgentDemo({
  callEndedSignal,
  onVoiceStarted,
}: {
  callEndedSignal: number | null;
  onVoiceStarted: () => void;
}) {
  const [callState, setCallState] = useState<"idle" | "calling" | "ended">("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  const endVoiceAgent = () => {
    clickWidgetControl([/end/i, /hang\s*up/i, /disconnect/i, /close/i, /phone/i]);
    startedAtRef.current = null;
    setCallState("ended");
  };

  const openVoiceAgent = () => {
    if (callState === "calling") {
      return;
    }

    startedAtRef.current = Date.now();
    setElapsedSeconds(0);
    setCallState("calling");
    onVoiceStarted();

    const opened = clickWidgetControl([/phone/i, /call/i, /voice/i]);

    if (!opened) {
      getVoiceWidget()?.shadowRoot?.querySelector<HTMLElement>(".lc_text-widget--phone-icon")?.click();
    }
  };

  useEffect(() => {
    if (callState !== "calling") {
      return;
    }

    const timer = window.setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }

      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    const widgetWatcher = window.setInterval(() => {
      if (widgetLooksIdle()) {
        startedAtRef.current = null;
        setCallState("ended");
      }
    }, 1500);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(widgetWatcher);
    };
  }, [callState]);

  useEffect(() => {
    if (!callEndedSignal || callState !== "calling") {
      return;
    }

    startedAtRef.current = null;
    setCallState("ended");
  }, [callEndedSignal, callState]);

  const callActive = callState === "calling";

  return (
    <section className="voice-agent-section" aria-labelledby="voice-agent-title">
      <div className="voice-agent-copy">
        <h2 id="voice-agent-title">Meet Jessica,<br />Your Very Smart New<br />Receptionist</h2>
      </div>

      <div className="voice-agent-card">
        <p className="voice-agent-cta">
          Call{" "}
          <a className="voice-phone-link" href="tel:+18885903060">
            (888) 590-3060
          </a>{" "}
          or click this button.
        </p>
        <button
        className={"voice-agent-button " + (callActive ? "calling" : "")}
        type="button"
        onClick={callActive ? endVoiceAgent : openVoiceAgent}
        aria-label={callActive ? "End AI voice call" : "Talk with Jessica"}
        aria-pressed={callActive}
      >
        <img
          src="https://widgets.leadconnectorhq.com/chat-widget/assets/defaultVoiceAiFemale.png"
          alt=""
        />
        {callActive ? (
          <span className="voice-call-status">
            <span className="voice-status-top">
              <span className="voice-live-dot" aria-hidden="true" />
              <strong>Call connected</strong>
            </span>
            <span className="voice-call-duration">{formatCallDuration(elapsedSeconds)}</span>
            <span className="voice-wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </span>
        ) : callState === "ended" ? (
          <span className="voice-call-status">
            <span className="voice-status-top">
              <strong>Call ended</strong>
            </span>
            <span className="voice-call-duration">{formatCallDuration(elapsedSeconds)}</span>
          </span>
        ) : (
          <strong>TALK HERE</strong>
        )}
        <span className="voice-phone-icon" aria-hidden="true">
          <Icon name="phone" />
        </span>
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [voiceStartedAt, setVoiceStartedAt] = useState<number | null>(null);
  const [voiceEndedSignal, setVoiceEndedSignal] = useState<number | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>({
    name: "",
    email: "",
    phone: "",
    company: "",
    employees: "",
  });
  const [appointmentAccepted, setAppointmentAccepted] = useState(false);

  const prefillLeadForm = (details: VoiceLeadDetail) => {
    setLeadForm((current) => ({
      ...current,
      name: details.name ?? current.name,
      email: details.email ?? current.email,
      phone: details.phone ?? current.phone,
    }));
  };

  useEffect(() => {
    const storedSessionId = window.localStorage.getItem("leadcaptured-session-id");
    const nextSessionId = storedSessionId || crypto.randomUUID();

    window.localStorage.setItem("leadcaptured-session-id", nextSessionId);
    setSessionId(nextSessionId);
  }, []);

  useEffect(() => {
    window.prefillLeadCaptureForm = prefillLeadForm;

    const handleVoiceLead = (event: Event) => {
      const detail = (event as CustomEvent<VoiceLeadDetail>).detail;

      if (detail) {
        prefillLeadForm(detail);
      }
    };

    const handleVoiceLeadMessage = (event: MessageEvent) => {
      if (event.data?.type === "leadcaptured:voice-lead") {
        prefillLeadForm(event.data.detail ?? {});
      }
    };

    window.addEventListener("leadcaptured:voice-lead", handleVoiceLead);
    window.addEventListener("message", handleVoiceLeadMessage);

    return () => {
      window.removeEventListener("leadcaptured:voice-lead", handleVoiceLead);
      window.removeEventListener("message", handleVoiceLeadMessage);
      delete window.prefillLeadCaptureForm;
    };
  }, []);

  useEffect(() => {
    if (!voiceStartedAt) {
      return;
    }

    let attempts = 0;
    let stopped = false;

    const checkForVoiceLead = async () => {
      attempts += 1;

      try {
        const params = new URLSearchParams({
          since: String(voiceStartedAt),
        });

        if (sessionId) {
          params.set("sessionId", sessionId);
        }

        const response = await fetch("/api/voice-lead?" + params.toString(), {
          cache: "no-store",
        });
        const data = (await response.json()) as VoiceLeadResponse;

        if (data.lead) {
          prefillLeadForm(data.lead);
          setVoiceEndedSignal(Date.now());

          if (data.lead.appointmentAccepted) {
            setAppointmentAccepted(true);
          }

          stopped = true;
          return;
        }
      } catch {
        // Keep polling briefly; the webhook may arrive a few seconds after call completion.
      }

      if (!stopped && attempts < 40) {
        window.setTimeout(checkForVoiceLead, 3000);
      }
    };

    checkForVoiceLead();

    return () => {
      stopped = true;
    };
  }, [sessionId, voiceStartedAt]);

  const updateLeadField =
    (field: keyof LeadForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setLeadForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const submitAppointmentRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main id="top">
      <Calculator />

      <section className="stats-band">
        <p>
          <span>35%</span> of calls are missed and go to voicemail.
        </p>
        <div />
        <p>
          <span>80%</span> of your callers won't leave a voicemail.
        </p>
      </section>

      <section className="lost-leads-section pattern">
        <h2>
          How To Turn These
          <br />
          Lost Leads Into At Least
          <br />
          <span>$15,000 Every Month</span>
        </h2>
      </section>

      <VoiceAgentDemo
        callEndedSignal={voiceEndedSignal}
        onVoiceStarted={() => {
          setVoiceEndedSignal(null);
          setVoiceStartedAt(Date.now());
        }}
      />

      <section className="trial-promise pattern">
        <h2>Yes I Want To Test Jessica for 30 days for FREE</h2>
        <p>(no credit card required)</p>
      </section>

      {appointmentAccepted && (
        <div className="appointment-toast" role="status" aria-live="polite">
          Your appointment request has been accepted.
        </div>
      )}

      <section className="section faq-section" id="faq">
        <div className="section-heading">
          <h2>
            Frequently Asked <span>Questions</span>
          </h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <article className={"faq-item " + (openFaq === index ? "open" : "")} key={faq.question}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>{faq.question}</span>
                <span>v</span>
              </button>
              {openFaq === index && <p>{faq.answer}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="section trial-section" id="trial">
        <div className="calendar-heading">
          <h2>Schedule your Q&A / Setup Zoom Call</h2>
          <p>Complete the form below. No credit card required</p>
        </div>

        <div className="calendar-section">
          <iframe
            src="https://link.salesengines.ai/widget/booking/94Gk5MBzLErk6wjKWXIz"
            title="LeadCaptured.ai demo booking calendar"
            scrolling="yes"
            id="94Gk5MBzLErk6wjKWXIz_1782124450076"
          />
        </div>
      </section>

      <footer className="footer">
        <Logo centered />
        <p>© 2026 LeadCaptured.ai. All rights reserved.</p>
      </footer>
    </main>
  );
}
