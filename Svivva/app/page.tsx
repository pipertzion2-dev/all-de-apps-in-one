import { permanentRedirect } from "next/navigation";
import { CANONICAL_HOME_PATH } from "@/lib/homepage-path";

/** Apex `/` permanently forwards to the “Rest assured” homepage URL. */
export default function RootRedirectPage() {
  permanentRedirect(CANONICAL_HOME_PATH);
}
