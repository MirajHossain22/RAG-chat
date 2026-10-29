import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/request";
import { DOCUMENTS_BUCKET } from "@/lib/supabase/storage";

const paramsSchema = z.object({ id: z.uuid() });

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return Response.json(
      { error: "A valid document ID is required." },
      { status: 400 },
    );
  }

  const auth = await authenticateRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { data: document, error: findError } = await auth.supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (findError) {
    return Response.json(
      { error: "The document could not be accessed." },
      { status: 500 },
    );
  }
  if (!document) {
    return Response.json({ error: "Document not found." }, { status: 404 });
  }

  const admin = getSupabaseAdmin();
  const { error: storageError } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .remove([document.storage_path]);

  if (storageError) {
    console.error("Could not remove document from Storage", storageError);
    return Response.json(
      { error: "The stored PDF could not be deleted." },
      { status: 500 },
    );
  }

  const { error: deleteError } = await auth.supabase
    .from("documents")
    .delete()
    .eq("id", document.id);

  if (deleteError) {
    console.error("Could not delete document record", deleteError);
    return Response.json(
      { error: "The document record could not be deleted." },
      { status: 500 },
    );
  }

  return Response.json({ deleted: true, id: document.id });
}
