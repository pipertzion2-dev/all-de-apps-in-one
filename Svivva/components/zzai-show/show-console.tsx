"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Circle,
  DollarSign,
  MapPin,
  Mic2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computeDivvy, formatCents, parseDollarsToCents } from "@/lib/zzai-show/splits";
import { loadShowEvents, newAttendeeId, newEventId, saveShowEvents } from "@/lib/zzai-show/storage";
import type { SettlementStatus, ShowAttendee, ShowEvent } from "@/lib/zzai-show/types";

const STATUS_LABEL: Record<SettlementStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  received: "Received",
  settled: "Settled",
};

function emptyEvent(): ShowEvent {
  const now = new Date().toISOString();
  return {
    id: newEventId(),
    title: "",
    venue: "",
    eventDate: new Date().toISOString().slice(0, 10),
    totalCostCents: 0,
    attendees: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function ZzaiShowConsole() {
  const [events, setEvents] = useState<ShowEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShowEvent | null>(null);
  const [costInput, setCostInput] = useState("");
  const [newName, setNewName] = useState("");
  const [newPaid, setNewPaid] = useState("");

  useEffect(() => {
    const loaded = loadShowEvents();
    setEvents(loaded);
    if (loaded.length > 0) {
      setSelectedId(loaded[0].id);
      setDraft({ ...loaded[0] });
      setCostInput((loaded[0].totalCostCents / 100).toFixed(2));
    }
  }, []);

  const persist = useCallback((next: ShowEvent[]) => {
    setEvents(next);
    saveShowEvents(next);
  }, []);

  const selectEvent = useCallback(
    (id: string) => {
      const ev = events.find((e) => e.id === id);
      if (!ev) return;
      setSelectedId(id);
      setDraft({ ...ev, attendees: ev.attendees.map((a) => ({ ...a })) });
      setCostInput((ev.totalCostCents / 100).toFixed(2));
    },
    [events],
  );

  const updateDraft = useCallback((patch: Partial<ShowEvent>) => {
    setDraft((d) => (d ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d));
  }, []);

  const saveDraft = useCallback(() => {
    if (!draft?.title.trim()) return;
    const saved = { ...draft, title: draft.title.trim() };
    const exists = events.some((e) => e.id === saved.id);
    const next = exists
      ? events.map((e) => (e.id === saved.id ? saved : e))
      : [saved, ...events];
    persist(next);
    setSelectedId(saved.id);
    setDraft({ ...saved });
    return saved;
  }, [draft, events, persist]);

  const saveDraftState = useCallback(
    (nextDraft: ShowEvent) => {
      if (!nextDraft.title.trim()) {
        setDraft(nextDraft);
        return;
      }
      const saved = { ...nextDraft, title: nextDraft.title.trim() };
      const exists = events.some((e) => e.id === saved.id);
      const next = exists
        ? events.map((e) => (e.id === saved.id ? saved : e))
        : [saved, ...events];
      persist(next);
      setSelectedId(saved.id);
      setDraft({ ...saved });
    },
    [events, persist],
  );

  const createEvent = useCallback(() => {
    const ev = emptyEvent();
    ev.title = "New Show";
    persist([ev, ...events]);
    setSelectedId(ev.id);
    setDraft(ev);
    setCostInput("0.00");
  }, [events, persist]);

  const deleteEvent = useCallback(
    (id: string) => {
      const next = events.filter((e) => e.id !== id);
      persist(next);
      if (selectedId === id) {
        const first = next[0];
        if (first) {
          selectEvent(first.id);
        } else {
          setSelectedId(null);
          setDraft(null);
        }
      }
    },
    [events, persist, selectEvent, selectedId],
  );

  const addAttendee = useCallback(() => {
    if (!draft || !newName.trim()) return;
    const attendee: ShowAttendee = {
      id: newAttendeeId(),
      name: newName.trim(),
      paidCents: parseDollarsToCents(newPaid),
      checkedIn: false,
      settlementStatus: "pending",
    };
    const next = {
      ...draft,
      attendees: [...draft.attendees, attendee],
      updatedAt: new Date().toISOString(),
    };
    saveDraftState(next);
    setNewName("");
    setNewPaid("");
  }, [draft, newName, newPaid, saveDraftState]);

  const updateAttendee = useCallback(
    (id: string, patch: Partial<ShowAttendee>) => {
      if (!draft) return;
      const next = {
        ...draft,
        attendees: draft.attendees.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        updatedAt: new Date().toISOString(),
      };
      saveDraftState(next);
    },
    [draft, saveDraftState],
  );

  const removeAttendee = useCallback(
    (id: string) => {
      if (!draft) return;
      const next = {
        ...draft,
        attendees: draft.attendees.filter((a) => a.id !== id),
        updatedAt: new Date().toISOString(),
      };
      saveDraftState(next);
    },
    [draft, saveDraftState],
  );

  const divvy = useMemo(() => {
    if (!draft) return null;
    return computeDivvy(draft.attendees, draft.totalCostCents);
  }, [draft]);

  const handleCostBlur = () => {
    if (!draft) return;
    const cents = parseDollarsToCents(costInput);
    updateDraft({ totalCostCents: cents });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Mic2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ZZAI ZZAI Show</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Track who came to your event and cleanly divvy up costs — see who should give and who
          should receive at a glance.
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your shows</CardTitle>
            <CardDescription>Events &amp; meetups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={createEvent} size="sm" className="w-full gap-2" data-testid="show-create">
              <Plus className="w-4 h-4" /> New show
            </Button>
            <div className="space-y-1 max-h-[320px] overflow-y-auto">
              {events.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No shows yet</p>
              )}
              {events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => selectEvent(ev.id)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    selectedId === ev.id ? "bg-primary/15 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium truncate">{ev.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {ev.attendees.length} · {ev.attendees.filter((a) => a.checkedIn).length} in
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {!draft ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Create a show to start tracking attendance and payments.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">Event details</CardTitle>
                    <CardDescription>Name, date, venue, and total cost</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEvent(draft.id)}
                    aria-label="Delete show"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="show-title">Show title</Label>
                    <Input
                      id="show-title"
                      value={draft.title}
                      onChange={(e) => updateDraft({ title: e.target.value })}
                      placeholder="ZZAI ZZAI Live — March session"
                      data-testid="show-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="show-date">Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="show-date"
                        type="date"
                        className="pl-9"
                        value={draft.eventDate}
                        onChange={(e) => updateDraft({ eventDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="show-venue">Venue</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="show-venue"
                        className="pl-9"
                        value={draft.venue ?? ""}
                        onChange={(e) => updateDraft({ venue: e.target.value })}
                        placeholder="Studio, park, online…"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="show-cost">Total cost ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="show-cost"
                        className="pl-9"
                        inputMode="decimal"
                        value={costInput}
                        onChange={(e) => setCostInput(e.target.value)}
                        onBlur={handleCostBlur}
                        placeholder="0.00"
                        data-testid="show-cost"
                      />
                    </div>
                  </div>
                </div>
                <Textarea
                  value={draft.notes ?? ""}
                  onChange={(e) => updateDraft({ notes: e.target.value })}
                  placeholder="Notes — catering, tickets, merch…"
                  rows={2}
                />
                <Button onClick={saveDraft} data-testid="show-save">
                  Save show
                </Button>
              </CardContent>
            </Card>

            {divvy && (
              <div className="grid sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{divvy.headcount}</div>
                    <div className="text-xs text-muted-foreground">On guest list</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-primary">{divvy.checkedInCount}</div>
                    <div className="text-xs text-muted-foreground">Checked in</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{formatCents(divvy.fairShareCents)}</div>
                    <div className="text-xs text-muted-foreground">Per person share</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Attendance</CardTitle>
                <CardDescription>
                  Add guests and check them in at the door. Split uses checked-in guests when any
                  are marked present.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Guest name"
                    className="sm:flex-1"
                    data-testid="show-add-name"
                  />
                  <Input
                    value={newPaid}
                    onChange={(e) => setNewPaid(e.target.value)}
                    placeholder="Paid upfront ($)"
                    className="sm:w-36"
                    inputMode="decimal"
                  />
                  <Button onClick={addAttendee} className="gap-2 shrink-0" data-testid="show-add-guest">
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>

                {draft.attendees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No guests yet</p>
                ) : (
                  <div className="space-y-2">
                    {draft.attendees.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border p-3 bg-card"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateAttendee(a.id, {
                              checkedIn: !a.checkedIn,
                              checkedInAt: !a.checkedIn ? new Date().toISOString() : undefined,
                            })
                          }
                          className="shrink-0"
                          aria-label={a.checkedIn ? "Mark absent" : "Check in"}
                        >
                          {a.checkedIn ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <span className="font-medium min-w-[80px] flex-1">{a.name}</span>
                        <Input
                          className="w-28 h-8 text-sm"
                          inputMode="decimal"
                          defaultValue={(a.paidCents / 100).toFixed(2)}
                          onBlur={(e) =>
                            updateAttendee(a.id, { paidCents: parseDollarsToCents(e.target.value) })
                          }
                          aria-label={`${a.name} paid amount`}
                        />
                        <select
                          className="h-8 rounded-md border bg-background px-2 text-xs"
                          value={a.settlementStatus}
                          onChange={(e) =>
                            updateAttendee(a.id, {
                              settlementStatus: e.target.value as SettlementStatus,
                            })
                          }
                        >
                          {(Object.keys(STATUS_LABEL) as SettlementStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeAttendee(a.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {divvy && divvy.balances.length > 0 && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Give / receive balances</CardTitle>
                    <CardDescription>
                      Total {formatCents(divvy.totalCostCents)} split across{" "}
                      {divvy.balances.length} — paid in {formatCents(divvy.totalPaidCents)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {divvy.balances.map((b) => (
                      <div
                        key={b.attendeeId}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{b.name}</span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>Share {formatCents(b.fairShareCents)}</span>
                          <span>Paid {formatCents(b.paidCents)}</span>
                          {b.role === "receive" && (
                            <Badge className="gap-1 bg-green-600/90">
                              <ArrowDownLeft className="w-3 h-3" />
                              Receive {formatCents(b.netCents)}
                            </Badge>
                          )}
                          {b.role === "give" && (
                            <Badge variant="destructive" className="gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              Give {formatCents(-b.netCents)}
                            </Badge>
                          )}
                          {b.role === "even" && (
                            <Badge variant="secondary">Even</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {divvy.transfers.length > 0 && (
                  <Card className="border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Clean divvy — who pays whom</CardTitle>
                      <CardDescription>
                        Minimum transfers to settle up. Mark each guest&apos;s status as paid or
                        received once money moves.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {divvy.transfers.map((t, i) => (
                        <div
                          key={`${t.fromId}-${t.toId}-${i}`}
                          className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm"
                        >
                          <span className="font-medium">{t.fromName}</span>
                          <ArrowUpRight className="w-4 h-4 text-destructive shrink-0" />
                          <span className="font-semibold">{formatCents(t.amountCents)}</span>
                          <ArrowDownLeft className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="font-medium">{t.toName}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
