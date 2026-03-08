import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, Link2 } from "lucide-react";
import {
  getPublicProfileCached,
  normalizeHandle,
  resolveAssetUrl,
} from "../../lib/api";
import { BrandMark } from "../components/BrandMark";

export default function PublicProfile() {
  const { handle: raw } = useParams();
  const navigate = useNavigate();
  const handle = useMemo(() => normalizeHandle(raw), [raw]);

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgOk, setImgOk] = useState(true);

  const safeResolve = (url) => {
    if (!url || typeof url !== "string") return "";
    try {
      const lower = url.trim().toLowerCase();
      if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("data:") ||
        lower.startsWith("blob:")
      ) {
        return url;
      }
      return resolveAssetUrl(url);
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!handle || handle === "handle") {
      navigate("/dashboard/profile");
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setImgOk(true);

        const profile = await getPublicProfileCached(handle, {
          ttl: 30000,
          signal: ac.signal,
        });

        setData(profile || null);
      } catch (e) {
        setErr(e?.code || e?.message || "error");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [handle, navigate]);

  const avatarSrc = useMemo(() => safeResolve(data?.avatarUrl), [data?.avatarUrl]);
  const displayName = useMemo(
    () => (data ? [data.firstName, data.lastName].filter(Boolean).join(" ") : ""),
    [data]
  );
  const initials = useMemo(() => {
    const first = data?.firstName?.[0] ?? "";
    const last = data?.lastName?.[0] ?? "";
    const result = `${first}${last}`.toUpperCase();
    return result || "LS";
  }, [data?.firstName, data?.lastName]);

  const prettyUrl = (url) => {
    try {
      return String(url || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="h-10 w-44 animate-pulse rounded-full bg-black/8" />
            <div className="mt-10 flex items-center gap-5">
              <div className="h-24 w-24 animate-pulse rounded-[2rem] bg-black/8" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-2/3 animate-pulse rounded-full bg-black/8" />
                <div className="h-5 w-1/3 animate-pulse rounded-full bg-black/8" />
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-[1.5rem] bg-black/8"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
            <BrandMark compact />
            <div className="mt-10 rounded-[2rem] bg-[#132238] px-6 py-8 text-white">
              <div className="text-sm uppercase tracking-[0.24em] text-white/60">
                Profile unavailable
              </div>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
                {err === "user_not_found"
                  ? `We could not find @${handle}.`
                  : "This profile is not available right now."}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                If this should exist, ask the owner to confirm the handle inside
                their linkships dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="glass-panel-strong overflow-hidden rounded-[2rem]">
          <div className="bg-[linear-gradient(140deg,#132238_0%,#173053_62%,#0f2036_100%)] px-6 py-6 text-white sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <BrandMark compact tone="light" />
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                public profile
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[2rem] bg-white/10 text-3xl font-bold">
                {avatarSrc && imgOk ? (
                  <img
                    src={avatarSrc}
                    alt={displayName || data.handle}
                    className="h-full w-full object-cover"
                    onError={() => setImgOk(false)}
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <h1 className="truncate font-display text-4xl font-bold tracking-tight">
                  {displayName || data.handle}
                </h1>
                <div className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/62">
                  @{data.handle}
                </div>
                {data.bio && (
                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/74">
                    {data.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Active links
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
                  Explore everything in one place
                </h2>
              </div>
              <div className="rounded-full bg-[#fff0e8] px-4 py-2 text-sm font-semibold text-[#d74a11]">
                {data?.meta?.linksCount || data?.links?.length || 0} live
              </div>
            </div>

            {data?.links?.length ? (
              <div className="space-y-3">
                {data.links.map((link, index) => (
                  <a
                    key={link._id || `${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-4 rounded-[1.6rem] border border-black/8 bg-white px-5 py-4 shadow-[0_10px_32px_rgba(17,16,13,0.06)] transition hover:-translate-y-0.5 hover:border-[#ff6b2c]/35 hover:shadow-[0_18px_40px_rgba(215,74,17,0.12)]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#132238] text-white">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-slate-950">
                          {link.title || "Untitled link"}
                        </div>
                        <div className="truncate text-sm text-slate-500">
                          {prettyUrl(link.url)}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-[#d74a11]" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.8rem] border border-dashed border-black/10 bg-[#fbf7f0] px-6 py-8 text-center">
                <h3 className="text-xl font-semibold text-slate-950">
                  No active links yet
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  This profile exists, but there are no published links to show right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
