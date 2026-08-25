from pathlib import Path

import geopandas as gpd


# ---------------------------------------------------------
# Source
# ---------------------------------------------------------

source_path = Path(
    r"E:\Career Master Database\Evidence\bahasabahasa\peta sumber\ne_10m_admin_1_states_provinces.shp"
)


# ---------------------------------------------------------
# Output
# ---------------------------------------------------------

output_path = Path(
    "language-map/data/processed/"
    "indonesia-admin1-ne-v5.1.1.geojson"
)


# ---------------------------------------------------------
# Read Natural Earth
# ---------------------------------------------------------

data = gpd.read_file(source_path)


# ---------------------------------------------------------
# Filter Indonesia
# ---------------------------------------------------------

indonesia = data[data["iso_a2"] == "ID"].copy()


# ---------------------------------------------------------
# Keep Only Fields Needed by Peta Bahasa Prototype
# ---------------------------------------------------------

indonesia = indonesia[
    [
        "name",
        "iso_3166_2",
        "adm1_code",
        "geometry",
    ]
]


# ---------------------------------------------------------
# Sort for Predictable Output
# ---------------------------------------------------------

indonesia = indonesia.sort_values("name")


# ---------------------------------------------------------
# Ensure Output Directory Exists
# ---------------------------------------------------------

output_path.parent.mkdir(
    parents=True,
    exist_ok=True,
)


# ---------------------------------------------------------
# Export GeoJSON
# ---------------------------------------------------------

indonesia.to_file(
    output_path,
    driver="GeoJSON",
)


# ---------------------------------------------------------
# QA Report
# ---------------------------------------------------------

print("GeoJSON export complete.")
print("Output:", output_path)
print("Regions:", len(indonesia))
print("CRS:", indonesia.crs)