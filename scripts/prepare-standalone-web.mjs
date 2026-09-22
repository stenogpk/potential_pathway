import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html was not produced by Vite.");
}

let html = fs.readFileSync(indexPath, "utf8");
const pattern = /<script([^>]*?)type=["']module["']([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/i;
const match = html.match(pattern);

if (!match) {
  throw new Error("Could not find the Vite module entry in dist/index.html.");
}

const src = match[3];
if (!src.includes("/assets/") || !src.endsWith(".js")) {
  throw new Error(`Unexpected standalone entry path: ${src}`);
}

const bundlePath = path.join(distDir, src.replace(/^\.\//, ""));
if (!fs.existsSync(bundlePath)) {
  throw new Error(`Standalone bundle not found: ${bundlePath}`);
}

const bundle = fs.readFileSync(bundlePath, "utf8");
if (/^\s*(import|export)\s/m.test(bundle)) {
  throw new Error("Standalone entry still contains static ESM syntax.");
}

// Vite emitted an IIFE. Load it as a normal deferred script so Android WebView
// and simple browser hosts do not depend on ES module MIME/CORS handling.
html = html.replace(match[0], `<script defer src="${src}"></script>`);
fs.writeFileSync(indexPath, html, "utf8");

console.log(`Prepared standalone entry: ${src}`);
console.log(`Bundle size: ${bundle.length} bytes`);
console.log("Static ESM syntax check: PASS");
