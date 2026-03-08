import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, Save, Link2 } from "lucide-react";
import { FaGlobe, FaLinkedin, FaTwitter, FaYoutube } from "react-icons/fa";
import { TbDots } from "react-icons/tb";
import { listMyLinks, saveMyLinks } from "../../lib/api.js";

const OPTIONS = [
  { value: "website", label: "Website", Icon: FaGlobe },
  { value: "twitter", label: "Twitter", Icon: FaTwitter },
  { value: "linkedin", label: "LinkedIn", Icon: FaLinkedin },
  { value: "youtube", label: "YouTube", Icon: FaYoutube },
  { value: "custom", label: "Custom", Icon: TbDots },
];

const URL_PLACEHOLDER = {
  website: "https://example.com",
  twitter: "https://twitter.com/your_handle",
  linkedin: "https://www.linkedin.com/in/your_id",
  youtube: "https://youtube.com/@your_channel",
  custom: "https://your-link",
};

const labelForType = (type) =>
  OPTIONS.find((option) => option.value === type)?.label || "Link";

const ensureHttpUrl = (s = "") => {
  const value = String(s).trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const toBulkPayload = (links = []) =>
  links
    .filter((link) => String(link?.url || "").trim())
    .map((link, idx) => ({
      title: (link?.name || "").trim() || labelForType(link?.type) || `Link ${idx + 1}`,
      url: ensureHttpUrl(link?.url || ""),
      isActive: link?.isActive !== false,
    }));

export const Links = () => {
  const outlet = useOutletContext() || {};
  const {
    links = [],
    addLink = () => {},
    removeLink = () => {},
    updateLink = () => {},
    setLinks,
  } = outlet;

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      localStorage.setItem("links", JSON.stringify(links));
      const payload = toBulkPayload(links);
      const token = localStorage.getItem("token");
      await saveMyLinks(payload, token);

      try {
        const { data: resp } = await listMyLinks(token);
        const items = resp?.data || [];
        const mapped = items.map((doc) => ({
          id: doc._id,
          _id: doc._id,
          type: "custom",
          name: doc.title,
          url: doc.url,
          isActive: doc.isActive,
          order: doc.order,
        }));
        if (typeof setLinks === "function") setLinks(mapped);
      } catch {
        // Ignore refresh failures because the save request already succeeded.
      }

      setStatus({ type: "success", msg: "Links saved." });
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Links editor
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
            Shape the path people follow.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Add the destinations that matter most and keep your public profile
            focused. The first few links should represent your strongest actions.
          </p>
        </div>

        <button
          type="button"
          onClick={addLink}
          className="brand-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition"
        >
          <Plus className="h-4 w-4" />
          Add link
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {links.length === 0 && (
          <div className="mesh-card rounded-[1.8rem] border border-dashed border-black/10 p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#132238] text-white">
              <Link2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              Start with your most important destination
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
              Add a website, social profile, booking page, shop link, or custom URL.
            </p>
          </div>
        )}

        {links.map((item, idx) => {
          const selected = OPTIONS.find((option) => option.value === item.type);
          const Icon = selected?.Icon || TbDots;
          const key = item.id || item._id || `link-${idx}`;
          const targetId = item.id || item._id;

          return (
            <article key={key} className="mesh-card glass-panel rounded-[1.8rem] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#132238] text-white">
                    <Icon />
                  </div>
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Link {idx + 1}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-950">
                      {selected?.label || "Choose a link type"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeLink(targetId)}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  aria-label="Remove link"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Link type
                  </span>
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <select
                      value={item.type || ""}
                      onChange={(e) => {
                        const type = e.target.value;
                        const option = OPTIONS.find((entry) => entry.value === type);
                        updateLink(targetId, {
                          type,
                          name: type === "custom" ? item.name : option?.label || "",
                        });
                      }}
                    >
                      <option value="" disabled>
                        Choose link type
                      </option>
                      {OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Display title
                  </span>
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) =>
                        updateLink(targetId, { name: e.target.value })
                      }
                      placeholder={
                        item.type === "custom"
                          ? "What should visitors see?"
                          : labelForType(item.type)
                      }
                    />
                  </div>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Destination URL
                </span>
                <div className="field-shell rounded-2xl px-4 py-3">
                  <input
                    type="url"
                    value={item.url || ""}
                    onChange={(e) => updateLink(targetId, { url: e.target.value })}
                    placeholder={URL_PLACEHOLDER[item.type] || "https://your-link"}
                  />
                </div>
              </label>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="brand-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save links"}
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

export default Links;
