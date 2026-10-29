import { z } from "zod";

import { authenticateRequest } from "@/lib/supabase/request";

const querySchema = z.object({}).strict();

export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(query);

  if (!parsed.success) {
    return Response.json(
      { error: "This endpoint does not accept query parameters." },
      { status: 400 },
    );
  }

  const auth = await authenticateRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.supabase
    .from("documents")
    .select("id, file_name, page_count, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load documents", error);
    return Response.json(
      { error: "Your documents could not be loaded." },
      { status: 500 },
    );
  }

  return Response.json({ documents: data });
}
