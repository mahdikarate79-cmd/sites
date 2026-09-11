"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: Record<string, string[]> = {
  "کودک‌آزاری": ["کودک‌آزاری جنسی", "کودک‌آزاری جسمی"],
  "خشونت": ["خشونت فیزیکی", "تهدید"],
  "کلاهبرداری": ["کلاهبرداری مالی", "فریب"],
  "حق تکثیر": ["محتوای دزدیده‌شده", "نقض کپی‌رایت"],
  "هرزنامه": ["تبلیغات ناخواسته", "محتوای تکراری"],
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
    showToast("🛡️ گزارش ارسال شد\nاز گزارش شما متشکریم.");
    handleClose();
  };

  const title = step === "main" ? "🚨 گزارش محتوا" : category;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3 py-3 border-b border-border -mx-4 px-4">
          <button onClick={handleBack} className="p-1 rounded-full hover:bg-surface" aria-label="Back">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="flex-1 text-center font-semibold">{title}</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-surface" aria-label="Close">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {step === "main" && (
          <div className="mt-2">
            {Object.keys(CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setStep("sub"); }}
                className="flex items-center justify-between w-full py-3.5 border-b border-border text-sm hover:bg-surface/50 transition-colors text-right"
              >
                {cat}
                <ArrowRight className="w-4 h-4 text-text-muted rotate-180" />
              </button>
            ))}
            <button
              onClick={() => { setCategory("سایر موارد مهم"); setStep("detail"); }}
              className="flex items-center justify-between w-full py-3.5 text-sm hover:bg-surface/50 transition-colors text-right"
            >
              سایر موارد مهم
              <ArrowRight className="w-4 h-4 text-text-muted rotate-180" />
            </button>
          </div>
        )}

        {step === "sub" && (
          <div className="mt-2">
            {(CATEGORIES[category] ?? []).map((sub) => (
              <button
                key={sub}
                onClick={() => { setSubcategory(sub); setStep("detail"); }}
                className="flex items-center justify-between w-full py-3.5 border-b border-border text-sm hover:bg-surface/50 transition-colors text-right"
              >
                {sub}
                <ArrowRight className="w-4 h-4 text-text-muted rotate-180" />
              </button>
            ))}
          </div>
        )}

        {step === "detail" && (
          <div className="mt-4">
            {subcategory && (
              <p className="text-sm text-text-muted mb-3">دسته: {subcategory}</p>
            )}
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="توضیحات اختیاری..."
              className="w-full h-24 px-3 py-2 rounded-xl bg-surface border border-border text-sm outline-none resize-none"
            />
            <button
              onClick={handleSubmit}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold text-sm"
            >
              ارسال گزارش
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
