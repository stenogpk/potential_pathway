import { createBackupEnvelope, validateBackupEnvelope } from "../src/data/backupModel.js";

const state = {
  version: 7,
  sessions: [{ id: "s1" }],
  sources: [{ id: "src1", fileName: "polity.pdf" }],
};

const envelope = createBackupEnvelope(state, [{
  id: "src1",
  name: "polity.pdf",
  type: "application/pdf",
  size: 1234,
  lastModified: 100,
}]);

const result = validateBackupEnvelope(envelope);
if (!result.valid) throw new Error(result.reason);
if (envelope.sources[0].name !== "polity.pdf") throw new Error("Source manifest missing.");
if (envelope.studyState.sessions.length !== 1) throw new Error("Study state missing.");
if (validateBackupEnvelope({}).valid) throw new Error("Invalid backup accepted.");

console.log("Backup manager validation passed.");
