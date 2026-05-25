"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Shield, Calendar, AlertTriangle,
  Phone, Search, User, Bell, Settings, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Clock, FileText,
  Briefcase, TrendingUp, LogOut, Menu, X, ChevronDown,
  MapPin, Globe, Building, GraduationCap, Award,
  ArrowRight, Info, Zap, Eye, RefreshCw, Download
} from "lucide-react";

// ── PALETTE ────────────────────────────────────────────────────
const C = {
  navy:   "#0F1E45",
  navy2:  "#1A2B5F",
  blue:   "#2E75B6",
  teal:   "#00B0A0",
  gold:   "#D4A017",
  green:  "#1E7D45",
  red:    "#C0392B",
  orange: "#D97706",
  white:  "#FFFFFF",
  offwh:  "#F0F4FB",
  lgrey:  "#E8EDF5",
  mgrey:  "#7A8BAA",
  text:   "#1F2D47",
};

// ── DEMO DATA ───────────────────────────────────────────────────
const USER = {
  name: "Arjun Kumar",
  nationality: "Indian",
  flag: "🇮🇳",
  avatar: "AK",
  pesel: "Yes",
  zameldowanie: "Yes",
  polish_level: "A1",
  phone: "+48 500 123 456",
  address: "ul. Marszałkowska 12/4, Warsaw",
  plan: "Active — expires 18 Jun 2025",
};

const DOCUMENTS = {
  visa:      { type: "D/05 National Visa (Work)", issued: "15 Sep 2024", expires: "26 Jun 2025", days: 39, country: "India", status: "YELLOW" },
  permit:    { type: "Type A Work Permit",        issued: "20 Sep 2024", expires: "01 Jul 2025", days: 44, employer: "TechWarsaw Sp. z o.o.", employer_nip: "5252901234", city: "Warsaw", hours: 40, salary: "8,500 PLN", status: "RED" },
  residence: { type: "Temporary Residence Card",  issued: "01 Oct 2023", expires: "01 Oct 2025", days: 136, basis: "Employment", application: "Not submitted", status: "YELLOW" },
  passport:  { type: "Indian Passport",           issued: "10 Mar 2021", expires: "09 Mar 2031", days: 1756, status: "GREEN" },
};

const EMPLOYMENT = {
  employer: "Nowak & Partners Consulting",
  nip: "5252901999",
  contract: "Umowa o pracę",
  city: "Warsaw",
  hours: 40,
  salary: "8,200 PLN",
  zus: true,
  transfer: true,
  contract_copy: true,
};

const RISK = {
  overall: 68,
  stay:    45,
  work:    88,
  doc:     32,
  tax:     18,
  level:   "YELLOW",
  rules: [
    { code: "R04", severity: "RED",    title: "Employer Mismatch", desc: "Your current employer (Nowak & Partners) does not match your work permit employer (TechWarsaw). This constitutes illegal employment risk." },
    { code: "R01", severity: "YELLOW", title: "Visa Expiring Soon", desc: "Your D/05 visa expires in 39 days. If no new permit or extension is in place by then, your legal stay will be at risk." },
    { code: "R12", severity: "YELLOW", title: "Residence Application Not Filed", desc: "Your residence card is valid for 136 more days, but no extension application has been submitted yet. You should apply at least 30 days before expiry." },
    { code: "R09", severity: "GREEN",  title: "Passport Valid", desc: "Your passport expires in 2031 — well beyond your residence card expiry. No action required." },
    { code: "R08", severity: "GREEN",  title: "ZUS Registration Active", desc: "You are registered with ZUS and salary is paid by bank transfer. Tax compliance looks good." },
  ]
};

const TIMELINE = [
  { id: 1, label: "Visa D/05 Expires",              date: "26 Jun 2025", days: 39,   type: "visa",      severity: "RED",    action: "Ensure work permit or residence card is in place before this date." },
  { id: 2, label: "Work Permit Expires",             date: "01 Jul 2025", days: 44,   type: "permit",    severity: "RED",    action: "Apply for permit renewal or new permit at Urząd Wojewódzki." },
  { id: 3, label: "Submit Residence Application",    date: "01 Sep 2025", days: 106,  type: "residence", severity: "YELLOW", action: "Submit application at Urząd Wojewódzki at least 30 days before card expiry." },
  { id: 4, label: "Residence Card Expires",          date: "01 Oct 2025", days: 136,  type: "residence", severity: "YELLOW", action: "Ensure application submitted. If submitted before expiry, legal stay is protected." },
  { id: 5, label: "Annual PIT Tax Filing",           date: "30 Apr 2026", days: 347,  type: "tax",       severity: "GREEN",  action: "File PIT-37 or PIT-36 with Polish tax authority (US)." },
  { id: 6, label: "Passport Renewal Check",          date: "09 Mar 2031", days: 2122, type: "passport",  severity: "GREEN",  action: "Passport valid until 2031. No action required for several years." },
];

const EMERGENCIES = [
  { id: "employer", icon: "🏢", title: "Employer Disappeared / Closed", steps: ["Do NOT continue working without a valid contract and permit.", "Contact ZUS to confirm your social insurance status.", "File a report with the State Labour Inspectorate (PIP).", "Apply for a new work permit immediately if you wish to stay.", "Seek advice from an immigration lawyer."] },
  { id: "expired",  icon: "📄", title: "Permit / Visa Expired",         steps: ["Check if you submitted a residence application before expiry (Art. 108 protection).", "If yes — your legal stay is automatically extended during processing.", "If no — you are likely in an irregular situation. Stop working immediately.", "Contact a licensed immigration lawyer within 24 hours.", "Do not travel outside Poland until status is resolved."] },
  { id: "police",   icon: "🚔", title: "Police / Border Guard Stop",     steps: ["Stay calm. You have the right to an interpreter.", "Present all valid documents you have (passport, permit, residence card).", "Do not sign any document you do not understand.", "Contact your embassy if you feel your rights are being violated.", "Write down officer badge numbers and exact time/location of stop."] },
  { id: "salary",   icon: "💸", title: "Salary Unpaid / Withheld",       steps: ["Document everything: emails, contracts, bank statements.", "Submit a formal complaint to the State Labour Inspectorate (PIP).", "File a claim with the local Labour Court (Sąd Pracy) — free for workers.", "Contact a trade union or legal aid charity for support.", "Employer non-payment does not affect your permit status."] },
  { id: "passport", icon: "🛂", title: "Lost or Stolen Passport",        steps: ["Report to Polish Police immediately (Policja) and get a report number.", "Contact your Embassy or Consulate for emergency travel document.", "Notify Urząd Wojewódzki if a residence application is pending.", "Apply for a new passport from your Embassy in Warsaw.", "Carry your police report number at all times until resolved."] },
  { id: "rejection",icon: "❌", title: "Residence Permit Rejected",      steps: ["You have 14 days to appeal from the date of the decision.", "Collect the rejection decision letter — it must state the legal basis.", "Consult an immigration lawyer immediately about appeal grounds.", "You may continue legal stay during appeal if application was in time.", "Do not leave Poland without legal advice — departure may affect appeal rights."] },
];

const SCAM_PATTERNS = [
  "guarantee approval", "guaranteed visa", "100% success", "pay cash only",
  "no need for documents", "process in 1 week", "bypass the queue",
  "special contact at the office", "unofficial fee", "we know someone inside",
  "no contract needed", "pay first then documents", "secret process",
];

// ── HELPERS ─────────────────────────────────────────────────────
const severityColor  = s => ({ GREEN:"#1E7D45", YELLOW:"#D97706", RED:"#C0392B", CRITICAL:"#7B1111" }[s] || C.mgrey);
const severityBg     = s => ({ GREEN:"#D1FAE5", YELLOW:"#FEF3C7", RED:"#FEE2E2", CRITICAL:"#FDE8E8" }[s] || "#F3F4F6");
const severityLabel  = s => ({ GREEN:"Compliant", YELLOW:"Attention", RED:"At Risk", CRITICAL:"Critical" }[s] || s);
const severityIcon   = s => s === "GREEN" ? <CheckCircle size={15}/> : s === "YELLOW" ? <AlertCircle size={15}/> : <XCircle size={15}/>;

function StatusBadge({ status, size = "sm" }) {
  const pad = size === "lg" ? "8px 18px" : "3px 10px";
  const fs  = size === "lg" ? 14 : 11;
  return (
    <span style={{ background: severityBg(status), color: severityColor(status), padding: pad, borderRadius: 100, fontSize: fs, fontWeight: 700, display:"inline-flex", alignItems:"center", gap: 4 }}>
      {severityIcon(status)} {severityLabel(status)}
    </span>
  );
}

function RiskGauge({ score }) {
  const r = 80, cx = 100, cy = 95;
  const startAngle = -180, totalArc = 180;
  const angle = startAngle + (score / 100) * totalArc;
  const rad = (a) => (a * Math.PI) / 180;
  const arcX = (a) => cx + r * Math.cos(rad(a));
  const arcY = (a) => cy + r * Math.sin(rad(a));
  const needleX = cx + (r - 12) * Math.cos(rad(angle));
  const needleY = cy + (r - 12) * Math.sin(rad(angle));
  const col = score < 30 ? C.green : score < 60 ? C.gold : score < 80 ? C.orange : C.red;

  return (
    <svg viewBox="0 0 200 100" style={{ width: "100%", maxWidth: 200 }}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={C.green}  />
          <stop offset="40%"  stopColor={C.gold}   />
          <stop offset="70%"  stopColor={C.orange} />
          <stop offset="100%" stopColor={C.red}    />
        </linearGradient>
      </defs>
      <path d={`M ${arcX(-180)} ${arcY(-180)} A ${r} ${r} 0 0 1 ${arcX(0)} ${arcY(0)}`}
        fill="none" stroke="#E8EDF5" strokeWidth={14} strokeLinecap="round"/>
      <path d={`M ${arcX(-180)} ${arcY(-180)} A ${r} ${r} 0 0 1 ${arcX(angle)} ${arcY(angle)}`}
        fill="none" stroke="url(#gaugeGrad)" strokeWidth={14} strokeLinecap="round"
        style={{ strokeDasharray: 1000, strokeDashoffset: 0 }}/>
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={col} strokeWidth={3} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={5} fill={col}/>
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize={24} fontWeight={700} fill={col}>{score}</text>
      <text x={cx} y={cy - 2}  textAnchor="middle" fontSize={8.5} fill={C.mgrey}>Risk Score</text>
      <text x={22}  y={95} textAnchor="middle" fontSize={8} fill={C.green}>LOW</text>
      <text x={178} y={95} textAnchor="middle" fontSize={8} fill={C.red}>HIGH</text>
    </svg>
  );
}

function ScoreBar({ label, score, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}/100</span>
      </div>
      <div style={{ background: C.lgrey, borderRadius: 100, height: 6, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:100, background: color, width:`${score}%`, transition:"width 1s ease" }}/>
      </div>
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{ background: C.white, borderRadius: 14, padding: "1.25rem 1.5rem", boxShadow:"0 2px 12px rgba(15,30,69,0.06)", border:`1px solid ${C.lgrey}`, ...style }}>{children}</div>;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy2, margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontSize: 13, color: C.mgrey, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── VIEWS ───────────────────────────────────────────────────────

function Dashboard({ setView }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { setTimeout(() => setEntered(true), 50); }, []);

  const alerts = TIMELINE.filter(t => t.days < 50);

  return (
    <div style={{ opacity: entered ? 1:0, transform: entered?"translateY(0)":"translateY(12px)", transition:"all 0.4s ease" }}>
      {/* Welcome + Risk */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>
        <Card style={{ gridColumn:"1/2", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navy2} 100%)`, border:"none", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom: 6 }}>Welcome back</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{USER.name}</div>
            <div style={{ fontSize: 12, color:"rgba(255,255,255,0.5)", marginTop: 3 }}>{USER.flag} {USER.nationality} · Warsaw, Poland</div>
          </div>
          <div style={{ marginTop:"1rem" }}>
            <div style={{ fontSize: 11, color:"rgba(255,255,255,0.45)", marginBottom: 4 }}>Subscription</div>
            <div style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>{USER.plan}</div>
          </div>
        </Card>

        <Card style={{ gridColumn:"2/3", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <RiskGauge score={RISK.overall} />
          <StatusBadge status={RISK.level} size="sm"/>
          <div style={{ fontSize: 11, color: C.mgrey, marginTop: 6, textAlign:"center" }}>2 active risk flags</div>
        </Card>

        <div style={{ gridColumn:"3/4", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {[
            { label:"Visa expires in", val:"39 days", color: C.red,   bg:"#FEE2E2", sub:"D/05 National Visa" },
            { label:"Permit expires in", val:"44 days", color: C.orange, bg:"#FEF3C7", sub:"Type A Work Permit" },
          ].map((item,i) => (
            <div key={i} style={{ background: item.bg, border:`1px solid ${item.color}22`, borderRadius: 12, padding:"0.9rem 1.1rem", flex:1 }}>
              <div style={{ fontSize: 11, color: item.color, fontWeight: 600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 11, color: item.color, opacity: 0.7 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"1rem", marginBottom:"1.25rem" }}>
        {[
          { label:"Stay Risk",     val: `${RISK.stay}/100`,    color: C.gold,  icon:<Shield size={16}/> },
          { label:"Work Risk",     val: `${RISK.work}/100`,    color: C.red,   icon:<Briefcase size={16}/> },
          { label:"Document Risk", val: `${RISK.doc}/100`,     color: C.green, icon:<FileText size={16}/> },
          { label:"Tax Risk",      val: `${RISK.tax}/100`,     color: C.green, icon:<TrendingUp size={16}/> },
        ].map((s,i) => (
          <Card key={i} style={{ padding:"1rem 1.25rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, color: C.mgrey, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
              <div style={{ color: s.color, background: `${s.color}18`, padding: 7, borderRadius: 8 }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts + Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:"1.25rem" }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ fontSize:14, fontWeight:700, color: C.navy2 }}>⚠️ Active Alerts</div>
            <button onClick={()=>setView("timeline")} style={{ fontSize:11, color: C.blue, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>View all →</button>
          </div>
          {alerts.map(a => (
            <div key={a.id} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", padding:"0.75rem 0", borderBottom:`1px solid ${C.lgrey}` }}>
              <div style={{ background: severityBg(a.severity), color: severityColor(a.severity), borderRadius: 8, padding:"6px 8px", fontSize: 11, fontWeight: 700, whiteSpace:"nowrap" }}>{a.days}d</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</div>
                <div style={{ fontSize: 11, color: C.mgrey, marginTop: 2 }}>{a.action}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize:14, fontWeight:700, color: C.navy2, marginBottom:"1rem" }}>Quick Actions</div>
          {[
            { label:"Run Full Status Check",    icon:<Shield size={14}/>,    color: C.blue,  view:"status"    },
            { label:"View Timeline",            icon:<Calendar size={14}/>,  color: C.teal,  view:"timeline"  },
            { label:"Check Risk Score",         icon:<AlertTriangle size={14}/>, color: C.orange, view:"risk"  },
            { label:"Emergency Guide",          icon:<Phone size={14}/>,     color: C.red,   view:"emergency" },
            { label:"Scam Detector",            icon:<Search size={14}/>,    color: C.gold,  view:"scam"      },
          ].map((a,i) => (
            <button key={i} onClick={()=>setView(a.view)} style={{ width:"100%", display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.65rem 0.8rem", borderRadius: 8, background:"none", border:`1px solid ${C.lgrey}`, cursor:"pointer", marginBottom: 7, transition:"all 0.15s", textAlign:"left", fontFamily:"inherit" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=`${a.color}10`; e.currentTarget.style.borderColor=a.color; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor=C.lgrey; }}>
              <span style={{ color: a.color }}>{a.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{a.label}</span>
              <ArrowRight size={11} style={{ marginLeft:"auto", color: C.mgrey }}/>
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}

function StatusView() {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const run = () => { setLoading(true); setTimeout(() => { setLoading(false); setChecked(true); }, 1600); };

  return (
    <div>
      <SectionTitle sub="Enter or review your details to get a full legal compliance status check.">Legal Stay Validator</SectionTitle>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>
        {/* Visa */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
            <div style={{ fontSize:13, fontWeight:700, color: C.navy2 }}>🛂 Visa Details</div>
            <StatusBadge status={DOCUMENTS.visa.status}/>
          </div>
          {[["Type", DOCUMENTS.visa.type],["Issued", DOCUMENTS.visa.issued],["Expires", DOCUMENTS.visa.expires],["Days Remaining", `${DOCUMENTS.visa.days} days`],["Issued in", DOCUMENTS.visa.country]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.lgrey}`, fontSize:12 }}>
              <span style={{ color: C.mgrey }}>{k}</span>
              <span style={{ color: C.text, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* Work Permit */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
            <div style={{ fontSize:13, fontWeight:700, color: C.navy2 }}>📋 Work Permit</div>
            <StatusBadge status={DOCUMENTS.permit.status}/>
          </div>
          {[["Type", DOCUMENTS.permit.type],["Employer on Permit", DOCUMENTS.permit.employer],["NIP", DOCUMENTS.permit.employer_nip],["City", DOCUMENTS.permit.city],["Hours/Week", DOCUMENTS.permit.hours],["Salary on Permit", DOCUMENTS.permit.salary],["Expires", DOCUMENTS.permit.expires]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.lgrey}`, fontSize:12 }}>
              <span style={{ color: C.mgrey }}>{k}</span>
              <span style={{ color: C.text, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* Residence */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
            <div style={{ fontSize:13, fontWeight:700, color: C.navy2 }}>🏠 Residence Card</div>
            <StatusBadge status={DOCUMENTS.residence.status}/>
          </div>
          {[["Type", DOCUMENTS.residence.type],["Basis", DOCUMENTS.residence.basis],["Expires", DOCUMENTS.residence.expires],["Days Remaining", `${DOCUMENTS.residence.days} days`],["Application Status", DOCUMENTS.residence.application]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.lgrey}`, fontSize:12 }}>
              <span style={{ color: C.mgrey }}>{k}</span>
              <span style={{ color: k==="Application Status" ? C.red : C.text, fontWeight: k==="Application Status" ? 700 : 500 }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* Employment */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
            <div style={{ fontSize:13, fontWeight:700, color: C.navy2 }}>💼 Current Employment</div>
            <StatusBadge status="RED"/>
          </div>
          {[["Actual Employer", EMPLOYMENT.employer],["NIP", EMPLOYMENT.nip],["Contract Type", EMPLOYMENT.contract],["City", EMPLOYMENT.city],["Hours/Week", EMPLOYMENT.hours],["Actual Salary", EMPLOYMENT.salary],["ZUS Registered", EMPLOYMENT.zus?"Yes ✓":"No ✗"],["Salary by Transfer", EMPLOYMENT.transfer?"Yes ✓":"No ✗"]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.lgrey}`, fontSize:12 }}>
              <span style={{ color: C.mgrey }}>{k}</span>
              <span style={{ color: (k==="Actual Employer" || k==="NIP") ? C.red : C.text, fontWeight: (k==="Actual Employer") ? 700 : 500 }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}>
        <button onClick={run} disabled={loading} style={{ background: loading ? C.mgrey : C.navy2, color: C.white, border:"none", borderRadius:10, padding:"0.85rem 2.5rem", fontSize:14, fontWeight:700, cursor: loading?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"inherit" }}>
          {loading ? <><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }}/> Running Checks…</> : <><Shield size={15}/> Run Full Compliance Check</>}
        </button>
      </div>

      {checked && (
        <div>
          <div style={{ background:`${C.red}12`, border:`2px solid ${C.red}`, borderRadius:14, padding:"1.25rem 1.5rem", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.5rem" }}>
              <XCircle size={22} color={C.red}/>
              <div style={{ fontSize:16, fontWeight:700, color: C.red }}>Status: AT RISK — 2 violations detected</div>
            </div>
            <div style={{ fontSize:13, color: C.text }}>Your current employment (Nowak & Partners) does not match your work permit employer (TechWarsaw). This is the primary compliance risk. Additionally, your visa expires in 39 days with no overlapping protection confirmed.</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
            {RISK.rules.map(r=>(
              <div key={r.code} style={{ background: severityBg(r.severity), border:`1px solid ${severityColor(r.severity)}33`, borderRadius:10, padding:"0.9rem 1rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:10, fontFamily:"monospace", background:`${severityColor(r.severity)}22`, color: severityColor(r.severity), padding:"2px 6px", borderRadius:4, fontWeight:700 }}>{r.code}</span>
                  <StatusBadge status={r.severity}/>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color: C.text, marginBottom:3 }}>{r.title}</div>
                <div style={{ fontSize:11, color: C.mgrey, lineHeight:1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

function TimelineView() {
  const [filter, setFilter] = useState("all");
  const types = ["all","visa","permit","residence","tax","passport"];
  const filtered = filter === "all" ? TIMELINE : TIMELINE.filter(t=>t.type===filter);

  return (
    <div>
      <SectionTitle sub="All upcoming deadlines sorted by urgency. Never miss a critical date.">Timeline & Deadlines</SectionTitle>
      <div style={{ display:"flex", gap:8, marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {types.map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{ padding:"5px 14px", borderRadius:100, fontSize:12, fontWeight:600, border:`1.5px solid ${filter===t ? C.navy2 : C.lgrey}`, background: filter===t ? C.navy2 : C.white, color: filter===t ? C.white : C.mgrey, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize", transition:"all 0.15s" }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {filtered.map(item => (
          <Card key={item.id} style={{ padding:"1rem 1.25rem", borderLeft:`4px solid ${severityColor(item.severity)}`, transition:"transform 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateX(3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <StatusBadge status={item.severity}/>
                  <span style={{ fontSize:11, background: C.lgrey, color: C.mgrey, padding:"2px 8px", borderRadius:100, textTransform:"capitalize" }}>{item.type}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color: C.text, marginBottom:3 }}>{item.label}</div>
                <div style={{ fontSize:12, color: C.mgrey }}>{item.action}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0, marginLeft:"1rem" }}>
                <div style={{ fontSize:22, fontWeight:700, color: severityColor(item.severity) }}>{item.days}</div>
                <div style={{ fontSize:10, color: C.mgrey }}>days left</div>
                <div style={{ fontSize:11, color: C.mgrey, marginTop:2 }}>{item.date}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RiskView() {
  return (
    <div>
      <SectionTitle sub="Your compliance risk across four dimensions, scored 0–100.">Risk Score Breakdown</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:"1.25rem", marginBottom:"1.25rem" }}>
        <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
          <RiskGauge score={RISK.overall}/>
          <div style={{ marginTop:"0.75rem" }}><StatusBadge status={RISK.level} size="lg"/></div>
          <div style={{ fontSize:12, color: C.mgrey, marginTop:8, textAlign:"center" }}>Based on {RISK.rules.length} compliance rules checked</div>
        </Card>
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color: C.navy2, marginBottom:"1.25rem" }}>Sub-Score Breakdown</div>
          <ScoreBar label="Stay Risk"     score={RISK.stay}  color={C.gold}  />
          <ScoreBar label="Work Risk"     score={RISK.work}  color={C.red}   />
          <ScoreBar label="Document Risk" score={RISK.doc}   color={C.green} />
          <ScoreBar label="Tax Risk"      score={RISK.tax}   color={C.green} />
          <div style={{ background: C.offwh, borderRadius:8, padding:"0.75rem 1rem", marginTop:"0.75rem" }}>
            <div style={{ fontSize:11, color: C.mgrey }}>⚡ Highest priority action</div>
            <div style={{ fontSize:12, fontWeight:600, color: C.red, marginTop:3 }}>Resolve employer mismatch immediately — Work Risk is 88/100</div>
          </div>
        </Card>
      </div>
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color: C.navy2, marginBottom:"1rem" }}>Triggered Rules</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {RISK.rules.map(r=>(
            <div key={r.code} style={{ display:"flex", gap:"1rem", alignItems:"flex-start", padding:"0.85rem 1rem", background: severityBg(r.severity), borderRadius:10, border:`1px solid ${severityColor(r.severity)}22` }}>
              <div style={{ background: severityColor(r.severity), color: C.white, fontSize:10, fontWeight:700, padding:"3px 7px", borderRadius:5, whiteSpace:"nowrap", fontFamily:"monospace", flexShrink:0 }}>{r.code}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color: C.text }}>{r.title}</span>
                  <StatusBadge status={r.severity}/>
                </div>
                <div style={{ fontSize:12, color: C.mgrey, lineHeight:1.6 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmergencyView() {
  const [selected, setSelected] = useState(null);
  const sit = EMERGENCIES.find(e=>e.id===selected);

  return (
    <div>
      <SectionTitle sub="Select your situation for immediate step-by-step guidance.">Emergency Guide</SectionTitle>
      <div style={{ background:`${C.red}0F`, border:`1.5px solid ${C.red}44`, borderRadius:12, padding:"0.85rem 1.2rem", marginBottom:"1.5rem", display:"flex", gap:8, alignItems:"center" }}>
        <AlertTriangle size={16} color={C.red}/>
        <div style={{ fontSize:12, color: C.text }}><strong>Important:</strong> This guide provides information and immediate steps only. For legal binding decisions, always consult a licensed immigration lawyer (<em>radca prawny</em>).</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.25rem" }}>
        {EMERGENCIES.map(e=>(
          <button key={e.id} onClick={()=>setSelected(e.id===selected?null:e.id)} style={{ background: selected===e.id ? C.navy2 : C.white, border:`1.5px solid ${selected===e.id ? C.navy2 : C.lgrey}`, borderRadius:12, padding:"1rem 1.25rem", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all 0.2s" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{e.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color: selected===e.id ? C.white : C.text }}>{e.title}</div>
            <div style={{ fontSize:11, color: selected===e.id ? "rgba(255,255,255,0.55)" : C.mgrey, marginTop:3 }}>Tap for step-by-step guide</div>
          </button>
        ))}
      </div>
      {sit && (
        <Card style={{ borderLeft:`4px solid ${C.red}` }}>
          <div style={{ fontSize:15, fontWeight:700, color: C.navy2, marginBottom:"1rem" }}>{sit.icon} {sit.title} — Action Steps</div>
          {sit.steps.map((step,i)=>(
            <div key={i} style={{ display:"flex", gap:"0.85rem", alignItems:"flex-start", marginBottom:"0.85rem" }}>
              <div style={{ background: C.navy2, color: C.white, borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:13, color: C.text, lineHeight:1.65, paddingTop:3 }}>{step}</div>
            </div>
          ))}
          <div style={{ background: C.offwh, borderRadius:8, padding:"0.75rem 1rem", marginTop:"0.5rem", display:"flex", gap:8 }}>
            <Phone size={14} color={C.blue}/>
            <div style={{ fontSize:12, color: C.mgrey }}>Emergency immigration legal aid: <strong style={{ color: C.blue }}>+48 22 826 55 55</strong> (Legal Aid Centre, Warsaw)</div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ScamView() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = () => {
    if (!input.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const lower = input.toLowerCase();
      const hits = SCAM_PATTERNS.filter(p => lower.includes(p));
      setResult({ hits, score: Math.min(100, hits.length * 22 + (hits.length > 0 ? 30 : 0)) });
      setLoading(false);
    }, 1200);
  };

  const riskLevel = result ? (result.score >= 60 ? "HIGH FRAUD RISK" : result.score >= 30 ? "SUSPICIOUS" : "LOW RISK") : "";
  const riskColor = result ? (result.score >= 60 ? C.red : result.score >= 30 ? C.orange : C.green) : C.mgrey;

  return (
    <div>
      <SectionTitle sub="Paste what an agent or company promised you. Our AI will check it against known scam patterns.">Scam Detector</SectionTitle>
      <Card style={{ marginBottom:"1.25rem" }}>
        <div style={{ fontSize:13, fontWeight:600, color: C.navy2, marginBottom:"0.75rem" }}>What did the agent promise you?</div>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="e.g. 'We guarantee visa approval in 7 days, no documents needed, pay €500 cash, 100% success rate, we have special contacts at the Urząd Wojewódzki...'" style={{ width:"100%", height:120, padding:"0.85rem", border:`1.5px solid ${C.lgrey}`, borderRadius:10, fontSize:13, color: C.text, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }}/>
        <button onClick={check} disabled={loading||!input.trim()} style={{ marginTop:"0.75rem", background: input.trim() ? C.navy2 : C.mgrey, color: C.white, border:"none", borderRadius:8, padding:"0.75rem 2rem", fontSize:13, fontWeight:700, cursor: input.trim()?"pointer":"not-allowed", fontFamily:"inherit" }}>
          {loading ? "Analysing…" : "🔍 Analyse for Scam Patterns"}
        </button>
      </Card>

      {result && (
        <div>
          <Card style={{ borderLeft:`4px solid ${riskColor}`, marginBottom:"1rem", background: `${riskColor}08` }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.5rem" }}>
              <div style={{ fontSize:15, fontWeight:700, color: riskColor }}>{result.score >= 60 ? "🚨" : result.score >= 30 ? "⚠️" : "✅"} {riskLevel}</div>
              <div style={{ fontSize:20, fontWeight:700, color: riskColor }}>{result.score}/100</div>
            </div>
            <div style={{ fontSize:12, color: C.text, lineHeight:1.65 }}>
              {result.hits.length > 0 ? `Detected ${result.hits.length} suspicious phrase${result.hits.length>1?"s":""}: ${result.hits.map(h=>`"${h}"`).join(", ")}. These match known immigration fraud patterns in Poland.` : "No common scam phrases detected. However, always verify agent credentials and get everything in writing."}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color: C.navy2, marginBottom:"0.75rem" }}>🛡️ How to Protect Yourself</div>
            {["Always demand a written contract before paying anything.", "Verify agent license at the Polish Ministry of Interior register.", "Never pay cash — always pay by bank transfer with a description.", "Legitimate immigration services NEVER guarantee visa/permit approval.", "If in doubt, consult a licensed radca prawny or adwokat directly."].map((tip,i)=>(
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                <CheckCircle size={13} color={C.green} style={{ flexShrink:0, marginTop:2 }}/>
                <div style={{ fontSize:12, color: C.text, lineHeight:1.6 }}>{tip}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function ProfileView() {
  return (
    <div>
      <SectionTitle sub="Your personal profile and document details on file.">My Profile</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:"1.25rem" }}>
        <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"2rem" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background: C.navy2, color: C.white, fontSize:24, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>{USER.avatar}</div>
          <div style={{ fontSize:18, fontWeight:700, color: C.navy2 }}>{USER.name}</div>
          <div style={{ fontSize:12, color: C.mgrey, marginBottom:"1rem" }}>{USER.flag} {USER.nationality}</div>
          <StatusBadge status="YELLOW" size="sm"/>
          <div style={{ fontSize:11, color: C.mgrey, marginTop:6 }}>Overall compliance status</div>
          <hr style={{ width:"100%", border:"none", borderTop:`1px solid ${C.lgrey}`, margin:"1.25rem 0" }}/>
          {[["📍 Address", USER.address],["📱 Phone", USER.phone],["🏆 Polish Level", USER.polish_level],["💳 PESEL", USER.pesel],["🏠 Zameldowanie", USER.zameldowanie]].map(([k,v])=>(
            <div key={k} style={{ width:"100%", display:"flex", justifyContent:"space-between", fontSize:12, padding:"5px 0", borderBottom:`1px solid ${C.lgrey}` }}>
              <span style={{ color: C.mgrey }}>{k}</span>
              <span style={{ fontWeight:600, color: C.text }}>{v}</span>
            </div>
          ))}
        </Card>
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color: C.navy2, marginBottom:"0.75rem" }}>📦 Subscription Plan</div>
            <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navy2} 100%)`, borderRadius:10, padding:"1.25rem", color: C.white }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Current Plan</div>
              <div style={{ fontSize:16, fontWeight:700, marginTop:4 }}>Monthly Subscription</div>
              <div style={{ fontSize:12, color: C.teal, marginTop:4 }}>{USER.plan}</div>
              <div style={{ marginTop:"1rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color: C.gold }}>€15<span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>/month</span></div>
                <button style={{ background: C.gold, color: C.navy, border:"none", borderRadius:6, padding:"0.45rem 1rem", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Renew</button>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color: C.navy2, marginBottom:"0.75rem" }}>🌐 Language Preferences</div>
            {[{lang:"English 🇬🇧",active:true},{lang:"Polish 🇵🇱",active:false},{lang:"Hindi 🇮🇳",active:false},{lang:"Gujarati",active:false}].map((l,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0", borderBottom:`1px solid ${C.lgrey}` }}>
                <span style={{ fontSize:13, color: C.text }}>{l.lang}</span>
                <div style={{ background: l.active ? C.teal : C.lgrey, width:36, height:20, borderRadius:100, position:"relative", cursor:"pointer" }}>
                  <div style={{ position:"absolute", top:3, left: l.active ? 18:3, width:14, height:14, background: C.white, borderRadius:"50%", transition:"left 0.2s" }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const router = useRouter();
const [authUser, setAuthUser] = useState<any>(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) { router.push("/login"); return; }
    setAuthUser(session.user);
    setAuthLoading(false);
  });
}, []);

if (authLoading) return (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0F1E45",color:"white",fontSize:16,fontFamily:"sans-serif"}}>
    Loading ImmigrantShield…
  </div>
);
  const [view, setView] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV = [
    { id:"dashboard", label:"Dashboard",      icon:<LayoutDashboard size={16}/> },
    { id:"status",    label:"My Status",       icon:<Shield size={16}/> },
    { id:"timeline",  label:"Timeline",         icon:<Calendar size={16}/> },
    { id:"risk",      label:"Risk Score",        icon:<AlertTriangle size={16}/> },
    { id:"emergency", label:"Emergency Guide",   icon:<Phone size={16}/> },
    { id:"scam",      label:"Scam Detector",     icon:<Search size={16}/> },
    { id:"profile",   label:"My Profile",        icon:<User size={16}/> },
  ];

  const VIEWS = { dashboard:<Dashboard setView={setView}/>, status:<StatusView/>, timeline:<TimelineView/>, risk:<RiskView/>, emergency:<EmergencyView/>, scam:<ScamView/>, profile:<ProfileView/> };

  const alertCount = TIMELINE.filter(t=>t.days<50).length;

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'DM Sans', 'Segoe UI', sans-serif", background: C.offwh, overflow:"hidden" }}>
      {/* SIDEBAR */}
      <div style={{ width:220, background: C.navy, display:"flex", flexDirection:"column", flexShrink:0, padding:"0 0 1rem" }}>
        {/* Logo */}
        <div style={{ padding:"1.4rem 1.25rem 1rem", borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
          <div style={{ fontSize:17, fontWeight:800, color: C.white, letterSpacing:"-0.01em" }}>Immigrant<span style={{ color: C.teal }}>Shield</span></div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>Legal Compliance Platform</div>
        </div>

        {/* Risk mini badge */}
        <div style={{ margin:"0.85rem 1rem", background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"0.65rem 0.85rem", border:`1px solid ${C.gold}33` }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Overall Risk</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:3 }}>
            <span style={{ fontSize:18, fontWeight:700, color: C.gold }}>{RISK.overall}/100</span>
            <span style={{ fontSize:10, background:`${C.gold}22`, color: C.gold, padding:"2px 7px", borderRadius:100, fontWeight:700 }}>YELLOW</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"0.25rem 0.75rem", overflowY:"auto" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:"0.65rem", padding:"0.6rem 0.75rem", borderRadius:8, background: view===n.id ? "rgba(255,255,255,0.12)" : "none", border: view===n.id ? `1px solid rgba(255,255,255,0.12)` : "1px solid transparent", color: view===n.id ? C.white : "rgba(255,255,255,0.5)", cursor:"pointer", fontSize:13, fontWeight: view===n.id ? 600 : 400, marginBottom:3, transition:"all 0.15s", textAlign:"left", fontFamily:"inherit" }}
              onMouseEnter={e=>{ if(view!==n.id){ e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.color="rgba(255,255,255,0.75)"; }}}
              onMouseLeave={e=>{ if(view!==n.id){ e.currentTarget.style.background="none"; e.currentTarget.style.color="rgba(255,255,255,0.5)"; }}}>
              <span style={{ opacity: view===n.id ? 1 : 0.6 }}>{n.icon}</span>
              {n.label}
              {n.id==="timeline" && alertCount > 0 && <span style={{ marginLeft:"auto", background: C.red, color: C.white, fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:100 }}>{alertCount}</span>}
              {n.id==="status" && <span style={{ marginLeft:"auto", background:`${C.red}33`, color: C.red, fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:100 }}>!</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ margin:"0 0.75rem 0", padding:"0.85rem", background:"rgba(255,255,255,0.06)", borderRadius:10, display:"flex", alignItems:"center", gap:"0.65rem" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background: C.teal, color: C.white, fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{USER.avatar}</div>
          <div style={{ overflow:"hidden" }}>
            <div style={{ fontSize:12, fontWeight:600, color: C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{USER.name}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{USER.flag} {USER.nationality}</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <div style={{ background: C.white, borderBottom:`1px solid ${C.lgrey}`, padding:"0 1.75rem", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color: C.navy2 }}>{NAV.find(n=>n.id===view)?.label}</div>
            <div style={{ fontSize:11, color: C.mgrey }}>Last updated: just now · Warsaw time</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.85rem" }}>
            {/* Lang selector */}
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", border:`1px solid ${C.lgrey}`, borderRadius:7, cursor:"pointer", fontSize:12, color: C.mgrey }}>
              <Globe size={13}/> EN <ChevronDown size={11}/>
            </div>
            {/* Notif */}
            <div style={{ position:"relative" }}>
              <button onClick={()=>setNotifOpen(!notifOpen)} style={{ background: notifOpen ? C.lgrey : "none", border:`1px solid ${C.lgrey}`, borderRadius:8, padding:"6px 8px", cursor:"pointer", position:"relative", display:"flex", alignItems:"center" }}>
                <Bell size={16} color={C.navy2}/>
                <span style={{ position:"absolute", top:-3, right:-3, background: C.red, color: C.white, fontSize:9, fontWeight:700, width:14, height:14, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>{alertCount}</span>
              </button>
              {notifOpen && (
                <div style={{ position:"absolute", top:38, right:0, background: C.white, border:`1px solid ${C.lgrey}`, borderRadius:12, boxShadow:"0 8px 32px rgba(15,30,69,0.15)", width:300, zIndex:50 }}>
                  <div style={{ padding:"0.85rem 1rem", borderBottom:`1px solid ${C.lgrey}`, fontSize:13, fontWeight:700, color: C.navy2 }}>Notifications ({alertCount})</div>
                  {TIMELINE.filter(t=>t.days<60).map(t=>(
                    <div key={t.id} style={{ padding:"0.75rem 1rem", borderBottom:`1px solid ${C.lgrey}`, display:"flex", gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background: severityColor(t.severity), flexShrink:0, marginTop:5 }}/>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color: C.text }}>{t.label}</div>
                        <div style={{ fontSize:11, color: C.mgrey }}>{t.days} days · {t.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Settings */}
            <button style={{ background:"none", border:`1px solid ${C.lgrey}`, borderRadius:8, padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center" }}>
              <Settings size={16} color={C.mgrey}/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"auto", padding:"1.5rem 1.75rem" }} onClick={()=>notifOpen&&setNotifOpen(false)}>
          {VIEWS[view]}
        </div>
      </div>
    </div>
  );
}
