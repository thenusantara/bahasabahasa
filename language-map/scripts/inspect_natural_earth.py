import geopandas as gpd


# ---------------------------------------------------------
# Natural Earth Admin-1 Dataset
# ---------------------------------------------------------

file_path = r"E:\Career Master Database\Evidence\bahasabahasa\peta sumber\ne_10m_admin_1_states_provinces.shp"


# ---------------------------------------------------------
# Read Dataset
# ---------------------------------------------------------

data = gpd.read_file(file_path)


# ---------------------------------------------------------
# Filter Indonesia
# ---------------------------------------------------------

indonesia = data[data["iso_a2"] == "ID"]


# ---------------------------------------------------------
# Select Only Fields Needed for Inspection
# Geometry is intentionally excluded from terminal output.
# ---------------------------------------------------------

selected = indonesia[
    [
        "name",
        "iso_3166_2",
        "adm1_code"
    ]
].sort_values("name")


# ---------------------------------------------------------
# Print Inspection Result
# ---------------------------------------------------------

print(selected.to_string(index=False))

print("\nTotal regions:", len(indonesia))