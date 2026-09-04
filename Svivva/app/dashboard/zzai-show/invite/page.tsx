import { Suspense } from "react";
import ShowInvitePage from "./invite-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading invite…
        </div>
      }
    >
      <ShowInvitePage />
    </Suspense>
  );
}
