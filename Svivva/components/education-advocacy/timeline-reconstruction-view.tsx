"use client";

import type { ReactNode } from "react";
import type {
  TimelineLaneId,
  TimelineReconstruction,
} from "@/lib/education-advocacy/advocacy/timeline-reconstruction";
import { TIMELINE_LANE_LABEL } from "@/lib/education-advocacy/advocacy/timeline-reconstruction";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border/40 pt-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function TimelineReconstructionView({
  reconstruction,
  hiddenLanes,
  onToggleLane,
}: {
  reconstruction: TimelineReconstruction;
  hiddenLanes: TimelineLaneId[];
  onToggleLane: (id: TimelineLaneId) => void;
}) {
  const hidden = new Set(hiddenLanes);
  const visibleEvents = reconstruction.events.filter((e) => e.lanes.some((l) => !hidden.has(l)));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm space-y-2">
        {reconstruction.disclaimers.map((d) => (
          <p key={d}>{d}</p>
        ))}
        <p className="text-xs text-muted-foreground">
          {reconstruction.protocol} · {reconstruction.createdAt}
        </p>
      </div>

      <Section title="Five core questions">
        <dl className="grid gap-3 text-sm">
          {(
            [
              ["What happened?", reconstruction.coreQuestions.whatHappened],
              ["What evidence supports it?", reconstruction.coreQuestions.whatEvidenceSupportsIt],
              ["Who knew, and when?", reconstruction.coreQuestions.whoKnewAndWhen],
              ["Educational result?", reconstruction.coreQuestions.educationalResult],
              [
                "Intervention points that may have mattered?",
                reconstruction.coreQuestions.interventionPointsMayHaveMattered,
              ],
            ] as const
          ).map(([q, a]) => (
            <div key={q}>
              <dt className="font-medium">{q}</dt>
              <dd className="text-muted-foreground mt-0.5">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Timeline lanes (toggle to hide)">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TIMELINE_LANE_LABEL) as TimelineLaneId[]).map((id) => {
            const on = !hidden.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleLane(id)}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  on
                    ? "border-[#5B8DA8]/50 bg-[#5B8DA8]/15"
                    : "border-border/50 text-muted-foreground opacity-60"
                }`}
              >
                {TIMELINE_LANE_LABEL[id]}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Chronological events">
        <div className="space-y-3">
          {visibleEvents.map((e) => (
            <article
              key={e.id}
              className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-2 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs text-muted-foreground">{e.dateExactOrApproximate}</p>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-border/60">
                  {e.evidenceStatusLabel}
                </span>
              </div>
              <h3 className="font-medium">{e.event}</h3>
              {e.labels.map((l) => (
                <p key={l} className="text-xs text-amber-200/90">
                  {l}
                </p>
              ))}
              {e.markers.map((m) => (
                <p key={m} className="text-xs text-[#8EB8C8]">
                  ▸ {m}
                </p>
              ))}
              {e.peopleOrganizations.length ? (
                <p className="text-muted-foreground">
                  People/orgs: {e.peopleOrganizations.join("; ")}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Source: {e.sourceKind.replace(/_/g, " ")} — {e.sourceDetail}
              </p>
              {e.chain ? (
                <p className="text-xs border-l-2 border-[#5B8DA8]/40 pl-3 space-y-0.5">
                  <span className="block">Event → {e.chain.event.slice(0, 80)}…</span>
                  <span className="block">Consequence → {e.chain.consequence}</span>
                  <span className="block">Educational impact → {e.chain.educationalImpact}</span>
                  <span className="block text-muted-foreground">
                    Causation:{" "}
                    {e.causationLabel === "supported"
                      ? "Supported by available evidence"
                      : e.causationLabel === "possible_connection"
                        ? "Possible Connection"
                        : "Unknown"}
                  </span>
                </p>
              ) : null}
              {e.schoolKnowledge ? (
                <div className="text-xs rounded border border-border/40 p-2 space-y-1 bg-black/20">
                  <p className="uppercase tracking-wide text-muted-foreground">
                    School Knowledge & Response
                  </p>
                  <p>What school knew: {e.schoolKnowledge.whatSchoolKnew}</p>
                  <p>When: {e.schoolKnowledge.whenSchoolKnew}</p>
                  <p>Who: {e.schoolKnowledge.whoAtSchoolKnew}</p>
                  <p>Afterward: {e.schoolKnowledge.whatHappenedAfterward}</p>
                </div>
              ) : null}
              <p className="text-[10px] text-muted-foreground">
                Lanes:{" "}
                {e.lanes
                  .filter((l) => !hidden.has(l))
                  .map((l) => TIMELINE_LANE_LABEL[l])
                  .join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {reconstruction.educationAccessInterruptions.length ? (
        <Section title="Education Access Interruptions">
          {reconstruction.educationAccessInterruptions.map((i) => (
            <article
              key={i.id}
              className="rounded-lg border border-[#5B8DA8]/40 bg-[#5B8DA8]/5 p-4 text-sm space-y-1"
            >
              <p className="font-medium">{i.label}</p>
              <p>Approx. days missed: {i.approximateSchoolDaysMissed}</p>
              <p>
                First / last missed day: {i.firstMissedDayApprox} → {i.lastMissedDayApprox}
              </p>
              <p>Attendance codes: {i.attendanceCodes}</p>
              <p>School contacted student: {i.schoolContactedStudent}</p>
              <p>School contacted parent: {i.schoolContactedParent}</p>
              <p>Teacher contact: {i.teachersAttemptedContact}</p>
              <p>Counselor: {i.counselorInvolved}</p>
              <p>Attendance intervention: {i.attendanceIntervention}</p>
              <p>Housing discussed: {i.housingInstabilityDiscussed}</p>
              <p>Immediately after: {i.whatHappenedImmediatelyAfter}</p>
              <p className="text-xs italic text-muted-foreground pt-1">{i.note}</p>
            </article>
          ))}
        </Section>
      ) : null}

      {reconstruction.housingInstabilityReview.triggered ? (
        <Section title="Housing Instability Review">
          <div className="text-sm space-y-2">
            <p className="font-medium">{reconstruction.housingInstabilityReview.determination}</p>
            <ul className="list-disc pl-5 space-y-1">
              {reconstruction.housingInstabilityReview.indicatorsFromIntake.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="text-xs uppercase tracking-wide text-muted-foreground pt-2">
              Eligibility questions
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {reconstruction.housingInstabilityReview.questionsToDetermineEligibility.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="text-xs uppercase tracking-wide text-muted-foreground pt-2">
              Unaccompanied youth questions
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {reconstruction.housingInstabilityReview.unaccompaniedYouthQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <ul className="text-xs text-muted-foreground space-y-1 pt-2">
              {reconstruction.housingInstabilityReview.potentiallyRelevantCitations.map((c) => (
                <li key={c.citation}>
                  <a className="underline" href={c.url} target="_blank" rel="noreferrer">
                    {c.title}
                  </a>{" "}
                  — {c.citation}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}

      {reconstruction.alternativeProgramTransitionReview.triggered ? (
        <Section title="Alternative Program / YABC Transition Review">
          <dl className="grid gap-2 text-sm">
            {(
              [
                [
                  "Original school",
                  reconstruction.alternativeProgramTransitionReview.originalSchool,
                ],
                [
                  "Credits at time",
                  reconstruction.alternativeProgramTransitionReview.creditsCompletedAtTime,
                ],
                [
                  "Who first suggested",
                  reconstruction.alternativeProgramTransitionReview.whoFirstSuggested,
                ],
                [
                  "What student was told",
                  reconstruction.alternativeProgramTransitionReview.whatStudentWasTold,
                ],
                [
                  "Written materials",
                  reconstruction.alternativeProgramTransitionReview.writtenMaterialsProvided,
                ],
                [
                  "How change appeared in records",
                  reconstruction.alternativeProgramTransitionReview.howChangeAppearedInRecords,
                ],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {reconstruction.alternativeProgramTransitionReview.representationsMadeToStudent.length ? (
            <div className="mt-3 space-y-2">
              <p className="font-medium text-sm">Representations Made to the Student</p>
              {reconstruction.alternativeProgramTransitionReview.representationsMadeToStudent.map(
                (r) => (
                  <div key={r.statement} className="rounded border border-border/40 p-3 text-sm">
                    <p>“{r.statement}”</p>
                    <p className="text-xs text-amber-200/90 mt-1">{r.classification}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.supportingOrContradictingEvidence}
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : null}
        </Section>
      ) : null}

      {reconstruction.seniorYearEducationImpactReview.triggered ? (
        <Section title="Senior-Year Education Impact Review">
          <p className="text-xs text-muted-foreground mb-2">
            {reconstruction.seniorYearEducationImpactReview.presentationNote}
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>On track: {reconstruction.seniorYearEducationImpactReview.onTrackToGraduate}</li>
            <li>
              Proximity: {reconstruction.seniorYearEducationImpactReview.proximityToCompletion}
            </li>
            <li>Program before: {reconstruction.seniorYearEducationImpactReview.programBefore}</li>
            <li>Program after: {reconstruction.seniorYearEducationImpactReview.programAfter}</li>
            <li>
              Pathway/timeline change:{" "}
              {reconstruction.seniorYearEducationImpactReview.pathwayOrTimelineChanged}
            </li>
          </ul>
        </Section>
      ) : null}

      <Section title="Key turning points">
        <ul className="space-y-2 text-sm">
          {reconstruction.keyTurningPoints.map((k) => (
            <li key={k.eventId} className="rounded border border-border/40 p-3">
              <p className="font-medium">{k.title}</p>
              <p className="text-muted-foreground">{k.why}</p>
              <p className="text-xs mt-1">Evidence: {k.evidenceStrength}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Potential intervention points">
        <div className="space-y-3">
          {reconstruction.potentialInterventionPoints.map((p) => (
            <article
              key={p.id}
              className="rounded-lg border border-border/50 p-4 text-sm space-y-1"
            >
              <p className="font-medium">{p.label}</p>
              <p>Trigger: {p.trigger}</p>
              <p>Who could have responded: {p.whoCouldHaveResponded}</p>
              <p className="text-xs">
                Guidance that may have applied: {p.lawPolicyGuidanceMayHaveApplied.join(" · ")}
              </p>
              <ul className="list-disc pl-5 text-xs">
                {p.evidenceNeeded.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="text-xs italic text-muted-foreground">{p.nonAssumption}</p>
            </article>
          ))}
        </div>
      </Section>

      {reconstruction.possibleRecordDiscrepancies.length ? (
        <Section title="Possible record discrepancies">
          {reconstruction.possibleRecordDiscrepancies.map((d) => (
            <article key={d.id} className="rounded border border-border/40 p-3 text-sm space-y-1">
              <p>Student recollection: {d.studentRecollection}</p>
              <p>School/document record: {d.schoolOrDocumentRecord}</p>
              <p className="text-xs text-amber-200/90">{d.status}</p>
              <p className="text-muted-foreground">{d.explanation}</p>
            </article>
          ))}
        </Section>
      ) : null}

      <Section title="Evidence needed">
        <ul className="space-y-2 text-sm">
          {reconstruction.evidenceNeeded.map((e) => (
            <li key={e.question} className="rounded border border-border/40 p-3">
              <p className="font-medium">Question: {e.question}</p>
              <p>Best evidence: {e.bestEvidence}</p>
              <p>Likely holder: {e.likelyRecordHolder}</p>
              <p className="text-muted-foreground">Suggested request: {e.suggestedRequest}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Evidence strength">
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {(
            [
              ["Strong documentation", reconstruction.evidenceStrengthSummary.strongDocumentation],
              [
                "Partial documentation",
                reconstruction.evidenceStrengthSummary.partialDocumentation,
              ],
              [
                "User recollection only",
                reconstruction.evidenceStrengthSummary.userRecollectionOnly,
              ],
              ["Conflicting evidence", reconstruction.evidenceStrengthSummary.conflictingEvidence],
              ["Unknown", reconstruction.evidenceStrengthSummary.unknown],
              ["Missing records", reconstruction.evidenceStrengthSummary.missingRecords],
            ] as const
          ).map(([label, items]) => (
            <div key={label} className="rounded border border-border/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              {items.length ? (
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {items.slice(0, 6).map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-1">None yet</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Questions still unanswered">
        <ul className="list-disc pl-5 text-sm space-y-1">
          {reconstruction.questionsStillUnanswered.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </Section>

      <Section title="Potentially relevant protections">
        <ul className="space-y-2 text-sm">
          {reconstruction.potentiallyRelevantProtections.map((p) => (
            <li key={p.citation} className="rounded border border-border/40 p-3">
              <a className="font-medium underline" href={p.url} target="_blank" rel="noreferrer">
                {p.title}
              </a>
              <p className="text-xs text-muted-foreground">{p.citation}</p>
              <p className="text-xs mt-1 text-muted-foreground">{p.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Advocacy next steps">
        <ol className="list-decimal pl-5 text-sm space-y-1">
          {reconstruction.advocacyNextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Section>

      {reconstruction.documentNotes.length ? (
        <Section title="Documents (originals preserved)">
          <ul className="space-y-2 text-sm">
            {reconstruction.documentNotes.map((d) => (
              <li key={d.name} className="rounded border border-border/40 p-3">
                <p className="font-medium">{d.name}</p>
                <p className="text-xs">Original: {d.originalDocument}</p>
                <p className="text-xs text-muted-foreground">
                  AI interpretation ({d.interpretationCertainty}): {d.aiInterpretation}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Raw JSON reconstruction</summary>
        <pre className="mt-2 overflow-auto max-h-[40vh] p-3 rounded bg-black/30 whitespace-pre-wrap">
          {JSON.stringify(reconstruction, null, 2)}
        </pre>
      </details>
    </div>
  );
}
