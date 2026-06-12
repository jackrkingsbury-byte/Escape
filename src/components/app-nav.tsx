"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🛰️" },
  { href: "/missions", label: "Missions", icon: "🎯" },
  { href: "/coach", label: "AI Coach", icon: "🧠" },
  { href: "/roadmap", label: "Roadmap", icon: "🗺️" },
  { href: "/review", label: "Weekly Review", icon: "🪞" },
  { href: "/achievements", label: "Achievements", icon: "🏆" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

interface Props {
  name: string;
  level: number;
  levelTitle: string;
  levelPercent: number;
  streak: number;
  premium: boolean;
}

export function AppNav({ name, level, levelTitle, levelPercent, streak, premium }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-void-900/60 p-5 backdrop-blur-xl lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric-500 to-electric-700 text-sm shadow-glow-blue">⚡</span>
          Life<span className="text-electric-400">OS</span>
        </Link>

        {/* Player card */}
        <div className="glass mt-6 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="text-xs text-slate-500">
                Lv {level} · {levelTitle}
              </p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-ember-400">
              <span className={streak > 0 ? "animate-flame-flicker" : "opacity-30 grayscale"}>🔥</span>
              {streak}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric-500 to-electric-400 transition-all duration-700"
              style={{ width: `${levelPercent}%` }}
            />
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border border-electric-500/30 bg-electric-500/10 text-white shadow-glow-blue"
                    : "border border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!premium && (
          <Link
            href="/pricing"
            className="btn-ember mb-3 w-full !py-2 !text-xs"
          >
            ✨ Upgrade to Premium
          </Link>
        )}
        <button onClick={signOut} className="text-left text-xs text-slate-500 transition-colors hover:text-slate-300">
          Sign out
        </button>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-white/10 bg-void-900/90 px-2 py-2 backdrop-blur-xl lg:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-electric-400" : "text-slate-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
