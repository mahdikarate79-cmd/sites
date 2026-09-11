"use client";

import { useMemo, useState } from "react";
import { Post } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { TelegramStar } from "@/components/ui/TelegramStar";
import { formatStars } from "@/lib/utils/format";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useToast } from "@/components/ui/ToastProvider";
import { computeDonationRank } from "@/lib/store/prototypeStore";
import { cn } from "@/lib/utils/cn";

interface DonateModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
}

export function DonateModal({ open, onClose, post }: DonateModalProps) {
  const [stars, setStars] = useState(100);
  const [anonymous, setAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);
  const { getDonation, donate } = usePrototype();
  const { showToast } = useToast();

  const donation = getDonation(post.id, {
    total: post.stars ?? 0,
    topDonators: post.topDonators ?? [],
  });

  const { rank, preview } = useMemo(
    () => computeDonationRank(stars, donation.topDonators, anonymous),
    [stars, donation.topDonators, anonymous]
  );

  const handleDonate = async () => {
    setDonating(true);
    donate(post.id, stars, anonymous, post.author.id);
    showToast(`⭐ ${formatStars(stars)} ستاره ارسال شد`);
    setDonating(false);
    onClose();
  };

  const topThreshold = donation.topDonators[0]?.stars ?? 0;
  const isTop = stars > topThreshold;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="px-4 pb-6 pt-2">
        <h2 className="text-center font-semibold text-lg mb-4">واکنش ستاره</h2>

        <div className="flex justify-center mb-4">
          <div className="relative px-5 py-2 rounded-2xl bg-gold/20 border border-gold/30">
            <div className="flex items-center gap-2">
              <TelegramStar size="md" />
              <span className="text-2xl font-bold text-gold">{formatStars(stars)}</span>
            </div>
          </div>
        </div>

        <div className="relative mb-2">
          <input
            type="range"
            min={1}
            max={10000}
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            className="w-full donate-slider"
            aria-label="Stars amount"
          />
          {isTop && (
            <span className="absolute -top-5 right-0 text-xs text-gold font-medium">برتر</span>
          )}
        </div>
        <div className="flex justify-between text-xs text-text-muted mb-4">
          <span>1</span>
          <span className="text-gold text-xs">
            {rank <= 3 ? `رتبه ${rank}` : ""} {isTop && `· ${formatStars(stars)} ⭐`}
          </span>
          <span>10,000</span>
        </div>

        <p className="text-sm text-text-muted text-center mb-5 leading-relaxed">
          انتخاب کنید چند ستاره برای پشتیبانی از{" "}
          <span className="text-text font-medium">{post.author.displayName}</span> ارسال کنید.
        </p>

        <div className="mb-5">
          <div className="text-center text-sm font-medium text-gold border border-gold/30 rounded-full py-1 px-3 inline-block mx-auto w-full mb-3">
            ارسال‌کنندگان برتر
          </div>
          <div className="flex justify-center gap-6">
            {preview.map((d) => (
              <div key={d.rank} className="flex flex-col items-center gap-1">
                <div className="relative">
                  {d.anonymous ? (
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-lg">
                      ?
                    </div>
                  ) : (
                    <Avatar src={d.user.avatar} alt={d.user.displayName} size="lg" />
                  )}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-gold/20 border border-gold/30 text-[10px] text-gold font-bold whitespace-nowrap flex items-center gap-0.5">
                    <TelegramStar size="xs" />
                    {formatStars(d.stars)}
                  </span>
                </div>
                <span className="text-xs text-text-muted truncate max-w-[72px]">
                  {d.anonymous ? "ناشناس" : d.user.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 rounded accent-[#6366f1]"
          />
          <span className="text-sm">ناشناس</span>
        </label>

        <button
          onClick={handleDonate}
          disabled={donating}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity",
            "bg-gradient-to-r from-[#3b82f6] to-[#6366f1]",
            donating && "opacity-60"
          )}
        >
          ارسال {formatStars(stars)} ⭐
        </button>

        <p className="text-[11px] text-text-muted text-center mt-3 leading-relaxed">
          با ارسال ستاره، شما با شرایط و ضوابط خدمات موافقت می‌کنید.
        </p>
      </div>
    </Modal>
  );
}
