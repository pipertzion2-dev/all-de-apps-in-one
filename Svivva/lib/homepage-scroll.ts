export function scrollToHomepagePanel(id: "nav-cube" | "home-game" | "home-explore") {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
