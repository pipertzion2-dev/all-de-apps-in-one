import { redirect } from "next/navigation";

/** Legacy path — do not advertise; send visitors to the homepage. */
export default function TheMovesLikePage() {
  redirect("/");
}
