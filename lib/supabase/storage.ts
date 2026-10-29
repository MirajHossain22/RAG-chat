import "server-only";

import { ragConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const DOCUMENTS_BUCKET = "documents";

let bucketPromise: Promise<void> | undefined;

export function ensureDocumentsBucket() {
  bucketPromise ??= createDocumentsBucketIfNeeded();
  return bucketPromise;
}

async function createDocumentsBucketIfNeeded() {
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage.getBucket(DOCUMENTS_BUCKET);

  if (data) return;

  const { error } = await admin.storage.createBucket(DOCUMENTS_BUCKET, {
    public: false,
    fileSizeLimit: ragConfig.ingestion.maxUploadBytes,
    allowedMimeTypes: ["application/pdf"],
  });

  if (error && !/already exists/i.test(error.message)) {
    bucketPromise = undefined;
    throw new Error(`Could not create the private documents bucket: ${error.message}`);
  }
}
