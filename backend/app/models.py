"""
app/models.py — SQLAlchemy ORM models for Tarazu CyberRiskQuant.

All IDs use strings (UUIDs) for cross-DB compatibility (SQLite + PostgreSQL).
JSONs stored as TEXT in SQLite, JSON in PostgreSQL — handled by JSON type.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Text, ForeignKey,
    JSON, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Enums ─────────────────────────────────────────────────────────────────────

class SectorEnum:
    BFSI = "BFSI"
    Healthcare = "Healthcare"
    Manufacturing = "Manufacturing"
    IT_SaaS = "IT-SaaS"
    Other = "Other"
    values = ["BFSI", "Healthcare", "Manufacturing", "IT-SaaS", "Other"]

class SizeTierEnum:
    MSME = "MSME"
    Mid = "Mid"
    Enterprise = "Enterprise"
    values = ["MSME", "Mid", "Enterprise"]

class SheetTypeEnum:
    base = "base"
    combined = "combined"
    values = ["base", "combined"]

class ControlStatusEnum:
    present = "present"
    absent = "absent"
    partial = "partial"
    values = ["present", "absent", "partial"]

class VulnSourceEnum:
    manual = "manual"
    scan = "scan"
    cve_match = "cve_match"
    values = ["manual", "scan", "cve_match"]

class DependencyStrengthEnum:
    weak = "weak"
    moderate = "moderate"
    strong = "strong"
    values = ["weak", "moderate", "strong"]

class FrameworkEnum:
    ISO27001 = "ISO27001"
    RBI_CSF = "RBI_CSF"
    values = ["ISO27001", "RBI_CSF"]

class ComplianceStatusEnum:
    satisfied = "satisfied"
    gap = "gap"
    values = ["satisfied", "gap"]


# ── Models ────────────────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sector: Mapped[str] = mapped_column(String(50), nullable=False, default="BFSI")
    size_tier: Mapped[str] = mapped_column(String(20), nullable=False, default="Mid")
    employee_count: Mapped[int] = mapped_column(Integer, default=100)
    annual_revenue_inr: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    sheets: Mapped[list["Sheet"]] = relationship("Sheet", back_populates="organization", cascade="all, delete-orphan")
    controls: Mapped[list["Control"]] = relationship("Control", back_populates="organization", cascade="all, delete-orphan")
    recommendations: Mapped[list["Recommendation"]] = relationship("Recommendation", back_populates="organization", cascade="all, delete-orphan")
    compliance_gaps: Mapped[list["ComplianceGap"]] = relationship("ComplianceGap", back_populates="organization", cascade="all, delete-orphan")


class Sheet(Base):
    __tablename__ = "sheets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="base")
    source_sheet_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    is_org_wide_included: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="sheets")
    assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="sheet", cascade="all, delete-orphan")
    risk_scores: Mapped[list["RiskScore"]] = relationship("RiskScore", back_populates="sheet", cascade="all, delete-orphan")
    graph_edges: Mapped[list["GraphEdge"]] = relationship("GraphEdge", back_populates="sheet", cascade="all, delete-orphan")


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sheet_id: Mapped[str] = mapped_column(String(36), ForeignKey("sheets.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(100), nullable=False, default="Server")
    criticality_tag: Mapped[str] = mapped_column(String(100), nullable=False, default="standard")
    revenue_dependency_pct: Mapped[float] = mapped_column(Float, default=5.0)
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    sheet: Mapped["Sheet"] = relationship("Sheet", back_populates="assets")
    vulnerabilities: Mapped[list["Vulnerability"]] = relationship("Vulnerability", back_populates="asset", cascade="all, delete-orphan")
    risk_scores: Mapped[list["RiskScore"]] = relationship("RiskScore", back_populates="asset", cascade="all, delete-orphan")


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    cve_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    cvss_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    days_unpatched: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="vulnerabilities")


class Control(Base):
    __tablename__ = "controls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="absent")
    cost_inr: Mapped[float] = mapped_column(Float, default=0.0)
    framework_clause_refs: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="controls")
    recommendations: Mapped[list["Recommendation"]] = relationship("Recommendation", back_populates="control", cascade="all, delete-orphan")
    compliance_gaps: Mapped[list["ComplianceGap"]] = relationship("ComplianceGap", back_populates="linked_control", cascade="all, delete-orphan")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sheet_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("sheets.id"), nullable=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("assets.id"), nullable=True)
    expected_annual_loss_inr: Mapped[float] = mapped_column(Float, default=0.0)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    rule_trace: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    ai_narrative: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_adjustment_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_mode: Mapped[str] = mapped_column(String(30), default="rules_only")  # "rules_only" | "ai_assisted"

    sheet: Mapped[Optional["Sheet"]] = relationship("Sheet", back_populates="risk_scores")
    asset: Mapped[Optional["Asset"]] = relationship("Asset", back_populates="risk_scores")


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sheet_id: Mapped[str] = mapped_column(String(36), ForeignKey("sheets.id"), nullable=False)
    source_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    target_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    dependency_strength: Mapped[str] = mapped_column(String(20), nullable=False, default="moderate")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    sheet: Mapped["Sheet"] = relationship("Sheet", back_populates="graph_edges")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False)
    control_id: Mapped[str] = mapped_column(String(36), ForeignKey("controls.id"), nullable=False)
    risk_reduction_inr: Mapped[float] = mapped_column(Float, default=0.0)
    cost_inr: Mapped[float] = mapped_column(Float, default=0.0)
    roi_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    ai_rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="recommendations")
    control: Mapped["Control"] = relationship("Control", back_populates="recommendations")


class ComplianceGap(Base):
    __tablename__ = "compliance_gaps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False)
    framework: Mapped[str] = mapped_column(String(50), nullable=False)
    clause_ref: Mapped[str] = mapped_column(String(50), nullable=False)
    clause_title: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="gap")
    linked_control_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("controls.id"), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="compliance_gaps")
    linked_control: Mapped[Optional["Control"]] = relationship("Control", back_populates="compliance_gaps")
