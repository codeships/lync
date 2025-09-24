// src/pages/PublicProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicProfile, API_BASE } from "../../lib/api.js";

export default function PublicProfile() {
  const { handle: raw } = useParams();          // route pattern should be "/@:handle"
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [err, setErr]   = useState(null);
  const [loading, setLoading] = useState(true);

  // sanitize the handle (strip accidental leading ":" and lowercase)
  const handle = useMemo(() => {
    return String(raw || "").replace(/^:+/, "").trim().toLowerCase();
  }, [raw]);

  useEffect(() => {
    if (!handle || handle === "handle") {
      // placeholder or empty — send user to set their handle
      navigate("/dashboard/profile");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await getPublicProfile(handle);
        setData(res.data);
        setErr(null);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message || "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [handle, navigate]);

  // Build a safe avatar URL (works if backend sent relative or absolute)
  const avatarSrc = useMemo(() => {
    const u = data?.avatarUrl?.trim();
    if (!u) return "";
    try {
      // choose a reliable base (API_BASE may be "/" in prod rewrites)
      const base =
        (typeof window !== "undefined" && window.location?.origin) ||
        (String(API_BASE).startsWith("http") ? API_BASE : "http://localhost:5173");
      return new URL(u, String(base).replace(/\/?$/, "/")).toString();
    } catch {
      return u; // last resort
    }
  }, [data?.avatarUrl]);

  const initials = useMemo(() => {
    const f = data?.firstName?.[0] ?? "";
    const l = data?.lastName?.[0] ?? "";
    return `${f}${l}`.toUpperCase() || "👤";
  }, [data?.firstName, data?.lastName]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-white border rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (err === "user_not_found" || /not\s*found/i.test(String(err))) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-red-600 font-semibold mb-2">User not found</div>
        <div className="text-sm text-gray-600 mb-4">
          We couldn’t find a public profile for <code>@{handle}</code>.
        </div>
        <button
          onClick={() => navigate("/dashboard/profile")}
          className="text-blue-600 underline"
        >
          Set your handle
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-md mx-auto p-6">No data.</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={`${data.firstName || ""} ${data.lastName || ""}`}
            className="w-16 h-16 rounded-full object-cover border"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 border grid place-items-center text-gray-600 font-semibold">
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <div className="font-semibold truncate">
            {(data.firstName || "") + (data.lastName ? ` ${data.lastName}` : "")}
          </div>
          <div className="text-gray-500 truncate">@{data.handle}</div>
          {data.bio ? (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">{data.bio}</div>
          ) : null}
        </div>
      </div>

      {/* Links */}
      <h2 className="text-sm font-medium mb-2">Links</h2>
      {data.links?.length ? (
        <ul className="space-y-2">
          {data.links.map((l) => (
            <li key={l._id} className="bg-white border rounded px-3 py-2">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block truncate"
                title={l.title}
              >
                {l.title}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500 text-sm">No links yet.</div>
      )}
    </div>
  );
}
