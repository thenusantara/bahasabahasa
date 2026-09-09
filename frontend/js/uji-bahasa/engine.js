const DATASET_BASE_PATH = "../assets/data/assessment";

const DATASET_FILES = Object.freeze({
    reading: "id-reading.json",
    languageControl: "id-language-control.json",
    listening: "id-listening.json",
    speaking: "id-speaking.json"
});

const EXPECTED_SKILLS = Object.freeze({
    reading: "reading",
    languageControl: "language-control",
    listening: "listening",
    speaking: "speaking"
});

const REQUIRED_DATASET_FIELDS = Object.freeze([
    "schemaVersion",
    "datasetVersion",
    "language",
    "skill",
    "status",
    "provenance"
]);

function assertDatasetContract(dataset, key) {
    if (!dataset || typeof dataset !== "object") {
        throw new Error(`Dataset "${key}" is not a valid object.`);
    }

    for (const field of REQUIRED_DATASET_FIELDS) {
        if (!(field in dataset)) {
            throw new Error(
                `Dataset "${key}" is missing required field "${field}".`
            );
        }
    }

    if (dataset.schemaVersion !== "0.1.0") {
        throw new Error(
            `Dataset "${key}" uses unsupported schema version "${dataset.schemaVersion}".`
        );
    }

    if (dataset.language !== "id") {
        throw new Error(
            `Dataset "${key}" uses unsupported language "${dataset.language}".`
        );
    }

    if (dataset.skill !== EXPECTED_SKILLS[key]) {
        throw new Error(
            `Dataset "${key}" skill mismatch: expected "${EXPECTED_SKILLS[key]}", received "${dataset.skill}".`
        );
    }

    if (dataset.status !== "pilot") {
        throw new Error(
            `Dataset "${key}" must remain in pilot status for v0.1.`
        );
    }
}

async function loadDataset(key, filename) {
    const url = `${DATASET_BASE_PATH}/${filename}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to load dataset "${key}" from "${url}" (${response.status}).`
        );
    }

    const dataset = await response.json();

    assertDatasetContract(dataset, key);

    return dataset;
}

export async function loadAssessmentDatasets() {
    const entries = await Promise.all(
        Object.entries(DATASET_FILES).map(async ([key, filename]) => {
            const dataset = await loadDataset(key, filename);
            return [key, dataset];
        })
    );

    return Object.fromEntries(entries);
}

export function getObjectiveItems(datasets) {
    if (!datasets) {
        throw new Error("Assessment datasets have not been loaded.");
    }

    return {
        reading: datasets.reading?.items ?? [],
        languageControl: datasets.languageControl?.items ?? [],
        listening: datasets.listening?.items ?? []
    };
}

export function getSpeakingTasks(datasets) {
    if (!datasets?.speaking) {
        throw new Error("Speaking dataset has not been loaded.");
    }

    return datasets.speaking.tasks ?? [];
}

export function getReadingStimuli(datasets) {
    if (!datasets?.reading) {
        throw new Error(
            "Reading dataset has not been loaded."
        );
    }

    return datasets.reading.stimuli ?? [];
}

export function getListeningStimuli(datasets) {
    if (!datasets?.listening) {
        throw new Error("Listening dataset has not been loaded.");
    }

    return datasets.listening.stimuli ?? [];
}

export const TESTLET_SIZE = 5;
export const STARTING_DIFFICULTY = 2;

export const DIFFICULTY_LABELS = Object.freeze({
    1: "FOUNDATION",
    2: "DEVELOPING",
    3: "STRONGER"
});

const OBJECTIVE_SKILLS = Object.freeze([
    "reading",
    "language-control",
    "listening"
]);

function normalizeSkill(skill) {
    if (skill === "languageControl") {
        return "language-control";
    }

    return skill;
}

function getDatasetKeyForSkill(skill) {
    const normalizedSkill = normalizeSkill(skill);

    if (!OBJECTIVE_SKILLS.includes(normalizedSkill)) {
        throw new Error(
            `Unsupported objective skill "${skill}".`
        );
    }

    if (normalizedSkill === "language-control") {
        return "languageControl";
    }

    return normalizedSkill;
}

function assertDifficulty(difficulty) {
    if (!Number.isInteger(difficulty) || !(difficulty in DIFFICULTY_LABELS)) {
        throw new Error(
            `Unsupported difficulty "${difficulty}". Expected 1, 2, or 3.`
        );
    }
}

export function selectTestlet(
    datasets,
    skill,
    difficulty = STARTING_DIFFICULTY
) {
    if (!datasets) {
        throw new Error(
            "Assessment datasets have not been loaded."
        );
    }

    assertDifficulty(difficulty);

    const normalizedSkill = normalizeSkill(skill);
    const datasetKey = getDatasetKeyForSkill(normalizedSkill);
    const dataset = datasets[datasetKey];

    if (!dataset) {
        throw new Error(
            `Dataset for skill "${normalizedSkill}" is unavailable.`
        );
    }

    const matchingItems = (dataset.items ?? []).filter(
        (item) =>
            item.skill === normalizedSkill &&
            item.difficulty === difficulty &&
            item.status === "pilot"
    );

    if (matchingItems.length !== TESTLET_SIZE) {
        throw new Error(
            `Expected ${TESTLET_SIZE} pilot items for "${normalizedSkill}" at difficulty ${difficulty}, found ${matchingItems.length}.`
        );
    }

    return {
        skill: normalizedSkill,
        difficulty,
        difficultyLabel: DIFFICULTY_LABELS[difficulty],
        size: TESTLET_SIZE,
        itemIds: matchingItems.map((item) => item.id),
        items: matchingItems
    };
}

// ========================================
// B03.0.3 — Response Recording
// ========================================

function assertObjectiveItem(item) {
    if (!item || typeof item !== "object") {
        throw new Error("A valid objective item is required.");
    }

    if (!OBJECTIVE_SKILLS.includes(item.skill)) {
        throw new Error(
            `Item "${item.id ?? "unknown"}" is not an objective assessment item.`
        );
    }

    if (!Array.isArray(item.options) || item.options.length === 0) {
        throw new Error(
            `Item "${item.id}" does not contain valid answer options.`
        );
    }

    if (
        !Number.isInteger(item.correctAnswer) ||
        item.correctAnswer < 0 ||
        item.correctAnswer >= item.options.length
    ) {
        throw new Error(
            `Item "${item.id}" contains an invalid correctAnswer index.`
        );
    }
}

function assertSelectedAnswer(item, selectedAnswer) {
    if (
        !Number.isInteger(selectedAnswer) ||
        selectedAnswer < 0 ||
        selectedAnswer >= item.options.length
    ) {
        throw new Error(
            `Invalid selected answer for item "${item.id}".`
        );
    }
}

function assertResponseTime(responseTimeMs) {
    if (
        !Number.isFinite(responseTimeMs) ||
        responseTimeMs < 0
    ) {
        throw new Error(
            "responseTimeMs must be a non-negative number."
        );
    }
}

export function createResponseRecord(
    item,
    selectedAnswer,
    responseTimeMs
) {
    assertObjectiveItem(item);
    assertSelectedAnswer(item, selectedAnswer);
    assertResponseTime(responseTimeMs);

    return {
        itemId: item.id,
        selectedAnswer,
        correct: selectedAnswer === item.correctAnswer,
        responseTimeMs: Math.round(responseTimeMs),
        skill: item.skill,
        domain: item.domain,
        difficulty: item.difficulty,
        construct: item.construct
    };
}

export function createResponseCollection() {
    return [];
}

export function recordResponse(
    responses,
    response
) {
    if (!Array.isArray(responses)) {
        throw new Error(
            "Response collection must be an array."
        );
    }

    if (!response || typeof response !== "object") {
        throw new Error(
            "A valid response record is required."
        );
    }

    if (!response.itemId) {
        throw new Error(
            "Response record is missing itemId."
        );
    }

    const existingIndex = responses.findIndex(
        (entry) => entry.itemId === response.itemId
    );

    if (existingIndex >= 0) {
        responses[existingIndex] = response;
    } else {
        responses.push(response);
    }

    return responses;
}

// ========================================
// B03.0.4 — Adaptive Routing
// ========================================

export const ROUTE_ACTIONS = Object.freeze({
    DOWN: "down",
    HOLD: "hold",
    UP: "up"
});

function assertTestletResponses(responses) {
    if (!Array.isArray(responses)) {
        throw new Error(
            "Testlet responses must be an array."
        );
    }

    if (responses.length !== TESTLET_SIZE) {
        throw new Error(
            `Adaptive routing requires exactly ${TESTLET_SIZE} responses.`
        );
    }

    const itemIds = responses.map(
        (response) => response.itemId
    );

    if (new Set(itemIds).size !== TESTLET_SIZE) {
        throw new Error(
            "Adaptive routing requires five unique item responses."
        );
    }

    for (const response of responses) {
        if (typeof response.correct !== "boolean") {
            throw new Error(
                `Response for item "${response.itemId}" is missing a boolean correct value.`
            );
        }

        assertDifficulty(response.difficulty);
    }

    const difficulties = new Set(
        responses.map(
            (response) => response.difficulty
        )
    );

    if (difficulties.size !== 1) {
        throw new Error(
            "All responses in a testlet must have the same difficulty."
        );
    }

    const skills = new Set(
        responses.map(
            (response) => response.skill
        )
    );

    if (skills.size !== 1) {
        throw new Error(
            "All responses in a testlet must belong to the same skill."
        );
    }
}

export function determineRouteAction(correctCount) {
    if (
        !Number.isInteger(correctCount) ||
        correctCount < 0 ||
        correctCount > TESTLET_SIZE
    ) {
        throw new Error(
            `correctCount must be an integer from 0 to ${TESTLET_SIZE}.`
        );
    }

    if (correctCount <= 1) {
        return ROUTE_ACTIONS.DOWN;
    }

    if (correctCount <= 3) {
        return ROUTE_ACTIONS.HOLD;
    }

    return ROUTE_ACTIONS.UP;
}

export function getTargetDifficulty(
    currentDifficulty,
    routeAction
) {
    assertDifficulty(currentDifficulty);

    if (
        !Object.values(ROUTE_ACTIONS).includes(
            routeAction
        )
    ) {
        throw new Error(
            `Unsupported route action "${routeAction}".`
        );
    }

    if (routeAction === ROUTE_ACTIONS.DOWN) {
        return Math.max(
            1,
            currentDifficulty - 1
        );
    }

    if (routeAction === ROUTE_ACTIONS.UP) {
        return Math.min(
            3,
            currentDifficulty + 1
        );
    }

    return currentDifficulty;
}

export function evaluateTestletRoute(responses) {
    assertTestletResponses(responses);

    const correctCount = responses.filter(
        (response) => response.correct
    ).length;

    const currentDifficulty =
        responses[0].difficulty;

    const skill =
        responses[0].skill;

    const action =
        determineRouteAction(correctCount);

    const targetDifficulty =
        getTargetDifficulty(
            currentDifficulty,
            action
        );

    return {
        skill,
        currentDifficulty,
        correctCount,
        totalItems: TESTLET_SIZE,
        action,
        targetDifficulty
    };
}

// ========================================
// B03.0.5 — Skill Progression
// ========================================

export const ASSESSMENT_SEQUENCE = Object.freeze([
    "reading",
    "language-control",
    "listening",
    "speaking"
]);

export const PROGRESSION_STATES = Object.freeze({
    OBJECTIVE: "objective",
    SPEAKING: "speaking",
    COMPLETE: "complete"
});

export function getNextSkill(currentSkill) {
    const normalizedSkill =
        normalizeSkill(currentSkill);

    const currentIndex =
        ASSESSMENT_SEQUENCE.indexOf(
            normalizedSkill
        );

    if (currentIndex === -1) {
        throw new Error(
            `Unsupported assessment skill "${currentSkill}".`
        );
    }

    const nextIndex =
        currentIndex + 1;

    if (
        nextIndex >=
        ASSESSMENT_SEQUENCE.length
    ) {
        return null;
    }

    return ASSESSMENT_SEQUENCE[nextIndex];
}

export function getProgressionState(skill) {
    if (skill === null) {
        return PROGRESSION_STATES.COMPLETE;
    }

    const normalizedSkill =
        normalizeSkill(skill);

    if (
        !ASSESSMENT_SEQUENCE.includes(
            normalizedSkill
        )
    ) {
        throw new Error(
            `Unsupported assessment skill "${skill}".`
        );
    }

    if (normalizedSkill === "speaking") {
        return PROGRESSION_STATES.SPEAKING;
    }

    return PROGRESSION_STATES.OBJECTIVE;
}

export function createAssessmentProgress() {
    return {
        currentSkill: ASSESSMENT_SEQUENCE[0],
        currentDifficulty: STARTING_DIFFICULTY,
        completedSkills: [],
        state: PROGRESSION_STATES.OBJECTIVE
    };
}

export function advanceAssessmentProgress(
    progress
) {
    if (!progress || typeof progress !== "object") {
        throw new Error(
            "A valid assessment progress object is required."
        );
    }

    const currentSkill =
        normalizeSkill(progress.currentSkill);

    if (
        !ASSESSMENT_SEQUENCE.includes(
            currentSkill
        )
    ) {
        throw new Error(
            `Unsupported current skill "${progress.currentSkill}".`
        );
    }

    const nextSkill =
        getNextSkill(currentSkill);

    const completedSkills = [
        ...progress.completedSkills
    ];

    if (
        !completedSkills.includes(currentSkill)
    ) {
        completedSkills.push(currentSkill);
    }

    return {
        currentSkill: nextSkill,
        currentDifficulty:
            nextSkill &&
            nextSkill !== "speaking"
                ? STARTING_DIFFICULTY
                : null,
        completedSkills,
        state: getProgressionState(nextSkill)
    };
}