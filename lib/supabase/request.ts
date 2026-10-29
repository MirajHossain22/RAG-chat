import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const authorizationSchema = z
  .string()
  .regex(/^Bearer\s+\S+$/i, "A Bearer access token is required.");

export async function authenticateRequest(request: Request) {
  const parsedHeader = authorizationSchema.safeParse(
    request.headers.get("authorization"),
  );

  if (!parsedHeader.success) {
    return { error: "Authentication is required." as const, status: 401 as const };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      error: "Supabase authentication is not configured." as const,
      status: 503 as const,
    };
  }

  const accessToken = parsedHeader.data.replace(/^Bearer\s+/i, "");
  const supabase = createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return { error: "Your session is invalid or expired." as const, status: 401 as const };
  }

  return { user, supabase, accessToken };
}
