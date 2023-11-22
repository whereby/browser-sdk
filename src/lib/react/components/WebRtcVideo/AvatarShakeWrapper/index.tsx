import { useRef, useEffect } from "react";
import cn from "classnames";

import styles from "./styles.css";

import usePrevious from "../../helpers/hooks/usePrevious";

function attachAnimation({ el }: { el: HTMLDivElement }) {
    return el.animate(
        [
            { transform: "translateY(0) rotate(0deg)" },
            { transform: "translateY(-20%) rotate(-10deg)", offset: 0.2 },
            { transform: "translateY(0)", offset: 0.38 },
            { transform: "translateY(-12%) rotate(8deg)", offset: 0.54 },
            { transform: "translateY(0)", offset: 0.74 },
            { transform: "translateY(-5%) rotate(-5deg)", offset: 0.92 },
            { transform: "translateY(0) rotate(0deg)" },
        ],
        { duration: 500, iterations: 1, fill: "forwards", easing: "linear" }
    );
}

interface Message {
    id: string;
    received: number;
}

function AvatarShakeWrapper({
    children,
    className,
    latestMessage,
    shouldShowReaction,
    style,
}: React.PropsWithChildren<{
    className: string;
    latestMessage: Message;
    shouldShowReaction: boolean;
    style: React.CSSProperties;
}>) {
    const ref = useRef<HTMLDivElement | null>(null);
    const anim = useRef<Animation>();
    const prevMessageId = usePrevious(latestMessage?.id);

    useEffect(() => {
        if (latestMessage && latestMessage.id !== prevMessageId && shouldShowReaction) {
            // Ignore messages that didn't come in recently (because the selector is memoized they stick around until new chat messages come in):
            const isRecent = Math.abs(Date.now() - latestMessage.received) <= 500;
            if (isRecent && ref.current) {
                anim.current = attachAnimation({ el: ref.current });
            }
        }
    }, [latestMessage, prevMessageId, shouldShowReaction]);

    return (
        <div className={cn(className, styles.AvatarShakeWrapper)} style={style}>
            <div ref={ref} className={styles.avatarWrapper}>
                {children}
            </div>
        </div>
    );
}

export default AvatarShakeWrapper;
