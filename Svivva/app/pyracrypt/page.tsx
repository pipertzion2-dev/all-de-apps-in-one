import { redirect } from "next/navigation";

/** Legacy route — security features live in Svivva dashboard. */
export default function PyracryptLegacyPage() {
  redirect("/dashboard/security");
}
