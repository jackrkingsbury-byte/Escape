/**
 * Deterministic tests for the shareable Store Scorecard.
 * Run: npx tsx scripts/scorecard.test.ts
 *
 * The scorecard is the thing people paste into WhatsApp, so two properties
 * matter more than the wording: the score is arithmetic (never guessed), and a
 * share code round-trips to exactly the same card — or fails cleanly.
 */
import {
  buildScorecard,
  buildVersus,
  decodeFacts,
  encodeFacts,
  encodeVersus,
  gradeFor,
  readFacts,
  scoreStorefront,
  scorecardFromCode,
  versusFromCodes,
  type StoreFacts,
} from "../lib/scorecard";
import type { PublicProduct } from "../lib/storescan";

const NOW = new Date("2026-07-29T12:00:00Z");
const DAY = 86_400_000;

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * DAY).toISOString();
}

function product(over: Partial<PublicProduct> = {}): PublicProduct {
  return {
    title: "Thing",
    body_html: `<p>${"word ".repeat(40)}</p>`,
    published_at: daysAgo(3),
    images: [{ src: "a.jpg" }, { src: "b.jpg" }],
    variants: [{ price: "199.00", available: true }],
    ...over,
  };
}

let failures = 0;
function check(name: string, pass: boolean, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  → ${detail}` : ""}`);
  if (!pass) failures++;
}
function eq(name: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  check(name, pass, pass ? String(actual) : `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
}

// --- unit: reading the storefront ---
{
  const facts = readFacts(
    [
      product(),
      product({ images: [] }),
      product({ body_html: "<p>short</p>" }),
      product({ variants: [{ price: "10.00", available: false }] }),
      product({ images: [{ src: "one.jpg" }], published_at: daysAgo(200) }),
    ],
    "shop.co.za",
    NOW,
  );
  eq("reads total products", facts.total, 5);
  eq("counts products with a photo", facts.withImage, 4);
  eq("counts products with 2+ photos", facts.withMultiImage, 3);
  eq("counts real descriptions", facts.withGoodDescription, 4);
  eq("counts buyable products", facts.inStock, 4);
  eq("dates the newest product", facts.newestDays, 3);
}

// --- unit: a perfect storefront scores 100 ---
{
  const { scorecard } = scoreStorefront(
    Array.from({ length: 12 }, () => product()),
    "great.co.za",
    NOW,
  );
  eq("perfect storefront scores 100", scorecard.score, 100);
  eq("perfect storefront grades A+", scorecard.grade, "A+");
  check(
    "perfect storefront has no fix left to invent",
    /sales data/.test(scorecard.topFix),
    scorecard.topFix,
  );
}

// --- unit: an empty storefront scores 0 and says so kindly ---
{
  const { scorecard } = scoreStorefront([], "empty.co.za", NOW);
  eq("empty storefront scores 0", scorecard.score, 0);
  check("empty storefront tells them to publish", /Publish/.test(scorecard.topFix), scorecard.topFix);
  check("empty storefront headline is not a scolding", scorecard.headline === "Nothing's live yet.");
}

// --- property: the score is exactly the sum of its categories ---
{
  const cases: PublicProduct[][] = [
    [],
    [product()],
    [product({ images: [] }), product({ body_html: "" })],
    Array.from({ length: 30 }, (_, i) =>
      product({
        images: i % 3 === 0 ? [] : [{ src: "a.jpg" }],
        body_html: i % 2 === 0 ? "<p>tiny</p>" : `<p>${"word ".repeat(50)}</p>`,
        published_at: daysAgo(i * 9),
        variants: [{ price: "50", available: i % 4 !== 0 }],
      }),
    ),
  ];
  let allMatch = true;
  let inRange = true;
  for (const products of cases) {
    const { scorecard } = scoreStorefront(products, "case.co.za", NOW);
    const sum = scorecard.categories.reduce((t, c) => t + c.points, 0);
    if (sum !== scorecard.score) allMatch = false;
    if (scorecard.score < 0 || scorecard.score > 100) inRange = false;
    for (const c of scorecard.categories) {
      if (c.points < 0 || c.points > c.max) inRange = false;
    }
  }
  check("score always equals the sum of its categories", allMatch);
  check("score and every category stay inside their bounds", inRange);
}

// --- unit: the top fix points at the biggest pile of lost points ---
{
  const missingPhotos = Array.from({ length: 10 }, (_, i) =>
    product({ images: i < 7 ? [] : [{ src: "a.jpg" }, { src: "b.jpg" }] }),
  );
  const { scorecard } = scoreStorefront(missingPhotos, "bare.co.za", NOW);
  check(
    "top fix chases the missing photos first",
    /Photograph the 7 products/.test(scorecard.topFix),
    scorecard.topFix,
  );

  const stale = Array.from({ length: 10 }, () => product({ published_at: daysAgo(400) }));
  const staleCard = scoreStorefront(stale, "stale.co.za", NOW).scorecard;
  check(
    "top fix chases staleness when that's the deepest hole",
    /new product or bundle/.test(staleCard.topFix),
    staleCard.topFix,
  );
}

// --- unit: an undatable catalog is scored neutrally, not punished ---
{
  const undated = Array.from({ length: 5 }, () =>
    product({ published_at: undefined, created_at: undefined }),
  );
  const { facts, scorecard } = scoreStorefront(undated, "nodates.co.za", NOW);
  eq("undatable catalog has no newestDays", facts.newestDays, null);
  const freshness = scorecard.categories.find((c) => c.key === "freshness");
  eq("undatable freshness scores the midpoint", freshness?.points, 10);
}

// --- unit: grade boundaries ---
{
  eq("90 is an A+", gradeFor(90), "A+");
  eq("89 is an A", gradeFor(89), "A");
  eq("70 is a B", gradeFor(70), "B");
  eq("59 is a D", gradeFor(59), "D");
  eq("0 is an E", gradeFor(0), "E");
}

// --- unit: share codes round-trip exactly ---
{
  const { facts, scorecard } = scoreStorefront(
    [product(), product({ images: [] }), product({ body_html: "<p>hi</p>" })],
    "roundtrip.myshopify.com",
    NOW,
  );
  const code = encodeFacts(facts);
  const back = decodeFacts(code);
  eq("share code round-trips the facts", back, facts);

  const rebuilt = scorecardFromCode(code);
  eq("share code rebuilds the same score", rebuilt?.score, scorecard.score);
  eq("share code rebuilds the same headline", rebuilt?.headline, scorecard.headline);
  eq("share code rebuilds the same fix", rebuilt?.topFix, scorecard.topFix);
  check("share code stays short enough to paste", code.length < 90, `${code.length} chars`);
  check("share code is URL-safe", /^[A-Za-z0-9_-]+$/.test(code), code);
}

// --- unit: junk codes fail closed, never render a fake card ---
{
  const good = encodeFacts(readFacts([product()], "real.co.za", NOW));
  const tampered = Buffer.from(
    Buffer.from(good, "base64url").toString("utf8").replace("~1~", "~999~"),
    "utf8",
  ).toString("base64url");

  const junk = [
    "",
    "!!!!",
    "notbase64!!",
    Buffer.from("1~nodot~1~1~1~1~1~1~1~abcd", "utf8").toString("base64url"),
    Buffer.from("2~ver.co.za~1~1~1~1~1~1~1~abcd", "utf8").toString("base64url"),
    Buffer.from("1~x.co.za~1~1~1~1~1~1~1~wrong", "utf8").toString("base64url"),
    tampered,
    "a".repeat(500),
  ];
  const allRejected = junk.every((c) => scorecardFromCode(c) === null);
  check("junk, tampered and oversized codes are all rejected", allRejected);
}

// --- unit: a hostile code can't manufacture a perfect score ---
{
  const lying: StoreFacts = {
    shopHost: "liar.co.za",
    total: 2,
    withImage: 999,
    withMultiImage: 999,
    withGoodDescription: 999,
    inStock: 999,
    newestDays: 0,
    scannedDay: Math.floor(NOW.getTime() / DAY),
  };
  const decoded = decodeFacts(encodeFacts(lying));
  eq("inflated counts are clamped to the catalog", decoded?.withImage, 2);
  eq("multi-image count can't exceed the photo count", decoded?.withMultiImage, 2);
  const card = buildScorecard(decoded as StoreFacts);
  check("a clamped card still scores inside 0-100", card.score >= 0 && card.score <= 100, String(card.score));
}

// --- unit: every category explains its own arithmetic ---
{
  const { scorecard } = scoreStorefront([product(), product({ images: [] })], "explain.co.za", NOW);
  const allExplained = scorecard.categories.every((c) => c.explain.trim().length > 0 && c.verdict.trim().length > 0);
  check("every category shows its working and a plain-English verdict", allExplained);
}

// --- unit: head-to-head ---
{
  const strong = scoreStorefront(Array.from({ length: 12 }, () => product()), "strong.co.za", NOW);
  const weak = scoreStorefront(
    Array.from({ length: 4 }, () => product({ images: [], body_html: "<p>x</p>", published_at: daysAgo(300) })),
    "weak.co.za",
    NOW,
  );

  const ahead = buildVersus(strong.scorecard, weak.scorecard);
  eq("lead is your score minus theirs", ahead.lead, strong.scorecard.score - weak.scorecard.score);
  check("a big lead reads as well ahead", /well ahead\.$/.test(ahead.headline), ahead.headline);

  const behind = buildVersus(weak.scorecard, strong.scorecard);
  eq("the mirror match has the opposite lead", behind.lead, -ahead.lead);
  check("being behind names the other store", behind.headline.startsWith("strong.co.za"), behind.headline);

  const tied = buildVersus(strong.scorecard, strong.scorecard);
  eq("equal scores are a dead heat", tied.headline, "Dead heat.");
  eq("a tie has no lead", tied.lead, 0);

  check(
    "gaps cover every category, biggest difference first",
    ahead.gaps.length === strong.scorecard.categories.length &&
      ahead.gaps.every((g, i, all) =>
        i === 0 || Math.abs(all[i - 1].you - all[i - 1].them) >= Math.abs(g.you - g.them),
      ),
    ahead.gaps.map((g) => `${g.label} ${g.you}-${g.them}`).join(", "),
  );

  const codes = encodeVersus(strong.facts, weak.facts);
  const rebuilt = versusFromCodes(codes);
  eq("versus codes round-trip the lead", rebuilt?.lead, ahead.lead);
  eq("versus codes round-trip the headline", rebuilt?.headline, ahead.headline);
  eq("versus keeps the two stores in order", rebuilt?.you.shopHost, "strong.co.za");
  check("versus codes are URL-safe", /^[A-Za-z0-9_.-]+$/.test(codes), `${codes.length} chars`);

  const badPairs = [
    "",
    codes.split(".")[0], // one code only
    `${codes}.${codes}`, // three or more
    `${codes.split(".")[0]}.garbage!!`,
    "a".repeat(1000),
  ];
  check("malformed versus codes are all rejected", badPairs.every((c) => versusFromCodes(c) === null));
}

console.log(failures === 0 ? "\nAll scorecard tests passed." : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
