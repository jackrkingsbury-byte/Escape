import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { site } from "@/lib/site";
import TestAgent from "@/components/TestAgent";
import type { BusinessRow, LeadRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function money(n: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <ConfigNotice />;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) return <ConfigNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true });

  const business = (businesses?.[0] as BusinessRow | undefined) ?? null;

  let leads: LeadRow[] = [];
  if (business) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(50);
    leads = (data as LeadRow[] | null) ?? [];
  }

  const captured = leads.reduce((sum, l) => sum + Number(l.captured_value ?? 0), 0);
  const booked = leads.filter((l) => l.status === "booked" || l.status === "won").length;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-sm text-white">
              N
            </span>
            {site.name}
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span className="hidden sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-[var(--line)] px-3 py-1.5 font-medium transition hover:border-brand-400">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        {!business ? (
          <EmptyOnboarding />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{business.name}</h1>
                <p className="text-[var(--muted)]">Here&apos;s what NeverMiss captured for you.</p>
              </div>
              <a
                href="/onboarding"
                className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium transition hover:border-brand-400"
              >
                Edit business info
              </a>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat label="Rand captured" value={money(captured)} accent />
              <Stat label="Leads" value={String(leads.length)} />
              <Stat label="Booked" value={String(booked)} />
            </div>

            <section className="mt-10">
              <h2 className="text-lg font-semibold">Recent leads</h2>
              {leads.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] p-6 text-[var(--muted)]">
                  No leads yet. Once your WhatsApp number is connected, every
                  enquiry will appear here automatically.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--surface)] text-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Captured</th>
                        <th className="px-4 py-3">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => (
                        <tr key={l.id} className="border-t border-[var(--line)]">
                          <td className="px-4 py-3">{l.customer_name ?? l.customer_wa ?? "—"}</td>
                          <td className="px-4 py-3 capitalize">{l.status}</td>
                          <td className="px-4 py-3">{money(Number(l.captured_value ?? 0))}</td>
                          <td className="px-4 py-3 text-[var(--muted)]">
                            {new Date(l.created_at).toLocaleDateString("en-ZA")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <TestAgent />
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card">
      <div className="text-sm text-[var(--muted)]">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${accent ? "text-brand-500" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyOnboarding() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-card">
      <h1 className="text-xl font-semibold">Welcome to {site.name} 👋</h1>
      <p className="mt-2 text-[var(--muted)]">
        Tell NeverMiss about your business — your services, prices, and hours —
        so the AI can answer your customers like you would. Takes ~5 minutes.
      </p>
      <a
        href="/onboarding"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600"
      >
        Set up my business →
      </a>
    </div>
  );
}

function ConfigNotice() {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold">Supabase not connected</h1>
        <p className="mt-2 text-[var(--muted)]">
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment, then run
          the migration in <code>supabase/migrations</code>. The dashboard lights
          up automatically once configured.
        </p>
      </div>
    </div>
  );
}
