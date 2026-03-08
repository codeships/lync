export function BrandMark({ compact = false, tone = "default" }) {
  const badgeTone =
    tone === "light"
      ? "bg-white/12 text-white border-white/20"
      : "bg-[#132238] text-white border-white/10";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid place-items-center rounded-2xl border ${badgeTone} ${
          compact ? "h-11 w-11 text-base" : "h-14 w-14 text-lg"
        } font-display font-bold shadow-lg`}
      >
        ls
      </div>
      <div>
        <div
          className={`font-display font-bold tracking-tight ${
            compact ? "text-lg" : "text-2xl"
          } ${tone === "light" ? "text-white" : "text-slate-950"}`}
        >
          linkships
        </div>
        <div
          className={`text-xs uppercase tracking-[0.28em] ${
            tone === "light" ? "text-white/70" : "text-slate-500"
          }`}
        >
          creator links
        </div>
      </div>
    </div>
  );
}

export default BrandMark;
