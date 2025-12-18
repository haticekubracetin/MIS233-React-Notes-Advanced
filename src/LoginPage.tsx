import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { CSSProperties } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  // Redirect to tasks if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) navigate("/tasks")
  }, [navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid username or password")
        setLoading(false)
        return
      }

      // UPDATE: Save authentication data to local storage
      localStorage.setItem("token", data.token)
      localStorage.setItem("userId", data.userId)

      // UPDATE: Redirect by refreshing the page
      // This ensures the TaskApp component reads the fresh token immediately.
      window.location.href = "/tasks";

    } catch (err) {
      setError("Something went wrong. Please try again.")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1 style={styles.title}>Welcome back ✨</h1>
        <p style={styles.subtitle}>Log in to manage your tasks</p>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.footerText}>
          Don’t have an account?{" "}
          <span
            style={styles.link}
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  )
}

/* =======================
   Typed Styles
======================= */

const styles: Record<string, CSSProperties> = {
  page: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fdfbfb, #ebedee)",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "32px",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: {
    marginBottom: "4px",
    fontSize: "1.8rem",
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: "24px",
    color: "#666",
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box", // Prevents input overflow
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#6c63ff",
    color: "#fff",
    fontSize: "1rem",
    marginTop: "10px",
    transition: "background-color 0.2s",
  },
  error: {
    color: "#d64545",
    fontSize: "0.85rem",
    marginBottom: "8px",
  },
  footerText: {
    marginTop: "20px",
    fontSize: "0.85rem",
    color: "#666",
  },
  link: {
    color: "#6c63ff",
    cursor: "pointer",
    fontWeight: 500,
  },
}


