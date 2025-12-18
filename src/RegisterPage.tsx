// src/RegisterPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Updated error message from backend or fallback
        setError(data.error || "Registration failed.");
        return;
      }

      setSuccess(true);
      // Redirect to login page after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleRegister} style={styles.card}>
        <h2 style={styles.title}>Create Account ✨</h2>
        <p style={styles.subtitle}>Join us to start managing tasks</p>

        {success ? (
          <div style={styles.successBox}>
            <p>Success! Redirecting to login...</p>
          </div>
        ) : (
          <>
            <input 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={styles.input} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={styles.input} 
            />
            
            {error && <p style={styles.errorText}>{error}</p>}
            
            <button type="submit" style={styles.button}>Register</button>
            
            <p style={styles.footerText}>
              Already have an account?{" "}
              <span style={styles.link} onClick={() => navigate("/login")}>
                Login
              </span>
            </p>
          </>
        )}
      </form>
    </div>
  );
}

/* =======================
   Styles (Login Compatible)
======================= */

const styles: Record<string, CSSProperties> = {
  page: {
    height: "100vh",
    width: "100vw",
    display: "flex",           // Flexbox active
    alignItems: "center",      // Centers vertically
    justifyContent: "center",  // Centers horizontally
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
    boxSizing: "border-box",
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
    cursor: "pointer",
  },
  successBox: {
    padding: "20px",
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
    borderRadius: "10px",
    fontWeight: 500,
  },
  errorText: {
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
};