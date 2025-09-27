// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import { SignUp } from "./pages/auth/SignUp";
import { LogIn } from "./pages/auth/LogIn";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Links } from "./pages/Links";
import Preview from "./pages/Preview";

function App() {
  return (
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />
        
        {/* Public shareable profile: https://site.com/@yourhandle */}
        {/* This should come AFTER specific routes but BEFORE catch-alls */}
        <Route path="/@:handle" element={<Preview />} />

        {/* Private dashboard */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="links" replace />} />
          <Route path="links" element={<Links />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 404 fallback - keep this LAST */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;