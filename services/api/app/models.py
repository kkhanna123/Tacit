"""Enterprise Mind core object ledger.

Typed, versioned, permissioned objects — not chat blobs. See docs/data-model.md.
"""
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import JSON, Column, Text
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Org(SQLModel, table=True):
    __tablename__ = "orgs"
    id: str = Field(primary_key=True)
    name: str
    slug: str
    plan: str = "demo"
    created_at: datetime = Field(default_factory=utcnow)


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: str = Field(primary_key=True)
    email: str
    name: str
    created_at: datetime = Field(default_factory=utcnow)


class OrgMembership(SQLModel, table=True):
    __tablename__ = "org_memberships"
    id: str = Field(primary_key=True)
    org_id: str = Field(foreign_key="orgs.id")
    user_id: str = Field(foreign_key="users.id")
    role: str = "user"  # owner | admin | builder | user | viewer
    status: str = "active"


class Project(SQLModel, table=True):
    __tablename__ = "projects"
    id: str = Field(primary_key=True)
    org_id: str = Field(foreign_key="orgs.id")
    name: str
    description: str = ""
    department: str = ""
    default_provider: str = "mock"
    default_model: str = "mock-demo-1"
    visibility: str = "org"
    created_by: str = ""
    created_at: datetime = Field(default_factory=utcnow)


class IntentNode(SQLModel, table=True):
    __tablename__ = "intent_nodes"
    id: str = Field(primary_key=True)
    org_id: str = Field(foreign_key="orgs.id")
    project_id: Optional[str] = Field(default=None, foreign_key="projects.id")
    parent_id: Optional[str] = None
    # org | department | project | workflow | task | artifact | convention |
    # guardrail | source | output_schema
    node_type: str
    title: str
    summary: str = ""
    body: str = Field(default="", sa_column=Column(Text))
    canonical_context: list = Field(default_factory=list, sa_column=Column(JSON))
    constraints: dict = Field(default_factory=dict, sa_column=Column(JSON))
    output_preferences: list = Field(default_factory=list, sa_column=Column(JSON))
    source_refs: list = Field(default_factory=list, sa_column=Column(JSON))
    tags: list = Field(default_factory=list, sa_column=Column(JSON))
    priority: int = 100
    token_budget: int = 400
    visibility: str = "project"
    version: int = 1
    status: str = "active"


class ContextPack(SQLModel, table=True):
    __tablename__ = "context_packs"
    id: str = Field(primary_key=True)
    org_id: str
    project_id: str
    name: str
    description: str = ""
    manifest_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    compiled_text: str = Field(default="", sa_column=Column(Text))
    token_estimate: int = 0
    source_intent_node_ids: list = Field(default_factory=list, sa_column=Column(JSON))
    version: int = 1
    status: str = "active"
    created_at: datetime = Field(default_factory=utcnow)


class Skill(SQLModel, table=True):
    __tablename__ = "skills"
    id: str = Field(primary_key=True)
    org_id: str
    name: str
    slug: str
    description: str = ""
    owner_user_id: str = ""
    owner_label: str = ""  # e.g. "Portfolio Ops" — shown in library cards
    visibility: str = "org"  # private | project | org
    current_version_id: Optional[str] = None
    status: str = "approved"  # draft | review | approved | deprecated


class SkillVersion(SQLModel, table=True):
    __tablename__ = "skill_versions"
    id: str = Field(primary_key=True)
    skill_id: str = Field(foreign_key="skills.id")
    version_semver: str
    manifest_yaml: str = Field(default="", sa_column=Column(Text))
    skill_md: str = Field(default="", sa_column=Column(Text))
    system_instructions: str = Field(default="", sa_column=Column(Text))
    input_schema_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    output_schema_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    examples_json: list = Field(default_factory=list, sa_column=Column(JSON))
    validators_json: list = Field(default_factory=list, sa_column=Column(JSON))
    rails_json: list = Field(default_factory=list, sa_column=Column(JSON))
    token_budget: int = 900
    compatible_providers: list = Field(default_factory=list, sa_column=Column(JSON))
    checksum: str = ""
    release_notes: str = ""
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)


class SkillInstall(SQLModel, table=True):
    __tablename__ = "skill_installs"
    id: str = Field(primary_key=True)
    skill_id: str = Field(foreign_key="skills.id")
    project_id: str = Field(foreign_key="projects.id")
    installed_by: str = ""
    created_at: datetime = Field(default_factory=utcnow)


class Harness(SQLModel, table=True):
    __tablename__ = "harnesses"
    id: str = Field(primary_key=True)
    org_id: str
    project_id: Optional[str] = None
    skill_id: Optional[str] = None
    name: str
    description: str = ""
    config_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    status: str = "active"


class HarnessCase(SQLModel, table=True):
    __tablename__ = "harness_cases"
    id: str = Field(primary_key=True)
    harness_id: str = Field(foreign_key="harnesses.id")
    name: str
    input_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    expected_properties_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    validators_json: list = Field(default_factory=list, sa_column=Column(JSON))
    tags: list = Field(default_factory=list, sa_column=Column(JSON))


class Run(SQLModel, table=True):
    __tablename__ = "runs"
    id: str = Field(primary_key=True)
    org_id: str
    project_id: str
    user_id: str
    run_mode: str  # baseline | enterprise_mind
    provider: str = "mock"
    model: str = "mock-demo-1"
    raw_user_request: str = Field(default="", sa_column=Column(Text))
    normalized_intent: dict = Field(default_factory=dict, sa_column=Column(JSON))
    selected_skill_version_id: Optional[str] = None
    selected_context_pack_id: Optional[str] = None
    compiled_prompt_hash: str = ""
    status: str = "draft"  # draft | running | passed | failed | repaired
    token_estimate_input: int = 0
    token_actual_input: int = 0
    token_actual_output: int = 0
    baseline_token_estimate: int = 0
    cost_estimate: float = 0.0
    quality_score: Optional[float] = None
    harness_pass_count: int = 0
    harness_fail_count: int = 0
    repairs_applied: int = 0
    created_at: datetime = Field(default_factory=utcnow)


class RunStep(SQLModel, table=True):
    __tablename__ = "run_steps"
    id: str = Field(primary_key=True)
    run_id: str = Field(foreign_key="runs.id")
    # intent_route | context_compile | preflight | provider_call | postprocess |
    # repair | final_validate
    step_type: str
    input_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    output_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    status: str = "ok"
    latency_ms: int = 0
    seq: int = 0
    created_at: datetime = Field(default_factory=utcnow)


class OutputArtifact(SQLModel, table=True):
    __tablename__ = "output_artifacts"
    id: str = Field(primary_key=True)
    run_id: str = Field(foreign_key="runs.id")
    artifact_type: str = "markdown"  # text | markdown | json | file | table
    content: str = Field(default="", sa_column=Column(Text))
    validation_status: str = "pending"  # pending | passed | failed | repaired
    is_final: bool = False
    created_at: datetime = Field(default_factory=utcnow)


class Learning(SQLModel, table=True):
    __tablename__ = "learnings"
    id: str = Field(primary_key=True)
    org_id: str
    project_id: Optional[str] = None
    source_run_ids: list = Field(default_factory=list, sa_column=Column(JSON))
    # prompt_patch | new_rail | context_fact | skill_update | harness_case |
    # style_preference
    learning_type: str
    title: str
    body: str = Field(default="", sa_column=Column(Text))
    evidence_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    confidence: float = 0.5
    proposed_by: str = "system"
    status: str = "proposed"  # proposed | approved | rejected | archived
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)


class AuditEvent(SQLModel, table=True):
    __tablename__ = "audit_events"
    id: str = Field(primary_key=True)
    org_id: str
    actor_user_id: str = ""
    action: str
    object_type: str
    object_id: str
    before_json: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    after_json: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=utcnow)
