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

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)`, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="zap" size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: C.white, margin: "0 0 4px" }}>OhmniumIQ</h1>
          <p style={{ fontFamily: font, fontSize: 13, color: C.textMuted }}>Compliance Portal</p>
        </div>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
          <h2 style={{ fontFamily: font, fontSize: 17, fontWeight: 600, color: C.white, margin: "0 0 20px" }}>Sign in</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
            <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" />
            {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
            <button onClick={handleLogin} disabled={loading || !email || !password}
              style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white, background: (!email || !password) ? C.textDim : C.accent, border: "none", borderRadius: 10, padding: "12px 20px", cursor: (!email || !password) ? "not-allowed" : "pointer", minHeight: 48, opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </div>
        <p style={{ fontFamily: font, fontSize: 11, color: C.textDim, textAlign: "center", marginTop: 20 }}>Ohmnium Electrical Ltd · Compliance Portal v7.0</p>
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

  // Fetch all data on mount
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [propRes, jobRes, docRes, auditRes, engRes] = await Promise.all([
      supabase.from("properties").select("*").order("ref"),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("documents").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, full_name, role").in("role", ["engineer", "junior"]),
    ]);
    if (propRes.data) setProperties(propRes.data);
    if (jobRes.data) setJobs(jobRes.data);
    if (docRes.data) setDocuments(docRes.data);
    if (auditRes.data) setAudit(auditRes.data);
    if (engRes.data) setEngineers(engRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Mutation functions ───
  const addProperty = useCallback(async (prop) => {
    const { data, error } = await supabase.from("properties").insert({
      address: prop.address, tenant_name: prop.tenant, tenant_phone: prop.phone,
      last_eicr: prop.lastEicr || null, expiry_date: prop.expiryDate || null,
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
    const { data, error } = await supabase.from("properties").update(mapped).eq("id", id).select().single();
    if (data) setProperties(prev => prev.map(p => p.id === id ? data : p));
    return { data, error };
  }, []);

  const addJob = useCallback(async (job) => {
    const { data, error } = await supabase.from("jobs").insert({
      property_id: job.propertyId, type: job.type, status: job.status || "Pending",
      engineer_id: job.engineerId || null, scheduled_date: job.date || null,
      notes: job.notes || null, eicr_data: job.eicrData || null,
      created_by: userProfile.id,
    }).select().single();
    if (data) setJobs(prev => [data, ...prev]);
    return { data, error };
  }, [userProfile]);

  const updateJob = useCallback(async (id, updates) => {
    const mapped = {};
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.engineerId !== undefined) mapped.engineer_id = updates.engineerId;
    if (updates.date !== undefined) mapped.scheduled_date = updates.date;
    if (updates.notes !== undefined) mapped.notes = updates.notes;
    if (updates.eicrData !== undefined) mapped.eicr_data = updates.eicrData;
    const { data, error } = await supabase.from("jobs").update(mapped).eq("id", id).select().single();
    if (data) setJobs(prev => prev.map(j => j.id === id ? data : j));
    return { data, error };
  }, []);

  const addDoc = useCallback(async (doc) => {
    const { data, error } = await supabase.from("documents").insert({
      job_id: doc.jobId, property_id: doc.propertyId, type: doc.type,
      file_path: doc.filePath || null, file_name: doc.fileName || null,
      expiry_date: doc.expiry || null, uploaded_by: userProfile.id,
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
    }).select().single();
    if (data) setAudit(prev => [data, ...prev]);
    return { data, error };
  }, [userProfile]);

  const uploadFile = useCallback(async (file, path) => {
    const { data, error } = await supabase.storage.from("certificates").upload(path, file);
    return { data, error };
  }, []);

  const ctx = { properties, jobs, documents, audit, engineers, loading, addProperty, updateProperty, addJob, updateJob, addDoc, addAudit, uploadFile, fetchAll };

  return <DataContext.Provider value={ctx}>{children}</DataContext.Provider>;
}

// ─────────────────────────────────────────────
// BOTTOM NAV (mobile)
// ─────────────────────────────────────────────
function BottomNav({ active, setActive, role, jobs }) {
  const pSO = jobs.filter(j => j.status === "Awaiting Sign-Off").length;
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
          </button>
        );
      })}
    </div>
  );
}

function MorePage({ setActive, role, onLogout }) {
  const moreItems = [
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "eicr", label: "EICR Form", icon: "clipboard", desc: "BS 7671 inspection form" }] : []),
    ...(["supervisor", "admin"].includes(role) ? [{ id: "signoff", label: "Sign-Off Queue", icon: "checkCircle", desc: "Review junior submissions" }] : []),
    { id: "audit", label: "Audit Trail", icon: "activity", desc: "Full activity history" },
  ];
  return (
    <div>
      {moreItems.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", marginBottom: 10, textAlign: "left" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentGlow, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={item.icon} size={20} color={C.accent} /></div>
          <div><div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.white }}>{item.label}</div><div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 2 }}>{item.desc}</div></div>
        </button>
      ))}
      <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 14, cursor: "pointer", marginTop: 20, textAlign: "left" }}>
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
    ...(["supervisor", "admin"].includes(role) ? [{ id: "signoff", label: "Sign-Off Queue", icon: "checkCircle" }] : []),
    { id: "documents", label: "Documents", icon: "file" },
    { id: "audit", label: "Audit Trail", icon: "activity" },
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
          <div style={{ textAlign: "left" }}><div style={{ fontFamily: font, fontSize: 12, color: C.text }}>Sign Out</div><div style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>v7.0 — Supabase</div></div>
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
function DashboardPage() {
  const { properties, jobs, audit, loading } = useContext(DataContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const tab = w < BP.tablet;

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}><div style={{ fontFamily: font, fontSize: 14, color: C.textMuted }}>Loading dashboard…</div></div>;

  const g = properties.filter(p => calcStatus(p.expiry_date) === "green").length;
  const a = properties.filter(p => calcStatus(p.expiry_date) === "amber").length;
  const r = properties.filter(p => calcStatus(p.expiry_date) === "red").length;
  const activeJobs = jobs.filter(j => j.status !== "Completed").length;
  const awaiting = jobs.filter(j => j.status === "Awaiting Sign-Off").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: mob ? 10 : 16, marginBottom: mob ? 20 : 28 }}>
        {[{ l: "Properties", v: properties.length, i: "home", c: C.accent }, { l: "Compliant", v: g, i: "check", c: C.green }, { l: "Expiring", v: a, i: "clock", c: C.amber }, { l: "Overdue", v: r, i: "alert", c: C.red }].map((card, idx) => (
          <div key={idx} style={{ background: C.card, borderRadius: mob ? 12 : 14, padding: mob ? "16px 14px" : "20px 22px", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: card.c, opacity: 0.06 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: mob ? 8 : 12 }}><Icon name={card.i} size={mob ? 14 : 16} color={card.c} /><span style={{ fontFamily: font, fontSize: mob ? 9 : 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.l}</span></div>
            <div style={{ fontFamily: font, fontSize: mob ? 26 : 32, fontWeight: 700, color: C.white, lineHeight: 1 }}><AnimNum target={card.v} /></div>
          </div>
        ))}
      </div>
      {awaiting > 0 && <div style={{ background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}><Icon name="checkCircle" size={20} color={C.purple} /><span style={{ fontFamily: font, fontSize: 13, color: C.text }}><strong>{awaiting} EICR{awaiting > 1 ? "s" : ""}</strong> awaiting sign-off</span></div>}
      <div style={{ display: "grid", gridTemplateColumns: tab ? "1fr" : "1fr 1fr", gap: mob ? 14 : 20, marginBottom: mob ? 14 : 28 }}>
        <div style={{ background: C.card, borderRadius: 14, padding: mob ? 20 : 28, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 24px" }}>Compliance Heatmap</h3>
          <div style={{ display: "flex", alignItems: mob ? "center" : "center", flexDirection: mob ? "column" : "row", gap: mob ? 20 : 36 }}>
            <ComplianceDonut green={g} amber={a} red={r} size={mob ? 140 : 180} />
            <div style={{ flex: 1, width: "100%" }}>{[{ l: "Compliant", c: g, s: "green" }, { l: "Expiring < 60 days", c: a, s: "amber" }, { l: "Overdue", c: r, s: "red" }].map((row, i) => (
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
            <div key={job.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, marginBottom: 8, gap: 10 }}>
              <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontFamily: font, fontSize: 12, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prop?.address?.split(",")[0] || "—"}</div><div style={{ fontFamily: font, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{job.type} · {job.scheduled_date ? formatDate(job.scheduled_date) : "Unscheduled"}</div></div>
              <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: jobStatusColor(job.status), background: jobStatusBg(job.status), padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{job.status}</span>
            </div>
          ); })}
        </div>
      </div>
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

function PropertiesPage({ onRequestJob }) {
  const { properties, loading } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [filter, setFilter] = useState("all"); const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const role = auth.role;

  const filtered = properties.filter(p => {
    const st = calcStatus(p.expiry_date);
    if (filter !== "all" && st !== filter) return false;
    if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !(p.tenant_name || "").toLowerCase().includes(search.toLowerCase()) && !(p.ref || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>Loading properties…</span></div>;

  return (
    <div>
      <Toast message={toast} show={!!toast} />
      <AddPropertyModal open={showAdd} onClose={(r) => { setShowAdd(false); if (r === "added") showToast("Property added"); }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{[{ id: "all", label: "All" }, { id: "green", label: "OK" }, { id: "amber", label: "Soon" }, { id: "red", label: "Overdue" }].map(f => (<button key={f.id} onClick={() => setFilter(f.id)} style={{ fontFamily: font, fontSize: 11, fontWeight: filter === f.id ? 600 : 400, color: filter === f.id ? C.white : C.textMuted, background: filter === f.id ? (f.id === "all" ? C.accent : statusColor(f.id)) : C.card, border: `1px solid ${filter === f.id ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>{f.label}</button>))}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: mob ? "1 1 100%" : "0 1 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.border}`, flex: 1, minWidth: mob ? 0 : 220 }}><Icon name="search" size={14} color={C.textDim} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ fontFamily: font, fontSize: 12, color: C.text, background: "transparent", border: "none", outline: "none", width: "100%", minHeight: 28 }} /></div>
          {["admin", "agent"].includes(role) && <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, whiteSpace: "nowrap" }}><Icon name="plus" size={14} color={C.white} />Add</button>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(p => {
          const st = calcStatus(p.expiry_date);
          return (
            <div key={p.id} style={{ background: C.card, borderRadius: 12, padding: "16px", border: `1px solid ${C.border}` }}>
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
                </div>
                {["agent", "admin"].includes(role) && (
                  <button onClick={() => onRequestJob(p)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>+ Job</button>
                )}
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
function JobsPage() {
  const { jobs, properties, engineers, updateJob, addJob, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const role = auth.role;
  const [sf, setSf] = useState("all");
  const [assignModal, setAssignModal] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = jobs.filter(j => {
    if (sf !== "all" && j.status !== sf) return false;
    if (["engineer", "junior"].includes(role)) return j.engineer_id === auth.id;
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
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "Pending", "Scheduled", "In Progress", "Completed"].map(s => (
          <button key={s} onClick={() => setSf(s)} style={{ fontFamily: font, fontSize: 11, fontWeight: sf === s ? 600 : 400, color: sf === s ? C.white : C.textMuted, background: sf === s ? C.accent : C.card, border: `1px solid ${sf === s ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36 }}>{s === "all" ? "All" : s}</button>
        ))}
      </div>
      {filtered.map(job => {
        const prop = properties.find(pp => pp.id === job.property_id);
        const eng = engineers.find(e => e.id === job.engineer_id);
        return (
          <div key={job.id} style={{ background: C.card, borderRadius: 14, padding: mob ? "16px" : "20px 24px", border: `1px solid ${C.border}`, display: "flex", flexDirection: mob ? "column" : "row", alignItems: mob ? "stretch" : "center", justifyContent: "space-between", marginBottom: 10, gap: mob ? 14 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: job.type === "EICR" ? C.accentGlow : job.type === "Remedial" ? C.redBg : C.greenBg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={job.type === "EICR" ? "shield" : job.type === "Remedial" ? "alert" : "check"} size={20} color={job.type === "EICR" ? C.accent : job.type === "Remedial" ? C.red : C.green} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.type} — {prop?.address?.split(",")[0] || "—"}</div>
                <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 3 }}>{job.notes || "No notes"}</div>
                <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span>{eng?.full_name || "Unassigned"}</span>
                  <span>{job.scheduled_date ? formatDate(job.scheduled_date) : "Not scheduled"}</span>
                  <span>{job.ref}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: mob ? "flex-end" : "flex-end" }}>
              {role === "admin" && job.status === "Pending" && <button onClick={() => setAssignModal(job)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Assign</button>}
              {["engineer", "junior"].includes(role) && job.status === "Scheduled" && <button onClick={() => advanceStatus(job)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Start</button>}
              {["engineer", "junior"].includes(role) && job.status === "In Progress" && <button onClick={() => advanceStatus(job)} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: C.green, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>Complete</button>}
              <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: jobStatusColor(job.status), background: jobStatusBg(job.status), padding: "5px 14px", borderRadius: 20 }}>{job.status}</span>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>No jobs match</span></div>}
      <AssignModal open={!!assignModal} job={assignModal} onClose={(r) => { setAssignModal(null); if (r) showToast("Assigned"); }} />
    </div>
  );
}

function AssignModal({ open, job, onClose }) {
  const { engineers, properties, updateJob, addAudit } = useContext(DataContext);
  const [engId, setEngId] = useState(""); const [date, setDate] = useState("");
  const submit = async () => {
    if (!date || !engId) return;
    await updateJob(job.id, { engineerId: engId, date, status: "Scheduled" });
    const eng = engineers.find(e => e.id === engId);
    const prop = properties.find(p => p.id === job.property_id);
    await addAudit({ action: `Job ${job.ref} assigned to ${eng?.full_name} on ${formatDate(date)}` });
    await addAudit({ action: `SMS sent to tenant at ${prop?.address?.split(",")[0]}`, userName: "System", userRole: "Auto" });
    setEngId(""); setDate("");
    onClose(job.ref);
  };
  const prop = job ? properties.find(p => p.id === job.property_id) : null;
  return (
    <Modal open={open} onClose={() => onClose(null)} title="Assign Engineer">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {prop && <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}><div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{job.type} — {prop.address.split(",")[0]}</div></div>}
        <Select label="Engineer" value={engId} onChange={setEngId} options={[{ value: "", label: "— Select —" }, ...engineers.map(e => ({ value: e.id, label: `${e.full_name} (${e.role === "junior" ? "Junior" : "Senior"})` }))]} />
        <Input label="Scheduled Date" type="date" value={date} onChange={setDate} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => onClose(null)} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
          <button onClick={submit} disabled={!date || !engId} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: (date && engId) ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: (date && engId) ? "pointer" : "not-allowed", minHeight: 44 }}>Assign</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Request Job Modal ───
function RequestJobModal({ open, onClose, property }) {
  const { addJob, addAudit } = useContext(DataContext);
  const [type, setType] = useState("EICR"); const [notes, setNotes] = useState(""); const [submitted, setSubmitted] = useState(false); const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!property) return;
    setSaving(true);
    const { data } = await addJob({ propertyId: property.id, type, notes: notes.trim() || "Requested" });
    await addAudit({ action: `New job ${data?.ref} (${type}) for ${property.address.split(",")[0]}` });
    setSaving(false); setSubmitted(true);
  };
  const reset = () => { setType("EICR"); setNotes(""); setSubmitted(false); };
  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Request a Job">
      {submitted ? (
        <div style={{ textAlign: "center", padding: 20 }}><Icon name="checkCircle" size={40} color={C.green} /><p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.green, marginTop: 12 }}>Job requested</p><button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", marginTop: 16, minHeight: 44 }}>Done</button></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}><div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{property?.address?.split(",")[0]}</div><div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{property?.tenant_name} · {property?.ref}</div></div>
          <Select label="Service Type" value={type} onChange={setType} options={[{ value: "EICR", label: "EICR" }, { value: "Remedial", label: "Remedial" }, { value: "Smoke Alarm", label: "Smoke Alarm" }, { value: "PAT", label: "PAT" }]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Key at branch…" style={{ fontFamily: font, fontSize: 14, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 70, resize: "vertical" }} /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button><button onClick={submit} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Request"}</button></div>
        </div>
      )}
    </Modal>
  );
}

// ─── Documents Page ───
function DocumentsPage() {
  const { documents, properties } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  return (
    <div>
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 28, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: "0 0 20px" }}>Certificate Vault</h3>
        {documents.length === 0 ? <div style={{ textAlign: "center", padding: 40 }}><Icon name="file" size={40} color={C.textDim} /><div style={{ fontFamily: font, fontSize: 13, color: C.textDim, marginTop: 12 }}>No certificates yet</div><p style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 4 }}>Complete a job and upload a certificate to get started</p></div> :
        documents.map(d => { const pr = properties.find(pp => pp.id === d.property_id); const st = calcStatus(d.expiry_date); return (
          <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: statusBg(st), display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="file" size={20} color={statusColor(st)} /></div>
              <div style={{ minWidth: 0 }}><div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{d.type}</div><div style={{ fontFamily: font, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{pr?.address?.split(",")[0]} · {formatDate(d.uploaded_at)}</div></div>
            </div>
            <span style={{ fontFamily: font, fontSize: 10, fontWeight: 500, color: statusColor(st), background: statusBg(st), border: `1px solid ${statusBorder(st)}`, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{mob ? st.toUpperCase() : `Exp ${formatDate(d.expiry_date)}`}</span>
          </div>
        ); })}
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
  const allRoles = [...new Set(audit.map(l => l.user_role))];
  const filtered = roleFilter === "all" ? audit : audit.filter(l => l.user_role === roleFilter);

  return (
    <div>
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 18 : 28, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div><h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, margin: 0 }}>Audit Trail</h3><span style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{filtered.length} entries</span></div>
          <div style={{ display: "flex", gap: 3, background: C.surfaceAlt, borderRadius: 8, padding: 3, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
            {["all", ...allRoles].map(r => (<button key={r} onClick={() => setRoleFilter(r)} style={{ fontFamily: font, fontSize: 10, fontWeight: roleFilter === r ? 600 : 400, color: roleFilter === r ? C.white : C.textMuted, background: roleFilter === r ? C.accent : "transparent", border: "none", borderRadius: 5, padding: "5px 10px", cursor: "pointer", minHeight: 28 }}>{r === "all" ? "All" : r}</button>))}
          </div>
        </div>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>No audit entries</span></div>}
        {filtered.slice(0, 30).map((l, i) => (
          <div key={l.id || i} style={{ display: "flex", gap: mob ? 10 : 16, padding: "14px 0", borderBottom: i < Math.min(filtered.length, 30) - 1 ? `1px solid ${C.border}` : "none" }}>
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
const TITLES = { dashboard: "Dashboard", properties: "Properties", jobs: "Jobs", eicr: "EICR Form", signoff: "Sign-Off Queue", documents: "Documents", audit: "Audit Trail", more: "More" };

function PortalApp({ session, userProfile, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [gs, setGs] = useState("");
  const [showRequestJob, setShowRequestJob] = useState(false);
  const [requestJobProp, setRequestJobProp] = useState(null);
  const { w } = useWindowSize();
  const isMobile = w < BP.tablet;
  const role = userProfile.role;

  useEffect(() => {
    if (["eicr"].includes(page) && !["engineer", "junior", "supervisor"].includes(role)) setPage("dashboard");
    if (page === "signoff" && !["supervisor", "admin"].includes(role)) setPage("dashboard");
  }, [role]);

  const authCtx = { id: userProfile.id, role: userProfile.role, fullName: userProfile.full_name, orgId: userProfile.organisation_id };

  const render = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "properties": return <PropertiesPage onRequestJob={(p) => { setRequestJobProp(p); setShowRequestJob(true); }} />;
      case "jobs": return <JobsPage />;
      case "documents": return <DocumentsPage />;
      case "audit": return <AuditPage />;
      case "more": return <MorePage setActive={setPage} role={role} onLogout={onLogout} />;
      default: return <DashboardPage />;
    }
  };

  return (
    <AuthContext.Provider value={authCtx}>
      <DataProvider userProfile={userProfile}>
        <DataContext.Consumer>
          {(ctx) => (
            <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh", color: C.text }}>
              {!isMobile && <Sidebar active={page} setActive={setPage} role={role} userProfile={userProfile} onLogout={onLogout} />}
              <div style={{ marginLeft: isMobile ? 0 : 240, paddingBottom: isMobile ? 72 : 0 }}>
                {isMobile && <MobileTopBar userProfile={userProfile} globalSearch={gs} setGlobalSearch={setGs} onSearchSelect={() => setPage("properties")} />}
                <div style={{ padding: isMobile ? "20px 16px" : "28px 32px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isMobile ? 18 : 24, gap: 10 }}>
                    <div>
                      <h1 style={{ fontFamily: font, fontSize: isMobile ? 20 : 22, fontWeight: 700, color: C.white, margin: 0 }}>{TITLES[page]}</h1>
                      <p style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 4 }}>{userProfile.full_name} · {ctx.properties.length} properties</p>
                    </div>
                  </div>
                  {render()}
                </div>
              </div>
              {isMobile && <BottomNav active={page} setActive={setPage} role={role} jobs={ctx.jobs} />}
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
