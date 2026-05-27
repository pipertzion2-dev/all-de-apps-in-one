import { redirect } from "next/navigation";

/** Legacy embed path → original Pyracrypt static bundle. */
export default function ClutetyEmbedPage() {
  redirect("/clutety-shell/index.html?skip");
}
