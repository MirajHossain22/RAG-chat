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
    <main className="app-backdrop grid min-h-dvh place-items-center px-5">
      <div className="app-shell animate-enter rounded-[24px] px-8 py-7 text-center">
        <span className="relative mx-auto flex size-10 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-15" />
          <span className="block size-7 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--accent)]" />
        </span>
        <p className="mt-4 text-sm font-medium">Opening your workspace</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Connecting your private document library…</p>
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
