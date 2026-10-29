"use client";

import {
  ArrowRight,
  FileSearch,
  Leaf,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { CreatorFooter } from "@/components/creator-footer";
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
    <main className="app-backdrop grid min-h-dvh place-items-center px-4 py-6 sm:px-6 lg:px-10">
      <section className="app-shell animate-enter grid w-full max-w-5xl overflow-hidden rounded-[32px] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden min-h-[660px] flex-col justify-between overflow-hidden border-r border-[var(--line)] bg-[var(--panel-muted)] p-10 lg:flex">
          <div className="absolute -top-28 -left-28 size-80 rounded-full bg-[var(--accent-glow)] blur-3xl" />
          <div className="absolute -right-20 -bottom-28 size-72 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[15px] bg-[var(--accent)] text-white shadow-[0_12px_30px_var(--accent-glow)] dark:text-[#07140d]">
              <Leaf className="size-5" strokeWidth={2.4} />
            </span>
            <div>
              <p className="font-semibold tracking-[-0.03em]">Context</p>
              <p className="text-xs text-[var(--muted)]">Document intelligence</p>
            </div>
          </div>

          <div className="relative max-w-md">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-[var(--accent)] uppercase backdrop-blur">
              <Sparkles className="size-3.5" />
              Answers you can verify
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-[3.25rem] leading-[1.02] font-semibold tracking-[-0.055em]">
              Your documents,
              <br /> finally conversational.
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--muted-strong)]">
              Search private PDFs, surface page-level evidence, and turn dense reports into clear, grounded answers.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 backdrop-blur-sm">
              <FileSearch className="mb-3 size-4 text-[var(--accent)]" />
              <p className="text-xs font-semibold">Page-aware retrieval</p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Every claim links back to source evidence.</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 backdrop-blur-sm">
              <ShieldCheck className="mb-3 size-4 text-[var(--accent)]" />
              <p className="text-xs font-semibold">Private by default</p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Your workspace stays isolated and protected.</p>
            </div>
          </div>
        </div>

        <div className="flex min-h-[620px] items-center p-6 sm:p-10 lg:p-12">
          <div className="animate-enter-delayed mx-auto w-full max-w-sm">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="grid size-10 place-items-center rounded-[14px] bg-[var(--accent)] text-white dark:text-[#07140d]">
                <Leaf className="size-4.5" strokeWidth={2.4} />
              </span>
              <div>
                <p className="font-semibold tracking-[-0.03em]">Context</p>
                <p className="text-xs text-[var(--muted)]">Document intelligence</p>
              </div>
            </div>

            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
              Secure workspace
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.045em] sm:text-[2.65rem]">
              Welcome back.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Enter your email to receive a secure one-time sign-in link. No password required.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-3">
              <label className="block text-xs font-semibold" htmlFor="email">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 transition focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-soft)]">
                <Mail className="size-4 shrink-0 text-[var(--muted)]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="min-h-13 w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                />
              </div>
              <button
                type="submit"
                disabled={isSending || !email.trim()}
                className="button-glow surface-shine group flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[0_14px_34px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 dark:text-[#07140d]"
              >
                {isSending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="icon-drift size-4" />
                )}
                {isSending ? "Sending link…" : "Continue with email"}
              </button>
            </form>

            {message && (
              <p className="animate-enter mt-4 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-sm leading-5 text-[var(--accent)]" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="animate-enter mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-700 dark:text-red-300" role="alert">
                {error}
              </p>
            )}

            <p className="mt-8 flex items-start gap-2.5 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--muted)]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
              Magic-link authentication keeps your document library private to your account.
            </p>
            <div className="mt-5 border-t border-[var(--line)] pt-4">
              <CreatorFooter />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
