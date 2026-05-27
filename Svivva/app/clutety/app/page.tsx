import { redirect } from "next/navigation";

/** Full-screen original Pyracrypt app (static shell) — iOS WebView entry. */
export default function ClutetyAppPage() {
  redirect("/clutety-shell/index.html?skip");
}
