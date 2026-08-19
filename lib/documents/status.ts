export type DisplayStatus = "uploading" | "processing" | "ready" | "failed";

export function toDisplayStatus(status: "uploaded" | "extracting" | "extracted" | "failed"): DisplayStatus {
  switch (status) {
    case "uploaded":
    case "extracting":
      return "processing";
    case "extracted":
      return "ready";
    case "failed":
      return "failed";
  }
}

export const DISPLAY_STATUS_LABEL: Record<DisplayStatus, string> = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extensionLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("wordprocessingml")) return "DOCX";
  if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase();
  return "FILE";
}
