#!/usr/bin/env python3
"""Write a synthetic bulk cases CSV for offline ingest."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.case_generator import generate_synthetic_cases
from scripts.ingest_utils import write_cases_csv

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DEFAULT_OUTPUT = DATA_DIR / "bulk_cases.csv"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic bulk case CSV")
    parser.add_argument("--count", type=int, default=904, help="Number of cases to generate")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed for reproducibility")
    parser.add_argument("--start-index", type=int, default=1, help="Title/index offset for uniqueness")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output CSV path")
    args = parser.parse_args()

    cases = generate_synthetic_cases(args.count, seed=args.seed, start_index=args.start_index)
    write_cases_csv(args.output, cases)
    print(f"Wrote {len(cases)} synthetic cases to {args.output}")


if __name__ == "__main__":
    main()
