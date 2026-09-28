import { permanentRedirect } from "next/navigation";

/** Legacy path — homepage stays at `/`; “Rest assured” is the tagline, not the URL. */
export default function RestAssuredLegacyRedirect() {
  permanentRedirect("/");
}
