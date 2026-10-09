import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { buildObjectPath, createSignedUploadTarget } from "@/lib/storage/supabase";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  MAX_FILES_PER_REQUEST,
  resolveMimeType,
} from "@/lib/documents/upload-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface SignRequestFile {
  filename: string;
  mimeType?: string;
  sizeBytes: number;
}

/**
 * Step 1 of direct-to-storage upload: returns one signed upload URL per file.
 * The browser then PUTs each file straight to Supabase (parallel, real
 * per-file progress, no Vercel body-size cap), and calls /register.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return NextResponse.json({ error: "We couldn't find that case." }, { status: 404 });

    const body = await req.json().catch(() => null);
    const files: SignRequestFile[] = Array.isArray(body?.files) ? body.files : [];
    if (files.length === 0 || files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Upload between 1 and ${MAX_FILES_PER_REQUEST} files at a time.` },
        { status: 400 }
      );
    }

    // Direct upload needs the (public) anon key in the browser. If it isn't
    // configured, tell the client to use the legacy server-side upload.
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!anonKey) return NextResponse.json({ direct: false });

    const uploads: Array<{ index: number; path: string; signedUrl: string; mimeType: string }> = [];
    const rejected: Array<{ index: number; filename: string; reason: string }> = [];

    await Promise.all(
      files.map(async (f, index) => {
        const filename = typeof f?.filename === "string" ? f.filename : "";
        const mimeType = resolveMimeType(filename, f?.mimeType ?? "");
        if (!filename || !ALLOWED_MIME_TYPES.has(mimeType)) {
          rejected.push({ index, filename, reason: "Unsupported file type." });
          return;
        }
        if (!Number.isFinite(f.sizeBytes) || f.sizeBytes <= 0 || f.sizeBytes > MAX_FILE_BYTES) {
          rejected.push({ index, filename, reason: "File is larger than the 25MB limit." });
          return;
        }
        try {
          const path = buildObjectPath(String(owner._id), params.id, filename);
          const target = await createSignedUploadTarget(path);
          uploads.push({ index, path, signedUrl: target.signedUrl, mimeType });
        } catch (err) {
          console.error("[documents sign] failed", err);
          rejected.push({ index, filename, reason: "Couldn't prepare the upload. Please try again." });
        }
      })
    );

    return NextResponse.json({ direct: true, anonKey, uploads, rejected });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong on our end. Please try again." }, { status: 500 });
  }
}
