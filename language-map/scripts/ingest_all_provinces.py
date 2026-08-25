import json
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from ingest_province_languages import (
    INSTITUTION,
    fetch_page,
    parse_reported_count,
    parse_language_names,
)


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

INDEX_URL = (
    "https://petabahasa.kemendikdasmen.go.id/"
)

GEOGRAPHIC_DATA_PATH = Path(
    "language-map/data/processed/"
    "indonesia-admin1-ne-v5.1.1.geojson"
)

OUTPUT_PATH = Path(
    "language-map/data/processed/"
    "province-languages.generated.json"
)

REPORT_PATH = Path(
    "language-map/reports/"
    "ingestion-report-full.md"
)


# ---------------------------------------------------------
# Geographic Name Aliases
# ---------------------------------------------------------
# Official Peta Bahasa names and Natural Earth names
# are not always identical.

NAME_ALIASES = {
    "DKI Jakarta":
        "Jakarta Raya",

    "Daerah Istimewa Yogyakarta":
        "Yogyakarta",

    "Kepulauan Bangka Belitung":
        "Bangka-Belitung",

    "Sumatra Utara":
        "Sumatera Utara",

    "Sumatra Barat":
        "Sumatera Barat",

    "Sumatra Selatan":
        "Sumatera Selatan",
}


# ---------------------------------------------------------
# Load Geographic Province Codes
# ---------------------------------------------------------

def load_geographic_codes():
    with GEOGRAPHIC_DATA_PATH.open(
        "r",
        encoding="utf-8",
    ) as file:
        geo_data = json.load(file)

    codes = {}

    for feature in geo_data["features"]:
        properties = feature["properties"]

        codes[
            properties["name"]
        ] = properties["iso_3166_2"]

    return codes


# ---------------------------------------------------------
# Normalize Geographic Name
# ---------------------------------------------------------

def geographic_name_for(
    linguistic_name,
):
    return NAME_ALIASES.get(
        linguistic_name,
        linguistic_name,
    )


# ---------------------------------------------------------
# Discover Official Province Pages
# ---------------------------------------------------------

def discover_province_pages():
    print(
        "Discovering official province pages..."
    )

    html = fetch_page(
        INDEX_URL
    )

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    discovered = {}

    for link in soup.find_all(
        "a",
        href=True,
    ):
        href = link["href"]

        if (
            "provinsi.php?idp="
            not in href
        ):
            continue

        province_name = (
            link.get_text(
                " ",
                strip=True,
            )
        )

        if not province_name:
            continue

        url = urljoin(
            INDEX_URL,
            href,
        )

        # Deduplicate by exact URL.

        discovered[url] = {
            "province_name":
                province_name,

            "url":
                url,
        }

    provinces = list(
        discovered.values()
    )

    provinces.sort(
        key=lambda item:
        item["province_name"]
    )

    return provinces


# ---------------------------------------------------------
# Ingest One Province Page
# ---------------------------------------------------------

def ingest_page(
    province_name,
    url,
    geographic_codes,
):
    print()
    print(
        "Fetching:",
        province_name
    )

    html = fetch_page(
        url
    )

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

    geo_name = (
        geographic_name_for(
            province_name
        )
    )

    province_code = (
        geographic_codes.get(
            geo_name
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
# Validate Record
# ---------------------------------------------------------

def validate_record(province):
    reported = (
        province[
            "reported_language_count"
        ]
    )

    ingested = len(
        province["languages"]
    )

    return {
        "reported":
            reported,

        "ingested":
            ingested,

        "integrity_passed":
            reported == ingested,

        "geographic_join":
            (
                province[
                    "province_code"
                ]
                is not None
            ),
    }


# ---------------------------------------------------------
# Write Coverage Report
# ---------------------------------------------------------

def write_report(
    province_records,
):
    REPORT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    lines = [
        "# Peta Bahasa — Full Ingestion Report",
        "",
        f"Generated: {date.today().isoformat()}",
        "",
        (
            "Official linguistic source: "
            f"{INDEX_URL}"
        ),
        "",
        (
            "Geographic source: "
            "Natural Earth Admin-1 10m v5.1.1"
        ),
        "",
        "| Province | Reported | Ingested | Integrity | Geographic Join |",
        "| --- | ---: | ---: | --- | --- |",
    ]

    for record in province_records:
        province = record["province"]
        validation = record[
            "validation"
        ]

        integrity = (
            "PASS"
            if validation[
                "integrity_passed"
            ]
            else "FAIL"
        )

        joined = (
            province["province_code"]
            if validation[
                "geographic_join"
            ]
            else "UNMATCHED"
        )

        lines.append(
            "| "
            f"{province['province_name']} | "
            f"{validation['reported']} | "
            f"{validation['ingested']} | "
            f"{integrity} | "
            f"{joined} |"
        )

    total = len(
        province_records
    )

    integrity_passes = sum(
        1
        for record
        in province_records
        if record[
            "validation"
        ][
            "integrity_passed"
        ]
    )

    joined_count = sum(
        1
        for record
        in province_records
        if record[
            "validation"
        ][
            "geographic_join"
        ]
    )

    lines.extend(
        [
            "",
            "## Summary",
            "",
            f"- Province pages discovered: {total}",
            (
                "- Integrity PASS: "
                f"{integrity_passes}/{total}"
            ),
            (
                "- Geographic joins: "
                f"{joined_count}/{total}"
            ),
            (
                "- Unmatched geographic records: "
                f"{total - joined_count}"
            ),
            "",
            (
                "A geographic mismatch does not "
                "invalidate linguistic ingestion. "
                "It indicates a difference between "
                "the linguistic-source administrative "
                "snapshot and the Natural Earth "
                "geometry snapshot."
            ),
        ]
    )

    REPORT_PATH.write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )


# ---------------------------------------------------------
# Write Generated Dataset
# ---------------------------------------------------------

def write_dataset(
    provinces,
):
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
            "0.2.0-generated",

        "generated":
            date.today().isoformat(),

        "source_scope": {
            "institution":
                INSTITUTION,

            "research_period":
                "1991-2019",

            "source_index":
                INDEX_URL,
        },

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
    geographic_codes = (
        load_geographic_codes()
    )

    province_pages = (
        discover_province_pages()
    )

    print(
        "Province pages discovered:",
        len(province_pages)
    )

    records = []
    provinces = []

    for page in province_pages:
        province = ingest_page(
            page["province_name"],
            page["url"],
            geographic_codes,
        )

        validation = (
            validate_record(
                province
            )
        )

        status = (
            "PASS"
            if validation[
                "integrity_passed"
            ]
            else "FAIL"
        )

        join_status = (
            province[
                "province_code"
            ]
            or "UNMATCHED"
        )

        print(
            "Reported:",
            validation["reported"]
        )

        print(
            "Ingested:",
            validation["ingested"]
        )

        print(
            "Integrity:",
            status
        )

        print(
            "Geo join:",
            join_status
        )

        records.append(
            {
                "province":
                    province,

                "validation":
                    validation,
            }
        )

        provinces.append(
            province
        )


    # -----------------------------------------------------
    # Always write research report
    # -----------------------------------------------------

    write_report(
        records
    )


    # -----------------------------------------------------
    # Dataset Safety Gate
    # -----------------------------------------------------

    all_integrity_passed = all(
        record[
            "validation"
        ][
            "integrity_passed"
        ]
        for record
        in records
    )

    if not all_integrity_passed:

        print()
        print(
            "FULL INGESTION FAILED."
        )

        print(
            "Generated dataset was NOT written."
        )

        print(
            "Inspect report:",
            REPORT_PATH
        )

        raise SystemExit(1)


    # Geographic mismatch is allowed.
    # Linguistic integrity failure is not.

    write_dataset(
        provinces
    )


    print()
    print(
        "FULL INGESTION PASS."
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
    