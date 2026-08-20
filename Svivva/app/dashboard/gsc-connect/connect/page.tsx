import { redirect } from "next/navigation";
import { GscOAuthBridge } from "@/components/gsc-oauth-bridge";
import { prepareGscOAuthStart } from "@/lib/gsc-oauth-prepare";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ return?: string; email?: string }>;
};

/** Real HTML page for OAuth — iOS Safari downloads route-handler/API paths as files. */
export default async function GscGoogleConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await prepareGscOAuthStart({
    returnTo: params.return || "/dashboard/gsc-connect",
    email: params.email,
  });

  if (!result.ok) {
    redirect(result.redirectPath);
  }

  return <GscOAuthBridge googleUrl={result.googleUrl} />;
}
