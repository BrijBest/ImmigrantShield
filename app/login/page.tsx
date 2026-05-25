"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Login() {
  const [mode, setMode]         = useState<"login"|"signup">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState("");
  const router = useRouter();

  const handle = async () => {
    setLoading(true);
    setMessage("");
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("✅ Account created! Check your email to confirm, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else router.push("/");
    }
    setLoading(false);
  };

  const S: Record<string, React.CSSProperties> = {
    page:    { minHeight:"100vh", background:"#0F1E45", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif" },
    card:    { background:"#1A2B5F", borderRadius:16, padding:"2.5rem", width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,0.4)" },
    logo:    { fontSize:24, fontWeight:800, color:"#FFFFFF", textAlign:"center", marginBottom:4 },
    sub:     { fontSize:12, color:"rgba(255,255,255,0.4)", textAlign:"center", marginBottom:"2rem" },
    toggle:  { display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:8, padding:4, marginBottom:"1.5rem" },
    tBtn:    { flex:1, padding:"0.5rem", border:"none", borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit" },
    label:   { fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6, display:"block" },
    input:   { width:"100%", padding:"0.75rem 1rem", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#FFFFFF", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const, marginBottom:"1rem" },
    btn:     { width:"100%", padding:"0.85rem", background:"#D4A017", color:"#0F1E45", border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:4 },
    msg:     { fontSize:12, textAlign:"center", marginTop:"1rem", lineHeight:1.6 },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>Immigrant<span style={{color:"#00B0A0"}}>Shield</span></div>
        <div style={S.sub}>Legal Compliance Platform · Warsaw, Poland</div>

        <div style={S.toggle}>
          {(["login","signup"] as const).map(m => (
            <button key={m} onClick={()=>setMode(m)} style={{...S.tBtn, background: mode===m ? "#FFFFFF" : "transparent", color: mode===m ? "#0F1E45" : "rgba(255,255,255,0.4)"}}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <label style={S.label}>Email address</label>
        <input style={S.input} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>

        <label style={S.label}>Password</label>
        <input style={S.input} type="password" placeholder="minimum 6 characters" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && handle()}/>

        <button style={S.btn} onClick={handle} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "→  Log In" : "→  Create Account"}
        </button>

        {message && (
          <div style={{...S.msg, color: message.startsWith("✅") ? "#00B0A0" : "#F87171"}}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}