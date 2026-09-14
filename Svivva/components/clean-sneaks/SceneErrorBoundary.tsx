"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  failed: boolean;
};

/** Prevents a Three.js scene crash from breaking the whole Clean Sneaks section. */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[CleanSneaks] 3D scene error", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full min-h-[240px] items-center justify-center bg-[#06080c] px-4 text-center text-sm text-muted-foreground">
            3D preview unavailable on this device.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
