import { getScientificCatalog } from "@/lib/hybridization/scientific-catalog";
import { ok } from "@/lib/http-response";

export const dynamic = "force-dynamic";

/** Public read of the full hybridization scientific protocol (not saved blends). */
export async function GET() {
  return ok(getScientificCatalog());
}
