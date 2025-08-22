import React, { useState } from "react";
import Logo from "../../assets/logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, googleProvider } from "../../../lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

export const LogIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPass, setShowPass] = useState(true); // show password by default

  // Handle magic-link complete if the user opens the link on this page
  React.useEffect(() => {
    (async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let savedEmail = window.localStorage.getItem("emailForSignIn");
          if (!savedEmail) savedEmail = window.prompt("Confirm your email for sign in");
          if (savedEmail) {
            await signInWithEmailLink(auth, savedEmail, window.location.href);
            window.localStorage.removeItem("emailForSignIn");
            navigate(location.state?.from || "/dashboard");
          }
        }
      } catch (e) {
        console.error(e);
        setMsg("Could not complete magic link sign-in.");
      }
    })();
  }, [navigate, location.state]);

  const loginWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      navigate(location.state?.from || "/dashboard"); // fixed typo from /dasboard
    } catch (err) {
      setMsg(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setMsg("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(location.state?.from || "/dashboard");
    } catch (err) {
      setMsg(err.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) return setMsg("Enter your email first.");
    setLoading(true);
    setMsg("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent.");
    } catch (err) {
      setMsg(err.message ?? "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    if (!email) return setMsg("Enter your email to receive a magic link.");
    setLoading(true);
    setMsg("");
    try {
      const actionCodeSettings = {
        url: window.location.origin + "/login", // route that handles link completion
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMsg("Magic link sent! Check your email.");
    } catch (err) {
      setMsg(err.message ?? "Could not send magic link.");
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

          <form onSubmit={loginWithEmail} className="flex flex-col gap-4 w-full">
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

            <button
              type="button"
              onClick={forgotPassword}
              className="text-sm text-blue-600 text-left hover:underline"
            >
              Forgot Password?
            </button>

            <button
              disabled={loading}
              className="bg-blue-500 w-full text-xl text-white rounded-sm p-2 hover:bg-black disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="my-4 text-sm">or</div>

          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="border w-full p-2 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Continue with Google
          </button>

          <button
            onClick={sendMagicLink}
            disabled={loading}
            className="mt-3 text-sm underline hover:text-blue-600 disabled:opacity-50"
          >
            Log in with a magic link
          </button>

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
