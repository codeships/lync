// src/pages/PublicProfile.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProfile } from "../../lib/api.js";

export default function Preview() {
  const { handle } = useParams(); // route path should be "/@:handle"
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicProfile(handle);
        setData(res.data);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message);
      }
    })();
  }, [handle]);

  if (err) return <div className="p-6 text-red-600">Error: {String(err)}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200" />
        )}
        <div>
          <div className="font-semibold">{data.firstName} {data.lastName}</div>
          <div className="text-gray-500">@{data.handle}</div>
        </div>
      </div>

      <h2 className="text-sm font-medium mb-2">Links</h2>
      {data.links?.length ? (
        <ul className="space-y-2">
          {data.links.map(l => (
            <li key={l._id} className="bg-white border rounded px-3 py-2">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
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
