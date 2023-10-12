export function getAudioTrackPropertiesFromHTMLVideoElement(e: HTMLVideoElement) {
    if (!e.srcObject) return null;
    const mediaStream = e.srcObject as MediaStream;
    const audioTrack = mediaStream?.getAudioTracks()?.[0];
    return {
        readyState: audioTrack?.readyState,
        kind: audioTrack?.kind,
        muted: audioTrack?.muted,
        enabled: audioTrack?.enabled,
    };
}

type Sample = [number, number];
export type CountFramesFunction = (
    element: HTMLVideoElement,
    interval: number,
    numOfSamples: number
) => Promise<Array<Sample>>;

export const countFrames: CountFramesFunction = async (element, interval, numOfSamples) => {
    return new Promise((resolve) => {
        const samples: Sample[] = [];
        const sampleInterval = setInterval(() => {
            // @ts-ignore - mozPaintedFrames and webkitDecodedFrameCount are
            // not in the HTMLVideoElement interface as they are not standard.
            const frameCount = element.webkitDecodedFrameCount || element.mozPaintedFrames;

            samples.push([Date.now(), frameCount]);

            if (samples.length === numOfSamples) {
                clearInterval(sampleInterval);
                resolve(samples);
            }
        }, interval);
    });
};

export type FrameStatistics = {
    minFps: number;
    maxFps: number;
    meanFps: number;
    stdDev: number;
    frameRates: Array<number>;
};

/**
 * Calculates the frame statistics from the samples.
 * @param samples is an array of [timestamp, frameCount] tuples.
 * @returns {FrameStatistics} frame statistics
 */
export function makeFrameStatistics(samples: Array<Array<number>>): FrameStatistics {
    const frameRates: number[] = [];
    const first = samples[0];
    const last = samples[samples.length - 1];
    const df = last[1] - first[1];
    const dt = last[0] - first[0];
    const meanFps = (1000 * df) / dt;
    let sum = 0;

    for (let j = 1; j < samples.length; j++) {
        const dt = samples[j][0] - samples[j - 1][0];
        const df = samples[j][1] - samples[j - 1][1];
        const frameRate = (1000 * df) / dt;
        sum += (frameRate - meanFps) * (frameRate - meanFps);
        frameRates.push(frameRate);
    }
    const stdDev = Math.sqrt(sum / (samples.length - 1));
    return {
        minFps: Math.min(...frameRates),
        maxFps: Math.max(...frameRates),
        meanFps,
        stdDev,
        frameRates,
    };
}
