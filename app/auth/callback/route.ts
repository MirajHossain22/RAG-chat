import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const callbackSchema = z.object({
  code: z.string().min(1),
  sb_flow_id: z.string().min(1).optional(),
  next: z
    .string()
    .refine((value) => value.startsWith("/") && !value.startsWith("//"))
    .optional(),
});

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const parsed = callbackSchema.safeParse(
    Object.fromEntries(requestUrl.searchParams),
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!parsed.success || !url || !anonKey) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_callback", requestUrl.origin),
    );
  }

  const response = NextResponse.redirect(
    new URL(parsed.data.next ?? "/", requestUrl.origin),
  );
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(cacheHeaders).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(
    parsed.data.code,
    parsed.data.sb_flow_id ? { flowId: parsed.data.sb_flow_id } : undefined,
  );

  if (error) {
    console.error("Auth code exchange failed", error);
    return NextResponse.redirect(
      new URL("/login?error=expired_link", requestUrl.origin),
    );
  }

  return response;
}
