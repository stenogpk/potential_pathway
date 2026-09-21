import { addSource, updateSource, transitionSourceById, removeSource } from "../src/data/sourceRegistry.js";
import { sourceStats } from "../src/data/sourceStats.js";

const base = { id: "s1", missionId: "pcs", title: "Test", status: "pending" };
let rows = addSource([], base);
if (rows.length !== 1) throw new Error("addSource failed");
rows = updateSource(rows, "s1", { title: "Updated" });
if (rows[0].title !== "Updated") throw new Error("updateSource failed");
rows = transitionSourceById(rows, "s1", "file-selected");
if (rows[0].status !== "file-selected") throw new Error("transitionSourceById failed");
const stats = sourceStats(rows, "pcs");
if (stats.total !== 1 || stats.fileSelected !== 1) throw new Error("sourceStats failed");
rows = removeSource(rows, "s1");
if (rows.length !== 0) throw new Error("removeSource failed");
console.log("PP source registry validation passed.");
