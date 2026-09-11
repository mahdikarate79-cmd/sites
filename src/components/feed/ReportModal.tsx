"use client";

import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/ToastProvider";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: Record<string, string[]> = {
  "Child abuse": ["Sexual child abuse", "Physical child abuse"],
  "Violence": ["Physical violence", "Threats"],
  "Scam": ["Financial scam", "Fraud"],
  "Copyright": ["Stolen content", "Copyright violation"],
  "Spam": ["Unwanted ads", "Repetitive content"],
};

type Step = "main" | "sub" | "detail";

export function ReportModal({ open, onClose }: ReportModalProps) {
  const [step, setStep] = useState<Step>("main");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [detail, setDetail] = useState("");
  const { showToast } = useToast();

  const reset = () => {
    setStep("main");
    setCategory("");
    setSubcategory("");
    setDetail("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleBack = () => {
    if (step === "detail") setStep("sub");
    else if (step === "sub") setStep("main");
    else handleClose();
  };

  const handleSubmit = () => {
    showToast("Report submitted. Thank you.");
    handleClose();
  };

  const title = step === "main" ? "Report content" : category;

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3 py-2 border-b border-border -mx-4 px-4 mb-2">
          <button onClick={handleBack} className="p-1 rounded-full hover:bg-surface" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="flex-1 text-center font-semibold">{title}</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-surface" aria-label="Close">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {step === "main" && (
          <div>
            {Object.keys(CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setStep("sub"); }}
                className="flex items-center justify-between w-full py-3.5 border-b border-border text-sm hover:bg-surface/50 transition-colors text-left"
              >
                {cat}
                <ArrowLeft className="w-4 h-4 text-text-muted rotate-180" />
              </button>
            ))}
            <button
              onClick={() => { setCategory("Other"); setStep("detail"); }}
              className="flex items-center justify-between w-full py-3.5 text-sm hover:bg-surface/50 transition-colors text-left"
            >
              Other important issues
              <ArrowLeft className="w-4 h-4 text-text-muted rotate-180" />
            </button>
          </div>
        )}

        {step === "sub" && (
          <div>
            {(CATEGORIES[category] ?? []).map((sub) => (
              <button
                key={sub}
                onClick={() => { setSubcategory(sub); setStep("detail"); }}
                className="flex items-center justify-between w-full py-3.5 border-b border-border text-sm hover:bg-surface/50 transition-colors text-left"
              >
                {sub}
                <ArrowLeft className="w-4 h-4 text-text-muted rotate-180" />
              </button>
            ))}
          </div>
        )}

        {step === "detail" && (
          <div className="mt-2">
            {subcategory && <p className="text-sm text-text-muted mb-3">Category: {subcategory}</p>}
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Optional details..."
              className="w-full h-24 px-3 py-2 rounded-xl bg-surface border border-border text-sm outline-none resize-none"
            />
            <button
              onClick={handleSubmit}
              className="w-full mt-4 py-3 rounded-xl bg-[#3b82f6] text-white font-medium text-sm"
            >
              Submit report
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
