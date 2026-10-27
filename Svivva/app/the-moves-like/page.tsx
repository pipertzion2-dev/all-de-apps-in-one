import { redirect } from "next/navigation";

/** The Moves Like lives in Play — keep this path as a stable alias. */
export default function TheMovesLikePage() {
  redirect("/play");
}
