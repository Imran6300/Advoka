export const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  tif: "image/tiff",
  tiff: "image/tiff",
};

export const ALLOWED_MIME_TYPES = new Set(Object.values(MIME_BY_EXT).concat("image/jpg"));
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB
export const MAX_FILES_PER_REQUEST = 20;

/** Declared type if allowed, otherwise fall back to the extension (Windows often sends octet-stream). */
export function resolveMimeType(filename: string, declared: string): string {
  const d = (declared || "").toLowerCase();
  if (ALLOWED_MIME_TYPES.has(d)) return d;
  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  return MIME_BY_EXT[ext] ?? d;
}
