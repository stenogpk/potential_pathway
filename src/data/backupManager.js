import { createBackupEnvelope, validateBackupEnvelope } from "./backupModel.js";
import { listSourceFiles } from "./sourceFileStore.js";

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

export async function buildBackupEnvelope(state) {
  const files = await listSourceFiles();
  return createBackupEnvelope(state, files);
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
