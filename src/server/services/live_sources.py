"""Public, read-only market adapters. No API key is required for Polymarket Gamma markets."""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any

import httpx

POLYMARKET_MARKETS_URL = "https://gamma-api.polymarket.com/markets"


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _list_value(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []


def _category(raw: dict[str, Any]) -> str:
    category = str(raw.get("category") or "other").strip().lower()
    return category if category else "other"


def fetch_polymarket_markets(limit: int = 100) -> list[dict[str, Any]]:
    """Fetch active, open markets sorted by volume and normalize them for NextSignal.

    Probabilities come from Polymarket's current outcome prices. This endpoint is public;
    this adapter intentionally does not claim to provide historical price series or outcomes.
    """
    params = {
        "active": "true",
        "closed": "false",
        "limit": max(1, min(limit, 100)),
        "order": "volumeNum",
        "ascending": "false",
    }
    headers = {"User-Agent": "NextSignal/1.0 (prediction-market research)"}
    with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers) as client:
        response = client.get(POLYMARKET_MARKETS_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    if not isinstance(payload, list):
        raise ValueError("Polymarket returned an unexpected market payload")

    events: list[dict[str, Any]] = []
    for market in payload:
        if not isinstance(market, dict) or market.get("closed"):
            continue
        outcomes = _list_value(market.get("outcomes"))
        prices = _list_value(market.get("outcomePrices"))
        if not prices:
            continue
        # Most binary markets list Yes first, but use outcome labels where available.
        index = next((i for i, label in enumerate(outcomes) if str(label).strip().lower() in {"yes", "true"}), 0)
        if index >= len(prices):
            index = 0
        probability = _number(prices[index], -1)
        # Drop malformed / effectively empty quotes; they otherwise dominate tables with
        # misleading 0.1% placeholder-like values. Keep legitimate low probabilities >= 0.5%.
        if not 0.005 <= probability <= 0.995:
            continue
        market_id = str(market.get("id") or market.get("conditionId") or market.get("slug") or "")
        slug = str(market.get("slug") or market_id)
        if not market_id or not market.get("question"):
            continue
        end_date = market.get("endDate") or market.get("endDateIso")
        try:
            resolution_date = datetime.fromisoformat(str(end_date).replace("Z", "+00:00")).isoformat() if end_date else None
        except ValueError:
            resolution_date = None
        url = str(market.get("url") or (f"https://polymarket.com/event/{slug}" if slug else "https://polymarket.com"))
        events.append({
            "id": market_id,
            "title": str(market.get("question") or "Untitled market"),
            "slug": slug,
            "description": str(market.get("description") or ""),
            "category": _category(market),
            "status": "active",
            "url": url,
            "resolution_date": resolution_date,
            "current_probability": probability,
            "probability": probability,
            "volume": _number(market.get("volumeNum", market.get("volume"))),
            "liquidity": _number(market.get("liquidityNum", market.get("liquidity"))),
            "history_days": 1,
            "drift_intensity": 0.0,
            "outcome": None,
            "final_market_probability": None,
            "source_timestamp": datetime.utcnow().isoformat() + "Z",
        })
    return events


KALSHI_MARKETS_URL = "https://api.elections.kalshi.com/trade-api/v2/markets"

def fetch_kalshi_markets(limit: int = 100) -> list[dict[str, Any]]:
    """Fetch open markets from Kalshi's public read-only market endpoint.

    Kalshi's public market listing is accessible without authentication. The adapter
    intentionally records only current quotes; it does not invent historical prices.
    """
    params = {
        "status": "open",
        "limit": max(1, min(limit, 1000)),
        # Exclude multivariate combo markets; the first page can otherwise be
        # dominated by markets with no usable YES quote.
        "mve_filter": "exclude",
    }
    headers = {"User-Agent": "NextSignal/1.0 (prediction-market research)"}
    with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers) as client:
        response = client.get(KALSHI_MARKETS_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    markets = payload.get("markets", []) if isinstance(payload, dict) else []
    events: list[dict[str, Any]] = []
    for market in markets:
        if not isinstance(market, dict):
            continue
        ticker = str(market.get("ticker") or "")
        title = str(market.get("title") or market.get("subtitle") or ticker)
        if not ticker or not title:
            continue
        # Prefer last traded yes price; otherwise use the midpoint of available bid/ask.
        last = _number(market.get("last_price_dollars"), -1)
        if last < 0:
            last = _number(market.get("last_price"), -1) / 100 if market.get("last_price") is not None else -1
        bid = _number(market.get("yes_bid_dollars"), -1)
        ask = _number(market.get("yes_ask_dollars"), -1)
        if bid < 0 and market.get("yes_bid") is not None:
            bid = _number(market.get("yes_bid"), -1) / 100
        if ask < 0 and market.get("yes_ask") is not None:
            ask = _number(market.get("yes_ask"), -1) / 100
        # A zero last trade is often stale/no-trade data, not a usable current
        # quote. Prefer it only when it is inside the valid probability range;
        # otherwise use the live bid/ask midpoint (or the available side).
        if 0.005 <= last <= 0.995:
            probability = last
        elif 0 <= bid <= 1 and 0 <= ask <= 1 and bid <= ask:
            probability = (bid + ask) / 2
        elif 0.005 <= bid <= 0.995:
            probability = bid
        elif 0.005 <= ask <= 0.995:
            probability = ask
        else:
            continue
        if not 0.005 <= probability <= 0.995:
            continue
        end_date = market.get("close_time") or market.get("expiration_time")
        try:
            resolution_date = datetime.fromisoformat(str(end_date).replace("Z", "+00:00")).isoformat() if end_date else None
        except ValueError:
            resolution_date = None
        category = str(market.get("category") or "other").strip().lower()
        events.append({
            "id": ticker,
            "title": title,
            "slug": ticker,
            "description": str(market.get("rules_primary") or market.get("subtitle") or ""),
            "category": category or "other",
            "status": "active",
            "url": f"https://kalshi.com/markets/{ticker}",
            "resolution_date": resolution_date,
            "current_probability": probability,
            "probability": probability,
            "volume": _number(market.get("volume_fp", market.get("volume"))),
            "liquidity": _number(market.get("open_interest_fp", market.get("open_interest"))),
            "history_days": 1,
            "drift_intensity": 0.0,
            "outcome": None,
            "final_market_probability": None,
            "source_timestamp": datetime.utcnow().isoformat() + "Z",
        })
    return events
