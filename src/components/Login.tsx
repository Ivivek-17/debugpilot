"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";

interface LoginProps {
  onLogin: (user: { name: string; email: string }) => void;
}

/**
 * Login Component — Kinetic Glacialist style
 *
 * How it works:
 * 1. User enters a display name and email. No real backend auth is used.
 * 2. On submit, credentials are saved to localStorage under "debugpilot_user".
 * 3. The parent page.tsx reads this on mount; if present, it skips login.
 * 4. To "log out", the user clicks the logout button in the navbar,
 *    which clears the localStorage key and shows this screen again.
 *
 * This is purely client-side. No server, no database, no API keys needed.
 */
export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);


  const isValid = name.trim().length >= 2 && email.includes("@");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);

    // Simulate a small delay for the "authenticating" feel
    await new Promise(r => setTimeout(r, 800));

    const user = { name: name.trim(), email: email.trim() };
    localStorage.setItem("debugpilot_user", JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--color-bg-base)" }}>

      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="p-8 md:p-10"
          style={{
            background: "rgba(26, 30, 55, 0.80)",
            backdropFilter: "blur(24px)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
          }}>

          {/* Logo Area */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 mb-5"
              style={{
                background: "linear-gradient(135deg, rgba(0,240,255,0.10), rgba(124,58,237,0.08))",
                border: "1px solid rgba(0,240,255,0.20)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 0 30px rgba(0,240,255,0.12)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </motion.div>

            <h1 className="text-2xl font-bold gradient-text tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}>
              DebugPilot
            </h1>
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Enterprise multi-agent SRE copilot
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
                Display name
              </label>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Engineer name"
                className="login-input"
                autoComplete="name"
                autoFocus
              />
            </div>

            {/* Email field */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="login-input"
                autoComplete="email"
              />
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={!isValid || loading}
              whileHover={isValid && !loading ? { scale: 1.01 } : {}}
              whileTap={isValid && !loading ? { scale: 0.98 } : {}}
              className="btn-shimmer w-full font-semibold py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              style={{
                color: "var(--color-primary-on)",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.04em",
                fontSize: "0.85rem",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Launch console
                </>
              )}
            </motion.button>
          </form>

          {/* Footer hint */}
          <p className="text-center text-[10px] mt-6" style={{ color: "var(--color-text-muted)" }}>
            No account required — credentials stored locally in your browser
          </p>
        </div>

        {/* Bottom system info */}
        <div className="flex items-center justify-center gap-1 mt-5 text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
          <span style={{ color: "var(--color-success)" }}>$</span>
          <span>debugpilot auth --local</span>
          <span className="animate-blink ml-1" style={{ color: "var(--color-primary)" }}>▋</span>
        </div>
      </motion.div>
    </div>
  );
}
