# Building Peta Bahasa

## 1. Research Question

How can we build an interactive linguistic map of Indonesia
using traceable geographic and linguistic data?

## 2. Geographic Foundation

Source:
Natural Earth

Dataset:
Admin 1 – States, Provinces

Scale:
1:10m

Version:
5.1.1

Purpose:
Provide geographic geometry for Indonesia's first-level
administrative regions.

## 3. Raw Dataset

Original format:
ESRI Shapefile

Files:
- .shp — geometry
- .dbf — attributes
- .shx — geometry index
- .prj — coordinate reference system
- .cpg — character encoding

Status:
Downloaded and extracted.

## 4. Data Processing

Planned pipeline:

Natural Earth
→ inspect attributes
→ identify Indonesia
→ filter Indonesian regions
→ export GeoJSON
→ optimize for web

## 5. Linguistic Data

Primary direction:
Official Indonesian language data.

Provenance requirements:
- source organization
- source URL
- retrieval date
- original format
- transformation performed
- interpretation notes

## 6. Application Architecture

Geographic data:
GeoJSON / SVG

Linguistic data:
JSON

Interaction:
JavaScript

Visual system:
Phoenix Design System

## 7. Data Integration

Planned relationship:

Geographic Region
        ↓
Region Identifier
        ↓
Language Dataset
        ↓
Language Count / List
        ↓
Interactive UI

## 8. QA

To be documented during implementation.

## 9. Limitations

To be documented as the datasets are inspected.

## 10. Research Log

### 2026-08-24
- Natural Earth Admin-1 10m dataset selected.
- Dataset downloaded.
- Shapefile package extracted.
- Shapefile components inspected.
- Next step: inspect attributes and isolate Indonesia.

## Coverage Finding — Natural Earth Admin-1

Natural Earth Admin-1 10m v5.1.1 returned 33 first-level
administrative regions for Indonesia when filtered using:

iso_a2 == "ID"

Current Indonesian official sources report 38 provinces.

This means the Natural Earth dataset cannot be treated as the
authoritative source for Indonesia's current provincial structure.

Natural Earth will be treated as a geographic geometry source,
while current administrative structure must be validated against
official Indonesian sources.

Status:
Further reconciliation required before production use.

## Coverage Finding — Indonesia Admin-1

Natural Earth Admin-1 10m v5.1.1 returns 33 Indonesian
first-level administrative regions when filtered using:

iso_a2 == "ID"

Current official Indonesian sources use 38 provinces.

The five additional provinces not represented as separate
Admin-1 records in this Natural Earth extraction are:

- Kalimantan Utara
- Papua Selatan
- Papua Tengah
- Papua Pegunungan
- Papua Barat Daya

Implication:
Natural Earth will be treated as a geographic geometry source,
not as the authoritative source for Indonesia's current
administrative structure.

Administrative reconciliation is required before production use.