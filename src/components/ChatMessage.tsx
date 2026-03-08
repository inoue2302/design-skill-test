"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { MessageRole } from "@/types";

type ChatMessageProps = {
  role: MessageRole;
  content: string;
};

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
          EM
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isAssistant
            ? "bg-surface border border-border text-text"
            : "bg-primary text-white"
        )}
      >
        {isAssistant ? (
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                return isBlock ? (
                  <pre className="my-2 overflow-x-auto rounded-lg bg-background p-3">
                    <code className="text-xs font-mono">{children}</code>
                  </pre>
                ) : (
                  <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-primary">
                    {children}
                  </code>
                );
              },
              ul: ({ children }) => (
                <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
            }}
          >
            {content}
          </Markdown>
        ) : (
          <p>{content}</p>
        )}
      </div>

      {!isAssistant && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-white text-xs font-bold">
          You
        </div>
      )}
    </div>
  );
}
