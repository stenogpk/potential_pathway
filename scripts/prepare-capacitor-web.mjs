import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html was not produced by Vite.");
}

let html = fs.readFileSync(indexPath, "utf8");
const moduleScriptPattern = /<script([^>]*?)type=["']module["']([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/i;
const match = html.match(moduleScriptPattern);

if (!match) {
  throw new Error("Could not find the Vite entry module in dist/index.html.");
}

const src = match[3];
if (!src.includes("/assets/") || !src.endsWith(".js")) {
  throw new Error(`Unexpected Vite entry path: ${src}`);
}

// Android WebView is much more reliable with the already-bundled entry executed
// as a classic script. Vite has already collapsed the static ESM imports into this
// single file; the remaining dynamic import() calls are only used for PDF tooling.
const replacement = `<script defer src="${src}"></script>`;
html = html.replace(match[0], replacement);

fs.writeFileSync(indexPath, html, "utf8");

const bundlePath = path.join(distDir, src.replace(/^\//, ""));
const bundle = fs.readFileSync(bundlePath, "utf8");
if (/^\\s*(import|export)\\s/m.test(bundle)) {
  throw new Error("The Vite entry still contains a static import/export and cannot be executed as a classic script.");
}

console.log(`Prepared Capacitor entry: ${src}`);
console.log("Static ESM import/export check: PASS");
