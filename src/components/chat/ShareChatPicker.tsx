"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { UserName } from "@/components/ui/UserName";
import { getChats } from "@/lib/api/chat";
import { Chat } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface ShareChatPickerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  onSend: (chatIds: string[]) => void;
}

export function ShareChatPicker({ open, onClose, title = "Share to", onSend }: ShareChatPickerProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    getChats().then(setChats);
    setSelected(new Set());
    setQuery("");
  }, [open]);

  const filtered = chats.filter((c) =>
    c.participant.displayName.toLowerCase().includes(query.toLowerCase()) ||
    c.participant.username.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = () => {
    if (selected.size === 0) return;
    onSend([...selected]);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="px-4 pb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface border border-border text-sm outline-none"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
          {filtered.map((chat) => {
            const isSelected = selected.has(chat.id);
            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => toggle(chat.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors",
                  isSelected ? "bg-[#8b5cf6]/15" : "hover:bg-surface/60"
                )}
              >
                <Avatar src={chat.participant.avatar} alt="" size="md" />
                <UserName user={chat.participant} nameClassName="text-sm font-medium" className="flex-1" />
                {isSelected && <Check className="w-4 h-4 text-[#8b5cf6]" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSend}
          disabled={selected.size === 0}
          className="w-full py-3 rounded-full bg-[#3b82f6] text-white font-semibold text-sm disabled:opacity-40"
        >
          Send{selected.size > 0 ? ` (${selected.size})` : ""}
        </button>
      </div>
    </BottomSheet>
  );
}
