/** Native link navigation — reliable for OAuth on iOS Safari (avoid window.location.assign). */
export function followOAuthLink(url: string): void {
  if (typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
