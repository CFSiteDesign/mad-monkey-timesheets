import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import madMonkeyLogo from "@/assets/mad-monkey-logo.webp";
import theoroxLogo from "@/assets/theorox-logo.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Mad Monkey Timesheets — Designer Time Logger" },
      {
        name: "description",
        content:
          "Internal timesheet portal for the Mad Monkey design team. Log job references, file links, tools used and time spent in seconds.",
      },
      { property: "og:title", content: "Mad Monkey Timesheets" },
      {
        property: "og:description",
        content:
          "Fast, minimalist time logging for Mad Monkey designers.",
      },
    ],
  }),
});

// ============================================================
// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const APPS_SCRIPT_URL = "https://script.google.com/a/macros/madmonkeyhostels.com/s/AKfycbwr9nBt_iO2KVpdf4uBGQ6SgPCcdEtVOfZ2xkyPOSF6aqCbf6YkLVrr9f0s2Im4hNdT/exec";
// ============================================================

const TIME_OPTIONS = ["30 mins", "1 hr", "1 hr 30 mins", "2 hrs", "2 hrs 30 mins"];

type Status = "idle" | "submitting" | "success" | "error";



function Index() {
  const [jobReference, setJobReference] = useState("");
  const [fileLink, setFileLink] = useState("");
  const [toolUsed, setToolUsed] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const normalizeUrl = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!jobReference.trim()) e.jobReference = true;
    const normalized = normalizeUrl(fileLink);
    if (!normalized) e.fileLink = true;
    else {
      try {
        const u = new URL(normalized);
        if (!u.hostname.includes(".")) e.fileLink = true;
      } catch {
        e.fileLink = true;
      }
    }
    if (!toolUsed.trim()) e.toolUsed = true;
    if (!timeSpent) e.timeSpent = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setErrorMessage("");
    const payload = {
      job_reference: jobReference,
      file_link: normalizeUrl(fileLink),
      tool_used: toolUsed,
      time_spent: timeSpent,
    };
    console.log("[timesheet] inserting", payload);
    try {
      const { error } = await supabase.from("timesheets").insert(payload);
      if (error) throw error;
      console.log("[timesheet] inserted ok");
      setJobReference("");
      setFileLink("");
      setToolUsed("");
      setTimeSpent("");
      setErrors({});
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[timesheet] insert failed", err);
      setErrorMessage(message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
    }
  };

  const inputBase =
    "w-full bg-black border text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors rounded-md";

  const borderClass = (key: string) =>
    errors[key] ? "border-red-500/70" : "border-white/20";

  return (
    <main className="min-h-screen bg-black text-white flex flex-col relative">
      {status === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none animate-fade-in">
          <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center">
              <svg
                viewBox="0 0 52 52"
                className="w-12 h-12"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M14 27 L23 36 L40 18"
                  style={{
                    strokeDasharray: 60,
                    strokeDashoffset: 60,
                    animation: "checkDraw 0.5s ease-out 0.15s forwards",
                  }}
                />
              </svg>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white">
              Logged
            </span>
          </div>
          <style>{`@keyframes checkDraw { to { stroke-dashoffset: 0; } }`}</style>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-6 pt-12 pb-8">
        {/* Header */}
        <header className="w-full max-w-[480px] flex flex-col items-center">
          <img
            src={madMonkeyLogo}
            alt="Mad Monkey"
            className="max-h-[72px] w-auto"
          />
          <h1 className="mt-6 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-white text-center">
            Mad Monkey Timesheets
          </h1>
          <div className="mt-8 w-full h-px bg-white/100" />
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-[480px] mt-12 flex flex-col gap-5"
        >
          <Field label="Job Reference">
            <input
              type="text"
              value={jobReference}
              onChange={(e) => setJobReference(e.target.value)}
              className={`${inputBase} ${borderClass("jobReference")}`}
              autoComplete="off"
            />
          </Field>

          <Field label="File Link">
            <input
              type="url"
              inputMode="url"
              value={fileLink}
              onChange={(e) => setFileLink(e.target.value)}
              placeholder="https://"
              className={`${inputBase} ${borderClass("fileLink")}`}
              autoComplete="off"
            />
          </Field>

          <Field label="Tool Used">
            <textarea
              rows={3}
              value={toolUsed}
              onChange={(e) => setToolUsed(e.target.value)}
              placeholder="e.g. Higgsfield, Adobe, Canva. Brief explanation of how the work was created."
              className={`${inputBase} ${borderClass("toolUsed")} resize-none`}
            />
          </Field>

          <Field label="Time Spent">
            <select
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              className={`${inputBase} ${borderClass("timeSpent")} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22><path d=%22M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%22/></svg>')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem] pr-10`}
            >
              <option value="" disabled className="bg-black">
                Select duration
              </option>
              {TIME_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-black">
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-2 w-full bg-white text-black uppercase tracking-[0.2em] text-xs font-semibold py-4 rounded-md transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {status === "submitting" ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Logging
              </>
            ) : (
              "Log Entry"
            )}
          </button>

          <div className="min-h-[1.25rem] text-center text-xs transition-opacity duration-500"
               style={{ opacity: status === "success" || status === "error" ? 1 : 0 }}>
            {status === "success" && <span className="text-white">Logged</span>}
            {status === "error" && (
              <span className="text-red-400 break-words">
                {errorMessage || "Submission failed. Try again."}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="w-full flex flex-col items-center pb-4 pt-0 -mt-4">
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/60 mb-[-6px]">
          Powered by
        </span>
        <a
          href="https://theorox.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-100"
        >
          <img
            src={theoroxLogo}
            alt="TheoroX"
            className="max-h-12 w-auto opacity-90"
          />
        </a>
      </footer>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-white/70">
        {label}
      </span>
      {children}
    </label>
  );
}
