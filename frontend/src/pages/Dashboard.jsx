import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  memo,
  useTransition,
} from "react";
import { useAuthListener } from "../components/useAuthListener";
import {
  Link as LinkIcon,
  Brush,
  ChartColumn,
  Settings as SettingsIcon,
  X,
  Trash2,
  Check,
} from "lucide-react";

/** ---------- Small utils ---------- */
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

/** ---------- Memoized UI atoms ---------- */
const MenuItem = memo(function MenuItem({ id, activeTab, setActiveTab, icon: Icon, label }) {
  const isActive = activeTab === id;
  const onClick = useCallback(() => setActiveTab(id), [id, setActiveTab]);
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 mb-2 px-2 py-2 rounded-sm text-left transition ${
        isActive ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="shrink-0" />
      <span>{label}</span>
    </button>
  );
});

const LinksList = memo(function LinksList({ links, onDelete }) {
  if (links.length === 0) {
    return (
      <div className="empty-state p-4 text-center border rounded-lg bg-gray-50">
        <p className="text-gray-500">You haven&apos;t added any links yet.</p>
      </div>
    );
  }

  return (
    <div className="links-list mt-4 space-y-2">
      {links.map((link) => (
        <div
          key={link.id}
          className="link-item flex justify-between items-center p-3 border rounded-lg bg-white"
        >
          <div className="link-info">
            <div className="link-title font-medium">{link.title}</div>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-url text-blue-500 text-sm hover:underline"
            >
              {link.url}
            </a>
          </div>
          <button
            onClick={() => onDelete(link.id)}
            className="text-gray-500 hover:text-red-500 transition"
            aria-label="Delete link"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
});

/** ---------- Settings form isolated & memoized ---------- */
const SettingsForm = memo(function SettingsForm({
  user,
  settingsData,
  onChangeImmediate, // fast local change
  onSave,            // manual save
  appearanceSettings,
  setAppearanceSettings,
}) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState();

  const getFile = useCallback((event) => {
    const f = event.target.files?.[0];
    if (!f) return;
    setFile(URL.createObjectURL(f));
  }, []);

  const onAppearance = useCallback((setting, value) => {
    setAppearanceSettings((prev) => ({ ...prev, [setting]: value }));
  }, [setAppearanceSettings]);

  return (
    <section className="p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>
      <p className="text-sm text-blue-600 mb-4">Edits apply instantly. Save manually if you like.</p>

      <div className="space-y-4">
        <div>
          <h1 className="mt-3 mb-3 font-bold">Account</h1>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            name="displayName"
            value={settingsData.displayName}
            onChange={onChangeImmediate}
            className="w-[400px] border rounded px-3 py-2"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            value={user?.email || ""}
            className="w-[400px] border rounded px-3 py-2 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            name="bio"
            value={settingsData.bio}
            onChange={onChangeImmediate}
            className="w-[400px] border rounded px-3 py-2 h-[120px]"
            placeholder="Short bio"
          />
        </div>

        <div>
          <h1 className="font-bold">Avatar</h1>
          <input
            ref={fileInputRef}
            type="file"
            onChange={getFile}
            className=" mb-2 bg-blue-600 text-white w-[200px]"
          />
          {file && <img src={file} alt="avatar preview" className="w-50 h-50" />}
        </div>

        <div>
          <h1 className="font-bold text-xl mb-2">Handle</h1>
          <input
            type="text"
            name="handle"
            value={settingsData.handle}
            onChange={onChangeImmediate}
            className="w-[400px] border rounded px-3 py-2"
            placeholder="your-handle"
          />
        </div>

        <div>
          <h1 className="font-bold text-xl mb-2">Social Links</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Instagram Username</label>
              <input
                type="text"
                name="instagram"
                value={settingsData.instagram}
                onChange={onChangeImmediate}
                className="w-[400px] border rounded px-3 py-2"
                placeholder="e.g. johndoe"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">X (Twitter) Username</label>
              <input
                type="text"
                name="twitter"
                value={settingsData.twitter}
                onChange={onChangeImmediate}
                className="w-[400px] border rounded px-3 py-2"
                placeholder="e.g. johndoe"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Facebook Username</label>
              <input
                type="text"
                name="facebook"
                value={settingsData.facebook}
                onChange={onChangeImmediate}
                className="w-[400px] border rounded px-3 py-2"
                placeholder="e.g. johndoe"
              />
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-bold text-xl mb-2">Custom Domain</h1>
          <input
            type="text"
            name="customDomain"
            value={settingsData.customDomain}
            onChange={onChangeImmediate}
            placeholder="yourdomain.com"
            className="w-[400px] border rounded px-3 py-2"
          />
          <button onClick={onSave} className="bg-gray-200 mt-3 ml-3 rounded p-2">
            Verify
          </button>
        </div>

        <div>
          <h1 className="font-bold text-xl mb-2">Privacy</h1>

          <div className="flex justify-between items-center border rounded w-[600px] p-3 mb-3">
            <div>
              <h3>Public</h3>
              <p className="text-blue-600">Your profile is visible to everyone.</p>
            </div>
            <input
              type="radio"
              name="privacy"
              value="public"
              checked={settingsData.privacy === "public"}
              onChange={onChangeImmediate}
              className="w-5 h-5"
            />
          </div>

          <div className="flex justify-between items-center border rounded w-[600px] p-3">
            <div>
              <h3>Unlisted</h3>
              <p className="text-blue-600">Your profile is only accessible via a direct link.</p>
            </div>
            <input
              type="radio"
              name="privacy"
              value="unlisted"
              checked={settingsData.privacy === "unlisted"}
              onChange={onChangeImmediate}
              className="w-5 h-5"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onSave}
            className="bg-blue-600 text-white text-sm px-3 py-2 rounded hover:bg-blue-700"
          >
            Save Now
          </button>
        </div>

        {/* Appearance (kept here for convenience; could be its own memo too) */}
        <div className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <p className="text-sm text-gray-600 mb-4">Customize your theme, colors, and profile visuals.</p>

          <div className="flex flex-row">
            <div className="grid gap-4 mb-6">
              {["light", "dark", "system", "custom"].map((opt) => (
                <button
                  key={opt}
                  className={`border rounded-lg p-4 w-[150px] text-left transition ${
                    appearanceSettings.theme === opt ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onAppearance("theme", opt)}
                >
                  <div className="flex justify-between items-center">
                    <span>{opt === "custom" ? "Custom…" : `${opt[0].toUpperCase()}${opt.slice(1)} Theme`}</span>
                    {appearanceSettings.theme === opt && <Check className="text-blue-500" />}
                  </div>
                </button>
              ))}
            </div>
            <div />
          </div>

          {appearanceSettings.theme === "custom" && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Custom Theme Settings</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Button Style</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={appearanceSettings.buttonStyle}
                    onChange={(e) => onAppearance("buttonStyle", e.target.value)}
                  >
                    <option value="rounded">Rounded</option>
                    <option value="square">Square</option>
                    <option value="pill">Pill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Button Color</label>
                  <input
                    type="color"
                    value={appearanceSettings.buttonColor}
                    onChange={(e) => onAppearance("buttonColor", e.target.value)}
                    className="w-full h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Background Color</label>
                  <input
                    type="color"
                    value={appearanceSettings.backgroundColor}
                    onChange={(e) => onAppearance("backgroundColor", e.target.value)}
                    className="w-full h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Text Color</label>
                  <input
                    type="color"
                    value={appearanceSettings.textColor}
                    onChange={(e) => onAppearance("textColor", e.target.value)}
                    className="w-full h-10"
                  />
                </div>
              </div>

              <div
                className="mt-4 p-3 border rounded"
                style={{ backgroundColor: appearanceSettings.backgroundColor }}
              >
                <p style={{ color: appearanceSettings.textColor }}>Preview Text</p>
                <button
                  className="mt-2 px-4 py-2 text-white"
                  style={{
                    backgroundColor: appearanceSettings.buttonColor,
                    borderRadius:
                      appearanceSettings.buttonStyle === "rounded"
                        ? "0.5rem"
                        : appearanceSettings.buttonStyle === "pill"
                        ? "2rem"
                        : "0",
                  }}
                >
                  Example Button
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

/** ================== DASHBOARD ================== */
export const Dashboard = () => {
  const user = useAuthListener();

  // Keep hooks stable on every render
  const [activeTab, setActiveTab] = useState("links");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Links state
  const [links, setLinks] = useState([
    { id: 1, title: "My Portfolio", url: "https://portfolio.example.com" },
    { id: 2, title: "Blog", url: "https://blog.example.com" },
  ]);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [errors, setErrors] = useState({});

  // Appearance + Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    buttonStyle: "rounded",
    buttonColor: "#3b82f6",
    backgroundColor: "#ffffff",
    textColor: "#000000",
  });

  // Source of truth settings data in Dashboard (for save/API etc.)
  const [settingsData, setSettingsData] = useState({
    displayName: user?.displayName || "",
    bio: "",
    handle: "",
    instagram: "",
    twitter: "",
    facebook: "",
    customDomain: "",
    privacy: "public",
  });

  // Local, super-fast settings for typing (mirrors settingsData)
  const [settingsDraft, setSettingsDraft] = useState(settingsData);

  // Keep displayName in sync if user arrives later
  useEffect(() => {
    const displayName = user?.displayName || "";
    setSettingsData((prev) => ({ ...prev, displayName }));
    setSettingsDraft((prev) => ({ ...prev, displayName }));
  }, [user?.displayName]);

  // Transition to keep non-urgent updates smooth
  const [isPending, startTransition] = useTransition();

  // Fast local changes: update draft immediately; sync to main state in a transition
  const onSettingsChangeImmediate = useCallback((e) => {
    const { name, value } = e.target;
    setSettingsDraft((prev) => ({ ...prev, [name]: value }));
    // Non-urgent: reflect into main state without blocking typing
    startTransition(() => {
      setSettingsData((prev) => ({ ...prev, [name]: value }));
    });
  }, [startTransition]);

  // -------- Links handlers (memoized) --------
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewLink((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!newLink.title.trim()) newErrors.title = "Title is required";
    if (!newLink.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!isValidUrl(newLink.url)) {
      newErrors.url = "Please enter a valid URL (include http:// or https://)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newLink.title, newLink.url]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      const newLinkItem = {
        id: links.length > 0 ? Math.max(...links.map((link) => link.id)) + 1 : 1,
        title: newLink.title,
        url: newLink.url,
      };
      setLinks((prev) => [newLinkItem, ...prev]);
      setNewLink({ title: "", url: "" });
      setIsModalOpen(false);
    },
    [validateForm, links.length, newLink.title, newLink.url]
  );

  const handleDelete = useCallback((id) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

  const openModal = useCallback(() => {
    setNewLink({ title: "", url: "" });
    setErrors({});
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Save (stub)
  const saveSettings = useCallback(() => {
    alert("Settings saved successfully!");
  }, []);

  /** -------- Content switch (memoized data/handlers) -------- */
  const content = useMemo(() => {
    switch (activeTab) {
      case "links":
        return (
          <section className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Links</h2>
              <button
                onClick={openModal}
                className="text-sm text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 transition"
              >
                + Quick Add
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Add links to all of your content.</p>

            <LinksList links={links} onDelete={handleDelete} />

            {/* Modal lives outside; this area keeps pure */}
          </section>
        );
      case "appearance":
        return (
          <section className="p-6">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <p className="text-sm text-gray-600 mb-4">
              You can also tweak appearance in Settings below.
            </p>
            {/* lightweight forwarder to Settings section */}
          </section>
        );
      case "analytics":
        return (
          <section className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <p className="text-sm text-gray-600 mb-4">Track clicks and visits to your links.</p>
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">No data yet. Share your profile to start seeing insights.</p>
            </div>
          </section>
        );
      case "settings":
        return (
          <SettingsForm
            user={user}
            settingsData={settingsDraft}
            onChangeImmediate={onSettingsChangeImmediate}
            onSave={saveSettings}
            appearanceSettings={appearanceSettings}
            setAppearanceSettings={setAppearanceSettings}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    links,
    handleDelete,
    openModal,
    user,
    settingsDraft,
    onSettingsChangeImmediate,
    saveSettings,
    appearanceSettings,
  ]);

  // --- Shell (no early returns) ---
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[280px] border-r">
        <div className="flex items-center gap-3 ml-5 mt-5">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="rounded-full w-11 h-11 object-cover" />
          ) : (
            <div className="rounded-full w-11 h-11 bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-600">{(user?.displayName || "?").charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-[14px] font-semibold">{user?.displayName || "Anonymous User"}</h2>
            <p className="text-sm text-gray-600">{user?.email || ""}</p>
          </div>
        </div>

        <nav className="mt-4 ml-5 mr-3">
          <MenuItem id="links" activeTab={activeTab} setActiveTab={setActiveTab} icon={LinkIcon} label="Links" />
          <MenuItem id="appearance" activeTab={activeTab} setActiveTab={setActiveTab} icon={Brush} label="Appearance" />
          <MenuItem id="analytics" activeTab={activeTab} setActiveTab={setActiveTab} icon={ChartColumn} label="Analytics" />
          <MenuItem id="settings" activeTab={activeTab} setActiveTab={setActiveTab} icon={SettingsIcon} label="Settings" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {user === undefined ? (
          <div className="p-6">Loading...</div>
        ) : !user ? (
          <div className="p-6">No user logged in.</div>
        ) : (
          content
        )}
        {activeTab === "settings" && (
          <div className="px-6 pb-2 text-xs text-gray-500">{isPending ? "Updating…" : ""}</div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Add New Link</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newLink.title}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.title ? "border-red-500" : ""}`}
                  placeholder="Enter link title"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="url" className="block text-sm font-medium mb-1">
                  URL
                </label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={newLink.url}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.url ? "border-red-500" : ""}`}
                  placeholder="https://example.com"
                />
                {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600">
                  Add Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
