import { createBackupEnvelope, validateBackupEnvelope } from "./backupModel.js";
import { listSourceFiles, saveSourceFile } from "./sourceFileStore.js";

const BACKUP_KEY = "pp-backup-settings-v1";
const DEBOUNCE_MS = 2500;

export function getBackupSettings() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY)) || {
      enabled: false,
      mode: "manual",
      provider: "none",
      lastBackupAt: null,
    };
  } catch {
    return { enabled: false, mode: "manual", provider: "none", lastBackupAt: null };
  }
}

export function saveBackupSettings(settings) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify({
    enabled: Boolean(settings?.enabled),
    mode: settings?.mode || "manual",
    provider: settings?.provider || "none",
    lastBackupAt: settings?.lastBackupAt || null,
  }));
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("Could not read source file."));
    reader.readAsDataURL(blob);
  });
}

export async function buildBackupEnvelope(state) {
  const files = await listSourceFiles();
  const sourceFiles = await Promise.all(files.map(async (row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size,
    lastModified: row.lastModified,
    data: await blobToBase64(row.blob),
  })));
  return {
    ...createBackupEnvelope(state, sourceFiles),
    sourceFiles,
  };
}

export async function restoreBackupEnvelope(envelope) {
  const result = validateBackupEnvelope(envelope);
  if (!result.valid) throw new Error(result.reason);
  for (const item of envelope.sourceFiles || []) {
    const bytes = Uint8Array.from(atob(item.data || ""), (char) => char.charCodeAt(0));
    const file = new File([bytes], item.name, { type: item.type, lastModified: item.lastModified || Date.now() });
    await saveSourceFile(item.id, file);
  }
  return envelope.studyState;
}

export function downloadBackup(envelope, filename = "potential-pathway-backup.json") {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file) {
  return file.text().then((text) => {
    const parsed = JSON.parse(text);
    const result = validateBackupEnvelope(parsed);
    if (!result.valid) throw new Error(result.reason);
    return parsed;
  });
}

let timer = null;
export function scheduleAutomaticBackup(callback) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    callback();
  }, DEBOUNCE_MS);
}

export function getCloudBackupStatus() {
  return {
    configured: getBackupSettings().provider !== "none",
    provider: getBackupSettings().provider,
    supportedProviders: ["google-drive"],
  };
}
