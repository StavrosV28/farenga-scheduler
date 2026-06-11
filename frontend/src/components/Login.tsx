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
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0, fontSize: "24px" }}>Farenga Scheduler</h1>
        <p style={{ color: "#666", marginTop: "-10px" }}>Sign in to continue</p>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <div style={fieldStyle}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@farenga.com"
          />
        </div>

        <div style={fieldStyle}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f5f5"
}

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "32px",
  width: "90%",
  maxWidth: "380px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
}

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginBottom: "16px"
}

const inputStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "16px"
}

const errorStyle: React.CSSProperties = {
  background: "#fee",
  border: "1px solid #fcc",
  borderRadius: "6px",
  padding: "10px",
  marginBottom: "16px",
  color: "#c00"
}

const buttonStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a73e8",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "12px",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "8px"
}

export default Login