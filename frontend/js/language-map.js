// ---------------------------------------------------------
// Peta Bahasa — Geographic Data Loader + SVG Renderer
// ---------------------------------------------------------

const mapDataUrl =
    "assets/maps/indonesia-admin1-ne-v5.1.1.geojson";

const linguisticDataUrl =
    "assets/data/province-languages.json";

const mapSvg = document.querySelector("#language-map");

const mapRegionName = document.querySelector("#language-map-region-name");

const mapInfoTitle =
    document.querySelector("#language-map-info-title");

const mapLanguageCount =
    document.querySelector("#language-map-language-count");

const mapInfoMessage =
    document.querySelector("#language-map-info-message");

const mapLanguageList =
    document.querySelector("#language-map-language-list");

const mapSource =
    document.querySelector("#language-map-source");

const mapSourceLink =
    document.querySelector("#language-map-source-link");

const mapSourceAccessed =
    document.querySelector("#language-map-source-accessed");

let linguisticData = null;

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 500;
const MAP_PADDING = 40;


// ---------------------------------------------------------
// Load GeoJSON
// ---------------------------------------------------------

async function loadLanguageMap() {
    try {
        const response = await fetch(mapDataUrl);

        if (!response.ok) {
            throw new Error(
                `Failed to load map data: ${response.status}`
            );
        }

        const geoData = await response.json();

        console.log("Peta Bahasa GeoJSON loaded.");
        console.log("Feature count:", geoData.features.length);

        renderLanguageMap(geoData);

    } catch (error) {
        console.error("Peta Bahasa error:", error);
    }
}


// ---------------------------------------------------------
// Render Map
// ---------------------------------------------------------

function renderLanguageMap(geoData) {
    const bounds = calculateBounds(geoData.features);

    geoData.features.forEach(function (feature) {
        const pathData = geometryToPath(
            feature.geometry,
            bounds
        );

        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        path.setAttribute("d", pathData);
        path.setAttribute("class", "map-region");

        path.dataset.name = feature.properties.name;
        path.dataset.isoCode = feature.properties.iso_3166_2;
        path.dataset.adminCode = feature.properties.adm1_code;

        path.addEventListener("mouseenter", function () {

        const provinceData =
        findProvinceData(
            path.dataset.isoCode
        );

// ---------------------------------------------------------
// Render Linguistic Information
// ---------------------------------------------------------

        function renderProvinceInformation(
        provinceName,
        provinceData
        ) {

        // Clear previous language records

        mapLanguageList.innerHTML = "";


// -----------------------------------------------------
// Province without linguistic data
// -----------------------------------------------------

    if (!provinceData) {

        mapInfoTitle.textContent =
            provinceName;

        mapLanguageCount.textContent =
            "—";

        mapInfoMessage.textContent =
            "Linguistic data coming soon.";

            mapSource.hidden = true;

        return;
    }


// -----------------------------------------------------
// Province with linguistic data
// -----------------------------------------------------

    mapInfoTitle.textContent =
        provinceData.province_name;

    mapLanguageCount.textContent =
        `${provinceData.reported_language_count} Languages`;

    mapInfoMessage.textContent =
        "Languages documented for this province:";

// -----------------------------------------------------
// Data Provenance
// -----------------------------------------------------

    mapSource.hidden = false;

    mapSourceLink.href =
    provinceData.source.url;

    mapSourceLink.textContent =
    provinceData.source.institution;

    mapSourceAccessed.textContent =
    `Accessed ${provinceData.source.accessed}`;

// -----------------------------------------------------
// Language List
// -----------------------------------------------------

    provinceData.languages.forEach(
        function (languageName) {

            const listItem =
                document.createElement("li");

            listItem.textContent =
                languageName;

            mapLanguageList.appendChild(
                listItem
            );
        }
    );
    }

    // Update compact map status

        if (provinceData) {

        mapRegionName.textContent =
            `${path.dataset.name} · ` +
            `${provinceData.reported_language_count} Languages`;

        } else {

        mapRegionName.textContent =
            `${path.dataset.name} · Data coming soon`;

        }


    // Update linguistic information panel

    renderProvinceInformation(
        path.dataset.name,
        provinceData
    );
    });

    mapSvg.appendChild(path);
    });

    console.log("Peta Bahasa SVG rendered.");
    }

// ---------------------------------------------------------
// Calculate Geographic Bounds
// ---------------------------------------------------------

function calculateBounds(features) {
    let minLongitude = Infinity;
    let maxLongitude = -Infinity;
    let minLatitude = Infinity;
    let maxLatitude = -Infinity;

    features.forEach(function (feature) {
        visitCoordinates(
            feature.geometry.coordinates,
            function (longitude, latitude) {
                minLongitude = Math.min(
                    minLongitude,
                    longitude
                );

                maxLongitude = Math.max(
                    maxLongitude,
                    longitude
                );

                minLatitude = Math.min(
                    minLatitude,
                    latitude
                );

                maxLatitude = Math.max(
                    maxLatitude,
                    latitude
                );
            }
        );
    });

    return {
        minLongitude,
        maxLongitude,
        minLatitude,
        maxLatitude
    };
}


// ---------------------------------------------------------
// Visit Every Coordinate
// ---------------------------------------------------------

function visitCoordinates(coordinates, callback) {
    if (
        typeof coordinates[0] === "number" &&
        typeof coordinates[1] === "number"
    ) {
        callback(
            coordinates[0],
            coordinates[1]
        );

        return;
    }

    coordinates.forEach(function (coordinate) {
        visitCoordinates(
            coordinate,
            callback
        );
    });
}


// ---------------------------------------------------------
// Convert Geographic Coordinate → SVG Coordinate
// ---------------------------------------------------------

function projectCoordinate(
    longitude,
    latitude,
    bounds
) {
    const usableWidth =
        SVG_WIDTH - MAP_PADDING * 2;

    const usableHeight =
        SVG_HEIGHT - MAP_PADDING * 2;

    const longitudeRange =
        bounds.maxLongitude -
        bounds.minLongitude;

    const latitudeRange =
        bounds.maxLatitude -
        bounds.minLatitude;

    const x =
        MAP_PADDING +
        (
            (
                longitude -
                bounds.minLongitude
            ) /
            longitudeRange
        ) *
        usableWidth;

    const y =
        MAP_PADDING +
        (
            (
                bounds.maxLatitude -
                latitude
            ) /
            latitudeRange
        ) *
        usableHeight;

    return [x, y];
}


// ---------------------------------------------------------
// Convert Geometry → SVG Path
// ---------------------------------------------------------

function geometryToPath(
    geometry,
    bounds
) {
    if (geometry.type === "Polygon") {
        return polygonToPath(
            geometry.coordinates,
            bounds
        );
    }

    if (geometry.type === "MultiPolygon") {
        return geometry.coordinates
            .map(function (polygon) {
                return polygonToPath(
                    polygon,
                    bounds
                );
            })
            .join(" ");
    }

    console.warn(
        "Unsupported geometry:",
        geometry.type
    );

    return "";
}


// ---------------------------------------------------------
// Convert Polygon → SVG Path
// ---------------------------------------------------------

function polygonToPath(
    polygon,
    bounds
) {
    return polygon
        .map(function (ring) {
            return ringToPath(
                ring,
                bounds
            );
        })
        .join(" ");
}


// ---------------------------------------------------------
// Convert Coordinate Ring → SVG Path
// ---------------------------------------------------------

function ringToPath(
    ring,
    bounds
) {
    return ring
        .map(function (coordinate, index) {
            const [
                longitude,
                latitude
            ] = coordinate;

            const [x, y] =
                projectCoordinate(
                    longitude,
                    latitude,
                    bounds
                );

            const command =
                index === 0
                    ? "M"
                    : "L";

            return `${command}${x},${y}`;
        })
        .join(" ") + " Z";
}

// ---------------------------------------------------------
// Load Linguistic Data
// ---------------------------------------------------------

async function loadLinguisticData() {
    const response = await fetch(linguisticDataUrl);

    if (!response.ok) {
        throw new Error(
            `Failed to load linguistic data: ${response.status}`
        );
    }

    linguisticData = await response.json();

    console.log(
        "Peta Bahasa linguistic data loaded."
    );

    console.log(
        "Province records:",
        linguisticData.provinces.length
    );
}

// ---------------------------------------------------------
// Find Linguistic Data by Province Code
// ---------------------------------------------------------

function findProvinceData(provinceCode) {
    if (!linguisticData) {
        return null;
    }

    return linguisticData.provinces.find(
        function (province) {
            return (
                province.province_code ===
                provinceCode
            );
        }
    ) || null;
}

// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

async function initializePetaBahasa() {
    try {
        await loadLinguisticData();
        await loadLanguageMap();

        console.log(
            "Peta Bahasa initialized."
        );

    } catch (error) {
        console.error(
            "Peta Bahasa initialization error:",
            error
        );
    }
}


initializePetaBahasa();