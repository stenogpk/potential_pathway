import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html was not produced by the Capacitor build.");
}

let html = fs.readFileSync(indexPath, "utf8");
const scriptPattern = /<script([^>]*?)type=["']module["']([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/i;
const match = html.match(scriptPattern);

if (!match) {
  throw new Error("Could not find the Vite module entry in dist/index.html.");
}

const src = match[3];
if (!src.includes("/assets/") || !src.endsWith(".js")) {
  throw new Error(`Unexpected Capacitor entry path: ${src}`);
}

const relativeSrc = src.startsWith("./") ? src : "." + (src.startsWith("/") ? src : "/" + src);
const bundlePath = path.join(distDir, relativeSrc.replace(/^\.\//, ""));

if (!fs.existsSync(bundlePath)) {
  throw new Error(`Vite entry bundle not found: ${bundlePath}`);
}

const bundle = fs.readFileSync(bundlePath, "utf8");

if (/^\\s*(import|export)\\s/m.test(bundle)) {
  throw new Error("Capacitor entry still contains static import/export syntax.");
}

if (!/\\bfunction\\s+[A-Za-z_$][\\w$]*\\s*\\(/.test(bundle) && !/\\(function\\s*\\(/.test(bundle)) {
  throw new Error("Capacitor entry does not look like a standalone JavaScript bundle.");
}

// Inline the app entry into index.html. The Android WebView demonstrably executes
// inline JavaScript (the startup diagnostic itself runs), so this removes the last
// dependency on external module/classic script loading, MIME detection, or asset URL
// resolution for the React bootstrap.
const safeBundle = bundle.replace(/<\\/script/gi, "<\\\\/script");
const replacement = `<script>${safeBundle}</script>`;
html = html.replace(match[0], replacement);

fs.writeFileSync(indexPath, html, "utf8");

console.log(`Inlined native WebView entry: ${relativeSrc}`);
console.log(`Inline bundle size: ${bundle.length} bytes`);
console.log("Standalone IIFE/static syntax check: PASS");
