"""Deterministic synthetic juvenile case generator for bulk corpus expansion."""

from __future__ import annotations

import random
from typing import Any

VALID_COUNTRIES = ("United States", "India", "United Kingdom")

US_JURISDICTIONS = [
    ("California", "Los Angeles Juvenile Court"),
    ("Texas", "Harris County Juvenile Court"),
    ("Florida", "Miami-Dade Juvenile Court"),
    ("New York", "Kings County Family Court"),
    ("Illinois", "Cook County Juvenile Court"),
    ("Ohio", "Cuyahoga County Juvenile Court"),
    ("Georgia", "Fulton County Juvenile Court"),
    ("Washington", "King County Juvenile Court"),
    ("Colorado", "Denver Juvenile Court"),
    ("Arizona", "Maricopa County Juvenile Court"),
    ("Pennsylvania", "Philadelphia Family Court"),
    ("Michigan", "Wayne County Juvenile Court"),
    ("North Carolina", "Mecklenburg Juvenile Court"),
    ("Virginia", "Fairfax Juvenile Court"),
    ("Massachusetts", "Suffolk Juvenile Court"),
]

INDIA_JURISDICTIONS = [
    ("Maharashtra", "Juvenile Justice Board Mumbai"),
    ("Delhi", "JJ Board Delhi"),
    ("Karnataka", "JJ Board Bengaluru"),
    ("Tamil Nadu", "JJ Board Chennai"),
    ("Uttar Pradesh", "JJ Board Lucknow"),
    ("West Bengal", "JJ Board Kolkata"),
    ("Rajasthan", "JJ Board Jaipur"),
    ("Gujarat", "JJ Board Ahmedabad"),
    ("Kerala", "JJ Board Kochi"),
    ("Punjab", "JJ Board Chandigarh"),
    ("Telangana", "JJ Board Hyderabad"),
    ("Bihar", "JJ Board Patna"),
    ("Madhya Pradesh", "JJ Board Bhopal"),
    ("Haryana", "JJ Board Gurugram"),
    ("Odisha", "JJ Board Bhubaneswar"),
]

UK_JURISDICTIONS = [
    ("England", "Youth Court Manchester"),
    ("England", "Youth Court London"),
    ("England", "Youth Court Birmingham"),
    ("England", "Youth Court Leeds"),
    ("England", "Youth Court Bristol"),
    ("Scotland", "Sheriff Court Glasgow"),
    ("Scotland", "Sheriff Court Edinburgh"),
    ("Wales", "Youth Court Cardiff"),
    ("Wales", "Youth Court Swansea"),
    ("Northern Ireland", "Youth Court Belfast"),
]

OFFENSES = (
    "shoplifting",
    "assault",
    "drug possession",
    "cybercrime",
    "vandalism",
    "theft",
    "burglary",
    "truancy",
    "runaway",
    "weapon possession",
    "robbery",
    "arson",
    "trespass",
    "harassment",
    "curfew violation",
)

AGE_GROUPS = ("under 14", "15-17")

FACT_PATTERNS: dict[str, list[str]] = {
    "shoplifting": [
        "{age}-year-old apprehended shoplifting {item} from {place}. {prior}.",
        "Minor stole {item} from {place}; apprehended by security. {prior}.",
    ],
    "assault": [
        "{age}-year-old involved in {place} fight causing {injury} to peer. No weapon.",
        "School altercation: {age}-year-old struck another student at {place}. {prior}.",
    ],
    "drug possession": [
        "{age}-year-old found with {substance} at {place}. {prior}.",
        "Minor discovered carrying {substance} during {place} search. {prior}.",
    ],
    "cybercrime": [
        "{age}-year-old {cyber_act} at {place}. No financial gain. {prior}.",
        "Juvenile {cyber_act} using personal device. Victim notified school. {prior}.",
    ],
    "vandalism": [
        "{age}-year-old damaged {property} at {place}. {prior}.",
        "Minor spray-painted {property}; identified via surveillance at {place}. {prior}.",
    ],
    "theft": [
        "{age}-year-old stole {item} from {place}. {prior}.",
        "Theft reported: {age}-year-old took {item} belonging to another at {place}. {prior}.",
    ],
    "burglary": [
        "{age}-year-old entered {place} without permission and took {item}. {prior}.",
        "Break-in at {place}; {age}-year-old suspect identified. {prior}.",
    ],
    "truancy": [
        "{age}-year-old chronically absent from {place}; {absences} unexcused days. {prior}.",
        "Habitual truancy petition for {age}-year-old failing to attend {place}. {prior}.",
    ],
    "runaway": [
        "{age}-year-old left home and found at {place}. {context}. {prior}.",
        "Runaway minor located after {days} days; {context}. {prior}.",
    ],
    "weapon possession": [
        "{age}-year-old found with {weapon} at {place}. Not used. {prior}.",
        "Security search at {place} revealed {weapon} in {age}-year-old's bag. {prior}.",
    ],
    "robbery": [
        "{age}-year-old took {item} from peer at {place} using {threat}. {prior}.",
        "Strong-arm robbery allegation: {age}-year-old and {place}. {prior}.",
    ],
    "arson": [
        "{age}-year-old set fire to {property} at {place}. Minimal damage. {prior}.",
        "Fire incident at {place}; {age}-year-old admitted involvement. {prior}.",
    ],
    "trespass": [
        "{age}-year-old entered restricted {place} after hours. {prior}.",
        "Unauthorized entry to {place} by {age}-year-old. {prior}.",
    ],
    "harassment": [
        "{age}-year-old sent repeated threatening messages to peer via {channel}. {prior}.",
        "Bullying complaint: {age}-year-old harassed classmate at {place}. {prior}.",
    ],
    "curfew violation": [
        "{age}-year-old found in public at {place} after curfew. {prior}.",
        "Repeated curfew violations by {age}-year-old in {place}. {prior}.",
    ],
}

SUMMARY_PATTERNS = [
    "{offense} matter involving {age_group} juvenile in {jurisdiction}.",
    "Juvenile {offense} case with {prior_short} in {jurisdiction}.",
    "{offense} incident at {place_short}; minor in {age_group} age group.",
]

OUTCOMES_US = [
    "Diversion program; case dismissed upon completion.",
    "Probation 6 months; counseling.",
    "Probation 12 months; community service.",
    "Restitution; informal probation.",
    "Youth education program; supervised release.",
    "House arrest 30 days; probation.",
    "Anger management; probation 9 months.",
]

OUTCOMES_INDIA = [
    "Counseling under JJ Act; 6 months supervision.",
    "Community service; probation.",
    "Observation home placement 2 months; probation.",
    "Rehabilitation program; family counseling.",
    "Restitution; probation 12 months.",
    "Placement in special home; follow-up review.",
]

OUTCOMES_UK = [
    "Referral order 12 months.",
    "Youth rehabilitation order; supervision.",
    "Referral order; victim awareness program.",
    "Youth conditional discharge.",
    "Detention and training order 6 months.",
    "Reparation order; curfew requirement.",
]

SOURCE_URLS = {
    "United States": "https://www.courtlistener.com/",
    "India": "https://services.ecourts.gov.in/",
    "United Kingdom": "https://caselaw.nationalarchives.gov.uk/",
}

FILL_INS = {
    "item": [
        "electronics",
        "clothing",
        "snacks",
        "a bicycle",
        "school supplies",
        "a mobile phone",
        "cosmetics",
        "sporting goods",
    ],
    "place": [
        "a retail store",
        "school",
        "a public park",
        "a community center",
        "a transit station",
        "a neighbor's garage",
        "a local shop",
        "a recreation center",
    ],
    "prior": [
        "First offense",
        "No prior delinquency history",
        "No prior record",
        "One prior warning only",
        "First contact with juvenile court",
    ],
    "injury": ["minor bruising", "a split lip", "superficial scratches", "no serious injury"],
    "substance": ["marijuana", "vape cartridges", "prescription pills", "alcohol", "inhalants"],
    "cyber_act": [
        "accessed school network without authorization",
        "shared private photos online",
        "sent phishing messages to classmates",
        "created fake social media accounts",
        "circulated exam answers digitally",
        "installed unauthorized software on school laptops",
    ],
    "property": [
        "lockers",
        "a bench",
        "restroom fixtures",
        "a classroom window",
        "a bus shelter",
        "playground equipment",
    ],
    "weapon": ["a pocketknife", "a BB gun", "a metal pipe", "pepper spray"],
    "threat": ["verbal intimidation", "physical force", "implied force"],
    "channel": ["Instagram", "Snapchat", "WhatsApp", "TikTok", "text messages"],
    "context": [
        "Family conflict reported",
        "Alleged neglect at home",
        "Reunification assessment ordered",
        "Child referred by school counselor",
    ],
    "days": ["two", "three", "five", "seven"],
    "absences": ["15", "22", "30", "40"],
}


def _pick(rng: random.Random, key: str) -> str:
    return rng.choice(FILL_INS[key])


def _title_for(country: str, index: int, rng: random.Random) -> str:
    if country == "United States":
        styles = [
            f"In re J.D.-{index:04d}",
            f"State v. Minor-{index:04d}",
            f"Matter of Youth-{index:04d}",
        ]
    elif country == "India":
        styles = [
            f"In re Minor {index:04d}",
            f"X v. State (JJ-{index:04d})",
            f"In re Child {index:04d}",
        ]
    else:
        styles = [
            f"R v. Y-{index:04d} (Youth)",
            f"In re C-{index:04d} (Child)",
            f"R v. Minor {index:04d}",
        ]
    return rng.choice(styles)


def generate_synthetic_cases(
    count: int,
    *,
    seed: int = 42,
    start_index: int = 1,
) -> list[dict[str, Any]]:
    """Generate *count* synthetic cases balanced across three countries."""
    if count <= 0:
        return []

    rng = random.Random(seed)
    per_country = count // 3
    remainder = count % 3
    targets = {
        "United States": per_country + (1 if remainder > 0 else 0),
        "India": per_country + (1 if remainder > 1 else 0),
        "United Kingdom": per_country,
    }

    cases: list[dict[str, Any]] = []
    index = start_index

    for country in VALID_COUNTRIES:
        jurisdictions = {
            "United States": US_JURISDICTIONS,
            "India": INDIA_JURISDICTIONS,
            "United Kingdom": UK_JURISDICTIONS,
        }[country]
        outcomes = {
            "United States": OUTCOMES_US,
            "India": OUTCOMES_INDIA,
            "United Kingdom": OUTCOMES_UK,
        }[country]

        for _ in range(targets[country]):
            case_rng = random.Random(seed + index * 9973)
            offense = case_rng.choice(OFFENSES)
            age = case_rng.randint(13, 17)
            age_group = "under 14" if age <= 14 else "15-17"
            jurisdiction, court = case_rng.choice(jurisdictions)
            year = case_rng.randint(2018, 2024)
            place = _pick(case_rng, "place")
            prior = _pick(case_rng, "prior")
            prior_short = "no prior record" if "First" in prior or "No prior" in prior else "limited history"

            pattern = case_rng.choice(FACT_PATTERNS[offense])
            facts = pattern.format(
                age=age,
                item=_pick(case_rng, "item"),
                place=place,
                prior=prior,
                injury=_pick(case_rng, "injury"),
                substance=_pick(case_rng, "substance"),
                cyber_act=_pick(case_rng, "cyber_act"),
                property=_pick(case_rng, "property"),
                weapon=_pick(case_rng, "weapon"),
                threat=_pick(case_rng, "threat"),
                channel=_pick(case_rng, "channel"),
                context=_pick(case_rng, "context"),
                days=_pick(case_rng, "days"),
                absences=_pick(case_rng, "absences"),
            )

            summary = case_rng.choice(SUMMARY_PATTERNS).format(
                offense=offense,
                age_group=age_group,
                jurisdiction=jurisdiction,
                prior_short=prior_short,
                place_short=place.replace("a ", "").replace("an ", ""),
            )

            cases.append(
                {
                    "title": _title_for(country, index, case_rng),
                    "country": country,
                    "jurisdiction": jurisdiction,
                    "year": year,
                    "court": court,
                    "offense_type": offense,
                    "age_group": age_group,
                    "facts": facts,
                    "summary": summary,
                    "outcome": case_rng.choice(outcomes),
                    "source_url": SOURCE_URLS[country],
                }
            )
            index += 1

    rng.shuffle(cases)
    return cases
