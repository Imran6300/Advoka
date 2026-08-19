"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.png,.jpg,.jpeg,.webp,.tiff";

export interface UploadingFile {
  key: string;
  filename: string;
  percent: number;
}

export function DocumentUploader({
  caseId,
  onUploadStart,
  onUploadProgress,
  onUploadSettled,
}: {
  caseId: string;
  onUploadStart: (files: UploadingFile[]) => void;
  onUploadProgress: (key: string, percent: number) => void;
  onUploadSettled: (success: boolean) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const tracked: UploadingFile[] = files.map((f) => ({
        key: `${f.name}-${f.size}-${Date.now()}`,
        filename: f.name,
        percent: 0,
      }));
      onUploadStart(tracked);

      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/cases/${caseId}/documents`);

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        tracked.forEach((t) => onUploadProgress(t.key, percent));
      };

      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        if (!ok) {
          let message = "We couldn't upload those files. Please try again.";
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed?.error) message = parsed.error;
          } catch {
            // keep default message
          }
          toast({ title: "Upload failed", description: message, variant: "destructive" });
        } else {
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed?.rejected?.length) {
              toast({
                title: "Some files were skipped",
                description: parsed.rejected
                  .map((r: { filename: string; reason: string }) => `${r.filename}: ${r.reason}`)
                  .join(" "),
                variant: "destructive",
              });
            }
          } catch {
            // ignore parse issues, upload still succeeded overall
          }
        }
        onUploadSettled(ok);
      };

      xhr.onerror = () => {
        toast({
          title: "Upload failed",
          description: "A network error interrupted the upload. Please try again.",
          variant: "destructive",
        });
        onUploadSettled(false);
      };

      xhr.send(formData);
    },
    [caseId, onUploadStart, onUploadProgress, onUploadSettled, toast]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        uploadFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-6 py-10 text-center transition-colors duration-card ease-advoka",
        isDragging && "border-primary bg-primary/5"
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-elevated">
        <UploadCloud className="h-5 w-5 text-text-muted" />
      </div>
      <p className="text-[14px] font-medium text-text-primary">
        Drag and drop files, or click to browse
      </p>
      <p className="text-[12.5px] text-text-muted">PDF, DOCX, or images · up to 25MB each</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </motion.div>
  );
}
