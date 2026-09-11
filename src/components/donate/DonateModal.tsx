"use client";

import { useState } from "react";
import { Post } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { TelegramStar } from "@/components/ui/TelegramStar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatStars } from "@/lib/utils/format";
import { donateStars } from "@/lib/api/donate";

interface DonateModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
}

const PRESETS = [10, 50, 100, 500, 1000];

export function DonateModal({ open, onClose, post }: DonateModalProps) {
  const [stars, setStars] = useState(100);
  const [donating, setDonating] = useState(false);
  const [done, setDone] = useState(false);

  const handleDonate = async () => {
    setDonating(true);
    try {
      await donateStars({
        postId: post.id,
        recipientId: post.author.id,
        stars,
      });
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1500);
    } catch {
      // mock always succeeds
    } finally {
      setDonating(false);
    }
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Modal open={open} onClose={onClose} title="Donate">
      <div className="px-4 pb-6 pt-2">
        <div className="flex items-center gap-3 mb-6">
          <Avatar src={post.author.avatar} alt={post.author.displayName} size="lg" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{post.author.displayName}</span>
              {post.author.verified && <VerifiedBadge />}
            </div>
            <span className="text-sm text-text-muted">@{post.author.username}</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TelegramStar size="lg" showParticles />
            <span className="text-3xl font-bold text-gold">{formatStars(stars)}</span>
          </div>
          <span className="text-sm text-text-muted">Stars</span>
        </div>

        <div className="mb-4">
          <input
            type="range"
            min={1}
            max={10000}
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            className="w-full"
            aria-label="Stars amount"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>1</span>
            <span>10,000</span>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setStars(p)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                stars === p
                  ? "border-gold text-gold bg-gold/10"
                  : "border-border text-text-muted hover:border-text-muted"
              }`}
            >
              {formatStars(p)}
            </button>
          ))}
        </div>

        <button
          onClick={handleDonate}
          disabled={donating || done}
          className="w-full py-3 rounded-xl bg-gold text-black font-semibold text-sm transition-opacity disabled:opacity-60"
        >
          {done ? "✓ Donated!" : donating ? "Processing..." : "Donate"}
        </button>

        {post.topDonators && post.topDonators.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3 text-text-muted">Top Donators</h3>
            <div className="space-y-2.5">
              {post.topDonators.map((d) => (
                <div key={d.rank} className="flex items-center gap-3">
                  <span className="text-base w-6">{medals[d.rank - 1]}</span>
                  <Avatar src={d.user.avatar} alt={d.user.displayName} size="sm" />
                  <span className="text-sm font-medium flex-1 truncate">{d.user.displayName}</span>
                  <div className="flex items-center gap-1">
                    <TelegramStar size="sm" />
                    <span className="text-sm text-gold font-medium">{formatStars(d.stars)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
