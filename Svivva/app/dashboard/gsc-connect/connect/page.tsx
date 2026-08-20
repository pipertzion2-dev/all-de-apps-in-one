import { redirect } from "next/navigation";
import { GscOAuthBridge } from "@/components/gsc-oauth-bridge";
import { prepareGscOAuthStart, gscOAuthErrorRedirectPath } from "@/lib/gsc-oauth-prepare";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ return?: string; email?: string }>;
};

/** Real HTML page for OAuth — iOS Safari downloads route-handler/API paths as files. */
export default async function GscGoogleConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const returnTo = params.return || "/dashboard/gsc-connect";
  try {
    const result = await prepareGscOAuthStart({
      returnTo,
      email: params.email,
    });

    if (!result.ok) {
      redirect(result.redirectPath);
    }

    return <GscOAuthBridge googleUrl={result.googleUrl} />;
  } catch (e) {
    console.error("[gsc-connect/page]", e);
    redirect(gscOAuthErrorRedirectPath(returnTo, "oauth_start_failed"));
  }
}
