import json
from pathlib import Path


# ---------------------------------------------------------
# Dataset
# ---------------------------------------------------------

data_path = Path(
    "language-map/data/processed/province-languages.json"
)


# ---------------------------------------------------------
# Load JSON
# ---------------------------------------------------------

with data_path.open(
    "r",
    encoding="utf-8"
) as file:
    dataset = json.load(file)


# ---------------------------------------------------------
# Validate Provinces
# ---------------------------------------------------------

for province in dataset["provinces"]:

    province_name = province["province_name"]

    reported_count = (
        province["reported_language_count"]
    )

    ingested_count = len(
        province["languages"]
    )

    integrity_passed = (
        reported_count == ingested_count
    )


    print(
        "Province:",
        province_name
    )

    print(
        "Reported languages:",
        reported_count
    )

    print(
        "Ingested languages:",
        ingested_count
    )

    print(
        "Integrity:",
        "PASS"
        if integrity_passed
        else "FAIL"
    )

    print()