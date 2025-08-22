import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { SignUp } from './pages/auth/SignUp';
import { LogIn } from './pages/auth/Login';
import axios from "axios";
import { Dashboard } from './pages/Dashboard';

    function App() {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      );
    }

    export default App;