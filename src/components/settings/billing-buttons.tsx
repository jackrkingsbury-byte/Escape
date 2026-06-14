"use client";

import { useState } from "react";
import Link from "next/link";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/paystack/manage", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <button onClick={openPortal} disabled={loading} className="btn-ghost">
      {loading ? "Opening…" : "Manage billing"}
    </button>
  );
}

export function UpgradeButton({
  interval,
  className = "btn-primary",
  children,
}: {
  interval: "monthly" | "yearly";
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/paystack/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval }),
    });
    if (res.status === 401) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  if (needsAuth) {
    return (
      <Link href="/signup" className={className}>
        Create an account first →
      </Link>
    );
  }

  return (
    <button onClick={checkout} disabled={loading} className={className}>
      {loading ? "Redirecting…" : children}
    </button>
  );
}
