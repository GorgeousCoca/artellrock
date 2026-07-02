import Link from "next/link";

import type { ReactNode } from "react";

const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)]+)\)/g;

function isSafeInternalPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

export function renderFaqAnswer(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    const [full, label, path] = match;
    const index = match.index;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    if (isSafeInternalPath(path)) {
      nodes.push(
        <Link key={`faq-link-${key++}`} href={path}>
          {label}
        </Link>
      );
    } else {
      nodes.push(full);
    }

    lastIndex = index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

export function faqAnswerPlainText(text: string) {
  return text.replace(LINK_PATTERN, "$1").trim();
}
