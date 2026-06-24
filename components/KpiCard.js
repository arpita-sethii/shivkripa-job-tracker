const BAR = { steel: "bg-steel", ochre: "bg-ochre", forest: "bg-forest", rust: "bg-rust" };

export default function KpiCard({ label, value, foot, color }) {
  return (
    <div className="relative bg-paper border border-rule rounded-xl p-4 pl-5 shadow-sm overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${BAR[color] || "bg-ink-faint"}`} />
      <div className="text-[11.5px] uppercase tracking-wide text-ink-soft font-bold mb-1.5">{label}</div>
      <div className="font-display text-[30px] font-bold leading-none">{value}</div>
      {foot && <div className="text-[11.5px] text-ink-faint mt-1">{foot}</div>}
    </div>
  );
}
