// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import { SignUp } from "./pages/auth/SignUp";
import { LogIn } from "./pages/auth/LogIn";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Links } from "./pages/Links";
import PublicProfile from "./pages/PublicProfile";

// Temporary debugging version of App.jsx
function App() {
  return (
      <Routes>
        <Route path="/:handle" element={<PublicProfile />} />
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="links" replace />} />
          <Route path="links" element={<Links />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Debug route */}
        {/* <Route path="*" element={
          <div>
            <h2>404 - Route not found</h2>
            <p>Current path: {window.location.pathname}</p>
          </div>
        } /> */}
      </Routes>
  );
}

export default App;