import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders user-authored post content as Markdown. Uses react-markdown (no
 * dangerouslySetInnerHTML, so it's XSS-safe) with GFM for tables, lists, and
 * autolinks. Element styling is mapped inline since the project has no
 * Tailwind typography plugin.
 */
export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-6 text-lg leading-8 text-gray-700">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-10 text-3xl font-bold text-gray-900">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-10 text-2xl font-bold text-gray-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {children}
            </h3>
          ),
          p: ({ children }) => <p>{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 underline hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-base text-gray-800">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {children}
            </pre>
          ),
          hr: () => <hr className="border-gray-200" />,
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} className="rounded-xl" />
            ) : null,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
