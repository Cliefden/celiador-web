"use client";

import { useEffect, useRef, useState } from "react";

type Section = { id: string; title: string };

export function DocsSearch({ sections }: { sections: Section[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere on the page to jump to the search field, unless the
  // user is already typing somewhere (input, textarea, contenteditable).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? sections.filter((s) => s.title.toLowerCase().includes(q))
    : sections;

  return (
    <div className="mt-8">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs"
          aria-label="Search docs"
          className="w-full rounded-lg border border-line bg-white/[0.02] py-2.5 pl-3.5 pr-12 text-sm text-white placeholder:text-fog-dim focus:border-brand focus:outline-none"
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-fog-dim"
        >
          /
        </kbd>
      </div>

      <nav className="mt-4 flex flex-wrap gap-2">
        {matches.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-line bg-white/[0.02] px-3 py-1 text-xs text-fog hover:text-white"
          >
            {s.title}
          </a>
        ))}
        {matches.length === 0 && (
          <p className="text-xs text-fog-dim">No sections match &ldquo;{query}&rdquo;.</p>
        )}
      </nav>
    </div>
  );
}
