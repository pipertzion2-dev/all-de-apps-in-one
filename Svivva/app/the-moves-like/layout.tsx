import type { ReactNode } from "react";

/** Full-viewport dance game shell — keep children unconstrained. */
export default function TheMovesLikeLayout({ children }: { children: ReactNode }) {
  return children;
}
