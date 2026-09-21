import { normalizeSources } from "../src/lib/storage.js";

const rows = normalizeSources([
  { id: "s1", title: "A" },
  null,
  { title: "missing id" },
  { id: "s2", status: "active", sourceRefs: ["t1"] },
]);

if (rows.length !== 2) throw new Error("normalizeSources should discard invalid records");
if (rows[0].status !== "pending" || rows[0].sourceRefs.length !== 0) {
  throw new Error("normalizeSources defaults are incorrect");
}
if (rows[1].status !== "active" || rows[1].sourceRefs[0] !== "t1") {
  throw new Error("normalizeSources altered valid source data");
}
console.log("PP source storage validation passed.");
