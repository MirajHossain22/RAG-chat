import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const confirmationSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum([
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email",
  ]),
  next: z
    .string()
    .refine((value) => value.startsWith("/") && !value.startsWith("//"))
    .optional(),
});

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const parsed = confirmationSchema.safeParse(
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

  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token_hash,
    type: parsed.data.type as EmailOtpType,
  });

  if (error) {
    console.error("Email token verification failed", error);
    return NextResponse.redirect(
      new URL("/login?error=expired_link", requestUrl.origin),
    );
  }

  return response;
}
