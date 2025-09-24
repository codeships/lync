// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import Logo from "../assets/logo.png";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FaLink, FaRegUserCircle, FaGlobe, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";
import { RxExit } from "react-icons/rx";
import { TbDots } from "react-icons/tb";

// IMPORTANT: include .js to be safe on Linux (Vercel)
import { logout as apiLogout, getMyProfile } from "../../lib/api.js";

const ICONS = {
  website: FaGlobe,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  custom: TbDots,
};

export const Dashboard = () => {
  const navigate = useNavigate();

  // ====== Links state (lifted) ======
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
    } catch {}
  }, [links]);

  const addLink = () => {
    const id = (crypto?.randomUUID && crypto.randomUUID()) || Date.now();
    setLinks((prev) => [...prev, { id, type: "", name: "", url: "" }]);
  };
  const removeLink = (id) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const updateLink = (id, patch) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  // ====== Profile state (lifted) ======
  const [selectedFile, setSelectedFile] = useState(null); // File object
  const image = useMemo(() => {
    if (!selectedFile) return "";
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [handle, setHandle]       = useState("");   // <-- added

  // Hydrate basic profile info for the left preview + preview URL
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyProfile();
        if (data?.firstName) setFirstName(data.firstName);
        if (data?.lastName)  setLastName(data.lastName);
        if (data?.handle)    setHandle(data.handle);
      } catch {
        // ignore; user may not be logged in yet
      }
    })();
  }, []);

  /** ===============================
   * Logout Handler
   * ===============================
   */
  const handleLogout = async () => {
    try {
      await apiLogout(); // Clears token & local storage (via helper)
      navigate("/login"); // Redirect to login
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  // Preview handler: go to public page if handle exists; else go to profile editor
  const goPreview = async () => {
    try {
      const { data } = await getMyProfile();            // trust backend
      const h = (data?.handle || "").trim().toLowerCase();
      if (h) {
        navigate(`/@${encodeURIComponent(h)}`);         // ✅ no colon in URL
      } else {
        navigate("/dashboard/profile");                 // ask user to set a handle
      }
    } catch {
      navigate("/login");
    }
  };

  const navLinkBase = "flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100";
  const navLinkActive = "text-blue-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b">
        <ul className="max-w-6xl mx-auto flex justify-between items-center p-5">
          <li className="flex items-center gap-3">
            <img src={Logo} alt="Lync logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-semibold">Lync</span>
          </li>

          <li>
            <ul className="flex gap-4">
              <li>
                <NavLink
                  to="links"
                  className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ""}`}
                  end
                >
                  <FaLink />
                  <span>Links</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="profile"
                  className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ""}`}
                >
                  <FaRegUserCircle />
                  <span>Profile Details</span>
                </NavLink>
              </li>
            </ul>
          </li>

          {/* Right icons */}
          <li>
            <ul className="flex gap-3 items-center">
              <li
                className="p-2 rounded hover:bg-gray-100 cursor-pointer"
                title={handle ? `Preview /@${handle}` : "Preview (set a handle first)"}
                onClick={goPreview}
              >
                <IoEyeOutline />
              </li>
              <li
                className="p-2 rounded hover:bg-gray-100 cursor-pointer text-red-600"
                title="Log out"
                onClick={handleLogout}
              >
                <RxExit />
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto flex gap-8 p-5">
        {/* LEFT: Live Preview */}
        <aside className="hidden md:block border bg-white rounded w-[320px] min-h-[60vh] p-4">
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border">
              {image ? (
                <img src={image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                  No photo
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="font-medium">
                {[firstName, lastName].filter(Boolean).join(" ") || "Your name"}
              </div>
              {handle ? (
                <div className="text-xs text-gray-500 mt-1">/@{handle}</div>
              ) : (
                <div className="text-xs text-gray-400 mt-1">set your handle to share</div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">Links</p>
          <div className="space-y-2">
            {links.length === 0 && (
              <div className="text-gray-400 text-sm">No links yet — add one!</div>
            )}
            {links.map((link) => {
              const Icon = ICONS[link.type || "custom"] || TbDots;
              const label = link.name || (link.type ? link.type : "Untitled");
              const key = link.id || link._id;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between border rounded px-3 py-2"
                >
                  <span className="flex items-center gap-2">
                    <Icon />
                    <span className="truncate max-w-[200px]">{label}</span>
                  </span>
                  {link.url ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-sm"
                    >
                      visit
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">no url</span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: Nested pages receive state & actions via Outlet context */}
        <section className="flex-1">
          <Outlet
            context={{
              // links management
              links,
              addLink,
              removeLink,
              updateLink,
              setLinks,
              // profile management
              image,
              selectedFile,
              setSelectedFile,
              firstName,
              setFirstName,
              lastName,
              setLastName,
              handle,            // <-- expose to children
              setHandle,         // <--
            }}
          />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
