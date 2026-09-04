"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, CheckCircle2, ExternalLink, Mic2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import {
  decodeInvitePayload,
  paymentLinkForInvite,
  zelleInstructionsForInvite,
} from "@/lib/zzai-show/share";
import { formatCents } from "@/lib/zzai-show/splits";
import { PAYMENT_METHOD_LABEL } from "@/lib/zzai-show/payments";

export default function ShowInvitePage() {
  const params = useSearchParams();
  const encoded = params.get("d") || "";
  const payload = useMemo(() => decodeInvitePayload(encoded), [encoded]);
  const [markedPaid, setMarkedPaid] = useState(false);

  if (!payload) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <Mic2 className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-bold">Invalid or missing invite</h1>
        <p className="text-muted-foreground text-sm">
          Ask the host to resend your ZZAI ZZAI Show link.
        </p>
        <Button asChild>
          <Link href="/dashboard/zzai-show">Open ZZAI Show</Link>
        </Button>
      </div>
    );
  }

  const payLink = paymentLinkForInvite(payload);
  const zelleText = zelleInstructionsForInvite(payload);

  const handlePay = () => {
    if (payLink) window.open(payLink, "_blank", "noopener,noreferrer");
    setMarkedPaid(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="outline">ZZAI ZZAI Show</Badge>
        <h1 className="text-2xl font-bold">{payload.title}</h1>
        <p className="text-sm text-muted-foreground">
          Hi {payload.guestName} — here&apos;s your event summary and payment.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Event</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1 text-muted-foreground">
          {payload.eventDate && <p>Date: {payload.eventDate}</p>}
          {payload.venue && <p>Venue: {payload.venue}</p>}
          <p>Your share: {formatCents(payload.fairShareCents)}</p>
          <p>Already paid: {formatCents(payload.paidCents)}</p>
          {payload.notes && <p className="pt-2">{payload.notes}</p>}
        </CardContent>
      </Card>

      {payload.transferAmountCents > 0 ? (
        <Card className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
              Pay {payload.payToName}
            </CardTitle>
            <CardDescription>
              {formatCents(payload.transferAmountCents)} via{" "}
              {PAYMENT_METHOD_LABEL[payload.payMethod]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Send to <strong>{payload.payToHandle}</strong> on{" "}
              {PAYMENT_METHOD_LABEL[payload.payMethod]}.
            </p>
            {zelleText && (
              <p className="text-sm rounded-lg bg-muted p-3 font-medium">{zelleText}</p>
            )}
            {payLink ? (
              <Button className="w-full gap-2" onClick={handlePay} data-testid="invite-pay-now">
                <ExternalLink className="w-4 h-4" />
                Pay {formatCents(payload.transferAmountCents)} now
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setMarkedPaid(true)}>
                I sent via Zelle
              </Button>
            )}
            {markedPaid && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Marked as sent — tell {payload.payToName} to
                confirm on their console.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You&apos;re even — no payment needed for this show.
          </CardContent>
        </Card>
      )}

      <Button variant="outline" asChild className="w-full">
        <Link href="/dashboard/zzai-show">Open full ZZAI Show console</Link>
      </Button>
    </div>
  );
}
