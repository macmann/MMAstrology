import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="chat-markdown min-w-0 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl border border-white/15">
              <table>{children}</table>
            </div>
          ),
          // Keep responses self-contained without loading remote images.
          img: ({ alt }) => <span className="italic">{alt}</span>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
