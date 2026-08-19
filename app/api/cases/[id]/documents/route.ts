import { NextRequest, NextResponse } from "next/server";
import { getOwner } from "@/lib/auth/getOwner";
import { getCaseForOwner } from "@/lib/db/queries/cases";
import { createDocumentForOwner, listDocumentsForCase } from "@/lib/db/queries/documents";
import { uploadDocumentBuffer } from "@/lib/storage/supabase";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/tiff",
]);

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

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
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files were included in the upload." }, { status: 400 });
    }

    const created = [];
    const rejected: { filename: string; reason: string }[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        rejected.push({ filename: file.name, reason: "Unsupported file type." });
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push({ filename: file.name, reason: "File is larger than the 25MB limit." });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const storagePath = await uploadDocumentBuffer({
        caseId: params.id,
        ownerId: String(owner._id),
        originalFilename: file.name,
        mimeType: file.type,
        buffer,
      });

      const doc = await createDocumentForOwner(owner, {
        caseId: params.id,
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageUrl: storagePath,
      });

      created.push(doc);
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: "None of the files could be uploaded.", rejected },
        { status: 400 }
      );
    }

    return NextResponse.json({ documents: created, rejected }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
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
