import { useEffect, useState, useMemo } from "react";
import { getMyProfile, API_BASE } from "../../lib/api.js";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const avatarSrc = useMemo(() => {
    const u = profile?.avatarUrl?.trim();
    if (!u) return "";
    // If it already looks absolute, use it as-is
    if (/^https?:\/\//i.test(u)) return u;
    // Otherwise prefix with API base (which already includes protocol)
    const base = String(API_BASE).replace(/\/+$/,"");
    const path = u.startsWith("/") ? u : `/${u}`;
    return `${base}${path}`;
  }, [profile?.avatarUrl]);

  const [imgOk, setImgOk] = useState(true);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!profile) return <div className="p-6">No profile data available.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center space-x-4 mb-6">
        {avatarSrc && imgOk ? (
          <img
            src={avatarSrc}
            alt={`${profile.firstName} ${profile.lastName}`}
            className="w-20 h-20 rounded-full object-cover border"
            referrerPolicy="no-referrer"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-gray-500">{profile.bio || "No bio provided"}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Links</h2>
      {profile.links?.length ? (
        <ul className="space-y-2">
          {profile.links.map((link) => (
            <li key={link._id} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {link.title}
              </a>
              <span className={`text-xs px-2 py-1 rounded ${link.isActive ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-600"}`}>
                {link.isActive ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No links found.</p>
      )}
    </div>
  );
}
