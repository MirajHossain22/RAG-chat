"use client";

import { ArrowRight, Leaf, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string | undefined>(initialError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (signInError) throw signInError;
      setMessage("Check your inbox for a secure sign-in link.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The sign-in link could not be sent.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)] px-5 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-7 shadow-[0_24px_80px_rgba(31,38,31,0.10)] sm:p-9">
        <span className="mb-7 grid size-11 place-items-center rounded-2xl bg-[var(--accent)] text-white dark:text-[#142219]">
          <Leaf className="size-5" strokeWidth={2.4} />
        </span>
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          Private document workspace
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-[-0.025em]">
          Sign in to Context
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Enter your email and we will send a one-time magic link. No password
          is required.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-3">
          <label className="block text-xs font-semibold" htmlFor="email">
            Email address
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 focus-within:border-[var(--accent)]">
            <Mail className="size-4 shrink-0 text-[var(--muted)]" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || !email.trim()}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#142219]"
          >
            {isSending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {isSending ? "Sending link…" : "Email me a sign-in link"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm leading-5 text-[var(--accent)]" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        )}

        <p className="mt-7 flex items-start gap-2 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--muted)]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
          Your documents are isolated by your authenticated Supabase account.
        </p>
      </section>
    </main>
  );
}
