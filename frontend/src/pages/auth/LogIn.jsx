import { useState } from "react";
import Logo from "../../assets/logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { login, setAuthToken } from "../../../lib/api";
import { Eye, EyeOff } from "lucide-react";

export const LogIn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [displayname, setDisplayname] = useState(""); // optional
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPass, setShowPass] = useState(true);
  const [showUser, setShowUser] = useState(true);


  const loginWithMail = async (e) => {
  e.preventDefault();
  if (!email || !pass) return;

  setLoading(true);
  setMsg("");

  try {
    // Build the payload with email, password, and optional displayName
    const payload = {
      email,
      password: pass,
      ...(displayname ? { displayName: displayname } : {}),
    };

    const out = await login(payload);

    // Support multiple API response shapes
    const data  = out?.data ?? out ?? {};
    const token = data.token ?? data.accessToken ?? data.jwt ?? null;
    const user  = data.user  ?? data.profile     ?? null;

    if (!token) {
      throw new Error("No token returned from server");
    }

    // Persist token via shared helper (so axios adds Authorization header automatically)
    setAuthToken(token);

    if (user) {
      localStorage.setItem("me", JSON.stringify(user));
    } else {
      localStorage.removeItem("me"); // clear old data if no user returned
    }

    // Navigate to dashboard or original protected route
    navigate(location.state?.from || "/dashboard");
  } catch (err) {
    const apiMsg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Login failed. Please try again.";
    setMsg(apiMsg);

    // Clear stale token/user on failure
    setAuthToken(null);
    localStorage.removeItem("me");
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <nav>
        <ul className="flex flex-row items-center justify-between p-5">
          <li className="flex items-center gap-3">
            <img src={Logo} alt="Lync" className="w-12 h-12 object-contain" />
            <span className="text-xl font-semibold">Lync</span>
          </li>
          <li>
            <Link
              to="/signup"
              className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Sign Up
            </Link>
          </li>
        </ul>
      </nav>

      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center mt-5 w-[380px] max-w-full">
          <h1 className="text-xl font-bold mb-5">Welcome Back</h1>

          {msg && (
            <div className="w-full mb-3 text-sm text-blue-700 bg-blue-50 p-2 rounded">
              {msg}
            </div>
          )}

          <form onSubmit={loginWithMail} className="flex flex-col gap-4 w-full">
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 w-full rounded-[5px]"
              autoComplete="email"
              required
            />

            {/* Password with visibility toggle */}
            <div className="relative w-full">
              <input
                type={showPass ? "text" : "password"}
                name="password"
                id="password"
                placeholder="Password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="border p-2 w-full rounded-[5px] pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                aria-label={showPass ? "Hide password" : "Show password"}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Optional displayname (if your backend accepts email OR displayname) */}
            <div className="relative w-full">
              <input
                type={showUser ? "text" : "password"}
                name="displayname"
                id="displayname"
                placeholder="Display name (optional)"
                value={displayname}
                onChange={(e) => setDisplayname(e.target.value)}
                className="border p-2 w-full rounded-[5px] pr-10"
                autoComplete="username"
              />
              <button
                type="button"
                onClick={() => setShowUser((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                aria-label={showUser ? "Hide display name" : "Show display name"}
                title={showUser ? "Hide display name" : "Show display name"}
              >
                {showUser ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !pass}
              className="bg-blue-500 w-full text-xl text-white rounded-sm p-2 hover:bg-black disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-600 underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
