import type { CSSProperties, ReactNode } from "react";
import type { RothcoTheme } from "../data/toolsRegistry";

type Props = {
  theme: RothcoTheme;
  children: ReactNode;
};

export function ThemedShell({ theme, children }: Props) {
  return (
    <div
      style={
        {
          ["--tool-primary" as string]: theme.primary,
          ["--tool-accent" as string]: theme.accent,
          ["--tool-surface" as string]: theme.surface,
          ["--tool-ink" as string]: theme.ink,
          minHeight: "100vh",
          padding: "1.5rem clamp(1rem, 4vw, 2.25rem) 3rem",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
