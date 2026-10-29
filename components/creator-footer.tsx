import { ArrowUpRight, GitBranch, Mail } from "lucide-react";

export function CreatorFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-[var(--muted)] ${
        compact ? "sm:justify-end" : ""
      }`}
    >
      <span>
        Crafted by <span className="font-semibold text-[var(--muted-strong)]">Miraj Hossain</span>
      </span>
      <span className="hidden size-1 rounded-full bg-[var(--line-strong)] sm:block" />
      <a
        href="https://github.com/MirajHossain22"
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-1 transition hover:text-[var(--accent)]"
      >
        <GitBranch className="size-3" />
        GitHub
        <ArrowUpRight className="icon-drift size-2.5" />
      </a>
      <a
        href="mailto:mirajh417@gmail.com"
        className="inline-flex items-center gap-1 transition hover:text-[var(--accent)]"
      >
        <Mail className="size-3" />
        mirajh417@gmail.com
      </a>
    </footer>
  );
}
