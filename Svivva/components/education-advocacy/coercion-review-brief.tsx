"use client";

import type { ReactNode } from "react";
import type {
  AdvocacyActionPlan,
  CoercionReviewBrief,
  InterventionPoint,
  IssueAnalysis,
  TimelineEventDraft,
} from "@/lib/education-advocacy/advocacy/coercion-review";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-border/40 pt-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function LayerBlock({ event }: { event: TimelineEventDraft }) {
  const layers: Array<{ label: string; items: string[] }> = [
    { label: "You report", items: event.layers.userReport },
    { label: "Documents may establish", items: event.layers.documentMayEstablish },
    { label: "Others claimed", items: event.layers.otherPersonClaimed },
    { label: "Still unknown", items: event.layers.unknown },
  ];
  return (
    <article className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-3">
      <div>
        <p className="text-xs text-muted-foreground">{event.approxWhen}</p>
        <h3 className="font-medium">{event.title}</h3>
      </div>
      {layers.map((layer) =>
        layer.items.length ? (
          <div key={layer.label}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{layer.label}</p>
            <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
              {layer.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {event.documentsToSeek.length ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Documents to seek</p>
          <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
            {event.documentsToSeek.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function InterventionCard({ point }: { point: InterventionPoint }) {
  return (
    <article className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-2 text-sm">
      <p className="text-xs text-muted-foreground">{point.stage}</p>
      <h3 className="font-medium">{point.whoMightHaveActed}</h3>
      <p>{point.whatRuleOrPolicyMayApply}</p>
      {point.citations.length ? (
        <p className="text-xs text-muted-foreground">Citations: {point.citations.join(" · ")}</p>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Evidence needed to evaluate compliance
        </p>
        <ul className="mt-1 list-disc pl-5 space-y-1">
          {point.evidenceNeededToEvaluateCompliance.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs italic text-muted-foreground">{point.nonAssumption}</p>
    </article>
  );
}

function IssueCard({ issue }: { issue: IssueAnalysis }) {
  return (
    <article className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-2 text-sm">
      <h3 className="font-medium">
        {issue.questionNumber}. {issue.question}
      </h3>
      <p>
        <span className="text-muted-foreground">Potentially relevant: </span>
        {issue.potentiallyRelevantProtections.join("; ")}
      </p>
      <ul className="list-disc pl-5 space-y-1">
        {issue.whatIsKnownFromUserReport.map((x) => (
          <li key={x}>Known from your report: {x}</li>
        ))}
        {issue.whatMustBeVerified.map((x) => (
          <li key={x}>Must verify: {x}</li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Would strengthen</p>
          <ul className="mt-1 list-disc pl-5 space-y-1">
            {issue.evidenceThatWouldStrengthen.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Would weaken</p>
          <ul className="mt-1 list-disc pl-5 space-y-1">
            {issue.evidenceThatWouldWeaken.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      {issue.citedSources.length ? (
        <ul className="text-xs text-muted-foreground space-y-1 pt-1">
          {issue.citedSources.map((s) => (
            <li key={s.citation}>
              <a className="underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>{" "}
              — {s.citation}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function ActionPlanView({ plan }: { plan: AdvocacyActionPlan }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-medium mb-2">Immediate next steps</h3>
        <ol className="list-decimal pl-5 space-y-1">
          {plan.nextImmediateSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="font-medium mb-2">Records to request</h3>
        <ul className="space-y-2">
          {plan.recordsToRequest.map((r) => (
            <li key={r.record} className="rounded border border-border/40 p-3">
              <p className="font-medium">{r.record}</p>
              <p className="text-muted-foreground">{r.why}</p>
              <p className="text-xs mt-1">Likely source: {r.whereLikely}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-2">Who to contact</h3>
        <ul className="space-y-2">
          {plan.contacts.map((c) => (
            <li key={c.name} className="rounded border border-border/40 p-3">
              <p className="font-medium">
                {c.name}{" "}
                <span className="text-xs font-normal text-muted-foreground">({c.type})</span>
              </p>
              {c.how.startsWith("http") ? (
                <a
                  className="text-xs underline underline-offset-2"
                  href={c.how}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c.how}
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">{c.how}</p>
              )}
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {c.ask.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-2">Questions to ask record custodians</h3>
        <ul className="list-disc pl-5 space-y-1">
          {plan.questionsToAsk.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-2">Potentially relevant protections</h3>
        <ul className="list-disc pl-5 space-y-1">
          {plan.potentiallyRelevantProtections.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-2">Facts still needing verification</h3>
        <ul className="list-disc pl-5 space-y-1">
          {plan.factsNeedingVerification.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-2">Processes that may still be available</h3>
        <ul className="list-disc pl-5 space-y-1">
          {plan.possibleProcesses.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CoercionReviewBriefView({ brief }: { brief: CoercionReviewBrief }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm space-y-2">
        {brief.disclaimers.map((d) => (
          <p key={d}>{d}</p>
        ))}
        <p className="text-xs text-muted-foreground">
          Protocol {brief.protocol} · Generated {brief.createdAt}
        </p>
      </div>

      <Section title="What this review understands">
        <ul className="list-disc pl-5 text-sm space-y-1">
          {brief.whatIUnderstand.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>

      <Section title="Evidence timeline (layered)">
        <div className="space-y-3">
          {brief.timeline.map((event) => (
            <LayerBlock key={event.id} event={event} />
          ))}
        </div>
      </Section>

      <Section title="Potential intervention points">
        <div className="space-y-3">
          {brief.interventionPoints.map((point) => (
            <InterventionCard key={point.id} point={point} />
          ))}
        </div>
      </Section>

      <Section title="Issue-by-issue analysis (12 investigation questions)">
        <div className="space-y-3">
          {brief.issueAnalyses.map((issue) => (
            <IssueCard key={issue.questionNumber} issue={issue} />
          ))}
        </div>
      </Section>

      <Section title="Advocacy action plan">
        <ActionPlanView plan={brief.actionPlan} />
      </Section>

      <Section title="Cited legal information">
        <ul className="space-y-2 text-sm">
          {brief.citedLegal.map((r) => (
            <li key={r.id} className="rounded border border-border/40 p-3">
              <a
                className="font-medium underline underline-offset-2"
                href={r.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {r.title}
              </a>
              <p className="text-xs text-muted-foreground mt-1">{r.citation}</p>
              <p className="mt-2 text-muted-foreground">{r.plainLanguageExplanation}</p>
            </li>
          ))}
        </ul>
      </Section>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Raw JSON brief</summary>
        <pre className="mt-2 overflow-auto max-h-[40vh] p-3 rounded bg-black/30 whitespace-pre-wrap">
          {JSON.stringify(brief, null, 2)}
        </pre>
      </details>
    </div>
  );
}
