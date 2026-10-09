import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { registerUploadedDocuments } from "@/lib/db/queries/documents";
import { deleteDocumentObject, getObjectInfo, isOwnedObjectPath } from "@/lib/storage/supabase";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  MAX_FILES_PER_REQUEST,
  resolveMimeType,
} from "@/lib/documents/upload-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface RegisterFile {
  path: string;
  filename: string;
  mimeType?: string;
}

/**
 * Step 2 of direct-to-storage upload. The client only tells us WHERE it put
 * each file; we never trust its size/ownership claims — the path must belong
 * to this owner+case, the object must exist, and size comes from storage.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) return NextResponse.json({ error: "We couldn't find that case." }, { status: 404 });

    const body = await req.json().catch(() => null);
    const files: RegisterFile[] = Array.isArray(body?.files) ? body.files : [];
    if (files.length === 0 || files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({ error: "No uploaded files to register." }, { status: 400 });
    }

    const ownerId = String(owner._id);
    const rejected: Array<{ filename: string; reason: string }> = [];
    const valid: Array<{ path: string; filename: string; mimeType: string; sizeBytes: number }> = [];

    await Promise.all(
      files.map(async (f) => {
        const filename = typeof f?.filename === "string" ? f.filename : "file";
        if (typeof f?.path !== "string" || !isOwnedObjectPath(f.path, ownerId, params.id)) {
          rejected.push({ filename, reason: "Invalid upload reference." });
          return;
        }
        const mimeType = resolveMimeType(filename, f.mimeType ?? "");
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          await deleteDocumentObject(f.path).catch(() => {});
          rejected.push({ filename, reason: "Unsupported file type." });
          return;
        }
        const info = await getObjectInfo(f.path).catch(() => null);
        if (!info || info.size <= 0) {
          rejected.push({ filename, reason: "The upload didn't complete. Please try again." });
          return;
        }
        if (info.size > MAX_FILE_BYTES) {
          await deleteDocumentObject(f.path).catch(() => {});
          rejected.push({ filename, reason: "File is larger than the 25MB limit." });
          return;
        }
        valid.push({ path: f.path, filename, mimeType, sizeBytes: info.size });
      })
    );

    if (valid.length === 0) {
      return NextResponse.json(
        { error: rejected[0]?.reason ?? "None of the files could be registered.", rejected },
        { status: 400 }
      );
    }

    const documents = await registerUploadedDocuments(owner, params.id, valid);
    return NextResponse.json({ documents, rejected }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong on our end. Please try again." }, { status: 500 });
  }
}
