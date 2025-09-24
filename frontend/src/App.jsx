// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import { SignUp } from "./pages/auth/SignUp";
import { LogIn } from "./pages/auth/LogIn";
import { Dashboard } from "./pages/Dashboard";   // keep as named if your file exports named
import { Profile } from "./pages/Profile";           // <-- default import (fixes your error)
import { Links } from "./pages/Links";
import Preview from "./pages/Preview";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />

        {/* Public shareable profile: https://site.com/@yourhandle */}
        <Route path="/@:handle" element={<Preview />} />

        {/* Private dashboard */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="links" replace />} />
          <Route path="links" element={<Links />} />
          <Route path="profile" element={<Profile />} />        
        </Route>

        {/* (optional) 404 fallback */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
