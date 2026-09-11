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
import { Check, Glasses } from "lucide-react";

interface DonateModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
}

export function DonateModal({ open, onClose, post }: DonateModalProps) {
  const [stars, setStars] = useState(64);
  const [showInTop, setShowInTop] = useState(true);
  const [donating, setDonating] = useState(false);
  const { getDonation, donate } = usePrototype();
  const { showToast } = useToast();

  const donation = getDonation(post.id, {
    total: post.stars ?? 0,
    topDonators: post.topDonators ?? [],
  });

  const alreadyDonated = donation.userDonated;
  const anonymous = !showInTop;
  const topThreshold = donation.topDonators[0]?.stars ?? 0;

  const { rank, preview } = useMemo(
    () => computeDonationRank(stars, donation.topDonators, anonymous),
    [stars, donation.topDonators, anonymous]
  );

  const handleDonate = () => {
    if (donating) return;
    setDonating(true);
    donate(post.id, stars, anonymous, post.author.id);
    showToast(`Sent ${formatStars(stars)} Stars`);
    setDonating(false);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Star Reaction">
      <div className="px-4 pb-6">
        {alreadyDonated && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-gold/10 border border-gold/20 text-center">
            <p className="text-xs text-gold font-medium">You already supported this post</p>
            <p className="text-[11px] text-text-muted mt-0.5">Send more Stars to climb the leaderboard</p>
          </div>
        )}

        <StarsSlider value={stars} topThreshold={topThreshold} onChange={setStars} />

        {rank > 0 && rank <= 10 && (
          <p className="text-center text-xs text-gold mb-2">Your preview rank: #{rank}</p>
        )}

        <p className="text-sm text-text-muted text-center leading-relaxed mt-2 mb-5 px-1">
          Choose how many Stars you want to send to{" "}
          <span className="text-text font-medium">{post.author.displayName}</span> to support this post.
        </p>

        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-border" />
          </div>
          <span className="relative px-3 py-1 rounded-full bg-gold text-[11px] font-semibold text-black/80">
            Top Senders
          </span>
        </div>

        <div className="flex justify-center gap-10 mb-5">
          {preview.length > 0 ? (
            preview.map((d) => (
              <div key={`${d.user.id}-${d.rank}`} className="flex flex-col items-center gap-1">
                {d.anonymous ? (
                  <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center">
                    <Glasses className="w-7 h-7 text-text-muted" />
                  </div>
                ) : (
                  <Avatar src={d.user.avatar} alt={d.user.displayName} size="xl" />
                )}
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gold text-[11px] font-medium text-black/80">
                  <TelegramStarIcon variant="donate" size={12} />
                  {formatStars(d.stars)}
                </span>
                <span className="text-xs text-text-muted truncate max-w-[80px] text-center">
                  {d.anonymous ? "Anonymous" : d.user.displayName}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-text-muted">Be the first to send Stars</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowInTop(!showInTop)}
          className="flex items-center justify-center gap-2.5 w-full mb-5"
        >
          <span
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
              showInTop ? "bg-[#3b82f6] border-[#3b82f6]" : "border-text-muted"
            )}
          >
            {showInTop && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </span>
          <span className="text-sm">Show me in Top Senders</span>
        </button>

        <button
          onClick={handleDonate}
          disabled={donating}
          className={cn(
            "w-full py-3.5 rounded-full font-semibold text-sm text-white transition-opacity flex items-center justify-center gap-2",
            "bg-[#3b82f6]",
            donating && "opacity-60"
          )}
        >
          Send
          <TelegramStarIcon variant="donate" size={18} />
          {formatStars(stars)}
        </button>

        <p className="text-[11px] text-text-muted text-center mt-4 leading-relaxed">
          By sending Stars you agree to the{" "}
          <button type="button" className="text-[#3b82f6]">Terms of Service</button>.
        </p>
      </div>
    </BottomSheet>
  );
}
