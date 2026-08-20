"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { DocumentUploader, type UploadingFile } from "@/components/documents/document-uploader";
import { DocumentRow, type DocumentRowData } from "@/components/documents/document-row";
import { EmptyState } from "@/components/ui/empty-state";
import { useCaseStatus, type CaseStatusResponse } from "@/lib/hooks/use-case-status";
import { useToast } from "@/components/ui/use-toast";

export function DocumentsPanel({
  caseId,
  initialStatus,
}: {
  caseId: string;
  initialStatus: CaseStatusResponse;
}) {
  const { data } = useCaseStatus(caseId, initialStatus);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const documents = data?.documents ?? [];

  async function handleRetry(documentId: string) {
    setRetryingId(documentId);
    try {
      const res = await fetch(`/api/cases/${caseId}/documents/${documentId}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn't retry that document.");
      }
      await queryClient.invalidateQueries({ queryKey: ["case-status", caseId] });
    } catch (err) {
      toast({
        title: "Retry failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetryingId(null);
    }
  }

  const uploadingRows: DocumentRowData[] = uploading.map((u) => ({
    _id: u.key,
    originalFilename: u.filename,
    mimeType: "",
    sizeBytes: 0,
    status: "uploaded",
    pageCount: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    localUploadPercent: u.percent,
  }));

  return (
    <div className="flex flex-col gap-4">
      <DocumentUploader
        caseId={caseId}
        onUploadStart={(files) => setUploading((prev) => [...prev, ...files])}
        onUploadProgress={(key, percent) =>
          setUploading((prev) => prev.map((f) => (f.key === key ? { ...f, percent } : f)))
        }
        onUploadSettled={async (success) => {
          setUploading([]);
          if (success) {
            await queryClient.invalidateQueries({ queryKey: ["case-status", caseId] });
          }
        }}
      />

      {uploadingRows.length === 0 && documents.length === 0 ? (
        <EmptyState
          icon={<UploadCloud className="h-5 w-5 text-text-muted" />}
          title="No documents yet"
          description="Upload your case documents above and Advoka will analyze them automatically."
        />
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {uploadingRows.map((row) => (
              <motion.div
                key={row._id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <DocumentRow document={row} />
              </motion.div>
            ))}
            {documents.map((doc) => (
              <motion.div
                key={doc._id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <DocumentRow document={doc} onRetry={handleRetry} retrying={retryingId === doc._id} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
