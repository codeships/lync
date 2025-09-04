import { useState } from "react";
import Logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { FaFacebook, FaGithub, FaGoogle } from "react-icons/fa";
import { register } from "../../../lib/api.js";

export const SignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [showPassword, setShowPassword] = useState(true); // default: show password

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
        displayName: form.displayName, // <-- backend expects displayName
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
    <div>
      <nav>
        <ul className="flex flex-row items-center justify-between p-5">
          <li className="flex items-center gap-3">
            <img src={Logo} alt="logo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-semibold">Lync</span>
          </li>
          <li>
            <Link
              to="/login"
              className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Log In
            </Link>
          </li>
        </ul>
      </nav>

      <main>
        <div>
          <div className="flex flex-col gap-4 items-center">
            <h1 className="text-xl font-bold">Sign Up for free</h1>

            {/* Social sign-ups (disabled until backend OAuth is ready) */}
            <button
              className="flex flex-row items-center gap-2 bg-gray-100 w-[220px] p-3 rounded-xl disabled:opacity-60"
              disabled
              title="Google sign-up coming soon"
            >
              Sign Up with Google <FaGoogle />
            </button>

            <button
              className="flex flex-row items-center gap-2 bg-gray-100 w-[220px] p-3 rounded-xl disabled:opacity-60"
              disabled
              title="GitHub sign-up coming soon"
            >
              Sign Up with GitHub <FaGithub />
            </button>

            <button
              className="flex flex-row items-center gap-2 bg-gray-100 w-[220px] p-3 rounded-xl disabled:opacity-60"
              disabled
              title="Facebook sign-up coming soon"
            >
              Sign Up with Facebook <FaFacebook />
            </button>

            <h2 className="text-sm">or</h2>

            {/* Email form */}
            <div className="flex flex-col items-center">
              <form onSubmit={emailSignUp} className="flex flex-col gap-5 items-center">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  className="border p-2 w-80 rounded-[5px]"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                  required
                />

                {/* Password input with toggle */}
                <div className="relative w-80">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    placeholder="Password"
                    className="border p-2 w-full rounded-[5px] pr-12"
                    value={form.password}
                    onChange={onChange}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-sm text-blue-600 hover:underline"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <input
                  type="text"
                  name="displayName"
                  id="displayName"
                  placeholder="Display name"
                  className="border p-2 w-80 rounded-[5px]"
                  value={form.displayName}
                  onChange={onChange}
                  autoComplete="username"
                  required
                />

                <button
                  type="submit"
                  className="bg-blue-500 w-[380px] text-xl text-white rounded-sm p-2 flex items-center justify-center hover:bg-black disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>

              {err && <p className="text-red-600 mt-3 text-sm">{err}</p>}

              <div className="flex flex-col items-center gap-4 mt-5">
                <p className="text-sm">
                  Your display name will be used in your Lync link. It must be
                  unique and can only contain letters, numbers, and underscores.
                </p>
                <p className="text-sm">
                  By signing up, you agree to our Terms of Service and Privacy
                  Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
