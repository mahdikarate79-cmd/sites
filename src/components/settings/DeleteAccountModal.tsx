"use client";

import { AlertTriangle } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { User } from "@/lib/types";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onConfirm: () => void;
}

export function DeleteAccountModal({ open, onClose, user, onConfirm }: DeleteAccountModalProps) {
  const handle = user.username ? `@${user.username}` : user.displayName;

  return (
    <BottomSheet open={open} onClose={onClose} title="Delete account" className="px-1">
      <div className="px-4 sm:px-5 pb-8 pt-1 max-w-lg mx-auto">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-like/10 border border-like/30 mb-5 mx-1">
          <AlertTriangle className="w-5 h-5 text-like shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed min-w-0">
            <p className="font-medium text-like mb-2">This action cannot be undone.</p>
            <ul className="text-text-muted text-xs space-y-1.5 list-disc pl-4">
              <li>Your profile will be permanently removed</li>
              <li>All posts and media will be deleted</li>
              <li>Your username will never be available again</li>
              <li>You can create a new account after 24 hours</li>
              <li>Comments and donations will show as &quot;Deleted Account&quot;</li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-center mb-6 leading-relaxed px-2">
          You are deleting account{" "}
          <span className="font-bold text-like">{handle}</span>
          {" "}— is this correct?
        </p>

        <div className="space-y-2.5 px-1">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-like text-white text-sm font-semibold"
          >
            Yes, delete my account
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl glass-nav text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
