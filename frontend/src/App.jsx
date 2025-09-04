import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import { SignUp } from './pages/auth/SignUp';
import { LogIn } from './pages/auth/Login';
import axios from "axios";
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Links } from './pages/Links';

    function App() {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<Navigate to="links" replace />} />
              <Route path="links" element={<Links />} />
              <Route path="profile" element={<Profile />} />
              <Route />
            </Route>

          </Routes>
        </BrowserRouter>
      );
    }

    export default App;