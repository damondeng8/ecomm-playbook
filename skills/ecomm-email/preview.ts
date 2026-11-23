// Render an email module to files so it can be looked at before anyone is asked to approve it.
//   bun preview.ts ./welcome.ts [fields.json]
// The module default-exports { email, brand } (types from shell.ts). Writes <name>.html and <name>.txt
// to .preview/ next to the module, with merge fields filled from fields.json when given.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fillMergeFields, renderEmail, type Brand, type Email } from "./shell";

const [modulePath, fieldsPath] = process.argv.slice(2);
if (!modulePath) {
  console.error("usage: bun preview.ts <email module> [fields.json]");
  process.exit(1);
}
const file = resolve(modulePath);
const { email, brand } = (await import(file)).default as { email: Email; brand: Brand };
let { subject, html, text } = renderEmail(email, brand);
if (fieldsPath) {
  const fields = JSON.parse(readFileSync(resolve(fieldsPath), "utf8")) as Record<string, string>;
  subject = fillMergeFields(subject, fields);
  html = fillMergeFields(html, fields);
  text = fillMergeFields(text, fields);
}
const out = join(dirname(file), ".preview");
mkdirSync(out, { recursive: true });
const name = basename(file).replace(/\.[^.]+$/, "");
writeFileSync(join(out, `${name}.html`), html);
writeFileSync(join(out, `${name}.txt`), `Subject: ${subject}\nPreheader: ${email.preheader}\n\n${text}`);
const left = [...html.matchAll(/\{\{\s*([a-z0-9_]+)[^}]*\}\}/gi)].map((m) => m[1]).filter((f) => f !== "unsubscribe_url");
console.log(`${name}: ${new TextEncoder().encode(html).length} bytes · subject "${subject}"`);
console.log(`wrote ${join(out, `${name}.html`)} and .txt`);
if (left.length) console.log(`unfilled merge fields: ${[...new Set(left)].join(", ")}`);
