import { createRef, Component, RefObject } from "react";
import cn from "classnames";

import styles from "./styles.css";

import { hasBounds, makeFrame, Frame } from "../../helpers/layout";

// Renders drag and drop indicators above the stage

// Designed as a singleton instance. Once mounted, use:
// DragOverlay.update({ dragIndicatorFrame, dropIndicatorFrame })

class DragOverlay extends Component<{ withRoundedCorners?: boolean }> {
    _rafId: number | null;
    static __singletonRef: DragOverlay;
    dragIndicatorRef: RefObject<HTMLDivElement>;
    dropTargetIndicatorRef: RefObject<HTMLDivElement>;

    static update(config?: { dragIndicatorFrame?: Frame; dropIndicatorFrame?: Frame }) {
        if (!DragOverlay.__singletonRef) {
            return;
        }
        DragOverlay.__singletonRef._update(config);
    }

    constructor(props: { withRoundedCorners?: boolean }) {
        super(props);
        DragOverlay.__singletonRef = this;

        this.dragIndicatorRef = createRef();
        this.dropTargetIndicatorRef = createRef();

        this._rafId = null;
    }

    componentWillUnmount() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
    }

    _setStyles({ el, frame, visible }: { el: HTMLDivElement | null; frame: Frame; visible: boolean }) {
        if (!el) {
            return;
        }

        Object.assign(el.style, {
            display: visible ? "block" : "none",
            transform: `translate3d(${Math.round(frame.origin.left)}px, ${Math.round(frame.origin.top)}px, 0)`,
            width: `${Math.round(frame.bounds.width)}px`,
            height: `${Math.round(frame.bounds.height)}px`,
        });
    }

    _setMoveCursor(active: boolean) {
        document.body.style.cursor = active ? "move" : "auto";
    }

    _update(config?: { dragIndicatorFrame?: Frame; dropIndicatorFrame?: Frame }) {
        const { dragIndicatorFrame, dropIndicatorFrame } = config || {};
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }

        this._rafId = requestAnimationFrame(() => {
            const isActiveDrag = hasBounds(dragIndicatorFrame && dragIndicatorFrame.bounds);
            this._setStyles({
                el: this.dragIndicatorRef.current,
                frame: dragIndicatorFrame || makeFrame(),
                visible: isActiveDrag,
            });

            this._setMoveCursor(isActiveDrag);

            const hasDropTarget = hasBounds(dropIndicatorFrame && dropIndicatorFrame.bounds);
            this._setStyles({
                el: this.dropTargetIndicatorRef.current,
                frame: dropIndicatorFrame || makeFrame(),
                visible: hasDropTarget,
            });

            this._rafId = null;
        });
    }

    render() {
        return (
            <div className={cn(styles.DragOverlay, { [styles.withRoundedCorners]: this.props.withRoundedCorners })}>
                <div ref={this.dropTargetIndicatorRef} className={styles.dropTargetIndicator} />
                <div ref={this.dragIndicatorRef} className={styles.dragIndicator} />
            </div>
        );
    }
}

export default DragOverlay;
