import { redirect } from "next/navigation";
import { PRODUCT_PROTECTION_PATH } from "@/lib/product-positioning";

/** Legacy dashboard path — canonical URL is /poor-man-protection. */
export default function PoorManProtectionDashboardRedirect() {
  redirect(PRODUCT_PROTECTION_PATH);
}
