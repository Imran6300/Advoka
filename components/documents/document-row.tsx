"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FileText, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  toDisplayStatus,
  DISPLAY_STATUS_LABEL,
  formatFileSize,
  extensionLabel,
} from "@/lib/documents/status";

export interface DocumentRowData {
  _id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: "uploaded" | "extracting" | "extracted" | "failed";
  pageCount: number | null;
  errorMessage: string | null;
  createdAt: string;
  // Purely local, client-side state for a file mid-HTTP-upload — never
  // comes from the server, since there's no Document record yet at this point.
  localUploadPercent?: number;
}

/** §8 — subtle animated progress indicator, never a generic spinner. */
function ProcessingIndicator() {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
      <motion.div
        className="ai-gradient-bg-animated absolute inset-y-0 w-1/3 animate-gradient-x rounded-full"
        animate={{ x: ["-100%", "220%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <div className="absolute inset-0 animate-sweep bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function statusBadgeVariant(status: ReturnType<typeof toDisplayStatus>) {
  switch (status) {
    case "ready":
      return "success" as const;
    case "failed":
      return "error" as const;
    case "processing":
      return "info" as const;
    case "uploading":
    default:
      return "default" as const;
  }
}

/**
 * Memoized (perf pass) — the Documents tab polls `useCaseStatus` every 4s
 * while anything is still extracting. React Query's structural sharing
 * keeps unchanged document objects referentially stable across polls, so
 * this skips re-rendering rows whose status hasn't actually changed instead
 * of re-rendering the entire list on every tick.
 */
export const DocumentRow = memo(function DocumentRow({
  document,
  onRetry,
  retrying,
}: {
  document: DocumentRowData;
  onRetry?: (documentId: string) => void;
  retrying?: boolean;
}) {
  const isUploading = document.localUploadPercent !== undefined && document.localUploadPercent < 100;
  const displayStatus = isUploading ? "uploading" : toDisplayStatus(document.status);
  const showProgressBar = displayStatus === "uploading" || displayStatus === "processing";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-elevated">
            <FileText className="h-4 w-4 text-text-muted" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-text-primary">
              {document.originalFilename}
            </p>
            <p className="mt-0.5 text-[12.5px] text-text-muted">
              {extensionLabel(document.mimeType)} · {formatFileSize(document.sizeBytes)}
              {document.pageCount ? ` · ${document.pageCount} page${document.pageCount === 1 ? "" : "s"}` : ""}
              {" · "}
              {new Date(document.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <Badge variant={statusBadgeVariant(displayStatus)} className="shrink-0">
            {DISPLAY_STATUS_LABEL[displayStatus]}
          </Badge>

          {displayStatus === "failed" && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(document._id)}
              disabled={retrying}
              className="shrink-0"
            >
              <RotateCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
              Try Again
            </Button>
          )}
        </div>

        {showProgressBar && <ProcessingIndicator />}

        {displayStatus === "failed" && document.errorMessage && (
          <p className="text-[12.5px] text-error">{document.errorMessage}</p>
        )}
      </CardContent>
    </Card>
  );
});
