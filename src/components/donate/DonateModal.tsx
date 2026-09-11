"use client";

import { useMemo, useState } from "react";
import { Post } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { StarsSlider } from "./StarsSlider";
import { formatStars } from "@/lib/utils/format";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { computeDonationRank } from "@/lib/store/prototypeStore";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

interface DonateModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
}

export function DonateModal({ open, onClose, post }: DonateModalProps) {
  const [stars, setStars] = useState(100);
  const [showInTop, setShowInTop] = useState(true);
  const [donating, setDonating] = useState(false);
  const { getDonation, donate } = usePrototype();
  const { showToast } = useToast();

  const donation = getDonation(post.id, {
    total: post.stars ?? 0,
    topDonators: post.topDonators ?? [],
  });

  const anonymous = !showInTop;
  const topThreshold = donation.topDonators[0]?.stars ?? 0;

  const { rank, preview } = useMemo(
    () => computeDonationRank(stars, donation.topDonators, anonymous),
    [stars, donation.topDonators, anonymous]
  );

  const handleDonate = () => {
    setDonating(true);
    donate(post.id, stars, anonymous, post.author.id);
    showToast(`Sent ${formatStars(stars)} Stars`);
    setDonating(false);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Star Reaction">
      <div className="px-4 pb-6">
        <StarsSlider value={stars} topThreshold={topThreshold} onChange={setStars} />

        {rank > 0 && rank <= 10 && (
          <p className="text-center text-xs text-gold mb-2">Your preview rank: #{rank}</p>
        )}

        <p className="text-sm text-text-muted text-center leading-relaxed mt-1 mb-5 px-2">
          Choose how many stars you want to send to support this post to{" "}
          <span className="text-text font-medium">{post.author.displayName}</span>.
        </p>

        <div className="h-px bg-border mb-5" />

        <div className="rounded-xl bg-gold px-3 py-2 text-center mb-4">
          <span className="text-sm font-medium text-black/80">Top Donators</span>
        </div>

        <div className="flex justify-center gap-8 mb-5">
          {preview.map((d) => (
            <div key={`${d.user.id}-${d.rank}`} className="flex flex-col items-center gap-1.5">
              <div className="relative glass-pill rounded-full p-0.5">
                {d.anonymous ? (
                  <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center">
                    <span className="text-text-muted text-lg">?</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Avatar src={d.user.avatar} alt={d.user.displayName} size="lg" />
                    <div className="absolute bottom-0 left-0 right-0 h-5 bg-gold rounded-b-full flex items-center justify-center gap-0.5">
                      <TelegramStarIcon variant="donate" size={10} />
                      <span className="text-[10px] font-medium text-black/80">{formatStars(d.stars)}</span>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs text-text-muted truncate max-w-[72px] text-center">
                {d.anonymous ? "Anonymous" : d.user.displayName}
              </span>
            </div>
          ))}
        </div>

        <div className="h-px bg-border mb-4" />

        <button
          type="button"
          onClick={() => setShowInTop(!showInTop)}
          className="flex items-center justify-center gap-2.5 w-full mb-5"
        >
          <span
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
              showInTop ? "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-transparent" : "border-text-muted"
            )}
          >
            {showInTop && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </span>
          <span className="text-sm">Anonymous</span>
        </button>

        <button
          onClick={handleDonate}
          disabled={donating}
          className={cn(
            "w-full py-3.5 rounded-xl font-medium text-sm text-white transition-opacity flex items-center justify-center gap-2",
            "bg-[#3b82f6]",
            donating && "opacity-60"
          )}
        >
          Send {formatStars(stars)}
          <TelegramStarIcon variant="donate" size={18} />
        </button>

        <p className="text-[11px] text-text-muted text-center mt-3 leading-relaxed">
          Terms of Service · Donation Policy · Service Rules
        </p>
      </div>
    </BottomSheet>
  );
}
