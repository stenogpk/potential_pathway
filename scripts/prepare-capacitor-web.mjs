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

if (/^\s*(import|export)\s/m.test(bundle)) {
  throw new Error("Capacitor entry still contains static import/export syntax.");
}

// The Vite HTML places the module entry in <head>. A classic inline script there
// would execute before <body> exists, so move the compiled application bootstrap
// to the end of <body>, after #root and after startup diagnostics are registered.
const safeBundle = bundle.replaceAll("</script", "<\\/script");
const replacement = "";
html = html.replace(match[0], replacement);
const injection = `    <script>${safeBundle}</script>\n  </body>`;
if (!html.includes("</body>")) {
  throw new Error("Could not find </body> in dist/index.html.");
}
html = html.replace("</body>", injection);

fs.writeFileSync(indexPath, html, "utf8");

console.log(`Inlined native/browser app entry from: ${relativeSrc}`);
console.log(`Inline bundle size: ${bundle.length} bytes`);
console.log("Static ESM syntax check: PASS");
console.log("Bootstrap placement check: END OF BODY");
