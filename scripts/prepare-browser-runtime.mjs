import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
if (!fs.existsSync(indexPath)) throw new Error("dist/index.html missing");

const html = fs.readFileSync(indexPath, "utf8");
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

if (!bundle.includes("createRoot(")) {
  throw new Error("Compiled app entry does not contain the React mount call.");
}

// Keep the Vite entry as a real module. The compiled bundle intentionally uses
// import.meta for lazy PDF.js chunk loading, so converting this script to a
// classic <script> would cause a syntax error before React can mount.
console.log(`Prepared runtime entry: ${src}`);
console.log(`Bundle bytes: ${bundle.length}`);
console.log("React mount present: PASS");
console.log("Module entry preserved: PASS");
