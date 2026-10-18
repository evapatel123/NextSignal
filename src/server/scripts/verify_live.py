"""Verify live provider connectivity without modifying the database."""
from __future__ import annotations

import sys
from datetime import datetime, timezone

from src.server.services.live_sources import fetch_kalshi_markets, fetch_polymarket_markets


def main() -> int:
    checks = (
        ("Polymarket", fetch_polymarket_markets),
        ("Kalshi", fetch_kalshi_markets),
    )
    successes = 0
    print(f"NextSignal live feed verification — {datetime.now(timezone.utc).isoformat()}")
    for name, fetch in checks:
        try:
            markets = fetch(10)
            if not markets:
                print(f"FAIL  {name}: endpoint responded but no usable markets were returned; inspect endpoint fields, quotes, and filters")
                continue
            sample = markets[0]
            probability = sample.get("current_probability")
            if not isinstance(probability, (int, float)) or not 0 <= probability <= 1:
                print(f"FAIL  {name}: invalid probability in normalized response")
                continue
            print(f"PASS  {name}: {len(markets)} usable markets; sample probability {probability:.1%}; source URL {sample.get('url', 'n/a')}")
            successes += 1
        except Exception as exc:
            print(f"FAIL  {name}: {type(exc).__name__}: {exc}")
    print(f"\nResult: {successes}/{len(checks)} live providers passed.")
    return 0 if successes else 1


if __name__ == "__main__":
    sys.exit(main())
