import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { register } from "../../../lib/api.js";
import { AuthShell } from "../../components/AuthShell";

export const SignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validateDisplayName = (u) =>
    /^[A-Za-z0-9_]+$/.test(u || "") && (u || "").length >= 3;

  const emailSignUp = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!form.email || !form.password || !form.displayName) {
      return setErr("Please fill all fields.");
    }
    if (!validateDisplayName(form.displayName)) {
      return setErr(
        "Display name must be at least 3 characters and contain only letters, numbers, and underscores."
      );
    }

    setLoading(true);
    try {
      const { data } = await register({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
      });

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("me", JSON.stringify(data.user));

      navigate(data?.token ? "/dashboard" : "/login");
    } catch (e) {
      const apiMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Sign up failed";
      setErr(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your linkships account"
      subtitle="Reserve your handle, build your page, and start sharing one clean destination everywhere."
      sideTitle="Build a page that matches the quality of what you make."
      sideBody="Start with a distinct handle, add the links that matter, and publish a public profile that feels current instead of generic."
      alternateLabel="Have an account?"
      alternateTo="/login"
    >
      <form onSubmit={emailSignUp} className="space-y-4">
        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
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
              value={form.email}
              onChange={onChange}
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
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Choose a secure password"
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-slate-400 transition hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Display name
          </span>
          <div className="field-shell flex items-center gap-3 rounded-2xl px-4 py-3">
            <AtSign className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="displayName"
              placeholder="your_handle"
              value={form.displayName}
              onChange={onChange}
              autoComplete="username"
              required
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="brand-button mt-2 w-full rounded-2xl px-5 py-4 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-sm leading-6 text-slate-600">
        <p>
          Your display name becomes the base of your public linkships identity. Use
          something short, clear, and easy to share.
        </p>
        <p>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-[#d74a11]">
            Sign in instead
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};
