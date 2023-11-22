import { canSwitchSpeaker } from "./mediaElementSupport";

import { AudioFetchError } from "./errors";

const noop = () => {};

// audioContextWrapper instances to be re-used
interface AudioContextWrapper {
    audioContext: AudioContext;
    loadAudio: (src: RequestInfo) => ReturnType<typeof loadAudio>;
    play: ({ audioBuffer, speakerId }: { audioBuffer: AudioBuffer; speakerId: string }) => ReturnType<typeof play>;
    unlockSafari: () => ReturnType<typeof unlockSafari>;
    close: () => void;
}
const audioContextWrappers: Record<string, AudioContextWrapper> = {};

async function loadAudio({ audioContext, src }: { audioContext: AudioContext; src: RequestInfo }) {
    try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        return new Promise((resolve, reject) => {
            audioContext.decodeAudioData(
                arrayBuffer,
                (data) => {
                    resolve(data);
                },
                reject
            );
        });
    } catch (error) {
        throw new AudioFetchError(error as Error);
    }
}

async function setSinkId(speakerId: string) {
    if (!speakerId || !canSwitchSpeaker()) {
        return null;
    }
    const audio = new Audio() as HTMLAudioElement & { setSinkId: (speakerId: string) => Promise<void> };
    try {
        await audio.setSinkId(speakerId);
    } catch (e) {
        console.warn(`Unable to set sink to ${speakerId}`, e);
        return null;
    }
    return audio;
}

async function attachDestination({
    source,
    speakerId,
    audioContext,
}: {
    source: AudioBufferSourceNode;
    speakerId: string;
    audioContext: AudioContext;
}) {
    const audio = await setSinkId(speakerId);
    if (!audio) {
        source.connect(audioContext.destination);
        return noop;
    }
    const audioDestination = audioContext.createMediaStreamDestination();
    // set source output as audio element input
    audio.srcObject = audioDestination.stream;
    // auto play stream
    await audio.play();
    source.connect(audioDestination);
    return () => {
        audioDestination.disconnect();
        // wait for stream to be flushed to destination
        setTimeout(() => {
            audio.pause();
            audio.srcObject = null;
        }, 300);
    };
}

async function play({
    audioContext,
    audioBuffer,
    speakerId,
}: {
    audioContext: AudioContext;
    audioBuffer: AudioBuffer;
    speakerId: string;
}) {
    // Re-create AudioBufferSourceNode since it cannot be reused
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const detachDestination = await attachDestination({ source, speakerId, audioContext });
    let isPlaying = true;
    const onEndedCbs: (() => void)[] = [];
    const onEnded = () => {
        isPlaying = false;
        source.disconnect();
        source.buffer = null;
        source.removeEventListener("ended", onEnded);
        onEndedCbs.forEach((cb) => cb());
        onEndedCbs.length = 0;
        detachDestination();
    };

    source.addEventListener("ended", onEnded);
    source.start();

    return {
        stop() {
            isPlaying = false;
            source.stop();
        },
        get isPlaying() {
            return isPlaying;
        },
        onEnded(onEnded: () => void) {
            onEndedCbs.push(onEnded);
        },
        source,
    };
}

// safari/ios hack - inspired by https://codepen.io/kslstn/pen/pagLqL
// unlock audioContext - call when interactive (button click)
function unlockSafari(audioContext: AudioContext) {
    // create empty buffer and play it to unlock audioContext when interactive
    const source = audioContext.createBufferSource();
    source.buffer = audioContext.createBuffer(1, 1, 22050);
    source.connect(audioContext.destination);
    const onEnded = () => {
        source.disconnect();
        source.buffer = null;
        source.removeEventListener("ended", onEnded);
    };
    source.addEventListener("ended", onEnded);
    source.start();
}

export default function getAudioContext(type = "shared") {
    if (!audioContextWrappers[type]) {
        const { AudioContext, webkitAudioContext } = global as any;
        const audioContext: AudioContext = new (AudioContext || webkitAudioContext)();
        audioContextWrappers[type] = {
            audioContext,
            loadAudio: (src) => loadAudio({ audioContext, src }),
            play: ({ audioBuffer, speakerId }) => play({ audioContext, audioBuffer, speakerId }),
            unlockSafari: () => unlockSafari(audioContext),
            close: () => {
                audioContext.close();
                Object.keys(audioContextWrappers[type]).forEach((key: keyof AudioContextWrapper) => {
                    delete audioContextWrappers[type][key];
                });
                delete audioContextWrappers[type];
            },
        };
    }
    return audioContextWrappers[type];
}
