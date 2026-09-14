"use client";

import { useMemo, useState } from "react";
import { Post } from "@/lib/types";
import { ProfileLink } from "@/components/ui/ProfileLink";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { TelegramStarIcon } from "@/components/ui/TelegramStarIcon";
import { UserName } from "@/components/ui/UserName";
import { StarsSlider } from "./StarsSlider";
import { formatStars } from "@/lib/utils/format";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTelegramGate } from "@/lib/hooks/useTelegramGate";
import { useToast } from "@/components/ui/ToastProvider";
import { computeDonationRank } from "@/lib/store/prototypeStore";
import { createDonationInvoice, openTelegramInvoice } from "@/lib/api/payments";
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
  const { getDonation, getCurrentUser } = usePrototype();
  const { isAuthenticated, refresh } = useAuth();
  const { requireMiniApp } = useTelegramGate();
  const { showToast } = useToast();
  const me = getCurrentUser();

  const donation = getDonation(post.id, {
    total: post.stars ?? 0,
    topDonators: post.topDonators ?? [],
  });

  const anonymous = !showInTop;
  const topThreshold = donation.topDonators[0]?.stars ?? 0;

  const { preview } = useMemo(
    () => computeDonationRank(stars, donation.topDonators, anonymous, me),
    [stars, donation.topDonators, anonymous, me]
  );

  const handleDonate = async () => {
    if (donating) return;
    if (!requireMiniApp()) return;
    if (!isAuthenticated) return;
    setDonating(true);
    try {
      const invoice = await createDonationInvoice(post.id, post.author.id, stars, anonymous);
      if (!invoice.invoiceUrl) {
        showToast("Payment unavailable");
        setDonating(false);
        return;
      }
      const opened = openTelegramInvoice(invoice.invoiceUrl, async (status) => {
        if (status === "paid") {
          await refresh();
          showToast(`Sent ${formatStars(stars)} Stars`);
          onClose();
        } else if (status === "failed") {
          showToast("Payment failed");
        }
        setDonating(false);
      });
      if (!opened) {
        showToast("Open in Telegram to pay with Stars");
        setDonating(false);
      }
    } catch {
      showToast("Payment failed");
      setDonating(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Star Reaction" className="max-h-[88dvh] overflow-hidden">
      <div className="px-4 pb-5">
        <StarsSlider value={stars} topThreshold={topThreshold} onChange={setStars} compact wide />

        <p className="text-xs text-text-muted text-center leading-relaxed mt-2 mb-3 px-1">
          Choose how many Stars you want to send to{" "}
          <ProfileLink user={post.author} className="text-text font-medium hover:underline">
            {post.author.displayName}
          </ProfileLink>{" "}
          to support this post.
        </p>

        <div className="relative flex items-center justify-center mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-border" />
          </div>
          <span className="relative px-3 py-0.5 rounded-full bg-gold text-[10px] font-semibold text-white">
            Top Senders
          </span>
        </div>

        <div className="flex justify-center gap-6 mb-3 min-h-[88px]">
          {preview.length > 0 ? (
            preview.slice(0, 2).map((d) => {
              return (
                <div key={`${d.user.id}-${d.rank}`} className="flex flex-col items-center gap-1">
                  {d.anonymous ? (
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <Glasses className="w-5 h-5 text-text-muted" />
                    </div>
                  ) : (
                    <ProfileLink user={d.user} onClick={(e) => e.stopPropagation()}>
                      <Avatar src={d.user.avatar} alt={d.user.displayName} size="lg" />
                    </ProfileLink>
                  )}
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gold text-[10px] font-medium text-white tabular-nums">
                    <TelegramStarIcon variant="donate" size={11} />
                    {formatStars(d.stars)}
                  </span>
                  <span className="text-[10px] text-text-muted truncate max-w-[72px] text-center">
                    {d.anonymous ? (
                      "Anonymous"
                    ) : (
                      <ProfileLink user={d.user} onClick={(e) => e.stopPropagation()} className="hover:underline">
                        <UserName user={d.user} nameClassName="text-[10px]" />
                      </ProfileLink>
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-text-muted self-center">Be the first to send Stars</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowInTop(!showInTop)}
          className="flex items-center justify-center gap-2 w-full mb-3"
        >
          <span
            className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
              showInTop ? "bg-[#3b82f6] border-[#3b82f6]" : "border-text-muted"
            )}
          >
            {showInTop && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </span>
          <span className="text-xs">Show me in Top Senders</span>
        </button>

        <button
          onClick={handleDonate}
          disabled={donating}
          className={cn(
            "w-full py-3 rounded-full font-semibold text-sm text-white transition-opacity flex items-center justify-center gap-2",
            "bg-[#3b82f6]",
            donating && "opacity-60"
          )}
        >
          {donating ? "Opening invoice…" : "Send"}
          {!donating && <TelegramStarIcon variant="donate" size={16} />}
          {!donating && <span className="text-white tabular-nums">{formatStars(stars)}</span>}
        </button>

        <p className="text-[10px] text-text-muted text-center mt-3 leading-relaxed">
          Payment via Telegram Stars invoice.
        </p>
      </div>
    </BottomSheet>
  );
}
