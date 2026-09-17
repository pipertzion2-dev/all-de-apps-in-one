"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  placeholder: ReactNode;
  rootMargin?: string;
};

/** Mount heavy Klean Sneaks UI only when the section nears the viewport. */
export function CleanSneaksLazyMount({ children, placeholder, rootMargin = "320px" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div ref={hostRef}>{visible ? children : placeholder}</div>;
}
