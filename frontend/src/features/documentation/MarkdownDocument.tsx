import { DocumentationCode } from "./DocumentationCode";
import { isValidElement, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const headingId = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const nodeText = (children: ReactNode): string =>
  Array.isArray(children)
    ? children.map(nodeText).join("")
    : isValidElement<{ children?: ReactNode }>(children)
      ? nodeText(children.props.children)
      : String(children ?? "");

const documentationLink = (href: string | undefined) => {
  if (!href?.includes(".md")) return undefined;
  const filename = href.split("/").pop();
  const id = filename?.replace(/\.md(?:#.*)?$/, "");
  const fragment = href.includes("#") ? `#${href.split("#").slice(1).join("#")}` : "";
  return id && /^\d{2}-[a-z0-9-]+$/.test(id) ? `/docs/${id}${fragment}` : undefined;
};

export function MarkdownDocument({ content }: { content: string }) {
  return (
    <article className="min-w-0 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className="mb-5 mt-1 scroll-mt-24 text-2xl font-black text-slate-950 sm:text-3xl"
              id={headingId(nodeText(children))}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="mb-3 mt-8 scroll-mt-24 border-b border-slate-200 pb-2 text-xl font-black text-slate-900 sm:mt-9 sm:text-2xl"
              id={headingId(nodeText(children))}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="mb-2 mt-7 scroll-mt-24 text-xl font-bold text-slate-900"
              id={headingId(nodeText(children))}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-4 leading-7">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-4 list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 list-decimal space-y-2 pl-6">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 rounded-r-xl border-l-4 border-indigo-500 bg-indigo-50 px-5 py-1 text-indigo-950">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            const internal = documentationLink(href);
            return internal ? (
              <Link
                className="font-semibold text-indigo-700 underline"
                to={internal}
              >
                {children}
              </Link>
            ) : (
              <a
                className="font-semibold text-indigo-700 underline"
                href={href}
                rel="noreferrer"
                target={href?.startsWith("http") ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
          pre: ({ children }) => (
            <DocumentationCode className="my-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100 sm:p-5 sm:text-sm">
              {children}
            </DocumentationCode>
          ),
          code: ({ children, className }) =>
            className ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-semibold text-slate-800">
                {children}
              </code>
            ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-slate-800">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-200 px-4 py-3 font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-100 px-4 py-3 align-top">
              {children}
            </td>
          ),
          hr: () => <hr className="my-8 border-slate-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
