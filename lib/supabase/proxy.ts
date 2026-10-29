import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function copySessionResponse(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(cacheHeaders).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims && !data.claims.is_anonymous && !error);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isSignedIn && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return copySessionResponse(response, NextResponse.redirect(loginUrl));
  }

  if (isSignedIn && isLoginPage) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.search = "";
    return copySessionResponse(response, NextResponse.redirect(appUrl));
  }

  return response;
}
