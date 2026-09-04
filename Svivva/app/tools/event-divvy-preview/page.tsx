"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Mic2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { computeDivvy, formatCents, parseDollarsToCents } from "@/lib/zzai-show/splits";
import type { ShowAttendee } from "@/lib/zzai-show/types";

const APP = getFeatureMiniApp("event-divvy-preview")!;

type GuestRow = { id: string; name: string; paid: string; checkedIn: boolean };

function rowId() {
  return `g_${Math.random().toString(36).slice(2, 8)}`;
}

export default function EventDivvyPreviewPage() {
  const [cost, setCost] = useState("120");
  const [guests, setGuests] = useState<GuestRow[]>([
    { id: rowId(), name: "Alex", paid: "120", checkedIn: true },
    { id: rowId(), name: "Blake", paid: "0", checkedIn: true },
    { id: rowId(), name: "Casey", paid: "0", checkedIn: true },
  ]);

  const divvy = useMemo(() => {
    const totalCostCents = parseDollarsToCents(cost);
    const attendees: ShowAttendee[] = guests
      .filter((g) => g.name.trim())
      .map((g) => ({
        id: g.id,
        name: g.name.trim(),
        paidCents: parseDollarsToCents(g.paid),
        checkedIn: g.checkedIn,
        settlementStatus: "pending" as const,
      }));
    if (attendees.length === 0 || totalCostCents <= 0) return null;
    return computeDivvy(attendees, totalCostCents);
  }, [cost, guests]);

  return (
    <MiniAppShell app={APP} nextLabel="ZZAI ZZAI Show">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Total cost ($)"
            inputMode="decimal"
            className="sm:w-40"
            data-testid="input-event-cost"
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              setGuests((g) => [...g, { id: rowId(), name: "", paid: "0", checkedIn: true }])
            }
          >
            <Plus className="w-4 h-4" /> Add guest
          </Button>
        </div>

        <div className="space-y-2">
          {guests.map((g) => (
            <div key={g.id} className="flex flex-wrap gap-2 items-center rounded-xl border p-3">
              <input
                type="checkbox"
                checked={g.checkedIn}
                onChange={(e) =>
                  setGuests((rows) =>
                    rows.map((r) => (r.id === g.id ? { ...r, checkedIn: e.target.checked } : r)),
                  )
                }
                aria-label="Checked in"
              />
              <Input
                value={g.name}
                onChange={(e) =>
                  setGuests((rows) =>
                    rows.map((r) => (r.id === g.id ? { ...r, name: e.target.value } : r)),
                  )
                }
                placeholder="Name"
                className="flex-1 min-w-[100px]"
              />
              <Input
                value={g.paid}
                onChange={(e) =>
                  setGuests((rows) =>
                    rows.map((r) => (r.id === g.id ? { ...r, paid: e.target.value } : r)),
                  )
                }
                placeholder="Paid ($)"
                inputMode="decimal"
                className="w-28"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setGuests((rows) => rows.filter((r) => r.id !== g.id))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {divvy && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mic2 className="w-4 h-4 text-[#5B8DA8]" />
              {divvy.checkedInCount} checked in · {formatCents(divvy.fairShareCents)} each
            </div>
            {divvy.balances.map((b) => (
              <div
                key={b.attendeeId}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium">{b.name}</span>
                {b.role === "receive" && (
                  <Badge className="gap-1 bg-green-600/90">
                    <ArrowDownLeft className="w-3 h-3" /> Receive {formatCents(b.netCents)}
                  </Badge>
                )}
                {b.role === "give" && (
                  <Badge variant="destructive" className="gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Give {formatCents(-b.netCents)}
                  </Badge>
                )}
                {b.role === "even" && <Badge variant="secondary">Even</Badge>}
              </div>
            ))}
            {divvy.transfers.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Clean divvy
                </p>
                {divvy.transfers.map((t, i) => (
                  <p key={i} className="text-sm">
                    {t.fromName} → {t.toName}: <strong>{formatCents(t.amountCents)}</strong>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MiniAppShell>
  );
}
