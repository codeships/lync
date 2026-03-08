import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ImagePlus, Save, UserRound } from "lucide-react";
import { uploadAvatar, updateMyProfile, withRetry } from "../../lib/api.js";

export const Profile = () => {
  const {
    image,
    setAvatarUrl,
    selectedFile,
    setSelectedFile,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    handle,
    setHandle,
    bio,
    setBio,
  } = useOutletContext();

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      const payload = { firstName, lastName, handle, bio };
      localStorage.setItem("profile", JSON.stringify(payload));

      if (selectedFile) {
        const avatarResponse = await withRetry(() => uploadAvatar(selectedFile), {
          retries: 2,
          baseDelay: 700,
        });
        if (avatarResponse?.data?.avatarUrl) {
          setAvatarUrl(avatarResponse.data.avatarUrl);
        }
      }

      await withRetry(() => updateMyProfile(payload), { retries: 2, baseDelay: 700 });
      setStatus({ type: "success", msg: "Profile updated." });
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
    <div className="glass-panel-strong rounded-[2rem] p-5 sm:p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Profile editor
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
          Define how linkships introduces you.
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Add the basics your audience needs: a good photo, a memorable handle,
          and a short line that explains what they should expect from your page.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="mesh-card glass-panel rounded-[1.8rem] p-5">
          <div className="grid place-items-center">
            <div className="grid h-40 w-40 place-items-center overflow-hidden rounded-[2rem] bg-[#132238] text-3xl font-bold text-white">
              {image ? (
                <img src={image} alt="Selected profile" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-12 w-12" />
              )}
            </div>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Profile photo
            </span>
            <div className="field-shell rounded-2xl px-4 py-3">
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
          </label>

          <div className="mt-4 rounded-2xl bg-[#132238] px-4 py-3 text-sm text-white/72">
            Recommended: square image, clear face or logo, under 3MB.
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                First name
              </span>
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Last name
              </span>
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Handle
            </span>
            <div className="field-shell flex items-center gap-2 rounded-2xl px-4 py-3">
              <span className="font-semibold text-slate-500">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                placeholder="yourname"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              3-30 characters. Letters, numbers, underscore, and period are allowed.
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Bio
            </span>
            <div className="field-shell rounded-2xl px-4 py-3">
              <textarea
                rows="5"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell visitors what you make, share, or offer."
              />
            </div>
          </label>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="brand-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {selectedFile ? <ImagePlus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save profile"}
        </button>

        {status && (
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status.msg}
          </span>
        )}
      </div>
    </div>
  );
};

export default Profile;
