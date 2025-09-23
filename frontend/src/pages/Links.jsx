// Links.jsx / Links.tsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { FaGlobe, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";
import { TbDots } from "react-icons/tb";
import { listMyLinks, saveMyLinksBulk } from "../../lib/api";

const OPTIONS = [
  { value: "website",  label: "Website",  Icon: FaGlobe },
  { value: "twitter",  label: "Twitter",  Icon: FaTwitter },
  { value: "linkedin", label: "LinkedIn", Icon: FaLinkedin },
  { value: "youtube",  label: "YouTube",  Icon: FaYoutube },
  { value: "custom",   label: "Custom",   Icon: TbDots },
];

const URL_PLACEHOLDER = {
  website: "https://example.com",
  twitter: "https://twitter.com/your_handle",
  linkedin: "https://www.linkedin.com/in/your_id",
  youtube: "https://youtube.com/@your_channel",
  custom:  "https://your-link",
};

const labelForType = (type) =>
  (OPTIONS.find((o) => o.value === type)?.label) || "Link";

const ensureHttpUrl = (s = "") => {
  const t = String(s).trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};


const toBulkPayload = (links = []) =>
  links
    .filter((l) => String(l?.url || "").trim()) // keep only rows with a URL
    .map((l, idx) => ({
      title: (l?.name || "").trim() || labelForType(l?.type) || `Link ${idx + 1}`,
      url: ensureHttpUrl(l?.url || ""),
      isActive: l?.isActive !== false,
    }));

export const Links = () => {
  // Expected context shape: { links, addLink, removeLink, updateLink, replaceLinks? }
  const { links, addLink, removeLink, updateLink, replaceLinks } = useOutletContext();

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: string }

  // Links.jsx
const handleSave = async () => {
  setSaving(true);
  setStatus(null);
  try {
    localStorage.setItem("links", JSON.stringify(links));

    const token = localStorage.getItem("token");
    const payload = toBulkPayload(links);          // <-- HERE
    await saveMyLinksBulk(payload, token);         // send normalized array

    // Optional: refetch, but mind the response shape
    try {
      const { data } = await listMyLinks(token);
      if (replaceLinks && Array.isArray(data?.data)) {
        replaceLinks(
          data.data.map((doc) => ({
            id: doc._id,
            _id: doc._id,
            type: "custom",          // or infer from URL if you want
            name: doc.title,
            url: doc.url,
            isActive: doc.isActive,
            order: doc.order,
          }))
        );
      }
    } catch {}

    setStatus({ type: "success", msg: "Links saved!" });
  } catch (e) {
    const msg =
      e?.response?.data?.error ||
      e?.response?.data?.message ||
      e?.message ||
      "Failed to save";
    setStatus({ type: "error", msg });
  } finally {
    setSaving(false);
  }
};



  return (
    <div className="bg-white p-5 rounded border">
      <h1 className="text-xl font-bold mb-2">Customize your links</h1>
      <h3 className="text-gray-400 mb-5">
        Add/edit/remove below and then share your profile with the world!
      </h3>

      <div>
        <button
          type="button"
          onClick={addLink}
          className="border rounded text-blue-600 border-blue-600 flex items-center bg-white px-6 py-2"
        >
          <span className="text-xl mr-2">+</span>
          <span>Add New Link</span>
        </button>
      </div>

      <div>
        {links.map((item, idx) => {
          const selected = OPTIONS.find((o) => o.value === item.type);
          const Icon = selected?.Icon || TbDots;
          const key = item.id || item._id || `link-${idx}`;

          return (
            <div key={key} className="border p-5 mt-5 rounded">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="text-xl" />
                  <span className="text-sm text-gray-500">
                    {selected?.label || "No type"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeLink(item.id || item._id)}
                  className="p-1 rounded hover:bg-red-50"
                  title="Remove link"
                  aria-label="Remove link"
                >
                  <MdDelete className="text-red-600 text-xl" />
                </button>
              </div>

              {/* Link type */}
              <div className="mt-4">
                <label className="block mb-2">Link Type</label>
                <select
                  value={item.type || ""}
                  onChange={(e) => {
                    const type = e.target.value;
                    const opt = OPTIONS.find((o) => o.value === type);
                    updateLink(item.id || item._id, {
                      type,
                      name: type === "custom" ? item.name : (opt?.label || ""),
                    });
                  }}
                  className="border p-2 w-full rounded"
                >
                  <option value="" disabled>Choose link name</option>
                  {OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom name when type = custom */}
              {item.type === "custom" && (
                <div className="mt-4">
                  <label className="block mb-2">Custom Name</label>
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      updateLink(item.id || item._id, { name: e.target.value })
                    }
                    className="border p-2 w-full rounded"
                    placeholder="Enter custom link name"
                  />
                </div>
              )}

              {/* URL */}
              <div className="mt-4">
                <label className="block mb-2">Link URL</label>
                <input
                  type="url"
                  value={item.url || ""}
                  onChange={(e) =>
                    updateLink(item.id || item._id, { url: e.target.value })
                  }
                  className="border p-2 w-full rounded"
                  placeholder={URL_PLACEHOLDER[item.type] || "https://your-link"}
                />
              </div>
            </div>
          );
        })}

        {/* Save actions */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="border rounded text-white bg-blue-600 hover:bg-blue-700 px-6 py-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {status && (
            <span
              className={
                status.type === "success"
                  ? "text-green-600 text-sm"
                  : "text-red-600 text-sm"
              }
            >
              {status.msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
