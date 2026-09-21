export const sourceTypes = [
  "official-pdf",
  "reference",
  "notes",
  "other",
];

export const sourceAuthorities = [
  "official",
  "user-provided",
  "secondary",
];

export const sourceStatuses = [
  "pending",
  "file-selected",
  "indexed",
  "active",
  "archived",
];

export const sourceSchema = {
  id: "string",
  missionId: "string",
  title: "string",
  type: "official-pdf | reference | notes | other",
  authority: "official | user-provided | secondary",
  status: "pending | file-selected | indexed | active | archived",
  fileName: "string | null",
  fileSize: "number | null",
  mimeType: "string | null",
};

export function createSource({
  id,
  missionId,
  title,
  type = "other",
  authority = "user-provided",
  status = "pending",
  fileName = null,
  fileSize = null,
  mimeType = null,
}) {
  return {
    id,
    missionId,
    title,
    type,
    authority,
    status,
    fileName,
    fileSize,
    mimeType,
  };
}
