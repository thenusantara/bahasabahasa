// ========================================
// Uji Bahasa Indonesia Playground
// Listening Audio Runtime
// ========================================

const PLAYBACK_MODES = Object.freeze({
    PREPARATION: "preparation",
    CHALLENGE: "challenge"
});

let playbackMode =
    PLAYBACK_MODES.PREPARATION;

let activeStimulusId = null;

let playbackStarted = false;
let playbackCompleted = false;

let boundAudioPlayer = null;


// ========================================
// Playback State
// ========================================

function assertPlaybackMode(mode) {
    if (
        mode !== PLAYBACK_MODES.PREPARATION &&
        mode !== PLAYBACK_MODES.CHALLENGE
    ) {
        throw new Error(
            `Unsupported playback mode: "${mode}".`
        );
    }
}


export function setPlaybackMode(mode) {
    assertPlaybackMode(mode);

    playbackMode = mode;

    const status =
        document.querySelector(
            "#assessment-audio-status"
        );

    if (status) {
        updatePlaybackStatus();
    }
}


function activateStimulus(stimulus) {
    if (
        !stimulus ||
        typeof stimulus.id !== "string" ||
        !stimulus.id
    ) {
        throw new Error(
            "Listening stimulus requires a valid id."
        );
    }

    if (
        activeStimulusId === stimulus.id
    ) {
        return false;
    }

    activeStimulusId =
        stimulus.id;

    playbackStarted = false;
    playbackCompleted = false;

    return true;
}


export function getPlaybackState() {
    return Object.freeze({
        mode: playbackMode,
        stimulusId:
            activeStimulusId,
        started:
            playbackStarted,
        completed:
            playbackCompleted
    });
}

function updatePlaybackStatus() {
    const {
        status
    } = getAudioElements();

    if (
        playbackMode ===
        PLAYBACK_MODES.PREPARATION
    ) {
        status.textContent =
            "Preparation mode: you may replay the audio.";
        return;
    }

    if (playbackCompleted) {
        status.textContent =
            "Audio completed. Replay is not available in Challenge mode.";
        return;
    }

    if (playbackStarted) {
        status.textContent =
            "Challenge playback in progress. You may pause and resume.";
        return;
    }

    status.textContent =
        "Listen carefully. In Challenge mode, this audio can be played once.";
}


// ========================================
// Playback Lifecycle
// ========================================

function handlePlaybackStarted() {
    playbackStarted = true;

    updatePlaybackStatus();
}


function handlePlaybackEnded() {
    playbackCompleted = true;

    updatePlaybackStatus();
}


function handlePlaybackAttempt(event) {
    if (
        playbackMode !==
        PLAYBACK_MODES.CHALLENGE
    ) {
        return;
    }

    if (!playbackCompleted) {
        return;
    }

    const player =
        event.currentTarget;

    player.pause();

    if (
        Number.isFinite(player.duration)
    ) {
        player.currentTime =
            player.duration;
    }
}


// ========================================
// Playback Event Binding
// ========================================

function bindPlaybackEvents(player) {
    if (boundAudioPlayer === player) {
        return;
    }

    if (boundAudioPlayer) {
        boundAudioPlayer.removeEventListener(
            "play",
            handlePlaybackStarted
        );

        boundAudioPlayer.removeEventListener(
            "ended",
            handlePlaybackEnded
        );

        boundAudioPlayer.removeEventListener(
            "play",
            handlePlaybackAttempt
        );
    }

    player.addEventListener(
        "play",
        handlePlaybackStarted
    );

    player.addEventListener(
        "ended",
        handlePlaybackEnded
    );

    player.addEventListener(
        "play",
        handlePlaybackAttempt
    );

    boundAudioPlayer = player;
}


// ========================================
// Listening Stimulus Validation
// ========================================

function assertListeningStimulus(stimulus) {
    if (
        !stimulus ||
        typeof stimulus !== "object"
    ) {
        throw new Error(
            "Listening stimulus is unavailable."
        );
    }

    if (
        !stimulus.audio ||
        typeof stimulus.audio !== "object"
    ) {
        throw new Error(
            `Listening stimulus "${stimulus.id ?? "unknown"}" has no audio contract.`
        );
    }

    if (
        typeof stimulus.audio.src !== "string" ||
        !stimulus.audio.src.trim()
    ) {
        throw new Error(
            `Listening stimulus "${stimulus.id ?? "unknown"}" has no audio source.`
        );
    }

    if (
        stimulus.audio.status !== "ready"
    ) {
        throw new Error(
            `Listening stimulus "${stimulus.id ?? "unknown"}" is not ready for playback.`
        );
    }

    if (
        stimulus.audio.sameOrigin !== true
    ) {
        throw new Error(
            `Listening stimulus "${stimulus.id ?? "unknown"}" must use a same-origin audio asset.`
        );
    }
}


// ========================================
// Audio DOM Contract
// ========================================

function getAudioElements() {
    const container =
        document.querySelector(
            "#assessment-audio"
        );

    const player =
        document.querySelector(
            "#assessment-audio-player"
        );

    const status =
        document.querySelector(
            "#assessment-audio-status"
        );

    if (
        !container ||
        !player ||
        !status
    ) {
        throw new Error(
            "Listening audio UI contract is incomplete."
        );
    }

    return {
        container,
        player,
        status
    };
}


// ========================================
// Public Audio Runtime
// ========================================

export function hideListeningAudio() {
    const {
        container,
        status
    } = getAudioElements();

    status.textContent = "";
    container.hidden = true;
}

export function terminateListeningAudio() {
    const { container, player, status } =
        getAudioElements();

    player.pause();

    activeStimulusId = null;
    playbackStarted = false;
    playbackCompleted = false;

    status.textContent = "";
    container.hidden = true;
}

export function renderListeningAudio(
    stimulus
) {
    assertListeningStimulus(
        stimulus
    );

    const stimulusChanged =
        activateStimulus(stimulus);

    const {
        container,
        player,
    } = getAudioElements();

    bindPlaybackEvents(player);

    if (stimulusChanged) {
        player.pause();

        player.src =
            stimulus.audio.src;

        player.load();
    }

        updatePlaybackStatus();

    container.hidden = false;
}