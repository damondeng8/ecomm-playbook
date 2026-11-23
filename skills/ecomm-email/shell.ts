// emails/shell.ts: the one HTML email shell. Blocks in, { subject, html, text } out.
// 640 px, one column, tables for layout, every style inline. Rules: the ecomm-email skill.

export type Brand = {
  name: string; // "Acme"
  address: string; // physical mailing address, required in every marketing email
  canvas: string; // page background, e.g. "#F0EEE9"
  sheet: string; // email background, e.g. "#FFFFFF"
  ink: string; // text, e.g. "#191918"
  muted: string; // secondary text, e.g. "#6B6A66"
  accent: string; // button, e.g. "#C8102E"
  accentInk: string; // button text, e.g. "#FFFFFF"
  logoUrl?: string; // public https URL
};

export type Block =
  | { type: "heading"; text: string }
  | { type: "text"; text: string } // plain text; blank lines split paragraphs
  | { type: "image"; src: string; alt: string; href?: string }
  | { type: "button"; label: string; href: string }
  | { type: "quote"; text: string; by: string }
  | { type: "callout"; text: string }
  | { type: "divider" }
  | { type: "spacer"; size?: "s" | "m" | "l" };

export type Email = {
  subject: string;
  preheader: string;
  blocks: Block[];
  signoff?: string; // "Maya, founder"
  transactional?: boolean; // order emails: no unsubscribe link
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const WIDTH = 640;
const MAX_HTML_BYTES = 60_000;
const UNSUBSCRIBE = "{{unsubscribe_url}}"; // the only field the server fills at send time

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Replaces {{field}} and {{field|fallback}}. Throws on a field with no value and no fallback,
// so a raw {{…}} can never reach an inbox. {{unsubscribe_url}} is left for the server.
export function fillMergeFields(template: string, fields: Record<string, string | undefined>): string {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*(?:\|([^}]*))?\}\}/gi, (match, name: string, fallback?: string) => {
    if (name === "unsubscribe_url") return match;
    const value = fields[name]?.trim() || fallback?.trim();
    if (!value) throw new Error(`merge field {{${name}}} has no value and no fallback`);
    return value;
  });
}

function httpsOnly(url: string): string {
  if (url === UNSUBSCRIBE || /^\{\{[a-z0-9_]+\}\}$/i.test(url)) return url;
  if (!/^https:\/\//i.test(url)) throw new Error(`links and images must be https URLs: ${url}`);
  return escapeHtml(url);
}

function paragraphs(text: string, style: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => `<p style="${style}">${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderBlock(block: Block, b: Brand): string {
  const body = `margin:0 0 16px;font:400 17px/1.5 ${FONT};color:${b.ink};`;
  switch (block.type) {
    case "heading":
      return `<h1 style="margin:0 0 16px;font:700 26px/1.25 ${FONT};color:${b.ink};">${escapeHtml(block.text)}</h1>`;
    case "text":
      return paragraphs(block.text, body);
    case "image": {
      const img = `<img src="${httpsOnly(block.src)}" alt="${escapeHtml(block.alt)}" width="${WIDTH - 64}" style="display:block;width:100%;max-width:${WIDTH - 64}px;height:auto;border:0;border-radius:8px;">`;
      return `<div style="margin:0 0 20px;">${block.href ? `<a href="${httpsOnly(block.href)}">${img}</a>` : img}</div>`;
    }
    case "button":
      // A table cell, not a styled link alone, so the button renders in every client.
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td bgcolor="${b.accent}" style="border-radius:8px;"><a href="${httpsOnly(block.href)}" style="display:inline-block;padding:14px 28px;font:600 17px/1 ${FONT};color:${b.accentInk};text-decoration:none;">${escapeHtml(block.label)}</a></td></tr></table>`;
    case "quote":
      return `<div style="margin:0 0 20px;padding:0 0 0 16px;border-left:3px solid ${b.accent};">${paragraphs(block.text, `margin:0 0 8px;font:400 17px/1.5 ${FONT};color:${b.ink};font-style:italic;`)}<p style="margin:0;font:400 14px/1.4 ${FONT};color:${b.muted};">${escapeHtml(block.by)}</p></div>`;
    case "callout":
      return `<div style="margin:0 0 20px;padding:16px;background:${b.canvas};border-radius:8px;">${paragraphs(block.text, `margin:0;font:400 16px/1.5 ${FONT};color:${b.ink};`)}</div>`;
    case "divider":
      return `<div style="margin:8px 0 24px;border-top:1px solid ${b.canvas};font-size:0;line-height:0;">&nbsp;</div>`;
    case "spacer":
      return `<div style="height:${{ s: 8, m: 24, l: 48 }[block.size ?? "m"]}px;font-size:0;line-height:0;">&nbsp;</div>`;
  }
}

function textBlock(block: Block): string {
  switch (block.type) {
    case "heading": return `${block.text}\n${"=".repeat(Math.min(block.text.length, 60))}`;
    case "text": case "callout": return block.text;
    case "image": return block.href ? `[${block.alt}] ${block.href}` : `[${block.alt}]`;
    case "button": return `${block.label}: ${block.href}`;
    case "quote": return `"${block.text}"\n${block.by}`;
    case "divider": return "---";
    case "spacer": return "";
  }
}

export function renderEmail(email: Email, brand: Brand): { subject: string; html: string; text: string } {
  const subject = email.subject.trim();
  if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) throw new Error("subject must be 1 to 200 characters on one line");
  if (!email.preheader.trim()) throw new Error("preheader is required");
  if (email.blocks.filter((x) => x.type === "button").length > 1) throw new Error("one button per email");
  if (!brand.address.trim()) throw new Error("brand.address is required");

  // 100 nbsp+zwnj pairs stop the inbox preview from running on into the body text.
  const preheader = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(email.preheader)}${"&nbsp;&zwnj;".repeat(100)}</div>`;
  const logo = brand.logoUrl
    ? `<img src="${httpsOnly(brand.logoUrl)}" alt="${escapeHtml(brand.name)}" height="28" style="display:block;height:28px;width:auto;border:0;">`
    : `<span style="font:700 18px/1 ${FONT};color:${brand.ink};">${escapeHtml(brand.name)}</span>`;
  const signoff = email.signoff ? `<p style="margin:8px 0 0;font:400 17px/1.5 ${FONT};color:${brand.ink};">${escapeHtml(email.signoff)}</p>` : "";
  const small = `margin:0 0 6px;font:400 12px/1.5 ${FONT};color:${brand.muted};`;
  const unsubscribe = email.transactional
    ? `<p style="${small}">You are receiving this because of your order.</p>`
    : `<p style="${small}"><a href="${UNSUBSCRIBE}" style="color:${brand.muted};text-decoration:underline;">Unsubscribe</a></p>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${brand.canvas};">${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.canvas};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${WIDTH}px;background:${brand.sheet};border-radius:12px;">
<tr><td style="padding:28px 32px 8px;">${logo}</td></tr>
<tr><td style="padding:16px 32px 32px;">${email.blocks.map((x) => renderBlock(x, brand)).join("\n")}${signoff}</td></tr>
</table>
<table role="presentation" width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${WIDTH}px;"><tr><td align="center" style="padding:20px 32px;">
${unsubscribe}<p style="${small}">${escapeHtml(brand.name)} · ${escapeHtml(brand.address)}</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  const bytes = new TextEncoder().encode(html).length;
  if (bytes > MAX_HTML_BYTES) throw new Error(`html is ${bytes} bytes; keep it under ${MAX_HTML_BYTES} or Gmail clips it`);

  const text = [
    ...email.blocks.map(textBlock).filter(Boolean),
    email.signoff ?? "",
    "--",
    email.transactional ? "You are receiving this because of your order." : `Unsubscribe: ${UNSUBSCRIBE}`,
    `${brand.name} · ${brand.address}`,
  ].filter(Boolean).join("\n\n");

  return { subject, html, text };
}

// Deterministic list split for A/B/C tests: the same email always lands in the same arm.
export async function armFor(email: string, experiment: string, arms: string[]): Promise<string> {
  const data = new TextEncoder().encode(`${email.trim().toLowerCase()}|${experiment}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const n = ((hash[0]! << 24) | (hash[1]! << 16) | (hash[2]! << 8) | hash[3]!) >>> 0;
  return arms[n % arms.length]!;
}
