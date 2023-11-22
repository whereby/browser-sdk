import cn from "classnames";
import { useEffect, useState } from "react";
import { ScreenShareIcon } from "react-components";
import { Localized } from "@fluent/react/compat";

import styles from "./styles.css";

import camCapture, { Base64Image } from "../../helpers/camCapture";

function ScreenshareOverlay({
    screenshareStream,
    isWindowFocused,
    useBlur,
    withRoundedCorners,
}: {
    screenshareStream: MediaStream;
    isWindowFocused: boolean;
    useBlur: boolean;
    withRoundedCorners: boolean;
}) {
    const [capture, setCapture] = useState<Base64Image | null>(null);
    const [inited, setInited] = useState(false);

    useEffect(() => {
        let isRunning = true;

        setTimeout(() => {
            if (isRunning) {
                setInited(true);
            }
        }, 2000);

        return () => {
            isRunning = false;
        };
    }, []);

    useEffect(() => {
        let isRunning = true;
        (async () => {
            const newCapture = await camCapture(screenshareStream);
            if (isRunning) {
                setCapture(newCapture);
            }
        })();

        return () => {
            isRunning = false;
        };
    }, [screenshareStream, isWindowFocused]);

    return (
        <div
            className={cn(styles.container, {
                [styles.isHidden]: inited && !isWindowFocused,
                [styles.withRoundedCorners]: withRoundedCorners,
            })}
        >
            {capture && <img src={capture} className={styles.image} alt={""} />}
            <div className={cn(styles.overlay, { [styles.blur]: useBlur })}>
                <div className={styles.icon}>
                    <ScreenShareIcon modifiers={["sized", "light"]} />
                </div>
                <span className={styles.title}>
                    <Localized id={"ScreenshareOverlay-title"}>
                        <span>Sharing your entire screen</span>
                    </Localized>
                </span>
            </div>
        </div>
    );
}

export default ScreenshareOverlay;
