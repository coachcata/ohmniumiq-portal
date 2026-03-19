import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Client ───
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wrftwkfqkarkmqebhclf.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnR3a2Zxa2Fya21xZWJoY2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTk4NjUsImV4cCI6MjA4ODgzNTg2NX0.DLPsspYCui7gdAN4CCYP3prDpAYcStlAKaziGzToKPY";
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Brand Tokens ───
const C = {
  bg: "#0c0f1a", surface: "#141829", surfaceAlt: "#1a1f36", card: "#1e2340",
  border: "#2a305a", borderLight: "#353b6e", text: "#e8eaf6", textMuted: "#8b90b8",
  textDim: "#5c6190", accent: "#3b82f6", accentGlow: "rgba(59,130,246,.15)",
  green: "#10b981", greenBg: "rgba(16,185,129,.12)", greenBorder: "rgba(16,185,129,.3)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,.12)", amberBorder: "rgba(245,158,11,.3)",
  red: "#ef4444", redBg: "rgba(239,68,68,.12)", redBorder: "rgba(239,68,68,.3)",
  purple: "#8b5cf6", purpleBg: "rgba(139,92,246,.12)", white: "#ffffff",
};
const font = `'Sora', sans-serif`;
const fontMono = `'JetBrains Mono', monospace`;

// ─── Responsive ───
function useWindowSize() {
  const [size, setSize] = useState({ w: typeof window !== "undefined" ? window.innerWidth : 1200 });
  useEffect(() => { const h = () => setSize({ w: window.innerWidth }); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return size;
}
const BP = { mobile: 640, tablet: 1024 };

// ─── Helpers ───
function calcStatus(expiryDate) {
  if (!expiryDate) return "red";
  const now = new Date(); const exp = new Date(expiryDate);
  const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "red"; if (diffDays <= 60) return "amber"; return "green";
}
function calcExpiry(lastEicrDate) {
  if (!lastEicrDate) return null;
  const d = new Date(lastEicrDate); d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().split("T")[0];
}
function statusColor(s) { return s === "green" ? C.green : s === "amber" ? C.amber : C.red; }
function statusBg(s) { return s === "green" ? C.greenBg : s === "amber" ? C.amberBg : C.redBg; }
function statusBorder(s) { return s === "green" ? C.greenBorder : s === "amber" ? C.amberBorder : C.redBorder; }
function jobStatusColor(s) { if (s === "Completed") return C.green; if (s === "In Progress") return C.accent; if (s === "Scheduled") return C.amber; if (s === "Awaiting Sign-Off") return C.purple; return C.textMuted; }
function jobStatusBg(s) { if (s === "Completed") return C.greenBg; if (s === "In Progress") return C.accentGlow; if (s === "Scheduled") return C.amberBg; if (s === "Awaiting Sign-Off") return C.purpleBg; return "rgba(255,255,255,.05)"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function overallStatus(p) {
  const statuses = [calcStatus(p.expiry_date), calcStatus(p.smoke_expiry), calcStatus(p.pat_expiry)];
  if (statuses.includes("red")) return "red";
  if (statuses.includes("amber")) return "amber";
  return "green";
}

// ─── Data Context ───
const DataContext = createContext(null);
const AuthContext = createContext(null);

// ─── Icons ───
function Icon({ name, size = 18, color = C.textMuted }) {
  const s = { width: size, height: size, display: "inline-block", verticalAlign: "middle", flexShrink: 0 };
  const icons = {
    home: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    briefcase: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    file: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    clock: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    shield: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    alert: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    user: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    search: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    download: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    zap: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    activity: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    clipboard: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
    checkCircle: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    x: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    archive: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
    upload: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    menu: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    logout: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    tool: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    fileCheck: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/></svg>,
    csv: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  };
  return icons[name] || null;
}

function AnimNum({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => { let s = 0; const step = target / (duration / 16); const id = setInterval(() => { s += step; if (s >= target) { setVal(target); clearInterval(id); } else setVal(Math.round(s)); }, 16); return () => clearInterval(id); }, [target]);
  return <>{val}</>;
}

function ComplianceDonut({ green, amber, red, size = 180 }) {
  const total = green + amber + red || 1; const gPct = (green / total) * 100; const gA = (gPct / 100) * 360; const aA = ((amber / total) * 100 / 100) * 360;
  const inner = Math.round(size * 0.667);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${C.green} 0deg ${gA}deg, ${C.amber} ${gA}deg ${gA + aA}deg, ${C.red} ${gA + aA}deg 360deg)`, display: "grid", placeItems: "center" }}>
        <div style={{ width: inner, height: inner, borderRadius: "50%", background: C.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size > 140 ? 32 : 24, fontWeight: 700, color: C.white, fontFamily: font, lineHeight: 1 }}>{Math.round(gPct)}%</span>
          <span style={{ fontSize: size > 140 ? 11 : 9, color: C.textMuted, fontFamily: font, marginTop: 2 }}>Compliant</span>
        </div>
      </div>
    </div>
  );
}

// ─── Form Components ───
function Input({ label, value, onChange, type = "text", placeholder = "", small = false, disabled = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ fontFamily: font, fontSize: small ? 12 : 14, color: disabled ? C.textDim : C.text, background: disabled ? C.surface : C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: small ? "8px 10px" : "10px 12px", outline: "none", opacity: disabled ? 0.6 : 1, minHeight: 44 }} />
    </div>
  );
}

function Select({ label, value, onChange, options, small = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ fontFamily: font, fontSize: small ? 12 : 14, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: small ? "8px 10px" : "10px 12px", outline: "none", cursor: "pointer", minHeight: 44 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 540 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: "16px 16px 0 0", border: `1px solid ${C.border}`, borderBottom: "none", padding: "24px 20px", width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -10px 60px rgba(0,0,0,.5)", animation: "slideUp .25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: font, fontSize: 17, fontWeight: 600, color: C.white, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, minWidth: 44, minHeight: 44, display: "grid", placeItems: "center" }}><Icon name="x" size={18} color={C.textMuted} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ message, type = "success", show }) {
  if (!show) return null;
  const bg = type === "success" ? C.greenBg : type === "error" ? C.redBg : C.amberBg;
  const col = type === "success" ? C.green : type === "error" ? C.red : C.amber;
  const bdr = type === "success" ? C.greenBorder : type === "error" ? C.redBorder : C.amberBorder;
  return (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: bg, border: `1px solid ${bdr}`, borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(0,0,0,.3)", animation: "fadeIn .3s ease", maxWidth: "90vw" }}>
      <Icon name={type === "success" ? "checkCircle" : "alert"} size={18} color={col} />
      <span style={{ fontFamily: font, fontSize: 13, color: col, fontWeight: 500 }}>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) setError(error.message);
    else setResetSent(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)`, display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Icon name="zap" size={28} color="#fff" /></div>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: C.white, margin: "0 0 4px" }}>OhmniumIQ</h1>
          <p style={{ fontFamily: font, fontSize: 13, color: C.textMuted }}>Compliance Portal</p>
        </div>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
          {resetSent ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <Icon name="checkCircle" size={36} color={C.green} />
              <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>Check your email</div>
              <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6 }}>A reset link has been sent to {email}</div>
              <button onClick={() => { setResetMode(false); setResetSent(false); }} style={{ fontFamily: font, fontSize: 13, color: C.accent, background: "none", border: "none", cursor: "pointer", marginTop: 16 }}>Back to sign in</button>
            </div>
          ) : resetMode ? (
            <>
              <h2 style={{ fontFamily: font, fontSize: 17, fontWeight: 600, color: C.white, margin: "0 0 8px" }}>Reset password</h2>
              <p style={{ fontFamily: font, fontSize: 12, color: C.textMuted, margin: "0 0 20px" }}>Enter your email and we'll send a reset link.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
                <button onClick={handleReset} disabled={loading || !email} style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white, background: !email ? C.textDim : C.accent, border: "none", borderRadius: 10, padding: "12px 20px", cursor: !email ? "not-allowed" : "pointer", minHeight: 48, opacity: loading ? 0.7 : 1 }}>{loading ? "Sending…" : "Send Reset Link"}</button>
                <button onClick={() => { setResetMode(false); setError(""); }} style={{ fontFamily: font, fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>Back to sign in</button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: font, fontSize: 17, fontWeight: 600, color: C.white, margin: "0 0 20px" }}>Sign in</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" />
                {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
                <button onClick={handleLogin} disabled={loading || !email || !password} style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white, background: (!email || !password) ? C.textDim : C.accent, border: "none", borderRadius: 10, padding: "12px 20px", cursor: (!email || !password) ? "not-allowed" : "pointer", minHeight: 48, opacity: loading ? 0.7 : 1, marginTop: 4 }}>{loading ? "Signing in…" : "Sign In"}</button>
                <button onClick={() => { setResetMode(true); setError(""); }} style={{ fontFamily: font, fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>Forgot password?</button>
              </div>
            </>
          )}
        </div>
        <p style={{ fontFamily: font, fontSize: 11, color: C.textDim, textAlign: "center", marginTop: 20 }}>Ohmnium Electrical Ltd · Compliance Portal v18.0</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUPABASE DATA PROVIDER
// ─────────────────────────────────────────────
function DataProvider({ children, userProfile }) {
  const [properties, setProperties] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [audit, setAudit] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [organisations, setOrganisations] = useState([]);

  const isAdmin = ["admin"].includes(userProfile.role);
  const ohmniumOrgId = userProfile.organisation_id;

  // Fetch all data on mount
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const orgId = userProfile.organisation_id;

    // Always load organisations (admins see all, others see their own)
    const orgRes = await supabase.from("organisations").select("*").order("name");
    const allOrgs = orgRes.data || [];
    setOrganisations(allOrgs);

    // Active agency IDs (for filtering properties/jobs)
    const activeAgencyIds = allOrgs.filter(o => o.is_active !== false).map(o => o.id);

    if (isAdmin) {
      // Admins: load all properties/jobs across all active agencies, plus own org data
      const [propRes, jobRes, docRes, auditRes, engRes, commentRes] = await Promise.all([
        supabase.from("properties").select("*").in("agency_id", activeAgencyIds.length ? activeAgencyIds : ["none"]).order("ref"),
        supabase.from("jobs").select("*").in("organisation_id", activeAgencyIds.length ? [...activeAgencyIds, orgId] : [orgId]).order("created_at", { ascending: false }),
        supabase.from("documents").select("*").in("organisation_id", activeAgencyIds.length ? [...activeAgencyIds, orgId] : [orgId]).order("uploaded_at", { ascending: false }),
        supabase.from("audit_log").select("*").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("id, full_name, role, organisation_id").order("full_name"),
        supabase.from("job_comments").select("*").order("created_at", { ascending: true }),
      ]);
      if (propRes.data) setProperties(propRes.data);
      if (jobRes.data) setJobs(jobRes.data);
      if (docRes.data) setDocuments(docRes.data);
      if (auditRes.data) setAudit(auditRes.data);
      if (engRes.data) setEngineers(engRes.data);
      console.log("ADMIN profiles fetch — data:", JSON.stringify(engRes.data), "error:", JSON.stringify(engRes.error));
      if (commentRes.data) setComments(commentRes.data);
    } else {
      // Non-admins: scoped to their own organisation only
      const [propRes, jobRes, docRes, auditRes, engRes, commentRes] = await Promise.all([
        supabase.from("properties").select("*").eq("agency_id", orgId).order("ref"),
        supabase.from("jobs").select("*").eq("organisation_id", orgId).order("created_at", { ascending: false }),
        supabase.from("documents").select("*").eq("organisation_id", orgId).order("uploaded_at", { ascending: false }),
        supabase.from("audit_log").select("*").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("id, full_name, role, organisation_id").eq("organisation_id", orgId).in("role", ["engineer", "junior", "supervisor", "agent", "admin"]),
        supabase.from("job_comments").select("*").eq("organisation_id", orgId).order("created_at", { ascending: true }),
      ]);
      if (propRes.data) setProperties(propRes.data);
      if (jobRes.data) setJobs(jobRes.data);
      if (docRes.data) setDocuments(docRes.data);
      if (auditRes.data) setAudit(auditRes.data);
      if (engRes.data) setEngineers(engRes.data);
      if (commentRes.data) setComments(commentRes.data);
    }
    setLoading(false);
  }, [userProfile, isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Mutation functions ───
  const addProperty = useCallback(async (prop) => {
    const { data, error } = await supabase.from("properties").insert({
      address: prop.address, tenant_name: prop.tenant, tenant_phone: prop.phone,
      last_eicr: prop.lastEicr || null, expiry_date: prop.expiryDate || null,
      smoke_expiry: prop.smokeExpiry || null, pat_expiry: prop.patExpiry || null,
      agency_id: prop.agencyId || userProfile.organisation_id,
      created_by: userProfile.id,
    }).select().single();
    if (data) setProperties(prev => [...prev, data]);
    return { data, error };
  }, [userProfile]);

  const updateProperty = useCallback(async (id, updates) => {
    const mapped = {};
    if (updates.lastEicr !== undefined) mapped.last_eicr = updates.lastEicr;
    if (updates.expiryDate !== undefined) mapped.expiry_date = updates.expiryDate;
    if (updates.tenant_name !== undefined) mapped.tenant_name = updates.tenant_name;
    if (updates.tenant_phone !== undefined) mapped.tenant_phone = updates.tenant_phone;
    if (updates.address !== undefined) mapped.address = updates.address;
    if (updates.last_smoke !== undefined) mapped.last_smoke = updates.last_smoke;
    if (updates.smoke_expiry !== undefined) mapped.smoke_expiry = updates.smoke_expiry;
    if (updates.last_pat !== undefined) mapped.last_pat = updates.last_pat;
    if (updates.pat_expiry !== undefined) mapped.pat_expiry = updates.pat_expiry;
    const { data, error } = await supabase.from("properties").update(mapped).eq("id", id).select().single();
    if (data) setProperties(prev => prev.map(p => p.id === id ? data : p));
    return { data, error };
  }, []);

  const deleteProperty = useCallback(async (id) => {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (!error) setProperties(prev => prev.filter(p => p.id !== id));
    return { error };
  }, []);

  const deleteJob = useCallback(async (id) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (!error) setJobs(prev => prev.filter(j => j.id !== id));
    return { error };
  }, []);

  const addComment = useCallback(async (comment) => {
    const { data, error } = await supabase.from("job_comments").insert({
      job_id: comment.jobId,
      organisation_id: userProfile.organisation_id,
      body: comment.body,
      author_id: userProfile.id,
      author_name: userProfile.full_name,
      author_role: userProfile.role,
    }).select().single();
    if (data) setComments(prev => [...prev, data]);
    return { data, error };
  }, [userProfile]);

  const addJob = useCallback(async (job) => {
    // organisation_id must be set — derive from the property's agency_id if not explicitly provided
    let orgIdForJob = job.organisationId || null;
    if (!orgIdForJob && job.propertyId) {
      const { data: propRow } = await supabase.from("properties").select("agency_id").eq("id", job.propertyId).single();
      orgIdForJob = propRow?.agency_id || userProfile.organisation_id;
    }
    const { data, error } = await supabase.from("jobs").insert({
      property_id: job.propertyId, type: job.type, status: job.status || "Pending",
      engineer_id: job.engineerId || null, scheduled_date: job.date || null,
      notes: job.notes || null, eicr_data: job.eicrData || null,
      organisation_id: orgIdForJob,
      created_by: userProfile.id,
    }).select().single();
    if (data) setJobs(prev => [data, ...prev]);
    if (error) console.error("addJob Supabase error:", JSON.stringify(error));
    return { data, error };
  }, [userProfile]);

  const updateJob = useCallback(async (id, updates) => {
    const mapped = {};
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.engineerId !== undefined) mapped.engineer_id = updates.engineerId;
    if (updates.date !== undefined) mapped.scheduled_date = updates.date;
    if (updates.notes !== undefined) mapped.notes = updates.notes;
    if (updates.eicrData !== undefined) mapped.eicr_data = updates.eicrData;
    if (updates.hasCert !== undefined) mapped.has_cert = updates.hasCert;
    const { data, error } = await supabase.from("jobs").update(mapped).eq("id", id).select().single();
    if (data) setJobs(prev => prev.map(j => j.id === id ? data : j));
    return { data, error };
  }, []);

  const addDoc = useCallback(async (doc) => {
    const { data, error } = await supabase.from("documents").insert({
      job_id: doc.jobId, property_id: doc.propertyId, type: doc.type,
      file_path: doc.filePath || null, file_name: doc.fileName || null,
      expiry_date: doc.expiry || null, uploaded_by: userProfile.id,
      organisation_id: doc.organisationId || userProfile.organisation_id,
    }).select().single();
    if (data) setDocuments(prev => [data, ...prev]);
    return { data, error };
  }, [userProfile]);

  const addAudit = useCallback(async (entry) => {
    const { data, error } = await supabase.from("audit_log").insert({
      action: entry.action,
      user_id: entry.userId || userProfile.id,
      user_name: entry.userName || userProfile.full_name,
      user_role: entry.userRole || userProfile.role,
      organisation_id: userProfile.organisation_id,
    }).select().single();
    if (data) setAudit(prev => [data, ...prev]);
    return { data, error };
  }, [userProfile]);

  const uploadFile = useCallback(async (file, path) => {
    const { data, error } = await supabase.storage.from("certificates").upload(path, file);
    return { data, error };
  }, []);

  const addOrg = useCallback(async (org) => {
    const { data, error } = await supabase.from("organisations").insert({
      name: org.name.trim(),
      contact_email: org.email?.trim() || null,
      phone: org.phone?.trim() || null,
      address: org.address?.trim() || null,
      is_active: true,
    }).select().single();
    if (data) setOrganisations(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return { data, error };
  }, []);

  const updateOrg = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from("organisations").update(updates).eq("id", id).select().single();
    if (data) setOrganisations(prev => prev.map(o => o.id === id ? data : o));
    return { data, error };
  }, []);

  const ctx = { properties, jobs, documents, audit, engineers, comments, organisations, loading, addProperty, updateProperty, deleteProperty, addJob, updateJob, deleteJob, addDoc, addAudit, addComment, uploadFile, fetchAll, addOrg, updateOrg, ohmniumOrgId: userProfile.organisation_id };

  return <DataContext.Provider value={ctx}>{children}</DataContext.Provider>;
}

// ─────────────────────────────────────────────
// BOTTOM NAV (mobile)
// ─────────────────────────────────────────────
function BottomNav({ active, setActive, role, jobs, authId }) {
  const pSO = jobs.filter(j => j.status === "Awaiting Sign-Off").length;
  const rejectedEicrs = ["engineer", "junior"].includes(role) ? jobs.filter(j => j.engineer_id === authId && j.status === "In Progress" && j.type === "EICR" && j.eicr_data?.rejectionReason).length : 0;
  const items = [
    { id: "dashboard", label: "Home", icon: "shield" },
    { id: "properties", label: "Properties", icon: "home" },
    { id: "jobs", label: "Jobs", icon: "briefcase" },
    { id: "documents", label: "Docs", icon: "file" },
    { id: "more", label: "More", icon: "menu" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", padding: "6px 0 env(safe-area-inset-bottom, 6px)" }}>
      {items.map(item => {
        const isA = active === item.id || (item.id === "more" && ["eicr", "signoff", "audit"].includes(active));
        return (
          <button key={item.id} onClick={() => setActive(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "6px 12px", minWidth: 56, position: "relative" }}>
            <Icon name={item.icon} size={20} color={isA ? C.accent : C.textDim} />
            <span style={{ fontFamily: font, fontSize: 9, fontWeight: isA ? 600 : 400, color: isA ? C.accent : C.textDim }}>{item.label}</span>
            {item.id === "more" && pSO > 0 && ["supervisor", "admin"].includes(role) && <span style={{ position: "absolute", top: 2, right: 6, width: 8, height: 8, borderRadius: "50%", background: C.purple }} />}
            {item.id === "jobs" && rejectedEicrs > 0 && <span style={{ position: "absolute", top: 2, right: 6, width: 8, height: 8, borderRadius: "50%", background: C.red }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// TEAM / USER MANAGEMENT (admin only)
// ─────────────────────────────────────────────
// ─── Add Agency Modal ───
function AddAgencyModal({ open, onClose }) {
  const { addOrg, addAudit } = useContext(DataContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => { setName(""); setEmail(""); setPhone(""); setAddress(""); setError(""); setDone(false); };

  const submit = async () => {
    if (!name.trim()) { setError("Agency name is required"); return; }
    setSaving(true); setError("");
    const { data, error: err } = await addOrg({ name, email, phone, address });
    if (err) { setError(err.message); setSaving(false); return; }
    await addAudit({ action: `Client agency added: ${name.trim()}` });
    setSaving(false); setDone(true);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Add Client Agency">
      {done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icon name="checkCircle" size={36} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>Agency added</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6 }}>You can now invite agents and assign them to this agency.</div>
          <button onClick={() => { reset(); onClose("added"); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44, marginTop: 20 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Agency Name *" value={name} onChange={setName} placeholder="e.g. Kellett Lettings" />
          <Input label="Contact Email" type="email" value={email} onChange={setEmail} placeholder="hello@kellettlettings.co.uk" />
          <Input label="Phone Number" value={phone} onChange={setPhone} placeholder="e.g. 020 7123 4567" />
          <Input label="Address" value={address} onChange={setAddress} placeholder="e.g. 12 High Street, London EC1A 1BB" />
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={submit} disabled={saving || !name.trim()} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: name.trim() ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: name.trim() ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Add Agency"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Edit Agency Modal ───
function EditAgencyModal({ open, onClose, agency }) {
  const { updateOrg, addAudit } = useContext(DataContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (agency) {
      setName(agency.name || ""); setEmail(agency.contact_email || "");
      setPhone(agency.phone || ""); setAddress(agency.address || "");
      setIsActive(agency.is_active !== false);
    }
  }, [agency]);

  const submit = async () => {
    if (!name.trim()) { setError("Agency name is required"); return; }
    setSaving(true); setError("");
    const { error: err } = await updateOrg(agency.id, {
      name: name.trim(), contact_email: email.trim() || null,
      phone: phone.trim() || null, address: address.trim() || null,
      is_active: isActive,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    await addAudit({ action: `Client agency updated: ${name.trim()}${!isActive ? " (set inactive)" : ""}` });
    setSaving(false); onClose("updated");
  };

  return (
    <Modal open={open} onClose={() => onClose()} title="Edit Agency">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Agency Name *" value={name} onChange={setName} placeholder="e.g. Kellett Lettings" />
        <Input label="Contact Email" type="email" value={email} onChange={setEmail} placeholder="hello@kellettlettings.co.uk" />
        <Input label="Phone Number" value={phone} onChange={setPhone} placeholder="e.g. 020 7123 4567" />
        <Input label="Address" value={address} onChange={setAddress} placeholder="e.g. 12 High Street, London EC1A 1BB" />
        {/* Active / Inactive toggle */}
        <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Agency Status</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setIsActive(true)} style={{ flex: 1, fontFamily: font, fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? C.white : C.textMuted, background: isActive ? C.green : C.card, border: `1px solid ${isActive ? C.green : C.border}`, borderRadius: 8, padding: "10px 0", cursor: "pointer", minHeight: 44 }}>
              ✓ Active
            </button>
            <button onClick={() => setIsActive(false)} style={{ flex: 1, fontFamily: font, fontSize: 13, fontWeight: !isActive ? 600 : 400, color: !isActive ? C.white : C.textMuted, background: !isActive ? C.red : C.card, border: `1px solid ${!isActive ? C.red : C.border}`, borderRadius: 8, padding: "10px 0", cursor: "pointer", minHeight: 44 }}>
              ✕ Inactive
            </button>
          </div>
          {!isActive && <div style={{ fontFamily: font, fontSize: 11, color: C.red, marginTop: 8 }}>⚠ Inactive agencies are hidden from all property and job lists.</div>}
        </div>
        {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => onClose()} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </Modal>
  );
}

function InviteUserModal({ open, onClose, defaultRole = "engineer", defaultOrgId = null }) {
  const auth = useContext(AuthContext);
  const { organisations, ohmniumOrgId } = useContext(DataContext);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [agencyOrgId, setAgencyOrgId] = useState(defaultOrgId || "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setRole(defaultRole); setAgencyOrgId(defaultOrgId || ""); } }, [open, defaultRole, defaultOrgId]);

  const isAgentRole = role === "agent";
  const assignedOrgId = isAgentRole ? agencyOrgId : ohmniumOrgId;
  const assignedOrgName = isAgentRole
    ? (organisations.find(o => o.id === agencyOrgId)?.name || "— select agency —")
    : "Ohmnium Electrical Ltd";

  const agencyOrgs = organisations.filter(o => o.id !== ohmniumOrgId && o.is_active !== false);

  const submit = async () => {
    if (!email.trim() || !name.trim()) { setError("Name and email are required"); return; }
    if (isAgentRole && !agencyOrgId) { setError("Please select the agency this agent belongs to"); return; }
    setSaving(true); setError("");
    const orgToAssign = isAgentRole ? agencyOrgId : ohmniumOrgId;
    const { data, error: signupError } = await supabase.auth.admin.createUser({
      email: email.trim(), email_confirm: true,
      user_metadata: { full_name: name.trim(), role, organisation_id: orgToAssign },
    });
    if (signupError) {
      const { error: inviteError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { data: { full_name: name.trim(), role, organisation_id: orgToAssign } },
      });
      if (inviteError) { setError(inviteError.message); setSaving(false); return; }
    }
    setSaving(false); setDone(true);
  };

  const reset = () => { setEmail(""); setName(""); setRole(defaultRole); setAgencyOrgId(defaultOrgId || ""); setDone(false); setError(""); };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Invite Team Member">
      {done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icon name="checkCircle" size={36} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>Invite sent</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6 }}>An email has been sent to <strong>{email}</strong> with a link to set their password.</div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4 }}>Assigned to: <strong style={{ color: C.accent }}>{assignedOrgName}</strong></div>
          <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44, marginTop: 20 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Full Name" value={name} onChange={setName} placeholder="e.g. James Mitchell" />
          <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="james@example.com" />
          <Select label="Role" value={role} onChange={setRole} options={[
            { value: "agent", label: "Agent — manages properties & requests jobs" },
            { value: "engineer", label: "Engineer — can run EICR forms" },
            { value: "junior", label: "Junior Engineer — submits for sign-off" },
            { value: "supervisor", label: "Supervisor — signs off junior EICRs" },
            { value: "admin", label: "Admin — full access" },
          ]} />

          {/* Organisation assignment — changes based on role */}
          {isAgentRole ? (
            <div>
              <Select label="Client Agency *" value={agencyOrgId} onChange={setAgencyOrgId}
                options={[{ value: "", label: "— Select agency —" }, ...agencyOrgs.map(o => ({ value: o.id, label: o.name }))]} />
              {agencyOrgs.length === 0 && (
                <div style={{ fontFamily: font, fontSize: 11, color: C.amber, marginTop: 6 }}>⚠ No client agencies exist yet. Add one in the Client Agencies tab first.</div>
              )}
            </div>
          ) : (
            <div style={{ background: C.accentGlow, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontFamily: font, fontSize: 11, color: C.accent }}>🏢 This person will be added to <strong>Ohmnium Electrical Ltd</strong></div>
            </div>
          )}

          {isAgentRole && agencyOrgId && (
            <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontFamily: font, fontSize: 11, color: C.green }}>✓ This agent will be added to <strong>{organisations.find(o => o.id === agencyOrgId)?.name}</strong> and will only see that agency's properties and jobs.</div>
            </div>
          )}

          <div style={{ background: C.accentGlow, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontFamily: font, fontSize: 11, color: C.accent }}>ℹ️ The person will receive an email with a login link. They'll set their own password on first sign-in.</div>
          </div>
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={submit} disabled={saving || !email || !name || (isAgentRole && !agencyOrgId)} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: (email && name && (!isAgentRole || agencyOrgId)) ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Sending…" : "Send Invite"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TeamPage() {
  const { engineers, organisations, ohmniumOrgId } = useContext(DataContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [tab, setTab] = useState("ohmnium");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState("engineer");
  const [inviteOrgId, setInviteOrgId] = useState(null);
  const [showAddAgency, setShowAddAgency] = useState(false);
  const [editAgency, setEditAgency] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const roleLabel = (r) => ({ admin: "Admin", agent: "Agent", engineer: "Engineer", junior: "Junior Engineer", supervisor: "Supervisor" }[r] || r);
  const roleColor = (r) => ({ admin: C.white, agent: C.accent, engineer: C.green, junior: C.purple, supervisor: C.amber }[r] || C.textMuted);

  // Split members: Ohmnium staff vs agents
  const ohmniumMembers = engineers.filter(e => e.organisation_id === ohmniumOrgId);
  const agentMembers = engineers.filter(e => e.role === "agent" && e.organisation_id !== ohmniumOrgId);

  // Agency orgs (all except Ohmnium's own)
  const agencyOrgs = organisations.filter(o => o.id !== ohmniumOrgId);

  const openInviteOhmnium = () => { setInviteRole("engineer"); setInviteOrgId(null); setShowInvite(true); };
  const openInviteAgent = (orgId) => { setInviteRole("agent"); setInviteOrgId(orgId); setShowInvite(true); };

  return (
    <div>
      {/* TEMP DEBUG — remove after fix */}
      <div style={{ background: "#1a1a2e", border: "1px solid #f59e0b", borderRadius: 10, padding: 14, marginBottom: 16, fontFamily: "monospace", fontSize: 11, color: "#f59e0b" }}>
        <div>engineers array length: {engineers.length}</div>
        <div>ohmniumOrgId: {ohmniumOrgId || "UNDEFINED"}</div>
        <div>ohmniumMembers: {ohmniumMembers.length}</div>
        <div>agentMembers: {agentMembers.length}</div>
        {engineers.map(e => <div key={e.id}>{e.full_name} | {e.role} | {e.organisation_id}</div>)}
      </div>
      <Toast message={toast} show={!!toast} />
      <InviteUserModal open={showInvite} defaultRole={inviteRole} defaultOrgId={inviteOrgId} onClose={() => { setShowInvite(false); showToast("Invite sent"); }} />
      <AddAgencyModal open={showAddAgency} onClose={(r) => { setShowAddAgency(false); if (r === "added") showToast("Agency added"); }} />
      <EditAgencyModal open={!!editAgency} agency={editAgency} onClose={(r) => { setEditAgency(null); if (r === "updated") showToast("Agency updated"); }} />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.card, borderRadius: 10, padding: 4, border: `1px solid ${C.border}` }}>
        {[{ id: "ohmnium", label: "Ohmnium Team" }, { id: "agencies", label: "Client Agencies" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, fontFamily: font, fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? C.white : C.textMuted, background: tab === t.id ? C.accent : "transparent", border: "none", borderRadius: 7, padding: "10px 0", cursor: "pointer", minHeight: 40 }}>{t.label}</button>
        ))}
      </div>

      {/* ── Ohmnium Team tab ── */}
      {tab === "ohmnium" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={openInviteOhmnium} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", minHeight: 40 }}>
              <Icon name="plus" size={14} color={C.white} /> Invite Team Member
            </button>
          </div>
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {ohmniumMembers.length === 0 && (
              <div style={{ padding: 40, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>No team members yet — invite your first engineer</span></div>
            )}
            {ohmniumMembers.map((member, i) => (
              <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: i < ohmniumMembers.length - 1 ? `1px solid ${C.border}` : "none", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${roleColor(member.role)}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: roleColor(member.role) }}>{(member.full_name || "?")[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{member.full_name}</div>
                    <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{member.email || ""}</div>
                  </div>
                </div>
                <span style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: roleColor(member.role), background: `${roleColor(member.role)}18`, padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>{roleLabel(member.role)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Client Agencies tab ── */}
      {tab === "agencies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => setShowAddAgency(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", minHeight: 40 }}>
              <Icon name="plus" size={14} color={C.white} /> Add Agency
            </button>
          </div>
          {agencyOrgs.length === 0 && (
            <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 40, textAlign: "center" }}>
              <Icon name="home" size={36} color={C.textDim} />
              <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 16 }}>No client agencies yet</div>
              <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 6 }}>Add an agency first, then invite their agents.</div>
            </div>
          )}
          {agencyOrgs.map((agency, i) => {
            const agencyAgents = agentMembers.filter(a => a.organisation_id === agency.id);
            const isActive = agency.is_active !== false;
            return (
              <div key={agency.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${isActive ? C.border : C.redBorder}`, marginBottom: 12, overflow: "hidden", opacity: isActive ? 1 : 0.7 }}>
                {/* Agency header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: isActive ? C.accentGlow : C.redBg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name="home" size={20} color={isActive ? C.accent : C.red} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600 }}>{agency.name}</span>
                        <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: isActive ? C.green : C.red, background: isActive ? C.greenBg : C.redBg, border: `1px solid ${isActive ? C.greenBorder : C.redBorder}`, padding: "2px 8px", borderRadius: 10 }}>{isActive ? "ACTIVE" : "INACTIVE"}</span>
                      </div>
                      <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>
                        {[agency.contact_email, agency.phone, agency.address].filter(Boolean).join(" · ") || "No contact details"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setEditAgency(agency)} style={{ fontFamily: font, fontSize: 11, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Edit</button>
                    {isActive && <button onClick={() => openInviteAgent(agency.id)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>+ Invite Agent</button>}
                  </div>
                </div>
                {/* Agents in this agency */}
                {agencyAgents.length > 0 && (
                  <div style={{ borderTop: `1px solid ${C.border}` }}>
                    {agencyAgents.map((agent, j) => (
                      <div key={agent.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 12px 76px", borderBottom: j < agencyAgents.length - 1 ? `1px solid ${C.border}` : "none", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.accent}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.accent }}>{(agent.full_name || "?")[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{agent.full_name}</div>
                            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 1 }}>{agent.email || ""}</div>
                          </div>
                        </div>
                        <span style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.accent, background: `${C.accent}18`, padding: "4px 12px", borderRadius: 20 }}>Agent</span>
                      </div>
                    ))}
                  </div>
                )}
                {agencyAgents.length === 0 && isActive && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px 12px 76px" }}>
                    <span style={{ fontFamily: font, fontSize: 12, color: C.textDim }}>No agents invited yet</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChangePasswordModal({ open, onClose }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => { setCurrent(""); setNewPw(""); setConfirm(""); setError(""); setDone(false); };

  const submit = async () => {
    setError("");
    if (!newPw || newPw.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPw !== confirm) { setError("Passwords do not match"); return; }
    setSaving(true);
    // Supabase requires re-auth before password update — sign in again first
    const { data: { user } } = await supabase.auth.getUser();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (signInErr) { setError("Current password is incorrect"); setSaving(false); return; }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    if (updateErr) { setError(updateErr.message); setSaving(false); return; }
    setSaving(false); setDone(true);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Change Password">
      {done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icon name="checkCircle" size={36} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>Password updated</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6 }}>Your password has been changed successfully.</div>
          <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44, marginTop: 20 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Current Password" type="password" value={current} onChange={setCurrent} placeholder="Your current password" />
          <Input label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="At least 8 characters" />
          <Input label="Confirm New Password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={submit} disabled={saving || !current || !newPw || !confirm} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: (current && newPw && confirm) ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: (current && newPw && confirm) ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Updating…" : "Update Password"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function EditNameModal({ open, onClose }) {
  const auth = useContext(AuthContext);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => { if (open) { setName(auth.fullName || ""); setError(""); setDone(false); } }, [open]);

  const submit = async () => {
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    setSaving(true);
    const { error: err } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", auth.id);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setDone(true);
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Name">
      {done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icon name="checkCircle" size={36} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>Name updated</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6 }}>Your display name has been changed. Reload to see the update everywhere.</div>
          <button onClick={onClose} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44, marginTop: 20 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Display Name" value={name} onChange={setName} placeholder="Your full name" />
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={onClose} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={submit} disabled={saving || !name.trim()} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: name.trim() ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: name.trim() ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MorePage({ setActive, role, onLogout }) {
  const [showChangePw, setShowChangePw] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const moreItems = [
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "eicr", label: "EICR Form", icon: "clipboard", desc: "BS 7671 inspection form" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "pat", label: "PAT Testing Form", icon: "zap", desc: "Portable appliance test record" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "smoke", label: "Smoke Alarm Form", icon: "alert", desc: "Alarm inspection record" }] : []),
    ...(["supervisor", "admin"].includes(role) ? [{ id: "signoff", label: "Sign-Off Queue", icon: "checkCircle", desc: "Review junior submissions" }] : []),
    { id: "audit", label: "Audit Trail", icon: "activity", desc: "Full activity history" },
    ...(["admin"].includes(role) ? [{ id: "team", label: "Team Management", icon: "user", desc: "Invite engineers and agents" }] : []),
  ];
  return (
    <div>
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
      <EditNameModal open={showEditName} onClose={() => setShowEditName(false)} />
      {moreItems.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", marginBottom: 10, textAlign: "left" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentGlow, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={item.icon} size={20} color={C.accent} /></div>
          <div><div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white }}>{item.label}</div><div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 2 }}>{item.desc}</div></div>
        </button>
      ))}
      <button onClick={() => setShowEditName(true)} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", marginBottom: 10, textAlign: "left" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentGlow, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="user" size={20} color={C.accent} /></div>
        <div><div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white }}>Edit Name</div><div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 2 }}>Update your display name</div></div>
      </button>
      <button onClick={() => setShowChangePw(true)} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", marginBottom: 10, textAlign: "left" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentGlow, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="shield" size={20} color={C.accent} /></div>
        <div><div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white }}>Change Password</div><div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 2 }}>Update your account password</div></div>
      </button>
      <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 14, cursor: "pointer", marginTop: 10, textAlign: "left" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.redBg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="logout" size={20} color={C.red} /></div>
        <div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.red }}>Sign Out</div>
      </button>
    </div>
  );
}

// ─── Desktop Sidebar ───
function Sidebar({ active, setActive, role, userProfile, onLogout }) {
  const { jobs } = useContext(DataContext);
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "shield" },
    { id: "properties", label: "Properties", icon: "home" },
    { id: "jobs", label: "Jobs", icon: "briefcase" },
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "eicr", label: "EICR Form", icon: "clipboard" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "pat", label: "PAT Form", icon: "zap" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "smoke", label: "Smoke Form", icon: "alert" }] : []),
    ...(["supervisor", "admin"].includes(role) ? [{ id: "signoff", label: "Sign-Off Queue", icon: "checkCircle" }] : []),
    { id: "documents", label: "Documents", icon: "file" },
    { id: "audit", label: "Audit Trail", icon: "activity" },
    ...(role === "admin" ? [{ id: "team", label: "Team", icon: "user" }] : []),
  ];
  const pSO = jobs.filter(j => j.status === "Awaiting Sign-Off").length;
  return (
    <div style={{ width: 240, minHeight: "100vh", background: C.surface, borderRight: `1px solid ${C.border}`, padding: "24px 0", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, zIndex: 10 }}>
      <div style={{ padding: "0 24px 32px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="zap" size={20} color="#fff" /></div>
        <div><div style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: C.white, lineHeight: 1 }}>OhmniumIQ</div><div style={{ fontFamily: font, fontSize: 10, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>Compliance Portal</div></div>
      </div>
      <div style={{ margin: "0 16px 24px", padding: "8px 12px", borderRadius: 8, background: C.accentGlow, border: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Logged in as</div>
        <div style={{ fontFamily: font, fontSize: 13, color: role === "junior" ? C.purple : C.accent, fontWeight: 600, marginTop: 2 }}>{userProfile.full_name}</div>
        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 1 }}>{role.charAt(0).toUpperCase() + role.slice(1)}</div>
      </div>
      <nav style={{ flex: 1 }}>{navItems.map(item => {
        const isA = active === item.id;
        return (<button key={item.id} onClick={() => setActive(item.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 24px", border: "none", cursor: "pointer", background: isA ? C.accentGlow : "transparent", borderLeft: isA ? `3px solid ${C.accent}` : "3px solid transparent", minHeight: 44 }}>
          <Icon name={item.icon} size={18} color={isA ? C.accent : C.textMuted} />
          <span style={{ fontFamily: font, fontSize: 13, fontWeight: isA ? 600 : 400, color: isA ? C.white : C.textMuted }}>{item.label}</span>
          {item.id === "signoff" && pSO > 0 && <span style={{ marginLeft: "auto", fontFamily: font, fontSize: 10, fontWeight: 700, color: C.white, background: C.purple, borderRadius: 10, padding: "2px 7px" }}>{pSO}</span>}
        </button>);
      })}</nav>
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.card, display: "grid", placeItems: "center" }}><Icon name="logout" size={16} color={C.textMuted} /></div>
          <div style={{ textAlign: "left" }}><div style={{ fontFamily: font, fontSize: 12, color: C.text }}>Sign Out</div><div style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>v18.0 — Supabase</div></div>
        </button>
      </div>
    </div>
  );
}

// ─── Top Bar (mobile) ───
function MobileTopBar({ userProfile, globalSearch, setGlobalSearch, onSearchSelect }) {
  const { properties } = useContext(DataContext);
  const [showR, setShowR] = useState(false);
  const results = globalSearch.length > 1 ? properties.filter(p => p.address.toLowerCase().includes(globalSearch.toLowerCase()) || p.tenant_name?.toLowerCase().includes(globalSearch.toLowerCase()) || p.ref?.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 6) : [];
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="zap" size={16} color="#fff" /></div>
        <div style={{ flex: 1 }}><span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: C.white }}>OhmniumIQ</span></div>
        <div style={{ fontFamily: font, fontSize: 10, color: C.accent, background: C.accentGlow, padding: "4px 10px", borderRadius: 6 }}>{userProfile.full_name?.split(" ")[0]}</div>
      </div>
      {["admin", "agent"].includes(userProfile.role) && (
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 8, padding: "8px 12px", border: `1px solid ${C.border}` }}>
            <Icon name="search" size={14} color={C.textDim} />
            <input value={globalSearch} onChange={e => { setGlobalSearch(e.target.value); setShowR(true); }} onFocus={() => setShowR(true)} onBlur={() => setTimeout(() => setShowR(false), 200)}
              placeholder="Search properties…" style={{ fontFamily: font, fontSize: 13, color: C.text, background: "transparent", border: "none", outline: "none", width: "100%", minHeight: 28 }} />
          </div>
          {showR && results.length > 0 && (
            <div style={{ position: "absolute", top: 48, left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", zIndex: 20, boxShadow: "0 12px 40px rgba(0,0,0,.4)" }}>
              {results.map(pr => (
                <button key={pr.id} onMouseDown={() => { onSearchSelect(pr.id); setGlobalSearch(""); setShowR(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", border: "none", cursor: "pointer", background: "transparent", textAlign: "left", borderBottom: `1px solid ${C.border}`, minHeight: 48 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: statusColor(calcStatus(pr.expiry_date)), flexShrink: 0 }} />
                  <div><div style={{ fontFamily: font, fontSize: 13, color: C.text, fontWeight: 500 }}>{pr.address.split(",")[0]}</div><div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{pr.tenant_name} · {pr.ref}</div></div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function DashboardPage({ onNavigateProperty }) {
  const { properties, jobs, audit, loading } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const tab = w < BP.tablet;

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}><div style={{ fontFamily: font, fontSize: 14, color: C.textMuted }}>Loading dashboard…</div></div>;

  // Engineer-specific dashboard
  if (["engineer", "junior"].includes(auth.role)) {
    const myJobs = jobs.filter(j => j.engineer_id === auth.id && j.status !== "Completed" && j.status !== "Cancelled");
    const today = new Date().toISOString().split("T")[0];
    const todayJobs = myJobs.filter(j => j.scheduled_date === today);
    const upcomingJobs = myJobs.filter(j => j.scheduled_date && j.scheduled_date > today).sort((a,b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    const pendingSignOff = myJobs.filter(j => j.status === "Awaiting Sign-Off");
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(3,1fr)", gap: mob ? 10 : 16, marginBottom: mob ? 20 : 28 }}>
          {[{ l: "Today", v: todayJobs.length, c: todayJobs.length > 0 ? C.accent : C.green, i: "clock" }, { l: "Upcoming", v: upcomingJobs.length, c: C.amber, i: "briefcase" }, { l: "Awaiting Sign-Off", v: pendingSignOff.length, c: C.purple, i: "clipboard" }].map((card, idx) => (
            <div key={idx} style={{ background: C.card, borderRadius: 14, padding: mob ? "16px 14px" : "20px 22px", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: card.c, opacity: 0.06 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: mob ? 8 : 12 }}><Icon name={card.i} size={mob ? 14 : 16} color={card.c} /><span style={{ fontFamily: font, fontSize: mob ? 9 : 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.l}</span></div>
              <div style={{ fontFamily: font, fontSize: mob ? 26 : 32, fontWeight: 700, color: C.white, lineHeight: 1 }}>{card.v}</div>
            </div>
          ))}
        </div>
        {todayJobs.length > 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}`, marginBottom: mob ? 14 : 20 }}>
            <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 16px" }}>Today's Jobs</h3>
            {todayJobs.map(job => { const prop = properties.find(p => p.id === job.property_id); return (
              <div key={job.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, marginBottom: 8, gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 600 }}>{prop?.address?.split(",")[0] || "—"}</div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{job.type} · {job.ref}{job.notes ? ` · ${job.notes}` : ""}</div>
                  {prop?.tenant_phone && <div style={{ fontFamily: font, fontSize: 11, color: C.accent, marginTop: 2 }}>📞 {prop.tenant_phone}</div>}
                </div>
                <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: jobStatusColor(job.status), background: jobStatusBg(job.status), padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{job.status}</span>
              </div>
            ); })}
          </div>
        )}
        {upcomingJobs.length > 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}`, marginBottom: mob ? 14 : 20 }}>
            <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 16px" }}>Upcoming Jobs</h3>
            {upcomingJobs.slice(0, 5).map(job => { const prop = properties.find(p => p.id === job.property_id); return (
              <div key={job.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, marginBottom: 8, gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{prop?.address?.split(",")[0] || "—"}</div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{job.type} · {formatDate(job.scheduled_date)}</div>
                </div>
                <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: jobStatusColor(job.status), background: jobStatusBg(job.status), padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{job.status}</span>
              </div>
            ); })}
          </div>
        )}
        {pendingSignOff.length > 0 && (
          <div style={{ background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="clipboard" size={20} color={C.purple} />
            <span style={{ fontFamily: font, fontSize: 13, color: C.text }}><strong>{pendingSignOff.length} submission{pendingSignOff.length > 1 ? "s" : ""}</strong> awaiting supervisor sign-off</span>
          </div>
        )}
        {myJobs.length === 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: 60, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <Icon name="checkCircle" size={40} color={C.green} />
            <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 16 }}>No active jobs</div>
            <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 6 }}>You have no jobs assigned at the moment</div>
          </div>
        )}
      </div>
    );
  }

  // Overall compliance = worst status across all 3 cert types for each property
  const g = properties.filter(p => overallStatus(p) === "green").length;
  const a = properties.filter(p => overallStatus(p) === "amber").length;
  const r = properties.filter(p => overallStatus(p) === "red").length;
  const activeJobs = jobs.filter(j => j.status !== "Completed").length;
  const awaiting = jobs.filter(j => j.status === "Awaiting Sign-Off").length;

  // Empty state for agents/admins with no properties
  if (properties.length === 0) {
    return (
      <div style={{ padding: mob ? 30 : 60, textAlign: "center" }}>
        <div style={{ background: C.card, borderRadius: 16, padding: mob ? 40 : 60, border: `1px solid ${C.border}`, maxWidth: 480, margin: "0 auto" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.accentGlow, display: "grid", placeItems: "center", margin: "0 auto 20px" }}><Icon name="home" size={32} color={C.accent} /></div>
          <h2 style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: C.white, margin: "0 0 10px" }}>Welcome to OhmniumIQ</h2>
          <p style={{ fontFamily: font, fontSize: 14, color: C.textMuted, margin: "0 0 8px", lineHeight: 1.5 }}>You don't have any properties yet. Add your first property to start tracking compliance.</p>
          <p style={{ fontFamily: font, fontSize: 12, color: C.textDim, margin: "0 0 28px", lineHeight: 1.5 }}>You can add properties one by one or import a batch using CSV upload from the Properties page.</p>
          <button onClick={() => onNavigateProperty && onNavigateProperty("__goto_properties__")} style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer", minHeight: 48 }}>Go to Properties →</button>
        </div>
      </div>
    );
  }

  const expiringSoon = properties.filter(p => overallStatus(p) === "amber").sort((a, b) => {
    const aMin = Math.min(...[p => p.expiry_date, p => p.smoke_expiry, p => p.pat_expiry].map(f => f(a) ? new Date(f(a)) : Infinity));
    const bMin = Math.min(...[p => p.expiry_date, p => p.smoke_expiry, p => p.pat_expiry].map(f => f(b) ? new Date(f(b)) : Infinity));
    return aMin - bMin;
  });
  const overdue = properties.filter(p => overallStatus(p) === "red");

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: mob ? 10 : 16, marginBottom: mob ? 20 : 28 }}>
        {[{ l: "Properties", v: properties.length, i: "home", c: C.accent, filter: null }, { l: "Compliant", v: g, i: "check", c: C.green, filter: null }, { l: "Expiring", v: a, i: "clock", c: C.amber, filter: "amber" }, { l: "Overdue", v: r, i: "alert", c: C.red, filter: "red" }].map((card, idx) => (
          <div key={idx} style={{ background: C.card, borderRadius: mob ? 12 : 14, padding: mob ? "16px 14px" : "20px 22px", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: card.c, opacity: 0.06 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: mob ? 8 : 12 }}><Icon name={card.i} size={mob ? 14 : 16} color={card.c} /><span style={{ fontFamily: font, fontSize: mob ? 9 : 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.l}</span></div>
            <div style={{ fontFamily: font, fontSize: mob ? 26 : 32, fontWeight: 700, color: C.white, lineHeight: 1 }}><AnimNum target={card.v} /></div>
          </div>
        ))}
      </div>
      {awaiting > 0 && <div style={{ background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}><Icon name="checkCircle" size={20} color={C.purple} /><span style={{ fontFamily: font, fontSize: 13, color: C.text }}><strong>{awaiting} submission{awaiting > 1 ? "s" : ""}</strong> awaiting sign-off</span></div>}

      {/* Expiring + Overdue properties — clickable */}
      {(expiringSoon.length > 0 || overdue.length > 0) && (
        <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}`, marginBottom: mob ? 14 : 20 }}>
          <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 16px" }}>Needs Attention</h3>
          {[...overdue, ...expiringSoon].slice(0, 8).map((p, i) => {
            const st = overallStatus(p);
            const eicrSt = calcStatus(p.expiry_date);
            const smokeSt = calcStatus(p.smoke_expiry);
            const patSt = calcStatus(p.pat_expiry);
            const expiring = [
              eicrSt !== "green" ? `EICR exp ${formatDate(p.expiry_date)}` : null,
              smokeSt !== "green" ? `Smoke exp ${formatDate(p.smoke_expiry)}` : null,
              patSt !== "green" ? `PAT exp ${formatDate(p.pat_expiry)}` : null,
            ].filter(Boolean).join(" · ");
            return (
              <button key={p.id} onClick={() => onNavigateProperty && onNavigateProperty(p.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "11px 14px", borderRadius: 10, background: statusBg(st), border: `1px solid ${statusBorder(st)}`, marginBottom: 8, cursor: "pointer", gap: 10, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(st), flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address?.split(",")[0]}</div>
                    <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 1 }}>{p.tenant_name} · {expiring}</div>
                  </div>
                </div>
                <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: statusColor(st), whiteSpace: "nowrap", flexShrink: 0 }}>{st === "red" ? "OVERDUE" : "EXPIRING"} →</span>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: tab ? "1fr" : "1fr 1fr", gap: mob ? 14 : 20, marginBottom: mob ? 14 : 28 }}>
        <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 24px" }}>Compliance Heatmap</h3>
          <div style={{ display: "flex", alignItems: mob ? "center" : "center", flexDirection: mob ? "column" : "row", gap: mob ? 20 : 36 }}>
            <ComplianceDonut green={g} amber={a} red={r} size={mob ? 140 : 180} />
            <div style={{ flex: 1, width: "100%" }}>{[{ l: "Fully compliant", c: g, s: "green" }, { l: "Expiring < 60 days", c: a, s: "amber" }, { l: "Overdue / missing cert", c: r, s: "red" }].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: statusColor(row.s) }} /><span style={{ fontFamily: font, fontSize: 13, color: C.text }}>{row.l}</span></div>
                <span style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: statusColor(row.s) }}>{row.c}</span>
              </div>
            ))}</div>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}><h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: 0 }}>Active Jobs</h3><span style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, background: C.accentGlow, padding: "3px 10px", borderRadius: 20 }}>{activeJobs} open</span></div>
          {jobs.filter(j => j.status !== "Completed").length === 0 && <div style={{ padding: 20, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 12, color: C.textDim }}>No active jobs</span></div>}
          {jobs.filter(j => j.status !== "Completed").slice(0, 5).map(job => { const prop = properties.find(pp => pp.id === job.property_id); return (
            <button key={job.id} onClick={() => onNavigateProperty && prop && onNavigateProperty(prop.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, marginBottom: 8, gap: 10, cursor: "pointer", textAlign: "left" }}>
              <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontFamily: font, fontSize: 12, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prop?.address?.split(",")[0] || "—"}</div><div style={{ fontFamily: font, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{job.type} · {job.scheduled_date ? formatDate(job.scheduled_date) : "Unscheduled"}</div></div>
              <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: jobStatusColor(job.status), background: jobStatusBg(job.status), padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{job.status}</span>
            </button>
          ); })}
        </div>
      </div>
      {/* ── Charts ── */}
      {(() => {
        // Monthly jobs completed — last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(); d.setMonth(d.getMonth() - i);
          months.push({ label: d.toLocaleString("en-GB", { month: "short" }), year: d.getFullYear(), month: d.getMonth() });
        }
        const monthlyData = months.map(m => ({
          label: m.label,
          count: jobs.filter(j => {
            if (!j.created_at) return false;
            const jd = new Date(j.created_at);
            return jd.getMonth() === m.month && jd.getFullYear() === m.year;
          }).length,
        }));
        const maxCount = Math.max(...monthlyData.map(m => m.count), 1);

        // Per cert-type compliance
        const certTypes = [
          { label: "EICR", green: properties.filter(p => calcStatus(p.expiry_date) === "green").length, amber: properties.filter(p => calcStatus(p.expiry_date) === "amber").length, red: properties.filter(p => calcStatus(p.expiry_date) === "red").length },
          { label: "Smoke", green: properties.filter(p => calcStatus(p.smoke_expiry) === "green").length, amber: properties.filter(p => calcStatus(p.smoke_expiry) === "amber").length, red: properties.filter(p => calcStatus(p.smoke_expiry) === "red").length },
          { label: "PAT", green: properties.filter(p => calcStatus(p.pat_expiry) === "green").length, amber: properties.filter(p => calcStatus(p.pat_expiry) === "amber").length, red: properties.filter(p => calcStatus(p.pat_expiry) === "red").length },
        ];

        return (
          <div style={{ display: "grid", gridTemplateColumns: tab ? "1fr" : "1fr 1fr", gap: mob ? 14 : 20, marginBottom: mob ? 14 : 20 }}>
            {/* Monthly jobs bar chart */}
            <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 20px" }}>Jobs — Last 6 Months</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
                {monthlyData.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                      <div style={{ width: "100%", height: `${Math.max((m.count / maxCount) * 100, m.count > 0 ? 6 : 0)}%`, background: `linear-gradient(180deg, ${C.accent}, ${C.accent}99)`, borderRadius: "4px 4px 0 0", position: "relative", minHeight: m.count > 0 ? 6 : 0 }}>
                        {m.count > 0 && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontFamily: fontMono, fontSize: 10, color: C.accent, fontWeight: 600, whiteSpace: "nowrap" }}>{m.count}</div>}
                      </div>
                    </div>
                    <span style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Per cert-type compliance stacked bars */}
            <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 20px" }}>Compliance by Cert Type</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {certTypes.map((ct, i) => {
                  const total = ct.green + ct.amber + ct.red || 1;
                  const gPct = (ct.green / total) * 100;
                  const aPct = (ct.amber / total) * 100;
                  const rPct = (ct.red / total) * 100;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontFamily: font, fontSize: 12, color: C.text, fontWeight: 500 }}>{ct.label}</span>
                        <span style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{ct.green}/{total} compliant</span>
                      </div>
                      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", gap: 1 }}>
                        {gPct > 0 && <div style={{ flex: gPct, background: C.green }} />}
                        {aPct > 0 && <div style={{ flex: aPct, background: C.amber }} />}
                        {rPct > 0 && <div style={{ flex: rPct, background: C.red }} />}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                  {[{ l: "OK", c: C.green }, { l: "Expiring", c: C.amber }, { l: "Overdue", c: C.red }].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: item.c }} />
                      <span style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>{item.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 20px" }}>Recent Activity</h3>
        {audit.length === 0 && <div style={{ padding: 20, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 12, color: C.textDim }}>No activity yet</span></div>}
        {audit.slice(0, 8).map((log, i) => (
          <div key={log.id || i} style={{ display: "flex", alignItems: "flex-start", gap: mob ? 10 : 14, padding: "12px 0", borderBottom: i < 7 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: log.user_role === "Auto" ? C.accent : log.user_role === "engineer" ? C.green : log.user_role === "junior" ? C.purple : C.amber }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: font, fontSize: 12, color: C.text }}>{log.action}</div><div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{log.user_name} · {log.created_at ? new Date(log.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROPERTIES PAGE
// ─────────────────────────────────────────────
function AddPropertyModal({ open, onClose }) {
  const { addProperty, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const [addr, setAddr] = useState(""); const [tenant, setTenant] = useState(""); const [phone, setPhone] = useState(""); const [lastEicr, setLastEicr] = useState("");
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!addr.trim() || !tenant.trim()) { setError("Address and tenant required"); return; }
    setSaving(true);
    const expiry = calcExpiry(lastEicr);
    const { data, error: err } = await addProperty({ address: addr.trim(), tenant: tenant.trim(), phone: phone.trim(), lastEicr: lastEicr || null, expiryDate: expiry });
    if (err) { setError(err.message); setSaving(false); return; }
    await addAudit({ action: `Property ${data?.ref} added — ${addr.split(",")[0]}` });
    setAddr(""); setTenant(""); setPhone(""); setLastEicr(""); setError(""); setSaving(false);
    onClose("added");
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Property">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Property Address" value={addr} onChange={setAddr} placeholder="e.g. 15 Station Road, Leeds LS1 2AB" />
        <Input label="Tenant Name" value={tenant} onChange={setTenant} placeholder="e.g. John Smith" />
        <Input label="Tenant Phone" value={phone} onChange={setPhone} placeholder="e.g. 07700 900000" />
        <Input label="Last EICR Date" type="date" value={lastEicr} onChange={setLastEicr} />
        {lastEicr && <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>Expiry: {formatDate(calcExpiry(lastEicr))} — Status: <span style={{ color: statusColor(calcStatus(calcExpiry(lastEicr))), fontWeight: 600 }}>{calcStatus(calcExpiry(lastEicr)).toUpperCase()}</span></div>}
        {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Add Property"}</button>
        </div>
      </div>
    </Modal>
  );
}

function PropertiesPage({ onRequestJob, onSelectProperty }) {
  const { properties, loading, organisations } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [filter, setFilter] = useState("all"); const [search, setSearch] = useState("");
  const [sort, setSort] = useState("ref");
  const [showAdd, setShowAdd] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [toast, setToast] = useState(null);
  const [agencyFilter, setAgencyFilter] = useState("all");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const role = auth.role;

  const activeAgencies = organisations.filter(o => o.is_active !== false);
  const statusOrder = { red: 0, amber: 1, green: 2 };

  const filtered = properties.filter(p => {
    const st = overallStatus(p);
    if (filter !== "all" && st !== filter) return false;
    if (role === "admin" && agencyFilter !== "all" && p.agency_id !== agencyFilter) return false;
    if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !(p.tenant_name || "").toLowerCase().includes(search.toLowerCase()) && !(p.ref || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "status") return statusOrder[overallStatus(a)] - statusOrder[overallStatus(b)];
    if (sort === "expiry") {
      const da = a.expiry_date ? new Date(a.expiry_date) : new Date("9999-01-01");
      const db = b.expiry_date ? new Date(b.expiry_date) : new Date("9999-01-01");
      return da - db;
    }
    if (sort === "tenant") return (a.tenant_name || "").localeCompare(b.tenant_name || "");
    return 0; // default: database order (ref)
  });

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>Loading properties…</span></div>;

  return (
    <div>
      <Toast message={toast} show={!!toast} />
      <AddPropertyModal open={showAdd} onClose={(r) => { setShowAdd(false); if (r === "added") showToast("Property added"); }} />
      <CSVImportModal open={showCSV} onClose={(r) => { setShowCSV(false); if (r === "imported") showToast("Import complete"); }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          {[{ id: "all", label: "All" }, { id: "green", label: "OK" }, { id: "amber", label: "Soon" }, { id: "red", label: "Overdue" }].map(f => (<button key={f.id} onClick={() => setFilter(f.id)} style={{ fontFamily: font, fontSize: 11, fontWeight: filter === f.id ? 600 : 400, color: filter === f.id ? C.white : C.textMuted, background: filter === f.id ? (f.id === "all" ? C.accent : statusColor(f.id)) : C.card, border: `1px solid ${filter === f.id ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>{f.label}</button>))}
          {role === "admin" && activeAgencies.length > 0 && (
            <select value={agencyFilter} onChange={e => setAgencyFilter(e.target.value)} style={{ fontFamily: font, fontSize: 11, color: agencyFilter !== "all" ? C.purple : C.textMuted, background: agencyFilter !== "all" ? `${C.purple}18` : C.card, border: `1px solid ${agencyFilter !== "all" ? C.purple : C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36, outline: "none" }}>
              <option value="all">All Agencies</option>
              {activeAgencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[{ id: "ref", label: "Default" }, { id: "status", label: "Status" }, { id: "expiry", label: "Expiry" }, { id: "tenant", label: "A–Z" }].map(s => (<button key={s.id} onClick={() => setSort(s.id)} style={{ fontFamily: font, fontSize: 11, fontWeight: sort === s.id ? 600 : 400, color: sort === s.id ? C.accent : C.textMuted, background: "transparent", border: `1px solid ${sort === s.id ? C.accent : "transparent"}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", minHeight: 36 }}>{s.label}</button>))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: mob ? "1 1 100%" : "0 1 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.border}`, flex: 1, minWidth: mob ? 0 : 220 }}><Icon name="search" size={14} color={C.textDim} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ fontFamily: font, fontSize: 12, color: C.text, background: "transparent", border: "none", outline: "none", width: "100%", minHeight: 28 }} /></div>
          {["admin", "agent"].includes(role) && <button onClick={() => setShowCSV(true)} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: font, fontSize: 12, fontWeight: 600, color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36, whiteSpace: "nowrap" }}><Icon name="csv" size={14} color={C.textMuted} />{!mob && "CSV"}</button>}
          {["admin", "agent"].includes(role) && <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, whiteSpace: "nowrap" }}><Icon name="plus" size={14} color={C.white} />Add</button>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(p => {
          const st = overallStatus(p);
          return (
            <div key={p.id} onClick={() => onSelectProperty && onSelectProperty(p.id)} style={{ background: C.card, borderRadius: 12, padding: "16px", border: `1px solid ${C.border}`, cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: statusColor(st), flexShrink: 0, boxShadow: `0 0 8px ${statusColor(st)}40` }} />
                    <span style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 500 }}>{p.address.split(",")[0]}</span>
                  </div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4, marginLeft: 18 }}>{p.address.split(",").slice(1).join(",").trim()}</div>
                </div>
                <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: statusColor(st), background: statusBg(st), border: `1px solid ${statusBorder(st)}`, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{st.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted }}>{p.tenant_name}</div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>Exp: {formatDate(p.expiry_date)} · {p.ref}</div>
                  {role === "admin" && (() => { const agency = organisations.find(o => o.id === p.agency_id); return agency ? <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.purple, background: `${C.purple}18`, border: `1px solid ${C.purple}30`, borderRadius: 6, padding: "2px 8px", display: "inline-block", marginTop: 4 }}>{agency.name}</span> : null; })()}
                </div>
                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                  {["agent", "admin"].includes(role) && (
                    <button onClick={() => onRequestJob(p)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>+ Job</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>{properties.length === 0 ? "No properties yet — add your first one" : "No properties match"}</span></div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// JOBS PAGE
// ─────────────────────────────────────────────
function JobsPage({ onNavigateEicr }) {
  const { jobs, properties, engineers, updateJob, addJob, addAudit, organisations } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const role = auth.role;
  const [sf, setSf] = useState("all");
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [assignModal, setAssignModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const activeAgencies = organisations.filter(o => o.is_active !== false);

  const filtered = jobs.filter(j => {
    if (sf === "all" && j.status === "Cancelled") return false;
    if (sf !== "all" && j.status !== sf) return false;
    if (["engineer", "junior"].includes(role) && j.engineer_id !== auth.id) return false;
    if (role === "admin" && agencyFilter !== "all" && j.organisation_id !== agencyFilter) return false;
    if (search) {
      const prop = properties.find(p => p.id === j.property_id);
      const q = search.toLowerCase();
      if (!(prop?.address || "").toLowerCase().includes(q) && !(j.ref || "").toLowerCase().includes(q) && !(j.type || "").toLowerCase().includes(q) && !(prop?.tenant_name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const advanceStatus = async (job) => {
    let ns = null;
    if (job.status === "Scheduled") ns = "In Progress";
    else if (job.status === "In Progress") ns = "Completed";
    if (!ns) return;
    await updateJob(job.id, { status: ns });
    await addAudit({ action: `Job ${job.ref} status → ${ns}` });
    showToast(`${job.ref} → ${ns}`);
  };

  return (
    <div>
      <Toast message={toast} show={!!toast} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["all", "Pending", "Scheduled", "In Progress", "Awaiting Sign-Off", "Completed", "Cancelled"].map(s => (
            <button key={s} onClick={() => setSf(s)} style={{ fontFamily: font, fontSize: 11, fontWeight: sf === s ? 600 : 400, color: sf === s ? C.white : C.textMuted, background: sf === s ? (s === "Cancelled" ? C.textDim : C.accent) : C.card, border: `1px solid ${sf === s ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36 }}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
        {!["engineer", "junior"].includes(role) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.border}`, flex: mob ? "1 1 100%" : "0 1 220px" }}>
            <Icon name="search" size={14} color={C.textDim} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" style={{ fontFamily: font, fontSize: 12, color: C.text, background: "transparent", border: "none", outline: "none", width: "100%", minHeight: 28 }} />
          </div>
        )}
        {role === "admin" && activeAgencies.length > 0 && (
          <select value={agencyFilter} onChange={e => setAgencyFilter(e.target.value)} style={{ fontFamily: font, fontSize: 11, color: agencyFilter !== "all" ? C.purple : C.textMuted, background: agencyFilter !== "all" ? `${C.purple}18` : C.card, border: `1px solid ${agencyFilter !== "all" ? C.purple : C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36, outline: "none" }}>
            <option value="all">All Agencies</option>
            {activeAgencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>
      {filtered.map(job => {
        const prop = properties.find(pp => pp.id === job.property_id);
        const eng = engineers.find(e => e.id === job.engineer_id);
        return (
          <div key={job.id} style={{ background: C.card, borderRadius: 14, padding: mob ? "16px" : "20px 24px", border: `1px solid ${C.border}`, display: "flex", flexDirection: mob ? "column" : "row", alignItems: mob ? "stretch" : "center", justifyContent: "space-between", marginBottom: 10, gap: mob ? 14 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: job.type === "EICR" ? C.accentGlow : job.type === "Remedial" ? C.redBg : job.type === "Smoke Alarm" ? C.amberBg : C.greenBg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={job.type === "EICR" ? "shield" : job.type === "Remedial" ? "alert" : job.type === "Smoke Alarm" ? "activity" : "check"} size={20} color={job.type === "EICR" ? C.accent : job.type === "Remedial" ? C.red : job.type === "Smoke Alarm" ? C.amber : C.green} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>{job.type} — {prop?.address?.split(",")[0] || "—"}{job.type === "EICR" && <span style={{ fontFamily: font, fontSize: 9, fontWeight: 700, color: C.accent, background: C.accentGlow, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase", flexShrink: 0 }}>Form Required</span>}</div>
                <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 3 }}>{job.notes || "No notes"}</div>
                <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span>{eng?.full_name || "Unassigned"}</span>
                  <span>{job.scheduled_date ? formatDate(job.scheduled_date) : "Not scheduled"}</span>
                  <span>{job.ref}</span>
                  {role === "admin" && (() => { const agency = organisations.find(o => o.id === job.organisation_id); return agency ? <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.purple, background: `${C.purple}18`, border: `1px solid ${C.purple}30`, borderRadius: 6, padding: "2px 8px" }}>{agency.name}</span> : null; })()}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: mob ? "flex-end" : "flex-end" }}>
              {role === "admin" && job.status === "Pending" && <button onClick={() => setEditModal(job)} style={{ fontFamily: font, fontSize: 11, color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Edit</button>}
              {role === "admin" && job.status === "Pending" && <button onClick={() => setAssignModal(job)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Assign</button>}
              {role === "admin" && ["Scheduled", "In Progress"].includes(job.status) && <button onClick={() => setAssignModal(job)} style={{ fontFamily: font, fontSize: 11, color: C.amber, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Reschedule</button>}
              {["engineer", "junior"].includes(role) && job.status === "Scheduled" && <button onClick={() => advanceStatus(job)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Start</button>}
              {["engineer", "junior"].includes(role) && job.status === "In Progress" && job.type !== "EICR" && <button onClick={() => advanceStatus(job)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.green, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Complete</button>}
              {["engineer", "junior"].includes(role) && job.status === "In Progress" && job.type === "EICR" && <button onClick={() => onNavigateEicr && onNavigateEicr()} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Open EICR Form</button>}
              <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: jobStatusColor(job.status), background: jobStatusBg(job.status), padding: "5px 14px", borderRadius: 20 }}>{job.status}</span>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>No jobs match</span></div>}
      <EditJobModal open={!!editModal} job={editModal} onClose={(r) => { setEditModal(null); if (r) showToast("Job updated"); }} />
      <AssignModal open={!!assignModal} job={assignModal} onClose={(r) => { setAssignModal(null); if (r) showToast(r); }} />
    </div>
  );
}

// ─── Edit Job Modal (admin, Pending jobs only) ───
function EditJobModal({ open, job, onClose }) {
  const { properties, updateJob, addAudit } = useContext(DataContext);
  const [type, setType] = useState("EICR");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) { setType(job.type || "EICR"); setNotes(job.notes || ""); }
  }, [job]);

  const submit = async () => {
    setSaving(true);
    await updateJob(job.id, { type, notes: notes.trim() });
    await addAudit({ action: `Job ${job.ref} updated — type: ${type}` });
    setSaving(false);
    onClose("updated");
  };

  const prop = job ? properties.find(p => p.id === job.property_id) : null;
  return (
    <Modal open={open} onClose={() => onClose(null)} title="Edit Job">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {prop && <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{prop.address.split(",")[0]}</div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{job.ref} · Pending</div>
        </div>}
        <Select label="Service Type" value={type} onChange={setType} options={[{ value: "EICR", label: "EICR" }, { value: "Remedial", label: "Remedial" }, { value: "Smoke Alarm", label: "Smoke Alarm" }, { value: "PAT", label: "PAT" }]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Key at branch…" style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 70, resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => onClose(null)} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}

function AssignModal({ open, job, onClose }) {
  const { engineers, properties, updateJob, addAudit } = useContext(DataContext);
  const isReassign = job && (job.status === "Scheduled" || job.status === "In Progress");
  const [engId, setEngId] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (job) {
      setEngId(job.engineer_id || "");
      setDate(job.scheduled_date || "");
    }
  }, [job]);

  const submit = async () => {
    if (!date || !engId) return;
    await updateJob(job.id, { engineerId: engId, date, status: "Scheduled" });
    const eng = engineers.find(e => e.id === engId);
    await addAudit({ action: `Job ${job.ref} ${isReassign ? "rescheduled" : "assigned"} → ${eng?.full_name} on ${formatDate(date)}` });
    setEngId(""); setDate("");
    onClose(job.ref);
  };

  const prop = job ? properties.find(p => p.id === job.property_id) : null;
  return (
    <Modal open={open} onClose={() => onClose(null)} title={isReassign ? "Reschedule / Reassign" : "Assign Engineer"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {prop && <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{job.type} — {prop.address.split(",")[0]}</div>
          {isReassign && <div style={{ fontFamily: font, fontSize: 11, color: C.amber, marginTop: 4 }}>Currently: {engineers.find(e => e.id === job.engineer_id)?.full_name || "Unassigned"} · {job.scheduled_date ? formatDate(job.scheduled_date) : "No date"}</div>}
        </div>}
        <Select label="Engineer" value={engId} onChange={setEngId} options={[{ value: "", label: "— Select —" }, ...engineers.filter(e => ["engineer", "junior"].includes(e.role)).map(e => ({ value: e.id, label: `${e.full_name} (${e.role === "junior" ? "Junior" : "Senior"})` }))]} />
        <Input label="Scheduled Date" type="date" value={date} onChange={setDate} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => onClose(null)} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
          <button onClick={submit} disabled={!date || !engId} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: (date && engId) ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: (date && engId) ? "pointer" : "not-allowed", minHeight: 44 }}>{isReassign ? "Update" : "Assign"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Request Job Modal ───
function RequestJobModal({ open, onClose, property }) {
  const { addJob, addAudit } = useContext(DataContext);
  const [type, setType] = useState("EICR"); const [notes, setNotes] = useState(""); const [submitted, setSubmitted] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const submit = async () => {
    if (!property) return;
    setSaving(true); setError("");
    const { data, error: err } = await addJob({ propertyId: property.id, type, notes: notes.trim() || "Requested" });
    if (err || !data) {
      setError(err?.message || "Failed to create job. Please try again.");
      setSaving(false); return;
    }
    await addAudit({ action: `New job ${data?.ref} (${type}) for ${property.address.split(",")[0]}` });
    setSaving(false); setSubmitted(true);
  };
  const reset = () => { setType("EICR"); setNotes(""); setSubmitted(false); setError(""); };
  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Request a Job">
      {submitted ? (
        <div style={{ textAlign: "center", padding: 20 }}><Icon name="checkCircle" size={40} color={C.green} /><p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.green, marginTop: 12 }}>Job requested</p><button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", marginTop: 16, minHeight: 44 }}>Done</button></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}><div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{property?.address?.split(",")[0]}</div><div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{property?.tenant_name} · {property?.ref}</div></div>
          <Select label="Service Type" value={type} onChange={setType} options={[{ value: "EICR", label: "EICR" }, { value: "Remedial", label: "Remedial" }, { value: "Smoke Alarm", label: "Smoke Alarm" }, { value: "PAT", label: "PAT" }]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Key at branch…" style={{ fontFamily: font, fontSize: 14, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 70, resize: "vertical" }} /></div>
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "10px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button><button onClick={submit} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Request"}</button></div>
        </div>
      )}
    </Modal>
  );
}

// ─── Upload Certificate Modal ───
function UploadCertModal({ open, onClose }) {
  const { jobs, properties, addDoc, updateProperty, updateJob, addJob, addAudit, uploadFile, fetchAll } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const [jobId, setJobId] = useState("");
  const [certType, setCertType] = useState("EICR");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const completedJobs = jobs.filter(j => j.status === "Completed" && !j.has_cert);
  const selectedJob = completedJobs.find(j => j.id === jobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  const submit = async () => {
    if (!jobId || !file || !expiryDate) { setError("Please select a job, expiry date, and file"); return; }
    setSaving(true); setError("");
    try {
      const filePath = `${auth.orgId}/${jobId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await uploadFile(file, filePath);
      if (uploadErr) { setError("File upload failed: " + uploadErr.message); setSaving(false); return; }

      const { data: docData } = await addDoc({
        jobId, propertyId: selectedJob.property_id, type: certType,
        filePath, fileName: file.name, expiry: expiryDate,
      });

      // Auto-update property compliance dates based on cert type
      if (selectedProp) {
        if (certType === "EICR") {
          const inspectionDate = new Date(expiryDate);
          inspectionDate.setFullYear(inspectionDate.getFullYear() - 5);
          const lastEicrDate = inspectionDate.toISOString().split("T")[0];
          await updateProperty(selectedProp.id, { lastEicr: lastEicrDate, expiryDate });
        } else if (certType === "Smoke Alarm") {
          await updateProperty(selectedProp.id, { smoke_expiry: expiryDate, last_smoke: new Date().toISOString().split("T")[0] });
        } else if (certType === "PAT") {
          await updateProperty(selectedProp.id, { pat_expiry: expiryDate, last_pat: new Date().toISOString().split("T")[0] });
        }
      }

      // Mark job as having cert (via updateJob so local state stays in sync)
      await updateJob(jobId, { hasCert: true });

      // Auto-create remedial if job notes mention unsatisfactory
      if (selectedJob?.eicr_data?.outcome === "Unsatisfactory") {
        await addJob({ propertyId: selectedJob.property_id, type: "Remedial", status: "Pending", notes: `Auto-created from unsatisfactory EICR — ${selectedJob.ref}` });
        await addAudit({ action: `Remedial job auto-created from unsatisfactory EICR (${selectedJob.ref})`, userName: "System", userRole: "Auto" });
      }

      await addAudit({ action: `Certificate uploaded: ${certType} for ${selectedProp?.address?.split(",")[0]} (expires ${formatDate(expiryDate)})` });
      await fetchAll();
      setJobId(""); setCertType("EICR"); setExpiryDate(""); setFile(null);
      onClose("uploaded");
    } catch (e) {
      setError("Unexpected error: " + e.message);
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={() => onClose(null)} title="Upload Certificate">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Select label="Completed Job" value={jobId} onChange={setJobId}
          options={[{ value: "", label: "— Select completed job —" }, ...completedJobs.map(j => {
            const p = properties.find(pp => pp.id === j.property_id);
            return { value: j.id, label: `${j.ref} · ${j.type} — ${p?.address?.split(",")[0] || "Unknown"}` };
          })]} />
        {selectedProp && <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: font, fontSize: 12, color: C.text, fontWeight: 500 }}>{selectedProp.address}</div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{selectedJob?.type} · {selectedJob?.ref}</div>
        </div>}
        <Select label="Certificate Type" value={certType} onChange={setCertType}
          options={[{ value: "EICR", label: "EICR" }, { value: "PAT", label: "PAT" }, { value: "Smoke Alarm", label: "Smoke Alarm" }, { value: "Remedial", label: "Remedial Sign-Off" }]} />
        <Input label="Expiry / Valid Until" type="date" value={expiryDate} onChange={setExpiryDate} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Certificate PDF</label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, background: C.surfaceAlt, border: `2px dashed ${file ? C.accent : C.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "border .2s" }}>
            <Icon name="upload" size={20} color={file ? C.accent : C.textDim} />
            <div>
              <div style={{ fontFamily: font, fontSize: 13, color: file ? C.white : C.textMuted }}>{file ? file.name : "Click to choose PDF"}</div>
              {file && <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB</div>}
            </div>
            <input type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0] || null)} />
          </label>
        </div>
        {["EICR", "Smoke Alarm", "PAT"].includes(certType) && <div style={{ fontFamily: font, fontSize: 11, color: C.accent, background: C.accentGlow, padding: "8px 12px", borderRadius: 8 }}>
          ⚡ Uploading this certificate will automatically update this property's {certType === "EICR" ? "EICR" : certType === "Smoke Alarm" ? "smoke alarm" : "PAT"} compliance status.
        </div>}
        {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => onClose(null)} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
          <button onClick={submit} disabled={saving || !jobId || !file || !expiryDate}
            style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: (jobId && file && expiryDate) ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: (jobId && file && expiryDate) ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Uploading…" : "Upload Certificate"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── CSV Bulk Import Modal ───
function CSVImportModal({ open, onClose }) {
  const { addProperty, addAudit, properties, fetchAll } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { setError("CSV must have a header row and at least one data row"); return; }
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    const addrIdx = headers.findIndex(h => h.includes("address"));
    const tenantIdx = headers.findIndex(h => h.includes("tenant") || h.includes("name"));
    const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("tel") || h.includes("mobile"));
    const eicrIdx = headers.findIndex(h => (h.includes("eicr") || h.includes("last")) && !h.includes("smoke") && !h.includes("pat"));
    const smokeIdx = headers.findIndex(h => h.includes("smoke"));
    const patIdx = headers.findIndex(h => h.includes("pat"));
    if (addrIdx === -1) { setError("No 'address' column found. Check your CSV header row."); return; }
    const parsed = lines.slice(1).map((line, i) => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const addr = cols[addrIdx] || "";
      const tenant = tenantIdx >= 0 ? cols[tenantIdx] || "" : "";
      const phone = phoneIdx >= 0 ? cols[phoneIdx] || "" : "";
      const lastEicr = eicrIdx >= 0 ? cols[eicrIdx] || "" : "";
      const smokeExpiry = smokeIdx >= 0 ? cols[smokeIdx] || "" : "";
      const patExpiry = patIdx >= 0 ? cols[patIdx] || "" : "";
      const isDup = properties.some(p => p.address.toLowerCase() === addr.toLowerCase());
      return { addr, tenant, phone, lastEicr, smokeExpiry, patExpiry, isDup, row: i + 2 };
    }).filter(r => r.addr);
    setRows(parsed); setPreview(true); setError("");
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file);
  };

  const importAll = async () => {
    const toImport = rows.filter(r => !r.isDup);
    if (!toImport.length) return;
    setSaving(true);
    for (const r of toImport) {
      const expiry = calcExpiry(r.lastEicr);
      await addProperty({ address: r.addr, tenant: r.tenant, phone: r.phone, lastEicr: r.lastEicr || null, expiryDate: expiry, smokeExpiry: r.smokeExpiry || null, patExpiry: r.patExpiry || null });
    }
    await addAudit({ action: `CSV import: ${toImport.length} properties added` });
    await fetchAll();
    setSaving(false); setDone(true);
  };

  const reset = () => { setRows([]); setPreview(false); setError(""); setDone(false); setSaving(false); };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="CSV Bulk Import" width={600}>
      {done ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Icon name="checkCircle" size={40} color={C.green} />
          <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.green, marginTop: 12 }}>Import complete</p>
          <p style={{ fontFamily: font, fontSize: 13, color: C.textMuted, marginTop: 6 }}>{rows.filter(r => !r.isDup).length} properties added</p>
          <button onClick={() => { reset(); onClose("imported"); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", marginTop: 16, minHeight: 44 }}>Done</button>
        </div>
      ) : preview ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 600 }}>{rows.length} rows found</div>
              <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{rows.filter(r => r.isDup).length} duplicates skipped · {rows.filter(r => !r.isDup).length} will be imported</div>
            </div>
            <button onClick={reset} style={{ fontFamily: font, fontSize: 11, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", minHeight: 36 }}>Re-upload</button>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", background: r.isDup ? C.redBg : "transparent" }}>
                <span style={{ fontFamily: font, fontSize: 11, color: r.isDup ? C.red : C.green, fontWeight: 600, whiteSpace: "nowrap" }}>{r.isDup ? "DUP" : "NEW"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: font, fontSize: 12, color: r.isDup ? C.textDim : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.addr}</div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{r.tenant}{r.lastEicr ? ` · EICR: ${r.lastEicr}` : ""}{r.smokeExpiry ? ` · Smoke: ${r.smokeExpiry}` : ""}{r.patExpiry ? ` · PAT: ${r.patExpiry}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 12 }}>
            Expected columns: <span style={{ color: C.accent }}>address, tenant name, phone, last eicr date, smoke expiry, pat expiry</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={importAll} disabled={saving || !rows.filter(r => !r.isDup).length}
              style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: rows.filter(r => !r.isDup).length ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Importing…" : `Import ${rows.filter(r => !r.isDup).length} Properties`}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontFamily: font, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
            Upload a CSV file with your properties. The file needs an <strong style={{ color: C.accent }}>address</strong> column, and optionally: tenant name, phone, last eicr date, smoke expiry, pat expiry.
          </div>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: C.surfaceAlt, border: `2px dashed ${C.border}`, borderRadius: 14, padding: "32px 20px", cursor: "pointer", textAlign: "center" }}>
            <Icon name="csv" size={32} color={C.textDim} />
            <div>
              <div style={{ fontFamily: font, fontSize: 14, color: C.textMuted }}>Click to choose your CSV file</div>
              <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4 }}>Accepts .csv files</div>
            </div>
            <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </label>
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, padding: "10px 14px", borderRadius: 8 }}>{error}</div>}
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, background: C.surfaceAlt, borderRadius: 8, padding: "10px 14px" }}>
            <strong style={{ color: C.textMuted }}>Example header row:</strong><br />
            <span style={{ fontFamily: fontMono, color: C.accent }}>address,tenant name,phone,last eicr date</span>
          </div>
        </div>
      )}
    </Modal>
  );
}


function DocumentsPage() {
  const { documents, properties, jobs } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const pendingCerts = jobs.filter(j => j.status === "Completed" && !j.has_cert).length;

  const getDownloadUrl = async (filePath) => {
    if (!filePath) return null;
    const { data } = await supabase.storage.from("certificates").createSignedUrl(filePath, 60);
    return data?.signedUrl;
  };

  const handleDownload = async (doc) => {
    if (!doc.file_path) { showToast("No file stored for this certificate"); return; }
    const url = await getDownloadUrl(doc.file_path);
    if (url) window.open(url, "_blank");
    else showToast("Could not retrieve file");
  };

  const filtered = documents.filter(d => {
    const pr = properties.find(pp => pp.id === d.property_id);
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (pr?.address || "").toLowerCase().includes(q) || (pr?.tenant_name || "").toLowerCase().includes(q) || (d.type || "").toLowerCase().includes(q);
    }
    return true;
  });

  const certTypes = [...new Set(documents.map(d => d.type))].filter(Boolean);

  return (
    <div>
      <Toast message={toast} show={!!toast} />
      <UploadCertModal open={showUpload} onClose={(r) => { setShowUpload(false); if (r === "uploaded") showToast("Certificate uploaded"); }} />
      {pendingCerts > 0 && ["admin", "agent", "engineer", "supervisor"].includes(auth.role) && (
        <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="alert" size={18} color={C.amber} />
            <span style={{ fontFamily: font, fontSize: 13, color: C.text }}><strong>{pendingCerts} completed job{pendingCerts > 1 ? "s" : ""}</strong> awaiting certificate upload</span>
          </div>
          <button onClick={() => setShowUpload(true)} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.amber, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", minHeight: 36 }}>Upload Now</button>
        </div>
      )}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 28, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: 0 }}>Certificate Vault</h3>
          {["admin", "agent", "engineer", "supervisor"].includes(auth.role) && (
            <button onClick={() => setShowUpload(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>
              <Icon name="upload" size={14} color={C.white} /> Upload Certificate
            </button>
          )}
        </div>
        {/* Search + type filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surfaceAlt, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.border}`, flex: 1, minWidth: 180 }}>
            <Icon name="search" size={14} color={C.textDim} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by property or tenant…" style={{ fontFamily: font, fontSize: 12, color: C.text, background: "transparent", border: "none", outline: "none", width: "100%", minHeight: 28 }} />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ fontFamily: font, fontSize: 12, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", minHeight: 36 }}>
            <option value="all">All types</option>
            {certTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Icon name="file" size={40} color={C.textDim} />
            <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, marginTop: 12 }}>{documents.length === 0 ? "No certificates yet" : "No certificates match"}</div>
          </div>
        ) : filtered.map(d => {
          const pr = properties.find(pp => pp.id === d.property_id);
          const st = calcStatus(d.expiry_date);
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: statusBg(st), display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="fileCheck" size={20} color={statusColor(st)} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{d.type}</div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{pr?.address?.split(",")[0]} · {formatDate(d.uploaded_at)}</div>
                  {d.file_name && <div style={{ fontFamily: fontMono, fontSize: 10, color: C.textDim, marginTop: 2 }}>{d.file_name}</div>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontFamily: font, fontSize: 10, fontWeight: 500, color: statusColor(st), background: statusBg(st), border: `1px solid ${statusBorder(st)}`, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{mob ? st.toUpperCase() : `Exp ${formatDate(d.expiry_date)}`}</span>
                {d.file_path && (
                  <button onClick={() => handleDownload(d)} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, minHeight: 32 }}>
                    <Icon name="download" size={14} color={C.textMuted} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Audit Page ───
function AuditPage() {
  const { audit } = useContext(DataContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const allRoles = [...new Set(audit.map(l => l.user_role))];
  const filtered = audit.filter(l => {
    if (roleFilter !== "all" && l.user_role !== roleFilter) return false;
    if (search && !(l.action || "").toLowerCase().includes(search.toLowerCase()) && !(l.user_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const displayed = showAll ? filtered : filtered.slice(0, 30);

  return (
    <div>
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 28, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div><h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: 0 }}>Audit Trail</h3><span style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{filtered.length} entries</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 3, background: C.surfaceAlt, borderRadius: 8, padding: 3, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
              {["all", ...allRoles].map(r => (<button key={r} onClick={() => setRoleFilter(r)} style={{ fontFamily: font, fontSize: 10, fontWeight: roleFilter === r ? 600 : 400, color: roleFilter === r ? C.white : C.textMuted, background: roleFilter === r ? C.accent : "transparent", border: "none", borderRadius: 5, padding: "5px 10px", cursor: "pointer", minHeight: 28 }}>{r === "all" ? "All" : r}</button>))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surfaceAlt, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.border}`, minWidth: mob ? 0 : 240 }}>
              <Icon name="search" size={13} color={C.textDim} />
              <input value={search} onChange={e => { setSearch(e.target.value); setShowAll(false); }} placeholder="Search actions, names…" style={{ fontFamily: font, fontSize: 12, color: C.text, background: "transparent", border: "none", outline: "none", width: "100%", minHeight: 24 }} />
            </div>
          </div>
        </div>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>No audit entries</span></div>}
        {displayed.map((l, i) => (
          <div key={l.id || i} style={{ display: "flex", gap: mob ? 10 : 16, padding: "14px 0", borderBottom: i < displayed.length - 1 ? `1px solid ${C.border}` : "none" }}>
            {!mob && <div style={{ minWidth: 120 }}><div style={{ fontFamily: fontMono, fontSize: 11, color: C.textDim }}>{l.created_at ? new Date(l.created_at).toLocaleDateString("en-GB") : ""}</div><div style={{ fontFamily: fontMono, fontSize: 11, color: C.textDim }}>{l.created_at ? new Date(l.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}</div></div>}
            <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: l.user_role === "Auto" ? C.accent : l.user_role === "engineer" ? C.green : l.user_role === "junior" ? C.purple : l.user_role === "admin" ? C.white : C.amber }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: font, fontSize: 13, color: C.text }}>{l.action}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                {mob && <span style={{ fontFamily: fontMono, fontSize: 10, color: C.textDim }}>{l.created_at ? new Date(l.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>}
                <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, background: C.surfaceAlt, padding: "2px 8px", borderRadius: 4 }}>{l.user_name}</span>
                <span style={{ fontFamily: font, fontSize: 10, color: C.accent, background: C.accentGlow, padding: "2px 8px", borderRadius: 4 }}>{l.user_role}</span>
              </div>
            </div>
          </div>
        ))}
        {!showAll && filtered.length > 30 && (
          <button onClick={() => setShowAll(true)} style={{ display: "block", width: "100%", fontFamily: font, fontSize: 13, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 10, padding: "12px 20px", cursor: "pointer", marginTop: 12, minHeight: 44 }}>
            Load all {filtered.length} entries
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EICR FORM PAGE (BS 7671)
// ─────────────────────────────────────────────
function EICRPage() {
  const { jobs, properties, updateJob, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;

  // Jobs assigned to this engineer that are In Progress
  const myJobs = jobs.filter(j =>
    (j.engineer_id === auth.id || ["supervisor", "admin"].includes(auth.role)) &&
    ["Scheduled", "In Progress"].includes(j.status)
  );

  const [selectedJobId, setSelectedJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // EICR form fields
  const [form, setForm] = useState({
    clientName: "", clientAddress: "", description: "", purpose: "Periodic",
    startDate: "", endDate: "", inspector: auth.fullName || "",
    supplyVoltage: "230", frequency: "50", earthFaultLoop: "", prospectiveFaultCurrent: "",
    typeOfEarthingSystem: "TN-S", maxDemand: "", numberOfCircuits: "",
    dbLocation: "", dbType: "", dbMake: "",
    mainSwitchRating: "", mainSwitchType: "",
    rcdType: "", rcdRating: "", rcdTripTime: "",
    estimatedAge: "", alterations: "", lastInspectionDate: "",
    extent: "This report covers the condition of the fixed electrical installation described above.",
    limitations: "",
    observations: "", recommendations: "",
    company: "Ohmnium Electrical",
    outcome: "Satisfactory", // Satisfactory | Unsatisfactory | Requires Further Investigation
    limitation1: "", limitation2: "",
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const blankCircuit = () => ({ ref: "", description: "", deviceType: "", rating: "", rcd: "N", zs: "", result: "Pass" });
  const [circuits, setCircuits] = useState([blankCircuit()]);
  const addCircuit = () => setCircuits(prev => [...prev, blankCircuit()]);
  const removeCircuit = (i) => setCircuits(prev => prev.filter((_, idx) => idx !== i));
  const setCircuit = (i, field, val) => setCircuits(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const selectedJob = myJobs.find(j => j.id === selectedJobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  // Pre-fill address from selected property, and reload any saved draft
  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    const job = myJobs.find(j => j.id === id);
    const prop = job ? properties.find(p => p.id === job.property_id) : null;
    // If a rejected or draft EICR exists, restore the full form
    if (job?.eicr_data && (job.eicr_data.isDraft || job.eicr_data.rejectionReason)) {
      const { isDraft, submittedAt, submittedBy, rejectionReason, rejectedBy, rejectedAt, circuits: savedCircuits, ...savedFields } = job.eicr_data;
      setForm(prev => ({ ...prev, ...savedFields }));
      if (savedCircuits && savedCircuits.length > 0) setCircuits(savedCircuits);
      else setCircuits([blankCircuit()]);
    } else {
      if (prop) setForm(prev => ({ ...prev, clientAddress: prop.address, clientName: prop.tenant_name || "" }));
      setCircuits([blankCircuit()]);
    }
  };

  const submit = async (asDraft = false) => {
    if (!selectedJobId) { showToast("Please select a job first", "error"); return; }
    setSaving(true);
    const eicrData = { ...form, circuits, submittedAt: new Date().toISOString(), submittedBy: auth.id, isDraft: asDraft };
    const newStatus = asDraft ? "In Progress" : (auth.role === "junior" ? "Awaiting Sign-Off" : "Completed");
    await updateJob(selectedJobId, { status: newStatus, eicrData });
    await addAudit({ action: `EICR ${asDraft ? "draft saved" : auth.role === "junior" ? "submitted for sign-off" : "completed"} — ${selectedProp?.address?.split(",")[0]} — Outcome: ${form.outcome}` });
    showToast(asDraft ? "Draft saved" : auth.role === "junior" ? "Submitted for Supervisor sign-off" : "EICR completed");
    setSaving(false);
    if (!asDraft) setSelectedJobId("");
  };

  const inputBase = { fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, width: "100%", boxSizing: "border-box" };

  const Field = ({ label, value, onChange, type = "text", placeholder = "", hint = "" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
      {hint && <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );

  const DropField = ({ label, value, onChange, options, hint = "" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputBase, appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
        {options.map(o => <option key={o} value={o}>{o || "— Select —"}</option>)}
      </select>
      {hint && <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );

  const FreeField = ({ label, value, onChange, placeholder = "", rows = 3, hint = "" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1 / -1" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
        <span style={{ fontFamily: fontMono, fontSize: 9, fontWeight: 700, color: C.amber, background: `${C.amber}20`, border: `1px solid ${C.amber}40`, borderRadius: 4, padding: "1px 6px" }}>FREE TEXT</span>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ ...inputBase, minHeight: rows * 26, resize: "vertical" }} />
      {hint && <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</h4>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Select Job</h4>
        {myJobs.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "12px 0" }}>No active jobs assigned to you. Jobs must be Scheduled or In Progress.</div>
        ) : (
          <Select label="Job" value={selectedJobId} onChange={handleJobSelect}
            options={[{ value: "", label: "— Select a job —" }, ...myJobs.map(j => {
              const p = properties.find(pp => pp.id === j.property_id);
              const rejected = j.eicr_data?.rejectionReason ? " ⚠ Rejected" : "";
              return { value: j.id, label: `${j.ref} · ${j.type} — ${p?.address?.split(",")[0] || "Unknown"}${rejected}` };
            })]} />
        )}
        {/* Rejection reason banner */}
        {selectedJob?.eicr_data?.rejectionReason && (
          <div style={{ marginTop: 14, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Returned by supervisor</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white }}>{selectedJob.eicr_data.rejectionReason}</div>
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4 }}>Rejected by {selectedJob.eicr_data.rejectedBy} · {selectedJob.eicr_data.rejectedAt ? new Date(selectedJob.eicr_data.rejectedAt).toLocaleDateString("en-GB") : ""}</div>
          </div>
        )}
        {/* No phone warning */}
        {selectedJob && !properties.find(p => p.id === selectedJob.property_id)?.tenant_phone && (
          <div style={{ marginTop: 10, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontFamily: font, fontSize: 11, color: C.amber }}>⚠ No tenant phone number on this property — SMS notifications cannot be sent when this job is assigned.</div>
          </div>
        )}
      </div>

      <Section title="Section A — Details of the Client and Installation">
        <Field label="Client / Occupier Name" value={form.clientName} onChange={v => set("clientName", v)} hint="The name of the tenant or property owner who occupies the installation." />
        <DropField label="Purpose of Report" value={form.purpose} onChange={v => set("purpose", v)} hint="Select the reason this EICR is being carried out."
          options={["", "Periodic", "On Completion of New Installation", "Change of Occupancy", "Further Investigation", "Routine Check", "Other"]} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Address of Installation" value={form.clientAddress} onChange={v => set("clientAddress", v)} placeholder="Full installation address" hint="Pre-filled from the property record. Edit if the inspection address differs." />
        </div>
        <DropField label="Description of Premises" value={form.description} onChange={v => set("description", v)} hint="Select the type of property. Choose 'Other' if none match."
          options={["", "Residential flat", "Residential house — mid-terrace", "Residential house — semi-detached", "Residential house — detached", "HMO", "Commercial premises", "Industrial premises", "Mixed use", "Other"]} />
        <Field label="Estimated Age of Installation" value={form.estimatedAge} onChange={v => set("estimatedAge", v)} placeholder="e.g. 15 years" hint="Approximate age of the fixed wiring in years. Check the consumer unit date stamp or ask the occupier." />
        <DropField label="Evidence of Additions or Alterations" value={form.alterations} onChange={v => set("alterations", v)} hint="Has the installation been modified since it was first installed? Check for mismatched cables or non-standard circuits."
          options={["", "Yes", "No", "Unknown"]} />
        <Field label="Date of Last Inspection" value={form.lastInspectionDate} onChange={v => set("lastInspectionDate", v)} type="date" hint="The date on any existing EICR certificate, or the sticker on the consumer unit." />
      </Section>

      <Section title="Section B — Extent and Limitations">
        <FreeField label="Extent of Inspection" value={form.extent} onChange={v => set("extent", v)} rows={3} hint="Describe what was inspected. The default text covers the full installation — edit if partial only." />
        <FreeField label="Limitations" value={form.limitations || ""} onChange={v => set("limitations", v)} placeholder="Record any limitations to the inspection…" rows={3} hint="Record anything that prevented a full inspection. Leave blank if none." />
      </Section>

      <Section title="Section C — Supply Characteristics">
        <DropField label="Nominal Voltage (V)" value={form.supplyVoltage} onChange={v => set("supplyVoltage", v)} hint="Standard UK single-phase supply is 230V. Three-phase is 400V."
          options={["230", "400", "110", "Other"]} />
        <DropField label="Frequency (Hz)" value={form.frequency} onChange={v => set("frequency", v)} hint="UK standard is 50Hz."
          options={["50", "60"]} />
        <DropField label="Type of Earthing System" value={form.typeOfEarthingSystem} onChange={v => set("typeOfEarthingSystem", v)} hint="TN-C-S (PME) is most common in UK domestic. TT is common in rural properties. Check the meter tails."
          options={["", "TN-S", "TN-C-S (PME)", "TT", "IT", "Unknown"]} />
        <Field label="Earth Fault Loop Impedance Ze (Ω)" value={form.earthFaultLoop} onChange={v => set("earthFaultLoop", v)} placeholder="e.g. 0.35" hint="Measure at the origin (main terminals). Typical TN-C-S: 0.20–0.35Ω. TT: 21–200Ω." />
        <Field label="Prospective Short-Circuit Current (kA)" value={form.prospectiveFaultCurrent} onChange={v => set("prospectiveFaultCurrent", v)} placeholder="e.g. 0.8" hint="Measured or calculated at the origin. Most domestic: 0.5–3kA." />
        <Field label="Max Demand (A)" value={form.maxDemand} onChange={v => set("maxDemand", v)} placeholder="e.g. 60" hint="Estimated maximum current demand. Typical domestic: 40–100A." />
      </Section>

      <Section title="Section D — Distribution Board">
        <DropField label="Consumer Unit / DB Make" value={form.dbMake} onChange={v => set("dbMake", v)} hint="Check the brand marked on the consumer unit door."
          options={["", "Hager", "Schneider / Merlin Gerin", "Wylex", "MK Electric", "ABB", "Legrand", "Eaton / MEM", "Crabtree", "BG Electrical", "Contactum", "Unknown", "Other"]} />
        <Field label="Location" value={form.dbLocation} onChange={v => set("dbLocation", v)} placeholder="e.g. Under stair cupboard" hint="Where the consumer unit is physically located in the property." />
        <DropField label="Consumer Unit Type" value={form.dbType} onChange={v => set("dbType", v)} hint="Select the type that best describes the consumer unit configuration."
          options={["", "Split load — dual RCD", "High integrity — dual RCD + RCBOs", "RCBO throughout", "Single RCD", "Rewireable fuse board", "Cartridge fuse board", "Other"]} />
        <Field label="Number of Circuits" value={form.numberOfCircuits} onChange={v => set("numberOfCircuits", v)} placeholder="e.g. 12" hint="Count each way in the consumer unit including spare ways." />
        <Field label="Main Switch Rating (A)" value={form.mainSwitchRating} onChange={v => set("mainSwitchRating", v)} placeholder="e.g. 100" hint="The ampere rating on the main switch. Typical: 60A, 80A, or 100A." />
        <DropField label="Main Switch Type" value={form.mainSwitchType} onChange={v => set("mainSwitchType", v)} hint=""
          options={["", "DP isolator", "DP MCB", "DP RCD", "SP isolator", "Other"]} />
        <DropField label="RCD Type" value={form.rcdType} onChange={v => set("rcdType", v)} hint=""
          options={["", "Type AC", "Type A", "Type B", "Type F", "RCBO (Type AC)", "RCBO (Type A)", "No RCD fitted", "Other"]} />
        <DropField label="RCD Rating (mA)" value={form.rcdRating} onChange={v => set("rcdRating", v)} hint=""
          options={["", "10", "30", "100", "300", "500"]} />
        <Field label="RCD Trip Time (ms)" value={form.rcdTripTime} onChange={v => set("rcdTripTime", v)} placeholder="e.g. 28" hint="Measured trip time. Must be ≤300ms for 30mA RCDs (BS 7671 requires ≤40ms at I∆n)." />

        {/* Circuit Schedule */}
        <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white }}>Circuit Schedule</div>
              <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginTop: 2 }}>Record each circuit in the consumer unit. Add a row per way.</div>
            </div>
            <button onClick={addCircuit} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 8, padding: "7px 12px", cursor: "pointer", minHeight: 34, whiteSpace: "nowrap" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Circuit
            </button>
          </div>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: C.surfaceAlt }}>
                  {["Circuit Ref", "Description", "Device Type", "Rating (A)", "RCD", "Zs (Ω)", "Result", ""].map((h, i) => (
                    <th key={i} style={{ fontFamily: font, fontSize: 9, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, padding: "9px 10px", textAlign: "left", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {circuits.map((c, i) => (
                  <tr key={i} style={{ borderBottom: i < circuits.length - 1 ? `1px solid ${C.border}` : "none", background: i % 2 === 0 ? "transparent" : `${C.surface}60` }}>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={c.ref} onChange={e => setCircuit(i, "ref", e.target.value)} placeholder={`C${i + 1}`} style={{ fontFamily: fontMono, fontSize: 12, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", outline: "none", width: 48 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={c.description} onChange={e => setCircuit(i, "description", e.target.value)} placeholder="e.g. Upstairs sockets" style={{ fontFamily: font, fontSize: 12, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", outline: "none", width: "100%", minWidth: 120 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <select value={c.deviceType} onChange={e => setCircuit(i, "deviceType", e.target.value)} style={{ fontFamily: font, fontSize: 11, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", outline: "none", minWidth: 80 }}>
                        {["", "MCB", "RCBO", "RCD", "Fuse"].map(o => <option key={o} value={o}>{o || "—"}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={c.rating} onChange={e => setCircuit(i, "rating", e.target.value)} placeholder="e.g. 32" style={{ fontFamily: fontMono, fontSize: 12, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", outline: "none", width: 52 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <select value={c.rcd} onChange={e => setCircuit(i, "rcd", e.target.value)} style={{ fontFamily: font, fontSize: 11, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", outline: "none" }}>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={c.zs} onChange={e => setCircuit(i, "zs", e.target.value)} placeholder="e.g. 0.48" style={{ fontFamily: fontMono, fontSize: 12, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", outline: "none", width: 64 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <select value={c.result} onChange={e => setCircuit(i, "result", e.target.value)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: c.result === "Pass" ? C.green : c.result === "Fail" ? C.red : C.amber, background: c.result === "Pass" ? C.greenBg : c.result === "Fail" ? C.redBg : C.amberBg, border: `1px solid ${c.result === "Pass" ? C.green : c.result === "Fail" ? C.red : C.amber}30`, borderRadius: 6, padding: "5px 8px", outline: "none" }}>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="N/T">N/T</option>
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      {circuits.length > 1 && (
                        <button onClick={() => removeCircuit(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, padding: 4, display: "flex", alignItems: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginTop: 6 }}>N/T = Not Tested. Zs = measured earth fault loop impedance at the furthest point of the circuit.</div>
        </div>
      </Section>

      <Section title="Section E — Inspection Dates">
        <Field label="Inspector Name" value={form.inspector} onChange={v => set("inspector", v)} hint="Pre-filled from your profile." />
        <Field label="Employer / Company" value={form.company} onChange={v => set("company", v)} placeholder="Ohmnium Electrical" hint="Pre-filled as Ohmnium Electrical." />
        <Field label="Inspection Start Date" value={form.startDate} onChange={v => set("startDate", v)} type="date" hint="Usually the same day for domestic properties." />
        <Field label="Inspection End Date" value={form.endDate} onChange={v => set("endDate", v)} type="date" hint="Usually the same day for domestic properties." />
      </Section>

      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Section F — Observations &amp; Outcome</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Observations / Defects (use C1/C2/C3/FI codes)</label>
              <button onClick={() => set("showObsLibrary", !form.showObsLibrary)}
                style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.3)`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", minHeight: 28 }}>
                📋 Quick-pick
              </button>
            </div>

            {/* ── Quick-pick observation library ── */}
            {form.showObsLibrary && (() => {
              const library = [
                { code: "C1", text: "C1 — No main protective bonding to gas installation pipework. Danger present — immediate action required." },
                { code: "C1", text: "C1 — Live parts exposed / accessible at consumer unit. Danger present." },
                { code: "C2", text: "C2 — No RCD protection to socket outlets in bathroom zones. Install 30mA RCD protection." },
                { code: "C2", text: "C2 — No RCD protection to socket outlets in general areas (post-2008 requirements). Upgrade required." },
                { code: "C2", text: "C2 — Earthing conductor absent or inadequate at consumer unit. Earth continuity cannot be confirmed." },
                { code: "C2", text: "C2 — Consumer unit is of combustible (plastic) construction. Replace with non-combustible metal enclosure (BS EN 61439-3)." },
                { code: "C2", text: "C2 — Supplementary bonding absent in bathroom. Install 4mm² bonding to all simultaneously accessible metalwork." },
                { code: "C2", text: "C2 — Single-pole switching/protection in neutral conductor detected. Replace with double-pole devices." },
                { code: "C3", text: "C3 — No surge protection device (SPD) installed. Recommend installation as per BS 7671 Regulation 443." },
                { code: "C3", text: "C3 — No AFDD (arc fault detection device) installed. Recommend installation for enhanced fire protection." },
                { code: "C3", text: "C3 — Wiring installation is ageing (pre-1970s rubber/fabric insulation). Recommend periodic monitoring and phased rewire." },
                { code: "C3", text: "C3 — Socket outlets lack shuttered contacts. Recommend upgrading to modern shuttered sockets." },
                { code: "FI", text: "FI — Unable to confirm earth continuity to ring final circuit — further investigation required." },
                { code: "FI", text: "FI — RCD trip time exceeds 300ms. Further testing required to identify cause." },
                { code: "FI", text: "FI — Insulation resistance low on circuit — further investigation required before energising." },
              ];
              const codeColors = { C1: C.red, C2: C.amber, C3: C.accent, FI: C.purple };
              const addObs = (text) => {
                const current = form.observations.trim();
                set("observations", current ? current + "\n" + text : text);
              };
              return (
                <div style={{ background: C.surfaceAlt, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginBottom: 8 }}>Tap an observation to add it. C1 = danger, C2 = potentially dangerous, C3 = improvement recommended, FI = further investigation.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                    {library.map((obs, i) => (
                      <button key={i} onClick={() => addObs(obs.text)}
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left", minHeight: 44 }}>
                        <span style={{ fontFamily: fontMono, fontSize: 10, fontWeight: 700, color: codeColors[obs.code] || C.textMuted, background: `${codeColors[obs.code]}20`, padding: "2px 7px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{obs.code}</span>
                        <span style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.5 }}>{obs.text.replace(/^(C1|C2|C3|FI) — /, "")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Smart text suggestions ── */}
            {(() => {
              const lastWord = form.observations.split(/\s+/).pop()?.toLowerCase() || "";
              const suggestions = [
                { trigger: "c1", hint: "C1 — " }, { trigger: "c2", hint: "C2 — " }, { trigger: "c3", hint: "C3 — " }, { trigger: "fi", hint: "FI — " },
                { trigger: "rcd", hint: "RCD protection absent on circuit" }, { trigger: "bond", hint: "bonding conductor absent / inadequate" },
                { trigger: "earth", hint: "earthing inadequate — continuity not confirmed" }, { trigger: "socket", hint: "socket outlets lack shuttered contacts" },
                { trigger: "consum", hint: "consumer unit is combustible plastic construction" }, { trigger: "insul", hint: "insulation resistance low — further investigation required" },
                { trigger: "no", hint: "no RCD protection installed to" }, { trigger: "miss", hint: "missing protective conductor on" },
                { trigger: "bath", hint: "bathroom supplementary bonding absent" }, { trigger: "overh", hint: "overheating evident at connection — further investigation required" },
              ].filter(s => lastWord.length >= 2 && s.trigger.startsWith(lastWord) && s.trigger !== lastWord);

              if (!suggestions.length || !form.observations) return null;
              return (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                  {suggestions.slice(0, 4).map((s, i) => (
                    <button key={i} onClick={() => {
                      const words = form.observations.split(/(\s+)/);
                      words[words.length - 1] = s.hint;
                      set("observations", words.join(""));
                    }} style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", minHeight: 28 }}>
                      {s.hint}
                    </button>
                  ))}
                </div>
              );
            })()}

            <textarea value={form.observations} onChange={e => set("observations", e.target.value)} placeholder="e.g. C2 — No RCD protection to socket outlets in bathrooms…"
              style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 120, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Recommendations</label>
            </div>
            <textarea value={form.recommendations} onChange={e => set("recommendations", e.target.value)} placeholder="e.g. Install RCD protection, replace consumer unit…"
              style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 80, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
          </div>

          {/* ── AI Remedial Scope Generator ── */}
          {form.observations.trim().length > 20 && (
            <div style={{ background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="zap" size={16} color={C.purple} />
                  <span style={{ fontFamily: font, fontSize: 12, color: C.text, fontWeight: 500 }}>Generate remedial scope from observations</span>
                </div>
                <button onClick={async () => {
                  set("aiLoading", true);
                  try {
                    const resp = await fetch("https://api.anthropic.com/v1/messages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        model: "claude-sonnet-4-20250514",
                        max_tokens: 1000,
                        messages: [{
                          role: "user",
                          content: `You are a qualified electrical engineer writing remedial work scopes based on EICR observations. Given these observations from an EICR inspection, write a clear, professional remedial works scope suitable for quoting and scheduling. Use plain trade language. List each item numbered. Do not include preamble or sign-off text.\n\nObservations:\n${form.observations}`
                        }]
                      })
                    });
                    const data = await resp.json();
                    const text = data.content?.find(b => b.type === "text")?.text || "";
                    set("recommendations", text.trim());
                  } catch (e) {
                    set("recommendations", "Could not generate scope — check your connection.");
                  }
                  set("aiLoading", false);
                }} disabled={form.aiLoading}
                  style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: form.aiLoading ? C.textDim : C.purple, border: "none", borderRadius: 8, padding: "8px 16px", cursor: form.aiLoading ? "not-allowed" : "pointer", minHeight: 36, opacity: form.aiLoading ? 0.7 : 1 }}>
                  {form.aiLoading ? "Generating…" : "✦ Draft Remedial Scope"}
                </button>
              </div>
              {form.aiLoading && <div style={{ fontFamily: font, fontSize: 11, color: C.purple, marginTop: 8 }}>Reading observations and drafting scope…</div>}
            </div>
          )}

          <div>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Overall Outcome</label>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {["Satisfactory", "Unsatisfactory", "Requires Further Investigation"].map(o => (
                <button key={o} onClick={() => set("outcome", o)}
                  style={{ fontFamily: font, fontSize: 12, fontWeight: form.outcome === o ? 600 : 400, color: form.outcome === o ? C.white : C.textMuted,
                    background: form.outcome === o ? (o === "Satisfactory" ? C.green : o === "Unsatisfactory" ? C.red : C.amber) : C.surfaceAlt,
                    border: `1px solid ${form.outcome === o ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          {form.outcome === "Unsatisfactory" && (
            <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert" size={16} color={C.red} />
              <span style={{ fontFamily: font, fontSize: 12, color: C.red }}>An <strong>Unsatisfactory</strong> outcome will automatically trigger a Remedial job when the certificate is uploaded.</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
        {auth.role === "junior" && (
          <div style={{ flex: 1, fontFamily: font, fontSize: 11, color: C.purple, background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "8px 12px" }}>
            ℹ️ As a Junior Engineer, your completed EICRs are sent to a Supervisor for sign-off before being finalised.
          </div>
        )}
        <button onClick={() => submit(true)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          Save Draft
        </button>
        <button onClick={() => submit(false)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: selectedJobId ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 24px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : auth.role === "junior" ? "Submit for Sign-Off" : "Complete EICR"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAT TESTING PAGE
// ─────────────────────────────────────────────
function PATPage() {
  const { jobs, properties, updateJob, addAudit, fetchAll } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const mob = useMobile();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const myJobs = jobs.filter(j =>
    ["Scheduled", "In Progress"].includes(j.status) &&
    ["PAT"].includes(j.type) &&
    (auth.role === "engineer" || auth.role === "junior" ? j.engineer_id === auth.id : true)
  );
  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  const blankAppliance = () => ({
    id: Date.now() + Math.random(),
    description: "", makeModel: "", assetNumber: "", location: "",
    cableCondition: "", plugCondition: "", fuseRatingCorrect: "", physicalDamage: "",
    earthContinuity: "", earthContinuityOhm: "", insulationResistance: "", insulationResistanceMOhm: "", polarityCheck: "",
    result: "", notes: ""
  });

  const [appliances, setAppliances] = useState([blankAppliance()]);
  const [testedBy, setTestedBy] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [overallResult, setOverallResult] = useState("");

  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    const job = jobs.find(j => j.id === id);
    if (job?.eicr_data?.pat_data) {
      const d = job.eicr_data.pat_data;
      setAppliances(d.appliances || [blankAppliance()]);
      setTestedBy(d.testedBy || auth.fullName || "");
      setTestDate(d.testDate || new Date().toISOString().slice(0, 10));
      setOverallResult(d.overallResult || "");
    } else {
      setAppliances([blankAppliance()]);
      setTestedBy(auth.fullName || "");
      setTestDate(new Date().toISOString().slice(0, 10));
      setOverallResult("");
    }
  };

  const updateAppliance = (id, field, value) => {
    setAppliances(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };
  const addAppliance = () => setAppliances(prev => [...prev, blankAppliance()]);
  const removeAppliance = (id) => setAppliances(prev => prev.filter(a => a.id !== id));

  const submit = async (asDraft = false) => {
    if (!selectedJobId) { showToast("Please select a job first", "error"); return; }
    setSaving(true);
    const pat_data = { appliances, testedBy, testDate, overallResult, isDraft: asDraft, submittedAt: new Date().toISOString() };
    const newStatus = asDraft ? "In Progress" : (auth.role === "junior" ? "Awaiting Sign-Off" : "Completed");
    await updateJob(selectedJobId, { status: newStatus, eicrData: { pat_data } });
    await addAudit({ action: `PAT ${asDraft ? "draft saved" : auth.role === "junior" ? "submitted for sign-off" : "completed"} — ${selectedProp?.address?.split(",")[0]} — ${appliances.length} appliance(s) — ${overallResult}` });
    showToast(asDraft ? "Draft saved" : auth.role === "junior" ? "Submitted for Supervisor sign-off" : "PAT record completed");
    setSaving(false);
    if (!asDraft) setSelectedJobId("");
    await fetchAll();
  };

  const inputBase = { fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", width: "100%", boxSizing: "border-box", minHeight: 38 };
  const selBase = { ...inputBase, appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28 };

  const F = ({ label, value, onChange, placeholder = "" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
    </div>
  );
  const D = ({ label, value, onChange, options }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={selBase}>
        {options.map(o => <option key={o} value={o}>{o || "— Select —"}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Job selector */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Select PAT Job</h4>
        {myJobs.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>No active PAT jobs assigned to you.</div>
        ) : (
          <Select label="Job" value={selectedJobId} onChange={handleJobSelect}
            options={[{ value: "", label: "— Select a job —" }, ...myJobs.map(j => {
              const p = properties.find(pp => pp.id === j.property_id);
              return { value: j.id, label: `${j.ref} · PAT — ${p?.address?.split(",")[0] || "Unknown"}` };
            })]} />
        )}
      </div>

      {/* Appliances */}
      {selectedJobId && (
        <>
          {appliances.map((app, idx) => (
            <div key={app.id} style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Appliance {idx + 1}</h4>
                {appliances.length > 1 && (
                  <button onClick={() => removeAppliance(app.id)} style={{ fontFamily: font, fontSize: 11, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>Remove</button>
                )}
              </div>

              {/* Details */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Appliance Details</div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
                  <F label="Description" value={app.description} onChange={v => updateAppliance(app.id, "description", v)} placeholder="e.g. Kettle, Toaster, Lamp" />
                  <F label="Make / Model" value={app.makeModel} onChange={v => updateAppliance(app.id, "makeModel", v)} placeholder="e.g. Breville VKJ318" />
                  <F label="Asset Number" value={app.assetNumber} onChange={v => updateAppliance(app.id, "assetNumber", v)} placeholder="e.g. PAT-001" />
                  <F label="Location in Property" value={app.location} onChange={v => updateAppliance(app.id, "location", v)} placeholder="e.g. Kitchen" />
                </div>
              </div>

              {/* Visual inspection */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Visual Inspection</div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10 }}>
                  <D label="Cable Condition" value={app.cableCondition} onChange={v => updateAppliance(app.id, "cableCondition", v)} options={["", "Pass", "Fail"]} />
                  <D label="Plug Condition" value={app.plugCondition} onChange={v => updateAppliance(app.id, "plugCondition", v)} options={["", "Pass", "Fail"]} />
                  <D label="Fuse Rating Correct" value={app.fuseRatingCorrect} onChange={v => updateAppliance(app.id, "fuseRatingCorrect", v)} options={["", "Yes", "No"]} />
                  <D label="Physical Damage" value={app.physicalDamage} onChange={v => updateAppliance(app.id, "physicalDamage", v)} options={["", "None", "Present"]} />
                </div>
              </div>

              {/* Electrical tests */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Electrical Tests</div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
                  <D label="Earth Continuity" value={app.earthContinuity} onChange={v => updateAppliance(app.id, "earthContinuity", v)} options={["", "Pass", "Fail"]} />
                  <F label="Measured (Ω)" value={app.earthContinuityOhm} onChange={v => updateAppliance(app.id, "earthContinuityOhm", v)} placeholder="e.g. 0.08" />
                  <D label="Insulation Resistance" value={app.insulationResistance} onChange={v => updateAppliance(app.id, "insulationResistance", v)} options={["", "Pass", "Fail"]} />
                  <F label="Measured (MΩ)" value={app.insulationResistanceMOhm} onChange={v => updateAppliance(app.id, "insulationResistanceMOhm", v)} placeholder="e.g. 2.5" />
                  <D label="Polarity Check" value={app.polarityCheck} onChange={v => updateAppliance(app.id, "polarityCheck", v)} options={["", "Pass", "Fail"]} />
                </div>
              </div>

              {/* Result */}
              <div>
                <div style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Appliance Result</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  {["Pass", "Fail", "Advisory"].map(r => {
                    const col = r === "Pass" ? C.green : r === "Fail" ? C.red : C.amber;
                    return (
                      <button key={r} onClick={() => updateAppliance(app.id, "result", r)}
                        style={{ fontFamily: font, fontSize: 12, fontWeight: app.result === r ? 600 : 400, color: app.result === r ? C.white : C.textMuted, background: app.result === r ? col : C.surfaceAlt, border: `1px solid ${app.result === r ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label>
                  <textarea value={app.notes} onChange={e => updateAppliance(app.id, "notes", e.target.value)} placeholder="Any additional notes for this appliance…" rows={2}
                    style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", resize: "vertical", width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addAppliance} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.3)`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", marginBottom: 16, width: "100%", minHeight: 44 }}>
            + Add Appliance
          </button>

          {/* Overall result + sign-off */}
          <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Overall Result &amp; Sign-Off</h4>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <F label="Tested By" value={testedBy} onChange={setTestedBy} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Test Date</label>
                <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} style={{ ...inputBase }} />
              </div>
            </div>
            <div style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Overall Outcome</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All Pass", "Advisory Items", "Fail — Remedial Required"].map(r => {
                const col = r === "All Pass" ? C.green : r.startsWith("Fail") ? C.red : C.amber;
                return (
                  <button key={r} onClick={() => setOverallResult(r)}
                    style={{ fontFamily: font, fontSize: 12, fontWeight: overallResult === r ? 600 : 400, color: overallResult === r ? C.white : C.textMuted, background: overallResult === r ? col : C.surfaceAlt, border: `1px solid ${overallResult === r ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {auth.role === "junior" && (
              <div style={{ flex: 1, fontFamily: font, fontSize: 11, color: C.purple, background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "8px 12px" }}>
                ℹ️ As a Junior Engineer, your PAT records are sent to a Supervisor for sign-off.
              </div>
            )}
            <button onClick={() => submit(true)} disabled={saving} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Save Draft</button>
            <button onClick={() => submit(false)} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44 }}>
              {saving ? "Saving…" : auth.role === "junior" ? "Submit for Sign-Off" : "Complete PAT Record"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SMOKE ALARM INSPECTION PAGE
// ─────────────────────────────────────────────
function SmokeAlarmPage() {
  const { jobs, properties, updateJob, addAudit, fetchAll } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const mob = useMobile();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const myJobs = jobs.filter(j =>
    ["Scheduled", "In Progress"].includes(j.status) &&
    ["Smoke Alarm"].includes(j.type) &&
    (auth.role === "engineer" || auth.role === "junior" ? j.engineer_id === auth.id : true)
  );
  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  const blankAlarm = () => ({
    id: Date.now() + Math.random(),
    location: "",
    type: "",
    power: "",
    testResult: "",
    batteryCondition: "",
    alarmAge: "",
  });

  const [alarms, setAlarms] = useState([blankAlarm()]);
  const [interlinked, setInterlinked] = useState("");
  const [overallResult, setOverallResult] = useState("");
  const [notes, setNotes] = useState("");
  const [testedBy, setTestedBy] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));

  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    const job = jobs.find(j => j.id === id);
    if (job?.eicr_data?.smoke_data) {
      const d = job.eicr_data.smoke_data;
      setAlarms(d.alarms || [blankAlarm()]);
      setInterlinked(d.interlinked || "");
      setOverallResult(d.overallResult || "");
      setNotes(d.notes || "");
      setTestedBy(d.testedBy || auth.fullName || "");
      setTestDate(d.testDate || new Date().toISOString().slice(0, 10));
    } else {
      setAlarms([blankAlarm()]);
      setInterlinked("");
      setOverallResult("");
      setNotes("");
      setTestedBy(auth.fullName || "");
      setTestDate(new Date().toISOString().slice(0, 10));
    }
  };

  const updateAlarm = (id, field, value) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  const addAlarm = () => setAlarms(prev => [...prev, blankAlarm()]);
  const removeAlarm = (id) => setAlarms(prev => prev.filter(a => a.id !== id));

  const submit = async (asDraft = false) => {
    if (!selectedJobId) { showToast("Please select a job first", "error"); return; }
    setSaving(true);
    const smoke_data = { alarms, interlinked, overallResult, notes, testedBy, testDate, isDraft: asDraft, submittedAt: new Date().toISOString() };
    const newStatus = asDraft ? "In Progress" : (auth.role === "junior" ? "Awaiting Sign-Off" : "Completed");
    await updateJob(selectedJobId, { status: newStatus, eicrData: { smoke_data } });
    await addAudit({ action: `Smoke Alarm inspection ${asDraft ? "draft saved" : auth.role === "junior" ? "submitted for sign-off" : "completed"} — ${selectedProp?.address?.split(",")[0]} — ${alarms.length} alarm(s) — ${overallResult}` });
    showToast(asDraft ? "Draft saved" : auth.role === "junior" ? "Submitted for Supervisor sign-off" : "Smoke Alarm inspection completed");
    setSaving(false);
    if (!asDraft) setSelectedJobId("");
    await fetchAll();
  };

  const inputBase = { fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", width: "100%", boxSizing: "border-box", minHeight: 38 };
  const selBase = { ...inputBase, appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28 };

  const F = ({ label, value, onChange, placeholder = "" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
    </div>
  );
  const D = ({ label, value, onChange, options }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={selBase}>
        {options.map(o => <option key={o} value={o}>{o || "— Select —"}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Job selector */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Select Smoke Alarm Job</h4>
        {myJobs.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>No active Smoke Alarm jobs assigned to you.</div>
        ) : (
          <Select label="Job" value={selectedJobId} onChange={handleJobSelect}
            options={[{ value: "", label: "— Select a job —" }, ...myJobs.map(j => {
              const p = properties.find(pp => pp.id === j.property_id);
              return { value: j.id, label: `${j.ref} · Smoke Alarm — ${p?.address?.split(",")[0] || "Unknown"}` };
            })]} />
        )}
        {selectedProp && (
          <div style={{ marginTop: 12, fontFamily: font, fontSize: 12, color: C.textDim }}>
            {selectedProp.address} {selectedProp.tenant_name ? `· Tenant: ${selectedProp.tenant_name}` : ""}
          </div>
        )}
      </div>

      {selectedJobId && (
        <>
          {/* Regulation info banner */}
          <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontFamily: font, fontSize: 11, color: C.amber, lineHeight: 1.5 }}>
            ⚠ Smoke and Carbon Monoxide Alarm Regulations 2022 — landlords must have working smoke alarms on each storey and a CO alarm in every room with a solid fuel appliance.
          </div>

          {/* Alarm rows */}
          {alarms.map((alarm, idx) => (
            <div key={alarm.id} style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Alarm {idx + 1}</h4>
                {alarms.length > 1 && (
                  <button onClick={() => removeAlarm(alarm.id)} style={{ fontFamily: font, fontSize: 11, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>Remove</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
                <F label="Location" value={alarm.location} onChange={v => updateAlarm(alarm.id, "location", v)} placeholder="e.g. Landing, Kitchen" />
                <D label="Alarm Type" value={alarm.type} onChange={v => updateAlarm(alarm.id, "type", v)}
                  options={["", "Optical", "Ionisation", "Heat", "Combined CO", "CO only"]} />
                <D label="Power Source" value={alarm.power} onChange={v => updateAlarm(alarm.id, "power", v)}
                  options={["", "Mains", "Battery", "Mains + Battery backup"]} />
                <D label="Test Result" value={alarm.testResult} onChange={v => updateAlarm(alarm.id, "testResult", v)}
                  options={["", "Pass", "Fail", "Not tested"]} />
                <D label="Battery Condition" value={alarm.batteryCondition} onChange={v => updateAlarm(alarm.id, "batteryCondition", v)}
                  options={["", "Good", "Replaced", "N/A"]} />
                <F label="Alarm Age (if known)" value={alarm.alarmAge} onChange={v => updateAlarm(alarm.id, "alarmAge", v)} placeholder="e.g. 3 years" />
              </div>
            </div>
          ))}

          <button onClick={addAlarm} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.3)`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", marginBottom: 16, width: "100%", minHeight: 44 }}>
            + Add Alarm
          </button>

          {/* Interconnection + overall */}
          <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Outcome &amp; Sign-Off</h4>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <D label="Alarms Interlinked?" value={interlinked} onChange={setInterlinked} options={["", "Yes", "No"]} />
              <div />
              <F label="Tested By" value={testedBy} onChange={setTestedBy} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Test Date</label>
                <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} style={inputBase} />
              </div>
            </div>

            <div style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Overall Result</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {["All Satisfactory", "Remedial Required"].map(r => {
                const col = r === "All Satisfactory" ? C.green : C.red;
                return (
                  <button key={r} onClick={() => setOverallResult(r)}
                    style={{ fontFamily: font, fontSize: 12, fontWeight: overallResult === r ? 600 : 400, color: overallResult === r ? C.white : C.textMuted, background: overallResult === r ? col : C.surfaceAlt, border: `1px solid ${overallResult === r ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
                    {r}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes or observations…" rows={3}
                style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", resize: "vertical", width: "100%", boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {auth.role === "junior" && (
              <div style={{ flex: 1, fontFamily: font, fontSize: 11, color: C.purple, background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "8px 12px" }}>
                ℹ️ As a Junior Engineer, your smoke alarm inspections are sent to a Supervisor for sign-off.
              </div>
            )}
            <button onClick={() => submit(true)} disabled={saving} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Save Draft</button>
            <button onClick={() => submit(false)} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44 }}>
              {saving ? "Saving…" : auth.role === "junior" ? "Submit for Sign-Off" : "Complete Inspection"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SIGN-OFF QUEUE PAGE
// ─────────────────────────────────────────────
function SignOffPage() {
  const { jobs, properties, engineers, updateJob, addAudit, addJob, fetchAll } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [toast, setToast] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [rejectJob, setRejectJob] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reviewedJobs, setReviewedJobs] = useState({});
  const [queueFilter, setQueueFilter] = useState("all");
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const allQueue = jobs.filter(j => j.status === "Awaiting Sign-Off");
  const queue = queueFilter === "all" ? allQueue : allQueue.filter(j => j.type === queueFilter);

  const eicrCount = allQueue.filter(j => j.type === "EICR").length;
  const patCount = allQueue.filter(j => j.type === "PAT").length;
  const smokeCount = allQueue.filter(j => j.type === "Smoke Alarm").length;

  const getJobLabel = (job) => {
    if (job.type === "PAT") return "PAT";
    if (job.type === "Smoke Alarm") return "Smoke";
    return "EICR";
  };
  const getJobIcon = (job) => {
    if (job.type === "PAT") return "check";
    if (job.type === "Smoke Alarm") return "activity";
    return "clipboard";
  };
  const getJobColor = (job) => {
    if (job.type === "PAT") return C.green;
    if (job.type === "Smoke Alarm") return C.amber;
    return C.purple;
  };
  const getJobBg = (job) => {
    if (job.type === "PAT") return C.greenBg;
    if (job.type === "Smoke Alarm") return C.amberBg;
    return C.purpleBg;
  };

  const approve = async (job) => {
    await updateJob(job.id, { status: "Completed" });
    const prop = properties.find(p => p.id === job.property_id);
    if (job.type === "EICR") {
      await addAudit({ action: `EICR signed off by ${auth.fullName} — ${prop?.address?.split(",")[0]} — Outcome: ${job.eicr_data?.outcome || "—"}` });
      if (job.eicr_data?.outcome === "Unsatisfactory") {
        await addJob({ propertyId: job.property_id, type: "Remedial", status: "Pending", notes: `Auto-created from unsatisfactory EICR — ${job.ref}` });
        await addAudit({ action: `Remedial job auto-created from unsatisfactory EICR (${job.ref})`, userName: "System", userRole: "Auto" });
      }
    } else if (job.type === "PAT") {
      const patData = job.eicr_data?.pat_data || {};
      await addAudit({ action: `PAT record signed off by ${auth.fullName} — ${prop?.address?.split(",")[0]} — Result: ${patData.overallResult || "—"}` });
    } else if (job.type === "Smoke Alarm") {
      const smokeData = job.eicr_data?.smoke_data || {};
      await addAudit({ action: `Smoke Alarm inspection signed off by ${auth.fullName} — ${prop?.address?.split(",")[0]} — Result: ${smokeData.overallResult || "—"}` });
    }
    await fetchAll();
    setSelectedJob(null);
    const extras = job.type === "EICR" && job.eicr_data?.outcome === "Unsatisfactory" ? " · Remedial job created" : "";
    showToast(`${job.type === "EICR" ? "EICR" : job.type === "PAT" ? "PAT record" : "Smoke inspection"} signed off${extras}`);
  };

  const confirmReject = async () => {
    if (!rejectJob) return;
    setRejecting(true);
    const reason = rejectReason.trim() || "No reason given";
    const prop = properties.find(p => p.id === rejectJob.property_id);
    const updatedEicrData = { ...(rejectJob.eicr_data || {}), rejectionReason: reason, rejectedBy: auth.fullName, rejectedAt: new Date().toISOString() };
    await updateJob(rejectJob.id, { status: "In Progress", eicrData: updatedEicrData });
    const typeLabel = rejectJob.type === "PAT" ? "PAT record" : rejectJob.type === "Smoke Alarm" ? "Smoke inspection" : "EICR";
    await addAudit({ action: `${typeLabel} rejected by ${auth.fullName} — ${prop?.address?.split(",")[0]} — Reason: ${reason}` });
    await fetchAll();
    setSelectedJob(null); setRejectJob(null); setRejectReason(""); setRejecting(false);
    showToast("Returned to engineer for correction", "warning");
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Rejection reason modal */}
      <Modal open={!!rejectJob} onClose={() => { setRejectJob(null); setRejectReason(""); }} title={`Reject ${rejectJob?.type === "PAT" ? "PAT Record" : rejectJob?.type === "Smoke Alarm" ? "Smoke Inspection" : "EICR"}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{properties.find(p => p.id === rejectJob?.property_id)?.address?.split(",")[0]}</div>
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 3 }}>This submission will be returned to the engineer with your feedback.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Reason for rejection</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Incomplete data, missing test results, incorrect readings recorded…"
              style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 90, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { setRejectJob(null); setRejectReason(""); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={confirmReject} disabled={rejecting} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.red, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: rejecting ? 0.7 : 1 }}>{rejecting ? "Rejecting…" : "Reject & Return"}</button>
          </div>
        </div>
      </Modal>

      {/* Queue filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All", count: allQueue.length, color: C.purple },
          { id: "EICR", label: "EICR", count: eicrCount, color: C.accent },
          { id: "PAT", label: "PAT", count: patCount, color: C.green },
          { id: "Smoke Alarm", label: "Smoke", count: smokeCount, color: C.amber },
        ].map(f => (
          <button key={f.id} onClick={() => setQueueFilter(f.id)} style={{ fontFamily: font, fontSize: 12, fontWeight: queueFilter === f.id ? 600 : 400, color: queueFilter === f.id ? C.white : C.textMuted, background: queueFilter === f.id ? f.color : C.card, border: `1px solid ${queueFilter === f.id ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, display: "flex", alignItems: "center", gap: 6 }}>
            {f.label}
            {f.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: queueFilter === f.id ? "rgba(255,255,255,0.25)" : f.color, color: C.white, borderRadius: 10, padding: "1px 6px" }}>{f.count}</span>}
          </button>
        ))}
      </div>

      {queue.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 14, padding: 60, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <Icon name="checkCircle" size={40} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 16 }}>Queue is clear</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 6 }}>No submissions awaiting sign-off{queueFilter !== "all" ? ` for ${queueFilter}` : ""}</div>
        </div>
      ) : queue.map(job => {
        const prop = properties.find(p => p.id === job.property_id);
        const eng = engineers.find(e => e.id === job.engineer_id);
        const eicr = job.eicr_data || {};
        const patData = eicr.pat_data || {};
        const smokeData = eicr.smoke_data || {};
        const isOpen = selectedJob?.id === job.id;
        const jobColor = getJobColor(job);
        const jobBg = getJobBg(job);
        return (
          <div key={job.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mob ? "16px" : "20px 24px", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: jobBg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name={getJobIcon(job)} size={20} color={jobColor} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: font, fontSize: 9, fontWeight: 700, color: jobColor, background: jobBg, padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>{getJobLabel(job)}</span>
                    <span style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 500 }}>{prop?.address?.split(",")[0] || "—"}</span>
                  </div>
                  <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                    {eng?.full_name || "—"} · {job.ref}
                    {job.type === "EICR" && eicr.outcome && <span style={{ marginLeft: 10, color: eicr.outcome === "Satisfactory" ? C.green : eicr.outcome === "Unsatisfactory" ? C.red : C.amber, fontWeight: 600 }}>{eicr.outcome}</span>}
                    {job.type === "PAT" && patData.overallResult && <span style={{ marginLeft: 10, color: patData.overallResult === "All Pass" ? C.green : C.red, fontWeight: 600 }}>{patData.overallResult}</span>}
                    {job.type === "Smoke Alarm" && smokeData.overallResult && <span style={{ marginLeft: 10, color: smokeData.overallResult === "All Satisfactory" ? C.green : C.red, fontWeight: 600 }}>{smokeData.overallResult}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <button onClick={() => { setSelectedJob(isOpen ? null : job); if (!isOpen) setReviewedJobs(r => ({ ...r, [job.id]: true })); }} style={{ fontFamily: font, fontSize: 12, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>{isOpen ? "Hide" : "Review"}</button>
                <button onClick={() => setRejectJob(job)} style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Reject</button>
                <button onClick={() => reviewedJobs[job.id] && approve(job)} title={reviewedJobs[job.id] ? "" : "Open Review first"} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: reviewedJobs[job.id] ? C.green : C.textDim, border: "none", borderRadius: 8, padding: "8px 16px", cursor: reviewedJobs[job.id] ? "pointer" : "not-allowed", minHeight: 36, opacity: reviewedJobs[job.id] ? 1 : 0.5 }}>Approve</button>
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: mob ? "0 16px 16px" : "0 24px 24px", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                {/* EICR Review Panel */}
                {job.type === "EICR" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
                      {[
                        ["Client / Occupier", eicr.clientName], ["Address", eicr.clientAddress], ["Purpose", eicr.purpose],
                        ["Earthing System", eicr.typeOfEarthingSystem], ["Supply Voltage", eicr.supplyVoltage ? eicr.supplyVoltage + "V" : ""], ["Earth Fault Loop Ze", eicr.earthFaultLoop ? eicr.earthFaultLoop + " Ω" : ""],
                        ["DB Make", eicr.dbMake], ["DB Location", eicr.dbLocation], ["Number of Circuits", eicr.numberOfCircuits],
                        ["Inspector", eicr.inspector], ["Inspection Date", eicr.startDate ? formatDate(eicr.startDate) : ""], ["Outcome", eicr.outcome],
                      ].map(([label, val], i) => val ? (
                        <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                          <div style={{ fontFamily: font, fontSize: 12, color: label === "Outcome" ? (val === "Satisfactory" ? C.green : val === "Unsatisfactory" ? C.red : C.amber) : C.white, fontWeight: label === "Outcome" ? 600 : 400 }}>{val}</div>
                        </div>
                      ) : null)}
                    </div>
                    {eicr.observations && <div style={{ marginTop: 14, background: C.surfaceAlt, borderRadius: 8, padding: "12px 14px" }}><div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Observations</div><div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{eicr.observations}</div></div>}
                    {eicr.recommendations && <div style={{ marginTop: 10, background: C.surfaceAlt, borderRadius: 8, padding: "12px 14px" }}><div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Recommendations</div><div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{eicr.recommendations}</div></div>}
                  </>
                )}
                {/* PAT Review Panel */}
                {job.type === "PAT" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
                      {[
                        ["Tested By", patData.testedBy], ["Test Date", patData.testDate ? formatDate(patData.testDate) : ""], ["Appliances", patData.appliances?.length ? String(patData.appliances.length) : ""],
                        ["Overall Result", patData.overallResult],
                      ].map(([label, val], i) => val ? (
                        <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                          <div style={{ fontFamily: font, fontSize: 12, color: label === "Overall Result" ? (val === "All Pass" ? C.green : val === "Advisory Items" ? C.amber : C.red) : C.white, fontWeight: label === "Overall Result" ? 600 : 400 }}>{val}</div>
                        </div>
                      ) : null)}
                    </div>
                    {patData.appliances?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Appliances ({patData.appliances.length})</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {patData.appliances.map((a, i) => (
                            <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontFamily: font, fontSize: 12, color: C.white, fontWeight: 500 }}>{a.description || `Appliance ${i + 1}`}</div>
                                <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{[a.makeModel, a.assetNumber, a.location].filter(Boolean).join(" · ")}</div>
                              </div>
                              <span style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: a.result === "Pass" ? C.green : a.result === "Advisory" ? C.amber : C.red, background: a.result === "Pass" ? C.greenBg : a.result === "Advisory" ? C.amberBg : C.redBg, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{a.result || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* Smoke Alarm Review Panel */}
                {job.type === "Smoke Alarm" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
                      {[
                        ["Tested By", smokeData.testedBy], ["Test Date", smokeData.testDate ? formatDate(smokeData.testDate) : ""], ["Alarms Tested", smokeData.alarms?.length ? String(smokeData.alarms.length) : ""],
                        ["Interlinked", smokeData.interlinked], ["Overall Result", smokeData.overallResult],
                      ].map(([label, val], i) => val ? (
                        <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                          <div style={{ fontFamily: font, fontSize: 12, color: label === "Overall Result" ? (val === "All Satisfactory" ? C.green : C.red) : C.white, fontWeight: label === "Overall Result" ? 600 : 400 }}>{val}</div>
                        </div>
                      ) : null)}
                    </div>
                    {smokeData.alarms?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Alarms ({smokeData.alarms.length})</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {smokeData.alarms.map((a, i) => (
                            <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontFamily: font, fontSize: 12, color: C.white, fontWeight: 500 }}>{a.location || `Alarm ${i + 1}`}</div>
                                <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{[a.type, a.powerSource].filter(Boolean).join(" · ")}</div>
                              </div>
                              <span style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: a.testResult === "Pass" ? C.green : a.testResult === "Fail" ? C.red : C.textDim, background: a.testResult === "Pass" ? C.greenBg : a.testResult === "Fail" ? C.redBg : C.surfaceAlt, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{a.testResult || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {smokeData.notes && <div style={{ marginTop: 14, background: C.surfaceAlt, borderRadius: 8, padding: "12px 14px" }}><div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Notes</div><div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{smokeData.notes}</div></div>}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// EDIT PROPERTY MODAL
// ─────────────────────────────────────────────
function EditPropertyModal({ open, onClose, property }) {
  const { updateProperty, deleteProperty, addAudit, jobs } = useContext(DataContext);
  const [addr, setAddr] = useState(""); const [tenant, setTenant] = useState(""); const [phone, setPhone] = useState("");
  const [lastEicr, setLastEicr] = useState(""); const [smokeExpiry, setSmokeExpiry] = useState(""); const [patExpiry, setPatExpiry] = useState("");
  const [saving, setSaving] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false); const [error, setError] = useState("");

  useEffect(() => {
    if (property) {
      setAddr(property.address || ""); setTenant(property.tenant_name || ""); setPhone(property.tenant_phone || "");
      setLastEicr(property.last_eicr || ""); setSmokeExpiry(property.smoke_expiry || ""); setPatExpiry(property.pat_expiry || "");
    }
  }, [property]);

  const submit = async () => {
    if (!addr.trim() || !tenant.trim()) { setError("Address and tenant required"); return; }
    setSaving(true);
    const expiryDate = calcExpiry(lastEicr);
    await updateProperty(property.id, {
      address: addr.trim(), tenant_name: tenant.trim(), tenant_phone: phone.trim(),
      lastEicr: lastEicr || null, expiryDate: expiryDate || null,
      smoke_expiry: smokeExpiry || null, pat_expiry: patExpiry || null,
    });
    await addAudit({ action: `Property ${property.ref} updated — ${addr.split(",")[0]}` });
    setSaving(false); onClose("updated");
  };

  const handleDelete = async () => {
    setSaving(true);
    await deleteProperty(property.id);
    await addAudit({ action: `Property ${property.ref} deleted — ${property.address?.split(",")[0]}` });
    setSaving(false); onClose("deleted");
  };

  const activeJobs = property ? jobs.filter(j => j.property_id === property.id && !["Completed", "Cancelled"].includes(j.status)) : [];

  return (
    <Modal open={open} onClose={onClose} title="Edit Property">
      {confirmDelete ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icon name="alert" size={36} color={C.red} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>Delete this property?</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6, marginBottom: activeJobs.length > 0 ? 12 : 20 }}>This cannot be undone. All jobs and certificates linked to this property will remain in the system but will be detached.</div>
          {activeJobs.length > 0 && (
            <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, textAlign: "left" }}>
              <div style={{ fontFamily: font, fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 4 }}>⚠ {activeJobs.length} active job{activeJobs.length > 1 ? "s" : ""} will be left without a property</div>
              {activeJobs.map(j => <div key={j.id} style={{ fontFamily: font, fontSize: 11, color: C.textMuted }}>{j.ref} · {j.type} · {j.status}</div>)}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => setConfirmDelete(false)} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={handleDelete} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.red, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Deleting…" : "Yes, Delete"}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Property Address" value={addr} onChange={setAddr} placeholder="e.g. 15 Station Road, Leeds LS1 2AB" />
          <Input label="Tenant Name" value={tenant} onChange={setTenant} placeholder="e.g. John Smith" />
          <Input label="Tenant Phone" value={phone} onChange={setPhone} placeholder="e.g. 07700 900000" />
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 2 }}>
            <div style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Compliance Dates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input label="Last EICR Date" type="date" value={lastEicr} onChange={setLastEicr} />
              {lastEicr && <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: -4 }}>Expiry: {formatDate(calcExpiry(lastEicr))} — <span style={{ color: statusColor(calcStatus(calcExpiry(lastEicr))), fontWeight: 600 }}>{calcStatus(calcExpiry(lastEicr)).toUpperCase()}</span></div>}
              <Input label="Smoke & CO Alarm Expiry" type="date" value={smokeExpiry} onChange={setSmokeExpiry} />
              <Input label="PAT Testing Expiry" type="date" value={patExpiry} onChange={setPatExpiry} />
            </div>
          </div>
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={() => setConfirmDelete(true)} style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "10px 16px", cursor: "pointer", minHeight: 44 }}>Delete Property</button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
              <button onClick={submit} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// PROPERTY DETAIL PAGE
// ─────────────────────────────────────────────
function PropertyDetailPage({ propertyId, onBack, onRequestJob }) {
  const { properties, jobs, documents, comments, updateJob, deleteJob, addJob, addAudit, addComment, fetchAll } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [showEdit, setShowEdit] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [activeJobComments, setActiveJobComments] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const property = properties.find(p => p.id === propertyId);
  if (!property) return null;

  const propJobs = jobs.filter(j => j.property_id === propertyId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const propDocs = documents.filter(d => d.property_id === propertyId).sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));

  const eicrStatus = calcStatus(property.expiry_date);
  const smokeStatus = calcStatus(property.smoke_expiry);
  const patStatus = calcStatus(property.pat_expiry);

  const handleCancelJob = async (job) => {
    await updateJob(job.id, { status: "Cancelled" });
    await addAudit({ action: `Job ${job.ref} cancelled — ${property.address?.split(",")[0]}` });
    showToast("Job cancelled");
  };

  const handleDownload = async (doc) => {
    if (!doc.file_path) { showToast("No file stored", "error"); return; }
    const { data } = await supabase.storage.from("certificates").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else showToast("Could not retrieve file", "error");
  };

  const submitComment = async (jobId) => {
    if (!(commentText[jobId] || "").trim()) return;
    await addComment({ jobId, body: commentText[jobId].trim() });
    setCommentText(t => ({ ...t, [jobId]: "" }));
    showToast("Comment added");
  };

  const CompliancePill = ({ label, status, date }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: statusBg(status), border: `1px solid ${statusBorder(status)}`, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(status) }} />
        <span style={{ fontFamily: font, fontSize: 12, color: C.text, fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontFamily: font, fontSize: 11, color: statusColor(status), fontWeight: 600 }}>{date ? `Exp ${formatDate(date)}` : "No record"}</span>
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}
      <EditPropertyModal open={showEdit} onClose={(r) => { setShowEdit(false); if (r === "deleted") onBack(); else if (r === "updated") showToast("Property updated"); }} property={property} />
      <UploadCertModal open={showUpload} onClose={(r) => { setShowUpload(false); if (r === "uploaded") { showToast("Certificate uploaded"); fetchAll(); } }} />

      {/* Back + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: font, fontSize: 13, color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          All Properties
        </button>
        {["admin", "agent"].includes(auth.role) && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowEdit(true)} style={{ fontFamily: font, fontSize: 12, color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Edit</button>
            <button onClick={() => onRequestJob(property)} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>+ Job</button>
          </div>
        )}
      </div>

      {/* Property header */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <div>
            <h2 style={{ fontFamily: font, fontSize: mob ? 16 : 18, fontWeight: 700, color: C.white, margin: "0 0 4px" }}>{property.address?.split(",")[0]}</h2>
            <div style={{ fontFamily: font, fontSize: 12, color: C.textDim }}>{property.address?.split(",").slice(1).join(",").trim()}</div>
          </div>
          <span style={{ fontFamily: fontMono, fontSize: 10, color: C.textMuted, background: C.surfaceAlt, padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0 }}>{property.ref}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Tenant</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white, marginTop: 3 }}>{property.tenant_name || "—"}</div>
          </div>
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Phone</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white, marginTop: 3 }}>{property.tenant_phone || "—"}</div>
          </div>
        </div>
      </div>

      {/* Compliance status for all 3 certificate types */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h3 style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white, margin: "0 0 14px" }}>Compliance Status</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <CompliancePill label="EICR" status={eicrStatus} date={property.expiry_date} />
          <CompliancePill label="Smoke & CO Alarms" status={smokeStatus} date={property.smoke_expiry} />
          <CompliancePill label="PAT Testing" status={patStatus} date={property.pat_expiry} />
        </div>
        {["admin", "agent", "engineer", "supervisor"].includes(auth.role) && (
          <button onClick={() => setShowUpload(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, marginTop: 14 }}>
            <Icon name="upload" size={14} color={C.white} /> Upload Certificate
          </button>
        )}
      </div>

      {/* Jobs */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h3 style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white, margin: "0 0 14px" }}>Job History</h3>
        {propJobs.length === 0 && <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "12px 0" }}>No jobs yet</div>}
        {propJobs.map(job => {
          const jobComments = comments.filter(c => c.job_id === job.id);
          const showComments = activeJobComments === job.id;
          const eicr = job.eicr_data;
          const hasEicrReport = eicr && !eicr.isDraft && job.type === "EICR";
          return (
            <div key={job.id} style={{ borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: job.type === "EICR" ? C.accentGlow : job.type === "Remedial" ? C.redBg : C.greenBg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon name={job.type === "EICR" ? "shield" : job.type === "Remedial" ? "alert" : "check"} size={16} color={job.type === "EICR" ? C.accent : job.type === "Remedial" ? C.red : C.green} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{job.type} <span style={{ color: C.textDim, fontWeight: 400 }}>· {job.ref}</span>
                      {hasEicrReport && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: eicr.outcome === "Satisfactory" ? C.green : eicr.outcome === "Unsatisfactory" ? C.red : C.amber }}>{eicr.outcome}</span>}
                    </div>
                    <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{job.scheduled_date ? formatDate(job.scheduled_date) : "Unscheduled"}{job.notes ? ` · ${job.notes}` : ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {hasEicrReport && (
                    <button onClick={() => setActiveJobComments(showEicr ? null : `eicr-${job.id}`)} style={{ fontFamily: font, fontSize: 11, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", minHeight: 30 }}>
                      {activeJobComments === `eicr-${job.id}` ? "Hide" : "Report"}
                    </button>
                  )}
                  <button onClick={() => setActiveJobComments(showComments ? null : job.id)} style={{ fontFamily: font, fontSize: 11, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", minHeight: 30 }}>
                    💬 {jobComments.length}
                  </button>
                  {["admin"].includes(auth.role) && ["Pending", "Scheduled"].includes(job.status) && (
                    <button onClick={() => handleCancelJob(job)} style={{ fontFamily: font, fontSize: 11, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", minHeight: 30 }}>Cancel</button>
                  )}
                  <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: jobStatusColor(job.status), background: jobStatusBg(job.status), padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{job.status}</span>
                </div>
              </div>
              {/* EICR report panel */}
              {activeJobComments === `eicr-${job.id}` && hasEicrReport && (
                <div style={{ borderTop: `1px solid ${C.border}`, background: C.surfaceAlt, padding: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    {[["Inspector", eicr.inspector], ["Date", eicr.startDate ? formatDate(eicr.startDate) : "—"], ["Outcome", eicr.outcome], ["Earthing", eicr.typeOfEarthingSystem], ["Supply", eicr.supplyVoltage ? eicr.supplyVoltage + "V" : "—"], ["Circuits", eicr.numberOfCircuits]].map(([l, v]) => v ? (
                      <div key={l} style={{ background: C.card, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontFamily: font, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                        <div style={{ fontFamily: font, fontSize: 12, color: l === "Outcome" ? (v === "Satisfactory" ? C.green : v === "Unsatisfactory" ? C.red : C.amber) : C.white, fontWeight: l === "Outcome" ? 700 : 400, marginTop: 2 }}>{v}</div>
                      </div>
                    ) : null)}
                  </div>
                  {eicr.observations && <div style={{ background: C.card, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}><div style={{ fontFamily: font, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Observations</div><div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{eicr.observations}</div></div>}
                  {eicr.recommendations && <div style={{ background: C.card, borderRadius: 8, padding: "10px 12px" }}><div style={{ fontFamily: font, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Recommendations</div><div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{eicr.recommendations}</div></div>}
                </div>
              )}
              {/* Comments panel */}
              {showComments && (
                <div style={{ borderTop: `1px solid ${C.border}`, background: C.surfaceAlt, padding: "12px 14px" }}>
                  {jobComments.length === 0 && <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginBottom: 10 }}>No comments yet</div>}
                  {jobComments.map((c, i) => (
                    <div key={c.id || i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: font, fontSize: 11, color: C.accent, fontWeight: 600 }}>{c.author_name}</span>
                        <span style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>{c.created_at ? new Date(c.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </div>
                      <div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.5 }}>{c.body}</div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input value={commentText[job.id] || ""} onChange={e => setCommentText(t => ({ ...t, [job.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && submitComment(job.id)} placeholder="Add a comment…"
                      style={{ flex: 1, fontFamily: font, fontSize: 12, color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", outline: "none", minHeight: 36 }} />
                    <button onClick={() => submitComment(job.id)} disabled={!(commentText[job.id] || "").trim()} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: (commentText[job.id] || "").trim() ? C.accent : C.textDim, border: "none", borderRadius: 8, padding: "8px 14px", cursor: (commentText[job.id] || "").trim() ? "pointer" : "not-allowed", minHeight: 36 }}>Post</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Certificates */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 24, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white, margin: "0 0 14px" }}>Certificates</h3>
        {propDocs.length === 0 && <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "12px 0" }}>No certificates uploaded yet</div>}
        {propDocs.map(d => {
          const st = calcStatus(d.expiry_date);
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, marginBottom: 8, gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: statusBg(st), display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="fileCheck" size={16} color={statusColor(st)} /></div>
                <div>
                  <div style={{ fontFamily: font, fontSize: 12, color: C.white, fontWeight: 500 }}>{d.type}</div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{formatDate(d.uploaded_at)}{d.file_name ? ` · ${d.file_name}` : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontFamily: font, fontSize: 10, fontWeight: 500, color: statusColor(st), background: statusBg(st), border: `1px solid ${statusBorder(st)}`, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>Exp {formatDate(d.expiry_date)}</span>
                {d.file_path && <button onClick={() => handleDownload(d)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", minHeight: 30 }}><Icon name="download" size={14} color={C.textMuted} /></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CSV Compliance Export ───
function exportComplianceCSV(properties) {
  const headers = ["Ref", "Address", "Tenant", "Phone", "EICR Expiry", "EICR Status", "Smoke Expiry", "Smoke Status", "PAT Expiry", "PAT Status"];
  const rows = properties.map(p => [
    p.ref || "", `"${(p.address || "").replace(/"/g, '""')}"`, `"${(p.tenant_name || "").replace(/"/g, '""')}"`, p.tenant_phone || "",
    p.expiry_date || "", calcStatus(p.expiry_date).toUpperCase(),
    p.smoke_expiry || "", calcStatus(p.smoke_expiry).toUpperCase(),
    p.pat_expiry || "", calcStatus(p.pat_expiry).toUpperCase(),
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `compliance-export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
const TITLES = { dashboard: "Dashboard", properties: "Properties", propertyDetail: "Property", jobs: "Jobs", eicr: "EICR Form", signoff: "Sign-Off Queue", documents: "Documents", audit: "Audit Trail", team: "Team Management", more: "More" };

function PortalApp({ session, userProfile, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [gs, setGs] = useState("");
  const [showRequestJob, setShowRequestJob] = useState(false);
  const [requestJobProp, setRequestJobProp] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const { w } = useWindowSize();
  const isMobile = w < BP.tablet;
  const role = userProfile.role;

  useEffect(() => {
    if (["eicr", "pat", "smoke"].includes(page) && !["engineer", "junior", "supervisor"].includes(role)) setPage("dashboard");
    if (page === "signoff" && !["supervisor", "admin"].includes(role)) setPage("dashboard");
  }, [role]);

  const navigateToProperty = (id) => { setSelectedPropertyId(id); setPage("propertyDetail"); };
  const requestJob = (p) => { setRequestJobProp(p); setShowRequestJob(true); };

  const authCtx = { id: userProfile.id, role: userProfile.role, fullName: userProfile.full_name, orgId: userProfile.organisation_id };

  const render = () => {
    switch (page) {
      case "dashboard": return <DashboardPage onNavigateProperty={navigateToProperty} />;
      case "properties": return <PropertiesPage onRequestJob={requestJob} onSelectProperty={navigateToProperty} />;
      case "propertyDetail": return <PropertyDetailPage propertyId={selectedPropertyId} onBack={() => setPage("properties")} onRequestJob={requestJob} />;
      case "jobs": return <JobsPage onNavigateEicr={() => setPage("eicr")} />;
      case "eicr": return <EICRPage />;
      case "pat": return <PATPage />;
      case "smoke": return <SmokeAlarmPage />;
      case "signoff": return <SignOffPage />;
      case "documents": return <DocumentsPage />;
      case "audit": return <AuditPage />;
      case "team": return <TeamPage />;
      case "more": return <MorePage setActive={setPage} role={role} onLogout={onLogout} />;
      default: return <DashboardPage onNavigateProperty={navigateToProperty} />;
    }
  };

  return (
    <AuthContext.Provider value={authCtx}>
      <DataProvider userProfile={userProfile}>
        <DataContext.Consumer>
          {(ctx) => (
            <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh", color: C.text }}>
              {!isMobile && <Sidebar active={page} setActive={(p) => { setPage(p); if (p !== "propertyDetail") setSelectedPropertyId(null); }} role={role} userProfile={userProfile} onLogout={onLogout} />}
              <div style={{ marginLeft: isMobile ? 0 : 240, paddingBottom: isMobile ? 72 : 0 }}>
                {isMobile && <MobileTopBar userProfile={userProfile} globalSearch={gs} setGlobalSearch={setGs} onSearchSelect={(id) => navigateToProperty(id)} />}
                <div style={{ padding: isMobile ? "20px 16px" : "28px 32px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isMobile ? 18 : 24, gap: 10 }}>
                    <div>
                      <h1 style={{ fontFamily: font, fontSize: isMobile ? 20 : 22, fontWeight: 700, color: C.white, margin: 0 }}>{TITLES[page]}</h1>
                      <p style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 4 }}>{userProfile.full_name} · {ctx.properties.length} properties</p>
                    </div>
                    {page === "properties" && ["admin", "agent"].includes(role) && (
                      <button onClick={() => exportComplianceCSV(ctx.properties)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 12, fontWeight: 600, color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, whiteSpace: "nowrap", flexShrink: 0 }}>
                        <Icon name="download" size={14} color={C.textMuted} />{!isMobile && "Export CSV"}
                      </button>
                    )}
                  </div>
                  {render()}
                </div>
              </div>
              {isMobile && <BottomNav active={page} setActive={(p) => { setPage(p); if (p !== "propertyDetail") setSelectedPropertyId(null); }} role={role} jobs={ctx.jobs} authId={userProfile.id} />}
              <RequestJobModal open={showRequestJob} onClose={() => { setShowRequestJob(false); setRequestJobProp(null); }} property={requestJobProp} />
            </div>
          )}
        </DataContext.Consumer>
      </DataProvider>
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// ROOT — handles auth state
// ─────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setUserProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setUserProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)`, display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Icon name="zap" size={24} color="#fff" /></div>
        <div style={{ fontFamily: font, fontSize: 14, color: C.textMuted }}>Loading…</div>
      </div>
    </div>
  );

  if (!session || !userProfile) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{overscroll-behavior:none;-webkit-font-smoothing:antialiased}`}</style>
      <LoginPage />
    </>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{margin:0;padding:0;box-sizing:border-box}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}::selection{background:${C.accent}40}input::placeholder{color:${C.textDim}}@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}body{overscroll-behavior:none;-webkit-font-smoothing:antialiased}`}</style>
      <PortalApp session={session} userProfile={userProfile} onLogout={handleLogout} />
    </>
  );
}
