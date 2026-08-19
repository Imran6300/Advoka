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
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Add them to your .env.local (see .env.example)."
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
export async function uploadDocumentBuffer(params: {
  caseId: string;
  ownerId: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<string> {
  const supabase = getSupabaseAdmin();
  const ext = params.originalFilename.split(".").pop() ?? "bin";
  const path = `${params.ownerId}/${params.caseId}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, params.buffer, {
    contentType: params.mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
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
