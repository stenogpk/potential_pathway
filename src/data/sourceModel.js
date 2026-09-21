export const sourceTypes = [
  "official-pdf",
  "reference",
  "notes",
  "external-url",
  "other",
];

export const sourceAuthorities = [
  "official",
  "user-provided",
  "trusted-external",
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
  type: "official-pdf | reference | notes | external-url | other",
  authority: "official | user-provided | trusted-external | secondary",
  status: "pending | file-selected | indexed | active | archived",
  fileName: "string | null",
  fileSize: "number | null",
  mimeType: "string | null",
  url: "string | null",
  publisher: "string | null",
  verification: "object | null",
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
  url = null,
  publisher = null,
  verification = null,
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
    url,
    publisher,
    verification,
  };
}
