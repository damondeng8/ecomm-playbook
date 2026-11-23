import { describe, expect, test } from "bun:test";
import { armFor, fillMergeFields, renderEmail, type Brand, type Email } from "./shell";

const brand: Brand = {
  name: "Acme", address: "1 Main St, Toronto, ON", canvas: "#F0EEE9", sheet: "#FFFFFF",
  ink: "#191918", muted: "#6B6A66", accent: "#C8102E", accentInk: "#FFFFFF",
};
const email: Email = {
  subject: "Still thinking it over?",
  preheader: "Here is what stopped most people.",
  blocks: [
    { type: "heading", text: "You left something behind" },
    { type: "text", text: "Hey {{first_name|there}},\n\nMost people stop at shipping. It's free over $50." },
    { type: "image", src: "https://cdn.example.com/a.webp", alt: "The bottle on a desk" },
    { type: "button", label: "Back to my cart", href: "{{cart_url}}" },
  ],
  signoff: "Maya, founder",
};

describe("renderEmail", () => {
  const out = renderEmail(email, brand);

  test("carries the footer every marketing email needs", () => {
    expect(out.html).toContain("{{unsubscribe_url}}");
    expect(out.html).toContain("1 Main St, Toronto, ON");
    expect(out.text).toContain("Unsubscribe: {{unsubscribe_url}}");
  });

  test("pads the preheader and keeps it hidden", () => {
    expect(out.html).toContain("Here is what stopped most people.");
    expect(out.html.match(/&nbsp;&zwnj;/g)!.length).toBe(100);
    expect(out.html).toContain("display:none");
  });

  test("uses inline styles and tables, no style tag or script", () => {
    expect(out.html).not.toContain("<style");
    expect(out.html).not.toContain("<script");
    expect(out.html).toContain('role="presentation"');
  });

  test("escapes copy", () => {
    const o = renderEmail({ ...email, blocks: [{ type: "text", text: "5 < 6 & <b>bold</b>" }] }, brand);
    expect(o.html).toContain("5 &lt; 6 &amp; &lt;b&gt;bold&lt;/b&gt;");
  });

  test("gives a plain-text part with the link", () => {
    expect(out.text).toContain("Back to my cart: {{cart_url}}");
    expect(out.text).toContain("Maya, founder");
  });

  test("transactional email has no unsubscribe link", () => {
    const o = renderEmail({ ...email, transactional: true }, brand);
    expect(o.html).not.toContain("{{unsubscribe_url}}");
  });

  test("refuses what the rules forbid", () => {
    expect(() => renderEmail({ ...email, subject: "a\nb" }, brand)).toThrow("subject");
    expect(() => renderEmail({ ...email, subject: "x".repeat(201) }, brand)).toThrow("subject");
    expect(() => renderEmail({ ...email, preheader: " " }, brand)).toThrow("preheader");
    expect(() => renderEmail({ ...email, blocks: [...email.blocks, { type: "button", label: "x", href: "https://a.co" }] }, brand)).toThrow("one button");
    expect(() => renderEmail({ ...email, blocks: [{ type: "image", src: "http://a.co/x.png", alt: "x" }] }, brand)).toThrow("https");
    expect(() => renderEmail({ ...email, blocks: [{ type: "button", label: "x", href: "javascript:alert(1)" }] }, brand)).toThrow("https");
    expect(() => renderEmail(email, { ...brand, address: "" })).toThrow("address");
    expect(() => renderEmail({ ...email, blocks: [{ type: "text", text: "x".repeat(61_000) }] }, brand)).toThrow("Gmail");
  });
});

describe("fillMergeFields", () => {
  test("fills values, uses fallbacks, leaves the unsubscribe link for the server", () => {
    const html = renderEmail(email, brand).html;
    const filled = fillMergeFields(html, { cart_url: "https://shop.example.com/cart/abc" });
    expect(filled).toContain("Hey there,");
    expect(filled).toContain('href="https://shop.example.com/cart/abc"');
    expect(filled).toContain("{{unsubscribe_url}}");
    expect(fillMergeFields("Hey {{first_name|there}}", { first_name: "Sam" })).toBe("Hey Sam");
  });

  test("refuses to send a raw field", () => {
    expect(() => fillMergeFields("See {{cart_url}}", {})).toThrow("cart_url");
  });
});

describe("armFor", () => {
  test("is stable, ignores case and spaces, and uses every arm", async () => {
    const arms = ["A", "B", "C"];
    expect(await armFor("Sam@Example.com ", "abandon-d3", arms)).toBe(await armFor("sam@example.com", "abandon-d3", arms));
    const seen = new Set<string>();
    const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
    for (let i = 0; i < 600; i++) { const a = await armFor(`u${i}@example.com`, "abandon-d3", arms); seen.add(a); counts[a]!++; }
    expect(seen.size).toBe(3);
    for (const a of arms) expect(counts[a]!).toBeGreaterThan(150);
  });
});
