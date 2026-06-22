# Requirements Document

## Introduction

The Audit Re-run feature allows operators on the Auditable-AI platform to re-audit an AI system they have previously audited. Re-runs are not simple repeats: the system always re-fingerprints the AI to detect meaningful behavioral drift since the last audit, asks the operator what they believe has changed, and then selects an appropriate probing scope (full or targeted) based on the measured delta. A delta engine classifies score movement per KPMG principle, and a finding classifier identifies which individual findings from the prior audit have been resolved, persist, or are new. All results are linked to the parent audit in MongoDB and surfaced through an enriched API response and updated frontend pages.

The feature integrates directly with the existing pipeline in `orchestrator.py`, `behavioral_fingerprinter.py`, `adaptive_prober.py`, and `probe_logger.py`, and adds a new `rerun_orchestrator.py` service plus a `POST /blackbox/audit/rerun` route.

---

## Glossary

- **Rerun_Orchestrator**: The new service (`rerun_orchestrator.py`) that executes the full re-run pipeline.
- **Prior_Audit**: The existing `blackbox_audits` document identified by `prior_audit_id` that serves as the baseline for comparison.
- **Fingerprint_Delta**: The comparison between the Phase 1 reconciliation results of the current run and the Prior_Audit, used to determine whether the AI has changed significantly.
- **Rerun_Scope**: The probing strategy for a re-run. One of `full` | `targeted` | `phase1_only`.
- **Delta_Engine**: The component that computes per-principle score movement by comparing the current audit's `category_scores` against those of the Prior_Audit.
- **Movement_Label**: The classification assigned to a KPMG principle's score change. One of `RESOLVED` | `REGRESSED` | `IMPROVING` | `WORSENING` | `UNCHANGED`.
- **Finding_ID**: A deterministic identifier computed as a hash of `(principle, failure_type, category_tag)` — stable across runs, independent of `probe_id`.
- **Finding_Classifier**: The component that compares findings across runs using Finding_IDs and tags each as `resolved`, `persisting`, or `new`.
- **User_Context**: Free-text input provided by the operator before a re-run, describing what they believe has changed in the AI since the last audit.
- **Rerun_Sequence**: An integer stored on the audit document: `1` for the original audit, `2` for the first re-run, incremented on each subsequent re-run.
- **Blackbox_Audits**: The MongoDB collection where all audit documents are stored.
- **AI_Systems**: The MongoDB collection where registered AI system profiles are stored.
- **Wave_Analysis**: The dict passed to `generate_wave_probes` in `adaptive_prober.py` that seeds Wave 1 with context about prior failures.
- **Semantic_CSV_Suffix**: The `_r{sequence}` suffix appended to re-run CSV filenames to prevent overwriting originals.

---

## Requirements

### Requirement 1: Re-run Request Intake

**User Story:** As an auditor, I want to trigger a re-run of a prior audit by supplying the prior audit ID, an optional scope override, and context about what has changed, so that the system has all the information it needs before starting.

#### Acceptance Criteria

1. WHEN a `POST /blackbox/audit/rerun` request is received, THE Rerun_Orchestrator SHALL require `prior_audit_id` and `user_context` fields and SHALL accept an optional `scope_override` field with allowed values `full`, `targeted`, or `phase1_only`.
2. WHEN the `prior_audit_id` does not match any document in Blackbox_Audits owned by the authenticated user, THE Rerun_Orchestrator SHALL return HTTP 404 with a descriptive error message.
3. WHEN the `scope_override` field is present and its value is not one of `full`, `targeted`, or `phase1_only`, THE Rerun_Orchestrator SHALL return HTTP 422 with a descriptive validation error.
4. WHEN `user_context` is an empty string, THE Rerun_Orchestrator SHALL return HTTP 422 indicating that operator context is required before a re-run can proceed.
5. THE Rerun_Orchestrator SHALL store the `user_context` value verbatim in the resulting audit document and SHALL include it in the response payload.

---

### Requirement 2: Phase 1 Re-fingerprinting

**User Story:** As a governance auditor, I want Phase 1 behavioral fingerprinting to always run on every re-run, so that behavioral drift can be detected regardless of the requested scope.

#### Acceptance Criteria

1. THE Rerun_Orchestrator SHALL always execute Phase 1 fingerprinting via `run_fingerprint_api` (or `run_fingerprint_ui` for UI mode) as the first step of every re-run, regardless of the value of `rerun_scope` or `scope_override`.
2. WHEN Phase 1 fingerprinting completes, THE Rerun_Orchestrator SHALL compute the Fingerprint_Delta by comparing the new reconciliation summary against the Prior_Audit's `fingerprint_meta.reconciliation` data.
3. THE Fingerprint_Delta SHALL record, for each reconciliation dimension, the `prior_status` (the reconciliation status from the Prior_Audit) and the `current_status` (the status from the new run).
4. WHEN Phase 1 completes and a prior fingerprint exists, THE Rerun_Orchestrator SHALL compute a `phase1_delta` object containing: `conflict_count_prior`, `conflict_count_current`, `conflict_count_change`, `domain_prior`, `domain_current`, `domain_changed` (boolean), and `per_dimension_changes` (list of dimensions whose status changed).
5. IF Phase 1 fingerprinting fails due to a transport or timeout error, THEN THE Rerun_Orchestrator SHALL log the failure, set `fingerprint_meta.attempted` to `true` and `fingerprint_meta.probes_run` to `0`, and continue to the scope determination step treating the delta as zero change.

---

### Requirement 3: Automatic Scope Determination

**User Story:** As an auditor, I want the re-run scope to be chosen automatically based on how much the AI has changed, so that re-runs are appropriately thorough without wasting resources on unchanged systems.

#### Acceptance Criteria

1. WHEN no `scope_override` is provided, THE Rerun_Orchestrator SHALL determine `rerun_scope` using the following rule: if `conflict_count_change` is greater than `0` OR `domain_changed` is `true`, set `rerun_scope` to `full`; otherwise set `rerun_scope` to `targeted`.
2. WHEN `scope_override` is provided and is a valid value, THE Rerun_Orchestrator SHALL use the `scope_override` value as the `rerun_scope`, bypassing automatic determination entirely.
3. WHEN `rerun_scope` is `full`, THE Rerun_Orchestrator SHALL run all three adaptive waves fresh, with no filtering on prior performance.
4. WHEN `rerun_scope` is `targeted`, THE Rerun_Orchestrator SHALL run adaptive probing restricted to principles whose pass rate in the Prior_Audit was below `0.7` (pass rate `< 0.5` = failing; `< 0.7` = borderline).
5. WHEN `rerun_scope` is `phase1_only`, THE Rerun_Orchestrator SHALL skip Phase 2 adversarial probing entirely and return results derived solely from the Phase 1 fingerprint.
6. THE Rerun_Orchestrator SHALL record the determined `rerun_scope` (and, when applicable, note that it was overridden) in the audit document and response payload.

---

### Requirement 4: Prior Failure Seeding into Wave 1

**User Story:** As a governance auditor, I want the Wave 1 probe generator to be seeded with the prior audit's failure summary, so that re-runs immediately target known weak spots and are harder to game.

#### Acceptance Criteria

1. WHEN a re-run executes Wave 1 adversarial probing, THE Rerun_Orchestrator SHALL construct the `wave_analysis` argument passed to `generate_wave_probes` to include: the Prior_Audit's `category_scores` translated to pass rates, the principles that were failing (pass rate `< 0.5`) and borderline (pass rate `< 0.7`) in the Prior_Audit, and up to three example failing probe/response pairs per principle from the Prior_Audit's `findings`.
2. THE Rerun_Orchestrator SHALL also inject the `user_context` string into the `wave_analysis` context block so the probe generator can target claimed changes.
3. WHEN the Prior_Audit contains no findings, THE Rerun_Orchestrator SHALL pass the standard empty `wave_analysis` to `generate_wave_probes` and SHALL NOT treat this as an error.

---

### Requirement 5: Delta Engine — Principle Score Movement

**User Story:** As an auditor reviewing a re-run report, I want to see exactly how each KPMG principle's score has changed since the prior audit, so that I can quickly identify regressions and improvements.

#### Acceptance Criteria

1. THE Delta_Engine SHALL compute a `principle_deltas` list containing one entry per KPMG principle present in either the Prior_Audit or the current audit.
2. FOR EACH principle, THE Delta_Engine SHALL assign a Movement_Label using these rules: if `prior_pass_rate < 0.5` AND `current_pass_rate >= 0.7`, label is `RESOLVED`; if `prior_pass_rate >= 0.7` AND `current_pass_rate < 0.5`, label is `REGRESSED`; if `current_pass_rate > prior_pass_rate` AND label is not already `RESOLVED`, label is `IMPROVING`; if `current_pass_rate < prior_pass_rate` AND label is not already `REGRESSED`, label is `WORSENING`; if `abs(current_pass_rate - prior_pass_rate) < 0.05`, label is `UNCHANGED`.
3. EACH entry in `principle_deltas` SHALL contain: `principle`, `prior_score`, `current_score`, `score_change`, `movement_label`.
4. THE Delta_Engine SHALL produce a `delta_summary` object containing: `overall_score_change` (current minus prior overall score), `resolved_count` (count of RESOLVED principles), `regressed_count` (count of REGRESSED principles), `improving_count`, `worsening_count`, `unchanged_count`, `new_finding_count` (count of findings classified as `new`), `principles_improved` (list of principle names with RESOLVED or IMPROVING), `principles_regressed` (list of principle names with REGRESSED or WORSENING).
5. WHEN a principle was probed in the Prior_Audit but not probed in the current re-run (e.g., `targeted` scope excluded it), THE Delta_Engine SHALL carry forward the prior score without a movement label, marking it as `not_reprobed` in the entry.

---

### Requirement 6: Finding Classifier — Cross-Run Finding Status

**User Story:** As an auditor, I want each individual finding tagged as resolved, persisting, or new when comparing a re-run to its parent audit, so that I can track whether specific vulnerabilities have been addressed.

#### Acceptance Criteria

1. THE Finding_Classifier SHALL compute a Finding_ID for each finding by hashing the concatenation of `(principle, failure_type, category_tag)` using SHA-256 truncated to 16 hex characters; the `probe_id` SHALL NOT be included in the hash because probe IDs change between runs.
2. THE Finding_Classifier SHALL tag each finding in the current audit as `new` if its Finding_ID does not appear in the Prior_Audit's findings, `persisting` if its Finding_ID appears in both audits, and `resolved` if a Finding_ID appears in the Prior_Audit but not in the current audit.
3. THE Rerun_Orchestrator SHALL include `resolved_findings`, `persisting_findings`, and `new_findings` lists in the response payload, each containing the full finding objects with their `finding_id` and `status` tag.
4. WHEN the Prior_Audit contains no findings, THE Finding_Classifier SHALL classify all current findings as `new` and SHALL return empty lists for `resolved_findings` and `persisting_findings`.

---

### Requirement 7: MongoDB Document Linkage

**User Story:** As a platform operator, I want re-run audit documents to be linked to their parent audits in MongoDB, so that audit history is traceable and the lineage of re-runs is preserved.

#### Acceptance Criteria

1. THE Rerun_Orchestrator SHALL store the following fields on every re-run audit document in Blackbox_Audits: `parent_audit_id` (string, the `prior_audit_id` from the request), `rerun_scope` (string), `rerun_sequence` (integer).
2. WHEN computing `rerun_sequence`, THE Rerun_Orchestrator SHALL set it to the Prior_Audit's `rerun_sequence` plus `1`; if the Prior_Audit has no `rerun_sequence` field, THE Rerun_Orchestrator SHALL treat its sequence as `1`, making the new document's sequence `2`.
3. THE Rerun_Orchestrator SHALL set `rerun_sequence` to `1` on original (non-rerun) audits created via `POST /blackbox/audit`, so that the sequence field is present from the start.
4. WHEN an original audit is created (not a re-run), THE Rerun_Orchestrator SHALL leave `parent_audit_id` absent from the document.
5. THE Rerun_Orchestrator SHALL NOT modify the Prior_Audit document; linkage is one-directional from child to parent.

---

### Requirement 8: CSV File Naming and Phase 1 CSV Schema

**User Story:** As an auditor who downloads CSV logs, I want re-run log files to have a clear naming suffix and to include the prior reconciliation status, so that re-run files are distinguishable from originals and auditors can see which conflicts were fixed.

#### Acceptance Criteria

1. WHEN saving CSV files for a re-run, THE Rerun_Orchestrator SHALL append `_r{rerun_sequence}` to the base filename stem; for example, a re-run with `rerun_sequence = 2` and base name `20260610_120000_abc12345_api` SHALL produce filename `20260610_120000_abc12345_api_r2.csv`.
2. THE Rerun_Orchestrator SHALL apply the `_r{rerun_sequence}` suffix to both the Phase 2 probe CSV and the Phase 1 fingerprint CSV.
3. WHEN saving the Phase 1 fingerprint CSV for a re-run, THE Rerun_Orchestrator SHALL add a `prior_status` column to the CSV, containing the reconciliation status recorded for that dimension in the Prior_Audit, or an empty string if no prior status exists for that dimension.
4. THE original (non-rerun) Phase 1 CSV SHALL NOT include a `prior_status` column, preserving backward compatibility with existing CSV consumers.

---

### Requirement 9: Re-run API Response Payload

**User Story:** As a frontend developer consuming the re-run API, I want the response to include all delta, linkage, and finding data in a single payload, so that the UI can render a complete comparison view without additional API calls.

#### Acceptance Criteria

1. THE Rerun_Orchestrator SHALL return a JSON response containing all fields present in a standard `POST /blackbox/audit` response, plus the following additional fields: `rerun_audit_id`, `parent_audit_id`, `rerun_scope`, `rerun_sequence`, `delta_summary`, `principle_deltas`, `resolved_findings`, `persisting_findings`, `new_findings`, `phase1_delta`, `user_context`, `csv_paths`.
2. THE `csv_paths` field SHALL be an object containing keys `phase1_csv` and `phase2_csv` with the absolute filesystem paths of the saved CSV files, or `null` for any file that was not written (e.g., `phase2_csv` is `null` when `rerun_scope` is `phase1_only`).
3. WHEN `rerun_scope` is `phase1_only`, THE Rerun_Orchestrator SHALL omit `principle_deltas`, `resolved_findings`, `persisting_findings`, and `new_findings` from the response (or set them to empty/null) and SHALL include `phase1_delta` and `delta_summary` with only fingerprint-level fields populated.
4. THE Rerun_Orchestrator SHALL ensure no `api_key` or other credential field appears in the stored MongoDB document or the returned response payload.

---

### Requirement 10: Frontend — Report Page Delta Visualisation

**User Story:** As an auditor viewing the Report page for a re-run audit, I want to see delta badges per principle and a delta summary banner, so that I can immediately understand what changed since the prior audit.

#### Acceptance Criteria

1. WHEN the Report page loads an audit with a `parent_audit_id` field, THE Report_Page SHALL display a delta summary banner at the top of the report containing `overall_score_change`, `resolved_count`, `regressed_count`, and `new_finding_count`.
2. THE Report_Page SHALL render a Movement_Label badge (RESOLVED, REGRESSED, IMPROVING, WORSENING, or UNCHANGED) next to each KPMG principle's score, using the `movement_label` from the `principle_deltas` array.
3. THE Report_Page SHALL tag each finding in the findings list with a status chip (resolved, persisting, new) based on the finding's `status` field returned in the response.
4. WHERE the audit has no `parent_audit_id`, THE Report_Page SHALL display the report without delta badges or summary banners, maintaining the existing non-rerun layout unchanged.

---

### Requirement 11: Frontend — Profile Page Audit History Timeline

**User Story:** As an auditor viewing the Profile page for an AI system, I want to see a timeline of all audit runs linked by parent-child relationships, so that I can trace the full re-run history of an AI system.

#### Acceptance Criteria

1. THE Profile_Page SHALL display an audit history section listing all audits for the selected AI system, sorted by `rerun_sequence` ascending and then by `created_at` descending within the same sequence.
2. WHEN an audit has a `parent_audit_id`, THE Profile_Page SHALL visually indicate it as a re-run and SHALL link it to the parent audit entry, showing the `rerun_sequence` number as a label (e.g., "Re-run #2").
3. THE Profile_Page SHALL display the `rerun_scope` and `overall_score` for each entry in the timeline.
4. WHERE an audit has `rerun_sequence = 1` and no `parent_audit_id`, THE Profile_Page SHALL display it as the original audit baseline.

---

### Requirement 12: Frontend — Delta Context on Supporting Pages

**User Story:** As an auditor reviewing any page of a re-run report (Executive Summary, Governance Principles, Risk Intelligence, Recommendations), I want to see contextual delta information relevant to each page, so that the comparative view is consistent throughout the report.

#### Acceptance Criteria

1. WHEN the ExecutiveSummary_Page renders an audit with a `parent_audit_id`, THE ExecutiveSummary_Page SHALL display `overall_score_change` and a brief note indicating this is a re-run of a prior audit.
2. WHEN the GovernancePrinciples_Page renders a re-run audit, THE GovernancePrinciples_Page SHALL display the Movement_Label badge alongside each principle's current score.
3. WHEN the RiskIntelligence_Page renders a re-run audit, THE RiskIntelligence_Page SHALL surface the `regressed_count` and a list of `principles_regressed` to highlight new or worsening risk areas.
4. WHEN the Recommendations_Page renders a re-run audit, THE Recommendations_Page SHALL prioritise recommendations for REGRESSED principles and SHALL mark recommendations for RESOLVED principles with a "resolved" indicator.
5. WHERE an audit has no `parent_audit_id`, ALL supporting pages SHALL render without delta context, preserving existing layouts and behaviour.

---

### Requirement 13: Correctness Properties

#### Acceptance Criteria

1. FOR ALL valid re-run requests with any `prior_audit_id`, THE Rerun_Orchestrator SHALL always produce a `fingerprint_meta` object with `attempted = true` in the response, regardless of scope or scope_override. *(Invariant — fingerprinting always runs)*

2. FOR ALL pairs of (prior_pass_rate, current_pass_rate) where `prior_pass_rate < 0.5` and `current_pass_rate >= 0.7`, THE Delta_Engine SHALL assign Movement_Label `RESOLVED`; for all pairs where `prior_pass_rate >= 0.7` and `current_pass_rate < 0.5`, THE Delta_Engine SHALL assign Movement_Label `REGRESSED`. *(Property — classification boundary correctness)*

3. FOR ALL pairs of (prior_pass_rate, current_pass_rate) where `abs(current_pass_rate - prior_pass_rate) < 0.05`, THE Delta_Engine SHALL assign Movement_Label `UNCHANGED`, unless the pair also satisfies the RESOLVED or REGRESSED boundary conditions. *(Property — UNCHANGED boundary)*

4. FOR ALL findings with the same `(principle, failure_type, category_tag)` tuple, THE Finding_Classifier SHALL produce the same Finding_ID. *(Round-trip / determinism property)*

5. FOR ALL re-run audit documents, THE Rerun_Orchestrator SHALL set `rerun_sequence` equal to the Prior_Audit's `rerun_sequence` plus `1`. *(Invariant — sequence monotonicity)*

6. FOR ALL valid re-run responses with `rerun_scope != phase1_only`, THE Rerun_Orchestrator SHALL include all of `rerun_audit_id`, `parent_audit_id`, `rerun_scope`, `rerun_sequence`, `delta_summary`, `principle_deltas`, `resolved_findings`, `persisting_findings`, `new_findings`, `phase1_delta`, `user_context`, and `csv_paths` in the response. *(Invariant — payload completeness)*

7. FOR ALL re-run CSV filenames, THE Rerun_Orchestrator SHALL produce filenames that include the substring `_r{rerun_sequence}` where `rerun_sequence >= 2`. *(Property — CSV naming correctness)*

8. FOR ALL scope_override values of `full`, `targeted`, and `phase1_only`, THE Rerun_Orchestrator SHALL use exactly the provided scope value as `rerun_scope` without modification. *(Property — override fidelity)*
