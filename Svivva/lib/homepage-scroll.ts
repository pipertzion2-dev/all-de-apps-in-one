export type HomepageScrollPanelId = "nav-cube" | "home-game" | "home-explore";

export function scrollToHomepagePanel(id: HomepageScrollPanelId) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
