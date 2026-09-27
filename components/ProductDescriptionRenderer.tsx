"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface ProductDescriptionRendererProps {
  content?: string | null;
  isCompact?: boolean;
  className?: string;
}

/**
 * Preprocesses raw text copied from ChatGPT, rich text editors, or typed manually:
 * - Normalizes Windows CRLF to LF
 * - Converts unicode bullet points (•, ●, etc.) to standard markdown list items
 * - Ensures space after markdown headings (#)
 * - Converts common HTML tags if rich text was pasted
 * - Preserves spacing, commas, punctuation, and all line breaks
 */
export function preprocessProductDescription(text?: string | null): string {
  if (!text || typeof text !== "string") return "";

  return text
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    // Convert unicode bullets at line start to standard markdown dashes
    .replace(/^[ \t]*[•●○◆■▪►✓✔]\s*/gm, "- ")
    // Ensure space after markdown headings (e.g. ###Heading -> ### Heading)
    .replace(/^(#{1,6})([^#\s])/gm, "$1 $2")
    // Convert common HTML tags if rich text / HTML was pasted
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(strong|b)>/gi, "**")
    .replace(/<\/?(em|i)>/gi, "*")
    .replace(/<\/?(p|div)>/gi, "\n\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol)>/gi, "\n")
    .trim();
}

export default function ProductDescriptionRenderer({
  content,
  isCompact = false,
  className = "",
}: ProductDescriptionRendererProps) {
  const processed = useMemo(
    () => preprocessProductDescription(content),
    [content],
  );

  if (!processed) return null;

  return (
    <div
      className={`product-description-renderer font-sans text-neutral-700 leading-relaxed ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight mt-4 mb-2 first:mt-0 font-serif"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-base md:text-lg font-bold text-neutral-900 tracking-tight mt-3.5 mb-1.5 first:mt-0 font-serif"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-sm md:text-base font-semibold text-neutral-900 tracking-tight mt-3 mb-1 first:mt-0"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-xs md:text-sm font-semibold text-neutral-900 mt-2 mb-1 first:mt-0"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className={`${
                isCompact
                  ? "my-1 text-xs md:text-sm leading-relaxed"
                  : "my-2 text-xs md:text-sm leading-relaxed text-neutral-700"
              } break-words`}
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-neutral-950" {...props} />
          ),
          b: ({ node, ...props }) => (
            <b className="font-bold text-neutral-950" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-neutral-800" {...props} />
          ),
          i: ({ node, ...props }) => (
            <i className="italic text-neutral-800" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc pl-5 my-2 space-y-1.5 marker:text-rose-500 text-xs md:text-sm"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal pl-5 my-2 space-y-1.5 marker:font-semibold marker:text-neutral-700 text-xs md:text-sm"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed text-neutral-700" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-rose-400 bg-rose-50/50 pl-3.5 pr-3 py-2 my-2.5 rounded-r-lg italic text-neutral-700 text-xs md:text-sm"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-rose-600 underline font-medium hover:text-rose-700"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="border-t border-neutral-200 my-3" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table
                className="w-full text-xs text-left border-collapse border border-neutral-200"
                {...props}
              />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="bg-neutral-50 border border-neutral-200 px-3 py-1.5 font-bold text-neutral-800"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-neutral-200 px-3 py-1.5 text-neutral-700"
              {...props}
            />
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
