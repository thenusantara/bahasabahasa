// ========================================
// Uji Bahasa Indonesia Playground
// Application Orchestration
// ========================================

import {
    loadAssessmentDatasets,
    createAssessmentProgress,
    createResponseCollection,
    selectTestlet,
    createResponseRecord,
    recordResponse,
    evaluateTestletRoute,
    advanceAssessmentProgress,
    getReadingStimuli,
    getListeningStimuli,
    getSpeakingTasks
} from "./engine.js";

import {
    renderListeningAudio,
    hideListeningAudio,
    setPlaybackMode,
    terminateListeningAudio
} from "./audio.js";

import {
    createSpeakingSession,
    transitionSpeakingState,
    setSpeakingError,
    requestMicrophoneStream,
    createSpeakingRecorder
} from "./speaking.js";

import {
    createLearningProfile
} from "./profile.js";

// ========================================
// Application State
// ========================================

let assessmentDatasets = null;
let assessmentProgress = null;
let assessmentResponses = null;
let learningProfile = null;

let currentTestlet = null;
let currentItemIndex = 0;
let currentItemStartedAt = null;
let selectedAnswerIndex = null;
let currentTestletComplete = false;
let currentTestletStage = 0;

// ========================================
// Assessment Initialization
// ========================================

async function initializeAssessmentData() {
    document.documentElement.dataset.assessmentData =
        "loading";

    try {
        assessmentDatasets =
            await loadAssessmentDatasets();

            setPlaybackMode("challenge");

        assessmentProgress =
            createAssessmentProgress();

        assessmentResponses =
            createResponseCollection();

        document.documentElement.dataset.assessmentData =
            "ready";

        console.info(
            "Uji Bahasa assessment engine ready."
        );
    } catch (error) {
        assessmentDatasets = null;
        assessmentProgress = null;
        assessmentResponses = null;

        resetObjectiveRuntime();

        document.documentElement.dataset.assessmentData =
            "error";

        console.error(
            "Unable to initialize assessment data.",
            error
        );
    }
}


// ========================================
// Screen Navigation
// ========================================

const screens =
    document.querySelectorAll(
        "[data-uji-screen]"
    );

function showScreen(name) {
    screens.forEach((screen) => {
        screen.hidden =
            screen.dataset.ujiScreen !== name;
    });

    const app =
        document.querySelector("#uji-app");

    if (app) {
        app.dataset.screen = name;
    }
}


// ========================================
// B04 — Runtime Helpers
// ========================================

function resetObjectiveRuntime() {
    currentTestlet = null;
    currentItemIndex = 0;
    currentItemStartedAt = null;
    selectedAnswerIndex = null;
    currentTestletComplete = false;
    currentTestletStage = 0;
}

function getCurrentItem() {
    if (!currentTestlet) {
        return null;
    }

    return (
        currentTestlet.items[
            currentItemIndex
        ] ?? null
    );
}

function formatSkillLabel(skill) {
    const labels = {
        reading:
            "Reading",

        "language-control":
            "Language Control",

        listening:
            "Listening",

        speaking:
            "Speaking Practice"
    };

    return labels[skill] ?? skill;
}

function formatDifficultyLabel(label) {
    if (!label) {
        return "";
    }

    return (
        label.charAt(0).toUpperCase() +
        label.slice(1).toLowerCase()
    );
}


// ========================================
// B04 — Assessment UI State
// ========================================

function getContinueButton() {
    const button =
        document.querySelector(
            "#assessment-continue"
        );

    if (!button) {
        throw new Error(
            "Assessment Continue button is unavailable."
        );
    }

    return button;
}

function setContinueEnabled(enabled) {
    getContinueButton().disabled =
        !enabled;
}

function setContinueLabel(label) {
    getContinueButton().textContent =
        label;
}

function setRuntimeMessage(message = "") {
    const runtimeMessage =
        document.querySelector(
            "#assessment-runtime-message"
        );

    if (runtimeMessage) {
        runtimeMessage.textContent =
            message;
    }
}


// ========================================
// B04.0.2 — Answer Selection
// ========================================

function handleAnswerSelection(event) {
    if (currentTestletComplete) {
        return;
    }

    const input =
        event.currentTarget;

    const answerIndex =
        Number.parseInt(
            input.value,
            10
        );

    if (!Number.isInteger(answerIndex)) {
        selectedAnswerIndex = null;

        setContinueEnabled(false);

        return;
    }

    selectedAnswerIndex =
        answerIndex;

    setContinueEnabled(true);
    setRuntimeMessage("");
}


// ========================================
// B04 — Option Rendering
// ========================================

function createOptionElement(
    option,
    optionIndex
) {
    const wrapper =
        document.createElement(
            "label"
        );

    wrapper.className =
        "uji-option";

    const input =
        document.createElement(
            "input"
        );

    input.type = "radio";
    input.name = "uji-answer";
    input.value =
        String(optionIndex);

    input.addEventListener(
        "change",
        handleAnswerSelection
    );

    const text =
        document.createElement(
            "span"
        );

    text.className =
        "uji-option__text";

    text.textContent =
        option;

    wrapper.append(
        input,
        text
    );

    return wrapper;
}

function getReadingStimulusForItem(item) {
    if (!item || item.skill !== "reading") {
        return null;
    }

    if (
        typeof item.stimulusId !== "string" ||
        !item.stimulusId
    ) {
        throw new Error(
            `Reading item "${
                item.id ?? "unknown"
            }" has no stimulusId.`
        );
    }

    const stimuli =
        getReadingStimuli(
            assessmentDatasets
        );

    const stimulus =
        stimuli.find(
            (candidate) =>
                candidate.id ===
                item.stimulusId
        );

    if (!stimulus) {
        throw new Error(
            `Reading stimulus "${
                item.stimulusId
            }" was not found.`
        );
    }

    return stimulus;
}

function getListeningStimulusForItem(item) {
    if (
        !item ||
        item.skill !== "listening"
    ) {
        return null;
    }

    if (
        typeof item.stimulusId !== "string" ||
        !item.stimulusId
    ) {
        throw new Error(
            `Listening item "${item.id ?? "unknown"}" has no stimulusId.`
        );
    }

    const stimuli =
        getListeningStimuli(
            assessmentDatasets
        );

    const stimulus =
        stimuli.find(
            (candidate) =>
                candidate.id ===
                item.stimulusId
        );

    if (!stimulus) {
        throw new Error(
            `Listening stimulus "${item.stimulusId}" was not found.`
        );
    }

    return stimulus;
}

// ========================================
// B04 — Current Item Renderer
// ========================================

function renderCurrentItem() {
    const item =
        getCurrentItem();

    if (!item || !currentTestlet) {
        throw new Error(
            "No current assessment item is available."
        );
    }

    const skillElement =
        document.querySelector(
            "#assessment-skill"
        );

    const progressElement =
        document.querySelector(
            "#assessment-progress"
        );

    const difficultyElement =
        document.querySelector(
            "#assessment-difficulty"
        );

    const stimulusElement =
        document.querySelector(
            "#assessment-stimulus"
        );

    const questionElement =
        document.querySelector(
            "#assessment-question"
        );

    const optionsElement =
        document.querySelector(
            "#assessment-options"
        );

    if (
        !skillElement ||
        !progressElement ||
        !difficultyElement ||
        !stimulusElement ||
        !questionElement ||
        !optionsElement
    ) {
        throw new Error(
            "Assessment UI contract is incomplete."
        );
    }

    selectedAnswerIndex = null;
    currentTestletComplete = false;

    setContinueLabel("Continue");
    setContinueEnabled(false);
    setRuntimeMessage("");

    skillElement.textContent =
        formatSkillLabel(
            currentTestlet.skill
        );

    progressElement.textContent =
        `Question ${
            currentItemIndex + 1
        } of ${currentTestlet.size}`;

    difficultyElement.textContent =
        formatDifficultyLabel(
            currentTestlet.difficultyLabel
        );

    stimulusElement.replaceChildren();

    hideListeningAudio();

    if (item.skill === "reading") {
    const readingStimulus =
        getReadingStimulusForItem(
            item
        );

    const title =
        document.createElement("h2");

    title.className =
        "uji-stimulus__title";

    title.textContent =
        readingStimulus.title;

    const content =
        document.createElement("p");

    content.className =
        "uji-stimulus__content";

    content.textContent =
        readingStimulus.content;

    stimulusElement.append(
        title,
        content
    );

    stimulusElement.hidden =
        false;
    } else {
    stimulusElement.hidden =
        true;
    }

    if (item.skill === "listening") {
        const listeningStimulus =
            getListeningStimulusForItem(
                item
            );

        renderListeningAudio(
            listeningStimulus
        );
    }

    questionElement.textContent =
        item.question;

    optionsElement.replaceChildren();

    item.options.forEach(
        (option, optionIndex) => {
            optionsElement.appendChild(
                createOptionElement(
                    option,
                    optionIndex
                )
            );
        }
    );

    currentItemStartedAt =
        performance.now();
}


// ========================================
// B04 — Objective Runtime Start
// ========================================

function startObjectiveRuntime() {
    if (
        !assessmentDatasets ||
        !assessmentProgress
    ) {
        throw new Error(
            "Assessment runtime cannot start before initialization."
        );
    }

    if (
        assessmentProgress.state !==
        "objective"
    ) {
        throw new Error(
            `Cannot start objective runtime from state "${assessmentProgress.state}".`
        );
    }

    currentTestlet =
        selectTestlet(
            assessmentDatasets,
            assessmentProgress.currentSkill,
            assessmentProgress.currentDifficulty
        );

    currentItemIndex = 0;
    selectedAnswerIndex = null;
    currentTestletComplete = false;
    currentTestletStage = 0;

    renderCurrentItem();
}


// ========================================
// B04.0.2 — Response Submission
// ========================================

function submitCurrentResponse() {
    const item =
        getCurrentItem();

    if (
        !item ||
        !currentTestlet ||
        currentItemStartedAt === null
    ) {
        throw new Error(
            "No active assessment item can be submitted."
        );
    }

    if (
        !Number.isInteger(
            selectedAnswerIndex
        )
    ) {
        setRuntimeMessage(
            "Choose an answer before continuing."
        );

        return null;
    }

    const responseTimeMs =
        Math.max(
            0,
            performance.now() -
                currentItemStartedAt
        );

    const response =
        createResponseRecord(
            item,
            selectedAnswerIndex,
            responseTimeMs
        );

    recordResponse(
        assessmentResponses,
        response
    );

    recordResponse(
    assessmentResponses,
    response
    );

    currentItemStartedAt = null;

    setContinueEnabled(false);

    return response;
}

// ========================================
// B04.0.3 — Testlet Navigation
// ========================================

function hasNextItem() {
    if (!currentTestlet) {
        return false;
    }

    return (
        currentItemIndex <
        currentTestlet.items.length - 1
    );
}

function moveToNextItem() {
    if (!hasNextItem()) {
        throw new Error(
            "No next item is available in the current testlet."
        );
    }

    currentItemIndex += 1;

    renderCurrentItem();
}


// ========================================
// B04.0.4 — Testlet Evidence
// ========================================

function getCurrentTestletResponses() {
    if (
        !currentTestlet ||
        !Array.isArray(
            assessmentResponses
        )
    ) {
        throw new Error(
            "Current testlet evidence is unavailable."
        );
    }

    const itemIds =
        new Set(
            currentTestlet.items.map(
                (item) => item.id
            )
        );

    const responses =
        assessmentResponses.filter(
            (response) =>
                itemIds.has(
                    response.itemId
                )
        );

    if (
        responses.length !==
        currentTestlet.size
    ) {
        throw new Error(
            `Expected ${currentTestlet.size} responses for the current testlet, received ${responses.length}.`
        );
    }

    return responses;
}


// ========================================
// B04.0.4 — Adaptive Routing
// ========================================

function startRoutedTestlet(route) {
    if (
        !currentTestlet ||
        currentTestletStage !== 0
    ) {
        throw new Error(
            "A routed testlet cannot be started from the current runtime state."
        );
    }

    if (
        route.action !== "down" &&
        route.action !== "up"
    ) {
        throw new Error(
            `Route "${route.action}" does not require a second testlet.`
        );
    }

    currentTestlet =
        selectTestlet(
            assessmentDatasets,
            currentTestlet.skill,
            route.targetDifficulty
        );

    currentTestletStage = 1;
    currentItemIndex = 0;
    selectedAnswerIndex = null;
    currentTestletComplete = false;

    renderCurrentItem();

    setRuntimeMessage(
        route.action === "up"
            ? "Continuing with a stronger practice set."
            : "Continuing with a foundation practice set."
    );

    console.info(
        "Assessment routed to second testlet.",
        {
            skill:
                currentTestlet.skill,

            action:
                route.action,

            targetDifficulty:
                route.targetDifficulty
        }
    );
}


// ========================================
// B04.0.5 — Skill Completion Boundary
// ========================================

function completeObjectiveSkill(
    route = null
) {
    if (!currentTestlet) {
        throw new Error(
            "No current objective skill can be completed."
        );
    }

    currentTestletComplete = true;
    selectedAnswerIndex = null;
    currentItemStartedAt = null;

    setContinueLabel(
        "Continue to Next Section"
    );

    setContinueEnabled(true);

    setRuntimeMessage(
        "You completed this practice section."
    );

    console.info(
        "Objective skill complete.",
        {
            skill:
                currentTestlet.skill,

            finalDifficulty:
                currentTestlet.difficulty,

            testletsCompleted:
                currentTestletStage + 1,

            route:
                route?.action ??
                "terminal"
        }
    );
}


// ========================================
// B04.0.4 — Completed Testlet Resolution
// ========================================

function resolveCompletedTestlet() {
    const responses =
        getCurrentTestletResponses();

    /*
     * A routed second testlet is terminal.
     * No third testlet is permitted.
     */
    if (currentTestletStage === 1) {
        completeObjectiveSkill();

        return;
    }

    const route =
        evaluateTestletRoute(
            responses
        );

    console.info(
        "Assessment testlet route evaluated.",
        {
            skill:
                route.skill,

            currentDifficulty:
                route.currentDifficulty,

            correctCount:
                route.correctCount,

            action:
                route.action,

            targetDifficulty:
                route.targetDifficulty
        }
    );

    if (route.action === "hold") {
        completeObjectiveSkill(
            route
        );

        return;
    }

    startRoutedTestlet(
        route
    );
}

// ========================================
// B04 — Objective Runtime Continuation
// ========================================

function continueObjectiveRuntime() {
    const response =
        submitCurrentResponse();

    if (!response) {
        return;
    }

    console.info(
        "Assessment response recorded.",
        {
            itemId:
                response.itemId,

            skill:
                response.skill,

            difficulty:
                response.difficulty,

            responseTimeMs:
                response.responseTimeMs
        }
    );

    if (hasNextItem()) {
        moveToNextItem();

        return;
    }

    resolveCompletedTestlet();
}

// ========================================
// B04.0.7 — Speaking Practice Runtime
// ========================================

let speakingSession = null;
let currentSpeakingTask = null;

let preparationTimerId = null;
let preparationSecondsRemaining = 0;

let microphoneStream = null;
let speakingRecorder = null;

let recordingTimerId = null;
let recordingSecondsRemaining = 0;
let recordingChunks = [];

let recordingObjectUrl = null;

function selectSpeakingTask() {
    const tasks =
        getSpeakingTasks(
            assessmentDatasets
        );

    if (
        !Array.isArray(tasks) ||
        tasks.length === 0
    ) {
        throw new Error(
            "No speaking tasks are available."
        );
    }

    return tasks[0];
}

function renderSpeakingTask(
    task
) {
    const container =
        document.querySelector(
            "#speaking-content"
        );

    if (!container) {
        throw new Error(
            "Speaking content container was not found."
        );
    }

    if (
        !task ||
        typeof task.id !== "string" ||
        !task.id ||
        typeof task.title !== "string" ||
        !task.title ||
        typeof task.prompt !== "string" ||
        !task.prompt
    ) {
        throw new Error(
            "A valid speaking task is required."
        );
    }

    container.replaceChildren();

    const taskLabel =
        document.createElement("p");

    taskLabel.className =
        "uji-speaking__label";

    taskLabel.textContent =
        `${task.domain} practice`;

    const title =
        document.createElement("h3");

    title.className =
        "uji-speaking__task-title";

    title.textContent =
        task.title;

    const prompt =
        document.createElement("p");

    prompt.className =
        "uji-speaking__prompt";

    prompt.textContent =
        task.prompt;

    const timing =
        document.createElement("p");

    timing.className =
        "uji-speaking__timing";

    timing.textContent =
        `Preparation: ${task.preparationSeconds} seconds · Speaking: ${task.speakingSeconds} seconds`;

    container.append(
        taskLabel,
        title,
        prompt,
        timing
    );
}

function startSpeakingRuntime() {
    currentSpeakingTask =
        selectSpeakingTask();

    speakingSession =
        createSpeakingSession(
            currentSpeakingTask
        );

    renderSpeakingTask(
        currentSpeakingTask
    );

    preparationSecondsRemaining =
    speakingSession
        .preparationSeconds;

        renderPreparationTimer();

    console.info(
        "Speaking practice initialized.",
        {
            taskId:
                currentSpeakingTask.id,

            domain:
                currentSpeakingTask.domain,

            state:
                speakingSession.state,

            machineScored:
                currentSpeakingTask
                    .machineScored
        }
    );
}

function formatSpeakingTime(
    totalSeconds
) {
    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderPreparationTimer() {
    const timer =
        document.querySelector(
            "#speaking-preparation-timer"
        );

    if (!timer) {
        throw new Error(
            "Speaking preparation timer was not found."
        );
    }

    timer.textContent =
        formatSpeakingTime(
            preparationSecondsRemaining
        );
}

function completePreparation() {
    if (preparationTimerId !== null) {
        clearInterval(
            preparationTimerId
        );

        preparationTimerId = null;
    }

    preparationSecondsRemaining = 0;

    renderPreparationTimer();

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "ready-to-record"
        );

    const status =
        document.querySelector(
            "#speaking-preparation-status"
        );

    const button =
        document.querySelector(
            "#speaking-start-preparation"
        );

    const enableMicrophoneButton =
        document.querySelector(
            "#speaking-enable-microphone"
        );

    if (
        !status ||
        !button ||
        !enableMicrophoneButton
    ) {
        throw new Error(
            "Speaking preparation controls were not found."
        );
    }

    status.textContent =
        "Preparation complete. You are ready to record.";

    button.disabled = true;

    enableMicrophoneButton.disabled =
        false;
}

const recorder =
    document.querySelector(
        "#speaking-recorder"
    );

if (!recorder) {
    throw new Error(
        "Speaking recorder controls were not found."
    );
}

recorder.hidden = false;

function startPreparationTimer() {
    if (!speakingSession) {
        throw new Error(
            "Speaking session has not been initialized."
        );
    }

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "preparing"
        );

    preparationSecondsRemaining =
        speakingSession
            .preparationSeconds;

    const status =
        document.querySelector(
            "#speaking-preparation-status"
        );

    const button =
        document.querySelector(
            "#speaking-start-preparation"
        );

    if (!status || !button) {
        throw new Error(
            "Speaking preparation controls were not found."
        );
    }

    status.textContent =
        "Preparation time has started.";

    button.disabled = true;

    renderPreparationTimer();

    preparationTimerId =
        window.setInterval(
            () => {
                preparationSecondsRemaining -= 1;

                if (
                    preparationSecondsRemaining <= 0
                ) {
                    completePreparation();

                    return;
                }

                renderPreparationTimer();
            },
            1000
        );
}

async function enableSpeakingMicrophone() {
    if (
        !speakingSession ||
        speakingSession.state !==
            "ready-to-record"
    ) {
        throw new Error(
            "Speaking session is not ready for microphone access."
        );
    }

    const status =
        document.querySelector(
            "#speaking-recorder-status"
        );

    const button =
        document.querySelector(
            "#speaking-enable-microphone"
        );

    if (!status || !button) {
        throw new Error(
            "Speaking microphone controls were not found."
        );
    }

    button.disabled = true;

    status.textContent =
        "Requesting microphone access...";

    try {
        microphoneStream =
            await requestMicrophoneStream();

        const startRecordingButton =
            document.querySelector(
                "#speaking-start-recording"
            );

        if (!startRecordingButton) {
            throw new Error(
                "Speaking recording button was not found."
            );
        }

        startRecordingButton.disabled = false;

        status.textContent =
            "Microphone ready. Recording has not started.";
    } catch (error) {
        microphoneStream = null;

        speakingSession =
            setSpeakingError(
                speakingSession,
                "Microphone access is unavailable."
            );

        status.textContent =
            "Microphone access is unavailable.";

        console.error(
            "Unable to enable speaking microphone.",
            error
        );
    }
}


function startSpeakingRecording() {
    if (
        !speakingSession ||
        speakingSession.state !==
            "ready-to-record"
    ) {
        throw new Error(
            "Speaking session is not ready to record."
        );
    }

    if (!microphoneStream) {
        throw new Error(
            "Microphone has not been enabled."
        );
    }

    const status =
        document.querySelector(
            "#speaking-recorder-status"
        );

    const startButton =
        document.querySelector(
            "#speaking-start-recording"
        );

    const stopButton =
        document.querySelector(
            "#speaking-stop-recording"
        );

    if (
        !status ||
        !startButton ||
        !stopButton
    ) {
        throw new Error(
            "Speaking recording controls were not found."
        );
    }

    recordingChunks = [];

    speakingRecorder =
        createSpeakingRecorder(
            microphoneStream,
            {
                onDataAvailable(event) {
                    if (
                        event.data &&
                        event.data.size > 0
                    ) {
                        recordingChunks.push(
                            event.data
                        );
                    }
                },

                onStop() {
                    completeSpeakingRecording();
                },

                onError(error) {
                    console.error(
                        "Speaking recorder error.",
                        error
                    );
                }
            }
        );

    speakingRecorder.start();

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "recording"
        );

    startButton.disabled = true;
    stopButton.disabled = false;

    status.textContent =
        "Recording in progress.";

    recordingSecondsRemaining =
        speakingSession.speakingSeconds;

    recordingTimerId =
        window.setInterval(
            () => {
                recordingSecondsRemaining -= 1;

                if (
                    recordingSecondsRemaining <= 0
                ) {
                    clearInterval(
                        recordingTimerId
                    );

                    recordingTimerId = null;

                    stopSpeakingRecording();
                }
            },
            1000
        );
}


function stopMicrophoneStream() {
    if (!microphoneStream) {
        return;
    }

    microphoneStream
        .getTracks()
        .forEach((track) => {
            track.stop();
        });

    microphoneStream = null;
}

function completeSpeakingRecording() {
    if (recordingTimerId !== null) {
        clearInterval(
            recordingTimerId
        );

        recordingTimerId = null;
    }

    recordingSecondsRemaining = 0;

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "recorded"
        );

    const status =
        document.querySelector(
            "#speaking-recorder-status"
        );

    const stopButton =
        document.querySelector(
            "#speaking-stop-recording"
        );

    if (!status || !stopButton) {
        throw new Error(
            "Speaking recording controls were not found."
        );
    }

    stopButton.disabled = true;

    status.textContent =
        "Recording complete.";

    stopMicrophoneStream();

    renderSpeakingPlayback();
}

function revokeRecordingObjectUrl() {
    if (!recordingObjectUrl) {
        return;
    }

    URL.revokeObjectURL(
        recordingObjectUrl
    );

    recordingObjectUrl = null;
}

function resetSpeakingPlayback() {
    const playbackContainer =
        document.querySelector(
            "#speaking-playback"
        );

    const playbackAudio =
        document.querySelector(
            "#speaking-playback-audio"
        );

    if (
        !playbackContainer ||
        !playbackAudio
    ) {
        throw new Error(
            "Speaking playback controls were not found."
        );
    }

    playbackAudio.pause();

    playbackAudio.removeAttribute(
        "src"
    );

    playbackAudio.load();

    playbackContainer.hidden = true;

    revokeRecordingObjectUrl();

    recordingChunks = [];
}

function renderSpeakingPlayback() {
    const playbackContainer =
        document.querySelector(
            "#speaking-playback"
        );

    const playbackAudio =
        document.querySelector(
            "#speaking-playback-audio"
        );

    const playbackStatus =
        document.querySelector(
            "#speaking-playback-status"
        );

    if (
        !playbackContainer ||
        !playbackAudio ||
        !playbackStatus
    ) {
        throw new Error(
            "Speaking playback controls were not found."
        );
    }

    if (recordingChunks.length === 0) {
        throw new Error(
            "No speaking recording data is available."
        );
    }

    revokeRecordingObjectUrl();

    const mimeType =
        speakingRecorder?.mimeType ||
        recordingChunks[0]?.type ||
        "audio/webm";

    const recordingBlob =
        new Blob(
            recordingChunks,
            {
                type: mimeType
            }
        );

    recordingObjectUrl =
        URL.createObjectURL(
            recordingBlob
        );

    playbackAudio.src =
        recordingObjectUrl;

    playbackContainer.hidden =
        false;

    playbackStatus.textContent =
        "Your local practice recording is ready.";
}

function retrySpeakingRecording() {
    if (
        !speakingSession ||
        speakingSession.state !==
            "recorded"
    ) {
        throw new Error(
            "Speaking recording is not ready to retry."
        );
    }

    resetSpeakingPlayback();

    speakingRecorder = null;

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "ready-to-record"
        );

    const recorderStatus =
        document.querySelector(
            "#speaking-recorder-status"
        );

    const enableMicrophoneButton =
        document.querySelector(
            "#speaking-enable-microphone"
        );

    const startRecordingButton =
        document.querySelector(
            "#speaking-start-recording"
        );

    const stopRecordingButton =
        document.querySelector(
            "#speaking-stop-recording"
        );

    if (
        !recorderStatus ||
        !enableMicrophoneButton ||
        !startRecordingButton ||
        !stopRecordingButton
    ) {
        throw new Error(
            "Speaking recording controls were not found."
        );
    }

    enableMicrophoneButton.disabled =
        false;

    startRecordingButton.disabled =
        true;

    stopRecordingButton.disabled =
        true;

    recorderStatus.textContent =
        "Ready to record again. Enable your microphone.";
}

function discardSpeakingRecording() {
    if (
        !speakingSession ||
        speakingSession.state !==
            "recorded"
    ) {
        throw new Error(
            "Speaking recording is not ready to discard."
        );
    }

    resetSpeakingPlayback();

    speakingRecorder = null;

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "self-reflection"
        );

    const recorderStatus =
        document.querySelector(
            "#speaking-recorder-status"
        );

    const enableMicrophoneButton =
        document.querySelector(
            "#speaking-enable-microphone"
        );

    const startRecordingButton =
        document.querySelector(
            "#speaking-start-recording"
        );

    const stopRecordingButton =
        document.querySelector(
            "#speaking-stop-recording"
        );

    if (
        !recorderStatus ||
        !enableMicrophoneButton ||
        !startRecordingButton ||
        !stopRecordingButton
    ) {
        throw new Error(
            "Speaking recording controls were not found."
        );
    }

    enableMicrophoneButton.disabled =
        true;

    startRecordingButton.disabled =
        true;

    stopRecordingButton.disabled =
        true;

    recorderStatus.textContent =
        "Recording discarded. Continue with your self-reflection.";

    showSpeakingSelfReflection();
}

function resetSpeakingRuntime() {
    /*
     * Stop preparation lifecycle.
     */
    if (preparationTimerId !== null) {
        clearInterval(
            preparationTimerId
        );

        preparationTimerId = null;
    }

    preparationSecondsRemaining = 0;

    /*
     * Stop recording lifecycle.
     */
    if (recordingTimerId !== null) {
        clearInterval(
            recordingTimerId
        );

        recordingTimerId = null;
    }

    recordingSecondsRemaining = 0;

    /*
    * Reset preparation interface.
     */
    const preparationStatus =
    document.querySelector(
        "#speaking-preparation-status"
    );

    const startPreparationButton =
    document.querySelector(
        "#speaking-start-preparation"
    );

    if (preparationStatus) {
    preparationStatus.textContent =
        "Preparation has not started.";
    }

    if (startPreparationButton) {
    startPreparationButton.disabled =
        false;
    }

    /*
     * Release microphone ownership.
     */
    stopMicrophoneStream();

    /*
     * Release local recording resources.
     */
    resetSpeakingPlayback();

    speakingRecorder = null;

    /*
    * Release speaking session ownership.
    * A fresh session will be created by
    * startSpeakingRuntime() when the
    * assessment reaches Speaking again.
    */
    speakingSession = null;
    currentSpeakingTask = null;

    /*
     * Reset reflection state.
     */
    const reflectionContainer =
        document.querySelector(
            "#speaking-self-reflection"
        );

    if (reflectionContainer) {
        reflectionContainer.hidden = true;

        reflectionContainer
            .querySelectorAll(
                'input[type="checkbox"]'
            )
            .forEach((checkbox) => {
                checkbox.checked = false;
            });
    }

    /*
     * Reset completion state.
     */
    const completionContainer =
        document.querySelector(
            "#speaking-completion"
        );

    if (completionContainer) {
        completionContainer.hidden = true;
    }

    /*
     * Reset recorder controls.
     */
    const recorderStatus =
        document.querySelector(
            "#speaking-recorder-status"
        );

    const enableMicrophoneButton =
        document.querySelector(
            "#speaking-enable-microphone"
        );

    const startRecordingButton =
        document.querySelector(
            "#speaking-start-recording"
        );

    const stopRecordingButton =
        document.querySelector(
            "#speaking-stop-recording"
        );

    if (recorderStatus) {
        recorderStatus.textContent =
            "Microphone not enabled.";
    }

    if (enableMicrophoneButton) {
        enableMicrophoneButton.disabled =
            true;
    }

    if (startRecordingButton) {
        startRecordingButton.disabled =
            true;
    }

    if (stopRecordingButton) {
        stopRecordingButton.disabled =
            true;
    }
}

function resetAssessmentSession() {
    /*
     * Reset objective evidence and progression.
     */
    assessmentProgress =
        createAssessmentProgress();

    assessmentResponses =
        createResponseCollection();

    resetObjectiveRuntime();

    /*
     * Remove derived profile from the previous session.
     */
    learningProfile = null;

    /*
     * Reset the independent speaking lifecycle.
     */
    resetSpeakingRuntime();

    /*
     * Return to assessment entry.
     */
    showScreen("welcome");

    console.info(
        "Assessment session reset."
    );
}

function stopSpeakingRecording() {
    if (
        !speakingRecorder ||
        speakingRecorder.state !==
            "recording"
    ) {
        return;
    }

    speakingRecorder.stop();
}

function showSpeakingSelfReflection() {
    const reflection =
        document.querySelector(
            "#speaking-self-reflection"
        );

    const playback =
        document.querySelector(
            "#speaking-playback"
        );

    if (!reflection || !playback) {
        throw new Error(
            "Speaking self-reflection controls were not found."
        );
    }

    playback.hidden = true;
    reflection.hidden = false;

    reflection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function continueToSpeakingReflection() {
    if (
        !speakingSession ||
        speakingSession.state !==
            "recorded"
    ) {
        throw new Error(
            "Speaking recording is not ready for self-reflection."
        );
    }

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "self-reflection"
        );

    showSpeakingSelfReflection();
}

// ========================================
// B04.0.5 — Cross-Skill Progression
// ========================================

function continueToNextSection() {
    if (
        !currentTestletComplete ||
        !assessmentProgress
    ) {
        throw new Error(
            "Current skill is not ready for progression."
        );
    }

    const completedSkill =
        assessmentProgress.currentSkill;

    assessmentProgress =
        advanceAssessmentProgress(
            assessmentProgress
        );

    console.info(
        "Assessment progression advanced.",
        {
            currentSkill:
                assessmentProgress
                    .currentSkill,

            state:
                assessmentProgress
                    .state,

            completedSkills:
                [
                    ...assessmentProgress
                        .completedSkills
                ]
        }
    );

    if (
        completedSkill === "listening") {
        terminateListeningAudio();
        }

    resetObjectiveRuntime();

    if (
        assessmentProgress.state ===
        "objective"
    ) {
        startObjectiveRuntime();

        return;
    }

    if (
        assessmentProgress.state ===
        "speaking"
    ) {
        startSpeakingRuntime();

        showScreen("speaking");

        return;
    }

    if (
        assessmentProgress.state ===
        "complete"
    ) {
        showScreen("results");
    }
}

// ========================================
// B04.0.7.8 — Learning Profile Integration
// ========================================

function generateLearningProfile() {
    if (
        !Array.isArray(
            assessmentResponses
        )
    ) {
        throw new Error(
            "Assessment responses are unavailable."
        );
    }

    if (
        !speakingSession ||
        speakingSession.state !== "complete"
    ) {
        throw new Error(
            "Speaking practice must be complete before generating the learning profile."
        );
    }

    learningProfile =
        createLearningProfile(
            assessmentResponses,
            speakingSession
        );

    console.info(
        "Pilot learning profile generated.",
        {
            type:
                learningProfile.type,

            objectiveSkills:
                learningProfile
                    .objective
                    .length,

            speakingCompleted:
                learningProfile
                    .speaking
                    .completed
        }
    );

    return learningProfile;
}

function renderLearningProfile() {
    if (!learningProfile) {
        throw new Error(
            "Learning profile has not been generated."
        );
    }

    const container =
        document.querySelector(
            "#learning-profile"
        );

    if (!container) {
        throw new Error(
            "Learning profile container was not found."
        );
    }

    container.replaceChildren();

    const objectiveSection =
        document.createElement("div");

    objectiveSection.className =
        "uji-profile__skills";

    learningProfile.objective.forEach(
        (profile) => {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "uji-profile__card";

            const heading =
                document.createElement("h3");

            heading.textContent =
                profile.label;

            const signal =
                document.createElement("p");

            signal.className =
                "uji-profile__signal";

            signal.textContent =
                `Learning signal: ${profile.signal.label}`;

            const evidence =
                document.createElement("p");

            evidence.textContent =
                `${profile.evidenceCount} practice responses contributed to this signal.`;

            const recommendation =
                document.createElement("p");

            recommendation.className =
                "uji-profile__recommendation";

            recommendation.textContent =
                profile.recommendation;

            card.append(
                heading,
                signal,
                evidence,
                recommendation
            );

            objectiveSection.appendChild(
                card
            );
        }
    );

    const speakingCard =
        document.createElement(
            "article"
        );

    speakingCard.className =
        "uji-profile__card";

    const speakingHeading =
        document.createElement("h3");

    speakingHeading.textContent =
        learningProfile
            .speaking
            .label;

    const speakingStatus =
        document.createElement("p");

    speakingStatus.className =
        "uji-profile__signal";

    speakingStatus.textContent =
        learningProfile
            .speaking
            .completed
            ? "Practice completed"
            : "Practice not completed";

    const speakingScoring =
        document.createElement("p");

    speakingScoring.textContent =
        "Your speaking response was not machine scored.";

    const speakingRecommendation =
        document.createElement("p");

    speakingRecommendation.className =
        "uji-profile__recommendation";

    speakingRecommendation.textContent =
        learningProfile
            .speaking
            .recommendation;

    speakingCard.append(
        speakingHeading,
        speakingStatus,
        speakingScoring,
        speakingRecommendation
    );

    objectiveSection.appendChild(
        speakingCard
    );

    container.appendChild(
        objectiveSection
    );
}

function showLearningProfile() {
    if (!learningProfile) {
        throw new Error(
            "Learning profile is unavailable."
        );
    }

    renderLearningProfile();
    showScreen("results");
}

// ========================================
// Navigation Events
// ========================================

document
    .querySelector("#uji-start")
    ?.addEventListener(
        "click",
        () => {
            showScreen("goal");
        }
    );

document
    .querySelectorAll("[data-goal]")
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                showScreen("device");
            }
        );
    });

document
    .querySelector(
        "#uji-device-continue"
    )
    ?.addEventListener(
        "click",
        () => {
            if (
                document.documentElement
                    .dataset
                    .assessmentData !==
                "ready"
            ) {
                console.error(
                    "Assessment data is not ready."
                );

                return;
            }

            try {
                startObjectiveRuntime();

                showScreen(
                    "assessment"
                );
            } catch (error) {
                console.error(
                    "Unable to start assessment runtime.",
                    error
                );
            }
        }
    );

document
    .querySelector(
        "#assessment-continue"
    )
    ?.addEventListener(
        "click",
        () => {
            try {
                if (
                    currentTestletComplete
                ) {
                    continueToNextSection();

                    return;
                }

                continueObjectiveRuntime();
            } catch (error) {
                console.error(
                    "Unable to continue assessment runtime.",
                    error
                );
            }
        }
    );

document
    .querySelector("#uji-restart")
    ?.addEventListener(
        "click",
        () => {
            try {
                resetAssessmentSession();
            } catch (error) {
                console.error(
                    "Unable to restart assessment session.",
                    error
                );
            }
        }
    );

const startPreparationButton =
    document.querySelector(
        "#speaking-start-preparation"
    );

if (!startPreparationButton) {
    throw new Error(
        "Speaking preparation button was not found."
    );
}

startPreparationButton.addEventListener(
    "click",
    startPreparationTimer
);

const enableMicrophoneButton =
    document.querySelector(
        "#speaking-enable-microphone"
    );

if (!enableMicrophoneButton) {
    throw new Error(
        "Speaking microphone button was not found."
    );
}

enableMicrophoneButton.addEventListener(
    "click",
    () => {
        enableSpeakingMicrophone()
            .catch((error) => {
                console.error(
                    "Speaking microphone initialization failed.",
                    error
                );
            });
    }


);

const startRecordingButton =
    document.querySelector(
        "#speaking-start-recording"
    );

if (!startRecordingButton) {
    throw new Error(
        "Speaking recording button was not found."
    );
}

startRecordingButton.addEventListener(
    "click",
    () => {
        try {
            startSpeakingRecording();
        } catch (error) {
            console.error(
                "Unable to start speaking recording.",
                error
            );
        }
    }
);

const stopRecordingButton =
    document.querySelector(
        "#speaking-stop-recording"
    );

if (!stopRecordingButton) {
    throw new Error(
        "Speaking stop recording button was not found."
    );
}

stopRecordingButton.addEventListener(
    "click",
    stopSpeakingRecording
);

const speakingRetryRecordingButton =
    document.querySelector(
        "#speaking-retry-recording"
    );

if (speakingRetryRecordingButton) {
    speakingRetryRecordingButton.addEventListener(
        "click",
        retrySpeakingRecording
    );
}

const speakingDiscardRecordingButton =
    document.querySelector(
        "#speaking-discard-recording"
    );

if (speakingDiscardRecordingButton) {
    speakingDiscardRecordingButton.addEventListener(
        "click",
        discardSpeakingRecording
    );
}

const speakingContinueReflectionButton =
    document.querySelector(
        "#speaking-continue-reflection"
    );

if (speakingContinueReflectionButton) {
    speakingContinueReflectionButton.addEventListener(
        "click",
        () => {
            try {
                continueToSpeakingReflection();
            } catch (error) {
                console.error(
                    "Unable to continue to speaking self-reflection.",
                    error
                );
            }
        }
    );
}

function collectSpeakingReflection() {
    return Array.from(
        document.querySelectorAll(
            'input[name="speaking-reflection"]'
        )
    ).map((input) => ({
        construct: input.value,
        checked: input.checked
    }));
}

function completeSpeakingReflection() {
    if (
        !speakingSession ||
        speakingSession.state !==
            "self-reflection"
    ) {
        throw new Error(
            "Speaking self-reflection is not ready to complete."
        );
    }

    const reflection =
        collectSpeakingReflection();

    speakingSession = {
        ...speakingSession,
        reflection
    };

    speakingSession =
        transitionSpeakingState(
            speakingSession,
            "complete"
        );

    generateLearningProfile();

    const reflectionContainer =
        document.querySelector(
            "#speaking-self-reflection"
        );

    const completionContainer =
        document.querySelector(
            "#speaking-completion"
        );

    if (
        !reflectionContainer ||
        !completionContainer
    ) {
        throw new Error(
            "Speaking completion controls were not found."
        );
    }

    reflectionContainer.hidden = true;
    completionContainer.hidden = false;

    revokeRecordingObjectUrl();

    completionContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

const speakingCompleteReflectionButton =
    document.querySelector(
        "#speaking-complete-reflection"
    );

if (speakingCompleteReflectionButton) {
    speakingCompleteReflectionButton.addEventListener(
        "click",
        () => {
            try {
                completeSpeakingReflection();
            } catch (error) {
                console.error(
                    "Unable to complete speaking self-reflection.",
                    error
                );
            }
        }
    );
}

const speakingViewResultsButton =
    document.querySelector(
        "#speaking-view-results"
    );

if (speakingViewResultsButton) {
    speakingViewResultsButton.addEventListener(
        "click",
        () => {
            try {
                showLearningProfile();
            } catch (error) {
                console.error(
                    "Unable to show learning profile.",
                    error
                );
            }
        }
    );
}

// ========================================
// Application Start
// ========================================

initializeAssessmentData();