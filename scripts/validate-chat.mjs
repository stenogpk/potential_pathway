import fs from "node:fs";
import { searchSources } from "../src/data/sourceSearch.js";
import { buildChatEvidence } from "../src/data/chatEngine.js";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
for (const contract of ['setPanel("chat")','ChatPanel','SOURCE-GROUNDED AI CHAT']) {
  if (!main.includes(contract)) throw new Error(`Missing chat UI contract: ${contract}`);
}
const chunks = [
  { id: "c1", sourceId: "s1", missionId: "pcs", locator: "p.1", text: "Fundamental rights are guaranteed by the Constitution.", evidenceLayer: "user-source" },
];
const grounded = buildChatEvidence({ missionId: "pcs", query: "fundamental rights", chunks, searchFn: searchSources });
if (grounded.status !== "grounded" || grounded.matches.length !== 1) throw new Error("Grounded chat search failed.");
const missing = buildChatEvidence({ missionId: "pcs", query: "quantum computing", chunks, searchFn: searchSources });
if (missing.status !== "needs-external-verification") throw new Error("Missing-evidence chat did not trigger verification state.");
console.log("AI study chat validation passed.");
