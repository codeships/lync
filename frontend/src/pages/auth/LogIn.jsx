import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AtSign, Lock, Mail } from "lucide-react";
import { login, setAuthToken } from "../../../lib/api";
import { AuthShell } from "../../components/AuthShell";

export const LogIn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [displayname, setDisplayname] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginWithMail = async (e) => {
    e.preventDefault();
    if (!email || !pass) return;

    setLoading(true);
    setMsg("");

    try {
      const payload = {
        email,
        password: pass,
        ...(displayname ? { displayName: displayname } : {}),
      };

      const out = await login(payload);
      const data = out?.data ?? out ?? {};
      const token = data.token ?? data.accessToken ?? data.jwt ?? null;
      const user = data.user ?? data.profile ?? null;

      if (!token) {
        throw new Error("No token returned from server");
      }

      setAuthToken(token);

      if (user) {
        localStorage.setItem("me", JSON.stringify(user));
      } else {
        localStorage.removeItem("me");
      }

      navigate(location.state?.from || "/dashboard");
    } catch (err) {
      const apiMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setMsg(apiMsg);
      setAuthToken(null);
      localStorage.removeItem("me");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to update your page, adjust your links, and publish a cleaner public profile."
      sideTitle="Your creator hub should feel polished the moment you return."
      sideBody="Use linkships to keep every important destination in sync and ready to share without fighting a messy editor."
      alternateLabel="Create account"
      alternateTo="/signup"
    >
      <form onSubmit={loginWithMail} className="space-y-4">
        {msg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {msg}
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <div className="field-shell flex items-center gap-3 rounded-2xl px-4 py-3">
            <Mail className="h-4 w-4 text-slate-400" />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </span>
          <div className="field-shell flex items-center gap-3 rounded-2xl px-4 py-3">
            <Lock className="h-4 w-4 text-slate-400" />
            <input
              type={showPass ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="text-slate-400 transition hover:text-slate-700"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Display name
            <span className="ml-2 text-xs font-medium text-slate-400">optional</span>
          </span>
          <div className="field-shell flex items-center gap-3 rounded-2xl px-4 py-3">
            <AtSign className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="displayname"
              placeholder="your_handle"
              value={displayname}
              onChange={(e) => setDisplayname(e.target.value)}
              autoComplete="username"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading || !email || !pass}
          className="brand-button mt-2 w-full rounded-2xl px-5 py-4 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        New to linkships?{" "}
        <Link to="/signup" className="font-semibold text-[#d74a11]">
          Create your account
        </Link>
      </p>
    </AuthShell>
  );
};
