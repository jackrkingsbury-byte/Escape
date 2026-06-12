"use client";

import { useState } from "react";

export function ReferralCard({ code, converted }: { code: string; converted: number }) {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/signup?ref=${code}`
      : `/signup?ref=${code}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="glass p-6">
      <h2 className="font-display text-lg font-semibold text-white">🤝 Refer a friend</h2>
      <p className="mt-1 text-sm text-slate-400">
        When a friend joins with your link and goes Premium, you earn <span className="font-semibold text-electric-300">500 XP</span> and
        the Recruiter badge.
      </p>
      <div className="mt-4 flex gap-2">
        <code className="input-dark flex-1 truncate !py-2.5 text-xs text-electric-300">{link}</code>
        <button onClick={copy} className="btn-primary shrink-0 !px-4">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Converted referrals so far: <span className="font-semibold text-white">{converted}</span>
      </p>
    </div>
  );
}
