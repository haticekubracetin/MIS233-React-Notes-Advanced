// src/hooks/useAuthFetch.ts
import { useCallback } from "react"
import { useNavigate } from "react-router-dom"


const API_BASE_URL = "http://localhost:8000" // Use your actual backend port

export function useAuthFetch() {
  const navigate = useNavigate()

  const authFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token")
    
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      // This is where the magic happens: Attaching the JWT
      Authorization: token ? `Bearer ${token}` : "", 
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Critical 401 handling
    // useAuthFetch.ts
    if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login"; // Using href is "harder" and breaks the loop better than navigate()
    }
    throw new Error("Unauthorized");
}
    

    return res
  }, [navigate])

  return authFetch
}