// ========================================
// B04.0.7 — Speaking Practice Runtime
// ========================================

const SPEAKING_STATES = Object.freeze({
    READY: "ready",
    PREPARING: "preparing",
    READY_TO_RECORD: "ready-to-record",
    RECORDING: "recording",
    RECORDED: "recorded",
    SELF_REFLECTION: "self-reflection",
    COMPLETE: "complete",
    RECORDER_ERROR: "recorder-error"
});

const DEFAULT_PREPARATION_SECONDS = 30;
const DEFAULT_SPEAKING_SECONDS = 90;

function assertSpeakingState(state) {
    if (
        !Object.values(SPEAKING_STATES)
            .includes(state)
    ) {
        throw new Error(
            `Unknown speaking state "${state}".`
        );
    }
}

function assertDuration(
    value,
    label
) {
    if (
        !Number.isInteger(value) ||
        value <= 0
    ) {
        throw new Error(
            `${label} must be a positive integer.`
        );
    }
}

export function createSpeakingSession(
    task
) {
    if (
        !task ||
        typeof task.id !== "string" ||
        !task.id
    ) {
        throw new Error(
            "A valid speaking task is required."
        );
    }

    const preparationSeconds =
        task.preparationSeconds ??
        DEFAULT_PREPARATION_SECONDS;

    const speakingSeconds =
        task.speakingSeconds ??
        DEFAULT_SPEAKING_SECONDS;

    assertDuration(
        preparationSeconds,
        "Preparation duration"
    );

    assertDuration(
        speakingSeconds,
        "Speaking duration"
    );

    return {
        taskId: task.id,
        state: SPEAKING_STATES.READY,
        preparationSeconds,
        speakingSeconds,
        error: null
    };
}

export function transitionSpeakingState(
    session,
    nextState
) {
    if (!session) {
        throw new Error(
            "Speaking session is required."
        );
    }

    assertSpeakingTransition(
        session.state,
        nextState
    );

    return {
        ...session,
        state: nextState,
        error: null
    };
}

function assertSpeakingTransition(
    currentState,
    nextState
) {
    assertSpeakingState(
        currentState
    );

    assertSpeakingState(
        nextState
    );

    const allowedTransitions =
        SPEAKING_TRANSITIONS[
            currentState
        ];

    if (
        !allowedTransitions.includes(
            nextState
        )
    ) {
        throw new Error(
            `Invalid speaking transition: "${currentState}" → "${nextState}".`
        );
    }
}

export function setSpeakingError(
    session,
    message
) {
    if (!session) {
        throw new Error(
            "Speaking session is required."
        );
    }

    if (
        typeof message !== "string" ||
        !message.trim()
    ) {
        throw new Error(
            "Speaking error message is required."
        );
    }

    return {
        ...session,
        state:
            SPEAKING_STATES
                .RECORDER_ERROR,
        error: message.trim()
    };
}

export function getSpeakingStates() {
    return SPEAKING_STATES;
}

const SPEAKING_TRANSITIONS = Object.freeze({
    [SPEAKING_STATES.READY]: Object.freeze([
        SPEAKING_STATES.PREPARING,
        SPEAKING_STATES.RECORDER_ERROR
    ]),

    [SPEAKING_STATES.PREPARING]: Object.freeze([
        SPEAKING_STATES.READY_TO_RECORD,
        SPEAKING_STATES.RECORDER_ERROR
    ]),

    [SPEAKING_STATES.READY_TO_RECORD]: Object.freeze([
        SPEAKING_STATES.RECORDING,
        SPEAKING_STATES.RECORDER_ERROR
    ]),

    [SPEAKING_STATES.RECORDING]: Object.freeze([
        SPEAKING_STATES.RECORDED,
        SPEAKING_STATES.RECORDER_ERROR
    ]),

    [SPEAKING_STATES.RECORDED]: Object.freeze([
        SPEAKING_STATES.READY_TO_RECORD,
        SPEAKING_STATES.SELF_REFLECTION
    ]),

    [SPEAKING_STATES.SELF_REFLECTION]: Object.freeze([
        SPEAKING_STATES.COMPLETE
    ]),

    [SPEAKING_STATES.COMPLETE]: Object.freeze([]),

    [SPEAKING_STATES.RECORDER_ERROR]: Object.freeze([
        SPEAKING_STATES.READY
    ])
});

export function getRecorderCapability() {
    const hasMediaDevices =
        Boolean(
            navigator.mediaDevices &&
            typeof navigator.mediaDevices
                .getUserMedia === "function"
        );

    const hasMediaRecorder =
        typeof MediaRecorder !==
        "undefined";

    return Object.freeze({
        supported:
            hasMediaDevices &&
            hasMediaRecorder,

        hasMediaDevices,
        hasMediaRecorder
    });
}

export async function requestMicrophoneStream() {
    const capability =
        getRecorderCapability();

    if (!capability.supported) {
        throw new Error(
            "Audio recording is not supported in this browser."
        );
    }

    return navigator.mediaDevices
        .getUserMedia({
            audio: true
        });
}

// ========================================
// MediaRecorder Lifecycle
// ========================================

export function createSpeakingRecorder(
    stream,
    handlers = {}
) {
    if (
        !stream ||
        typeof stream.getAudioTracks !==
            "function"
    ) {
        throw new Error(
            "A valid microphone stream is required."
        );
    }

    if (
        typeof MediaRecorder ===
        "undefined"
    ) {
        throw new Error(
            "MediaRecorder is not supported in this browser."
        );
    }

    const recorder =
        new MediaRecorder(stream);

    if (
        typeof handlers.onDataAvailable ===
        "function"
    ) {
        recorder.addEventListener(
            "dataavailable",
            handlers.onDataAvailable
        );
    }

    if (
        typeof handlers.onStop ===
        "function"
    ) {
        recorder.addEventListener(
            "stop",
            handlers.onStop
        );
    }

    if (
        typeof handlers.onError ===
        "function"
    ) {
        recorder.addEventListener(
            "error",
            handlers.onError
        );
    }

    return recorder;
}