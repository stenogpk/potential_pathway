export const BACKUP_VERSION = 1;
export const BACKUP_FORMAT = "pp-study-backup";

export function createBackupEnvelope(state, sourceFiles = []) {
  return {
    format: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    app: "Potential Pathway",
    createdAt: new Date().toISOString(),
    studyState: state,
    sources: sourceFiles.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size || 0,
      lastModified: file.lastModified || 0,
      status: "binary-source-file",
    })),
  };
}

export function validateBackupEnvelope(value) {
  if (!value || typeof value !== "object") return { valid: false, reason: "Backup is not an object." };
  if (value.format !== BACKUP_FORMAT) return { valid: false, reason: "Unsupported PP backup format." };
  if (value.backupVersion !== BACKUP_VERSION) return { valid: false, reason: "Unsupported backup version." };
  if (!value.studyState || typeof value.studyState !== "object") return { valid: false, reason: "Study state is missing." };
  if (!Array.isArray(value.sources)) return { valid: false, reason: "Source manifest is missing." };
  return { valid: true, reason: null };
}
