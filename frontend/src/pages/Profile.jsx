import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, API_BASE } from "../../lib/api.js";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgOk, setImgOk] = useState(true);

  const navigate = useNavigate();

  // Fetch profile data on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getMyProfile();
        setProfile(res.data);
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build full avatar URL
  const avatarSrc = useMemo(() => {
    const u = profile?.avatarUrl?.trim();
    if (!u) return "";
    try {
      return new URL(u, String(API_BASE).replace(/\/?$/, "/")).toString();
    } catch {
      return u;
    }
  }, [profile?.avatarUrl]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-5">
          <div className="flex items-center space-x-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-5">
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            Error: {error}
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-5">
          <p className="text-sm text-gray-600">No profile data available.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </button>
          <h1 className="text-base font-semibold">My Profile</h1>
          <div className="w-8" /> {/* Spacer to balance layout */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-5">
        {/* Profile Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
          <div className="flex items-center gap-3">
            {avatarSrc && imgOk ? (
              <img
                src={avatarSrc}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-16 h-16 rounded-full object-cover border border-gray-100"
                onError={() => setImgOk(false)}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold">
                {initials || "👤"}
              </div>
            )}

            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight truncate">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">{profile.email}</div>
              {profile.handle && (
                <div className="mt-1 text-xs text-gray-600">@{profile.handle}</div>
              )}
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-3 text-sm text-gray-700">{profile.bio}</p>
          ) : null}
        </section>

        {/* Links Section */}
        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Links</h2>
          {profile.links?.length ? (
            <ul className="space-y-2">
              {profile.links.map((link) => (
                <li
                  key={link._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm font-medium text-blue-600 hover:underline truncate"
                        title={link.title}
                      >
                        {link.title}
                      </a>
                      <div className="text-xs text-gray-500 truncate" title={link.url}>
                        {link.url}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-[10px] px-2 py-1 rounded-full ${
                        link.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {link.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No links found.</p>
          )}
        </section>

        {/* Bottom padding for safe areas on phones */}
        <div className="h-8" />
      </main>
    </div>
  );
}
