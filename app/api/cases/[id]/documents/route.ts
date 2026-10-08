import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { createDocumentForOwner, listDocumentsForCase } from "@/lib/db/queries/documents";
import { uploadDocumentBuffer, deleteDocumentObject } from "@/lib/storage/supabase";

// Node runtime (Buffer, mongoose, supabase) + room for larger uploads.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  tif: "image/tiff",
  tiff: "image/tiff",
};

const ALLOWED_MIME_TYPES = new Set(Object.values(MIME_BY_EXT).concat("image/jpg"));

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Browsers (esp. on Windows) sometimes send an empty or generic
 * `application/octet-stream` type, which used to get the file rejected.
 * Fall back to the extension.
 */
function resolveMimeType(file: File): string {
  const declared = (file.type || "").toLowerCase();
  if (ALLOWED_MIME_TYPES.has(declared)) return declared;
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  return MIME_BY_EXT[ext] ?? declared;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) {
      return NextResponse.json({ error: "We couldn't find that case." }, { status: 404 });
    }
    const documents = await listDocumentsForCase(owner, params.id);
    return NextResponse.json({ documents });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const owner = await getOwner();
    const caseDoc = await getCaseForOwner(owner, params.id);
    if (!caseDoc) {
      return NextResponse.json({ error: "We couldn't find that case." }, { status: 404 });
    }

    const formData = await req.formData();
    // `instanceof File` is unreliable across runtimes (undefined on older Node);
    // anything that isn't a string field is a file part.
    const files = formData
      .getAll("files")
      .filter((f): f is File => typeof f !== "string" && typeof (f as File).arrayBuffer === "function");

    if (files.length === 0) {
      return NextResponse.json({ error: "No files were included in the upload." }, { status: 400 });
    }

    const created = [];
    const rejected: { filename: string; reason: string }[] = [];

    for (const file of files) {
      const mimeType = resolveMimeType(file);

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        rejected.push({ filename: file.name, reason: "Unsupported file type." });
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push({ filename: file.name, reason: "File is larger than the 25MB limit." });
        continue;
      }

      let storagePath: string | null = null;
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        storagePath = await uploadDocumentBuffer({
          caseId: params.id,
          ownerId: String(owner._id),
          originalFilename: file.name,
          mimeType,
          buffer,
        });

        const doc = await createDocumentForOwner(owner, {
          caseId: params.id,
          originalFilename: file.name,
          mimeType,
          sizeBytes: file.size,
          storageUrl: storagePath,
        });

        created.push(doc);
      } catch (fileErr) {
        // One bad file shouldn't take down the whole batch. Log the real
        // cause (visible in Vercel logs) and report it per-file.
        console.error(`[documents upload] failed for "${file.name}"`, fileErr);
        // Don't leave an orphaned object in storage if the DB write failed.
        if (storagePath && !isStorageError(fileErr)) {
          await deleteDocumentObject(storagePath).catch(() => {});
        }
        rejected.push({ filename: file.name, reason: describeFileError(fileErr) });
      }
    }

    if (created.length === 0) {
      const onlyRejectedForType = rejected.every((r) => r.reason === "Unsupported file type.");
      return NextResponse.json(
        {
          error: onlyRejectedForType
            ? "None of the files could be uploaded."
            : rejected[0]?.reason ?? "None of the files could be uploaded.",
          rejected,
        },
        { status: onlyRejectedForType ? 400 : 500 }
      );
    }

    return NextResponse.json({ documents: created, rejected }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

function isStorageError(err: unknown) {
  return err instanceof Error && /^STORAGE_/.test(err.message);
}

/** Maps internal failures to a message that tells you what to fix, without leaking secrets. */
function describeFileError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("STORAGE_NOT_CONFIGURED"))
    return "File storage isn't configured on the server (missing Supabase env vars).";
  if (msg.startsWith("STORAGE_BUCKET_MISSING"))
    return "The Supabase storage bucket doesn't exist. Create it or fix SUPABASE_BUCKET.";
  if (msg.startsWith("STORAGE_UPLOAD_FAILED"))
    return "File storage rejected the upload. Check the Supabase service-role key and bucket.";
  if (/ValidationError|Cast to ObjectId/i.test(msg)) return "That case or file record was invalid.";
  if (/Mongo|buffering timed out|ECONNREFUSED|ENOTFOUND|ServerSelection/i.test(msg))
    return "The database is unreachable right now. Please try again.";
  return "Something went wrong on our end. Please try again.";
}

function handleError(err: unknown) {
  if (err instanceof Error && err.message === "UNAUTHENTICATED") {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  console.error(err);
  return NextResponse.json(
    { error: "Something went wrong on our end. Please try again." },
    { status: 500 }
  );
}
