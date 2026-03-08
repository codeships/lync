import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";

const stats = [
  { value: "18k+", label: "profiles launched" },
  { value: "4.9/5", label: "creator satisfaction" },
  { value: "1 link", label: "for every channel" },
];

export function AuthShell({
  title,
  subtitle,
  sideTitle,
  sideBody,
  alternateLabel,
  alternateTo,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-6%] h-72 w-72 rounded-full bg-[#ff7a45]/20 blur-3xl" />
        <div className="absolute bottom-[-8%] right-[-6%] h-80 w-80 rounded-full bg-[#132238]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-black/8 bg-white/55 shadow-[0_30px_100px_rgba(17,16,13,0.12)] backdrop-blur xl:grid xl:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#132238] px-10 py-12 text-white xl:flex xl:flex-col xl:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,69,0.34),transparent_28%),linear-gradient(160deg,#0f2036_0%,#142945_52%,#132238_100%)]" />
          <div className="relative z-10">
            <BrandMark tone="light" />
          </div>

          <div className="relative z-10 space-y-6">
            <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1 text-xs uppercase tracking-[0.28em] text-white/75">
              launch faster
            </span>
            <div className="max-w-md space-y-4">
              <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight">
                {sideTitle}
              </h1>
              <p className="text-base leading-7 text-white/72">{sideBody}</p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/8 p-4">
                <div className="font-display text-2xl font-bold">{item.value}</div>
                <div className="mt-2 text-sm text-white/68">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel-strong relative flex flex-1 flex-col justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="mb-10 flex items-center justify-between gap-4">
            <BrandMark compact />
            <Link
              to={alternateTo}
              className="brand-outline rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              {alternateLabel}
            </Link>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h2 className="font-display text-4xl font-bold tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthShell;
