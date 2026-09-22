import assert from "node:assert/strict";
import { createExternalSourceRecord, markExternalVerification, ingestExternalEvidence } from "../src/data/externalResearch.js";

const source = createExternalSourceRecord({
  missionId: "pcs",
  title: "UPPSC official",
  url: "https://uppsc.up.nic.in/",
  authority: "official",
  publisher: "UPPSC",
});
assert.ok(source);
const verified = markExternalVerification(source, { verifiedBy: "test", note: "verified" });
assert.equal(verified.status, "active");
const result = ingestExternalEvidence({ source: verified, text: "Official evidence text for validation." });
assert.equal(result.chunkCount, 1);
assert.equal(result.chunks[0].evidenceLayer, "official");
assert.equal(result.chunks[0].sourceUrl, "https://uppsc.up.nic.in/");
assert.equal(createExternalSourceRecord({ missionId: "pcs", title: "Bad", url: "https://example.com", authority: "trusted-external" }), null);
console.log("External evidence workflow validation passed.");
