import { redirect } from "next/navigation";

/** Legacy dashboard path — canonical URL lives under /poor-man-protection. */
export default function DashboardInventionStudioRedirect() {
  redirect("/poor-man-protection/invention-studio");
}
