import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { FaGlobe, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";
import { TbDots } from "react-icons/tb";

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

export const Links = () => {
  const { links, addLink, removeLink, updateLink } = useOutletContext();

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: string }

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      // Persist locally
      localStorage.setItem("links", JSON.stringify(links));

      // --- Optional: save to your backend ---
      // const API = "http://localhost:4000";
      // const token = localStorage.getItem("token");
      // await fetch(`${API}/api/links/bulk`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ links }),
      // });

      setStatus({ type: "success", msg: "Links saved!" });
    } catch (e) {
      setStatus({ type: "error", msg: e?.message || "Failed to save" });
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
        {links.map((item) => {
          const selected = OPTIONS.find((o) => o.value === item.type);
          const Icon = selected?.Icon || TbDots;

          return (
            <div key={item.id} className="border p-5 mt-5 rounded">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="text-xl" />
                  <span className="text-sm text-gray-500">
                    {selected?.label || "No type"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeLink(item.id)}
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
                  value={item.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    const opt = OPTIONS.find((o) => o.value === type);
                    updateLink(item.id, {
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
                    value={item.name}
                    onChange={(e) => updateLink(item.id, { name: e.target.value })}
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
                  value={item.url}
                  onChange={(e) => updateLink(item.id, { url: e.target.value })}
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
            <span className={status.type === "success" ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
              {status.msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
