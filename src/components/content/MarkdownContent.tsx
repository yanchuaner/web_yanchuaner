import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";

function safeHref(value?: string) {
  if (!value) return undefined;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : undefined;
  } catch {
    return undefined;
  }
}

function MarkdownLink({ href, children, ...props }: ComponentPropsWithoutRef<"a">) {
  const normalizedHref = safeHref(href);
  if (!normalizedHref) return <span>{children}</span>;
  const external = normalizedHref.startsWith("http");
  return (
    <a
      {...props}
      href={normalizedHref}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="font-medium text-brand underline decoration-brand/35 underline-offset-4 transition hover:decoration-brand"
    >
      {children}
    </a>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      skipHtml
      components={{
        h2: ({ children }) => <h2 className="mb-3 mt-9 font-heading text-xl font-semibold text-main first:mt-0 md:text-2xl">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-7 font-heading text-lg font-semibold text-main">{children}</h3>,
        p: ({ children }) => <p className="my-4 text-sm leading-8 text-main/75 md:text-base">{children}</p>,
        ul: ({ children }) => <ul className="my-5 list-disc space-y-2 pl-6 text-main/75">{children}</ul>,
        ol: ({ children }) => <ol className="my-5 list-decimal space-y-2 pl-6 text-main/75">{children}</ol>,
        li: ({ children }) => <li className="pl-1 text-sm leading-7 md:text-base">{children}</li>,
        blockquote: ({ children }) => <blockquote className="my-6 border-l-2 border-brand/50 bg-brand/5 py-1 pl-4 pr-3 text-main/70">{children}</blockquote>,
        hr: () => <hr className="my-8 border-line" />,
        strong: ({ children }) => <strong className="font-semibold text-main">{children}</strong>,
        a: MarkdownLink,
        img: () => null,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
