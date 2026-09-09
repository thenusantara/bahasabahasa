// ========================================
// Uji Bahasa Indonesia Playground
// Learning Profile Engine
// ========================================
//
// Scientific boundary:
// - Produces learning signals only.
// - Does not produce an official UKBI score.
// - Does not map to CEFR.
// - Does not certify language proficiency.
// - Speaking self-reflection is never machine scored.
//
// ========================================


const OBJECTIVE_SKILLS = [
    "reading",
    "language-control",
    "listening"
];

const SKILL_LABELS = {
    reading: "Reading",
    "language-control": "Language Control",
    listening: "Listening",
    speaking: "Speaking Practice"
};

const DIFFICULTY_LABELS = {
    1: "Foundation",
    2: "Developing",
    3: "Stronger"
};


// ========================================
// Validation Helpers
// ========================================

function assertResponseCollection(
    responses
) {
    if (!Array.isArray(responses)) {
        throw new TypeError(
            "Assessment responses must be an array."
        );
    }
}


function getResponseCorrectness(
    response
) {
    if (
        typeof response?.isCorrect ===
        "boolean"
    ) {
        return response.isCorrect;
    }

    if (
        typeof response?.correct ===
        "boolean"
    ) {
        return response.correct;
    }

    /*
     * Compatibility guard.
     *
     * The profile engine deliberately does not
     * reconstruct correctness from answer keys.
     * Correctness should already have been resolved
     * by the assessment engine.
     */
    return null;
}


// ========================================
// Response Grouping
// ========================================

function getResponsesForSkill(
    responses,
    skill
) {
    return responses.filter(
        (response) =>
            response?.skill === skill
    );
}


function groupResponsesByDifficulty(
    responses
) {
    const groups = {
        1: [],
        2: [],
        3: []
    };

    responses.forEach((response) => {
        const difficulty =
            Number(response?.difficulty);

        if (
            difficulty === 1 ||
            difficulty === 2 ||
            difficulty === 3
        ) {
            groups[difficulty].push(
                response
            );
        }
    });

    return groups;
}


// ========================================
// Evidence Summary
// ========================================

function summarizeResponseSet(
    responses
) {
    let correct = 0;
    let scorable = 0;

    responses.forEach((response) => {
        const correctness =
            getResponseCorrectness(
                response
            );

        if (correctness === null) {
            return;
        }

        scorable += 1;

        if (correctness) {
            correct += 1;
        }
    });

    return {
        attempted:
            responses.length,

        scorable,

        correct,

        proportionCorrect:
            scorable > 0
                ? correct / scorable
                : null
    };
}


// ========================================
// Learning Signal
// ========================================

function deriveSkillSignal(
    skillResponses
) {
    if (skillResponses.length === 0) {
        return {
            level: null,
            label: "No Evidence",
            confidence: "insufficient"
        };
    }

    const byDifficulty =
        groupResponsesByDifficulty(
            skillResponses
        );

    const foundation =
        summarizeResponseSet(
            byDifficulty[1]
        );

    const developing =
        summarizeResponseSet(
            byDifficulty[2]
        );

    const stronger =
        summarizeResponseSet(
            byDifficulty[3]
        );

    /*
     * Rule-based pilot interpretation.
     *
     * Stronger is only supported when:
     * - Developing evidence contains at least
     *   four correct responses, AND
     * - Stronger evidence contains at least
     *   three correct responses.
     *
     * This mirrors the current pilot routing
     * logic without claiming psychometric
     * calibration.
     */

    if (
        developing.scorable >= 5 &&
        developing.correct >= 4 &&
        stronger.scorable >= 5 &&
        stronger.correct >= 3
    ) {
        return {
            level: 3,
            label:
                DIFFICULTY_LABELS[3],
            confidence:
                "pilot-learning-signal"
        };
    }

    /*
     * Presence of a routed Foundation set is
     * evidence that the learner was routed
     * downward from Developing practice.
     *
     * We intentionally do not create an
     * additional proficiency threshold here.
     */
    if (foundation.scorable > 0) {
        return {
            level: 1,
            label:
                DIFFICULTY_LABELS[1],
            confidence:
                "pilot-learning-signal"
        };
    }

    /*
     * Otherwise the evidence remains at the
     * Developing practice level.
     */
    if (developing.scorable > 0) {
        return {
            level: 2,
            label:
                DIFFICULTY_LABELS[2],
            confidence:
                "pilot-learning-signal"
        };
    }

    return {
        level: null,
        label: "No Evidence",
        confidence: "insufficient"
    };
}


// ========================================
// Construct Evidence
// ========================================

function summarizeConstructEvidence(
    responses
) {
    const constructMap =
        new Map();

    responses.forEach((response) => {
        const construct =
            response?.construct;

        const correctness =
            getResponseCorrectness(
                response
            );

        if (
            typeof construct !== "string" ||
            !construct ||
            correctness === null
        ) {
            return;
        }

        if (
            !constructMap.has(
                construct
            )
        ) {
            constructMap.set(
                construct,
                {
                    construct,
                    evidenceCount: 0,
                    correctCount: 0
                }
            );
        }

        const record =
            constructMap.get(
                construct
            );

        record.evidenceCount += 1;

        if (correctness) {
            record.correctCount += 1;
        }
    });

    return Array.from(
        constructMap.values()
    ).map((record) => {
        const proportion =
            record.evidenceCount > 0
                ? (
                    record.correctCount /
                    record.evidenceCount
                )
                : null;

        return {
            ...record,

            proportionCorrect:
                proportion,

            /*
             * Scientific Constitution:
             *
             * A construct can only be surfaced
             * as a possible strength when there
             * are at least two pieces of evidence
             * and >= 70% are correct.
             */
            possibleStrength:
                record.evidenceCount >= 2 &&
                proportion >= 0.7
        };
    });
}


// ========================================
// Recommendation
// ========================================

function createSkillRecommendation(
    skill,
    signal
) {
    const label =
        SKILL_LABELS[skill] ??
        skill;

    if (!signal.level) {
        return (
            `Continue practicing ${label.toLowerCase()} ` +
            "to collect more learning evidence."
        );
    }

    if (signal.level === 1) {
        return (
            `Build confidence in foundational ${label.toLowerCase()} ` +
            "tasks before increasing difficulty."
        );
    }

    if (signal.level === 2) {
        return (
            `Continue developing ${label.toLowerCase()} ` +
            "through varied practice and review."
        );
    }

    return (
        `Continue challenging your ${label.toLowerCase()} ` +
        "with more complex practice tasks."
    );
}


// ========================================
// Objective Skill Profile
// ========================================

function createObjectiveSkillProfile(
    responses,
    skill
) {
    const skillResponses =
        getResponsesForSkill(
            responses,
            skill
        );

    const signal =
        deriveSkillSignal(
            skillResponses
        );

    return {
        skill,

        label:
            SKILL_LABELS[skill] ??
            skill,

        evidenceCount:
            skillResponses.length,

        signal,

        difficultyEvidence:
            groupResponsesByDifficulty(
                skillResponses
            ),

        constructs:
            summarizeConstructEvidence(
                skillResponses
            ),

        recommendation:
            createSkillRecommendation(
                skill,
                signal
            )
    };
}


// ========================================
// Speaking Profile
// ========================================

function createSpeakingProfile(
    speakingSession
) {
    if (!speakingSession) {
        return {
            skill: "speaking",

            label:
                SKILL_LABELS.speaking,

            completed: false,

            machineScored: false,

            reflection: [],

            recommendation:
                "Complete a speaking practice task and reflect on your response."
        };
    }

    const reflection =
        Array.isArray(
            speakingSession.reflection
        )
            ? speakingSession.reflection.map(
                (entry) => ({
                    construct:
                        entry.construct,

                    checked:
                        Boolean(
                            entry.checked
                        )
                })
            )
            : [];

    return {
        skill: "speaking",

        label:
            SKILL_LABELS.speaking,

        completed:
            speakingSession.state ===
            "complete",

        machineScored: false,

        reflection,

        recommendation:
            "Use your self-reflection to choose what you want to improve in your next speaking practice."
    };
}


// ========================================
// Overall Learning Profile
// ========================================

export function createLearningProfile(
    responses,
    speakingSession = null
) {
    assertResponseCollection(
        responses
    );

    const objectiveProfiles =
        OBJECTIVE_SKILLS.map(
            (skill) =>
                createObjectiveSkillProfile(
                    responses,
                    skill
                )
        );

    const speakingProfile =
        createSpeakingProfile(
            speakingSession
        );

    return {
        schemaVersion: "0.1.0",

        type:
            "pilot-learning-profile",

        generatedAt:
            new Date().toISOString(),

        objective:
            objectiveProfiles,

        speaking:
            speakingProfile,

        limitations: [
            "This profile is a learning signal.",
            "It is not an official UKBI score.",
            "It does not map to a CEFR level.",
            "It is not a certification outcome.",
            "It does not represent overall language proficiency.",
            "Speaking practice is not machine scored."
        ]
    };
}


// ========================================
// Public Utility Exports
// ========================================

export {
    OBJECTIVE_SKILLS,
    SKILL_LABELS,
    summarizeResponseSet,
    summarizeConstructEvidence
};