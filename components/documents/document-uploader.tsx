"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.png,.jpg,.jpeg,.webp,.tiff";
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const PARALLEL_UPLOADS = 3;
// Vercel rejects request bodies above ~4.5MB, so the legacy server-side path
// is only a fallback for small files.
const LEGACY_MAX_BYTES = 4 * 1024 * 1024;

export interface UploadingFile {
  key: string;
  filename: string;
  percent: number;
}

interface SignResponse {
  direct: boolean;
  anonKey?: string;
  uploads?: Array<{ index: number; path: string; signedUrl: string; mimeType: string }>;
  rejected?: Array<{ index: number; filename: string; reason: string }>;
  error?: string;
}

interface RejectedItem {
  filename: string;
  reason: string;
}

/** Direct PUT to a Supabase signed upload URL, with real per-file progress. */
function putToSignedUrl(
  url: string,
  anonKey: string,
  file: File,
  mimeType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    // Same headers/body shape supabase-js's uploadToSignedUrl sends.
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(Object.assign(new Error(`Storage responded ${xhr.status}`), { network: false }));
    xhr.onerror = () => reject(Object.assign(new Error("Network error"), { network: true }));
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", new File([file], file.name, { type: mimeType }));
    xhr.send(body);
  });
}

/** Legacy path: multipart POST through our own API route. */
function legacyUpload(
  caseId: string,
  files: File[],
  onProgress: (percent: number) => void
): Promise<{ ok: boolean; message?: string; rejected: RejectedItem[] }> {
  return new Promise((resolve) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/cases/${caseId}/documents`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      let parsed: { error?: string; rejected?: RejectedItem[] } = {};
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        // keep defaults
      }
      resolve({ ok, message: ok ? undefined : parsed.error, rejected: parsed.rejected ?? [] });
    };
    xhr.onerror = () => resolve({ ok: false, message: "A network error interrupted the upload.", rejected: [] });
    xhr.send(formData);
  });
}

async function postJson<T>(url: string, payload: unknown): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, data };
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

  const run = useCallback(
    async (files: File[], keys: string[]) => {
      const failures: RejectedItem[] = [];
      let anySuccess = false;

      try {
        const sign = await postJson<SignResponse>(`/api/cases/${caseId}/documents/sign`, {
          files: files.map((f) => ({ filename: f.name, mimeType: f.type, sizeBytes: f.size })),
        });

        // ---- Fallback: direct upload not configured / signing unavailable ----
        if (!sign.ok || !sign.data.direct || !sign.data.anonKey) {
          const small = files.filter((f) => f.size <= LEGACY_MAX_BYTES);
          const tooBig = files.filter((f) => f.size > LEGACY_MAX_BYTES);
          tooBig.forEach((f) =>
            failures.push({
              filename: f.name,
              reason: "Large uploads need direct storage upload — set SUPABASE_ANON_KEY on the server.",
            })
          );
          if (small.length > 0) {
            const result = await legacyUpload(caseId, small, (p) =>
              small.forEach((f) => onUploadProgress(keys[files.indexOf(f)], p))
            );
            if (result.ok) anySuccess = true;
            else failures.push({ filename: "Upload", reason: result.message ?? "We couldn't upload those files." });
            failures.push(...result.rejected);
          }
          return;
        }

        const { anonKey, uploads = [], rejected = [] } = sign.data;
        rejected.forEach((r) => failures.push({ filename: r.filename, reason: r.reason }));

        // ---- Parallel direct uploads (bounded) ----
        const done: Array<{ path: string; filename: string; mimeType: string }> = [];
        let cursor = 0;
        const worker = async () => {
          while (cursor < uploads.length) {
            const u = uploads[cursor++];
            const file = files[u.index];
            const key = keys[u.index];
            try {
              await putToSignedUrl(u.signedUrl, anonKey, file, u.mimeType, (p) => onUploadProgress(key, p));
              onUploadProgress(key, 100);
              done.push({ path: u.path, filename: file.name, mimeType: u.mimeType });
            } catch (err) {
              const isNetwork = (err as { network?: boolean }).network;
              // CORS/network failure on a small file: fall back to the server route.
              if (isNetwork && file.size <= LEGACY_MAX_BYTES) {
                const r = await legacyUpload(caseId, [file], (p) => onUploadProgress(key, p));
                if (r.ok) anySuccess = true;
                else failures.push({ filename: file.name, reason: r.message ?? "Upload failed." });
              } else {
                failures.push({ filename: file.name, reason: "Upload failed. Please try again." });
              }
            }
          }
        };
        await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, uploads.length) }, worker));

        // ---- Register everything that landed in storage (one request) ----
        if (done.length > 0) {
          const reg = await postJson<{ rejected?: RejectedItem[]; error?: string }>(
            `/api/cases/${caseId}/documents/register`,
            { files: done }
          );
          if (reg.ok) {
            anySuccess = true;
            failures.push(...(reg.data.rejected ?? []));
          } else {
            failures.push({ filename: "Upload", reason: reg.data.error ?? "We couldn't finish saving those files." });
          }
        }
      } catch {
        failures.push({ filename: "Upload", reason: "A network error interrupted the upload. Please try again." });
      } finally {
        if (failures.length > 0) {
          toast({
            title: anySuccess ? "Some files were skipped" : "Upload failed",
            description: failures
              .map((f) => (f.filename === "Upload" ? f.reason : `${f.filename}: ${f.reason}`))
              .join(" "),
            variant: "destructive",
          });
        }
        onUploadSettled(anySuccess);
      }
    },
    [caseId, onUploadProgress, onUploadSettled, toast]
  );

  const uploadFiles = useCallback(
    (fileList: FileList | File[]) => {
      const all = Array.from(fileList);
      if (all.length === 0) return;

      // Fail fast on obvious problems before any network call.
      const files = all.filter((f) => f.size > 0 && f.size <= MAX_FILE_BYTES);
      if (files.length < all.length) {
        toast({
          title: "Some files were skipped",
          description: "Empty files and files over 25MB can't be uploaded.",
          variant: "destructive",
        });
      }
      if (files.length === 0) return;

      const stamp = Date.now();
      const tracked: UploadingFile[] = files.map((f, i) => ({
        key: `${f.name}-${f.size}-${stamp}-${i}`,
        filename: f.name,
        percent: 0,
      }));
      onUploadStart(tracked);
      void run(
        files,
        tracked.map((t) => t.key)
      );
    },
    [onUploadStart, run, toast]
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
