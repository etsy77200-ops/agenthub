import type { ReactNode } from "react";

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-muted mb-10">Last updated: April 2026</p>
      <div className="prose prose-neutral max-w-none text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-muted [&_p]:leading-relaxed [&_ul]:text-muted [&_li]:my-1">
        {children}
      </div>
    </div>
  );
}
