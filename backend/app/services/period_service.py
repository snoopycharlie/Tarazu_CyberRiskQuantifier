"""
services/period_service.py — Period-adjustment helper for Tarazu EAL figures.

All risk figures are stored and computed as annual amounts (EAL = Expected
Annual Loss).  This pure module converts an annual figure to any other period
without touching the database or altering the canonical storage value.
"""
from __future__ import annotations

SUPPORTED_PERIODS = {"annual", "weekly", "monthly", "custom"}


def to_period(annual: float, period: str = "annual", days: int = 0) -> float:
    """
    Convert an annual EAL/delta figure to the requested period.

    Args:
        annual: The annualised figure in any currency (caller's responsibility).
        period: One of "annual" (default), "weekly", "monthly", "custom".
        days:   Required when period="custom"; ignored otherwise.

    Returns:
        The period-adjusted figure (same currency units as input).

    Raises:
        ValueError: if period is not in SUPPORTED_PERIODS.
        ValueError: if period="custom" and days < 1.
    """
    period = period.lower()
    if period not in SUPPORTED_PERIODS:
        raise ValueError(
            f"Unsupported period '{period}'. "
            f"Supported: {sorted(SUPPORTED_PERIODS)}"
        )

    if period == "annual":
        return annual
    if period == "weekly":
        return annual / 52
    if period == "monthly":
        return annual / 12
    # period == "custom"
    days = max(int(days), 1)
    return annual / 365 * days


def period_label(period: str, days: int = 0) -> str:
    """Return a human-readable label for the selected period."""
    mapping = {
        "annual": "Annual",
        "weekly": "Weekly",
        "monthly": "Monthly",
    }
    if period == "custom":
        return f"{max(int(days), 1)}-Day"
    return mapping.get(period.lower(), period.capitalize())
