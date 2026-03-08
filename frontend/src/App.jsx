// src/App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import { SignUp } from "./pages/auth/SignUp";
import { LogIn } from "./pages/auth/LogIn";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Links } from "./pages/Links";
import PublicProfile from "./pages/PublicProfile";

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
    </Routes>
  );
}

export default App;
