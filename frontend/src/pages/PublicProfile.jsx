// src/pages/PublicProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPublicProfileCached,
  normalizeHandle,
  resolveAssetUrl,
} from "../../lib/api"; // keep this import

export default function PublicProfile() {
  const { handle: raw } = useParams(); // route pattern: /@:handle
  const navigate = useNavigate();

  const handle = useMemo(() => normalizeHandle(raw), [raw]);

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgOk, setImgOk] = useState(true);

  // Prefer absolute URL; otherwise use your resolver.
  const safeResolve = (url) => {
    if (!url || typeof url !== "string") return "";
    try {
      // Absolute (http/https/data/blob) should pass through untouched.
      const lower = url.trim().toLowerCase();
      if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("data:") ||
        lower.startsWith("blob:")
      ) {
        return url;
      }
      // Otherwise defer to backend resolver (e.g., prepend CDN/API origin)
      return resolveAssetUrl(url);
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!handle || handle === "handle") {
      navigate("/dashboard/profile"); // placeholder → set a real handle
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setImgOk(true);

        const profile = await getPublicProfileCached(handle, {
          ttl: 30000,
          signal: ac.signal,
        });

        setData(profile || null);
      } catch (e) {
        setErr(e?.code || e?.message || "error");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [handle, navigate]);

  const avatarSrc = useMemo(
    () => safeResolve(data?.avatarUrl),
    [data?.avatarUrl]
  );

  const initials = useMemo(() => {
    const f = data?.firstName?.[0] ?? "";
    const l = data?.lastName?.[0] ?? "";
    const s = `${f}${l}`.toUpperCase();
    return s || "👤";
  }, [data?.firstName, data?.lastName]);

  const displayName = useMemo(
    () => (data ? [data.firstName, data.lastName].filter(Boolean).join(" ") : ""),
    [data]
  );

  // Basic URL cleaner for link display text
  const prettyUrl = (u) => {
    try {
      const s = String(u || "");
      return s.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    } catch {
      return "";
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (err) {
    const isNotFound = err === "user_not_found" || /not\s*found/i.test(String(err));
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">
          {isNotFound ? "User not found" : "Error loading profile"}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          {isNotFound
            ? `We couldn't find a public profile for @${handle}.`
            : String(err)}
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="text-gray-600">No profile data available.</div>
      </div>
    );
  }

  // Success
  return (
    <div className="max-w-md mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          {avatarSrc && imgOk ? (
            <img
              src={avatarSrc}
              alt={displayName || data.handle}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              // Important: omit crossOrigin unless you truly need it and your server sends CORS headers.
              onError={() => setImgOk(false)}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-gray-200 grid place-items-center text-2xl font-bold text-gray-700">
              {initials}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          {displayName || `${data.handle}`}
        </h1>
        <div className="text-gray-500 mb-2">@{data.handle}</div>

        {!!data.bio && (
          <div className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap">
            {data.bio}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Links</h2>

        {Array.isArray(data.links) && data.links.length > 0 ? (
          <div className="space-y-2">
            {data.links.map((link) => {
              const href = String(link?.url || "#");
              const title = link?.title || prettyUrl(href) || "Link";
              return (
                <a
                  key={link?._id || href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                    {title}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {prettyUrl(href)}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-1">No links yet</div>
            <div className="text-sm">This user hasn't added any links</div>
          </div>
        )}
      </div>
    </div>
  );
}
