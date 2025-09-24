// src/pages/dashboard/Profile.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
// IMPORTANT: include .js to avoid case/extension issues on Linux hosts (Vercel)
import { uploadAvatar, updateMyProfile, withRetry } from "../../lib/api.js";

export const Profile = () => {
  const {
    image,
    selectedFile, setSelectedFile,
    firstName, setFirstName,
    lastName, setLastName,
  } = useOutletContext();

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success"|"error", msg: string }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      // Persist locally (optional convenience)
      const payload = { firstName, lastName };
      localStorage.setItem("profile", JSON.stringify(payload));

      // ---- SAVE TO BACKEND (DB) ----
      // 1) Upload avatar if a file is selected
      if (selectedFile) {
        await withRetry(() => uploadAvatar(selectedFile), { retries: 2, baseDelay: 700 });
      }

      // 2) Save profile fields
      await withRetry(() => updateMyProfile(payload), { retries: 2, baseDelay: 700 });

      setStatus({ type: "success", msg: "Saved to database!" });
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
      <h1 className="text-xl font-bold mb-4">Profile</h1>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Avatar uploader */}
        <div>
          <label className="block mb-2 text-sm text-gray-600">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <div className="mt-3">
            <div className="w-32 h-32 rounded-full overflow-hidden border bg-gray-100">
              {image ? (
                <img src={image} alt="Selected Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-gray-400 text-xs">
                  No photo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Name fields */}
        <div className="grid gap-4">
          <div>
            <label className="block mb-1 text-sm text-gray-600">First Name</label>
            <input
              className="border p-2 w-full rounded"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-600">Last Name</label>
            <input
              className="border p-2 w-full rounded"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>
      </div>

      {/* Save actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {status && (
          <span
            className={status.type === "success" ? "text-green-600 text-sm" : "text-red-600 text-sm"}
          >
            {status.msg}
          </span>
        )}
      </div>
    </div>
  );
};

export default Profile;
