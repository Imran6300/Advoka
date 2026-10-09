import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? "documents";

/**
 * Server-only client using the service role key. This module must never be
 * imported from a "use client" file — the key would end up in the browser
 * bundle. Every route that touches storage goes through the helpers below,
 * never the raw client.
 */
function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "STORAGE_NOT_CONFIGURED: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in this environment (Vercel -> Settings -> Environment Variables, then redeploy)."
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Uploads a buffer to Supabase Storage using the service key server-side —
 * the client never talks to Supabase directly or sees this key. Path is
 * namespaced by case so a lawyer's files live under a predictable prefix.
 */
/** Builds a safe, namespaced object key: <ownerId>/<caseId>/<uuid>.<ext> */
export function buildObjectPath(ownerId: string, caseId: string, originalFilename: string): string {
  // Only keep a short, safe extension (spaces/unicode/symbols break object keys).
  const rawExt = originalFilename.includes(".") ? (originalFilename.split(".").pop() ?? "") : "";
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  return `${ownerId}/${caseId}/${randomUUID()}.${ext}`;
}

/** True only for keys produced by buildObjectPath for THIS owner and case. */
export function isOwnedObjectPath(path: string, ownerId: string, caseId: string): boolean {
  const re = /^[0-9a-f]{24}\/[0-9a-f]{24}\/[0-9a-f-]{36}\.[a-z0-9]{1,8}$/;
  return re.test(path) && path.startsWith(`${ownerId}/${caseId}/`);
}

/**
 * Signed upload URL so the browser uploads straight to Supabase Storage —
 * skipping the Vercel function entirely (no 4.5MB request-body cap, no
 * double hop, parallel uploads).
 */
export async function createSignedUploadTarget(path: string): Promise<{ signedUrl: string; token: string; path: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    const msg = error?.message ?? "";
    if (/bucket not found/i.test(msg)) {
      throw new Error(`STORAGE_BUCKET_MISSING: bucket "${SUPABASE_BUCKET}" does not exist in Supabase.`);
    }
    throw new Error(`STORAGE_UPLOAD_FAILED: ${msg || "could not create signed upload URL"}`);
  }
  return data;
}

/** Server-trusted size of an uploaded object, or null if it doesn't exist. */
export async function getObjectInfo(path: string): Promise<{ size: number } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).info(path);
  if (error || !data) return null;
  return { size: typeof data.size === "number" ? data.size : 0 };
}

/**
 * Uploads a buffer to Supabase Storage using the service key server-side.
 * Kept as the fallback path for small files when direct upload isn't configured.
 */
export async function uploadDocumentBuffer(params: {
  caseId: string;
  ownerId: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<string> {
  const supabase = getSupabaseAdmin();
  const path = buildObjectPath(params.ownerId, params.caseId, params.originalFilename);

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, params.buffer, {
    contentType: params.mimeType,
    upsert: false,
  });

  if (error) {
    const msg = error.message ?? "";
    if (/bucket not found/i.test(msg)) {
      throw new Error(
        `STORAGE_BUCKET_MISSING: bucket "${SUPABASE_BUCKET}" does not exist in Supabase. Create it (Storage -> New bucket) or fix SUPABASE_BUCKET.`
      );
    }
    throw new Error(`STORAGE_UPLOAD_FAILED: ${msg}`);
  }

  return path;
}

export async function downloadDocumentBuffer(storagePath: string): Promise<Buffer> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(storagePath);

  if (error || !data) {
    throw new Error(`Supabase download failed: ${error?.message ?? "no data returned"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteDocumentObject(storagePath: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(SUPABASE_BUCKET).remove([storagePath]);
}
