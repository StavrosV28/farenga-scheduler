import { useState } from "react"
import { supabase } from "../supabase"

interface LoginProps {
    onLogin: () => void
}

function Login ({ onLogin }: LoginProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleLogin() {
        if (!email || !password) {
            setError("Please enter your email and password")
            return
        }

        setLoading(true)
        setError("")

        const { error } = await supabase.auth.signInWithPassword({email, password})

        if (error) {
            setError("Invalid email or password")
            setLoading(false)
            return
        }

        onLogin()
    }
    return (
      <div style={{ 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)"
      }}>
      <img
        src="/ffh_logo_header.png" 
        alt="Farenga Funeral Home" 
        style={{ height: "80px", width: "auto", marginBottom: "24px", mixBlendMode: "lighten" }} 
      />

      <div style={{ 
        background: "var(--bg-secondary)",
        borderRadius: "16px",
        padding: "32px",
        width: "90%",
        maxWidth: "380px",
        border: "0.5px solid var(--border)"
      }}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "500", color: "var(--text-primary)" }}>
        Farenga Scheduler
      </h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "0", marginBottom: "24px", fontSize: "14px" }}>
        Sign in to continue
      </p>

      {error && (
        <div style={{ 
          background: "var(--accent-red-dim)",
          border: "0.5px solid var(--accent-red)",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "16px",
          color: "var(--accent-red)",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@farenga.com"
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ 
          width: "100%",
          background: "var(--accent-blue)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "15px",
          fontWeight: "500",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  </div>
  )
}

export default Login