"""
app/database.py
===============
PostgreSQL 17 connection layer (replaces MongoDB/pymongo).

Uses SQLAlchemy 2.x Core + psycopg2.  All tables are created automatically
via create_all() on first import.  Column types:
  - JSONB  for semi-structured payloads (profiles, metrics, findings, etc.)
  - TEXT   for long free-text that could exceed varchar limits
  - UUID   as primary keys everywhere

Exposes:
  engine          – SQLAlchemy Engine (for raw connection access)
  SessionLocal    – sessionmaker factory  (use as context manager)
  get_db()        – FastAPI dependency that yields a session

Collections shim (so existing routes need minimal changes):
  users_collection, ai_collection, sdcc_collection,
  reports_collection, audit_results_collection,
  blackbox_collection — each is a PgCollection wrapper that mimics the
  MongoDB dict-based API (find_one / insert_one / update_one / find).
"""

from __future__ import annotations

import os
import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    create_engine, text,
    Column, String, Text, Integer, Float,
    Boolean, DateTime, Index, MetaData,
    Table, inspect as sa_inspect,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# ── Null-byte sanitiser ────────────────────────────────────────────────────────
# PostgreSQL rejects \u0000 null bytes in TEXT and JSONB columns.
# Groq/LLM responses occasionally embed them.  Strip recursively before any insert.

def _strip_nulls(obj):
    """Recursively remove null bytes from strings inside any structure."""
    if isinstance(obj, str):
        return obj.replace("\x00", "")
    if isinstance(obj, dict):
        return {k: _strip_nulls(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_strip_nulls(v) for v in obj]
    return obj


# ── Connection ─────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/trusted_ai_db",
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,          # set to True for SQL debug output
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

metadata = MetaData()


# ── ORM base ───────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Table definitions ──────────────────────────────────────────────────────────

users_table = Table(
    "users", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("name",         String(200),  nullable=False),
    Column("email",        String(320),  nullable=False, unique=True),
    Column("password",     Text,         nullable=False),
    Column("role",         String(50),   nullable=False, default="auditor"),
    Column("is_active",    Boolean,      nullable=False, default=True),
    Column("audit_count",  Integer,      nullable=False, default=0),
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
    Column("last_login",   DateTime,     nullable=True),
    Column("extra",        JSONB,        nullable=True),      # future extensibility
)

ai_systems_table = Table(
    "ai_systems", metadata,
    Column("id",                   UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("name",                 String(300),  nullable=False),
    Column("description",          Text,         nullable=False, default=""),
    Column("domain",               String(200),  nullable=False, default=""),
    Column("connector",            JSONB,        nullable=True),   # {type, endpoint, headers}
    Column("owner_id",             UUID(as_uuid=True), nullable=False),
    Column("status",               String(50),   nullable=False, default="active"),
    Column("audit_runs",           Integer,      nullable=False, default=0),
    Column("system_prompt",        Text,         nullable=True),
    Column("registration_profile", JSONB,        nullable=True),   # full RegistrationProfileSchema
    Column("created_at",           DateTime,     nullable=False, default=datetime.utcnow),
    Column("updated_at",           DateTime,     nullable=True),
)

sdcc_results_table = Table(
    "sdcc_results", metadata,
    Column("id",               UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("ai_name",          String(300),  nullable=False),
    Column("ai_system_id",     UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id (backfilled; nullable during migration)
    Column("owner_id",         UUID(as_uuid=True), nullable=False),
    Column("model_type",       String(100),  nullable=True),
    Column("logs_ingested",    Integer,      nullable=False, default=0),
    Column("data_quality_score", Float,      nullable=True),
    Column("sample_records",   JSONB,        nullable=True),   # list of log row dicts
    Column("kb_chunks",        JSONB,        nullable=True),   # knowledge base chunks
    Column("diagnostics",      JSONB,        nullable=True),
    Column("column_warnings",  JSONB,        nullable=True),
    Column("recommendation",   Text,         nullable=True),
    Column("structural_risk",  JSONB,        nullable=True),
    Column("det_conf",         Float,        nullable=True),
    Column("extra",            JSONB,        nullable=True),
    Column("created_at",       DateTime,     nullable=False, default=datetime.utcnow),
    Column("updated_at",       DateTime,     nullable=True),
)

reports_table = Table(
    "reports", metadata,
    Column("id",                      UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",               String(200),  nullable=False, unique=True),
    Column("ai_name",                 String(300),  nullable=False),
    Column("ai_system_id",            UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id
    Column("model_type",              String(100),  nullable=True),
    Column("model_label",             String(200),  nullable=True),
    Column("detection_confidence",    Float,        nullable=True),
    Column("evaluated_at",            Text,         nullable=True),
    Column("overall_score",           Float,        nullable=True),
    Column("risk_level",              String(50),   nullable=True),
    Column("structural_risk",         JSONB,        nullable=True),
    Column("logs_evaluated",          Integer,      nullable=True),
    Column("data_quality_score",      Float,        nullable=True),
    Column("trusted_ai_principles",   JSONB,        nullable=True),
    Column("diagnostics",             JSONB,        nullable=True),
    Column("model_metrics",           JSONB,        nullable=True),
    Column("computation_notes",       JSONB,        nullable=True),
    Column("code_build_risk",         JSONB,        nullable=True),
    Column("llm_judge",               JSONB,        nullable=True),
    Column("audit_sources",           JSONB,        nullable=True),
    Column("findings",                JSONB,        nullable=True),
    Column("risk_analysis",           JSONB,        nullable=True),
    Column("recommendation",          Text,         nullable=True),
    Column("framework_compliance",    JSONB,        nullable=True),
    Column("column_warnings",         JSONB,        nullable=True),
    Column("engine_status",           JSONB,        nullable=True),   # analysis-engine tier disclosure (ml vs heuristic)
    # ── AI-generated recommendation fields (rec_synthesizer.py) ───────────────
    Column("overall_narrative",          Text,         nullable=True),   # Groq-generated 3-4 sentence narrative
    Column("deployment_verdict_context", Text,         nullable=True),   # one sentence on why Ready/Conditional/Requires Remediation
    Column("recs_generated",             Boolean,      nullable=True),   # False when Groq was unavailable (frontend shows re-run banner)
    Column("recommended_actions",        JSONB,        nullable=True),   # flat list of {principle,action_text,effort,impact,day_target,phase,owner_team,sort_order}
    Column("owner_id",                UUID(as_uuid=True), nullable=False),
    Column("created_at",              DateTime,     nullable=False, default=datetime.utcnow),
)

# Audit-extension (PDF / self-attestation) results
report_audit_results_table = Table(
    "report_audit_results", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("audit_id",     String(200),  nullable=False, unique=True),
    Column("ai_system_id", UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id (only known when tied to a registered AI)
    Column("owner_id",     UUID(as_uuid=True), nullable=True),
    Column("filename",     String(500),  nullable=True),
    Column("file_hash",    String(200),  nullable=True),
    Column("source_type",  String(50),   nullable=True),   # "pdf" | "self_attestation"
    Column("result",       JSONB,        nullable=True),   # full Groq analysis payload
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
)

blackbox_audits_table = Table(
    "blackbox_audits", metadata,
    Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("audit_id",       String(200),  nullable=False, unique=True),
    Column("ai_name",        String(300),  nullable=False),
    Column("ai_system_id",   UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id
    Column("owner_id",       UUID(as_uuid=True), nullable=False),
    Column("mode",           String(50),   nullable=True),   # "api" | "ui"
    Column("status",         String(50),   nullable=True),
    Column("probe_results",  JSONB,        nullable=True),
    Column("fingerprint",    JSONB,        nullable=True),
    Column("code_build_risk",JSONB,        nullable=True),
    Column("adaptive_meta",  JSONB,        nullable=True),
    Column("summary",        JSONB,        nullable=True),
    Column("extra",          JSONB,        nullable=True),
    Column("started_at",     DateTime,     nullable=True),
    Column("completed_at",   DateTime,     nullable=True),
    Column("created_at",     DateTime,     nullable=False, default=datetime.utcnow),
)

# Unified per-control evidence store — every audit channel writes here,
# the taxonomy mapper reads from here (one source of truth per control).
audit_evidence_table = Table(
    "audit_evidence", metadata,
    Column("id",            UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("audit_id",      String(200),  nullable=False),
    Column("ai_name",       String(300),  nullable=False),
    Column("owner_id",      UUID(as_uuid=True), nullable=False),
    Column("control_id",    String(30),   nullable=False),
    Column("pillar",        String(40),   nullable=True),
    Column("category",      String(10),   nullable=True),
    Column("channel",       String(20),   nullable=True),
    Column("evidence_type", String(30),   nullable=True),
    Column("value",         Float,        nullable=True),
    Column("confidence",    String(10),   nullable=True),
    Column("source",        String(60),   nullable=True),
    Column("detail",        Text,         nullable=True),
    Column("probes",        JSONB,        nullable=True),
    Column("created_at",    DateTime,     nullable=False, default=datetime.utcnow),
)

# Probe / audit log rows (replaces CSV files on disk)
probe_logs_table = Table(
    "probe_logs", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("audit_id",     String(200),  nullable=False),
    Column("ai_name",      String(300),  nullable=False),
    Column("ai_system_id", UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id
    Column("log_type",     String(50),   nullable=False, default="probe"),  # probe | fingerprint | rerun
    Column("mode",         String(50),   nullable=True),
    Column("task_id",      String(300),  nullable=True),
    Column("dimension",    String(200),  nullable=True),
    Column("input",        Text,         nullable=True),
    Column("output",       Text,         nullable=True),
    Column("latency_ms",   Float,        nullable=True),
    Column("extra",        JSONB,        nullable=True),   # reconciliation_status, notes, etc.
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
)

# ── Typed log tables (replace the "everything in probe_logs" pattern) ─────────
# probe_logs above is kept for backward compatibility with existing rows/reads,
# but new writes go into the type-specific tables below, each scoped to one
# ai_system_id so a system's raw evidence trail is a single filtered query
# instead of a shared table filtered by a free-text log_type/ai_name pair.

uploaded_logs_table = Table(
    "uploaded_logs", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("ai_system_id", UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id
    Column("ai_name",      String(300),  nullable=False),
    Column("owner_id",     UUID(as_uuid=True), nullable=False),
    Column("task_id",      String(300),  nullable=True),
    Column("input",        Text,         nullable=True),
    Column("output",       Text,         nullable=True),
    Column("latency_ms",   Float,        nullable=True),   # 0 / null when the source file had no latency column
    Column("extra",        JSONB,        nullable=True),   # any extra columns from the uploaded file
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
)

probe_run_logs_table = Table(
    "probe_run_logs", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("ai_system_id", UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id
    Column("ai_name",      String(300),  nullable=False),
    Column("owner_id",     UUID(as_uuid=True), nullable=True),
    Column("audit_id",     String(200),  nullable=False),
    Column("log_type",     String(50),   nullable=False, default="probe"),  # probe | fingerprint | rerun
    Column("mode",         String(50),   nullable=True),
    Column("task_id",      String(300),  nullable=True),
    Column("dimension",    String(200),  nullable=True),
    Column("input",        Text,         nullable=True),
    Column("output",       Text,         nullable=True),
    Column("latency_ms",   Float,        nullable=True),   # round-trip time for that specific probe call, in ms
    Column("extra",        JSONB,        nullable=True),
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
)

chat_logs_table = Table(
    "chat_logs", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("ai_system_id", UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id
    Column("ai_name",      String(300),  nullable=True),
    Column("owner_id",     UUID(as_uuid=True), nullable=False),
    Column("session_id",   String(300),  nullable=True),
    Column("role",         String(20),   nullable=True),         # user | assistant
    Column("message",      Text,         nullable=True),
    Column("latency_ms",   Float,        nullable=True),
    Column("extra",        JSONB,        nullable=True),
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
)


# ── TAF Taxonomy Assessment (computed per-audit mapping) ───────────────────────
taf_assessments_table = Table(
    "taf_assessments", metadata,
    Column("id",               UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("audit_id",         String(200),  nullable=False),         # links to blackbox_audits.audit_id or reports.report_id
    Column("ai_name",          String(300),  nullable=False),
    Column("ai_system_id",     UUID(as_uuid=True), nullable=True),    # FK -> ai_systems.id
    Column("owner_id",         UUID(as_uuid=True), nullable=False),
    Column("ai_category",      String(10),   nullable=True),           # GAI | PAI | DM | PD | DP (detected from model_type)
    Column("rows",             JSONB,        nullable=True),           # list of {numbered_id, mapped, computed_status, evidence, score, ...}
    Column("summary",          JSONB,        nullable=True),           # {yes, partial, no, na, training_unlocked, total}
    Column("has_training_data",Boolean,      nullable=False, default=False),
    Column("training_data_id", UUID(as_uuid=True), nullable=True),     # FK → training_data_uploads.id
    Column("created_at",       DateTime,     nullable=False, default=datetime.utcnow),
    Column("updated_at",       DateTime,     nullable=True),
)

# ── Training / Fine-tuning Data Uploads ────────────────────────────────────────
training_uploads_table = Table(
    "training_data_uploads", metadata,
    Column("id",              UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("ai_name",         String(300),  nullable=False),
    Column("ai_system_id",    UUID(as_uuid=True), nullable=True),   # FK -> ai_systems.id
    Column("owner_id",        UUID(as_uuid=True), nullable=False),
    Column("filename",        String(500),  nullable=True),
    Column("file_hash",       String(200),  nullable=True),
    Column("file_size_bytes", Integer,      nullable=True),
    Column("upload_type",     String(50),   nullable=True),  # "fine_tuning" | "training" | "eval"
    Column("row_count",       Integer,      nullable=True),
    Column("analysis",        JSONB,        nullable=True),  # bias metrics, representation stats, compute proxies
    Column("column_names",    JSONB,        nullable=True),  # detected columns
    Column("sample_rows",     JSONB,        nullable=True),  # first 5 rows for audit trail
    Column("status",          String(50),   nullable=False, default="pending"),  # pending | analysed | failed
    Column("created_at",      DateTime,     nullable=False, default=datetime.utcnow),
)

# ─────────────────────────────────────────────────────────────────────────────
#  Normalized report tables
#  ------------------------
#  reports_table.* JSONB blobs (trusted_ai_principles, model_metrics,
#  findings, framework_compliance, ...) stay in place unchanged so nothing
#  currently reading them breaks. The tables below are written *alongside*
#  that insert (see app/routes/ai_routes.py) so the same data also exists as
#  real, queryable, per-AI-system rows instead of only inside one opaque
#  JSON column. Every row carries both report_id and ai_system_id so it can
#  be filtered either "everything for this one audit" or "everything for
#  this AI system across every audit it has ever had".
# ─────────────────────────────────────────────────────────────────────────────

report_principle_scores_table = Table(
    "report_principle_scores", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",    UUID(as_uuid=True), nullable=False),   # FK -> reports.id
    Column("ai_system_id", UUID(as_uuid=True), nullable=True),    # FK -> ai_systems.id
    Column("owner_id",     UUID(as_uuid=True), nullable=False),
    Column("principle",    String(100),  nullable=False),         # Fairness, Security, ...
    Column("score",        Float,        nullable=True),
    Column("description",  Text,         nullable=True),
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
)

report_sub_parameters_table = Table(
    "report_sub_parameters", metadata,
    Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",      UUID(as_uuid=True), nullable=False),
    Column("ai_system_id",   UUID(as_uuid=True), nullable=True),
    Column("owner_id",       UUID(as_uuid=True), nullable=False),
    Column("principle",      String(100),  nullable=False),
    Column("sub_parameter",  String(200),  nullable=False),       # e.g. "Bias Measurement Coverage"
    Column("score",          Float,        nullable=True),        # 0-1 or 0-100 as produced by the calculator
    Column("definition",     Text,         nullable=True),        # human-readable description of what's measured
    Column("engine",         String(50),   nullable=True),        # "ml" | "heuristic" | null — which analysis tier produced it
    Column("created_at",     DateTime,     nullable=False, default=datetime.utcnow),
)

report_findings_table = Table(
    "report_findings", metadata,
    Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",      UUID(as_uuid=True), nullable=False),
    Column("ai_system_id",   UUID(as_uuid=True), nullable=True),
    Column("owner_id",       UUID(as_uuid=True), nullable=False),
    Column("category",       String(100),  nullable=True),
    Column("severity",       String(50),   nullable=True),
    Column("issue",          Text,         nullable=True),
    Column("recommendation", Text,         nullable=True),
    Column("finding_type",   String(50),   nullable=True),
    Column("created_at",     DateTime,     nullable=False, default=datetime.utcnow),
)

# Normalized recommended actions — one row per action, for timeline queries.
# recommended_actions JSONB on reports table is the denormalized read path;
# this table is the write-normalized source of truth.
report_recommended_actions_table = Table(
    "report_recommended_actions", metadata,
    Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",    UUID(as_uuid=True), nullable=False),   # FK -> reports.id
    Column("ai_system_id", UUID(as_uuid=True), nullable=True),
    Column("owner_id",     UUID(as_uuid=True), nullable=False),
    Column("principle",    String(100),  nullable=False),
    Column("action_text",  Text,         nullable=True),
    Column("effort",       String(20),   nullable=True),   # Low | Medium | High
    Column("impact",       String(30),   nullable=True),   # Quick win | Structural | Ongoing
    Column("day_target",   Integer,      nullable=True),   # absolute day (1-90+), Groq-proposed, phase-clamped
    Column("phase",        Integer,      nullable=True),   # 0=Immediate 1=Short-term 2=Ongoing
    Column("owner_team",   String(200),  nullable=True),
    Column("sort_order",   Integer,      nullable=True, default=0),
    Column("created_at",   DateTime,     nullable=False, default=datetime.utcnow),
)

report_framework_compliance_table = Table(
    "report_framework_compliance", metadata,
    Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",      UUID(as_uuid=True), nullable=False),
    Column("ai_system_id",   UUID(as_uuid=True), nullable=True),
    Column("owner_id",       UUID(as_uuid=True), nullable=False),
    Column("framework",      String(50),   nullable=False),       # EU_AI_Act | ISO_42001 | NIST_AI_RMF | KPMG_TAF
    Column("status",         String(50),   nullable=True),
    Column("overall_score",  Float,        nullable=True),
    Column("threshold",      Float,        nullable=True),
    Column("created_at",     DateTime,     nullable=False, default=datetime.utcnow),
)

report_framework_principle_scores_table = Table(
    "report_framework_principle_scores", metadata,
    Column("id",                       UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("framework_compliance_id",  UUID(as_uuid=True), nullable=False),   # FK -> report_framework_compliance.id
    Column("principle",                String(100), nullable=False),
    Column("score",                    Float,       nullable=True),
)

report_model_metrics_table = Table(
    "report_model_metrics", metadata,
    Column("id",                  UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",           UUID(as_uuid=True), nullable=False),
    Column("ai_system_id",        UUID(as_uuid=True), nullable=True),
    Column("owner_id",            UUID(as_uuid=True), nullable=False),
    Column("metric_key",          String(100), nullable=False),
    Column("value",               Float,       nullable=True),
    Column("risk_level",          String(50),  nullable=True),
    Column("unit",                String(50),  nullable=True),
    Column("description",         Text,        nullable=True),
    Column("threshold_low",       Float,       nullable=True),
    Column("threshold_moderate",  Float,       nullable=True),
    Column("higher_is_better",    Boolean,     nullable=True),
    Column("created_at",          DateTime,    nullable=False, default=datetime.utcnow),
)

# One row per Control Matrix entry per audit (mirrors TrustShieldAI_Taxonomy.xlsx
# "Control Matrix" sheet). Replaces the single JSONB `rows` array previously
# stored on taf_assessments — that column is left in place for compatibility,
# this table is the new source of truth for anything that needs to query,
# filter, or trend individual controls.
report_taxonomy_controls_table = Table(
    "report_taxonomy_controls", metadata,
    Column("id",                     UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("audit_id",               String(200),  nullable=False),   # reports.report_id or blackbox_audits.audit_id
    Column("report_id",              UUID(as_uuid=True), nullable=True),
    Column("ai_system_id",           UUID(as_uuid=True), nullable=True),
    Column("owner_id",               UUID(as_uuid=True), nullable=False),
    Column("numbered_id",            String(50),   nullable=False),   # e.g. GAI.FAIR.01
    Column("category",               String(10),   nullable=True),    # GAI | PAI | DM | PD | DP
    Column("category_full",          String(100),  nullable=True),
    Column("pillar",                 String(100),  nullable=True),    # Fairness, Security, ...
    Column("risk_description",       Text,         nullable=True),
    Column("test_description",       Text,         nullable=True),
    Column("base_mapped",            String(20),   nullable=True),    # Yes | Partial | No | N/A (from the static matrix)
    Column("computed_status",        String(30),   nullable=True),    # Covered | Partial | Not Covered | Training Unlocked | N/A
    Column("evidence",               Text,         nullable=True),
    Column("score",                  Float,        nullable=True),
    Column("score_source",           Text,         nullable=True),
    Column("training_gated",         Boolean,      nullable=True),    # True if this control needs training data to fully compute
    Column("evidence_chain",         Text,         nullable=True),    # code-path documentation from the Control Matrix
    Column("data_required",          Text,         nullable=True),    # why it's N/A / what's still needed, when applicable
    Column("created_at",             DateTime,     nullable=False, default=datetime.utcnow),
)

# ── LLM Judge Panel results ────────────────────────────────────────────────────
# Previously the per-row, per-judge votes/reasons computed by run_llm_judge()
# were used in-memory to derive an accuracy % and then discarded — only the
# aggregate (rows_judged, accuracy, panel_size) survived into reports.llm_judge.
# These two tables persist the actual panel deliberation.

llm_judge_row_verdicts_table = Table(
    "llm_judge_row_verdicts", metadata,
    Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("report_id",      UUID(as_uuid=True), nullable=False),
    Column("ai_system_id",   UUID(as_uuid=True), nullable=True),
    Column("owner_id",       UUID(as_uuid=True), nullable=False),
    Column("row_index",      Integer,      nullable=True),
    Column("task_id",        String(300),  nullable=True),
    Column("input",          Text,         nullable=True),
    Column("output",         Text,         nullable=True),
    Column("final_correct",  Boolean,      nullable=True),        # majority verdict across the panel
    Column("confidence",     String(20),   nullable=True),        # high | medium | low
    Column("disputed",       Boolean,      nullable=True),        # panel split evenly
    Column("kb_used",        Boolean,      nullable=True),        # graded against a KB chunk vs. direct judgement
    Column("created_at",     DateTime,     nullable=False, default=datetime.utcnow),
)

llm_judge_votes_table = Table(
    "llm_judge_votes", metadata,
    Column("id",              UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("row_verdict_id",  UUID(as_uuid=True), nullable=False),   # FK -> llm_judge_row_verdicts.id
    Column("judge_name",      String(100),  nullable=False),         # e.g. "Groq/GPT-OSS-120B"
    Column("vote",            Boolean,      nullable=True),          # this judge's individual correct/incorrect call
    Column("reason",          Text,         nullable=True),          # this judge's stated reasoning
    Column("latency_ms",      Float,        nullable=True),          # this judge's individual round-trip time
    Column("created_at",      DateTime,     nullable=False, default=datetime.utcnow),
)

# Knowledge-base context used to ground the LLM judge panel, normalized out of
# the sdcc_results.kb_chunks JSONB array so context is versioned per AI system
# instead of overwritten wholesale on every re-ingest.
knowledge_base_chunks_table = Table(
    "knowledge_base_chunks", metadata,
    Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("ai_system_id",   UUID(as_uuid=True), nullable=True),
    Column("ai_name",        String(300),  nullable=False),
    Column("owner_id",       UUID(as_uuid=True), nullable=False),
    Column("chunk_index",    Integer,      nullable=True),
    Column("content",        Text,         nullable=True),
    Column("source",         String(300),  nullable=True),
    Column("created_at",     DateTime,     nullable=False, default=datetime.utcnow),
)

Index("ix_taf_audit_id",      taf_assessments_table.c.audit_id)
Index("ix_taf_ai_owner",      taf_assessments_table.c.ai_name, taf_assessments_table.c.owner_id)
Index("ix_train_ai_owner",    training_uploads_table.c.ai_name, training_uploads_table.c.owner_id)

# Indexes for fast look-ups
Index("ix_users_email",          users_table.c.email)
Index("ix_ai_systems_owner",     ai_systems_table.c.owner_id)
Index("ix_ai_systems_name_owner",ai_systems_table.c.name, ai_systems_table.c.owner_id)
Index("ix_sdcc_ai_owner",        sdcc_results_table.c.ai_name, sdcc_results_table.c.owner_id)
Index("ix_reports_owner",        reports_table.c.owner_id)
Index("ix_reports_ai_name",      reports_table.c.ai_name)
Index("ix_blackbox_ai_owner",    blackbox_audits_table.c.ai_name, blackbox_audits_table.c.owner_id)
Index("ix_probe_logs_audit",     probe_logs_table.c.audit_id)
Index("ix_probe_logs_ai",        probe_logs_table.c.ai_name)

# ai_system_id look-ups — the primary "everything for this AI system" path
Index("ix_sdcc_ai_system",       sdcc_results_table.c.ai_system_id)
Index("ix_reports_ai_system",    reports_table.c.ai_system_id)
Index("ix_blackbox_ai_system",   blackbox_audits_table.c.ai_system_id)
Index("ix_probe_logs_ai_system", probe_logs_table.c.ai_system_id)
Index("ix_taf_ai_system",        taf_assessments_table.c.ai_system_id)
Index("ix_train_ai_system",      training_uploads_table.c.ai_system_id)

Index("ix_uploaded_logs_ai_system",  uploaded_logs_table.c.ai_system_id)
Index("ix_uploaded_logs_ai_name",    uploaded_logs_table.c.ai_name, uploaded_logs_table.c.owner_id)
Index("ix_probe_run_logs_ai_system", probe_run_logs_table.c.ai_system_id)
Index("ix_probe_run_logs_audit",     probe_run_logs_table.c.audit_id)
Index("ix_chat_logs_ai_system",      chat_logs_table.c.ai_system_id)
Index("ix_chat_logs_session",        chat_logs_table.c.session_id)

Index("ix_rpts_principle_report",    report_principle_scores_table.c.report_id)
Index("ix_rpts_principle_ai_system", report_principle_scores_table.c.ai_system_id)
Index("ix_rpts_subparam_report",     report_sub_parameters_table.c.report_id)
Index("ix_rpts_subparam_ai_system",  report_sub_parameters_table.c.ai_system_id)
Index("ix_rpts_findings_report",     report_findings_table.c.report_id)
Index("ix_rpts_findings_ai_system",  report_findings_table.c.ai_system_id)
Index("ix_rpts_framework_report",    report_framework_compliance_table.c.report_id)
Index("ix_rpts_framework_ai_system", report_framework_compliance_table.c.ai_system_id)
Index("ix_rpts_fw_pscores_fw_id",    report_framework_principle_scores_table.c.framework_compliance_id)
Index("ix_rpts_metrics_report",      report_model_metrics_table.c.report_id)
Index("ix_rpts_metrics_ai_system",   report_model_metrics_table.c.ai_system_id)
Index("ix_rpts_taxctrl_audit",       report_taxonomy_controls_table.c.audit_id)
Index("ix_rpts_taxctrl_ai_system",   report_taxonomy_controls_table.c.ai_system_id)
Index("ix_rpts_taxctrl_control_id",  report_taxonomy_controls_table.c.numbered_id)
Index("ix_judge_verdicts_report",    llm_judge_row_verdicts_table.c.report_id)
Index("ix_judge_verdicts_ai_system", llm_judge_row_verdicts_table.c.ai_system_id)
Index("ix_judge_votes_verdict",      llm_judge_votes_table.c.row_verdict_id)
Index("ix_judge_votes_judge_name",   llm_judge_votes_table.c.judge_name)
Index("ix_kb_chunks_ai_system",      knowledge_base_chunks_table.c.ai_system_id)
Index("ix_kb_chunks_ai_name",        knowledge_base_chunks_table.c.ai_name, knowledge_base_chunks_table.c.owner_id)

# Create all tables on startup (idempotent)
def init_db() -> None:
    metadata.create_all(engine)


# ── FastAPI session dependency ─────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
#  PgCollection — thin shim that exposes the MongoDB-style dict API
#  so the existing routes don't need to be rewritten from scratch.
#
#  Supported: find_one, insert_one, update_one, find, count_documents
# ─────────────────────────────────────────────────────────────────────────────

def _uuid_str(val) -> Optional[str]:
    """Normalise a UUID object or string to plain str, None if falsy."""
    if val is None:
        return None
    return str(val)


def _row_to_dict(row) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    d = dict(row._mapping)
    # Normalise UUID fields to strings (mimics MongoDB _id behaviour)
    if "id" in d:
        d["_id"] = str(d["id"])
    for k, v in list(d.items()):
        if isinstance(v, uuid.UUID):
            d[k] = str(v)
    return d


def _build_where(table: Table, filter_dict: Dict[str, Any]):
    """Convert a simple {col: val} filter dict to a SQLAlchemy WHERE clause."""
    conditions = []
    for key, val in filter_dict.items():
        col_name = "id" if key == "_id" else key
        if col_name not in table.c:
            # For JSONB columns, do a containment check
            for col in table.c:
                if col.type.__class__.__name__ == "JSONB":
                    conditions.append(
                        col.op("@>")(json.dumps({key: val}))
                    )
                    break
            continue
        col = table.c[col_name]
        if isinstance(val, str):
            # Try to cast to UUID if column is UUID
            try:
                if col.type.__class__.__name__ in ("UUID",):
                    val = uuid.UUID(val)
            except (ValueError, AttributeError):
                pass
        conditions.append(col == val)
    return conditions


class PgCollection:
    """
    Wraps a SQLAlchemy Table to expose a subset of the PyMongo Collection API.
    All operations run in auto-committed short transactions.
    """

    def __init__(self, table: Table):
        self._table = table

    # ── find_one ──────────────────────────────────────────────────────────────
    def find_one(
        self,
        filter_dict: Dict[str, Any] = None,
        projection: Dict[str, Any] = None,
        sort: List[tuple] = None,
    ) -> Optional[Dict[str, Any]]:
        filter_dict = filter_dict or {}
        with engine.connect() as conn:
            q = self._table.select()
            for cond in _build_where(self._table, filter_dict):
                q = q.where(cond)
            if sort:
                for col_name, direction in sort:
                    col = self._table.c.get(col_name)
                    if col is not None:
                        q = q.order_by(col.desc() if direction == -1 else col.asc())
            q = q.limit(1)
            row = conn.execute(q).fetchone()
        return _row_to_dict(row)

    # ── find ──────────────────────────────────────────────────────────────────
    def find(
        self,
        filter_dict: Dict[str, Any] = None,
        projection: Dict[str, Any] = None,
        sort: List[tuple] = None,
        limit: int = 0,
    ) -> List[Dict[str, Any]]:
        filter_dict = filter_dict or {}
        with engine.connect() as conn:
            q = self._table.select()
            for cond in _build_where(self._table, filter_dict):
                q = q.where(cond)
            if sort:
                for col_name, direction in sort:
                    col = self._table.c.get(col_name)
                    if col is not None:
                        q = q.order_by(col.desc() if direction == -1 else col.asc())
            if limit:
                q = q.limit(limit)
            rows = conn.execute(q).fetchall()
        return [_row_to_dict(r) for r in rows]

    # ── insert_one ────────────────────────────────────────────────────────────
    def insert_one(self, doc: Dict[str, Any]) -> Any:
        """
        Insert a document dict. Maps _id → id (UUID). Returns an object with
        .inserted_id (str) to mirror pymongo InsertOneResult.
        """
        row = _strip_nulls(dict(doc))  # strip null bytes before Postgres insert

        # Remap _id → id
        if "_id" in row:
            row["id"] = row.pop("_id")
        if "id" not in row or row["id"] is None:
            row["id"] = uuid.uuid4()
        elif isinstance(row["id"], str):
            try:
                row["id"] = uuid.UUID(row["id"])
            except ValueError:
                row["id"] = uuid.uuid4()

        # Normalise owner_id
        if "owner_id" in row and isinstance(row["owner_id"], str):
            try:
                row["owner_id"] = uuid.UUID(row["owner_id"])
            except ValueError:
                pass

        # Drop keys that don't exist as columns (JSONB overflow → extra)
        cols = {c.name for c in self._table.c}
        overflow: Dict[str, Any] = {}
        clean: Dict[str, Any] = {}
        for k, v in row.items():
            if k in cols:
                clean[k] = v
            else:
                overflow[k] = v

        if overflow and "extra" in cols:
            # Merge into extra JSONB
            existing_extra = clean.get("extra") or {}
            if isinstance(existing_extra, str):
                existing_extra = json.loads(existing_extra)
            existing_extra.update(overflow)
            clean["extra"] = existing_extra

        with engine.begin() as conn:
            conn.execute(self._table.insert().values(**clean))

        class _Result:
            inserted_id = str(clean["id"])

        return _Result()

    # ── update_one ────────────────────────────────────────────────────────────
    def update_one(
        self,
        filter_dict: Dict[str, Any],
        update_doc: Dict[str, Any],
        upsert: bool = False,
    ) -> Any:
        """
        Supports $set and $inc update operators (same as pymongo).
        If upsert=True and no row found, inserts a new row.
        """
        existing = self.find_one(filter_dict)

        set_vals = _strip_nulls(update_doc.get("$set", {}))  # strip null bytes
        inc_vals = update_doc.get("$inc", {})

        if existing is None:
            if not upsert:
                class _R:
                    matched_count = 0
                    modified_count = 0
                return _R()
            # Upsert: build a new doc from filter + $set
            new_doc = {k: v for k, v in filter_dict.items()}
            new_doc.update(set_vals)
            for k, v in inc_vals.items():
                new_doc[k] = new_doc.get(k, 0) + v
            self.insert_one(new_doc)
            class _R:
                matched_count = 1
                modified_count = 1
            return _R()

        row_id = existing.get("id") or existing.get("_id")
        cols = {c.name for c in self._table.c}

        with engine.begin() as conn:
            if set_vals:
                clean_set: Dict[str, Any] = {}
                overflow_set: Dict[str, Any] = {}
                for k, v in set_vals.items():
                    col_key = "id" if k == "_id" else k
                    if col_key in cols:
                        clean_set[col_key] = v
                    else:
                        overflow_set[k] = v

                if overflow_set and "extra" in cols:
                    # Merge into JSONB extra using PostgreSQL jsonb_set / ||
                    # We do a simple Python-level merge since rows are small
                    extra_row = self.find_one({"id": row_id} if row_id else filter_dict)
                    existing_extra = (extra_row or {}).get("extra") or {}
                    if isinstance(existing_extra, str):
                        existing_extra = json.loads(existing_extra)
                    existing_extra.update(overflow_set)
                    clean_set["extra"] = existing_extra

                if clean_set:
                    try:
                        row_uuid = uuid.UUID(str(row_id))
                    except (ValueError, TypeError):
                        row_uuid = row_id
                    q = (
                        self._table.update()
                        .where(self._table.c.id == row_uuid)
                        .values(**clean_set)
                    )
                    conn.execute(q)

            if inc_vals:
                for k, v in inc_vals.items():
                    if k in cols:
                        try:
                            row_uuid = uuid.UUID(str(row_id))
                        except (ValueError, TypeError):
                            row_uuid = row_id
                        col = self._table.c[k]
                        conn.execute(
                            self._table.update()
                            .where(self._table.c.id == row_uuid)
                            .values({k: col + v})
                        )

        class _R:
            matched_count = 1
            modified_count = 1
        return _R()

    # ── delete_many ───────────────────────────────────────────────────────────
    def delete_many(self, filter_dict: Dict[str, Any]) -> Any:
        """
        Deletes every row matching filter_dict. Requires a non-empty filter —
        this is a full-table wipe otherwise, which no current caller wants.
        Returns an object with .deleted_count to mirror pymongo's DeleteResult.
        """
        if not filter_dict:
            raise ValueError("delete_many requires a non-empty filter_dict (refusing to wipe the whole table).")
        with engine.begin() as conn:
            q = self._table.delete()
            for cond in _build_where(self._table, filter_dict):
                q = q.where(cond)
            result = conn.execute(q)

        class _R:
            deleted_count = result.rowcount

        return _R()

    # ── count_documents ───────────────────────────────────────────────────────
    def count_documents(self, filter_dict: Dict[str, Any] = None) -> int:
        filter_dict = filter_dict or {}
        with engine.connect() as conn:
            q = self._table.select()
            for cond in _build_where(self._table, filter_dict):
                q = q.where(cond)
            rows = conn.execute(q).fetchall()
        return len(rows)


# ── Public collection objects (drop-in replacements for MongoDB collections) ───

users_collection          = PgCollection(users_table)
ai_collection             = PgCollection(ai_systems_table)
sdcc_collection           = PgCollection(sdcc_results_table)
reports_collection        = PgCollection(reports_table)
audit_results_collection  = PgCollection(report_audit_results_table)
blackbox_collection       = PgCollection(blackbox_audits_table)
probe_logs_collection     = PgCollection(probe_logs_table)
taf_assessments_collection  = PgCollection(taf_assessments_table)
audit_evidence_collection   = PgCollection(audit_evidence_table)
training_uploads_collection = PgCollection(training_uploads_table)

uploaded_logs_collection    = PgCollection(uploaded_logs_table)
probe_run_logs_collection   = PgCollection(probe_run_logs_table)
chat_logs_collection        = PgCollection(chat_logs_table)

report_principle_scores_collection           = PgCollection(report_principle_scores_table)
report_sub_parameters_collection             = PgCollection(report_sub_parameters_table)
report_findings_collection                   = PgCollection(report_findings_table)
report_framework_compliance_collection       = PgCollection(report_framework_compliance_table)
report_framework_principle_scores_collection = PgCollection(report_framework_principle_scores_table)
report_model_metrics_collection              = PgCollection(report_model_metrics_table)
report_taxonomy_controls_collection          = PgCollection(report_taxonomy_controls_table)
llm_judge_row_verdicts_collection            = PgCollection(llm_judge_row_verdicts_table)
llm_judge_votes_collection                   = PgCollection(llm_judge_votes_table)
knowledge_base_chunks_collection             = PgCollection(knowledge_base_chunks_table)

# Alias used by blackbox_routes.py: `from app.database import db`
class _DbShim:
    """Shim so `db["collection_name"]` still works."""
    _MAP = {
        "users":                users_collection,
        "ai_systems":           ai_collection,
        "sdcc_results":         sdcc_collection,
        "reports":              reports_collection,
        "report_audit_results": audit_results_collection,
        "blackbox_audits":      blackbox_collection,
        "probe_logs":           probe_logs_collection,
        "taf_assessments":      taf_assessments_collection,
        "training_uploads":     training_uploads_collection,
        "uploaded_logs":        uploaded_logs_collection,
        "probe_run_logs":       probe_run_logs_collection,
        "chat_logs":            chat_logs_collection,
        "report_principle_scores":           report_principle_scores_collection,
        "report_sub_parameters":             report_sub_parameters_collection,
        "report_findings":                   report_findings_collection,
        "report_framework_compliance":       report_framework_compliance_collection,
        "report_framework_principle_scores": report_framework_principle_scores_collection,
        "report_model_metrics":              report_model_metrics_collection,
        "report_taxonomy_controls":          report_taxonomy_controls_collection,
        "llm_judge_row_verdicts":            llm_judge_row_verdicts_collection,
        "llm_judge_votes":                   llm_judge_votes_collection,
        "knowledge_base_chunks":             knowledge_base_chunks_collection,
    }

    def __getitem__(self, name: str) -> PgCollection:
        if name not in self._MAP:
            raise KeyError(
                f"Collection '{name}' not mapped in PgCollection shim. "
                f"Add it to database.py _DbShim._MAP."
            )
        return self._MAP[name]


db = _DbShim()


# Initialise tables on import
init_db()