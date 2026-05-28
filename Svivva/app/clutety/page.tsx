import { redirect } from "next/navigation";

/** Legacy route — security features live in Svivva dashboard. */
export default function ClutetyLegacyPage() {
  redirect("/dashboard/security");
}
