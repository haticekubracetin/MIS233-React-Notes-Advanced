import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"


// Renamed to LoginPage for clarity
export default function LoginPage() { 
  const [username, setUsername] = useState("") 
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  // 1. Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      // If a token exists, the user is likely logged in. Redirect them.
      navigate("/tasks")
    }
  }, [navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    // Reset error message on new attempt
    setError("")

    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      // Backend returns 401 for bad credentials
      setError(data.error || "Login failed. Check username and password.") 
      return
    }

    // 2. Save JWT token (renamed to 'accessToken' in the prompt, using 'token' for consistency with your code)
    localStorage.setItem("token", data.token) 
    localStorage.setItem("userId", data.userId)

    // Redirect to tasks page
    navigate("/tasks")
  }

  return (
    <form onSubmit={handleLogin} style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px' 
    }}>
      <h2>User Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
      />

      <button 
        type="submit"
        style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Login
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      
      {/* Optional: Add a link to the Register page if you implement it */}
      {/* <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Don't have an account? <a href="/register">Register here</a>
      </p> */}
    </form>
  )
}

