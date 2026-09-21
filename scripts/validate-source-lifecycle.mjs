import { canTransitionSource, transitionSource } from "../src/data/sourceLifecycle.js";

const cases = [
  ["pending", "file-selected", true],
  ["file-selected", "indexed", true],
  ["indexed", "active", true],
  ["active", "archived", true],
  ["pending", "active", false],
  ["archived", "active", false],
];

for (const [from, to, expected] of cases) {
  if (canTransitionSource(from, to) !== expected) {
    throw new Error(`Unexpected transition result: ${from} -> ${to}`);
  }
}

const source = { id: "test-source", status: "indexed" };
const active = transitionSource(source, "active");
if (active.status !== "active" || !active.updatedAt) {
  throw new Error("Valid transition did not update source.");
}

const blocked = transitionSource(active, "pending");
if (blocked.status !== "active") {
  throw new Error("Invalid transition changed source status.");
}

console.log("PP source lifecycle validation passed.");
