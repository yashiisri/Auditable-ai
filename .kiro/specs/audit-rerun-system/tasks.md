# Implementation Plan: Audit Re-Run System

## Overview

Implement the Audit Re-Run System as a new service layer and API route on top of the existing blackbox audit pipeline. The plan works incrementally: pure functions first (Delta Engine, Finding Classifier), then the re-run orchestrator that composes them, then API routes, and finally the frontend changes. All changes to existing files are additive — no existing behavior is modified.

## Tasks

- [x] 1. Implement the Delta Engine pure functions
  - Create `backend/app/services/blackbox/delta_engine.py`
  - Implement `classify_movement(prior_pass_rate: float, current_pass_rate: float) -> str` — applies RESOLVED / REGRESSED / IMPROVING / WORSENING / UNCHANGED rules in priority order (RESOLVED and REGRESSED checked first, then UNCHANGED at < 0.05 threshold, then directional)
  - Implement `compute_principle_deltas(prior_category_scores: dict, current_category_scores: dict) -> list[dict]` — iterates union of both dicts' keys, calls `classify_movement`, builds entry with `principle`, `prior_score`, `current_score`, `score_change`, `movement_label`; marks principles missing from current run as `not_reprobed`
  - Implement `compute_delta_summary(principle_deltas: list[dict], prior_overall_score: int, current_overall_score: int, new_finding_count: int) -> dict` — counts each movement label, builds `principles_improved` / `principles_regressed` lists, computes `overall_score_change`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 1.1 Write property tests for Delta Engine
  - **Property 8: Movement label classification boundary correctness** — `@given(st.floats(0.0, 1.0), st.floats(0.0, 1.0))` — verify RESOLVED/REGRESSED/UNCHANGED/IMPROVING/WORSENING rules are applied correctly for all float pairs
  - **Property 9: principle_deltas covers all principles** — `@given(random dict of KPMG principle subsets)` — verify output covers the union of both input dicts' keys
  - `@settings(max_examples=200)` on each test
  - Tag: `# Feature: audit-rerun-system, Property 8: movement label boundary correctness`
  - Tag: `# Feature: audit-rerun-system, Property 9: principle_deltas covers union`
  - _Requirements: 5.2, 13.2, 13.3_

- [x] 2. Implement the Finding Classifier pure functions
  - Create `backend/app/services/blackbox/finding_classifier.py`
  - Implement `compute_finding_id(principle: str, failure_type: str, category_tag: str) -> str` — SHA-256 of the concatenated string, return first 16 hex chars
  - Implement `classify_findings(prior_findings: list[dict], current_findings: list[dict]) -> tuple[list, list, list]` — returns `(resolved_findings, persisting_findings, new_findings)`; computes Finding_ID for each finding using `category` as `principle`, `severity` as `failure_type`, `note` (first 80 chars) as `category_tag`; tags each dict with `finding_id` and `status` fields
  - Handle empty `prior_findings` edge case: all current findings → `new`, both other lists → empty
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 2.1 Write property tests for Finding Classifier
  - **Property 10: Finding_ID determinism** — `@given(st.text(), st.text(), st.text())` — compute ID twice for same triple, verify identical; also verify different triples produce different IDs statistically
  - **Property 11: Finding classification partition** — `@given(random lists of finding dicts)` — verify every current finding appears in exactly one of persisting/new; every prior finding ID absent from current appears in resolved; sets are disjoint
  - Tag: `# Feature: audit-rerun-system, Property 10: Finding_ID determinism`
  - Tag: `# Feature: audit-rerun-system, Property 11: finding classification completeness`
  - _Requirements: 6.1, 6.2, 13.4_

- [x] 3. Implement the Fingerprint Delta and Scope Determination functions
  - In `rerun_orchestrator.py` (create file), implement `compute_fingerprint_delta(prior_fingerprint_meta: dict, current_reconciliation: list[dict]) -> dict` — extracts conflict counts and domain from both sources, builds `phase1_delta` with all 7 required keys
  - Implement `determine_scope(phase1_delta: dict, scope_override: Optional[str]) -> tuple[str, bool]` — returns `(rerun_scope, was_overridden)`; auto-rule: `conflict_count_change > 0 OR domain_changed → "full"`, else `"targeted"`; override bypasses auto entirely
  - Implement `compute_rerun_sequence(prior_audit: dict) -> int` — returns `prior_audit.get("rerun_sequence", 1) + 1`
  - Implement `build_seeded_wave_analysis(prior_audit: dict, user_context: str) -> dict` — translates prior `category_scores` to pass rates; identifies failing (< 0.5) and borderline (< 0.7) principles; extracts up to 3 failing probe/response pairs per principle from prior `findings`; injects `user_context` string into context block
  - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 4.3, 7.2_

- [ ]* 3.1 Write property tests for scope determination and fingerprint delta
  - **Property 4: phase1_delta structure completeness** — `@given(random reconciliation lists)` — verify all 7 keys always present in output
  - **Property 5: Automatic scope determination rule** — `@given(st.integers(), st.booleans())` for `conflict_count_change` and `domain_changed`, `scope_override=None` — verify rule applied correctly
  - **Property 6: scope_override fidelity** — `@given(st.sampled_from(["full","targeted","phase1_only"]))` — verify result always equals input
  - **Property 12: rerun_sequence monotonicity** — `@given(st.integers(min_value=1, max_value=100))` — verify output == input + 1; also verify None/absent treated as 1
  - _Requirements: 2.4, 3.1, 3.2, 7.2, 13.5, 13.8_

- [x] 4. Implement the Re-run CSV extensions in probe_logger.py
  - Add `save_rerun_probe_csv(audit_id, ai_name, mode, probe_results, started_at, rerun_sequence) -> str` to `probe_logger.py` — delegates to `save_probe_csv` but inserts `_r{rerun_sequence}` before `.csv` in the filename stem
  - Add `save_rerun_fingerprint_csv(audit_id, ai_name, reconciliation_records, probes, started_at, rerun_sequence, prior_fingerprint_statuses: dict[str, str]) -> str` — extends Phase 1 CSV with a `prior_status` column (appended after `latency_ms`); `prior_fingerprint_statuses` maps dimension → prior reconciliation status string
  - Existing `save_probe_csv` and `save_fingerprint_csv` functions are NOT modified
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 4.1 Write property tests for re-run CSV naming
  - **Property 13: CSV filenames contain sequence suffix** — `@given(st.integers(min_value=2, max_value=50))` for rerun_sequence — call both new functions, read back the filename string, verify `f"_r{rerun_sequence}"` is present in filename
  - Verify original `save_probe_csv` output does NOT contain `_r` suffix
  - Tag: `# Feature: audit-rerun-system, Property 13: CSV filename sequence suffix`
  - _Requirements: 8.1, 8.2, 13.7_

- [x] 5. Implement the full re-run pipeline in rerun_orchestrator.py
  - Implement `fetch_prior_audit(prior_audit_id: str, owner_id: str, collection) -> dict` — raises `HTTPException(404)` when not found or owner mismatch
  - Implement `validate_rerun_request(prior_audit_id: str, user_context: str, scope_override: Optional[str])` — raises `HTTPException(422)` when `user_context` is empty or `scope_override` has invalid value; include allowed values in error detail
  - Implement `run_rerun_pipeline(...)` as the main async entry point — orchestrates: validate → fetch prior → Phase 1 fingerprint → compute delta → determine scope → optionally run Phase 2 → compute principle deltas → classify findings → save CSVs → build and return response dict
  - For `full` scope: call the existing `_run_wave_sequentially` + adaptive probe generation from `orchestrator.py` imports (all three waves, unseeded beyond the seeded wave_analysis)
  - For `targeted` scope: call `generate_wave_probes` from `adaptive_prober.py` with principle filter applied — only principles with prior pass rate < 0.7 included
  - For `phase1_only` scope: skip Phase 2, return response with Phase 1 data only; set `principle_deltas`, `resolved_findings`, `persisting_findings`, `new_findings` to empty lists; set `csv_paths.phase2_csv` to None
  - Strip `api_key` from stored document before `insert_one`
  - _Requirements: 1.1–1.5, 2.1, 2.5, 3.3–3.6, 5.1–5.5, 6.1–6.4, 7.1–7.5, 9.1–9.4_

- [~] 6. Checkpoint — Ensure all backend unit tests pass
  - Write unit tests covering: 404 on unknown prior_audit_id, 422 on empty user_context, 422 on invalid scope_override, phase1_only skips Phase 2, full scope runs all 3 waves, prior audit with no findings → all new, rerun_sequence=1 on original audits, parent_audit_id absent from original audits, not_reprobed flag for missing principles, Phase 1 re-run CSV has prior_status column, original Phase 1 CSV has no prior_status column, csv_paths.phase2_csv is None for phase1_only
  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Add re-run API routes to blackbox_routes.py
  - Add `POST /blackbox/audit/rerun` route that validates the `RerunRequest` Pydantic model, calls `run_rerun_pipeline`, stores the result, and returns the response
  - Add `RerunRequest` Pydantic model with `prior_audit_id: str`, `user_context: str` (validated non-empty via `@validator`), `scope_override: Optional[Literal["full", "targeted", "phase1_only"]] = None`
  - Add `GET /blackbox/rerun-history/{ai_name}` route — queries `blackbox_audits` for all documents belonging to the authenticated user and the given `ai_name`, returns them sorted by `rerun_sequence` ascending, `created_at` descending; excludes `probe_results` and `api_key` from projection
  - Patch the existing `POST /blackbox/audit` handler to add `"rerun_sequence": 1` to the stored document (no other changes)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.3, 7.4, 11.1_

- [ ]* 7.1 Write property tests for request validation
  - **Property 1: Invalid scope_override always 422** — `@given(st.text())` filtered to exclude `{"full","targeted","phase1_only",""}` — call validation function, verify raises HTTPException with status 422
  - **Property 2: user_context stored verbatim** — `@given(st.text(min_size=1))` — run pipeline with mocked DB/fingerprint, verify stored document's `operator_change_context` == input exactly
  - Tag: `# Feature: audit-rerun-system, Property 1: invalid scope_override returns 422`
  - Tag: `# Feature: audit-rerun-system, Property 2: user_context verbatim storage`
  - _Requirements: 1.3, 1.5, 13.6_

- [ ]* 7.2 Write property tests for payload completeness and API key exclusion
  - **Property 14: Response payload completeness** — with mocked pipeline, generate valid full/targeted scope requests, verify all required keys present in response
  - **Property 15: API key never in response** — `@given(st.text(min_size=1))` for api_key — run pipeline with mocked fingerprint/probing, verify `api_key` absent from response dict and stored document
  - Tag: `# Feature: audit-rerun-system, Property 14: payload completeness`
  - Tag: `# Feature: audit-rerun-system, Property 15: api_key never in response`
  - _Requirements: 9.1, 9.4, 13.6_

- [ ] 8. Add API functions to frontend/src/services/api.ts
  - Add `runRerunAudit(data: { prior_audit_id: string; user_context: string; scope_override?: "full" | "targeted" | "phase1_only" }) => api.post("/blackbox/audit/rerun", data)`
  - Add `getRerunHistory(aiName: string) => api.get(\`/blackbox/rerun-history/\${aiName}\`)`
  - _Requirements: 9.1, 11.1_

- [~] 9. Implement re-run UI in Dashboard.tsx
  - Add a "Re-run Audit" entry point that can be triggered from the audit history list (receives a prior audit object as prop)
  - Create a `RerunChangeDialog` component with: change description textarea (required), change type select (model update / system prompt change / fine-tuning / bug fix / other), "Which principles do you believe were fixed?" multi-select of all 10 KPMG principles
  - After dialog submission, call `runRerunAudit()` and display scope recommendation ("High delta detected — full re-run recommended" or "Low delta — targeted re-run selected") based on `rerun_scope` in the response
  - Show re-run progress with the same spinner/status component used for original audits
  - On completion, navigate to `/report` with the re-run audit ID
  - _Requirements: 10.1 (indirectly through navigation), 11.2_

- [~] 10. Update Profile.tsx audit history display
  - For each audit entry in the history list:
    - Display a "Re-run #N" badge when `rerun_sequence > 1` and `parent_audit_id` is present (use `rerun_sequence` as the number)
    - Display the `rerun_scope` label alongside the badge (e.g., "targeted")
    - Display a "Re-run Audit" button next to each completed audit entry
    - Mark original audits (`rerun_sequence === 1`) with a "Baseline" label
  - Sort the displayed list by `rerun_sequence` ascending, then `created_at` descending within same sequence
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ]* 10.1 Write property test for audit history sort order
  - **Property 16: Sort order correctness** — `@given` list of audit objects with random `rerun_sequence` and `created_at` values — apply sort function, verify originals (sequence=1) before re-runs; within same sequence, more recent first
  - Tag: `# Feature: audit-rerun-system, Property 16: audit history sort order`
  - _Requirements: 11.1_

- [~] 11. Update Report.tsx to show delta panel for re-run audits
  - Check for `parent_audit_id` presence in the loaded audit data
  - When present, render a delta summary banner at the top of the report containing: `overall_score_change` (with +/- sign and color), `resolved_count` (green), `regressed_count` (red), `new_finding_count` (amber)
  - For each KPMG principle in the score grid, look up its `movement_label` from `principle_deltas` and render a colored badge (RESOLVED=green, REGRESSED=red, IMPROVING=teal, WORSENING=orange, UNCHANGED=gray)
  - In the findings list, render a status chip on each finding based on its `status` field (`new`=amber, `persisting`=gray, `resolved`=green strikethrough)
  - Add a "Phase 1 Fingerprint Delta" collapsible section showing `phase1_delta.per_dimension_changes` as a table with `dimension`, `prior_status`, `current_status` columns
  - When `parent_audit_id` is absent, render the existing report layout without any delta UI
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [~] 12. Update supporting report pages with delta context
  - `ExecutiveSummary` page/component: when `parent_audit_id` present, display `overall_score_change` inline next to the score and a subtitle "Re-run #N of [parent audit date]"
  - `GovernancePrinciples` page/component: render Movement_Label badge alongside each principle's current score (reuse the badge component from task 11)
  - `RiskIntelligence` page/component: when `parent_audit_id` present, add a "Regressions" callout card showing `regressed_count` and listing `principles_regressed`
  - `Recommendations` page/component: sort recommendations so REGRESSED principles appear first; add a "Resolved ✓" chip next to recommendations for RESOLVED principles
  - All changes are conditional on `parent_audit_id` being present; existing layout preserved otherwise
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [~] 13. Final checkpoint — Ensure all tests pass
  - Run all backend tests: `pytest backend/ -v`
  - Run all frontend tests: `vitest --run`
  - Verify end-to-end: POST /blackbox/audit → POST /blackbox/audit/rerun → GET /blackbox/rerun-history/{ai_name}
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Existing pipeline files (`orchestrator.py`, `behavioral_fingerprinter.py`, `adaptive_prober.py`) are NOT modified — only new files and additive changes to `probe_logger.py`, `blackbox_routes.py`, and `api.ts`
- Property tests use Hypothesis (`pip install hypothesis`) with `@settings(max_examples=200)`
- Each property test references a numbered property from design.md for traceability
- The `api_key` is not stored in MongoDB (existing policy) — re-run requests must re-supply it
