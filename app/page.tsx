import { ChatWorkspace } from "@/components/chat-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AuthenticatedWorkspace() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims || data.claims.is_anonymous) {
    redirect("/login");
  }

  return (
    <ChatWorkspace
      userEmail={
        typeof data.claims.email === "string" ? data.claims.email : undefined
      }
    />
  );
}

function WorkspaceLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)]">
      <div className="text-center">
        <span className="mx-auto block size-7 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
        <p className="mt-3 text-sm text-[var(--muted)]">Opening your workspace…</p>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <AuthenticatedWorkspace />
    </Suspense>
  );
}
