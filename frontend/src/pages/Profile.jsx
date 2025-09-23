import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProfile } from "../../lib/api.js"; // adjust path

const siteBase = () => {
  try { return window.location.origin; } catch { return ""; }
};

const domainFromUrl = (u="") => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
};

export default function Profile() {
  const { handle } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);
    getPublicProfile(handle)
      .then(({ data }) => { if (mounted) setData(data); })
      .catch((e) => { if (mounted) setErr(e?.response?.data?.error || e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [handle]);

  const shareUrl = useMemo(() => `${siteBase()}/@${handle}`, [handle]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err)      return <div className="p-6 text-red-600">Error: {String(err)}</div>;
  if (!data)    return <div className="p-6">No data</div>;

  const p = data.profile || {};
  const links = Array.isArray(data.links) ? data.links : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6">
        {/* Header / avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border">
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt={p.fullName || p.handle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400 text-sm">No photo</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              {p.fullName || `@${p.handle}`}
            </h1>
            {p.fullName && <p className="text-gray-500">@{p.handle}</p>}
            {p.bio && <p className="text-gray-600 mt-1">{p.bio}</p>}
          </div>
        </div>

        {/* Share link */}
        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 border rounded p-2 text-sm bg-white"
          />
          <button
            className="px-3 py-2 text-sm rounded bg-blue-600 text-white"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl).catch(() => {});
            }}
          >
            Copy
          </button>
        </div>

        {/* Links */}
        <div className="mt-6 grid gap-3">
          {links.length === 0 && (
            <div className="text-gray-500">No links yet.</div>
          )}
          {links.map((l, i) => (
            <a
              key={`${l.url}-${i}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border bg-white rounded px-4 py-3 hover:shadow flex items-center gap-3"
            >
              <div className="w-6 h-6 rounded overflow-hidden bg-gray-100 border shrink-0 grid place-items-center text-xs">
                {/* simple favicon-like block: domain initials */}
                {domainFromUrl(l.url).split(".")[0].slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium">{l.title || domainFromUrl(l.url)}</div>
                <div className="text-xs text-gray-500 truncate">{domainFromUrl(l.url)}</div>
              </div>
              <span className="text-blue-600 text-sm">Open</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
