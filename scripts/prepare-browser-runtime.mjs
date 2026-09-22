import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
if (!fs.existsSync(indexPath)) throw new Error("dist/index.html missing");

let html = fs.readFileSync(indexPath, "utf8");
const pattern = /<script([^>]*?)type=["']module["']([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/i;
const match = html.match(pattern);
if (!match) throw new Error("Vite app entry script not found");

const src = match[3];
if (!src.startsWith("./") || !src.endsWith(".js")) {
  throw new Error(`Unexpected app entry: ${src}`);
}

const bundlePath = path.join(distDir, src);
if (!fs.existsSync(bundlePath)) throw new Error(`App bundle missing: ${bundlePath}`);
const bundle = fs.readFileSync(bundlePath, "utf8");

if (/^\s*(import|export)\s/m.test(bundle)) {
  throw new Error("App entry still contains static ESM syntax.");
}
if (!bundle.includes("createRoot(")) {
  throw new Error("Compiled app entry does not contain the React mount call.");
}

// Vite's production entry is a self-contained classic-compatible bundle.
// Loading it as a deferred classic script avoids WebView/browser module MIME and
// CORS differences while preserving dynamic import() for PDF.js on demand.
html = html.replace(match[0], `<script defer src="${src}"></script>`);
fs.writeFileSync(indexPath, html, "utf8");

console.log(`Prepared runtime entry: ${src}`);
console.log(`Bundle bytes: ${bundle.length}`);
console.log("React mount present: PASS");
console.log("Static ESM syntax check: PASS");
