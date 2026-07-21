import { computeBrief } from "../lib/metrics";
import { briefToWhatsApp, buildPayload, sendWhatsAppBrief, type WhatsAppConfig } from "../lib/whatsapp";
import { findUnsupportedNumbers } from "../lib/writer";
import type { Order } from "../lib/types";

let failures = 0;
function ok(name: string, pass: boolean, extra = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  ${extra}`}`);
  if (!pass) failures++;
}

const NOW = new Date("2026-07-17T12:00:00Z");
const orders: Order[] = [
  { id: "1", createdAt: "2026-07-16T09:00:00Z", total: 900, customerId: "c1", lineItems: [{ title: "Blue Hoodie", quantity: 3, price: 300 }] },
  { id: "2", createdAt: "2026-07-14T10:00:00Z", total: 600, customerId: "c2", lineItems: [{ title: "Blue Hoodie", quantity: 2, price: 300 }] },
  { id: "p1", createdAt: "2026-07-05T09:00:00Z", total: 500, customerId: "c1", lineItems: [{ title: "Sneakers", quantity: 1, price: 500 }] },
];
const data = computeBrief(orders, { now: NOW, shopName: "Kagiso Kicks", currency: "R", inventory: { "Blue Hoodie": 4 } });

const config: WhatsAppConfig = {
  accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authToken: "tok_secret",
  from: "whatsapp:+14155238886",
  to: "whatsapp:+27826118749",
};

// 1. The message body is the guardrail-clean WhatsApp render.
const body = briefToWhatsApp(data);
ok("body carries the shop name", body.includes("Kagiso Kicks"));
ok("body has bold markers", body.includes("*"));
ok("body has zero unsupported numbers", findUnsupportedNumbers(body, data).length === 0);

// 2. Freeform payload carries Body, not a template.
const freeform = buildPayload(config, data);
ok("freeform payload has From/To", freeform.From === config.from && freeform.To === config.to);
ok("freeform payload has Body", freeform.Body === body);
ok("freeform payload has no ContentSid", freeform.ContentSid === undefined);

// 3. Template payload (proactive/production) carries ContentSid + variables, no Body.
const templated = buildPayload(config, data, {
  templateSid: "HXtemplate123",
  templateVariables: { "1": "Kagiso Kicks", "2": "R1 500" },
});
ok("template payload has ContentSid", templated.ContentSid === "HXtemplate123");
ok("template payload encodes variables as JSON", templated.ContentVariables === '{"1":"Kagiso Kicks","2":"R1 500"}');
ok("template payload omits Body", templated.Body === undefined);

// 4. dryRun builds without sending.
const dry = await sendWhatsAppBrief(config, data, { dryRun: true });
ok("dryRun returns ok with payload, no network", dry.ok && dry.status === 0 && dry.payload.Body === body);

// 5. Real send path uses an injected fetch: correct URL, auth, method, form body.
let seen: { url: string; init: RequestInit } | null = null;
const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
  seen = { url: String(url), init: init ?? {} };
  return {
    ok: true,
    status: 201,
    json: async () => ({ sid: "SM123" }),
  } as unknown as Response;
}) as unknown as typeof fetch;

const sent = await sendWhatsAppBrief(config, data, { fetch: fakeFetch });
ok("send returns the Twilio sid", sent.ok && sent.sid === "SM123" && sent.status === 201);
ok("send hits the account Messages endpoint", !!seen && (seen as { url: string }).url.includes(`/Accounts/${config.accountSid}/Messages.json`));
ok("send uses POST", !!seen && (seen as { init: RequestInit }).init.method === "POST");
ok("send sets Basic auth", !!seen && String(((seen as { init: RequestInit }).init.headers as Record<string, string>).Authorization).startsWith("Basic "));
ok("send form-encodes From/To/Body", !!seen && String((seen as { init: RequestInit }).init.body).includes("From=whatsapp") && String((seen as { init: RequestInit }).init.body).includes("Body="));

// 6. Error path surfaces the Twilio message, never throws.
const errFetch = (async () => ({
  ok: false,
  status: 400,
  json: async () => ({ message: "Template not approved" }),
}) as unknown as Response) as unknown as typeof fetch;
const failed = await sendWhatsAppBrief(config, data, { fetch: errFetch });
ok("error path returns ok:false with message", !failed.ok && failed.error === "Template not approved");

console.log(failures === 0 ? "\nWHATSAPP: ALL TESTS PASSED" : `\nWHATSAPP: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
