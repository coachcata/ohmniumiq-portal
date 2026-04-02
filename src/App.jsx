import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const CONTRACTOR = {
  name: "Ohmnium Electrical",
  address: "24 Mount Pleasant, London EN4 9HH",
  phone: "020 3500 1441",
  email: "info@ohmnium.co.uk",
};

const PURPOSE_OPTIONS = [
  { value: "change_of_tenancy", label: "Change of tenancy", text: "Inspection and testing carried out prior to a change of tenancy to ensure the installation is safe for continued use." },
  { value: "general_periodic", label: "General periodic", text: "Routine periodic inspection and testing of the electrical installation in accordance with BS 7671." },
  { value: "sale_purchase", label: "Sale / purchase", text: "Inspection and testing carried out in connection with the sale/purchase of the property." },
  { value: "after_works", label: "After works / alterations", text: "Inspection and testing following alterations/additions to the electrical installation." },
];

const CONDITION_OPTIONS = [
  { value: "satisfactory_standard", label: "Satisfactory", text: "Overall, the electrical installation has been inspected and tested and is considered satisfactory for continued service at the time of assessment. The installation provides adequate protection against electric shock and fire, and no immediate remedial works are required." },
  { value: "satisfactory_recommendations", label: "Satisfactory with recommendations (C3s)", text: "Overall, the electrical installation is considered satisfactory for continued service; however, improvements are recommended to bring the installation closer to current standards. These do not present immediate danger but would enhance overall safety." },
  { value: "unsatisfactory_c2", label: "Unsatisfactory (C2 present)", text: "Overall, the electrical installation has been inspected and tested; however, it is not considered satisfactory for continued service at the time of assessment due to identified safety concerns. Remedial works are required to address these issues." },
  { value: "unsatisfactory_multiple", label: "Unsatisfactory (multiple issues)", text: "The electrical installation is considered unsatisfactory for continued service due to multiple safety concerns, including absence of adequate protection and defects that may present a risk of electric shock or fire. Remedial works are required." },
  { value: "unsatisfactory_specific", label: "Unsatisfactory (specific)", text: "The installation is not considered satisfactory due to the absence of additional protection to relevant circuits and other identified defects. Remedial works are required to ensure safety." },
  { value: "older_installation", label: "Older installation", text: "The installation is generally in serviceable condition; however, it does not fully meet current standards. While not immediately unsafe, improvements are recommended to enhance safety." },
];

const EXTENT_OPTIONS = [
  { value: "full_property", label: "Full property", text: "The inspection and testing covered the fixed electrical installation within the property, including all accessible circuits, accessories, and distribution equipment. No inspection was carried out on concealed wiring or parts of the installation not readily accessible." },
  { value: "flat_only", label: "Flat only", text: "The inspection covered the fixed electrical installation within the flat only and did not include any communal or landlord-controlled installations." },
];

const LIMITATIONS_OPTIONS = [
  { value: "na", label: "N/A", text: "N/A" },
  { value: "standard", label: "Standard limitations", text: "Limitations agreed prior to inspection include no access to concealed wiring, wiring within walls, floors, or ceilings, and no removal of fixed building fabric. No access was available to areas obstructed by furniture, fixtures, or stored items. Inspection and testing were carried out on a sampling basis in accordance with BS 7671." },
];

const OPERATIONAL_LIMITATIONS = "Operational limitations included temporary isolation of electrical circuits during inspection and testing, resulting in brief interruptions to power. Testing of certain equipment may have been limited to avoid inconvenience or potential damage. No access or inspection was carried out on supplier equipment, including the service head, meter, and associated connections, as these are not within the scope of this inspection. Therefore, verification of service head size and incoming supply characteristics could not be confirmed.";

const ESTIMATED_AGE_OPTIONS = ["0–5", "5–10", "10–15", "15–20", "20–25", "25–30", "30–40", "40–50", "50+"];

const CABLE_SIZES = ["0.75", "1.0", "1.5", "2.5", "4.0", "6.0", "10.0", "16.0", "25.0", "35.0", "50.0"];

const RCD_RATINGS = ["10", "30", "100", "300"];

const WIRING_TYPES = [
  { value: "", label: "Please select.." },
  { value: "N/A", label: "N/A" },
  { value: "LIM", label: "LIM" },
  { value: "A", label: "A — Thermoplastic insulated / sheathed cables" },
  { value: "B", label: "B — Thermoplastic cables in metallic conduit" },
  { value: "C", label: "C — Thermoplastic cables in non-metallic conduit" },
  { value: "D", label: "D — Thermoplastic cables in metallic trunking" },
  { value: "E", label: "E — Thermoplastic cables in non-metallic trunking" },
  { value: "F", label: "F — Thermoplastic / SWA cables" },
  { value: "G", label: "G — Thermosetting / SWA cables" },
  { value: "H", label: "H — Mineral-insulated cables" },
  { value: "O", label: "O — Other (state)" },
];

const OCP_TYPES = ["B", "C", "D", "BS 3036", "N/A"];
const OCP_RATINGS = ["6", "10", "13", "16", "20", "25", "32", "40", "45", "50", "63", "80", "100", "N/A"];
const REF_METHODS = ["100", "101", "102", "103", "A", "B", "C", "D", "E", "F", "G", "N/A"];
const MAX_DISCONNECT_TIMES = ["0.1", "0.2", "0.4", "1", "5", "N/A"];
const RCD_TYPES = ["AC", "A", "F", "B", "N/A"];
const RCD_RATINGS_A = ["6", "10", "16", "20", "25", "32", "40", "63", "N/A"];
const TEST_VOLTAGES = ["250", "500", "1000"];
const TOGGLE_OPTIONS = ["\u2713", "N/A", "LIM", "X"];

const CIRCUIT_DESCRIPTIONS = [
  { group: "Lighting Circuits", options: ["Lighting circuit – ground floor", "Lighting circuit – first floor", "Lighting circuit – second floor / loft", "External lighting circuit", "Emergency lighting circuit"] },
  { group: "Socket Circuits", options: ["Sockets ground floor", "Sockets first floor", "Kitchen sockets", "Utility room socket", "External socket"] },
  { group: "Dedicated Appliance Circuits", options: ["Cooker", "Oven", "Hob", "Dishwasher", "Washing machine", "Tumble dryer", "Fridge / freezer"] },
  { group: "Heating & Ventilation", options: ["Boiler", "Central heating controls", "Immersion heater", "Electric shower", "Extractor fan", "MVHR / MEV unit"] },
  { group: "Special Installations", options: ["Smoke alarm", "Heat alarm", "Fire alarm system", "EV charger", "Solar PV inverter", "Battery storage system"] },
  { group: "Outdoor / Ancillary", options: ["Shed / outbuilding supply", "Garage consumer unit", "Garden lighting", "Pond / water feature supply", "Gate / intercom system"] },
  { group: "Misc / Common", options: ["Spare way", "Not in use", "Unknown circuit (investigation required)", "Landlord supply", "Communal supply"] },
];
const OCP_TYPES_NEW = ["Type B", "Type C", "Type D"];
const OCP_RATINGS_NEW = ["6A", "10A", "16A", "20A", "32A", "40A", "50A", "63A"];
const MAX_ZS_LOOKUP = {
  "Type B": { "6A": "5.82", "10A": "3.49", "16A": "2.18", "20A": "1.75", "32A": "1.09", "40A": "0.87", "50A": "0.70", "63A": "0.55" },
  "Type C": { "6A": "2.91", "10A": "1.75", "16A": "1.09", "20A": "0.87", "32A": "0.54", "40A": "0.44", "50A": "0.35", "63A": "0.27" },
  "Type D": { "6A": "1.45", "10A": "0.87", "16A": "0.54", "20A": "0.44", "32A": "0.27", "40A": "0.22", "50A": "0.17", "63A": "0.13" },
};
const BS_EN_OPTIONS = ["N/A", "MCB — BS EN 60898-1", "RCBO — BS EN 61009-1", "RCCB — BS EN 61008-1", "RCD (general) — BS EN 61008-1", "AFDD — BS EN 62606", "MCCB — BS EN 60947-2", "Fuses (HRC) — BS EN 60269", "Rewirable Fuse — BS 3036", "Switch Disconnector — BS EN 60947-3", "SPD — BS EN 61643-11"];

const isUnsatisfactory = (outcome) => ["unsatisfactory_c2", "unsatisfactory_multiple", "unsatisfactory_specific"].includes(outcome);

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
        <p style={{ fontFamily: font, fontSize: 11, color: C.textDim, textAlign: "center", marginTop: 20 }}>Ohmnium Electrical Ltd · Compliance Portal v18.4</p>
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
  const [organisations, setOrganisations] = useState([]);
  const [comments, setComments] = useState([]);

  // Fetch all data on mount
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const orgId = userProfile.organisation_id;
    // Check if user's org is a contractor (sees all clients) or agency (sees own data only)
    const { data: orgData } = await supabase.from("organisations").select("type").eq("id", orgId).single();
    const isContractor = orgData?.type === "contractor";
    // Contractor admin/supervisor sees all data; agency users see only their org
    const propQuery = isContractor
      ? supabase.from("properties").select("*").order("ref")
      : supabase.from("properties").select("*").eq("agency_id", orgId).order("ref");
    const jobQuery = isContractor
      ? supabase.from("jobs").select("*").order("created_at", { ascending: false })
      : supabase.from("jobs").select("*").eq("organisation_id", orgId).order("created_at", { ascending: false });
    const docQuery = isContractor
      ? supabase.from("documents").select("*").order("uploaded_at", { ascending: false })
      : supabase.from("documents").select("*").eq("organisation_id", orgId).order("uploaded_at", { ascending: false });
    const auditQuery = isContractor
      ? supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500)
      : supabase.from("audit_log").select("*").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(500);
    const engQuery = isContractor
      ? supabase.from("profiles").select("id, full_name, role, email, organisation_id, signature_url").in("role", ["engineer", "junior", "supervisor", "agent", "admin"])
      : supabase.from("profiles").select("id, full_name, role, email, organisation_id, signature_url").eq("organisation_id", orgId).in("role", ["engineer", "junior", "supervisor", "agent", "admin"]);
    const commentQuery = isContractor
      ? supabase.from("job_comments").select("*").order("created_at", { ascending: true })
      : supabase.from("job_comments").select("*").eq("organisation_id", orgId).order("created_at", { ascending: true });
    const orgQuery = supabase.from("organisations").select("id, name, type").order("name");

    const [propRes, jobRes, docRes, auditRes, engRes, commentRes, orgRes] = await Promise.all([
      propQuery, jobQuery, docQuery, auditQuery, engQuery, commentQuery, orgQuery,
    ]);
    if (propRes.data) setProperties(propRes.data);
    if (jobRes.data) setJobs(jobRes.data);
    if (docRes.data) setDocuments(docRes.data);
    if (auditRes.data) setAudit(auditRes.data);
    if (engRes.data) setEngineers(engRes.data);
    if (commentRes.data) setComments(commentRes.data);
    if (orgRes.data) setOrganisations(orgRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Mutation functions ───
  const addProperty = useCallback(async (prop) => {
    const { data, error } = await supabase.from("properties").insert({
      address: prop.address, tenant_name: prop.tenant, tenant_phone: prop.phone, landlord_name: prop.landlordName || null,
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
    if (updates.tenant_phone !== undefined) mapped.tenant_phone = updates.tenant_phone;
    if (updates.landlord_name !== undefined) mapped.landlord_name = updates.landlord_name;
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
    const { data, error } = await supabase.from("jobs").insert({
      property_id: job.propertyId, type: job.type, status: job.status || "Pending",
      engineer_id: job.engineerId || null, scheduled_date: job.date || null,
      notes: job.notes || null, eicr_data: job.eicrData || null,
      created_by: userProfile.id, organisation_id: userProfile.organisation_id,
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
    if (updates.hasCert !== undefined) mapped.has_cert = updates.hasCert;
    if (updates.crn !== undefined) mapped.crn = updates.crn;
    const { data, error } = await supabase.from("jobs").update(mapped).eq("id", id).select().single();
    if (data) setJobs(prev => prev.map(j => j.id === id ? data : j));
    return { data, error };
  }, []);

  const addDoc = useCallback(async (doc) => {
    const { data, error } = await supabase.from("documents").insert({
      job_id: doc.jobId, property_id: doc.propertyId, type: doc.type,
      file_path: doc.filePath || null, file_name: doc.fileName || null,
      expiry_date: doc.expiry || null, uploaded_by: userProfile.id,
      organisation_id: userProfile.organisation_id,
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
    if (error) console.error("Storage upload error:", error.message, { path });
    return { data, error };
  }, []);

  const getNextCRN = useCallback(async () => {
    const { data } = await supabase.from("jobs").select("crn").not("crn", "is", null).order("crn", { ascending: false }).limit(1);
    const last = data?.[0]?.crn;
    if (!last) return "1000000";
    const lastNum = parseInt(last, 10);
    return String(isNaN(lastNum) ? 1000000 : lastNum + 1);
  }, []);

  const ctx = { properties, jobs, documents, audit, engineers, comments, organisations, loading, addProperty, updateProperty, deleteProperty, addJob, updateJob, deleteJob, addDoc, addAudit, addComment, uploadFile, fetchAll, getNextCRN };

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
        const isA = active === item.id || (item.id === "more" && ["eicr", "dfpm25", "epm25", "eic183c", "signoff", "audit"].includes(active));
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

// ─────────────────────────────────────────────
// TEAM / USER MANAGEMENT (admin only)
// ─────────────────────────────────────────────
function InviteUserModal({ open, onClose }) {
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("engineer");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim() || !name.trim()) { setError("Name and email are required"); return; }
    setSaving(true); setError("");
    // Create user via Supabase Admin API — requires service role key
    // In production this should be a Supabase Edge Function. For now we use signUp
    // which sends a confirmation email and the user sets their own password.
    const { data, error: signupError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      email_confirm: true,
      user_metadata: { full_name: name.trim(), role, organisation_id: auth.orgId },
    });
    if (signupError) {
      // admin.createUser requires service role — fall back to a magic link invite
      const { error: inviteError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { data: { full_name: name.trim(), role, organisation_id: auth.orgId } },
      });
      if (inviteError) { setError(inviteError.message); setSaving(false); return; }
    }
    setSaving(false); setDone(true);
  };

  const reset = () => { setEmail(""); setName(""); setRole("engineer"); setDone(false); setError(""); };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Invite Team Member">
      {done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icon name="checkCircle" size={36} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>Invite sent</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6 }}>An email has been sent to <strong>{email}</strong> with a link to set their password and access the portal.</div>
          <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44, marginTop: 20 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Full Name" value={name} onChange={setName} placeholder="e.g. James Mitchell" />
          <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="james@example.com" />
          <Select label="Role" value={role} onChange={setRole} options={[
            { value: "agent", label: "Agent — can manage properties & request jobs" },
            { value: "engineer", label: "Engineer — can run EICR forms" },
            { value: "junior", label: "Junior Engineer — submits for sign-off" },
            { value: "supervisor", label: "Supervisor — signs off junior EICRs" },
            { value: "admin", label: "Admin — full access" },
          ]} />
          <div style={{ background: C.accentGlow, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontFamily: font, fontSize: 11, color: C.accent }}>ℹ️ The person will receive an email with a login link. They'll set their own password on first sign-in.</div>
          </div>
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={submit} disabled={saving || !email || !name} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: (email && name) ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: (email && name) ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Sending…" : "Send Invite"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AddUserModal({ open, onClose }) {
  const auth = useContext(AuthContext);
  const { organisations, fetchAll } = useContext(DataContext);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("engineer");
  const [orgId, setOrgId] = useState(auth.orgId);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    { value: "admin", label: "Admin", desc: "Full access to all features" },
    { value: "agent", label: "Agent", desc: "Manage properties & request jobs" },
    { value: "supervisor", label: "Supervisor", desc: "Sign off junior EICRs" },
    { value: "engineer", label: "Engineer", desc: "Run inspections & complete forms" },
    { value: "junior", label: "Junior Engineer", desc: "Submit forms for sign-off" },
  ];

  const submit = async () => {
    if (!email.trim() || !name.trim() || !password.trim()) { setError("Name, email and password are required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setSaving(true); setError("");
    // Try admin.createUser first (requires service role key)
    const { data, error: createErr } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: { full_name: name.trim(), role, organisation_id: orgId },
    });
    if (createErr) {
      // Fallback: use signUp (sends confirmation email, user gets password set)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: { data: { full_name: name.trim(), role, organisation_id: orgId } },
      });
      if (signUpErr) { setError(signUpErr.message); setSaving(false); return; }
      // Manually create profile if trigger didn't fire
      if (signUpData?.user) {
        await supabase.from("profiles").upsert({
          id: signUpData.user.id,
          full_name: name.trim(),
          role,
          email: email.trim(),
          organisation_id: orgId,
        }, { onConflict: "id" });
      }
    } else if (data?.user) {
      // Admin create succeeded — ensure profile exists
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: name.trim(),
        role,
        email: email.trim(),
        organisation_id: orgId,
      }, { onConflict: "id" });
    }
    await fetchAll();
    setSaving(false); setDone(true);
  };

  const reset = () => { setEmail(""); setName(""); setPassword(""); setRole("engineer"); setOrgId(auth.orgId); setDone(false); setError(""); };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Add User">
      {done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Icon name="checkCircle" size={36} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 12 }}>User created</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 6 }}><strong>{name}</strong> ({email}) has been added as <strong>{roles.find(r => r.value === role)?.label}</strong>.</div>
          <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", minHeight: 44, marginTop: 20 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Full Name" value={name} onChange={setName} placeholder="e.g. James Mitchell" />
          <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="james@example.com" />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" />
          {organisations.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Organisation</label>
              <select value={orgId} onChange={e => setOrgId(e.target.value)} style={{ fontFamily: font, fontSize: 14, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 44, cursor: "pointer" }}>
                {organisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Role</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {roles.map(r => (
                <label key={r.value} onClick={() => setRole(r.value)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: role === r.value ? C.accentGlow : C.surfaceAlt, border: `1px solid ${role === r.value ? C.accent : C.border}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${role === r.value ? C.accent : C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {role === r.value && <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.accent }} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{r.label}</div>
                    <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 1 }}>{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={submit} disabled={saving || !email || !name || !password} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: (email && name && password) ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: (email && name && password) ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Creating…" : "Create User"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SignatureModal({ open, onClose, member }) {
  const { uploadFile } = useContext(DataContext);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!file) { setError("Please select a file"); return; }
    setSaving(true);
    const path = `signatures/${member.id}/signature.png`;
    const { error: upErr } = await uploadFile(file, path);
    if (upErr) { setError("Upload failed: " + upErr.message); setSaving(false); return; }
    // Get the public URL
    const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(path);
    const sigUrl = urlData?.publicUrl || path;
    // Update profile
    await supabase.from("profiles").update({ signature_url: sigUrl }).eq("id", member.id);
    setSaving(false);
    onClose("saved");
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Upload Signature — ${member?.full_name || ""}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {member?.signature_url && (
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <img src={member.signature_url} alt="Current signature" style={{ maxWidth: 200, maxHeight: 80 }} />
          </div>
        )}
        <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ fontFamily: font, fontSize: 12, color: C.text }} />
        {error && <div style={{ fontFamily: font, fontSize: 12, color: C.red }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => onClose(null)} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
          <button onClick={submit} disabled={!file || saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: file && !saving ? C.accent : C.textDim, border: "none", borderRadius: 10, padding: "10px 20px", cursor: file && !saving ? "pointer" : "not-allowed", minHeight: 44 }}>{saving ? "Uploading…" : "Upload"}</button>
        </div>
      </div>
    </Modal>
  );
}

function TeamPage() {
  const { engineers, organisations, fetchAll } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [showInvite, setShowInvite] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [signatureMember, setSignatureMember] = useState(null);
  const [orgFilter, setOrgFilter] = useState(auth.orgId);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const roleLabel = (r) => ({ admin: "Admin", agent: "Agent", engineer: "Engineer", junior: "Junior Engineer", supervisor: "Supervisor" }[r] || r);
  const roleColor = (r) => ({ admin: C.white, agent: C.accent, engineer: C.green, junior: C.purple, supervisor: C.amber }[r] || C.textMuted);

  const filteredMembers = orgFilter === "all" ? engineers : engineers.filter(m => m.organisation_id === orgFilter);
  const selectedOrgName = organisations.find(o => o.id === orgFilter)?.name || "All";

  return (
    <div>
      <Toast message={toast} show={!!toast} />
      <InviteUserModal open={showInvite} onClose={() => { setShowInvite(false); showToast("Invite sent"); }} />
      <AddUserModal open={showAddUser} onClose={() => { setShowAddUser(false); }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        {organisations.length > 1 && (
          <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)} style={{ fontFamily: font, fontSize: 12, color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 40, outline: "none" }}>
            <option value="all">All Teams</option>
            {organisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAddUser(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", minHeight: 40 }}>
            <Icon name="plus" size={14} color={C.white} /> Add User
          </button>
          <button onClick={() => setShowInvite(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 8, padding: "10px 18px", cursor: "pointer", minHeight: 40 }}>
            Invite via Email
          </button>
        </div>
      </div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {filteredMembers.length === 0 && (
          <div style={{ padding: 40, textAlign: "center" }}><span style={{ fontFamily: font, fontSize: 13, color: C.textDim }}>{orgFilter === "all" ? "No team members yet" : `No members in ${selectedOrgName}`}</span></div>
        )}
        {filteredMembers.map((member, i) => {
          const memberOrg = organisations.find(o => o.id === member.organisation_id);
          return (
          <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: i < filteredMembers.length - 1 ? `1px solid ${C.border}` : "none", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${roleColor(member.role)}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: roleColor(member.role) }}>{(member.full_name || "?")[0].toUpperCase()}</span>
              </div>
              <div>
                <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{member.full_name}</div>
                <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{member.email || ""}{orgFilter === "all" && memberOrg ? ` · ${memberOrg.name}` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: roleColor(member.role), background: `${roleColor(member.role)}18`, padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>{roleLabel(member.role)}</span>
              {auth.role === "admin" && ["engineer", "junior", "supervisor"].includes(member.role) && (
                <button onClick={() => setSignatureMember(member)} style={{ fontFamily: font, fontSize: 11, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", minHeight: 30, marginLeft: 8 }}>
                  {member.signature_url ? "Update Sig" : "Add Sig"}
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>
      <SignatureModal open={!!signatureMember} onClose={(r) => { setSignatureMember(null); if (r === "saved") { fetchAll(); } }} member={signatureMember} />
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
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "dfpm25", label: "Fire Alarm (DFPM25)", icon: "zap", desc: "Grade C/D/F domestic fire alarm cert" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "epm25", label: "Emergency Lighting (EPM25)", icon: "activity", desc: "Periodic inspection & testing cert" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "eic183c", label: "Installation Cert (EIC)", icon: "fileCheck", desc: "New work / alteration / DB replacement" }] : []),
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
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "dfpm25", label: "Fire Alarm", icon: "zap" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "epm25", label: "Emerg. Lighting", icon: "activity" }] : []),
    ...(["engineer", "junior", "supervisor"].includes(role) ? [{ id: "eic183c", label: "Install. Cert", icon: "fileCheck" }] : []),
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
          <div style={{ textAlign: "left" }}><div style={{ fontFamily: font, fontSize: 12, color: C.text }}>Sign Out</div><div style={{ fontFamily: font, fontSize: 10, color: C.textDim }}>v18.4 — Supabase</div></div>
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
            <span style={{ fontFamily: font, fontSize: 13, color: C.text }}><strong>{pendingSignOff.length} EICR{pendingSignOff.length > 1 ? "s" : ""}</strong> awaiting supervisor sign-off</span>
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
      {awaiting > 0 && <div style={{ background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}><Icon name="checkCircle" size={20} color={C.purple} /><span style={{ fontFamily: font, fontSize: 13, color: C.text }}><strong>{awaiting} EICR{awaiting > 1 ? "s" : ""}</strong> awaiting sign-off</span></div>}

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
  const [addr, setAddr] = useState(""); const [tenant, setTenant] = useState(""); const [phone, setPhone] = useState(""); const [landlordName, setLandlordName] = useState(""); const [lastEicr, setLastEicr] = useState("");
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!addr.trim() || !tenant.trim()) { setError("Address and tenant required"); return; }
    setSaving(true);
    const expiry = calcExpiry(lastEicr);
    const { data, error: err } = await addProperty({ address: addr.trim(), tenant: tenant.trim(), phone: phone.trim(), landlordName: landlordName.trim(), lastEicr: lastEicr || null, expiryDate: expiry });
    if (err) { setError(err.message); setSaving(false); return; }
    await addAudit({ action: `Property ${data?.ref} added — ${addr.split(",")[0]}` });
    setAddr(""); setTenant(""); setPhone(""); setLandlordName(""); setLastEicr(""); setError(""); setSaving(false);
    onClose("added");
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Property">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Property Address" value={addr} onChange={setAddr} placeholder="e.g. 15 Station Road, Leeds LS1 2AB" />
        <Input label="Tenant Name" value={tenant} onChange={setTenant} placeholder="e.g. John Smith" />
        <Input label="Tenant Phone" value={phone} onChange={setPhone} placeholder="e.g. 07700 900000" />
        <Input label="Landlord Name" value={landlordName} onChange={setLandlordName} placeholder="e.g. Mr A Patel" />
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
  const { properties, organisations, loading } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const [filter, setFilter] = useState("all"); const [search, setSearch] = useState("");
  const [sort, setSort] = useState("ref");
  const [clientFilter, setClientFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const role = auth.role;
  const clients = organisations.filter(o => o.type === "agency");

  const statusOrder = { red: 0, amber: 1, green: 2 };

  const filtered = properties.filter(p => {
    const st = overallStatus(p);
    if (filter !== "all" && st !== filter) return false;
    if (clientFilter !== "all" && p.agency_id !== clientFilter) return false;
    if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !(p.tenant_name || "").toLowerCase().includes(search.toLowerCase()) && !(p.ref || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "status") return statusOrder[overallStatus(a)] - statusOrder[overallStatus(b)];
    if (sort === "expiry") {
      const earliest = (p) => Math.min(p.expiry_date ? new Date(p.expiry_date).getTime() : Infinity, p.smoke_expiry ? new Date(p.smoke_expiry).getTime() : Infinity, p.pat_expiry ? new Date(p.pat_expiry).getTime() : Infinity);
      return earliest(a) - earliest(b);
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
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[{ id: "all", label: "All" }, { id: "green", label: "OK" }, { id: "amber", label: "Soon" }, { id: "red", label: "Overdue" }].map(f => (<button key={f.id} onClick={() => setFilter(f.id)} style={{ fontFamily: font, fontSize: 11, fontWeight: filter === f.id ? 600 : 400, color: filter === f.id ? C.white : C.textMuted, background: filter === f.id ? (f.id === "all" ? C.accent : statusColor(f.id)) : C.card, border: `1px solid ${filter === f.id ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>{f.label}</button>))}
        </div>
        {clients.length > 0 && (
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ fontFamily: font, fontSize: 11, color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", minHeight: 36, outline: "none" }}>
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
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
  const { jobs, properties, engineers, organisations, updateJob, addJob, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;
  const role = auth.role;
  const [sf, setSf] = useState("all");
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [assignModal, setAssignModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const clients = organisations.filter(o => o.type === "agency");

  const filtered = jobs.filter(j => {
    if (sf !== "all" && j.status !== sf) return false;
    if (["engineer", "junior"].includes(role) && j.engineer_id !== auth.id) return false;
    if (clientFilter !== "all" && j.organisation_id !== clientFilter) return false;
    if (search) {
      const prop = properties.find(p => p.id === j.property_id);
      const q = search.toLowerCase();
      return (prop?.address || "").toLowerCase().includes(q) || (j.ref || "").toLowerCase().includes(q) || (j.type || "").toLowerCase().includes(q) || (prop?.tenant_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const advanceStatus = async (job) => {
    let ns = null;
    if (job.status === "Scheduled") ns = "In Progress";
    else if (job.status === "In Progress") ns = role === "junior" ? "Awaiting Sign-Off" : "Completed";
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
          {["all", "Pending", "Scheduled", "In Progress", "Awaiting Sign-Off", "Completed"].map(s => (
            <button key={s} onClick={() => setSf(s)} style={{ fontFamily: font, fontSize: 11, fontWeight: sf === s ? 600 : 400, color: sf === s ? C.white : C.textMuted, background: sf === s ? C.accent : C.card, border: `1px solid ${sf === s ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36 }}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
        {clients.length > 0 && !["engineer", "junior"].includes(role) && (
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ fontFamily: font, fontSize: 11, color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", minHeight: 36, outline: "none" }}>
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {!["engineer", "junior"].includes(role) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.border}`, flex: mob ? "1 1 100%" : "0 1 220px" }}>
            <Icon name="search" size={14} color={C.textDim} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" style={{ fontFamily: font, fontSize: 12, color: C.text, background: "transparent", border: "none", outline: "none", width: "100%", minHeight: 28 }} />
          </div>
        )}
      </div>
      {filtered.map(job => {
        const prop = properties.find(pp => pp.id === job.property_id);
        const eng = engineers.find(e => e.id === job.engineer_id);
        return (
          <div key={job.id} style={{ background: C.card, borderRadius: 14, padding: mob ? "16px" : "20px 24px", border: `1px solid ${C.border}`, display: "flex", flexDirection: mob ? "column" : "row", alignItems: mob ? "stretch" : "center", justifyContent: "space-between", marginBottom: 10, gap: mob ? 14 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: job.type === "EICR" ? C.accentGlow : job.type === "Remedial" ? C.redBg : job.type === "Fire Alarm" ? C.greenBg : job.type === "Emergency Lighting" ? C.greenBg : C.greenBg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={job.type === "EICR" ? "shield" : job.type === "Remedial" ? "alert" : job.type === "Fire Alarm" ? "zap" : job.type === "Emergency Lighting" ? "activity" : job.type === "New Installation" ? "tool" : job.type === "Alteration" ? "tool" : "check"} size={20} color={job.type === "EICR" ? C.accent : job.type === "Remedial" ? C.red : C.green} /></div>
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
        <Select label="Service Type" value={type} onChange={setType} options={[{ value: "EICR", label: "EICR" }, { value: "Remedial", label: "Remedial" }, { value: "Smoke Alarm", label: "Smoke Alarm" }, { value: "Fire Alarm", label: "Fire Alarm" }, { value: "Emergency Lighting", label: "Emergency Lighting" }, { value: "PAT", label: "PAT" }, { value: "New Installation", label: "New Installation" }, { value: "Alteration", label: "Alteration" }]} />
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
          <Select label="Service Type" value={type} onChange={setType} options={[{ value: "EICR", label: "EICR" }, { value: "Remedial", label: "Remedial" }, { value: "Smoke Alarm", label: "Smoke Alarm" }, { value: "Fire Alarm", label: "Fire Alarm" }, { value: "Emergency Lighting", label: "Emergency Lighting" }, { value: "PAT", label: "PAT" }, { value: "New Installation", label: "New Installation" }, { value: "Alteration", label: "Alteration" }]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Key at branch…" style={{ fontFamily: font, fontSize: 14, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 70, resize: "vertical" }} /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button onClick={() => { reset(); onClose(); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button><button onClick={submit} disabled={saving} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Request"}</button></div>
        </div>
      )}
    </Modal>
  );
}

// ─── Certificate PDF Renderer (Hidden) ───
function CertificateRenderer({ job, property, certRef }) {
  if (!job) return null;
  const eicr = job.eicr_data || {};
  const isEICR = job.type === "EICR" || eicr.formType === "EICR" || (!eicr.formType && job.type === "EICR");
  const isEIC = eicr.formType === "EIC" || job.type === "EIC";

  const cellS = { border: "1px solid #aaa", padding: "4px 6px", fontSize: 9, color: "#111", fontFamily: "Arial, sans-serif" };
  const headS = { ...cellS, fontWeight: 700, background: "#e8edf2", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.3 };
  const secHead = { fontFamily: "Arial, sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1a1a", margin: "10px 0 6px", padding: "4px 0", borderBottom: "2px solid #2a4a8d" };

  if (isEICR) {
  const purposeObj = PURPOSE_OPTIONS.find(o => o.value === eicr.purposeKey);
  const conditionObj = CONDITION_OPTIONS.find(o => o.value === eicr.conditionKey);
  const extentObj = EXTENT_OPTIONS.find(o => o.value === eicr.extentKey);
  const limitationsObj = LIMITATIONS_OPTIONS.find(o => o.value === eicr.limitationsKey);
  const conditionLabel = conditionObj?.label || eicr.overallAssessment || "—";
  const conditionIsUnsat = isUnsatisfactory(eicr.conditionKey);
  return (
    <div ref={certRef} style={{ width: 794, background: "#fff", padding: "30px 40px", boxSizing: "border-box" }}>
      {/* PAGE 1 — Header & Summary */}
      <div style={{ borderBottom: "3px solid #2a4a8d", paddingBottom: 10, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 16, fontWeight: 700, color: "#2a4a8d", letterSpacing: 0.5 }}>ELECTRICAL INSTALLATION CONDITION REPORT</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10, color: "#555", marginTop: 2 }}>In accordance with BS 7671 — IET Wiring Regulations 18th Edition</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 9, color: "#555" }}>Certificate No.</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{job.crn || job.ref}</div>
        </div>
      </div>

      {/* Contractor Block */}
      <div style={{ background: "#f0f2f5", borderRadius: 4, padding: "8px 12px", marginBottom: 14, fontSize: 9, fontFamily: "Arial, sans-serif", color: "#333" }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{CONTRACTOR.name}</div>
        <div>{CONTRACTOR.address}</div>
        <div>{CONTRACTOR.phone} | {CONTRACTOR.email}</div>
      </div>

      {/* Section A — Details */}
      <div style={secHead}>Section A — Details of the Client and Installation</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          <tr><td style={{ ...headS, width: "25%" }}>Estate Agent / Agency</td><td style={cellS}>{eicr.agencyAddress || eicr.agentName || "—"}</td><td style={{ ...headS, width: "25%" }}>Occupier</td><td style={cellS}>{eicr.occupier || property?.tenant_name || "—"}</td></tr>
          <tr><td style={headS}>Landlord / Property Address</td><td style={cellS} colSpan={3}>{eicr.landlordDetails || eicr.installationAddress || property?.address || "—"}</td></tr>
          <tr><td style={headS}>Purpose of Report</td><td style={cellS} colSpan={3}>{purposeObj ? `${purposeObj.label} — ${purposeObj.text}` : eicr.purpose || "—"}</td></tr>
          <tr><td style={headS}>Description of Premises</td><td style={cellS}>{eicr.premisesType || "—"}</td><td style={headS}>Estimated Age</td><td style={cellS}>{eicr.estimatedAgeRange || eicr.estimatedAge || "—"}</td></tr>
          <tr><td style={headS}>Evidence of Alterations</td><td style={cellS}>{eicr.evidenceOfAlterations ? "Yes" : "No"}{eicr.alterationsAge ? ` (${eicr.alterationsAge})` : ""}</td><td style={headS}>Date of Last Inspection</td><td style={cellS}>{eicr.dateOfLastInspection || eicr.previousReportDate || "—"}</td></tr>
        </tbody>
      </table>

      {/* Section B — Extent & Limitations */}
      <div style={secHead}>Section B — Extent and Limitations of the Inspection</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          <tr><td style={headS}>Extent of Installation Covered</td><td style={cellS}>{extentObj?.text || eicr.extentDetails || "As agreed with client"}</td></tr>
          <tr><td style={{ ...headS, width: "25%" }}>Agreed Limitations</td><td style={cellS}>{limitationsObj?.text || eicr.agreedLimitations || "N/A"}</td></tr>
          <tr><td style={headS}>Agreed With</td><td style={cellS}>{eicr.agreedWith || "—"}</td></tr>
          <tr><td style={headS}>Operational Limitations</td><td style={cellS}>{OPERATIONAL_LIMITATIONS}</td></tr>
        </tbody>
      </table>

      {/* Section C — Supply Characteristics */}
      <div style={secHead}>Section C — Supply Characteristics and Earthing Arrangements</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          <tr><td style={{ ...headS, width: "25%" }}>System Type / Earthing</td><td style={cellS}>{eicr.typeOfEarthingSystem || eicr.earthingSystem || "—"}</td><td style={{ ...headS, width: "25%" }}>Supply Conductors</td><td style={cellS}>{eicr.supplyType || eicr.numberOfLiveConnectors || "—"}</td></tr>
          <tr><td style={headS}>Nominal Voltage (U)</td><td style={cellS}>{eicr.supplyVoltage || eicr.nominalVoltageEarth || "—"}{(eicr.supplyVoltage || eicr.nominalVoltageEarth) ? " V" : ""}</td><td style={headS}>Nominal Frequency</td><td style={cellS}>{eicr.frequency || "50"} Hz</td></tr>
          <tr><td style={headS}>Earth Fault Loop Impedance Ze</td><td style={cellS}>{eicr.earthFaultLoop || eicr.externalEarthFaultLoop || "—"}{(eicr.earthFaultLoop || eicr.externalEarthFaultLoop) ? " Ω" : ""}</td><td style={headS}>Prospective Fault Current (Pscc)</td><td style={cellS}>{eicr.pscc || eicr.prospectiveFaultCurrent || "—"}{(eicr.pscc || eicr.prospectiveFaultCurrent) ? " kA" : ""}</td></tr>
          <tr><td style={headS}>Maximum Demand</td><td style={cellS}>{eicr.maxDemand || "—"}{eicr.maxDemand ? " A" : ""}</td><td style={headS}>Supply Protective Device</td><td style={cellS}>{eicr.supplyProtectiveDevice || "—"}{eicr.supplyProtectiveDeviceRating ? ` · ${eicr.supplyProtectiveDeviceRating} A` : ""}</td></tr>
        </tbody>
      </table>

      {/* Section D — Distribution Board */}
      <div style={secHead}>Section D — Particulars of Installation at the Distribution Board</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          <tr><td style={{ ...headS, width: "25%" }}>DB Designation</td><td style={cellS}>{eicr.dbDesignation || "Main"}</td><td style={{ ...headS, width: "25%" }}>DB Location</td><td style={cellS}>{eicr.dbLocation || "—"}</td></tr>
          <tr><td style={headS}>DB Make / Model</td><td style={cellS}>{eicr.dbMake || "—"}</td><td style={headS}>No. of Circuits</td><td style={cellS}>{eicr.numberOfCircuits || "—"}</td></tr>
          <tr><td style={headS}>Main Switch Type</td><td style={cellS}>{eicr.mainSwitchType || "—"}</td><td style={headS}>Main Switch Rating</td><td style={cellS}>{eicr.mainSwitchRating || "—"}{eicr.mainSwitchRating ? " A" : ""}</td></tr>
          <tr><td style={headS}>RCD Present</td><td style={cellS}>{eicr.rcdPresent || "—"}</td><td style={headS}>RCD Rating / Type</td><td style={cellS}>{eicr.rcdRating || "—"}{eicr.rcdRating ? " mA" : ""}{eicr.rcdType ? ` · ${eicr.rcdType}` : ""}</td></tr>
        </tbody>
      </table>

      {/* Circuit Schedule (Page 3 content) */}
      <div style={secHead}>Schedule of Circuit Details and Test Results</div>
      {eicr.circuits && Array.isArray(eicr.circuits) && eicr.circuits.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 8 }}>
          <thead>
            <tr>{["Cct", "Description", "Type", "Ref", "Pts", "OCPD", "R1+R2 Ω", "Zs Ω", "IR MΩ", "Pol", "RCD ms", "Remarks"].map((h, i) => <th key={i} style={{ ...headS, fontSize: 7, padding: "3px 4px", textAlign: "left" }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {eicr.circuits.map((c, i) => (
              <tr key={i}>
                {[c.circuitNo || i + 1, c.description, c.wiringType, c.refMethod, c.noOfPoints, `${c.ocpdType || ""} ${c.ocpdRating || ""}`.trim(), c.r1r2, c.zs, c.insResistance, c.polarity, c.rcdTime, c.remarks].map((v, j) => (
                  <td key={j} style={{ ...cellS, fontSize: 8, padding: "3px 4px" }}>{v || "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
          <thead><tr>{["Cct", "Description", "Type", "OCPD", "R1+R2 Ω", "Zs Ω", "IR MΩ", "Pol", "RCD ms", "Remarks"].map((h, i) => <th key={i} style={{ ...headS, fontSize: 7, padding: "3px 4px", textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>{[1,2,3,4,5,6].map(n => <tr key={n}>{Array(10).fill(0).map((_, j) => <td key={j} style={{ ...cellS, fontSize: 8, padding: "3px 4px", height: 16 }}>{j === 0 ? n : ""}</td>)}</tr>)}</tbody>
        </table>
      )}

      {/* Section E — Observations */}
      <div style={secHead}>Section E — Observations and Recommendations</div>
      {eicr.observations && Array.isArray(eicr.observations) && eicr.observations.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
          <thead><tr><th style={{ ...headS, width: 35 }}>Item</th><th style={{ ...headS, width: 40 }}>Ref</th><th style={{ ...headS, width: 40 }}>Code</th><th style={headS}>Location / Details</th></tr></thead>
          <tbody>
            {eicr.observations.map((obs, i) => (
              <tr key={i}><td style={{ ...cellS, textAlign: "center" }}>{obs.itemNumber || i + 1}</td><td style={{ ...cellS, textAlign: "center" }}>{obs.refCode || obs.ref || "—"}</td><td style={{ ...cellS, textAlign: "center", fontWeight: 700, color: obs.classification === "C1" || obs.code === "C1" ? "#dc2626" : obs.classification === "C2" || obs.code === "C2" ? "#d97706" : obs.classification === "C3" || obs.code === "C3" ? "#2563eb" : obs.classification === "FI" || obs.code === "FI" ? "#7c3aed" : "#333" }}>{obs.classification || obs.code || "—"}</td><td style={cellS}>{obs.location || obs.observation || "—"}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: 9, color: "#666", padding: "8px 0", marginBottom: 10 }}>No observations recorded.</div>
      )}

      {/* Section F — General Condition */}
      <div style={secHead}>Section F — General Condition of the Installation</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          <tr>
            <td style={{ ...headS, width: "25%" }}>General Condition</td>
            <td style={{ ...cellS, fontSize: 11, fontWeight: 700, color: conditionIsUnsat ? "#dc2626" : "#15803d" }}>{conditionLabel}</td>
          </tr>
          {conditionObj?.text && <tr><td style={headS}>Details</td><td style={{ ...cellS, fontSize: 8, lineHeight: 1.5 }}>{conditionObj.text}</td></tr>}
        </tbody>
      </table>

      {/* Declaration */}
      <div style={secHead}>Declaration</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          <tr><td style={{ ...headS, width: "25%" }}>Inspector Name</td><td style={cellS}>{eicr.inspector || eicr.inspectorName || "—"}</td><td style={{ ...headS, width: "25%" }}>Company</td><td style={cellS}>{eicr.company || "Ohmnium Electrical"}</td></tr>
          <tr><td style={headS}>Inspection Date</td><td style={cellS}>{eicr.startDate || eicr.inspectionDate || "—"}</td><td style={headS}>Next Inspection Due</td><td style={cellS}>{eicr.nextInspectionDate || "—"}</td></tr>
          <tr><td style={headS}>Signature</td><td style={{ ...cellS, height: 30 }}></td><td style={headS}>Date Signed</td><td style={{ ...cellS, height: 30 }}></td></tr>
        </tbody>
      </table>

      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 8, color: "#888", textAlign: "center", marginTop: 20, borderTop: "1px solid #ddd", paddingTop: 8 }}>
        Generated by OhmniumIQ Compliance Portal · Ohmnium Electrical Ltd · {new Date().toLocaleDateString("en-GB")}
      </div>
    </div>
  );
  }

  // Default fallback for non-EICR job types — basic job summary cert
  return (
    <div ref={certRef} style={{ width: 794, background: "#fff", padding: "30px 40px", boxSizing: "border-box" }}>
      <div style={{ borderBottom: "3px solid #2a4a8d", paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: 16, fontWeight: 700, color: "#2a4a8d" }}>{job.type.toUpperCase()} CERTIFICATE</div>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10, color: "#555", marginTop: 2 }}>Ref: {job.ref}</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          <tr><td style={{ ...headS, width: "25%" }}>Property Address</td><td style={cellS} colSpan={3}>{property?.address || "—"}</td></tr>
          <tr><td style={headS}>Tenant</td><td style={cellS}>{property?.tenant_name || "—"}</td><td style={headS}>Date</td><td style={cellS}>{job.scheduled_date || "—"}</td></tr>
          <tr><td style={headS}>Job Type</td><td style={cellS}>{job.type}</td><td style={headS}>Status</td><td style={cellS}>{job.status}</td></tr>
          {job.notes && <tr><td style={headS}>Notes</td><td style={cellS} colSpan={3}>{job.notes}</td></tr>}
        </tbody>
      </table>
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 8, color: "#888", textAlign: "center", marginTop: 30, borderTop: "1px solid #ddd", paddingTop: 8 }}>
        Generated by OhmniumIQ Compliance Portal · Ohmnium Electrical Ltd · {new Date().toLocaleDateString("en-GB")}
      </div>
    </div>
  );
}

// ─── PDF Generation Hook ───
function useGenerateCertificate() {
  const { updateJob, addDoc, addAudit, uploadFile, fetchAll, properties, updateProperty } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const certRef = useRef(null);
  const [generatingJobId, setGeneratingJobId] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async (job) => {
    if (generating) return;
    setGenerating(true);
    setGeneratingJobId(job.id);
    // Wait for React to render the hidden cert div
    await new Promise(r => setTimeout(r, 300));
    try {
      if (!certRef.current) throw new Error("Certificate renderer not ready");
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      // Handle multi-page if content is taller than A4
      const pageH = 297;
      if (pdfH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      } else {
        let yOff = 0;
        let page = 0;
        while (yOff < canvas.height) {
          if (page > 0) pdf.addPage();
          const sliceH = Math.min(canvas.height - yOff, (pageH / pdfW) * canvas.width);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          const sCtx = sliceCanvas.getContext("2d");
          sCtx.drawImage(canvas, 0, yOff, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          const sliceImg = sliceCanvas.toDataURL("image/png");
          const slicePdfH = (sliceH * pdfW) / canvas.width;
          pdf.addImage(sliceImg, "PNG", 0, 0, pdfW, slicePdfH);
          yOff += sliceH;
          page++;
        }
      }
      const blob = pdf.output("blob");
      const fileName = `${job.type}_${job.ref}_${Date.now()}.pdf`;
      const filePath = `${auth.orgId}/${job.id}/${fileName}`;
      const { error: uploadErr } = await uploadFile(blob, filePath);
      if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);
      const prop = properties.find(p => p.id === job.property_id);
      const certType = job.type === "EICR" ? "EICR" : job.type === "Smoke Alarm" ? "Smoke Alarm" : job.type === "PAT" ? "PAT" : job.type;
      // Calculate expiry date from inspection date (or today as fallback)
      let expiryDate = null;
      const eicr = job.eicr_data || {};
      const baseDate = new Date(eicr.inspectionDate || eicr.startDate || job.scheduled_date || new Date());
      const today = new Date().toISOString().split("T")[0];
      if (certType === "EICR") { const d = new Date(baseDate); d.setFullYear(d.getFullYear() + 5); expiryDate = d.toISOString().split("T")[0]; }
      else if (certType === "Smoke Alarm") { const d = new Date(baseDate); d.setMonth(d.getMonth() + 6); expiryDate = d.toISOString().split("T")[0]; }
      else if (certType === "PAT") { const d = new Date(baseDate); d.setFullYear(d.getFullYear() + 1); expiryDate = d.toISOString().split("T")[0]; }
      await addDoc({ jobId: job.id, propertyId: job.property_id, type: certType, filePath, fileName, expiry: expiryDate });
      await updateJob(job.id, { hasCert: true });
      // Update property compliance dates
      if (prop && expiryDate) {
        if (certType === "EICR") await updateProperty(prop.id, { lastEicr: today, expiryDate });
        else if (certType === "Smoke Alarm") await updateProperty(prop.id, { last_smoke: today, smoke_expiry: expiryDate });
        else if (certType === "PAT") await updateProperty(prop.id, { last_pat: today, pat_expiry: expiryDate });
      }
      await addAudit({ action: `Certificate generated: ${certType} for ${prop?.address?.split(",")[0] || "—"} (${job.ref})` });
      await fetchAll();
      setGeneratingJobId(null);
      setGenerating(false);
      return { success: true };
    } catch (e) {
      setGeneratingJobId(null);
      setGenerating(false);
      return { success: false, error: e.message };
    }
  }, [generating, auth, uploadFile, addDoc, updateJob, updateProperty, addAudit, fetchAll, properties]);

  return { generate, generating, generatingJobId, certRef, setGeneratingJobId };
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
      if (isUnsatisfactory(selectedJob?.eicr_data?.conditionKey) || (selectedJob?.eicr_data?.outcome || selectedJob?.eicr_data?.overallAssessment) === "Unsatisfactory") {
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
    const eicrIdx = headers.findIndex(h => h.includes("eicr") || h.includes("last") || h.includes("date"));
    if (addrIdx === -1) { setError("No 'address' column found. Check your CSV header row."); return; }
    const parsed = lines.slice(1).map((line, i) => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const addr = cols[addrIdx] || "";
      const tenant = tenantIdx >= 0 ? cols[tenantIdx] || "" : "";
      const phone = phoneIdx >= 0 ? cols[phoneIdx] || "" : "";
      const lastEicr = eicrIdx >= 0 ? cols[eicrIdx] || "" : "";
      const isDup = properties.some(p => p.address.toLowerCase() === addr.toLowerCase());
      return { addr, tenant, phone, lastEicr, isDup, row: i + 2 };
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
      await addProperty({ address: r.addr, tenant: r.tenant, phone: r.phone, lastEicr: r.lastEicr || null, expiryDate: expiry });
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
                  <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{r.tenant}{r.lastEicr ? ` · EICR: ${r.lastEicr}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 12 }}>
            Expected columns: <span style={{ color: C.accent }}>address, tenant name, phone, last eicr date</span>
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
            Upload a CSV file with your properties. The file needs an <strong style={{ color: C.accent }}>address</strong> column, and optionally: tenant name, phone, last eicr date.
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
  const { generate, generating, generatingJobId, certRef } = useGenerateCertificate();

  const pendingCertJobs = jobs.filter(j => j.status === "Completed" && !j.has_cert);
  const pendingCerts = pendingCertJobs.length;
  const pendingFormJobs = pendingCertJobs.filter(j => ["EICR", "Smoke Alarm", "PAT"].includes(j.type));

  const handleGenerateAll = async () => {
    for (const job of pendingFormJobs) {
      showToast("Generating certificate for " + job.ref + "…");
      const result = await generate(job);
      if (!result.success) { showToast("Failed: " + (result.error || job.ref)); return; }
    }
    showToast("All certificates generated");
  };

  const handleDownload = async (doc) => {
    if (!doc.file_path) { showToast("No file stored for this certificate"); return; }
    try {
      const { data, error } = await supabase.storage.from("certificates").createSignedUrl(doc.file_path, 60);
      if (error || !data?.signedUrl) { showToast("Could not retrieve file — please contact support"); console.error("Signed URL error:", error); return; }
      window.open(data.signedUrl, "_blank");
    } catch (e) { showToast("Download failed — check your connection"); console.error("Download error:", e); }
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
          <div style={{ display: "flex", gap: 8 }}>
            {pendingFormJobs.length > 0 && <button onClick={handleGenerateAll} disabled={generating} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: generating ? C.textDim : C.accent, border: "none", borderRadius: 8, padding: "8px 16px", cursor: generating ? "not-allowed" : "pointer", minHeight: 36 }}>{generating ? "Generating…" : `Generate ${pendingFormJobs.length > 1 ? `(${pendingFormJobs.length})` : "Cert"}`}</button>}
            <button onClick={() => setShowUpload(true)} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.amber, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", minHeight: 36 }}>Upload</button>
          </div>
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
      {/* Hidden certificate renderer for PDF generation */}
      {generatingJobId && (() => { const gJob = jobs.find(j => j.id === generatingJobId); return gJob ? <div style={{ position: "fixed", left: -9999, top: 0 }}><CertificateRenderer job={gJob} property={properties.find(p => p.id === gJob.property_id)} certRef={certRef} /></div> : null; })()}
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
// EICR183C — ELECTRICAL INSTALLATION CONDITION REPORT (Full BS 7671)
// ─────────────────────────────────────────────

// EICR form sub-components — defined outside EICRPage to prevent re-mount on every keystroke
function EICRField({ label, value, onChange, type = "text", placeholder = "", disabled = false }) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
        {type === "date" && !disabled && (
          <button onClick={() => onChange(today)} style={{ fontFamily: font, fontSize: 9, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 4, padding: "2px 7px", cursor: "pointer", lineHeight: 1.4 }}>Today</button>
        )}
      </div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ fontFamily: font, fontSize: 13, color: disabled ? C.textDim : C.text, background: disabled ? C.surface : C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, opacity: disabled ? 0.6 : 1 }} />
    </div>
  );
}

function EICRSection({ title, children, mob }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</h4>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>{children}</div>
    </div>
  );
}

function EICRInspectionItem({ id, label, value, onChange }) {
  const opts = [
    { key: "pass", label: "\u2713", bg: C.green }, { key: "C1", label: "C1", bg: C.red },
    { key: "C2", label: "C2", bg: C.amber }, { key: "C3", label: "C3", bg: C.accent },
    { key: "FI", label: "FI", bg: C.purple }, { key: "na", label: "N/A", bg: C.textDim },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontFamily: font, fontSize: 10, color: C.accent, width: 36, flexShrink: 0 }}>{id}</span>
      <div style={{ flex: 1, fontFamily: font, fontSize: 11, color: C.white, minWidth: 0 }}>{label}</div>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {opts.map(o => (
          <button key={o.key} onClick={() => onChange(o.key)}
            style={{ fontFamily: font, fontSize: 9, fontWeight: value === o.key ? 700 : 400, color: value === o.key ? C.white : C.textDim,
              background: value === o.key ? o.bg : C.surfaceAlt, border: `1px solid ${value === o.key ? "transparent" : C.border}`,
              borderRadius: 4, padding: "3px 5px", cursor: "pointer", minWidth: 24, minHeight: 24, lineHeight: 1 }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EICRSISection({ id, title, children, isOpen, onToggle }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.accent }}>{title}</span>
        <span style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>{isOpen ? "\u25be" : "\u25b8"}</span>
      </button>
      {isOpen && <div style={{ padding: "4px 0" }}>{children}</div>}
    </div>
  );
}
function EICRPage() {
  const { jobs, properties, updateJob, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;

  const myJobs = jobs.filter(j =>
    (j.engineer_id === auth.id || ["supervisor", "admin"].includes(auth.role)) &&
    j.status === "In Progress"
  );

  const [selectedJobId, setSelectedJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [cloneCount, setCloneCount] = useState(1);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const [form, setForm] = useState({
    // Part 1 — Contractor (read-only from CONTRACTOR constant)
    tradingTitle: CONTRACTOR.name,
    contractorAddress: CONTRACTOR.address, contractorTel: CONTRACTOR.phone,
    // Part 1 — Client
    agencyAddress: "", landlordDetails: "",
    clientAddress: "", clientPostcode: "",
    landlordName: "", agentName: "",
    // Part 1 — Installation
    installationAddress: "", installationPostcode: "", installationTel: "",
    occupiedBy: "Tenant", uprn: "",
    // Part 2 — Purpose
    purposeKey: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    recordsAvailable: true, previousReportAvailable: false, previousReportDate: "",
    // Part 3 — Summary
    generalCondition: "",
    premisesType: "Dwelling", // Dwelling | Commercial | Industrial | Other
    premisesOther: "",
    estimatedAgeRange: "", evidenceOfAlterations: false, alterationsAge: "",
    conditionKey: "",
    // Part 4 — Declaration
    inspectorName: auth.fullName || "", inspectorDate: "",
    nextInspectionDate: "", nextInspectionReason: "As per IET Guidance Note 3 Table 3.2 or change of tenancy if sooner.",
    reviewerName: "", reviewerDate: "",
    // Part 5 — Observations (dynamic rows, linked from Part 9 or manual)
    observations: [],
    noRemedialRequired: false,
    c1Items: "", c2Items: "", c3Items: "", fiItems: "",
    // Part 6 — Details and limitations
    bs7671AmendedTo: "2024",
    extentKey: "full_property",
    limitationsKey: "na",
    agreedWith: "CLIENT",
    extentOfSampling: "100% visual. 30% of accessories removed for inspection.",
    // Part 7 — Supply characteristics
    earthingSystem: "TN-S",
    supplyProtectiveBSEN: "", supplyProtectiveType: "", supplyProtectiveRating: "",
    supplyPhase: "1-phase, 2-wire",
    nominalVoltageLines: "", nominalVoltageEarth: "230", nominalFrequency: "50",
    prospectiveFaultCurrent: "", externalEarthFaultLoop: "",
    // Part 8 — Particulars
    maxDemand: "",
    earthingDistributor: true, earthingElectrode: false,
    earthElectrodeType: "None", earthElectrodeLocation: "", earthElectrodeResistance: "",
    earthingConductorMaterial: "Copper", earthingConductorCSA: "16", earthingConductorVerified: true,
    bondingConductorMaterial: "Copper", bondingConductorCSA: "10", bondingConductorVerified: true,
    bondingWater: false, bondingGas: false, bondingSteel: false, bondingOil: false, bondingLightning: false,
    mainSwitchLocation: "CCU", mainSwitchBSEN: "60947-3", mainSwitchType: "3",
    mainSwitchRating: "", mainSwitchPoles: "2", mainSwitchCurrentRating: "100", mainSwitchVoltage: "230",
    // Part 9 — Schedule of Items Inspected (grouped by section)
    // Section 1.0 Intake
    s1_1_serviceCable: "pass", s1_1_serviceHead: "pass", s1_1_earthingArrangement: "pass",
    s1_1_meterTails: "pass", s1_1_metering: "pass", s1_1_isolator: "na",
    s1_2_consumerIsolator: "na", s1_3_consumerMeterTails: "pass",
    // Section 2.0 Alternative sources
    s2_1_genSetSwitched: "na", s2_2_genSetParallel: "na",
    // Section 3.0 Methods of protection
    s3_1_mainEarthBonding: "pass", s3_1_distributorEarth: "pass", s3_1_earthingConductorSize: "pass",
    s3_1_earthingConnections: "pass", s3_1_earthingAccessibility: "pass",
    s3_1_bondingSize: "pass", s3_1_bondingLocation: "pass", s3_1_bondingAccessibility: "pass",
    s3_1_earthingLabels: "pass", s3_2_felv: "na",
    // Section 4.0 Distribution equipment
    s4_1_workingSpace: "pass", s4_2_security: "pass", s4_3_insulationLive: "pass",
    s4_4_barriers: "pass", s4_5_ipRating: "pass", s4_6_fireRating: "pass",
    s4_7_enclosureDamage: "pass", s4_8_obstacles: "na", s4_9_mainSwitches: "pass",
    s4_10_mainSwitchOp: "pass", s4_11_cbRcdOperation: "pass", s4_12_rcdTestButton: "pass",
    s4_13_rcdFaultProtection: "na", s4_14_rcdAdditional: "pass", s4_15_rcdTestNotice: "pass",
    s4_16_afddTestButton: "na", s4_17_diagrams: "pass", s4_18_altSupplyWarning: "na",
    s4_19_nextInspectionLabel: "pass", s4_20_otherLabelling: "na",
    s4_21_compatibility: "pass", s4_22_singlePole: "pass", s4_23_mechDamage: "pass",
    s4_24_emEffects: "na", s4_25_connections: "pass",
    // Section 5.0 Distribution circuits
    s5_1_conductorId: "pass", s5_2_cablesSupported: "pass", s5_3_insulationLive: "pass",
    s5_4_nonSheathed: "na", s5_5_containment: "pass", s5_6_terminated: "pass",
    s5_7_cableDamage: "pass", s5_8_currentCapacity: "pass",
    // Section 6.0 Final circuits
    s6_1_conductorId: "pass", s6_2_cablesSupported: "pass", s6_3_insulationLive: "pass",
    s6_6_currentCapacity: "pass", s6_7_protectiveDevices: "pass", s6_8_cpc: "pass",
    s6_13_rcd30mA_sockets: "pass", s6_13_rcd30mA_outdoor: "pass",
    s6_13_rcd30mA_concealed: "pass", s6_13_rcd30mA_luminaires: "pass",
    s6_18_accessories: "pass",
    // Section 7.0 Isolation and switching
    s7_1_isolators: "pass", s7_2_mechMaintenance: "pass", s7_3_emergencySwitching: "pass",
    s7_4_functionalSwitching: "pass",
    // Section 8.0 Current-using equipment
    s8_1_ipRating: "pass", s8_2_fireHazard: "pass", s8_3_enclosure: "pass",
    s8_4_environment: "pass", s8_5_security: "pass",
    s8_7_recessedLuminaires: "pass",
    // Section 9.0 Special locations
    s9_1_bathRcd: "pass", s9_1_selvPelv: "na", s9_1_shaver: "pass",
    s9_1_suppBonding: "pass", s9_1_socketDistance: "na",
    s9_1_ipRating: "pass", s9_1_zoneAccessories: "pass", s9_1_zoneEquipment: "pass",
    // Section 10.0 Prosumer
    s10_prosumer: "na",
    scheduleInspectedBy: auth.fullName || "", scheduleInspectedDate: "",
    // Part 11A — Circuit details (dynamic)
    dbDesignation: "Fusebox", dbLocation: "Hallway", dbZdb: "", dbIpf: "",
    dbPolarityConfirmed: true, spdT1: false, spdT2: false, spdT3: false, spdNA: true,
    circuits: [
      { num: "1", description: "", wiringType: "A", refMethod: "100", points: "", liveCsa: "1.5", cpcCsa: "1", maxDisconnect: "0.4", ocpBSEN: "60898", ocpType: "B", ocpRating: "6", ocpKA: "6", ocpMaxZs: "7.28", rcdBSEN: "", rcdType: "A", rcdRating: "N/A", rcdImA: "30" },
    ],
    // Part 11B — Test results (dynamic)
    testResults: [
      { num: "1", r1: "", rn: "", r2: "", r1r2: "", r2only: "", irLL: "Limitation", irLE: ">999", testV: "250", polarity: "\u2713", zs: "", rcdTime: "", rcdTestBtn: "N/A", afddTestBtn: "N/A", comments: "" },
    ],
    testInstrumentMulti: "", testedByName: auth.fullName || "", testedByPosition: "Electrician", testedByDate: "",
    company: "Ohmnium Electrical",
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const selectedJob = myJobs.find(j => j.id === selectedJobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    const job = myJobs.find(j => j.id === id);
    const prop = job ? properties.find(p => p.id === job.property_id) : null;
    if (job?.eicr_data && (job.eicr_data.isDraft || job.eicr_data.rejectionReason)) {
      const { isDraft, submittedAt, submittedBy, rejectionReason, rejectedBy, rejectedAt, ...savedFields } = job.eicr_data;
      // Backward compatibility: string observations → array
      if (typeof savedFields.observations === "string") {
        savedFields.observations = savedFields.observations ? [{ itemNo: "1", ref: "", observation: savedFields.observations, code: "C3", location: "" }] : [];
      }
      // Backward compatibility: old overallAssessment → conditionKey
      if (savedFields.overallAssessment && !savedFields.conditionKey) {
        savedFields.conditionKey = savedFields.overallAssessment === "Unsatisfactory" ? "unsatisfactory_c2" : "satisfactory_standard";
        delete savedFields.overallAssessment;
      }
      setForm(prev => ({ ...prev, ...savedFields }));
    } else if (prop) {
      setForm(prev => ({
        ...prev,
        installationAddress: prop.address || "",
        installationPostcode: prop.address?.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i)?.[0] || "",
        landlordName: prop.landlord_name || "",
        agencyAddress: "",
        landlordDetails: prop.address || "",
      }));
    }
  };

  // Observation management
  const addObs = () => setForm(prev => ({ ...prev, observations: [...prev.observations, { itemNo: String(prev.observations.length + 1), ref: "", observation: "", code: "C3", location: "" }] }));
  const removeObs = (idx) => setForm(prev => {
    const updated = prev.observations.filter((_, i) => i !== idx).map((o, i) => ({ ...o, itemNo: String(i + 1) }));
    return { ...prev, observations: updated };
  });
  const updateObs = (idx, key, val) => setForm(prev => { const o = [...prev.observations]; o[idx] = { ...o[idx], [key]: val }; return { ...prev, observations: o }; });

  // Part 9 → Part 5 linked observations
  const handlePart9Classification = (refCode, code) => {
    setForm(prev => {
      let obs = [...prev.observations];
      const existingIdx = obs.findIndex(o => o.linkedFromPart9 && o.linkedRef === refCode);
      if (code) {
        if (existingIdx >= 0) {
          obs[existingIdx] = { ...obs[existingIdx], code };
        } else {
          obs.push({ itemNo: "", ref: refCode, observation: "", code, location: "", linkedFromPart9: true, linkedRef: refCode });
        }
      } else {
        if (existingIdx >= 0) obs.splice(existingIdx, 1);
      }
      obs = obs.map((o, i) => ({ ...o, itemNo: String(i + 1) }));
      return { ...prev, observations: obs };
    });
  };

  // Circuit management
  const addCircuit = () => {
    const n = String(form.circuits.length + 1);
    setForm(prev => ({
      ...prev,
      circuits: [...prev.circuits, { num: n, description: "", wiringType: "A", refMethod: "100", points: "", liveCsa: "1.5", cpcCsa: "1", maxDisconnect: "0.4", ocpBSEN: "60898", ocpType: "B", ocpRating: "", ocpKA: "6", ocpMaxZs: "", rcdBSEN: "", rcdType: "A", rcdRating: "N/A", rcdImA: "30" }],
      testResults: [...prev.testResults, { num: n, r1: "", rn: "", r2: "", r1r2: "", r2only: "", irLL: "Limitation", irLE: ">999", testV: "250", polarity: "\u2713", zs: "", rcdTime: "", rcdTestBtn: "N/A", afddTestBtn: "N/A", comments: "" }],
    }));
  };
  const removeCircuit = (idx) => { if (form.circuits.length <= 1) return; setForm(prev => ({ ...prev, circuits: prev.circuits.filter((_, i) => i !== idx), testResults: prev.testResults.filter((_, i) => i !== idx) })); };
  const updateCircuit = (idx, key, val) => setForm(prev => { const c = [...prev.circuits]; c[idx] = { ...c[idx], [key]: val }; return { ...prev, circuits: c }; });
  const updateTestResult = (idx, key, val) => setForm(prev => { const t = [...prev.testResults]; t[idx] = { ...t[idx], [key]: val }; return { ...prev, testResults: t }; });

  const addCircuitsFromTemplate = () => {
    const template = form.circuits[form.circuits.length - 1];
    const startNum = form.circuits.length + 1;
    const newCircuits = Array.from({ length: cloneCount }, (_, i) => ({ ...template, num: String(startNum + i), description: "" }));
    const newTestResults = Array.from({ length: cloneCount }, (_, i) => ({ num: String(startNum + i), r1: "", rn: "", r2: "", r1r2: "", r2only: "", irLL: "Limitation", irLE: ">999", testV: "250", polarity: "\u2713", zs: "", rcdTime: "", rcdTestBtn: "N/A", afddTestBtn: "N/A", comments: "" }));
    setForm(prev => ({ ...prev, circuits: [...prev.circuits, ...newCircuits], testResults: [...prev.testResults, ...newTestResults] }));
  };

  const submit = async (asDraft = false) => {
    if (!selectedJobId) { showToast("Please select a job first", "error"); return; }
    setSaving(true);
    const eicrData = { ...form, formType: "EICR183C", submittedAt: new Date().toISOString(), submittedBy: auth.id, isDraft: asDraft };
    const newStatus = asDraft ? "In Progress" : (auth.role === "junior" ? "Awaiting Sign-Off" : "Completed");
    await updateJob(selectedJobId, { status: newStatus, eicrData });
    const conditionLabel = CONDITION_OPTIONS.find(o => o.value === form.conditionKey)?.label || "Not set";
    await addAudit({ action: `EICR ${asDraft ? "draft saved" : auth.role === "junior" ? "submitted for sign-off" : "completed"} — ${selectedProp?.address?.split(",")[0]} — Outcome: ${conditionLabel}${isUnsatisfactory(form.conditionKey) ? " (UNSATISFACTORY)" : ""}` });
    showToast(asDraft ? "Draft saved" : auth.role === "junior" ? "Submitted for Supervisor sign-off" : "EICR completed");
    setSaving(false);
    if (!asDraft) setSelectedJobId("");
  };

  // Collapsible section state for Part 9
  const [openSections, setOpenSections] = useState({});
  const toggleSection = (s) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, rgba(59,130,246,.1), rgba(59,130,246,.02))`, border: `1px solid rgba(59,130,246,.2)`, borderRadius: 14, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="clipboard" size={20} color={C.accent} />
        <div>
          <div style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: C.accent }}>EICR18.3C — Electrical Installation Condition Report</div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>BS 7671: 2018 (as amended) · Full 11-Part Inspection</div>
        </div>
      </div>

      {/* Job selector */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Select Job</h4>
        {myJobs.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "12px 0" }}>No active jobs assigned to you.</div>
        ) : (
          <Select label="Job" value={selectedJobId} onChange={handleJobSelect}
            options={[{ value: "", label: "— Select a job —" }, ...myJobs.map(j => {
              const p = properties.find(pp => pp.id === j.property_id);
              const rejected = j.eicr_data?.rejectionReason ? " ⚠ Rejected" : "";
              return { value: j.id, label: `${j.ref} · ${j.type} — ${p?.address?.split(",")[0] || "Unknown"}${rejected}` };
            })]} />
        )}
        {selectedJob?.eicr_data?.rejectionReason && (
          <div style={{ marginTop: 14, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", marginBottom: 4 }}>Returned by supervisor</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white }}>{selectedJob.eicr_data.rejectionReason}</div>
          </div>
        )}
      </div>

      {/* Part 1 — Contractor, Client, Installation */}
      <EICRSection mob={mob} title="Part 1 — Contractor Details">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Trading Title</label>
          <div style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", minHeight: 40, opacity: 0.8 }}>{CONTRACTOR.name}</div>
        </div>
        <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Contractor Info (read-only)</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>
            <div>{CONTRACTOR.address}</div>
            <div>Tel: {CONTRACTOR.phone}</div>
            <div>Email: {CONTRACTOR.email}</div>
          </div>
        </div>
      </EICRSection>

      <EICRSection mob={mob} title="Part 1 — Client Details (Landlord / Agent)">
        <EICRField label="Landlord Name" value={form.landlordName} onChange={v => set("landlordName", v)} placeholder="Property owner" />
        <EICRField label="Estate Agent" value={form.agentName} onChange={v => set("agentName", v)} placeholder="Managing agent" />
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Agency Address" value={form.agencyAddress} onChange={v => set("agencyAddress", v)} placeholder="Agency office address" /></div>
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Landlord / Client Details" value={form.landlordDetails} onChange={v => set("landlordDetails", v)} placeholder="Landlord address or contact details" /></div>
      </EICRSection>

      <EICRSection mob={mob} title="Part 1 — Installation Details">
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Installation Address" value={form.installationAddress} onChange={v => set("installationAddress", v)} /></div>
        <EICRField label="Postcode" value={form.installationPostcode} onChange={v => set("installationPostcode", v)} />
        <EICRField label="UPRN" value={form.uprn} onChange={v => set("uprn", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Occupied By</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Tenant", "Not Occupied"].map(opt => (
              <button key={opt} onClick={() => set("occupiedBy", opt)} style={{ fontFamily: font, fontSize: 12, fontWeight: form.occupiedBy === opt ? 600 : 400, color: form.occupiedBy === opt ? C.white : C.textMuted, background: form.occupiedBy === opt ? C.accent : C.surfaceAlt, border: `1px solid ${form.occupiedBy === opt ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, flex: 1 }}>{opt}</button>
            ))}
          </div>
        </div>
      </EICRSection>

      {/* Part 2 — Purpose */}
      <EICRSection mob={mob} title="Part 2 — Purpose of the Report">
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Purpose</label>
          <select value={form.purposeKey} onChange={e => set("purposeKey", e.target.value)}
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
            <option value="">— Select purpose —</option>
            {PURPOSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {form.purposeKey && (
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, background: C.surface, borderRadius: 8, padding: "8px 12px", marginTop: 4, lineHeight: 1.5 }}>
              {PURPOSE_OPTIONS.find(o => o.value === form.purposeKey)?.text}
            </div>
          )}
        </div>
        <EICRField label="Inspection Date" value={form.inspectionDate} onChange={v => set("inspectionDate", v)} type="date" />
        <EICRField label="Previous Report Date" value={form.previousReportDate} onChange={v => set("previousReportDate", v)} type="date" />
      </EICRSection>

      {/* Part 3 — Summary */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 3 — Summary of Condition</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Description of Premises</label>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Dwelling", "Commercial", "Industrial", "Other"].map(t => (
                  <button key={t} onClick={() => set("premisesType", t)} style={{ fontFamily: font, fontSize: 11, fontWeight: form.premisesType === t ? 700 : 400, color: form.premisesType === t ? C.white : C.textMuted, background: form.premisesType === t ? C.accent : C.surfaceAlt, border: `1px solid ${form.premisesType === t ? "transparent" : C.border}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", minHeight: 32 }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Estimated Age</label>
              <select value={form.estimatedAgeRange} onChange={e => set("estimatedAgeRange", e.target.value)}
                style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
                <option value="">— Select —</option>
                {ESTIMATED_AGE_OPTIONS.map(o => <option key={o} value={o}>{o} years</option>)}
              </select>
            </div>
            <EICRField label="Alterations Age (years)" value={form.alterationsAge} onChange={v => set("alterationsAge", v)} placeholder="e.g. 5" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>General Condition (Electrical Safety)</label>
            <select value={form.conditionKey} onChange={e => set("conditionKey", e.target.value)}
              style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
              <option value="">— Select condition —</option>
              {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {form.conditionKey && (
              <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, background: C.surface, borderRadius: 8, padding: "8px 12px", marginTop: 4, lineHeight: 1.5 }}>
                {CONDITION_OPTIONS.find(o => o.value === form.conditionKey)?.text}
              </div>
            )}
          </div>
          {isUnsatisfactory(form.conditionKey) && (
            <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert" size={16} color={C.red} />
              <span style={{ fontFamily: font, fontSize: 12, color: C.red }}>Unsatisfactory — C1/C2 conditions identified. Remedial action required urgently.</span>
            </div>
          )}
        </div>
      </div>

      {/* Part 4 — Declaration */}
      <EICRSection mob={mob} title="Part 4 — Declaration">
        <EICRField label="Inspector Name" value={form.inspectorName} onChange={v => set("inspectorName", v)} />
        <EICRField label="Inspector Date" value={form.inspectorDate} onChange={v => set("inspectorDate", v)} type="date" />
        <EICRField label="Next Inspection By (Date)" value={form.nextInspectionDate} onChange={v => set("nextInspectionDate", v)} type="date" />
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Reason for Recommendation" value={form.nextInspectionReason} onChange={v => set("nextInspectionReason", v)} /></div>
        <EICRField label="Reviewed By (QS Name)" value={form.reviewerName} onChange={v => set("reviewerName", v)} />
        <EICRField label="Reviewer Date" value={form.reviewerDate} onChange={v => set("reviewerDate", v)} type="date" />
      </EICRSection>

      {/* Part 5 — Observations */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Part 5 — Observations</h4>
          <button onClick={addObs} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", minHeight: 32 }}>+ Add observation manually</button>
        </div>
        <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: "#dc2626" }}>C1 = Danger Present</span>
          <span style={{ color: "#ea580c" }}>C2 = Potentially Dangerous</span>
          <span style={{ color: C.accent }}>C3 = Improvement Recommended</span>
          <span style={{ color: C.purple }}>FI = Further Investigation</span>
        </div>
        {form.observations.length === 0 && (
          <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, padding: "16px 0", textAlign: "center" }}>No observations yet. Observations are auto-linked when Part 9 items are classified as C1/C2/C3/FI, or add manually above.</div>
        )}
        {form.observations.map((obs, idx) => (
          <div key={idx} style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "50px 70px 70px 1fr 32px", gap: 8, alignItems: "end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase" }}>Item</label>
                <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "9px 4px", minHeight: 40, display: "flex", alignItems: "center" }}>{obs.itemNo}</div>
              </div>
              {obs.linkedFromPart9 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase" }}>Ref</label>
                  <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "9px 4px", minHeight: 40, display: "flex", alignItems: "center" }}>{obs.ref}</div>
                </div>
              ) : (
                <EICRField label="Ref" value={obs.ref} onChange={v => updateObs(idx, "ref", v)} placeholder="4.6" />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase" }}>Code</label>
                {obs.linkedFromPart9 ? (
                  <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.white, background: obs.code === "C1" ? "#dc2626" : obs.code === "C2" ? "#ea580c" : obs.code === "C3" ? C.accent : C.purple, borderRadius: 6, padding: "6px 10px", textAlign: "center", minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>{obs.code}</span>
                ) : (
                  <div style={{ display: "flex", gap: 2 }}>
                    {["C1", "C2", "C3", "FI"].map(c => (
                      <button key={c} onClick={() => updateObs(idx, "code", c)} style={{ fontFamily: font, fontSize: 9, fontWeight: obs.code === c ? 700 : 400, color: obs.code === c ? C.white : C.textDim, background: obs.code === c ? (c === "C1" ? "#dc2626" : c === "C2" ? "#ea580c" : c === "C3" ? C.accent : C.purple) : C.surface, border: "none", borderRadius: 4, padding: "4px 6px", cursor: "pointer", minHeight: 28 }}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
              <EICRField label="Location" value={obs.location} onChange={v => updateObs(idx, "location", v)} placeholder="e.g. Fusebox" />
              {!obs.linkedFromPart9 ? (
                <button onClick={() => removeObs(idx)} style={{ fontFamily: font, fontSize: 14, color: C.red, background: "transparent", border: "none", cursor: "pointer", minHeight: 40 }}>✕</button>
              ) : (
                <div style={{ fontFamily: font, fontSize: 9, color: C.textDim, textAlign: "center", minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>linked</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Part 6 — Details and Limitations */}
      <EICRSection mob={mob} title="Part 6 — Details & Limitations">
        <EICRField label="BS 7671: 2018 Amended To" value={form.bs7671AmendedTo} onChange={v => set("bs7671AmendedTo", v)} placeholder="2024" />
        <EICRField label="Agreed With" value={form.agreedWith} onChange={v => set("agreedWith", v)} placeholder="CLIENT" />
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Details of Installation Covered</label>
          <select value={form.extentKey} onChange={e => set("extentKey", e.target.value)}
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
            {EXTENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {form.extentKey && (
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, background: C.surface, borderRadius: 8, padding: "8px 12px", marginTop: 4, lineHeight: 1.5 }}>
              {EXTENT_OPTIONS.find(o => o.value === form.extentKey)?.text}
            </div>
          )}
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Agreed Limitations</label>
          <select value={form.limitationsKey} onChange={e => set("limitationsKey", e.target.value)}
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
            {LIMITATIONS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {form.limitationsKey && form.limitationsKey !== "na" && (
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, background: C.surface, borderRadius: 8, padding: "8px 12px", marginTop: 4, lineHeight: 1.5 }}>
              {LIMITATIONS_OPTIONS.find(o => o.value === form.limitationsKey)?.text}
            </div>
          )}
        </div>
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Extent of Sampling" value={form.extentOfSampling} onChange={v => set("extentOfSampling", v)} /></div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Operational Limitations (read-only)</label>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 4, lineHeight: 1.5, opacity: 0.8 }}>
            {OPERATIONAL_LIMITATIONS}
          </div>
        </div>
      </EICRSection>

      {/* Part 7 — Supply Characteristics */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 7 — Supply Characteristics</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Earthing Arrangement</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
              {["TN-C", "TN-S", "TN-C-S", "TT", "IT"].map(t => (
                <button key={t} onClick={() => set("earthingSystem", t)} style={{ fontFamily: font, fontSize: 11, fontWeight: form.earthingSystem === t ? 700 : 400, color: form.earthingSystem === t ? C.white : C.textMuted, background: form.earthingSystem === t ? C.accent : C.surfaceAlt, border: `1px solid ${form.earthingSystem === t ? "transparent" : C.border}`, borderRadius: 7, padding: "7px 12px", cursor: "pointer", minHeight: 34 }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
            <EICRField label="U₀ Voltage to Earth (V)" value={form.nominalVoltageEarth} onChange={v => set("nominalVoltageEarth", v)} />
            <EICRField label="Frequency (Hz)" value={form.nominalFrequency} onChange={v => set("nominalFrequency", v)} />
            <EICRField label="Ipf (kA)" value={form.prospectiveFaultCurrent} onChange={v => set("prospectiveFaultCurrent", v)} placeholder="e.g. 1.35" />
            <EICRField label="Ze (Ω)" value={form.externalEarthFaultLoop} onChange={v => set("externalEarthFaultLoop", v)} placeholder="e.g. 0.17" />
            <EICRField label="Max Demand (A)" value={form.maxDemand} onChange={v => set("maxDemand", v)} placeholder="e.g. 35" />
          </div>
        </div>
      </div>

      {/* Part 8 — Particulars */}
      <EICRSection mob={mob} title="Part 8 — Particulars of Installation">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Earthing Conductor (mm²)</label>
          <select value={form.earthingConductorCSA} onChange={e => set("earthingConductorCSA", e.target.value)}
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
            {["6", "10", "16"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Bonding Conductor (mm²)</label>
          <select value={form.bondingConductorCSA} onChange={e => set("bondingConductorCSA", e.target.value)}
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
            {["6", "10", "16"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <EICRField label="Main Switch Location" value={form.mainSwitchLocation} onChange={v => set("mainSwitchLocation", v)} />
        <EICRField label="Main Switch BS EN" value={form.mainSwitchBSEN} onChange={v => set("mainSwitchBSEN", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Current Rating (A)</label>
          <select value={form.mainSwitchCurrentRating} onChange={e => set("mainSwitchCurrentRating", e.target.value)}
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>
            {["100", "125"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <EICRField label="Voltage Rating (V)" value={form.mainSwitchVoltage} onChange={v => set("mainSwitchVoltage", v)} />
      </EICRSection>

      {/* Part 9 — Schedule of Items Inspected */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 9 — Schedule of Items Inspected</h4>
        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 12 }}>Tap ✓, classification code (C1/C2/C3/FI) or N/A. Sections collapse for easier navigation.</div>

        <EICRSISection id="s1" title="1.0 Intake Equipment" isOpen={openSections["s1"] !== false} onToggle={() => toggleSection("s1")}>
          <EICRInspectionItem id="1.1" label="Service cable" value={form.s1_1_serviceCable} onChange={(v) => { set("s1_1_serviceCable", v); handlePart9Classification("1.1a", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="1.1" label="Service head" value={form.s1_1_serviceHead} onChange={(v) => { set("s1_1_serviceHead", v); handlePart9Classification("1.1b", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="1.1" label="Earthing arrangement" value={form.s1_1_earthingArrangement} onChange={(v) => { set("s1_1_earthingArrangement", v); handlePart9Classification("1.1c", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="1.1" label="Meter tails" value={form.s1_1_meterTails} onChange={(v) => { set("s1_1_meterTails", v); handlePart9Classification("1.1d", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="1.1" label="Metering equipment" value={form.s1_1_metering} onChange={(v) => { set("s1_1_metering", v); handlePart9Classification("1.1e", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="1.1" label="Isolator, where present" value={form.s1_1_isolator} onChange={(v) => { set("s1_1_isolator", v); handlePart9Classification("1.1f", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="1.2" label="Consumer's isolator" value={form.s1_2_consumerIsolator} onChange={(v) => { set("s1_2_consumerIsolator", v); handlePart9Classification("1.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="1.3" label="Consumer's meter tails" value={form.s1_3_consumerMeterTails} onChange={(v) => { set("s1_3_consumerMeterTails", v); handlePart9Classification("1.3", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s2" title="2.0 Alternative Sources" isOpen={openSections["s2"] !== false} onToggle={() => toggleSection("s2")}>
          <EICRInspectionItem id="2.1" label="Generating set — switched alternative" value={form.s2_1_genSetSwitched} onChange={(v) => { set("s2_1_genSetSwitched", v); handlePart9Classification("2.1", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="2.2" label="Generating set — parallel with supply" value={form.s2_2_genSetParallel} onChange={(v) => { set("s2_2_genSetParallel", v); handlePart9Classification("2.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s3" title="3.0 Methods of Protection" isOpen={openSections["s3"] !== false} onToggle={() => toggleSection("s3")}>
          <EICRInspectionItem id="3.1" label="Main earthing / bonding arrangement" value={form.s3_1_mainEarthBonding} onChange={(v) => { set("s3_1_mainEarthBonding", v); handlePart9Classification("3.1a", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Distributor's earthing arrangement" value={form.s3_1_distributorEarth} onChange={(v) => { set("s3_1_distributorEarth", v); handlePart9Classification("3.1b", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Earthing conductor size" value={form.s3_1_earthingConductorSize} onChange={(v) => { set("s3_1_earthingConductorSize", v); handlePart9Classification("3.1c", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Earthing conductor connections" value={form.s3_1_earthingConnections} onChange={(v) => { set("s3_1_earthingConnections", v); handlePart9Classification("3.1d", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Earthing conductor accessibility" value={form.s3_1_earthingAccessibility} onChange={(v) => { set("s3_1_earthingAccessibility", v); handlePart9Classification("3.1e", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Bonding conductor sizes" value={form.s3_1_bondingSize} onChange={(v) => { set("s3_1_bondingSize", v); handlePart9Classification("3.1f", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Bonding conductor location" value={form.s3_1_bondingLocation} onChange={(v) => { set("s3_1_bondingLocation", v); handlePart9Classification("3.1g", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Bonding accessibility" value={form.s3_1_bondingAccessibility} onChange={(v) => { set("s3_1_bondingAccessibility", v); handlePart9Classification("3.1h", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.1" label="Earthing/bonding labels" value={form.s3_1_earthingLabels} onChange={(v) => { set("s3_1_earthingLabels", v); handlePart9Classification("3.1i", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="3.2" label="FELV requirements" value={form.s3_2_felv} onChange={(v) => { set("s3_2_felv", v); handlePart9Classification("3.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s4" title="4.0 Distribution Equipment" isOpen={openSections["s4"] !== false} onToggle={() => toggleSection("s4")}>
          <EICRInspectionItem id="4.1" label="Working space / accessibility" value={form.s4_1_workingSpace} onChange={(v) => { set("s4_1_workingSpace", v); handlePart9Classification("4.1", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.2" label="Security of fixing" value={form.s4_2_security} onChange={(v) => { set("s4_2_security", v); handlePart9Classification("4.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.3" label="Insulation of live parts" value={form.s4_3_insulationLive} onChange={(v) => { set("s4_3_insulationLive", v); handlePart9Classification("4.3", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.4" label="Barriers / enclosures" value={form.s4_4_barriers} onChange={(v) => { set("s4_4_barriers", v); handlePart9Classification("4.4", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.5" label="IP rating" value={form.s4_5_ipRating} onChange={(v) => { set("s4_5_ipRating", v); handlePart9Classification("4.5", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.6" label="Fire rating of enclosure" value={form.s4_6_fireRating} onChange={(v) => { set("s4_6_fireRating", v); handlePart9Classification("4.6", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.7" label="Enclosure not damaged" value={form.s4_7_enclosureDamage} onChange={(v) => { set("s4_7_enclosureDamage", v); handlePart9Classification("4.7", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.9" label="Main switch(es) present" value={form.s4_9_mainSwitches} onChange={(v) => { set("s4_9_mainSwitches", v); handlePart9Classification("4.9", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.10" label="Main switch operation" value={form.s4_10_mainSwitchOp} onChange={(v) => { set("s4_10_mainSwitchOp", v); handlePart9Classification("4.10", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.11" label="CB / RCD / AFDD manual operation" value={form.s4_11_cbRcdOperation} onChange={(v) => { set("s4_11_cbRcdOperation", v); handlePart9Classification("4.11", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.12" label="RCD test button trip" value={form.s4_12_rcdTestButton} onChange={(v) => { set("s4_12_rcdTestButton", v); handlePart9Classification("4.12", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.13" label="RCD for fault protection" value={form.s4_13_rcdFaultProtection} onChange={(v) => { set("s4_13_rcdFaultProtection", v); handlePart9Classification("4.13", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.14" label="RCD for additional protection" value={form.s4_14_rcdAdditional} onChange={(v) => { set("s4_14_rcdAdditional", v); handlePart9Classification("4.14", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.15" label="RCD 6-monthly test notice" value={form.s4_15_rcdTestNotice} onChange={(v) => { set("s4_15_rcdTestNotice", v); handlePart9Classification("4.15", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.17" label="Diagrams / charts / schedules" value={form.s4_17_diagrams} onChange={(v) => { set("s4_17_diagrams", v); handlePart9Classification("4.17", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.19" label="Next inspection label" value={form.s4_19_nextInspectionLabel} onChange={(v) => { set("s4_19_nextInspectionLabel", v); handlePart9Classification("4.19", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.21" label="Compatibility of protective devices" value={form.s4_21_compatibility} onChange={(v) => { set("s4_21_compatibility", v); handlePart9Classification("4.21", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.22" label="Single-pole switching in line conductors only" value={form.s4_22_singlePole} onChange={(v) => { set("s4_22_singlePole", v); handlePart9Classification("4.22", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="4.25" label="All connections tight and secure" value={form.s4_25_connections} onChange={(v) => { set("s4_25_connections", v); handlePart9Classification("4.25", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s5" title="5.0 Distribution Circuits" isOpen={openSections["s5"] !== false} onToggle={() => toggleSection("s5")}>
          <EICRInspectionItem id="5.1" label="Conductor identification" value={form.s5_1_conductorId} onChange={(v) => { set("s5_1_conductorId", v); handlePart9Classification("5.1", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="5.2" label="Cables correctly supported" value={form.s5_2_cablesSupported} onChange={(v) => { set("s5_2_cablesSupported", v); handlePart9Classification("5.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="5.3" label="Insulation of live parts" value={form.s5_3_insulationLive} onChange={(v) => { set("s5_3_insulationLive", v); handlePart9Classification("5.3", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="5.7" label="Cable damage / deterioration" value={form.s5_7_cableDamage} onChange={(v) => { set("s5_7_cableDamage", v); handlePart9Classification("5.7", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="5.8" label="Current-carrying capacity" value={form.s5_8_currentCapacity} onChange={(v) => { set("s5_8_currentCapacity", v); handlePart9Classification("5.8", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s6" title="6.0 Final Circuits" isOpen={openSections["s6"] !== false} onToggle={() => toggleSection("s6")}>
          <EICRInspectionItem id="6.1" label="Conductor identification" value={form.s6_1_conductorId} onChange={(v) => { set("s6_1_conductorId", v); handlePart9Classification("6.1", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.2" label="Cables correctly supported" value={form.s6_2_cablesSupported} onChange={(v) => { set("s6_2_cablesSupported", v); handlePart9Classification("6.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.6" label="Current-carrying capacity" value={form.s6_6_currentCapacity} onChange={(v) => { set("s6_6_currentCapacity", v); handlePart9Classification("6.6", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.7" label="Protective devices adequate" value={form.s6_7_protectiveDevices} onChange={(v) => { set("s6_7_protectiveDevices", v); handlePart9Classification("6.7", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.8" label="Circuit protective conductors" value={form.s6_8_cpc} onChange={(v) => { set("s6_8_cpc", v); handlePart9Classification("6.8", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.13" label="RCD ≤30mA — all sockets ≤32A" value={form.s6_13_rcd30mA_sockets} onChange={(v) => { set("s6_13_rcd30mA_sockets", v); handlePart9Classification("6.13a", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.13" label="RCD ≤30mA — outdoor mobile equip" value={form.s6_13_rcd30mA_outdoor} onChange={(v) => { set("s6_13_rcd30mA_outdoor", v); handlePart9Classification("6.13b", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.13" label="RCD ≤30mA — concealed cables <50mm" value={form.s6_13_rcd30mA_concealed} onChange={(v) => { set("s6_13_rcd30mA_concealed", v); handlePart9Classification("6.13c", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.13" label="RCD ≤30mA — luminaires (domestic)" value={form.s6_13_rcd30mA_luminaires} onChange={(v) => { set("s6_13_rcd30mA_luminaires", v); handlePart9Classification("6.13d", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="6.18" label="Accessories condition" value={form.s6_18_accessories} onChange={(v) => { set("s6_18_accessories", v); handlePart9Classification("6.18", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s7" title="7.0 Isolation & Switching" isOpen={openSections["s7"] !== false} onToggle={() => toggleSection("s7")}>
          <EICRInspectionItem id="7.1" label="Isolators" value={form.s7_1_isolators} onChange={(v) => { set("s7_1_isolators", v); handlePart9Classification("7.1", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="7.2" label="Switching off for mechanical maintenance" value={form.s7_2_mechMaintenance} onChange={(v) => { set("s7_2_mechMaintenance", v); handlePart9Classification("7.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="7.3" label="Emergency switching off" value={form.s7_3_emergencySwitching} onChange={(v) => { set("s7_3_emergencySwitching", v); handlePart9Classification("7.3", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="7.4" label="Functional switching" value={form.s7_4_functionalSwitching} onChange={(v) => { set("s7_4_functionalSwitching", v); handlePart9Classification("7.4", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s8" title="8.0 Current-Using Equipment" isOpen={openSections["s8"] !== false} onToggle={() => toggleSection("s8")}>
          <EICRInspectionItem id="8.1" label="IP rating" value={form.s8_1_ipRating} onChange={(v) => { set("s8_1_ipRating", v); handlePart9Classification("8.1", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="8.2" label="Not a fire hazard" value={form.s8_2_fireHazard} onChange={(v) => { set("s8_2_fireHazard", v); handlePart9Classification("8.2", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="8.3" label="Enclosure not damaged" value={form.s8_3_enclosure} onChange={(v) => { set("s8_3_enclosure", v); handlePart9Classification("8.3", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="8.5" label="Security of fixing" value={form.s8_5_security} onChange={(v) => { set("s8_5_security", v); handlePart9Classification("8.5", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="8.7" label="Recessed luminaires (downlighters)" value={form.s8_7_recessedLuminaires} onChange={(v) => { set("s8_7_recessedLuminaires", v); handlePart9Classification("8.7", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s9" title="9.0 Special Locations" isOpen={openSections["s9"] !== false} onToggle={() => toggleSection("s9")}>
          <EICRInspectionItem id="9.1" label="Bath/shower — RCD ≤30mA" value={form.s9_1_bathRcd} onChange={(v) => { set("s9_1_bathRcd", v); handlePart9Classification("9.1a", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="9.1" label="SELV / PELV requirements" value={form.s9_1_selvPelv} onChange={(v) => { set("s9_1_selvPelv", v); handlePart9Classification("9.1b", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="9.1" label="Shaver supply unit" value={form.s9_1_shaver} onChange={(v) => { set("s9_1_shaver", v); handlePart9Classification("9.1c", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="9.1" label="Supplementary bonding" value={form.s9_1_suppBonding} onChange={(v) => { set("s9_1_suppBonding", v); handlePart9Classification("9.1d", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="9.1" label="IP rating for zone" value={form.s9_1_ipRating} onChange={(v) => { set("s9_1_ipRating", v); handlePart9Classification("9.1e", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
          <EICRInspectionItem id="9.1" label="Equipment suitable for zone" value={form.s9_1_zoneEquipment} onChange={(v) => { set("s9_1_zoneEquipment", v); handlePart9Classification("9.1f", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>

        <EICRSISection id="s10" title="10.0 Prosumer Installation" isOpen={openSections["s10"] !== false} onToggle={() => toggleSection("s10")}>
          <EICRInspectionItem id="10.0" label="Prosumer's low voltage installation" value={form.s10_prosumer} onChange={(v) => { set("s10_prosumer", v); handlePart9Classification("10.0", ["C1","C2","C3","FI"].includes(v) ? v : null); }} />
        </EICRSISection>
      </div>

      {/* Part 11A — Circuit Details */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Part 11A — Circuit Details</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={addCircuit} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", minHeight: 32 }}>+ Blank Circuit</button>
            <span style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>or clone last circuit</span>
            <select value={cloneCount} onChange={e => setCloneCount(Number(e.target.value))} style={{ fontFamily: font, fontSize: 12, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", outline: "none", minHeight: 32, cursor: "pointer" }}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} circuit{n > 1 ? "s" : ""}</option>)}
            </select>
            <button onClick={addCircuitsFromTemplate} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.white, background: C.accent, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", minHeight: 32 }}>Clone</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12, padding: 12, background: C.surfaceAlt, borderRadius: 10 }}>
          <EICRField label="DB Designation" value={form.dbDesignation} onChange={v => set("dbDesignation", v)} />
          <EICRField label="DB Location" value={form.dbLocation} onChange={v => set("dbLocation", v)} />
          <EICRField label="Zdb (Ω)" value={form.dbZdb} onChange={v => set("dbZdb", v)} />
          <EICRField label="Ipf at DB (kA)" value={form.dbIpf} onChange={v => set("dbIpf", v)} />
        </div>
        {form.circuits.map((cir, idx) => (
          <div key={idx} style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.accent }}>Circuit {cir.num}: {cir.description || "—"}</span>
              {form.circuits.length > 1 && <button onClick={() => removeCircuit(idx)} style={{ fontFamily: font, fontSize: 10, color: C.red, background: "transparent", border: "none", cursor: "pointer" }}>Remove</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1 / -1" }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</label><select value={cir.description} onChange={e => updateCircuit(idx, "description", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">— Select or type below —</option>{CIRCUIT_DESCRIPTIONS.map(group => <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</optgroup>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Live (mm²)</label><select value={cir.liveCsa} onChange={e => updateCircuit(idx, "liveCsa", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{CABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>CPC (mm²)</label><select value={cir.cpcCsa} onChange={e => updateCircuit(idx, "cpcCsa", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{CABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <EICRField label="Points" value={cir.points} onChange={v => updateCircuit(idx, "points", v)} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>OCP Type</label><select value={cir.ocpType} onChange={e => { const nt = e.target.value; updateCircuit(idx, "ocpType", nt); const zs = MAX_ZS_LOOKUP[nt]?.[cir.ocpRating]; if (zs) updateCircuit(idx, "ocpMaxZs", zs); }} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">— Select —</option>{OCP_TYPES_NEW.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>OCP Rating</label><select value={cir.ocpRating} onChange={e => { const nr = e.target.value; updateCircuit(idx, "ocpRating", nr); const zs = MAX_ZS_LOOKUP[cir.ocpType]?.[nr]; if (zs) updateCircuit(idx, "ocpMaxZs", zs); }} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">— Select —</option>{OCP_RATINGS_NEW.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <EICRField label="Max Zs (Ω)" value={cir.ocpMaxZs} onChange={v => updateCircuit(idx, "ocpMaxZs", v)} placeholder="Auto-calculated" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>OCP BS(EN)</label><select value={cir.ocpBSEN} onChange={e => updateCircuit(idx, "ocpBSEN", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{BS_EN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Wiring Type</label><select value={cir.wiringType} onChange={e => updateCircuit(idx, "wiringType", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{WIRING_TYPES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD Type</label><select value={cir.rcdType} onChange={e => updateCircuit(idx, "rcdType", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">N/A</option>{["AC", "A", "F", "B"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD Rating (A)</label><select value={cir.rcdRating} onChange={e => updateCircuit(idx, "rcdRating", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">N/A</option>{["6", "10", "16", "20", "25", "32", "40", "63"].map(r => <option key={r} value={r}>{r}A</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD IΔn (mA)</label><select value={cir.rcdImA} onChange={e => updateCircuit(idx, "rcdImA", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">N/A</option>{RCD_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD BS(EN)</label><select value={cir.rcdBSEN} onChange={e => updateCircuit(idx, "rcdBSEN", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{BS_EN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            </div>
          </div>
        ))}
      </div>

      {/* Part 11B — Test Results */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 11B — Test Results</h4>
        {form.testResults.map((tr, idx) => (
          <div key={idx} style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 8, display: "block" }}>Circuit {tr.num}: {form.circuits[idx]?.description || "—"}</span>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: 8 }}>
              <EICRField label="r1 Line (Ω)" value={tr.r1} onChange={v => updateTestResult(idx, "r1", v)} />
              <EICRField label="rn Neutral (Ω)" value={tr.rn} onChange={v => updateTestResult(idx, "rn", v)} />
              <EICRField label="r2 CPC (Ω)" value={tr.r2} onChange={v => updateTestResult(idx, "r2", v)} />
              <EICRField label="R1+R2 (Ω)" value={tr.r1r2} onChange={v => updateTestResult(idx, "r1r2", v)} />
              <EICRField label="R2 only (Ω)" value={tr.r2only} onChange={v => updateTestResult(idx, "r2only", v)} />
              <EICRField label="IR L/L (MΩ)" value={tr.irLL} onChange={v => updateTestResult(idx, "irLL", v)} placeholder="Limitation" />
              <EICRField label="IR L/E (MΩ)" value={tr.irLE} onChange={v => updateTestResult(idx, "irLE", v)} placeholder=">999" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Test Voltage DC (V)</label><select value={tr.testV} onChange={e => updateTestResult(idx, "testV", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{TEST_VOLTAGES.map(v => <option key={v} value={v}>{v}V</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Polarity</label><div style={{ display: "flex", gap: 4 }}>{TOGGLE_OPTIONS.map(opt => <button key={opt} onClick={() => updateTestResult(idx, "polarity", opt)} style={{ flex: 1, fontFamily: font, fontSize: 11, fontWeight: tr.polarity === opt ? 700 : 400, color: tr.polarity === opt ? C.white : C.textMuted, background: tr.polarity === opt ? C.accent : C.surfaceAlt, border: `1px solid ${tr.polarity === opt ? C.accent : C.border}`, borderRadius: 6, padding: "6px 4px", cursor: "pointer", minHeight: 38 }}>{opt}</button>)}</div></div>
              <EICRField label="Zs (Ω)" value={tr.zs} onChange={v => updateTestResult(idx, "zs", v)} />
              <EICRField label="RCD Time (ms)" value={tr.rcdTime} onChange={v => updateTestResult(idx, "rcdTime", v)} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD Test Button</label><div style={{ display: "flex", gap: 4 }}>{TOGGLE_OPTIONS.map(opt => <button key={opt} onClick={() => updateTestResult(idx, "rcdTestBtn", opt)} style={{ flex: 1, fontFamily: font, fontSize: 11, fontWeight: tr.rcdTestBtn === opt ? 700 : 400, color: tr.rcdTestBtn === opt ? C.white : C.textMuted, background: tr.rcdTestBtn === opt ? C.accent : C.surfaceAlt, border: `1px solid ${tr.rcdTestBtn === opt ? C.accent : C.border}`, borderRadius: 6, padding: "6px 4px", cursor: "pointer", minHeight: 38 }}>{opt}</button>)}</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>AFDD Test Button</label><div style={{ display: "flex", gap: 4 }}>{TOGGLE_OPTIONS.map(opt => <button key={opt} onClick={() => updateTestResult(idx, "afddTestBtn", opt)} style={{ flex: 1, fontFamily: font, fontSize: 11, fontWeight: tr.afddTestBtn === opt ? 700 : 400, color: tr.afddTestBtn === opt ? C.white : C.textMuted, background: tr.afddTestBtn === opt ? C.accent : C.surfaceAlt, border: `1px solid ${tr.afddTestBtn === opt ? C.accent : C.border}`, borderRadius: 6, padding: "6px 4px", cursor: "pointer", minHeight: 38 }}>{opt}</button>)}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><EICRField label="Comments" value={tr.comments} onChange={v => updateTestResult(idx, "comments", v)} /></div>
            </div>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <EICRField label="Tested By" value={form.testedByName} onChange={v => set("testedByName", v)} />
          <EICRField label="Multi-function Serial" value={form.testInstrumentMulti} onChange={v => set("testInstrumentMulti", v)} />
          <EICRField label="Date" value={form.testedByDate} onChange={v => set("testedByDate", v)} type="date" />
        </div>
      </div>

      {/* Submit */}
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
// DFPM25 — FIRE ALARM INSPECTION FORM
// ─────────────────────────────────────────────
function DFPM25Page() {
  const { jobs, properties, updateJob, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;

  const myJobs = jobs.filter(j =>
    (j.engineer_id === auth.id || ["supervisor", "admin"].includes(auth.role)) &&
    j.status === "In Progress" &&
    (j.type === "Smoke Alarm" || j.type === "Fire Alarm")
  );

  const [selectedJobId, setSelectedJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const [form, setForm] = useState({
    // Part 1 — Contractor (auto-filled)
    contractorName: auth.fullName || "", tradingTitle: "Ohmnium Electrical",
    contractorAddress: "", contractorPostcode: "", contractorTel: "",
    // Part 1 — Client (landlord / agent)
    clientRefNo: "", clientName: "", clientAddress: "", clientPostcode: "", clientTel: "",
    // Part 1 — Installation
    installationAddress: "", installationPostcode: "", installationTel: "",
    occupiedBy: "Tenant", // Tenant | Not Occupied
    landlordName: "", agentName: "",
    // Part 2 — System Grade & Category
    systemGrade: "D2", // C | D1 | D2 | F1 | F2
    systemCategory: "LD3", // LD1 | LD2 | LD3 | PD1 | PD2
    totalDetectors: "", heatDetectors: "0", smokeDetectors: "",
    replacementDate: "",
    // Part 3 — Inspection Limitations & Observations
    extentOfInspection: "",
    observations: "",
    // Part 4 — Inspection Checklist (10 items from the DFPM25)
    check1_testButtons: "", // ✓ | ✗ | N/A
    check2_allAlarms: "",
    check3_smokeTest: "",
    check4_heatTest: "",
    check5_correctlySited: "",
    check6_bedroomSound: "",
    check7_dedicatedCircuit: "",
    check8_protectiveDevicesLabelled: "",
    check9_mainsFailure: "",
    check10_hushSystem: "",
    // Sound level instrument
    soundMake: "", soundModel: "", soundSerial: "",
    // Part 5 — Declaration
    outcome: "Satisfactory", // Satisfactory | Unsatisfactory
    variations: "",
    inspectorName: auth.fullName || "",
    inspectionDate: new Date().toISOString().split("T")[0],
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const selectedJob = myJobs.find(j => j.id === selectedJobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    const job = myJobs.find(j => j.id === id);
    const prop = job ? properties.find(p => p.id === job.property_id) : null;
    if (job?.eicr_data && (job.eicr_data.isDraft || job.eicr_data.rejectionReason)) {
      const { isDraft, submittedAt, submittedBy, rejectionReason, rejectedBy, rejectedAt, ...savedFields } = job.eicr_data;
      setForm(prev => ({ ...prev, ...savedFields }));
    } else if (prop) {
      setForm(prev => ({
        ...prev,
        installationAddress: prop.address || "",
        installationPostcode: prop.address?.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i)?.[0] || "",
        landlordName: prop.landlord_name || "",
        clientName: prev.clientName || "",
      }));
    }
  };

  const allChecksCompleted = () => {
    const checks = [form.check1_testButtons, form.check2_allAlarms, form.check3_smokeTest, form.check4_heatTest, form.check5_correctlySited, form.check6_bedroomSound, form.check7_dedicatedCircuit, form.check8_protectiveDevicesLabelled, form.check9_mainsFailure, form.check10_hushSystem];
    return checks.every(c => c === "pass" || c === "fail" || c === "na");
  };

  const submit = async (asDraft = false) => {
    if (!selectedJobId) { showToast("Please select a job first", "error"); return; }
    if (!asDraft && !allChecksCompleted()) { showToast("Please complete all inspection checks before submitting", "error"); return; }
    setSaving(true);
    const eicrData = { ...form, formType: "DFPM25", submittedAt: new Date().toISOString(), submittedBy: auth.id, isDraft: asDraft };
    const newStatus = asDraft ? "In Progress" : (auth.role === "junior" ? "Awaiting Sign-Off" : "Completed");
    await updateJob(selectedJobId, { status: newStatus, eicrData });
    await addAudit({ action: `DFPM25 Fire Alarm ${asDraft ? "draft saved" : auth.role === "junior" ? "submitted for sign-off" : "completed"} — ${selectedProp?.address?.split(",")[0]} — Outcome: ${form.outcome}` });
    showToast(asDraft ? "Draft saved" : auth.role === "junior" ? "Submitted for Supervisor sign-off" : "Fire Alarm cert completed");
    setSaving(false);
    if (!asDraft) setSelectedJobId("");
  };



  // Triple-state check button component (Pass / Fail / N/A)
  const CheckItem = ({ num, label, clauseRef, fieldKey }) => {
    const val = form[fieldKey];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.green, width: 24, flexShrink: 0 }}>{num}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: font, fontSize: 12, color: C.white }}>{label}</div>
          {clauseRef && <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginTop: 2 }}>{clauseRef}</div>}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[
            { key: "pass", label: "✓", bg: C.green },
            { key: "fail", label: "✗", bg: C.red },
            { key: "na", label: "N/A", bg: C.textDim },
          ].map(opt => (
            <button key={opt.key} onClick={() => set(fieldKey, opt.key)}
              style={{ fontFamily: font, fontSize: 11, fontWeight: val === opt.key ? 700 : 400, color: val === opt.key ? C.white : C.textMuted,
                background: val === opt.key ? opt.bg : C.surfaceAlt, border: `1px solid ${val === opt.key ? "transparent" : C.border}`,
                borderRadius: 6, padding: "5px 10px", cursor: "pointer", minWidth: 36, minHeight: 32 }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Header badge */}
      <div style={{ background: `linear-gradient(135deg, rgba(16,185,129,.1), rgba(16,185,129,.02))`, border: `1px solid rgba(16,185,129,.2)`, borderRadius: 14, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="zap" size={20} color={C.green} />
        <div>
          <div style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: C.green }}>DFPM25 — Fire Detection & Alarm Certificate</div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>Grade C, D or F Systems in Domestic Premises · BS 5839-6</div>
        </div>
      </div>

      {/* Job selector */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.green, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Select Job</h4>
        {myJobs.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "12px 0" }}>No active Fire Alarm / Smoke Alarm jobs assigned to you.</div>
        ) : (
          <Select label="Job" value={selectedJobId} onChange={handleJobSelect}
            options={[{ value: "", label: "— Select a job —" }, ...myJobs.map(j => {
              const p = properties.find(pp => pp.id === j.property_id);
              const rejected = j.eicr_data?.rejectionReason ? " ⚠ Rejected" : "";
              return { value: j.id, label: `${j.ref} · ${j.type} — ${p?.address?.split(",")[0] || "Unknown"}${rejected}` };
            })]} />
        )}
        {selectedJob?.eicr_data?.rejectionReason && (
          <div style={{ marginTop: 14, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Returned by supervisor</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white }}>{selectedJob.eicr_data.rejectionReason}</div>
          </div>
        )}
      </div>

      {/* Part 1 — Contractor Details (auto-filled) */}
      <EICRSection mob={mob} title="Part 1 — Contractor Details">
        <EICRField label="Trading Title" value={form.tradingTitle} onChange={v => set("tradingTitle", v)} />
        <EICRField label="Name" value={form.contractorName} onChange={v => set("contractorName", v)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <EICRField label="Address" value={form.contractorAddress} onChange={v => set("contractorAddress", v)} />
        </div>
        <EICRField label="Postcode" value={form.contractorPostcode} onChange={v => set("contractorPostcode", v)} />
        <EICRField label="Tel No" value={form.contractorTel} onChange={v => set("contractorTel", v)} />
      </EICRSection>

      {/* Part 1 — Client Details (Landlord / Agent) */}
      <EICRSection mob={mob} title="Part 1 — Client Details (Landlord / Agent)">
        <EICRField label="Landlord Name" value={form.landlordName} onChange={v => set("landlordName", v)} placeholder="Property owner" />
        <EICRField label="Estate Agent" value={form.agentName} onChange={v => set("agentName", v)} placeholder="Managing agent" />
        <EICRField label="Reference Number (RN)" value={form.clientRefNo} onChange={v => set("clientRefNo", v)} />
        <EICRField label="Client Name" value={form.clientName} onChange={v => set("clientName", v)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <EICRField label="Client Address" value={form.clientAddress} onChange={v => set("clientAddress", v)} />
        </div>
        <EICRField label="Postcode" value={form.clientPostcode} onChange={v => set("clientPostcode", v)} />
        <EICRField label="Tel No" value={form.clientTel} onChange={v => set("clientTel", v)} />
      </EICRSection>

      {/* Part 1 — Installation Details */}
      <EICRSection mob={mob} title="Part 1 — Installation Details">
        <div style={{ gridColumn: "1 / -1" }}>
          <EICRField label="Installation Address" value={form.installationAddress} onChange={v => set("installationAddress", v)} />
        </div>
        <EICRField label="Postcode" value={form.installationPostcode} onChange={v => set("installationPostcode", v)} />
        <EICRField label="Tel No" value={form.installationTel} onChange={v => set("installationTel", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Occupied By</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Tenant", "Not Occupied"].map(opt => (
              <button key={opt} onClick={() => set("occupiedBy", opt)}
                style={{ fontFamily: font, fontSize: 12, fontWeight: form.occupiedBy === opt ? 600 : 400, color: form.occupiedBy === opt ? C.white : C.textMuted,
                  background: form.occupiedBy === opt ? C.green : C.surfaceAlt, border: `1px solid ${form.occupiedBy === opt ? "transparent" : C.border}`,
                  borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, flex: 1 }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </EICRSection>

      {/* Part 2 — System Grade & Category */}
      <EICRSection mob={mob} title="Part 2 — System Grade & Category">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>System Grade</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["C", "D1", "D2", "F1", "F2"].map(g => (
              <button key={g} onClick={() => set("systemGrade", g)}
                style={{ fontFamily: font, fontSize: 12, fontWeight: form.systemGrade === g ? 700 : 400, color: form.systemGrade === g ? C.white : C.textMuted,
                  background: form.systemGrade === g ? C.green : C.surfaceAlt, border: `1px solid ${form.systemGrade === g ? "transparent" : C.border}`,
                  borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36 }}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>System Category</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["LD1", "LD2", "LD3", "PD1", "PD2"].map(c => (
              <button key={c} onClick={() => set("systemCategory", c)}
                style={{ fontFamily: font, fontSize: 12, fontWeight: form.systemCategory === c ? 700 : 400, color: form.systemCategory === c ? C.white : C.textMuted,
                  background: form.systemCategory === c ? C.green : C.surfaceAlt, border: `1px solid ${form.systemCategory === c ? "transparent" : C.border}`,
                  borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36 }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <EICRField label="Total Number of Detectors/Alarms" value={form.totalDetectors} onChange={v => set("totalDetectors", v)} placeholder="e.g. 3" />
        <EICRField label="Heat Detectors" value={form.heatDetectors} onChange={v => set("heatDetectors", v)} placeholder="0" />
        <EICRField label="Smoke Detectors" value={form.smokeDetectors} onChange={v => set("smokeDetectors", v)} placeholder="e.g. 1" />
        <EICRField label="Reference & Replacement Date" value={form.replacementDate} onChange={v => set("replacementDate", v)} placeholder="e.g. 2035" />
      </EICRSection>

      {/* Part 3 — Inspection Limitations & Observations */}
      <EICRSection mob={mob} title="Part 3 — Inspection Limitations & Observations">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Extent of Fire Detection & Alarm System Covered</label>
          <textarea value={form.extentOfInspection} onChange={e => set("extentOfInspection", e.target.value)} placeholder="e.g. Communal area landings, all floors…"
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 80, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Observations on Existing Installation</label>
          <textarea value={form.observations} onChange={e => set("observations", e.target.value)} placeholder="e.g. Good standard, all alarms operational…"
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 80, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
        </div>
      </EICRSection>

      {/* Part 4 — Inspection Checklist */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.green, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 4 — Inspection Checklist</h4>
        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 16 }}>Tap ✓ (pass), ✗ (fail) or N/A for each item — per BS 5839-6</div>
        <CheckItem num="1" label="Test buttons checked" clauseRef="Clause 25.2 c)" fieldKey="check1_testButtons" />
        <CheckItem num="2" label="ALL alarm warning devices operate" clauseRef="Clause 23.3 n)5)" fieldKey="check2_allAlarms" />
        <CheckItem num="3" label="Simulated smoke or aerosol test" clauseRef="Clause 23.3 n)1)" fieldKey="check3_smokeTest" />
        <CheckItem num="4" label="Heat test" clauseRef="Clause 23.3 n)1)" fieldKey="check4_heatTest" />
        <CheckItem num="5" label="Correctly sited" clauseRef="Clause 11.2" fieldKey="check5_correctlySited" />
        <CheckItem num="6" label="Bedroom sound level" clauseRef="Clause 13.2 e)" fieldKey="check6_bedroomSound" />
        <CheckItem num="7" label="Dedicated or regularly used lighting circuit(s)" clauseRef="Clause 15.4 a)" fieldKey="check7_dedicatedCircuit" />
        <CheckItem num="8" label="Protective devices labelled" clauseRef="Clause 15.3 b) or 15.4 b)" fieldKey="check8_protectiveDevicesLabelled" />
        <CheckItem num="9" label="Audible and visual indication of mains failure" clauseRef="Clauses 15.3 a)1) & 15.4 e)" fieldKey="check9_mainsFailure" />
        <CheckItem num="10" label="Hush/silencing system checked" clauseRef="Clause 17.4 g)" fieldKey="check10_hushSystem" />
      </div>

      {/* Sound Level Instrument (optional) */}
      <EICRSection mob={mob} title="Sound Level Test Instrument (if used)">
        <EICRField label="Make" value={form.soundMake} onChange={v => set("soundMake", v)} placeholder="N/A if not used" />
        <EICRField label="Model" value={form.soundModel} onChange={v => set("soundModel", v)} placeholder="N/A" />
        <EICRField label="Serial No" value={form.soundSerial} onChange={v => set("soundSerial", v)} placeholder="N/A" />
      </EICRSection>

      {/* Part 5 — Declaration & Outcome */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.green, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 5 — Declaration</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Overall Outcome</label>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {["Satisfactory", "Unsatisfactory"].map(o => (
                <button key={o} onClick={() => set("outcome", o)}
                  style={{ fontFamily: font, fontSize: 12, fontWeight: form.outcome === o ? 600 : 400, color: form.outcome === o ? C.white : C.textMuted,
                    background: form.outcome === o ? (o === "Satisfactory" ? C.green : C.red) : C.surfaceAlt,
                    border: `1px solid ${form.outcome === o ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          {form.outcome === "Unsatisfactory" && (
            <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert" size={16} color={C.red} />
              <span style={{ fontFamily: font, fontSize: 12, color: C.red }}>An <strong>Unsatisfactory</strong> outcome will flag this property for remedial action.</span>
            </div>
          )}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Variations from BS 5839-6 (if any)</label>
            <textarea value={form.variations} onChange={e => set("variations", e.target.value)} placeholder="N/A if none"
              style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 60, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <EICRField label="Inspector Name" value={form.inspectorName} onChange={v => set("inspectorName", v)} />
            <EICRField label="Inspection Date" value={form.inspectionDate} onChange={v => set("inspectionDate", v)} type="date" />
          </div>
        </div>
      </div>

      {/* Submit / Draft buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
        {auth.role === "junior" && (
          <div style={{ flex: 1, fontFamily: font, fontSize: 11, color: C.purple, background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "8px 12px" }}>
            ℹ️ As a Junior Engineer, your completed certificates are sent to a Supervisor for sign-off.
          </div>
        )}
        <button onClick={() => submit(true)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          Save Draft
        </button>
        <button onClick={() => submit(false)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: selectedJobId ? C.green : C.textDim, border: "none", borderRadius: 10, padding: "10px 24px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : auth.role === "junior" ? "Submit for Sign-Off" : "Complete Certificate"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EPM25 — EMERGENCY LIGHTING PERIODIC INSPECTION
// ─────────────────────────────────────────────
function EPM25Page() {
  const { jobs, properties, updateJob, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;

  const myJobs = jobs.filter(j =>
    (j.engineer_id === auth.id || ["supervisor", "admin"].includes(auth.role)) &&
    j.status === "In Progress" &&
    (j.type === "Emergency Lighting" || j.type === "Smoke Alarm")
  );

  const [selectedJobId, setSelectedJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const [form, setForm] = useState({
    // Part 1 — Contractor
    tradingTitle: "Ohmnium Electrical", contractorName: auth.fullName || "",
    contractorAddress: "", contractorPostcode: "", contractorTel: "",
    // Part 1 — Client (landlord / agent)
    clientRefNo: "", clientName: "", clientAddress: "", clientPostcode: "", clientTel: "",
    landlordName: "", agentName: "",
    // Part 1 — Installation
    installationAddress: "", installationPostcode: "", installationTel: "",
    occupiedBy: "Tenant",
    // Part 2 — System description
    systemDescription: "",
    // Part 7 — Installed system
    purposeEscapeLighting: false, purposeLocalArea: false, purposeStandby: false,
    purposeOpenArea: false, purposeHighRisk: false,
    arrangeSelfContained: false, arrangeCentralBattery: false,
    arrangeCombined: false, arrangeGenerator: false, arrangeOther: "",
    autoTestFitted: "No", // Yes | No
    // Classification of operation
    classType: "MAINTAINED", classMode: "COMBINED", classFacilities: "ESCAPE ROUTE",
    classDuration: "3 HOUR",
    // Additions/modifications since original
    additionsModifications: "",
    // Part 8 — Inspection checklist (19 items)
    inspectionType: "Annual", // Daily | Monthly | Annual | Five-yearly
    check1_centralPower: "", check2_selfContainedVisual: "", check3_dailyFaults: "",
    check4_emergencyMode: "", check5_luminairesSigns: "", check6_supplyRestored: "",
    check7_autoTestIndicators: "", check8_systemMonitors: "", check9_monthlyLogbook: "",
    check10_fullDurationTest: "", check11_visualInspection: "", check12_endOfDuration: "",
    check13_centralMonitors: "", check14_inhibitionMode: "", check15_obstaclesCheck: "",
    check16_annualLogbook: "", check17_precautionsApplied: "",
    check18_photometricTest: "", check19_fiveYearLogbook: "",
    // Part 9 — Test instruments
    lightMeterMake: "", lightMeterModel: "", lightMeterSerial: "",
    otherInstrumentMake: "", otherInstrumentModel: "", otherInstrumentSerial: "",
    // Part 4 — Variations
    variations: "",
    // Part 5 — Related reference documents
    relatedEICRNo: "", relatedEICRDate: "", otherDocuments: "",
    // Part 6 — Next inspection
    nextInspectionMonths: "12",
    // Part 3 — Certification
    inspectorName: auth.fullName || "", inspectorPosition: "Electrician",
    inspectionDate: new Date().toISOString().split("T")[0],
    secondSignatoryName: "", secondSignatoryPosition: "", secondSignatoryDate: "",
    outcome: "Satisfactory",
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggle = (key) => setForm(prev => ({ ...prev, [key]: !prev[key] }));

  const selectedJob = myJobs.find(j => j.id === selectedJobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    const job = myJobs.find(j => j.id === id);
    const prop = job ? properties.find(p => p.id === job.property_id) : null;
    if (job?.eicr_data && (job.eicr_data.isDraft || job.eicr_data.rejectionReason)) {
      const { isDraft, submittedAt, submittedBy, rejectionReason, rejectedBy, rejectedAt, ...savedFields } = job.eicr_data;
      setForm(prev => ({ ...prev, ...savedFields }));
    } else if (prop) {
      setForm(prev => ({
        ...prev,
        installationAddress: prop.address || "",
        installationPostcode: prop.address?.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i)?.[0] || "",
        landlordName: prop.landlord_name || "",
      }));
    }
  };

  // Check relevant items based on inspection type selected
  const getRequiredChecks = () => {
    const t = form.inspectionType;
    const daily = ["check1_centralPower", "check2_selfContainedVisual", "check3_dailyFaults"];
    const monthly = [...daily, "check4_emergencyMode", "check5_luminairesSigns", "check6_supplyRestored", "check7_autoTestIndicators", "check8_systemMonitors", "check9_monthlyLogbook"];
    const annual = [...monthly, "check10_fullDurationTest", "check11_visualInspection", "check12_endOfDuration", "check13_centralMonitors", "check14_inhibitionMode", "check15_obstaclesCheck", "check16_annualLogbook", "check17_precautionsApplied"];
    const fiveYear = [...annual, "check18_photometricTest", "check19_fiveYearLogbook"];
    if (t === "Five-yearly") return fiveYear;
    if (t === "Annual") return annual;
    if (t === "Monthly") return monthly;
    return daily;
  };

  const allChecksCompleted = () => {
    return getRequiredChecks().every(k => form[k] === "pass" || form[k] === "fail" || form[k] === "na");
  };

  const submit = async (asDraft = false) => {
    if (!selectedJobId) { showToast("Please select a job first", "error"); return; }
    if (!asDraft && !allChecksCompleted()) { showToast("Please complete all required inspection checks", "error"); return; }
    setSaving(true);
    const eicrData = { ...form, formType: "EPM25", submittedAt: new Date().toISOString(), submittedBy: auth.id, isDraft: asDraft };
    const newStatus = asDraft ? "In Progress" : (auth.role === "junior" ? "Awaiting Sign-Off" : "Completed");
    await updateJob(selectedJobId, { status: newStatus, eicrData });
    await addAudit({ action: `EPM25 Emergency Lighting ${asDraft ? "draft saved" : auth.role === "junior" ? "submitted for sign-off" : "completed"} — ${selectedProp?.address?.split(",")[0]} — Outcome: ${form.outcome}` });
    showToast(asDraft ? "Draft saved" : auth.role === "junior" ? "Submitted for Supervisor sign-off" : "Emergency Lighting cert completed");
    setSaving(false);
    if (!asDraft) setSelectedJobId("");
  };



  const CheckItem = ({ num, label, clauseRef, fieldKey, dimmed }) => {
    const val = form[fieldKey];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, opacity: dimmed ? 0.35 : 1, pointerEvents: dimmed ? "none" : "auto" }}>
        <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.green, width: 24, flexShrink: 0 }}>{num}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: font, fontSize: 12, color: C.white }}>{label}</div>
          {clauseRef && <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginTop: 2 }}>{clauseRef}</div>}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[
            { key: "pass", label: "✓", bg: C.green },
            { key: "fail", label: "✗", bg: C.red },
            { key: "na", label: "N/A", bg: C.textDim },
          ].map(opt => (
            <button key={opt.key} onClick={() => set(fieldKey, opt.key)}
              style={{ fontFamily: font, fontSize: 11, fontWeight: val === opt.key ? 700 : 400, color: val === opt.key ? C.white : C.textMuted,
                background: val === opt.key ? opt.bg : C.surfaceAlt, border: `1px solid ${val === opt.key ? "transparent" : C.border}`,
                borderRadius: 6, padding: "5px 10px", cursor: "pointer", minWidth: 36, minHeight: 32 }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const TickBox = ({ label, checked, onChange }) => (
    <button onClick={onChange} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: checked ? "rgba(16,185,129,.1)" : C.surfaceAlt, border: `1px solid ${checked ? "rgba(16,185,129,.3)" : C.border}`, borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
      <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? C.green : C.textDim}`, background: checked ? C.green : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {checked && <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontFamily: font, fontSize: 12, color: checked ? C.white : C.textMuted }}>{label}</span>
    </button>
  );

  const reqChecks = getRequiredChecks();
  const isMonthly = ["Monthly", "Annual", "Five-yearly"].includes(form.inspectionType);
  const isAnnual = ["Annual", "Five-yearly"].includes(form.inspectionType);
  const isFiveYear = form.inspectionType === "Five-yearly";

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Header badge */}
      <div style={{ background: `linear-gradient(135deg, rgba(16,185,129,.1), rgba(16,185,129,.02))`, border: `1px solid rgba(16,185,129,.2)`, borderRadius: 14, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="zap" size={20} color={C.green} />
        <div>
          <div style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: C.green }}>EPM25 — Emergency Lighting Certificate</div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>Periodic Inspection & Testing · BS 5266-1: 2025</div>
        </div>
      </div>

      {/* Job selector */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.green, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Select Job</h4>
        {myJobs.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "12px 0" }}>No active Emergency Lighting jobs assigned to you.</div>
        ) : (
          <Select label="Job" value={selectedJobId} onChange={handleJobSelect}
            options={[{ value: "", label: "— Select a job —" }, ...myJobs.map(j => {
              const p = properties.find(pp => pp.id === j.property_id);
              const rejected = j.eicr_data?.rejectionReason ? " ⚠ Rejected" : "";
              return { value: j.id, label: `${j.ref} · ${j.type} — ${p?.address?.split(",")[0] || "Unknown"}${rejected}` };
            })]} />
        )}
        {selectedJob?.eicr_data?.rejectionReason && (
          <div style={{ marginTop: 14, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Returned by supervisor</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white }}>{selectedJob.eicr_data.rejectionReason}</div>
          </div>
        )}
      </div>

      {/* Part 1 — Contractor */}
      <EICRSection mob={mob} title="Part 1 — Contractor Details">
        <EICRField label="Trading Title" value={form.tradingTitle} onChange={v => set("tradingTitle", v)} />
        <EICRField label="Name" value={form.contractorName} onChange={v => set("contractorName", v)} />
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Address" value={form.contractorAddress} onChange={v => set("contractorAddress", v)} /></div>
        <EICRField label="Postcode" value={form.contractorPostcode} onChange={v => set("contractorPostcode", v)} />
        <EICRField label="Tel No" value={form.contractorTel} onChange={v => set("contractorTel", v)} />
      </EICRSection>

      {/* Part 1 — Client (Landlord / Agent) */}
      <EICRSection mob={mob} title="Part 1 — Client Details (Landlord / Agent)">
        <EICRField label="Landlord Name" value={form.landlordName} onChange={v => set("landlordName", v)} placeholder="Property owner" />
        <EICRField label="Estate Agent" value={form.agentName} onChange={v => set("agentName", v)} placeholder="Managing agent" />
        <EICRField label="Reference Number (RN)" value={form.clientRefNo} onChange={v => set("clientRefNo", v)} />
        <EICRField label="Client Name" value={form.clientName} onChange={v => set("clientName", v)} />
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Client Address" value={form.clientAddress} onChange={v => set("clientAddress", v)} /></div>
        <EICRField label="Postcode" value={form.clientPostcode} onChange={v => set("clientPostcode", v)} />
        <EICRField label="Tel No" value={form.clientTel} onChange={v => set("clientTel", v)} />
      </EICRSection>

      {/* Part 1 — Installation */}
      <EICRSection mob={mob} title="Part 1 — Installation Details">
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Installation Address" value={form.installationAddress} onChange={v => set("installationAddress", v)} /></div>
        <EICRField label="Postcode" value={form.installationPostcode} onChange={v => set("installationPostcode", v)} />
        <EICRField label="Tel No" value={form.installationTel} onChange={v => set("installationTel", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Occupied By</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Tenant", "Not Occupied"].map(opt => (
              <button key={opt} onClick={() => set("occupiedBy", opt)}
                style={{ fontFamily: font, fontSize: 12, fontWeight: form.occupiedBy === opt ? 600 : 400, color: form.occupiedBy === opt ? C.white : C.textMuted,
                  background: form.occupiedBy === opt ? C.green : C.surfaceAlt, border: `1px solid ${form.occupiedBy === opt ? "transparent" : C.border}`,
                  borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, flex: 1 }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </EICRSection>

      {/* Part 2 — System Description */}
      <EICRSection mob={mob} title="Part 2 — Description of Emergency Lighting System">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Description & Extent of Installation</label>
          <textarea value={form.systemDescription} onChange={e => set("systemDescription", e.target.value)} placeholder="e.g. Communal area landings and intake cupboard"
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 80, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
        </div>
      </EICRSection>

      {/* Part 7 — Installed System Details */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.green, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 7 — Installed Emergency Lighting System</h4>

        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Purpose of Emergency Lighting</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 6, marginBottom: 16 }}>
          <TickBox label="Emergency escape lighting" checked={form.purposeEscapeLighting} onChange={() => toggle("purposeEscapeLighting")} />
          <TickBox label="Emergency local area lighting" checked={form.purposeLocalArea} onChange={() => toggle("purposeLocalArea")} />
          <TickBox label="Standby lighting" checked={form.purposeStandby} onChange={() => toggle("purposeStandby")} />
          <TickBox label="Open area (anti-panic) lighting" checked={form.purposeOpenArea} onChange={() => toggle("purposeOpenArea")} />
          <TickBox label="High-risk task area lighting" checked={form.purposeHighRisk} onChange={() => toggle("purposeHighRisk")} />
        </div>

        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Arrangement of Emergency Lighting</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 6, marginBottom: 16 }}>
          <TickBox label="Self-contained emergency lighting" checked={form.arrangeSelfContained} onChange={() => toggle("arrangeSelfContained")} />
          <TickBox label="Central battery system" checked={form.arrangeCentralBattery} onChange={() => toggle("arrangeCentralBattery")} />
          <TickBox label="Combined emergency luminaire" checked={form.arrangeCombined} onChange={() => toggle("arrangeCombined")} />
          <TickBox label="Standby generator" checked={form.arrangeGenerator} onChange={() => toggle("arrangeGenerator")} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Automatic Test System Fitted?</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Yes", "No"].map(opt => (
              <button key={opt} onClick={() => set("autoTestFitted", opt)}
                style={{ fontFamily: font, fontSize: 12, fontWeight: form.autoTestFitted === opt ? 600 : 400, color: form.autoTestFitted === opt ? C.white : C.textMuted,
                  background: form.autoTestFitted === opt ? C.green : C.surfaceAlt, border: `1px solid ${form.autoTestFitted === opt ? "transparent" : C.border}`,
                  borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Classification of Operation (Annex F, BS 5266-1)</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
          <EICRField label="Type" value={form.classType} onChange={v => set("classType", v)} placeholder="e.g. MAINTAINED" />
          <EICRField label="Mode" value={form.classMode} onChange={v => set("classMode", v)} placeholder="e.g. COMBINED" />
          <EICRField label="Facilities" value={form.classFacilities} onChange={v => set("classFacilities", v)} placeholder="e.g. ESCAPE ROUTE" />
          <EICRField label="Duration (Hours)" value={form.classDuration} onChange={v => set("classDuration", v)} placeholder="e.g. 3 HOUR" />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Additions or Modifications Since Original Installation</label>
          <textarea value={form.additionsModifications} onChange={e => set("additionsModifications", e.target.value)} placeholder="N/A if none"
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 60, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Part 8 — Inspection Checklist */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.green, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 8 — Results of Inspection & Testing</h4>
        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 12 }}>Select the inspection type — items below that level will be greyed out</div>

        {/* Inspection type selector */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
          {["Daily", "Monthly", "Annual", "Five-yearly"].map(t => (
            <button key={t} onClick={() => set("inspectionType", t)}
              style={{ fontFamily: font, fontSize: 12, fontWeight: form.inspectionType === t ? 700 : 400, color: form.inspectionType === t ? C.white : C.textMuted,
                background: form.inspectionType === t ? C.green : C.surfaceAlt, border: `1px solid ${form.inspectionType === t ? "transparent" : C.border}`,
                borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>
              {t}
            </button>
          ))}
        </div>

        {/* Daily */}
        <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 4, marginTop: 8 }}>DAILY INSPECTION (Clause 7.4.2)</div>
        <CheckItem num="1" label="Central power supply status indicators visually checked" clauseRef="" fieldKey="check1_centralPower" />
        <CheckItem num="2" label="Self-contained emergency luminaires — visual check or central monitoring" clauseRef="" fieldKey="check2_selfContainedVisual" />
        <CheckItem num="3" label="Faults/corrective actions for daily inspection recorded" clauseRef="" fieldKey="check3_dailyFaults" />

        {/* Monthly */}
        <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: isMonthly ? C.green : C.textDim, marginBottom: 4, marginTop: 16 }}>MONTHLY INSPECTION & TEST (Clause 7.4.3)</div>
        <CheckItem num="4" label="Emergency mode of each luminaire activated by simulating supply failure" clauseRef="" fieldKey="check4_emergencyMode" dimmed={!isMonthly} />
        <CheckItem num="5" label="All emergency luminaires and safety signs checked — present & functioning" clauseRef="" fieldKey="check5_luminairesSigns" dimmed={!isMonthly} />
        <CheckItem num="6" label="Supply restored and indicators checked at end of test" clauseRef="" fieldKey="check6_supplyRestored" dimmed={!isMonthly} />
        <CheckItem num="7" label="Automatic test system status indicators verified" clauseRef="" fieldKey="check7_autoTestIndicators" dimmed={!isMonthly} />
        <CheckItem num="8" label="Correct operation of system monitors verified" clauseRef="" fieldKey="check8_systemMonitors" dimmed={!isMonthly} />
        <CheckItem num="9" label="Results recorded in logbook" clauseRef="" fieldKey="check9_monthlyLogbook" dimmed={!isMonthly} />

        {/* Annual */}
        <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: isAnnual ? C.green : C.textDim, marginBottom: 4, marginTop: 16 }}>ANNUAL INSPECTION & TEST (Clause 7.4.4)</div>
        <CheckItem num="10" label="Full functional test — each luminaire operated for rated duration" clauseRef="" fieldKey="check10_fullDurationTest" dimmed={!isAnnual} />
        <CheckItem num="11" label="All luminaires & safety signs visually inspected (location, damage, dust)" clauseRef="" fieldKey="check11_visualInspection" dimmed={!isAnnual} />
        <CheckItem num="12" label="Supply restored & indicators verified at end of duration test" clauseRef="" fieldKey="check12_endOfDuration" dimmed={!isAnnual} />
        <CheckItem num="13" label="Central system monitors and indicators verified" clauseRef="" fieldKey="check13_centralMonitors" dimmed={!isAnnual} />
        <CheckItem num="14" label="Inhibition mode and rest mode operation verified (EN IEC 60598-2-22)" clauseRef="" fieldKey="check14_inhibitionMode" dimmed={!isAnnual} />
        <CheckItem num="15" label="No obstacles impeding visibility of safety signs" clauseRef="" fieldKey="check15_obstaclesCheck" dimmed={!isAnnual} />
        <CheckItem num="16" label="Results recorded in logbook" clauseRef="" fieldKey="check16_annualLogbook" dimmed={!isAnnual} />
        <CheckItem num="17" label="Precautions applied (empty building or alternate luminaires tested)" clauseRef="" fieldKey="check17_precautionsApplied" dimmed={!isAnnual} />

        {/* Five-yearly */}
        <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: isFiveYear ? C.green : C.textDim, marginBottom: 4, marginTop: 16 }}>FIVE-YEAR VERIFICATION (Clause 7.4.5)</div>
        <CheckItem num="18" label="Photometric test to verify illumination requirements (BS EN 1838)" clauseRef="" fieldKey="check18_photometricTest" dimmed={!isFiveYear} />
        <CheckItem num="19" label="Results recorded in logbook" clauseRef="" fieldKey="check19_fiveYearLogbook" dimmed={!isFiveYear} />
      </div>

      {/* Part 9 — Test Instruments */}
      <EICRSection mob={mob} title="Part 9 — Test Instruments Used">
        <EICRField label="Light Meter — Make" value={form.lightMeterMake} onChange={v => set("lightMeterMake", v)} placeholder="N/A if not used" />
        <EICRField label="Model" value={form.lightMeterModel} onChange={v => set("lightMeterModel", v)} placeholder="N/A" />
        <EICRField label="Serial No" value={form.lightMeterSerial} onChange={v => set("lightMeterSerial", v)} placeholder="N/A" />
        <EICRField label="Other Instrument — Make" value={form.otherInstrumentMake} onChange={v => set("otherInstrumentMake", v)} placeholder="N/A" />
      </EICRSection>

      {/* Part 4 — Variations */}
      <EICRSection mob={mob} title="Part 4 — Variations from BS 5266-1 & BS EN 50172">
        <div style={{ gridColumn: "1 / -1" }}>
          <textarea value={form.variations} onChange={e => set("variations", e.target.value)} placeholder="N/A if none"
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 60, resize: "vertical", width: "100%", boxSizing: "border-box" }} />
        </div>
      </EICRSection>

      {/* Part 5 — Related References */}
      <EICRSection mob={mob} title="Part 5 — Related Reference Documents">
        <EICRField label="Most Recent EICR — Report No" value={form.relatedEICRNo} onChange={v => set("relatedEICRNo", v)} placeholder="N/A" />
        <EICRField label="EICR Date" value={form.relatedEICRDate} onChange={v => set("relatedEICRDate", v)} type="date" />
        <div style={{ gridColumn: "1 / -1" }}>
          <EICRField label="Other Documents" value={form.otherDocuments} onChange={v => set("otherDocuments", v)} placeholder="N/A" />
        </div>
      </EICRSection>

      {/* Part 6 — Next Inspection + Part 3 — Certification */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.green, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Certification & Next Inspection</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Overall Outcome</label>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {["Satisfactory", "Unsatisfactory"].map(o => (
                <button key={o} onClick={() => set("outcome", o)}
                  style={{ fontFamily: font, fontSize: 12, fontWeight: form.outcome === o ? 600 : 400, color: form.outcome === o ? C.white : C.textMuted,
                    background: form.outcome === o ? (o === "Satisfactory" ? C.green : C.red) : C.surfaceAlt,
                    border: `1px solid ${form.outcome === o ? "transparent" : C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36 }}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <EICRField label="Inspector Name" value={form.inspectorName} onChange={v => set("inspectorName", v)} />
            <EICRField label="Position" value={form.inspectorPosition} onChange={v => set("inspectorPosition", v)} placeholder="Electrician" />
            <EICRField label="Inspection Date" value={form.inspectionDate} onChange={v => set("inspectionDate", v)} type="date" />
            <EICRField label="Next Inspection Interval (Months)" value={form.nextInspectionMonths} onChange={v => set("nextInspectionMonths", v)} placeholder="12" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
        {auth.role === "junior" && (
          <div style={{ flex: 1, fontFamily: font, fontSize: 11, color: C.purple, background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "8px 12px" }}>
            ℹ️ As a Junior Engineer, your completed certificates are sent to a Supervisor for sign-off.
          </div>
        )}
        <button onClick={() => submit(true)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          Save Draft
        </button>
        <button onClick={() => submit(false)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: selectedJobId ? C.green : C.textDim, border: "none", borderRadius: 10, padding: "10px 24px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : auth.role === "junior" ? "Submit for Sign-Off" : "Complete Certificate"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EIC183C — ELECTRICAL INSTALLATION CERTIFICATE
// ─────────────────────────────────────────────
function EIC183CPage() {
  const { jobs, properties, updateJob, addAudit } = useContext(DataContext);
  const auth = useContext(AuthContext);
  const { w } = useWindowSize();
  const mob = w < BP.mobile;

  const myJobs = jobs.filter(j =>
    (j.engineer_id === auth.id || ["supervisor", "admin"].includes(auth.role)) &&
    j.status === "In Progress" &&
    (j.type === "Remedial" || j.type === "New Installation" || j.type === "Alteration")
  );

  const [selectedJobId, setSelectedJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const [form, setForm] = useState({
    // Part 1 — Contractor
    regNo: "", branchNo: "", tradingTitle: "Ohmnium Electrical",
    contractorAddress: "", contractorPostcode: "", contractorTel: "",
    // Part 1 — Client (landlord / agent)
    clientRefNo: "", clientName: "", clientAddress: "", clientPostcode: "", clientTel: "",
    landlordName: "", agentName: "",
    // Part 1 — Installation
    installationAddress: "", installationPostcode: "", installationTel: "",
    occupiedBy: "Tenant", uprn: "",
    // Part 2 — Details of work
    dateCompleted: "", installationType: "Replacement of a distribution board", // New | Addition | Alteration | Replacement of a distribution board
    workDescription: "",
    // Part 3 — Comments on existing installation
    existingComments: "",
    // Part 4A — Declaration (single responsibility)
    declarationBS7671Date: "2024",
    departures: "",
    permittedException: "N/A", // Yes | N/A
    riskAssessmentAttached: "No", // Yes | No
    nextInspectionDate: "",
    designerName: auth.fullName || "", designerOrg: "Ohmnium Electrical", designerRegNo: "",
    designerAddress: "", designerPostcode: "",
    designerDate: "", reviewerName: "", reviewerDate: "",
    // Part 5 — Supply characteristics
    earthingSystem: "TN-S", // TN-C | TN-S | TN-C-S | TT | IT
    supplyPhase: "1-phase, 2-wire", // 1-phase 2-wire | 2-phase 3-wire | 3-phase 3-wire | 3-phase 4-wire
    supplyProtectiveDevice: "", supplyProtectiveType: "", supplyProtectiveRating: "",
    nominalVoltageLines: "", nominalVoltageEarth: "230", nominalFrequency: "50",
    prospectiveFaultCurrent: "", externalEarthFaultLoop: "",
    // Part 6 — Particulars
    maxDemand: "",
    earthingDistributor: true, earthingElectrode: false,
    earthElectrodeType: "None", earthElectrodeLocation: "", earthElectrodeResistance: "",
    earthingConductorMaterial: "Copper", earthingConductorCSA: "16", earthingConductorVerified: true,
    bondingConductorMaterial: "Copper", bondingConductorCSA: "10", bondingConductorVerified: true,
    bondingWater: true, bondingGas: true, bondingSteel: false, bondingOil: false, bondingLightning: false, bondingOther: "",
    mainSwitchLocation: "CCU", mainSwitchBSEN: "60947-3", mainSwitchType: "3",
    mainSwitchRating: "", mainSwitchPoles: "2", mainSwitchCurrentRating: "100", mainSwitchVoltage: "230",
    rcdAsMainSwitch: false, rcdRatedCurrent: "", rcdType: "", rcdTimeDelay: "", rcdMeasuredTime: "",
    // Part 7 — Schedule of items inspected (14 categories)
    inspect1_intake: "pass", inspect2_parallel: "na", inspect3_ads: "pass", inspect4_basicProtection: "pass",
    inspect5_otherMeasures: "na", inspect6_additionalProtection: "pass", inspect7_distribution: "pass",
    inspect8_circuits: "pass", inspect9_isolationSwitching: "pass", inspect10_equipment: "pass",
    inspect11_identification: "pass", inspect12_bathShower: "na", inspect13_otherSpecial: "na",
    inspect14_prosumer: "na",
    scheduleInspectedBy: auth.fullName || "", scheduleInspectedDate: "",
    // Part 9A — Circuit details (dynamic rows)
    dbDesignation: "Fusebox", dbLocation: "Hallway", dbZdb: "", dbIpf: "",
    dbPolarityConfirmed: true, dbPhaseSequence: false,
    spdT1: false, spdT2: false, spdT3: false, spdNA: true, spdStatusChecked: false,
    circuits: [
      { num: "1", description: "Lights", wiringType: "A", refMethod: "100", points: "", liveCsa: "1.5", cpcCsa: "1", maxDisconnect: "0.4", ocpBSEN: "61009", ocpType: "B", ocpRating: "6", ocpKA: "6", ocpMaxZs: "7.28", rcdBSEN: "61009", rcdType: "A", rcdRating: "6", rcdImA: "30" },
    ],
    // Part 9B — Test results (dynamic, matched to circuits)
    testResults: [
      { num: "1", r1: "", rn: "", r2: "", r1r2: "", r2only: "", irLL: "", irLE: "", testV: "250", polarity: true, zs: "", rcdTime: "", rcdTestBtn: true, afddTestBtn: "", comments: "" },
    ],
    testInstrumentMulti: "", testInstrumentContinuity: "", testInstrumentInsulation: "",
    testInstrumentLoop: "", testInstrumentEarth: "", testInstrumentRCD: "",
    testedByName: auth.fullName || "", testedByPosition: "Electrician", testedByDate: "",
    // Company
    company: "Ohmnium Electrical",
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const selectedJob = myJobs.find(j => j.id === selectedJobId);
  const selectedProp = selectedJob ? properties.find(p => p.id === selectedJob.property_id) : null;

  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    const job = myJobs.find(j => j.id === id);
    const prop = job ? properties.find(p => p.id === job.property_id) : null;
    if (job?.eicr_data && (job.eicr_data.isDraft || job.eicr_data.rejectionReason)) {
      const { isDraft, submittedAt, submittedBy, rejectionReason, rejectedBy, rejectedAt, ...savedFields } = job.eicr_data;
      setForm(prev => ({ ...prev, ...savedFields }));
    } else if (prop) {
      setForm(prev => ({
        ...prev,
        installationAddress: prop.address || "",
        installationPostcode: prop.address?.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i)?.[0] || "",
        landlordName: prop.landlord_name || "",
      }));
    }
  };

  // Circuit management
  const addCircuit = () => {
    const nextNum = String(form.circuits.length + 1);
    setForm(prev => ({
      ...prev,
      circuits: [...prev.circuits, { num: nextNum, description: "", wiringType: "A", refMethod: "100", points: "", liveCsa: "1.5", cpcCsa: "1", maxDisconnect: "0.4", ocpBSEN: "61009", ocpType: "B", ocpRating: "", ocpKA: "6", ocpMaxZs: "", rcdBSEN: "", rcdType: "", rcdRating: "", rcdImA: "" }],
      testResults: [...prev.testResults, { num: nextNum, r1: "", rn: "", r2: "", r1r2: "", r2only: "", irLL: "", irLE: "", testV: "250", polarity: true, zs: "", rcdTime: "", rcdTestBtn: true, afddTestBtn: "", comments: "" }],
    }));
  };

  const removeCircuit = (idx) => {
    if (form.circuits.length <= 1) return;
    setForm(prev => ({
      ...prev,
      circuits: prev.circuits.filter((_, i) => i !== idx),
      testResults: prev.testResults.filter((_, i) => i !== idx),
    }));
  };

  const updateCircuit = (idx, key, val) => {
    setForm(prev => {
      const c = [...prev.circuits]; c[idx] = { ...c[idx], [key]: val }; return { ...prev, circuits: c };
    });
  };

  const updateTestResult = (idx, key, val) => {
    setForm(prev => {
      const t = [...prev.testResults]; t[idx] = { ...t[idx], [key]: val }; return { ...prev, testResults: t };
    });
  };

  const submit = async (asDraft = false) => {
    if (!selectedJobId) { showToast("Please select a job first", "error"); return; }
    if (!asDraft && !form.workDescription) { showToast("Please describe the work carried out", "error"); return; }
    setSaving(true);
    const eicrData = { ...form, formType: "EIC183C", submittedAt: new Date().toISOString(), submittedBy: auth.id, isDraft: asDraft };
    const newStatus = asDraft ? "In Progress" : (auth.role === "junior" ? "Awaiting Sign-Off" : "Completed");
    await updateJob(selectedJobId, { status: newStatus, eicrData });
    await addAudit({ action: `EIC183C Installation Certificate ${asDraft ? "draft saved" : auth.role === "junior" ? "submitted for sign-off" : "completed"} — ${selectedProp?.address?.split(",")[0]} — ${form.installationType}` });
    showToast(asDraft ? "Draft saved" : auth.role === "junior" ? "Submitted for Supervisor sign-off" : "Installation Certificate completed");
    setSaving(false);
    if (!asDraft) setSelectedJobId("");
  };



  const InspectItem = ({ num, label, fieldKey }) => {
    const val = form[fieldKey];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.red, width: 24, flexShrink: 0 }}>{num}.</span>
        <div style={{ flex: 1, fontFamily: font, fontSize: 12, color: C.white }}>{label}</div>
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          {[{ key: "pass", label: "✓", bg: C.green }, { key: "na", label: "N/A", bg: C.textDim }].map(opt => (
            <button key={opt.key} onClick={() => set(fieldKey, opt.key)}
              style={{ fontFamily: font, fontSize: 10, fontWeight: val === opt.key ? 700 : 400, color: val === opt.key ? C.white : C.textMuted,
                background: val === opt.key ? opt.bg : C.surfaceAlt, border: `1px solid ${val === opt.key ? "transparent" : C.border}`,
                borderRadius: 5, padding: "4px 8px", cursor: "pointer", minWidth: 32, minHeight: 28 }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, rgba(239,68,68,.1), rgba(239,68,68,.02))`, border: `1px solid rgba(239,68,68,.2)`, borderRadius: 14, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="zap" size={20} color={C.red} />
        <div>
          <div style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: C.red }}>EIC18.3C — Electrical Installation Certificate</div>
          <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>New Installation / Alteration / DB Replacement · BS 7671: 2018</div>
        </div>
      </div>

      {/* Job selector */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.red, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Select Job</h4>
        {myJobs.length === 0 ? (
          <div style={{ fontFamily: font, fontSize: 13, color: C.textDim, padding: "12px 0" }}>No active Remedial / New Installation / Alteration jobs assigned to you.</div>
        ) : (
          <Select label="Job" value={selectedJobId} onChange={handleJobSelect}
            options={[{ value: "", label: "— Select a job —" }, ...myJobs.map(j => {
              const p = properties.find(pp => pp.id === j.property_id);
              const rejected = j.eicr_data?.rejectionReason ? " ⚠ Rejected" : "";
              return { value: j.id, label: `${j.ref} · ${j.type} — ${p?.address?.split(",")[0] || "Unknown"}${rejected}` };
            })]} />
        )}
        {selectedJob?.eicr_data?.rejectionReason && (
          <div style={{ marginTop: 14, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", marginBottom: 4 }}>Returned by supervisor</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white }}>{selectedJob.eicr_data.rejectionReason}</div>
          </div>
        )}
      </div>

      {/* Part 1 — Contractor */}
      <EICRSection mob={mob} title="Part 1 — Contractor Details">
        <EICRField label="Registration No" value={form.regNo} onChange={v => set("regNo", v)} placeholder="e.g. 615884000" />
        <EICRField label="Branch No" value={form.branchNo} onChange={v => set("branchNo", v)} placeholder="000" />
        <EICRField label="Trading Title" value={form.tradingTitle} onChange={v => set("tradingTitle", v)} />
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Address" value={form.contractorAddress} onChange={v => set("contractorAddress", v)} /></div>
        <EICRField label="Postcode" value={form.contractorPostcode} onChange={v => set("contractorPostcode", v)} />
        <EICRField label="Tel No" value={form.contractorTel} onChange={v => set("contractorTel", v)} />
      </EICRSection>

      {/* Part 1 — Client */}
      <EICRSection mob={mob} title="Part 1 — Client Details (Landlord / Agent)">
        <EICRField label="Landlord Name" value={form.landlordName} onChange={v => set("landlordName", v)} placeholder="Property owner" />
        <EICRField label="Estate Agent" value={form.agentName} onChange={v => set("agentName", v)} placeholder="Managing agent" />
        <EICRField label="Contractor Reference (CRN)" value={form.clientRefNo} onChange={v => set("clientRefNo", v)} />
        <EICRField label="Client Name" value={form.clientName} onChange={v => set("clientName", v)} />
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Client Address" value={form.clientAddress} onChange={v => set("clientAddress", v)} /></div>
        <EICRField label="Postcode" value={form.clientPostcode} onChange={v => set("clientPostcode", v)} />
        <EICRField label="Tel No" value={form.clientTel} onChange={v => set("clientTel", v)} />
      </EICRSection>

      {/* Part 1 — Installation */}
      <EICRSection mob={mob} title="Part 1 — Installation Details">
        <div style={{ gridColumn: "1 / -1" }}><EICRField label="Installation Address" value={form.installationAddress} onChange={v => set("installationAddress", v)} /></div>
        <EICRField label="Postcode" value={form.installationPostcode} onChange={v => set("installationPostcode", v)} />
        <EICRField label="UPRN" value={form.uprn} onChange={v => set("uprn", v)} placeholder="Unique Property Reference Number" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Occupied By</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Tenant", "Not Occupied"].map(opt => (
              <button key={opt} onClick={() => set("occupiedBy", opt)}
                style={{ fontFamily: font, fontSize: 12, fontWeight: form.occupiedBy === opt ? 600 : 400, color: form.occupiedBy === opt ? C.white : C.textMuted,
                  background: form.occupiedBy === opt ? C.red : C.surfaceAlt, border: `1px solid ${form.occupiedBy === opt ? "transparent" : C.border}`,
                  borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, flex: 1 }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </EICRSection>

      {/* Part 2 — Details of Work */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.red, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 2 — Details of Electrical Work</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <EICRField label="Date Works Completed" value={form.dateCompleted} onChange={v => set("dateCompleted", v)} type="date" />
          <div>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>The Installation Is</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
              {["New", "An addition", "An alteration", "Replacement of a distribution board"].map(t => (
                <button key={t} onClick={() => set("installationType", t)}
                  style={{ fontFamily: font, fontSize: 11, fontWeight: form.installationType === t ? 700 : 400, color: form.installationType === t ? C.white : C.textMuted,
                    background: form.installationType === t ? C.red : C.surfaceAlt, border: `1px solid ${form.installationType === t ? "transparent" : C.border}`,
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer", minHeight: 36 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Description & Extent of Work</label>
            <textarea value={form.workDescription} onChange={e => set("workDescription", e.target.value)} placeholder="e.g. Replacement of consumer unit (fusebox)"
              style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 80, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
          </div>
        </div>
      </div>

      {/* Part 3 — Comments on existing installation */}
      <EICRSection mob={mob} title="Part 3 — Comments on Existing Installation">
        <div style={{ gridColumn: "1 / -1" }}>
          <textarea value={form.existingComments} onChange={e => set("existingComments", e.target.value)} placeholder="e.g. In a good condition for continued use"
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 60, resize: "vertical", width: "100%", boxSizing: "border-box" }} />
        </div>
      </EICRSection>

      {/* Part 4A — Declaration */}
      <EICRSection mob={mob} title="Part 4A — Declaration">
        <EICRField label="BS 7671: 2018 Amended To (Date)" value={form.declarationBS7671Date} onChange={v => set("declarationBS7671Date", v)} placeholder="2024" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Permitted Exception (411.3.3)</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Yes", "N/A"].map(opt => (
              <button key={opt} onClick={() => set("permittedException", opt)}
                style={{ fontFamily: font, fontSize: 12, fontWeight: form.permittedException === opt ? 600 : 400, color: form.permittedException === opt ? C.white : C.textMuted,
                  background: form.permittedException === opt ? C.red : C.surfaceAlt, border: `1px solid ${form.permittedException === opt ? "transparent" : C.border}`,
                  borderRadius: 8, padding: "8px 14px", cursor: "pointer", minHeight: 36, flex: 1 }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <EICRField label="Next Inspection & Test By (Date)" value={form.nextInspectionDate} onChange={v => set("nextInspectionDate", v)} type="date" />
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Departures (if any)</label>
          <textarea value={form.departures} onChange={e => set("departures", e.target.value)} placeholder="N/A"
            style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 60, resize: "vertical", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
        </div>
        <EICRField label="Designer / Inspector Name" value={form.designerName} onChange={v => set("designerName", v)} />
        <EICRField label="Organisation" value={form.designerOrg} onChange={v => set("designerOrg", v)} />
        <EICRField label="Registration No" value={form.designerRegNo} onChange={v => set("designerRegNo", v)} />
        <EICRField label="Signature Date" value={form.designerDate} onChange={v => set("designerDate", v)} type="date" />
        <EICRField label="Reviewed By (QS Name)" value={form.reviewerName} onChange={v => set("reviewerName", v)} />
        <EICRField label="Reviewer Date" value={form.reviewerDate} onChange={v => set("reviewerDate", v)} type="date" />
      </EICRSection>

      {/* Part 5 — Supply Characteristics */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.red, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 5 — Supply Characteristics & Earthing</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>System Type & Earthing</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
              {["TN-C", "TN-S", "TN-C-S", "TT", "IT"].map(t => (
                <button key={t} onClick={() => set("earthingSystem", t)}
                  style={{ fontFamily: font, fontSize: 11, fontWeight: form.earthingSystem === t ? 700 : 400, color: form.earthingSystem === t ? C.white : C.textMuted,
                    background: form.earthingSystem === t ? C.red : C.surfaceAlt, border: `1px solid ${form.earthingSystem === t ? "transparent" : C.border}`,
                    borderRadius: 7, padding: "7px 12px", cursor: "pointer", minHeight: 34 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
            <EICRField label="Nominal Voltage to Earth, U₀ (V)" value={form.nominalVoltageEarth} onChange={v => set("nominalVoltageEarth", v)} />
            <EICRField label="Frequency (Hz)" value={form.nominalFrequency} onChange={v => set("nominalFrequency", v)} />
            <EICRField label="Prospective Fault Current, Ipf (kA)" value={form.prospectiveFaultCurrent} onChange={v => set("prospectiveFaultCurrent", v)} placeholder="e.g. 1.06" />
            <EICRField label="External Earth Fault Loop, Ze (Ω)" value={form.externalEarthFaultLoop} onChange={v => set("externalEarthFaultLoop", v)} placeholder="e.g. 0.22" />
          </div>
        </div>
      </div>

      {/* Part 6 — Particulars */}
      <EICRSection mob={mob} title="Part 6 — Particulars of Installation">
        <EICRField label="Maximum Demand (A)" value={form.maxDemand} onChange={v => set("maxDemand", v)} placeholder="e.g. 35" />
        <EICRField label="Earthing Conductor Material" value={form.earthingConductorMaterial} onChange={v => set("earthingConductorMaterial", v)} placeholder="Copper" />
        <EICRField label="Earthing Conductor CSA (mm²)" value={form.earthingConductorCSA} onChange={v => set("earthingConductorCSA", v)} placeholder="16" />
        <EICRField label="Bonding Conductor CSA (mm²)" value={form.bondingConductorCSA} onChange={v => set("bondingConductorCSA", v)} placeholder="10" />
        <EICRField label="Main Switch Location" value={form.mainSwitchLocation} onChange={v => set("mainSwitchLocation", v)} placeholder="CCU" />
        <EICRField label="Main Switch BS EN" value={form.mainSwitchBSEN} onChange={v => set("mainSwitchBSEN", v)} placeholder="60947-3" />
        <EICRField label="Main Switch Current Rating (A)" value={form.mainSwitchCurrentRating} onChange={v => set("mainSwitchCurrentRating", v)} placeholder="100" />
        <EICRField label="Main Switch Voltage (V)" value={form.mainSwitchVoltage} onChange={v => set("mainSwitchVoltage", v)} placeholder="230" />
      </EICRSection>

      {/* Part 7 — Schedule of Items Inspected */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.red, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 7 — Schedule of Items Inspected</h4>
        <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginBottom: 12 }}>Tap ✓ or N/A for each category</div>
        <InspectItem num="1" label="Condition of consumer's intake equipment" fieldKey="inspect1_intake" />
        <InspectItem num="2" label="Parallel or switched alternative sources of supply" fieldKey="inspect2_parallel" />
        <InspectItem num="3" label="Automatic disconnection of supply (ADS)" fieldKey="inspect3_ads" />
        <InspectItem num="4" label="Basic protection" fieldKey="inspect4_basicProtection" />
        <InspectItem num="5" label="Protective measures other than ADS" fieldKey="inspect5_otherMeasures" />
        <InspectItem num="6" label="Additional protection" fieldKey="inspect6_additionalProtection" />
        <InspectItem num="7" label="Distribution equipment" fieldKey="inspect7_distribution" />
        <InspectItem num="8" label="Circuits (distribution and final)" fieldKey="inspect8_circuits" />
        <InspectItem num="9" label="Isolation and switching" fieldKey="inspect9_isolationSwitching" />
        <InspectItem num="10" label="Current-using equipment (permanently connected)" fieldKey="inspect10_equipment" />
        <InspectItem num="11" label="Identification and notices" fieldKey="inspect11_identification" />
        <InspectItem num="12" label="Location(s) containing a bath or shower" fieldKey="inspect12_bathShower" />
        <InspectItem num="13" label="Other special installations or locations" fieldKey="inspect13_otherSpecial" />
        <InspectItem num="14" label="Prosumer's low voltage installation(s)" fieldKey="inspect14_prosumer" />
      </div>

      {/* Part 9A — Circuit Details */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.red, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Part 9A — Circuit Details</h4>
          <button onClick={addCircuit} style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", minHeight: 32 }}>+ Add Circuit</button>
        </div>

        {/* DB Details */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16, padding: "12px", background: C.surfaceAlt, borderRadius: 10 }}>
          <EICRField label="DB Designation" value={form.dbDesignation} onChange={v => set("dbDesignation", v)} placeholder="Fusebox" />
          <EICRField label="DB Location" value={form.dbLocation} onChange={v => set("dbLocation", v)} placeholder="Hallway" />
          <EICRField label="Zdb (Ω)" value={form.dbZdb} onChange={v => set("dbZdb", v)} placeholder="e.g. 0.22" />
          <EICRField label="Ipf at DB (kA)" value={form.dbIpf} onChange={v => set("dbIpf", v)} placeholder="e.g. 1.06" />
        </div>

        {/* Circuit rows */}
        {form.circuits.map((cir, idx) => (
          <div key={idx} style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.red }}>Circuit {cir.num}: {cir.description || "—"}</span>
              {form.circuits.length > 1 && <button onClick={() => removeCircuit(idx)} style={{ fontFamily: font, fontSize: 10, color: C.red, background: "transparent", border: "none", cursor: "pointer" }}>Remove</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1 / -1" }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</label><select value={cir.description} onChange={e => updateCircuit(idx, "description", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">— Select or type below —</option>{CIRCUIT_DESCRIPTIONS.map(group => <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</optgroup>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Live (mm²)</label><select value={cir.liveCsa} onChange={e => updateCircuit(idx, "liveCsa", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{CABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>CPC (mm²)</label><select value={cir.cpcCsa} onChange={e => updateCircuit(idx, "cpcCsa", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{CABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <EICRField label="Points" value={cir.points} onChange={v => updateCircuit(idx, "points", v)} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>OCP Type</label><select value={cir.ocpType} onChange={e => { const nt = e.target.value; updateCircuit(idx, "ocpType", nt); const zs = MAX_ZS_LOOKUP[nt]?.[cir.ocpRating]; if (zs) updateCircuit(idx, "ocpMaxZs", zs); }} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">— Select —</option>{OCP_TYPES_NEW.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>OCP Rating</label><select value={cir.ocpRating} onChange={e => { const nr = e.target.value; updateCircuit(idx, "ocpRating", nr); const zs = MAX_ZS_LOOKUP[cir.ocpType]?.[nr]; if (zs) updateCircuit(idx, "ocpMaxZs", zs); }} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">— Select —</option>{OCP_RATINGS_NEW.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <EICRField label="Max Zs (Ω)" value={cir.ocpMaxZs} onChange={v => updateCircuit(idx, "ocpMaxZs", v)} placeholder="Auto-calculated" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>OCP BS(EN)</label><select value={cir.ocpBSEN} onChange={e => updateCircuit(idx, "ocpBSEN", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{BS_EN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Wiring Type</label><select value={cir.wiringType} onChange={e => updateCircuit(idx, "wiringType", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{WIRING_TYPES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD Type</label><select value={cir.rcdType} onChange={e => updateCircuit(idx, "rcdType", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">N/A</option>{["AC", "A", "F", "B"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD IΔn (mA)</label><select value={cir.rcdImA} onChange={e => updateCircuit(idx, "rcdImA", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}><option value="">N/A</option>{RCD_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RCD BS(EN)</label><select value={cir.rcdBSEN} onChange={e => updateCircuit(idx, "rcdBSEN", e.target.value)} style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none", minHeight: 40, cursor: "pointer" }}>{BS_EN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            </div>
          </div>
        ))}
      </div>

      {/* Part 9B — Test Results */}
      <div style={{ background: C.card, borderRadius: 14, padding: mob ? 16 : 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <h4 style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.red, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Part 9B — Test Results</h4>

        {form.testResults.map((tr, idx) => (
          <div key={idx} style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 8, display: "block" }}>Circuit {tr.num}: {form.circuits[idx]?.description || "—"}</span>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 8 }}>
              <EICRField label="R1+R2 (Ω)" value={tr.r1r2} onChange={v => updateTestResult(idx, "r1r2", v)} placeholder="e.g. 0.66" />
              <EICRField label="Insulation IR L/L (MΩ)" value={tr.irLL} onChange={v => updateTestResult(idx, "irLL", v)} placeholder=">999" />
              <EICRField label="Insulation IR L/E (MΩ)" value={tr.irLE} onChange={v => updateTestResult(idx, "irLE", v)} placeholder=">999" />
              <EICRField label="Test Voltage (V)" value={tr.testV} onChange={v => updateTestResult(idx, "testV", v)} placeholder="250" />
              <EICRField label="Zs (Ω)" value={tr.zs} onChange={v => updateTestResult(idx, "zs", v)} placeholder="e.g. 0.88" />
              <EICRField label="RCD Time (ms)" value={tr.rcdTime} onChange={v => updateTestResult(idx, "rcdTime", v)} placeholder="e.g. 28" />
              <EICRField label="Comments" value={tr.comments} onChange={v => updateTestResult(idx, "comments", v)} placeholder="" />
            </div>
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
          <EICRField label="Tested By" value={form.testedByName} onChange={v => set("testedByName", v)} />
          <EICRField label="Position" value={form.testedByPosition} onChange={v => set("testedByPosition", v)} />
          <EICRField label="Date" value={form.testedByDate} onChange={v => set("testedByDate", v)} type="date" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <EICRField label="Multi-function Instrument Serial" value={form.testInstrumentMulti} onChange={v => set("testInstrumentMulti", v)} placeholder="e.g. 101672538" />
          <EICRField label="Continuity Serial" value={form.testInstrumentContinuity} onChange={v => set("testInstrumentContinuity", v)} placeholder="N/A" />
          <EICRField label="RCD Tester Serial" value={form.testInstrumentRCD} onChange={v => set("testInstrumentRCD", v)} placeholder="N/A" />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
        {auth.role === "junior" && (
          <div style={{ flex: 1, fontFamily: font, fontSize: 11, color: C.purple, background: C.purpleBg, border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "8px 12px" }}>
            ℹ️ As a Junior Engineer, your completed certificates are sent to a Supervisor for sign-off.
          </div>
        )}
        <button onClick={() => submit(true)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          Save Draft
        </button>
        <button onClick={() => submit(false)} disabled={saving || !selectedJobId}
          style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: selectedJobId ? C.red : C.textDim, border: "none", borderRadius: 10, padding: "10px 24px", cursor: selectedJobId ? "pointer" : "not-allowed", minHeight: 44, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : auth.role === "junior" ? "Submit for Sign-Off" : "Complete Certificate"}
        </button>
      </div>
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
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const queue = jobs.filter(j => j.status === "Awaiting Sign-Off");

  const approve = async (job) => {
    await updateJob(job.id, { status: "Completed" });
    const prop = properties.find(p => p.id === job.property_id);
    const eData = job.eicr_data || {};
    const condObj = CONDITION_OPTIONS.find(o => o.value === eData.conditionKey);
    const outcomeLabel = condObj?.label || eData.outcome || eData.overallAssessment || "—";
    const isUnsat = isUnsatisfactory(eData.conditionKey) || (eData.outcome || eData.overallAssessment) === "Unsatisfactory";
    await addAudit({ action: `EICR signed off by ${auth.fullName} — ${prop?.address?.split(",")[0]} — Outcome: ${outcomeLabel}` });
    if (isUnsat) {
      await addJob({ propertyId: job.property_id, type: "Remedial", status: "Pending", notes: `Auto-created from unsatisfactory EICR — ${job.ref}` });
      await addAudit({ action: `Remedial job auto-created from unsatisfactory EICR (${job.ref})`, userName: "System", userRole: "Auto" });
    }
    await fetchAll();
    setSelectedJob(null);
    showToast("EICR signed off" + (isUnsat ? " · Remedial job created" : ""));
  };

  const confirmReject = async () => {
    if (!rejectJob) return;
    setRejecting(true);
    const reason = rejectReason.trim() || "No reason given";
    const prop = properties.find(p => p.id === rejectJob.property_id);
    // Store rejection reason in eicr_data so engineer sees it
    const updatedEicrData = { ...(rejectJob.eicr_data || {}), rejectionReason: reason, rejectedBy: auth.fullName, rejectedAt: new Date().toISOString() };
    await updateJob(rejectJob.id, { status: "In Progress", eicrData: updatedEicrData });
    await addAudit({ action: `EICR rejected by ${auth.fullName} — ${prop?.address?.split(",")[0]} — Reason: ${reason}` });
    await fetchAll();
    setSelectedJob(null); setRejectJob(null); setRejectReason(""); setRejecting(false);
    showToast("Returned to engineer for correction", "warning");
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} show />}

      {/* Rejection reason modal */}
      <Modal open={!!rejectJob} onClose={() => { setRejectJob(null); setRejectReason(""); }} title="Reject EICR">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white, fontWeight: 500 }}>{properties.find(p => p.id === rejectJob?.property_id)?.address?.split(",")[0]}</div>
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 3 }}>This EICR will be returned to the engineer with your feedback.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontFamily: font, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Reason for rejection</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Missing circuit schedule, observations incomplete, wrong earthing system recorded…"
              style={{ fontFamily: font, fontSize: 13, color: C.text, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", minHeight: 90, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { setRejectJob(null); setRejectReason(""); }} style={{ fontFamily: font, fontSize: 13, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44 }}>Cancel</button>
            <button onClick={confirmReject} disabled={rejecting} style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.white, background: C.red, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", minHeight: 44, opacity: rejecting ? 0.7 : 1 }}>{rejecting ? "Rejecting…" : "Reject & Return"}</button>
          </div>
        </div>
      </Modal>

      {queue.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 14, padding: 60, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <Icon name="checkCircle" size={40} color={C.green} />
          <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 600, marginTop: 16 }}>Queue is clear</div>
          <div style={{ fontFamily: font, fontSize: 12, color: C.textDim, marginTop: 6 }}>No jobs awaiting sign-off</div>
        </div>
      ) : queue.map(job => {
        const prop = properties.find(p => p.id === job.property_id);
        const eng = engineers.find(e => e.id === job.engineer_id);
        const eicr = job.eicr_data || {};
        const isOpen = selectedJob?.id === job.id;
        return (
          <div key={job.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mob ? "16px" : "20px 24px", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: C.purpleBg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="clipboard" size={20} color={C.purple} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: font, fontSize: 14, color: C.white, fontWeight: 500 }}>{prop?.address?.split(",")[0] || "—"}</div>
                  <div style={{ fontFamily: font, fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                    {eng?.full_name || "—"} · {job.ref}
                    {(() => { const co = CONDITION_OPTIONS.find(o => o.value === eicr.conditionKey); const lbl = co?.label || eicr.outcome || eicr.overallAssessment; return lbl ? <span style={{ marginLeft: 10, color: isUnsatisfactory(eicr.conditionKey) || lbl === "Unsatisfactory" ? C.red : C.green, fontWeight: 600 }}>{lbl}</span> : null; })()}
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
                {job.eicr_data ? (<>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
                  {[
                    ["Client / Landlord", eicr.clientName || eicr.landlordName], ["Address", eicr.clientAddress || eicr.installationAddress], ["Purpose", eicr.purpose],
                    ["Earthing System", eicr.typeOfEarthingSystem || eicr.earthingSystem], ["Supply Voltage", eicr.supplyVoltage ? eicr.supplyVoltage + "V" : eicr.nominalVoltageEarth ? eicr.nominalVoltageEarth + "V" : ""], ["Earth Fault Loop Ze", eicr.earthFaultLoop ? eicr.earthFaultLoop + " Ω" : eicr.externalEarthFaultLoop ? eicr.externalEarthFaultLoop + " Ω" : ""],
                    ["DB Make", eicr.dbMake], ["DB Location", eicr.dbLocation], ["Form Type", eicr.formType || "EICR"],
                    ["Inspector", eicr.inspector || eicr.inspectorName], ["Inspection Date", eicr.startDate ? formatDate(eicr.startDate) : eicr.inspectionDate ? formatDate(eicr.inspectionDate) : ""], ["Outcome", eicr.outcome || eicr.overallAssessment],
                  ].map(([label, val], i) => val ? (
                    <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontFamily: font, fontSize: 12, color: label === "Outcome" ? (val === "Satisfactory" ? C.green : val === "Unsatisfactory" ? C.red : C.amber) : C.white, fontWeight: label === "Outcome" ? 600 : 400 }}>{val}</div>
                    </div>
                  ) : null)}
                </div>
                {eicr.observations && (
                  <div style={{ marginTop: 14, background: C.surfaceAlt, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Observations</div>
                    {Array.isArray(eicr.observations) ? (
                      eicr.observations.filter(o => o.observation).map((obs, oi) => (
                        <div key={oi} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: oi < eicr.observations.filter(o => o.observation).length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <span style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: obs.code === "C1" ? "#dc2626" : obs.code === "C2" ? "#ea580c" : obs.code === "C3" ? C.amber : obs.code === "FI" ? C.purple : C.textMuted, background: obs.code === "C1" ? "rgba(220,38,38,.15)" : obs.code === "C2" ? "rgba(234,88,12,.15)" : obs.code === "C3" ? C.amberBg : obs.code === "FI" ? C.purpleBg : C.surfaceAlt, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{obs.code || "\u2014"}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: font, fontSize: 12, color: C.text }}>{obs.observation}</div>
                            {obs.location && <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginTop: 2 }}>Location: {obs.location}</div>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{eicr.observations}</div>
                    )}
                  </div>
                )}
                {eicr.recommendations && <div style={{ marginTop: 10, background: C.surfaceAlt, borderRadius: 8, padding: "12px 14px" }}><div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Recommendations</div><div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{eicr.recommendations}</div></div>}
                </>) : (
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
                  {[
                    ["Job Type", job.type], ["Property", prop?.address || "—"], ["Tenant", prop?.tenant_name],
                    ["Engineer", eng?.full_name], ["Scheduled Date", job.scheduled_date ? formatDate(job.scheduled_date) : ""], ["Reference", job.ref],
                  ].map(([label, val], i) => val ? (
                    <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontFamily: font, fontSize: 12, color: C.white }}>{val}</div>
                    </div>
                  ) : null)}
                  {job.notes && (
                    <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px", gridColumn: mob ? "1" : "1 / -1" }}>
                      <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Notes</div>
                      <div style={{ fontFamily: font, fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.notes}</div>
                    </div>
                  )}
                </div>
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
  const [addr, setAddr] = useState(""); const [tenant, setTenant] = useState(""); const [phone, setPhone] = useState(""); const [landlordName, setLandlordName] = useState("");
  const [saving, setSaving] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false); const [error, setError] = useState("");

  useEffect(() => {
    if (property) { setAddr(property.address || ""); setTenant(property.tenant_name || ""); setPhone(property.tenant_phone || ""); setLandlordName(property.landlord_name || ""); }
  }, [property]);

  const submit = async () => {
    if (!addr.trim() || !tenant.trim()) { setError("Address and tenant required"); return; }
    setSaving(true);
    await updateProperty(property.id, { address: addr.trim(), tenant_name: tenant.trim(), tenant_phone: phone.trim(), landlord_name: landlordName.trim() });
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
          <Input label="Landlord Name" value={landlordName} onChange={setLandlordName} placeholder="e.g. Mr A Patel" />
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
  const { generate, generating, generatingJobId, certRef } = useGenerateCertificate();

  const handleGenerateCert = async (job) => {
    showToast("Generating certificate…", "info");
    const result = await generate(job);
    if (result.success) showToast("Certificate generated and uploaded");
    else showToast(result.error || "Failed to generate certificate", "error");
  };

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
    try {
      const { data, error } = await supabase.storage.from("certificates").createSignedUrl(doc.file_path, 60);
      if (error || !data?.signedUrl) { showToast("Could not retrieve file — please contact support", "error"); console.error("Signed URL error:", error); return; }
      window.open(data.signedUrl, "_blank");
    } catch (e) { showToast("Download failed — check your connection", "error"); console.error("Download error:", e); }
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
          {property.landlord_name && (
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily: font, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Landlord</div>
            <div style={{ fontFamily: font, fontSize: 13, color: C.white, marginTop: 3 }}>{property.landlord_name}</div>
          </div>
          )}
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
                      {hasEicrReport && (() => { const co = CONDITION_OPTIONS.find(o => o.value === eicr.conditionKey); const lbl = co?.label || eicr.outcome || eicr.overallAssessment; return lbl ? <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: isUnsatisfactory(eicr.conditionKey) || lbl === "Unsatisfactory" ? C.red : C.green }}>{lbl}</span> : null; })()}
                    </div>
                    <div style={{ fontFamily: font, fontSize: 11, color: C.textDim, marginTop: 2 }}>{job.scheduled_date ? formatDate(job.scheduled_date) : "Unscheduled"}{job.notes ? ` · ${job.notes}` : ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {hasEicrReport && (
                    <button onClick={() => setActiveJobComments(activeJobComments === `eicr-${job.id}` ? null : `eicr-${job.id}`)} style={{ fontFamily: font, fontSize: 11, color: C.accent, background: C.accentGlow, border: `1px solid rgba(59,130,246,.25)`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", minHeight: 30 }}>
                      {activeJobComments === `eicr-${job.id}` ? "Hide" : "Report"}
                    </button>
                  )}
                  <button onClick={() => setActiveJobComments(showComments ? null : job.id)} style={{ fontFamily: font, fontSize: 11, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", minHeight: 30 }}>
                    💬 {jobComments.length}
                  </button>
                  {["admin"].includes(auth.role) && ["Pending", "Scheduled"].includes(job.status) && (
                    <button onClick={() => handleCancelJob(job)} style={{ fontFamily: font, fontSize: 11, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", minHeight: 30 }}>Cancel</button>
                  )}
                  {job.status === "Completed" && !job.has_cert && (
                    <button onClick={() => handleGenerateCert(job)} disabled={generating} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.white, background: generatingJobId === job.id ? C.textDim : C.accent, border: "none", borderRadius: 6, padding: "5px 10px", cursor: generating ? "not-allowed" : "pointer", minHeight: 30, opacity: generating ? 0.7 : 1 }}>{generatingJobId === job.id ? "Generating…" : "Generate Cert"}</button>
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
      {/* Hidden certificate renderer for PDF generation */}
      {generatingJobId && (() => { const gJob = jobs.find(j => j.id === generatingJobId); return gJob ? <div style={{ position: "fixed", left: -9999, top: 0 }}><CertificateRenderer job={gJob} property={properties.find(p => p.id === gJob.property_id)} certRef={certRef} /></div> : null; })()}
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
    if (["eicr", "dfpm25", "epm25", "eic183c"].includes(page) && !["engineer", "junior", "supervisor"].includes(role)) setPage("dashboard");
    if (page === "signoff" && !["supervisor", "admin"].includes(role)) setPage("dashboard");
    if (page === "team" && role !== "admin") setPage("dashboard");
  }, [role, page]);

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
      case "dfpm25": return <DFPM25Page />;
      case "epm25": return <EPM25Page />;
      case "eic183c": return <EIC183CPage />;
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
              {isMobile && <BottomNav active={page} setActive={(p) => { setPage(p); if (p !== "propertyDetail") setSelectedPropertyId(null); }} role={role} jobs={ctx.jobs} />}
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
