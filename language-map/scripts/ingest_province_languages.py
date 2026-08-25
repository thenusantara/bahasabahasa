import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

BASE_URL = (
    "https://petabahasa.kemendikdasmen.go.id/"
    "provinsi.php?idp={province}"
)

OUTPUT_PATH = Path(
    "language-map/data/processed/"
    "province-languages.batch0.json"
)

REPORT_PATH = Path(
    "language-map/reports/"
    "ingestion-report-batch0.md"
)

INSTITUTION = (
    "Badan Pengembangan dan Pembinaan Bahasa, "
    "Kementerian Pendidikan Dasar dan Menengah"
)


# ---------------------------------------------------------
# Batch-0 Oracle
# ---------------------------------------------------------
# These expected counts are used ONLY for parser QA.
# If any count does not match, the batch MUST fail.

BATCH_PROVINCES = [
    {
        "name": "Maluku",
        "code": "ID-MA",
        "expected_count": 62,
    },
    {
        "name": "Jawa Timur",
        "code": "ID-JI",
        "expected_count": 3,
    },
    {
        "name": "Aceh",
        "code": "ID-AC",
        "expected_count": 7,
    },
]


# ---------------------------------------------------------
# HTTP Session
# ---------------------------------------------------------

session = requests.Session()

session.headers.update(
    {
        "User-Agent": (
            "BahasaBahasa-PetaBahasaResearch/0.0.1 "
            "(research data ingestion)"
        )
    }
)


# ---------------------------------------------------------
# Build Province URL
# ---------------------------------------------------------

def build_province_url(province_name):
    encoded_name = quote_plus(province_name)

    return BASE_URL.format(
        province=encoded_name
    )


# ---------------------------------------------------------
# Fetch Province Page
# ---------------------------------------------------------

def fetch_page(url):
    response = session.get(
        url,
        timeout=30,
    )

    response.raise_for_status()

    return response.text


# ---------------------------------------------------------
# Parse Reported Language Count
# ---------------------------------------------------------

def parse_reported_count(soup):
    page_text = soup.get_text(
        " ",
        strip=True,
    )

    match = re.search(
        r"(\d+)\s+Bahasa",
        page_text,
        flags=re.IGNORECASE,
    )

    if not match:
        raise ValueError(
            "Reported language count not found."
        )

    return int(
        match.group(1)
    )


# ---------------------------------------------------------
# Validate Candidate Language Name
# ---------------------------------------------------------

def is_language_name_candidate(text):
    if not text:
        return False

    text = text.strip()

    excluded = {
        "BAHASA",
        "PETA",
        "MEDIA",
        "Selengkapnya",
    }

    if text in excluded:
        return False

    if text.startswith("Bahasa "):
        return False

    if len(text) > 100:
        return False

    return True


# ---------------------------------------------------------
# Extract Language Name from One Result Row
# ---------------------------------------------------------

def extract_language_name(detail_link):
    # Preferred strategy:
    # language records on the source page are commonly
    # represented inside a table row.

    row = detail_link.find_parent("tr")

    if row:
        cells = row.find_all("td")

        for cell in cells:
            text = cell.get_text(
                " ",
                strip=True,
            )

            if is_language_name_candidate(text):
                return text


    # Fallback strategy:
    # inspect nearby strings inside increasingly wider
    # parent containers.

    parent = detail_link.parent

    for _ in range(5):

        if parent is None:
            break

        strings = list(
            parent.stripped_strings
        )

        for text in strings:

            if is_language_name_candidate(text):
                return text

        parent = parent.parent


    return None


# ---------------------------------------------------------
# Parse Language Names
# ---------------------------------------------------------

def parse_language_names(soup):
    detail_links = soup.find_all(
        "a",
        string=lambda value: (
            value
            and "Selengkapnya"
            in value
        ),
    )

    languages = []


    for detail_link in detail_links:

        language_name = (
            extract_language_name(
                detail_link
            )
        )

        if (
            language_name
            and language_name
            not in languages
        ):
            languages.append(
                language_name
            )


    return languages


# ---------------------------------------------------------
# Parse One Province
# ---------------------------------------------------------

def ingest_province(
    province_name,
    province_code,
):
    url = build_province_url(
        province_name
    )

    print()
    print(
        "Fetching:",
        province_name
    )

    print(
        "URL:",
        url
    )


    html = fetch_page(url)

    soup = BeautifulSoup(
        html,
        "html.parser",
    )


    reported_count = (
        parse_reported_count(
            soup
        )
    )

    languages = (
        parse_language_names(
            soup
        )
    )


    return {
        "province_name":
            province_name,

        "province_code":
            province_code,

        "reported_language_count":
            reported_count,

        "languages":
            languages,

        "source": {
            "institution":
                INSTITUTION,

            "dataset":
                (
                    "Bahasa di Provinsi "
                    f"{province_name}"
                ),

            "url":
                url,

            "accessed":
                date.today().isoformat(),
        },
    }


# ---------------------------------------------------------
# Validate Province Record
# ---------------------------------------------------------

def validate_province(
    province,
    expected_count,
):
    reported_count = (
        province[
            "reported_language_count"
        ]
    )

    ingested_count = len(
        province["languages"]
    )


    reported_matches_ingested = (
        reported_count
        == ingested_count
    )

    oracle_matches = (
        reported_count
        == expected_count
    )


    return {
        "reported_count":
            reported_count,

        "ingested_count":
            ingested_count,

        "reported_matches_ingested":
            reported_matches_ingested,

        "oracle_matches":
            oracle_matches,

        "passed":
            (
                reported_matches_ingested
                and oracle_matches
            ),
    }


# ---------------------------------------------------------
# Write Markdown Report
# ---------------------------------------------------------

def write_report(results):
    REPORT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )


    lines = [
        "# Peta Bahasa — Batch 0 Ingestion Report",
        "",
        f"Generated: {date.today().isoformat()}",
        "",
        "| Province | Reported | Ingested | Oracle | Status |",
        "| --- | ---: | ---: | ---: | --- |",
    ]


    for result in results:

        validation = (
            result["validation"]
        )

        status = (
            "PASS"
            if validation["passed"]
            else "FAIL"
        )

        lines.append(
            "| "
            f"{result['province_name']} | "
            f"{validation['reported_count']} | "
            f"{validation['ingested_count']} | "
            f"{result['expected_count']} | "
            f"{status} |"
        )


    REPORT_PATH.write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )


# ---------------------------------------------------------
# Write Batch Dataset
# ---------------------------------------------------------

def write_dataset(provinces):
    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )


    dataset = {
        "name":
            "province-languages",

        "description":
            (
                "Province-level linguistic "
                "data for Peta Bahasa"
            ),

        "version":
            "0.1.0-batch0",

        "generated":
            date.today().isoformat(),

        "provinces":
            provinces,
    }


    OUTPUT_PATH.write_text(
        json.dumps(
            dataset,
            ensure_ascii=False,
            indent=4,
        )
        + "\n",
        encoding="utf-8",
    )


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

def main():
    results = []

    parsed_provinces = []


    for config in BATCH_PROVINCES:

        province = ingest_province(
            config["name"],
            config["code"],
        )

        validation = (
            validate_province(
                province,
                config[
                    "expected_count"
                ],
            )
        )


        print(
            "Reported:",
            validation[
                "reported_count"
            ],
        )

        print(
            "Ingested:",
            validation[
                "ingested_count"
            ],
        )

        print(
            "Oracle:",
            config[
                "expected_count"
            ],
        )

        print(
            "Integrity:",
            (
                "PASS"
                if validation["passed"]
                else "FAIL"
            ),
        )


        results.append(
            {
                "province_name":
                    config["name"],

                "expected_count":
                    config[
                        "expected_count"
                    ],

                "validation":
                    validation,
            }
        )

        parsed_provinces.append(
            province
        )


    write_report(
        results
    )


    all_passed = all(
        result["validation"]["passed"]
        for result in results
    )


    # -----------------------------------------------------
    # Safety Gate
    # -----------------------------------------------------

    if not all_passed:

        print()
        print(
            "BATCH FAILED."
        )

        print(
            "Dataset was NOT written."
        )

        print(
            "Inspect report:",
            REPORT_PATH
        )

        raise SystemExit(1)


    # Only write dataset when every
    # Batch-0 province passes.

    write_dataset(
        parsed_provinces
    )


    print()
    print(
        "BATCH 0 PASS."
    )

    print(
        "Dataset:",
        OUTPUT_PATH
    )

    print(
        "Report:",
        REPORT_PATH
    )


if __name__ == "__main__":
    main()