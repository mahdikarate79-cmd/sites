import { Orientation } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const ORIENTATION_STYLES: Record<Orientation, string> = {
  straight: "from-pink-400/30 to-blue-400/30 border-pink-400/30 text-pink-200",
  gay: "from-red-500/20 via-yellow-500/20 to-violet-500/20 border-violet-400/30 text-violet-200",
  lesbian: "from-[#D52D00]/20 via-[#FF9A56]/20 to-[#D162A4]/20 border-[#D162A4]/30 text-[#D162A4]",
  bisexual: "from-pink-500/20 via-purple-500/20 to-blue-500/20 border-purple-400/30 text-purple-200",
  trans: "from-[#5BCEFA]/20 via-[#F5A9B8]/20 to-white/10 border-[#5BCEFA]/30 text-[#5BCEFA]",
  pansexual: "from-pink-500/20 via-yellow-400/20 to-cyan-400/20 border-cyan-400/30 text-cyan-200",
  asexual: "from-gray-400/20 via-white/10 to-purple-500/20 border-purple-400/30 text-gray-300",
  queer: "from-green-400/20 via-white/10 to-purple-500/20 border-green-400/30 text-green-200",
};

const ORIENTATION_LABELS: Record<Orientation, string> = {
  straight: "Straight",
  gay: "Gay",
  lesbian: "Lesbian",
  bisexual: "Bisexual",
  trans: "Trans",
  pansexual: "Pansexual",
  asexual: "Asexual",
  queer: "Queer",
};

export function OrientationBadge({ orientation }: { orientation: Orientation }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border bg-gradient-to-r glass-nav",
        ORIENTATION_STYLES[orientation]
      )}
    >
      {ORIENTATION_LABELS[orientation]}
    </span>
  );
}
