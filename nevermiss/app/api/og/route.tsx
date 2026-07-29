/**
 * Scorecard preview image — /api/og?c=<code>.
 *
 * When a scorecard link is pasted into WhatsApp, X or iMessage, this is what
 * unfurls. The score has to be readable at thumbnail size, so it is the
 * largest thing on the canvas; everything else is context.
 */
import { ImageResponse } from "next/og";
import { scorecardFromCode } from "@/lib/scorecard";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

function toneFor(score: number): string {
  if (score >= 80) return "#0fa063";
  if (score >= 60) return "#0a7f4f";
  if (score >= 45) return "#d97706";
  return "#dc2626";
}

export function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("c") ?? "";
  const card = scorecardFromCode(code);

  if (!card) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b1220",
            color: "#ffffff",
            fontSize: 54,
            fontWeight: 700,
          }}
        >
          StoreBrief — score your store free
        </div>
      ),
      { width: WIDTH, height: HEIGHT },
    );
  }

  const tone = toneFor(card.score);
  const ringSize = 300;
  const stroke = 26;
  const r = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (card.score / 100) * circumference;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7faf9",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          color: "#0b1220",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 2, color: "#0a7f4f" }}>
            STOREBRIEF · STORE SCORECARD
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#4a5568" }}>{card.shopHost}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <div style={{ display: "flex", position: "relative", width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize}>
              <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="#e3e9e6" strokeWidth={stroke} />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={r}
                fill="none"
                stroke={tone}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference - filled}`}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: ringSize,
                height: ringSize,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", fontSize: 118, fontWeight: 800, color: tone, lineHeight: 1 }}>
                {card.score}
              </div>
              <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#4a5568", letterSpacing: 3 }}>
                OUT OF 100
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  background: tone,
                  color: "#ffffff",
                  fontSize: 30,
                  fontWeight: 800,
                  padding: "8px 22px",
                  borderRadius: 999,
                }}
              >
                Grade {card.grade}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, marginTop: 20, lineHeight: 1.1 }}>
              {card.headline}
            </div>
            <div style={{ display: "flex", fontSize: 28, color: "#4a5568", marginTop: 18, lineHeight: 1.35 }}>
              {card.topFix.length > 120 ? `${card.topFix.slice(0, 117)}…` : card.topFix}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #e3e9e6",
            paddingTop: 24,
            fontSize: 26,
            color: "#4a5568",
          }}
        >
          <div style={{ display: "flex" }}>
            Scored from {card.productCount} product{card.productCount === 1 ? "" : "s"} on the public storefront
          </div>
          <div style={{ display: "flex", fontWeight: 700, color: "#0b1220" }}>Score yours free →</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Codes are immutable, so the render is too.
        "cache-control": "public, max-age=31536000, immutable",
      },
    },
  );
}
