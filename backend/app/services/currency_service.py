"""
services/currency_service.py — Multi-currency display layer for Tarazu.

Storage currency is always INR (column names unchanged).
This service handles conversion and pre-formatted display strings so the
frontend never needs to run FX math or number formatting itself.

To plug in a live FX API later, replace the static FX_RATES dict with a
call to e.g. https://api.exchangerate.host/latest?base=INR&symbols=USD,EUR,GBP,AED,SGD
and cache the result for 15 minutes.
"""
from __future__ import annotations

# ── Static FX rates (INR → target currency) ───────────────────────────────────
# Last updated: 2026-09 approximate mid-market rates.
# Replace with a live API call when production-readiness requires it.
FX_RATES: dict[str, float] = {
    "INR": 1.0,
    "USD": 0.01196,   # 1 INR ≈ 0.01196 USD
    "EUR": 0.01098,   # 1 INR ≈ 0.01098 EUR
    "GBP": 0.00939,   # 1 INR ≈ 0.00939 GBP
    "AED": 0.04391,   # 1 INR ≈ 0.04391 AED
    "SGD": 0.01604,   # 1 INR ≈ 0.01604 SGD
}

CURRENCY_SYMBOLS: dict[str, str] = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "AED": "AED ",
    "SGD": "S$",
}

SUPPORTED_CURRENCIES = set(FX_RATES.keys())


# ── INR lakh / crore formatter (ported from frontend/src/utils/format.ts) ─────

def _format_inr(val: float) -> str:
    """
    Format an INR value in human-readable lakh/crore notation.
    Mirrors frontend formatInr() exactly so outputs match when currency=INR.
    """
    if val >= 10_000_000:
        return f"₹{val / 10_000_000:.2f} Crore"
    if val >= 100_000:
        return f"₹{val / 100_000:.2f} Lakh"
    if val >= 1_000:
        return f"₹{val / 1_000:.1f} Thousand"
    return f"₹{round(val):,}"


def _format_inr_compact(val: float) -> str:
    """
    Compact INR format for tight spaces.
    Mirrors frontend formatInrCompact() exactly.
    """
    if val >= 10_000_000:
        return f"₹{val / 10_000_000:.1f} Cr"
    if val >= 100_000:
        return f"₹{val / 100_000:.1f} L"
    return f"₹{round(val):,}"


def _format_foreign(val: float, currency: str) -> str:
    """Format a converted foreign-currency value with symbol and comma separators."""
    symbol = CURRENCY_SYMBOLS.get(currency, currency + " ")
    if abs(val) >= 1_000_000:
        return f"{symbol}{val / 1_000_000:.2f}M"
    if abs(val) >= 1_000:
        return f"{symbol}{val:,.2f}"
    return f"{symbol}{val:.2f}"


# ── Public API ─────────────────────────────────────────────────────────────────

def convert_and_format(amount_inr: float, currency: str = "INR") -> dict:
    """
    Convert an INR amount to the requested currency and return both the raw
    numeric value and a pre-formatted display string.

    Returns:
        {"value": float, "formatted": str}

    The frontend should always render ``formatted`` directly — no client-side
    conversion or number formatting needed.

    Raises:
        ValueError: if the requested currency is not in SUPPORTED_CURRENCIES.
    """
    currency = currency.upper()
    if currency not in SUPPORTED_CURRENCIES:
        raise ValueError(
            f"Unsupported currency '{currency}'. "
            f"Supported: {sorted(SUPPORTED_CURRENCIES)}"
        )

    rate = FX_RATES[currency]
    converted = amount_inr * rate

    if currency == "INR":
        formatted = _format_inr(amount_inr)
    else:
        formatted = _format_foreign(converted, currency)

    return {"value": round(converted, 4), "formatted": formatted}
