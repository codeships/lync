import Land from "../assets/landing.jpeg";
import {
  ArrowRight,
  BarChart3,
  BrushCleaning,
  Globe2,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";

const features = [
  {
    icon: Globe2,
    title: "One link for every touchpoint",
    text: "Bring your store, socials, bookings, videos, and newsletter into a single elegant destination.",
  },
  {
    icon: BrushCleaning,
    title: "Feels designed, not assembled",
    text: "Use rich visuals, polished cards, and a layout that matches the quality of your work.",
  },
  {
    icon: BarChart3,
    title: "Built for conversion",
    text: "Guide visitors toward the most important actions with a clear hierarchy and focused calls to action.",
  },
  {
    icon: ShieldCheck,
    title: "Fast and dependable",
    text: "Launch quickly, stay mobile-friendly, and keep your audience moving without friction.",
  },
];

const highlights = [
  "Profile previews that feel premium",
  "Clean creator handles ready to share",
  "Mobile-first pages with strong contrast",
];

const stats = [
  { value: "2.3x", label: "higher tap-through layouts" },
  { value: "60 sec", label: "to publish a fresh page" },
  { value: "24/7", label: "shareable brand presence" },
];

const Home = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#ff7a45]/18 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-80 w-80 rounded-full bg-[#132238]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-[2rem] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <BrandMark compact />
            <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <a href="#features" className="rounded-full px-3 py-2 hover:bg-white/70">
                Features
              </a>
              <a href="#experience" className="rounded-full px-3 py-2 hover:bg-white/70">
                Experience
              </a>
              <a href="#faq" className="rounded-full px-3 py-2 hover:bg-white/70">
                Why linkships
              </a>
              <Link
                to="/login"
                className="brand-outline rounded-full px-4 py-2 font-semibold text-slate-700 transition hover:bg-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="brand-button rounded-full px-5 py-2.5 font-semibold transition"
              >
                Start free
              </Link>
            </nav>
          </div>
        </header>

        <main className="pb-12 pt-6">
          <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-600 backdrop-blur">
                <Sparkles className="h-4 w-4 text-[#ff6b2c]" />
                modern link-in-bio platform
              </div>

              <div className="space-y-5">
                <h1 className="font-display max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                  Make every profile visit feel like a branded destination.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  linkships gives creators, founders, and small teams a sharper way to
                  share everything from one page. Clean handle, premium layout, better
                  first click.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="brand-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold transition"
                >
                  Build your page
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/dashboard"
                  className="brand-outline inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-white"
                >
                  Open dashboard
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="glass-panel rounded-[1.5rem] px-4 py-4 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="glass-panel-strong overflow-hidden rounded-[2rem] p-3">
                <div className="relative overflow-hidden rounded-[1.6rem] bg-[#132238]">
                  <img
                    src={Land}
                    alt="linkships landing preview"
                    className="h-[520px] w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,16,29,0.12),rgba(9,16,29,0.78))]" />

                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between rounded-full border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur">
                    <span className="text-sm font-semibold">linkships profile</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/70">
                      live preview
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 space-y-4 text-white">
                    <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
                      <div className="text-sm uppercase tracking-[0.24em] text-white/65">
                        Creator page
                      </div>
                      <div className="mt-2 font-display text-3xl font-bold">
                        @yourname
                      </div>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                        Share your best work, featured links, and current campaign from
                        one page that feels intentional.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                        <Zap className="h-5 w-5 text-[#ffb087]" />
                        <div className="mt-3 text-lg font-semibold">Quick launch</div>
                        <p className="mt-1 text-sm text-white/68">
                          Publish a polished page without starting from scratch.
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                        <Smartphone className="h-5 w-5 text-[#ffb087]" />
                        <div className="mt-3 text-lg font-semibold">Mobile-first</div>
                        <p className="mt-1 text-sm text-white/68">
                          Looks crisp on phone screens where most traffic lands.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-5 hidden rounded-[1.5rem] border border-black/8 bg-white/88 p-4 shadow-lg backdrop-blur sm:block">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  creator stack
                </div>
                <div className="mt-2 font-display text-2xl font-bold text-slate-950">
                  One page. Better flow.
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="mesh-card glass-panel rounded-[1.8rem] p-6">
                <div className="font-display text-4xl font-bold text-slate-950">
                  {item.value}
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </section>

          <section id="features" className="mt-16">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d74a11]">
                  Features
                </div>
                <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">
                  A sharper frontend across marketing, onboarding, and profile sharing.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600">
                linkships is designed to feel modern from the first visit to the
                public profile page your audience actually sees.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="glass-panel rounded-[1.8rem] p-6">
                  <div className="inline-flex rounded-2xl bg-[#132238] p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="experience"
            className="mt-16 grid gap-6 rounded-[2rem] bg-[#132238] px-6 py-8 text-white lg:grid-cols-[0.9fr_1.1fr] lg:px-10"
          >
            <div className="space-y-4">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                Experience
              </div>
              <h2 className="font-display text-4xl font-bold tracking-tight">
                The UI now carries the product instead of getting in its way.
              </h2>
              <p className="max-w-lg text-sm leading-7 text-white/72">
                Cleaner navigation, stronger typography, glassy surfaces, warmer
                color contrast, and better structure for both signed-out and signed-in
                flows.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Redesigned homepage with clear product story",
                "Unified auth pages with premium split layout",
                "Dashboard preview panel and stronger editor cards",
                "Public profile page that feels ready to share",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5 text-sm leading-7 text-white/74"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer
          id="faq"
          className="glass-panel mb-6 flex flex-col gap-4 rounded-[2rem] px-6 py-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between"
        >
          <p>
            linkships helps you turn a simple profile link into a cleaner brand
            experience.
          </p>
          <p>© {currentYear} linkships. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
