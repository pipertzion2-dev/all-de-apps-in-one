import { redirect } from "next/navigation";

/** Legacy — public security tools live at /cyber-security-mini-apps */
export default function ClutetyLegacyPage() {
  redirect("/cyber-security-mini-apps");
}
