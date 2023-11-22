import { useRef, useEffect } from "react";
import cn from "classnames";

import styles from "./styles.css";

import { StreamAudioAnalyzer } from "../../helpers/audioanalyzer";
import getAudioContext from "../../../helpers/audioContextWrapper";

import remapNumber from "../../helpers/remapNumber";

const BASE_AVATAR_SIZE = 60;
const AVATAR_SIZE_INCREMENT = 20;

const SCALE_MIN = 1;
const SCALE_MAX = 1.2;

const remapLevelToScale = remapNumber({ from: { low: 0, high: 100 }, to: { low: SCALE_MIN, high: SCALE_MAX } });
const remapScaleToOpacity = remapNumber({ from: { low: SCALE_MIN, high: SCALE_MAX }, to: { low: 0.5, high: 1.0 } });

function updateElementStyles({
    element,
    currentLevel,
    scaleMultiplier,
}: {
    element: HTMLDivElement;
    currentLevel: number;
    scaleMultiplier: number;
}) {
    const scale = +remapLevelToScale(currentLevel).toFixed(2);
    const opacity = +remapScaleToOpacity(scale).toFixed(2);
    // Adjust scale based on multipler. Negative because the bigger the avatar the less we want it to grow by %:
    const adjustedScale = scale + -0.05 * scaleMultiplier;

    Object.assign(element.style, {
        opacity,
        transform: `scale(${Math.max(adjustedScale, 1)})`,
    });
}

function AudioIndicator({
    avatarSize = 60,
    stream,
    isMuted,
    fftSize = 32,
    variant = "default",
}: {
    avatarSize?: number;
    stream: MediaStream;
    isMuted: boolean;
    fftSize?: number;
    variant: string;
}) {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const scaleMultiplierRef = useRef<number>();

    // Cache the scale multipler:
    useEffect(() => {
        // The magic number SCALE_MAX is tuned for an avatar BASE_AVATAR_SIZE px.
        // Cache how much bigger or smaller this avatar is assuming increments of AVATAR_SIZE_INCREMENT px:
        scaleMultiplierRef.current = (avatarSize - BASE_AVATAR_SIZE) / AVATAR_SIZE_INCREMENT;
    }, [avatarSize]);

    // this is a hack because "default" device bug where chrome requires a that the track is re-requested
    const [audioTrack] = stream?.getAudioTracks() || [];
    useEffect(() => {
        if (!stream || !audioTrack || isMuted) {
            return;
        }
        try {
            const analyzer = new StreamAudioAnalyzer(stream, fftSize, getAudioContext().audioContext);
            if (analyzer) {
                // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount
                const frequencyBinCount = fftSize / 2;
                const unsubscribe = analyzer.subscribeData((frequencyLevels) => {
                    const averageLevel = frequencyLevels.reduce((sum, level) => sum + level, 0) / frequencyBinCount;
                    requestAnimationFrame(() => {
                        if (elementRef.current) {
                            updateElementStyles({
                                element: elementRef.current,
                                currentLevel: averageLevel,
                                scaleMultiplier: scaleMultiplierRef.current ?? 0,
                            });
                        }
                    });
                });
                return unsubscribe;
            }
        } catch (e) {
            console.error("AudioIndicator: failed to instantiate StreamAudioAnalyzer", e);
        }
    }, [isMuted, stream, fftSize, audioTrack]);

    return stream ? (
        <div
            className={cn(styles.AudioIndicator, {
                [styles.isMuted]: isMuted,
                [styles["AudioIndicator--blue"]]: variant === "blue",
            })}
            ref={elementRef}
        />
    ) : null;
}

export default AudioIndicator;
