import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Eye,
  Link2,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FaGlobe, FaLinkedin, FaTwitter, FaYoutube } from "react-icons/fa";
import { TbDots } from "react-icons/tb";
import { logout as apiLogout, getMyProfile } from "../../lib/api.js";
import { BrandMark } from "../components/BrandMark";

const ICONS = {
  website: FaGlobe,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  custom: TbDots,
};

export const Dashboard = () => {
  const navigate = useNavigate();

  const [links, setLinks] = useState(() => {
    try {
      const raw = localStorage.getItem("links");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("links", JSON.stringify(links));
    } catch {
      // Ignore storage failures so the editor remains usable.
    }
  }, [links]);

  const addLink = () => {
    const id = (crypto?.randomUUID && crypto.randomUUID()) || Date.now();
    setLinks((prev) => [...prev, { id, type: "", name: "", url: "" }]);
  };

  const removeLink = (id) => {
    setLinks((prev) => prev.filter((link) => (link.id || link._id) !== id));
  };

  const updateLink = (id, patch) => {
    setLinks((prev) =>
      prev.map((link) =>
        (link.id || link._id) === id ? { ...link, ...patch } : link
      )
    );
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");

  const localPreview = useMemo(() => {
    if (!selectedFile) return "";
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const image = localPreview || avatarUrl;
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const publicPath = handle ? `/@${handle}` : "";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyProfile();
        if (data?.firstName) setFirstName(data.firstName);
        if (data?.lastName) setLastName(data.lastName);
        if (data?.handle) setHandle(data.handle);
        if (data?.bio) setBio(data.bio);
        if (data?.avatarUrl) setAvatarUrl(data.avatarUrl);
      } catch {
        // Ignore hydration failures; the editor can still work with local draft state.
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  const goPreview = async () => {
    try {
      const { data } = await getMyProfile();
      const currentHandle = (data?.handle || "").trim().toLowerCase();
      if (currentHandle) {
        navigate(`/@${encodeURIComponent(currentHandle)}`);
      } else {
        navigate("/dashboard/profile");
      }
    } catch {
      navigate("/login");
    }
  };

  const navClass = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
      isActive
        ? "bg-[#132238] text-white shadow-lg"
        : "text-slate-600 hover:bg-white hover:text-slate-950",
    ].join(" ");

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="glass-panel mb-6 rounded-[2rem] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <BrandMark compact />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goPreview}
                className="brand-outline inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                title={handle ? `Preview ${publicPath}` : "Set a handle to preview"}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="glass-panel-strong mesh-card rounded-[2rem] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#132238] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                  editor
                </span>
                <Sparkles className="h-4 w-4 text-[#ff6b2c]" />
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[1.5rem] bg-[#132238] text-lg font-bold text-white">
                  {image ? (
                    <img src={image} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (fullName || "LS")
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display text-2xl font-bold text-slate-950">
                    {fullName || "Your name"}
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-500">
                    {handle ? `@${handle}` : "Claim a shareable handle"}
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {bio || "Add your links, shape your profile, and preview the page your audience will land on."}
              </p>

              <div className="mt-6 grid gap-3">
                <NavLink to="links" className={navClass} end>
                  <Link2 className="h-4 w-4" />
                  Links
                </NavLink>
                <NavLink to="profile" className={navClass}>
                  <UserRound className="h-4 w-4" />
                  Profile details
                </NavLink>
              </div>
            </section>

            <section className="glass-panel sticky top-5 z-10 rounded-[2rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    live preview
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                    Public card
                  </h2>
                </div>
                {handle && (
                  <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-semibold text-[#d74a11]">
                    {publicPath}
                  </span>
                )}
              </div>

              <div className="mt-5 rounded-[1.8rem] bg-[#132238] p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white/10 text-sm font-bold">
                    {image ? (
                      <img src={image} alt="Preview avatar" className="h-full w-full object-cover" />
                    ) : (
                      (fullName || "LS")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {fullName || "Your name"}
                    </div>
                    <div className="truncate text-sm text-white/65">
                      {handle ? `@${handle}` : "@yourhandle"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {links.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/65">
                      No links yet. Add one from the editor.
                    </div>
                  )}
                  {links.slice(0, 4).map((link, index) => {
                    const Icon = ICONS[link.type || "custom"] || TbDots;
                    const label = link.name || link.type || `Link ${index + 1}`;
                    return (
                      <div
                        key={link.id || link._id || index}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon className="shrink-0" />
                          <span className="truncate text-sm">{label}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-white/60" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </aside>

          <section className="min-w-0">
            <Outlet
              context={{
                links,
                addLink,
                removeLink,
                updateLink,
                setLinks,
                image,
                avatarUrl,
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
              }}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
