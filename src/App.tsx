import { useState, useEffect } from 'react'; // 👈 NEW IMPORTS
import { Routes, Route, Navigate } from "react-router-dom";
import TaskApp from "./TaskApp";
import LoginPage from "./LoginPage.tsx";

function App() {
  // 1. Initial State: Assume the user is loading until checked.
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 2. Effect Hook: Check Local Storage ONLY AFTER the component mounts.
  useEffect(() => {
    // Read the token from local storage
    const token = localStorage.getItem("token");
    
    // Check if the token exists (and maybe check its expiry date here too, in a real app)
    if (token) {
      setIsLoggedIn(true);
    }
    
    // Stop loading state
    setLoading(false); 
  }, []); // Run only once when the component mounts

  // 3. Render Loading Screen: If we are still checking the token, show a message.
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading authentication status...
      </div>
    );
  }

  // 4. Render Routes: Proceed only after loading is complete.
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* The root path ('/') redirects to /tasks if logged in, or to /login if not. */}
      <Route 
        path="/" 
        element={
          isLoggedIn ? <Navigate to="/tasks" replace /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* The actual protected task list route */}
      <Route
        path="/tasks"
        element={
          isLoggedIn ? <TaskApp /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default App;

