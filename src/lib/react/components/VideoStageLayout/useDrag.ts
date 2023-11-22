import { useRef } from "react";

const DRAG_THRESHOLD_PX = 5;
// Avoid starting a drag gesture before the system cancels the touch in favor of the scroll
const TOUCH_THRESHOLD_MS = 500;

const noop = () => {};

export type Coordinates = [number, number];
type DragCallback = ({
    isFirstEvent,
    isActive,
    xy,
    delta,
    args,
    cancelDrag,
}: {
    isFirstEvent: boolean;
    isActive: boolean;
    xy: Coordinates;
    delta: Coordinates;
    args: { clientId: string };
    cancelDrag: () => void;
    event: React.PointerEvent<HTMLElement>;
}) => void;
class DragRecognizer {
    callback: DragCallback;
    _xy: Coordinates;
    _startXy: Coordinates;
    _isDown: boolean;
    _pointerId: number | null;
    _hasCapture: boolean;
    _isTouch: boolean;
    _isActive: boolean;
    _startTime?: number;
    constructor(callback = noop) {
        this.callback = callback;

        this._isActive = false;
        this._xy = [0, 0];
        this._startXy = [0, 0];
        this._isDown = false;
        this._pointerId = null;
        this._hasCapture = false;
        this._isTouch = false;
    }

    // Handlers

    onDragStart(args: { clientId: string }, event: React.PointerEvent<HTMLElement>) {
        if (!this._isPrimaryButton(event) || this._isDown) {
            return;
        }
        this._pointerId = event.pointerId;
        this._xy = [event.clientX, event.clientY];
        this._startXy = [event.clientX, event.clientY];
        this._isDown = true;
        this._isTouch = this._isTouchEvent(event);
        this._startTime = new Date().getTime();
        // Reset - in case we were in a bad drag state
        this._hasCapture = false;
        // Update with initial pointer down
        this._update(true, event, args);
    }

    onDragChange(args: { clientId: string }, event: React.PointerEvent<HTMLElement>) {
        if (!this._isDown || !this._isGestureEvent(event)) {
            return;
        }
        this._xy = [event.clientX, event.clientY];

        if (!this._isActive) {
            if (this._isDragging() && !this._isInputAcceptingTarget(event)) {
                // We allow starting a gesture from any "draggable" component and capture the input.
                // When an element has "captured" the input, all the input events are sent to that
                // element, even when pointer is no longer over that element.
                // See: https://www.w3.org/TR/pointerevents/#dfn-pointer-capture

                // Mobile Safari auto captures but we generally need to do this ourselves:
                if (!this._hasCapture) {
                    event.currentTarget.setPointerCapture(event.pointerId);
                }
                this._start(event, args);
            }
            return;
        }

        this._update(false, event, args);
    }

    onDragEnd(args: { clientId: string }, event: React.PointerEvent<HTMLElement>) {
        if (!this._isDown || !this._isGestureEvent(event)) {
            return;
        }

        const wasActive = this._isActive;
        this._cancel();
        if (wasActive) {
            // We make sure to send one last update as a pointerUp event indicator:
            this._update(false, event, args);
        }
    }

    onGotPointerCapture(event: React.PointerEvent<HTMLElement>) {
        if (!this._isGestureEvent(event)) {
            return;
        }

        this._hasCapture = true;
    }

    onLostPointerCapture(event: React.PointerEvent<HTMLElement>) {
        if (!this._isGestureEvent(event)) {
            return;
        }

        this._hasCapture = false;
        this._pointerId = null;
    }

    // Internal

    _start(event: React.PointerEvent<HTMLElement>, args: { clientId: string }) {
        this._isActive = true;
        this._update(false, event, args);
    }

    _cancel() {
        this._isDown = false;
        this._isActive = false;
    }

    _update(first = false, event: React.PointerEvent<HTMLElement>, args: { clientId: string }) {
        if (!this.callback) {
            return;
        }

        this.callback({
            isFirstEvent: first,
            isActive: this._isActive,
            xy: this._xy,
            delta: [this._startXy[0] - this._xy[0], this._startXy[1] - this._xy[1]],
            event,
            args,
            cancelDrag: this._cancel.bind(this),
        });
    }

    // Utils

    _isDragging() {
        if (!this._startTime) {
            return false;
        }
        if (this._isTouch) {
            const elapsed = new Date().getTime() - this._startTime;
            if (elapsed < TOUCH_THRESHOLD_MS) {
                return false;
            }
        }
        const totalOffset = Math.abs(this._startXy[0] - this._xy[0]) + Math.abs(this._startXy[1] - this._xy[1]);
        if (totalOffset >= DRAG_THRESHOLD_PX) {
            return true;
        }
        return false;
    }

    _isGestureEvent(event: React.PointerEvent<HTMLElement>) {
        if (!this._pointerId) {
            return true;
        }

        // Ignore events that don't belong to the captured pointer
        return event.pointerId === this._pointerId;
    }

    _isPrimaryButton(event: React.PointerEvent<HTMLElement>) {
        // We only care about primary buttons (left click, touch, stylus tip etc)
        return event && event.button === 0 && event.buttons === 1;
    }

    _isInputAcceptingTarget(event: React.PointerEvent<HTMLElement>) {
        // Don't start drag gestures originating from input accepting elements
        // as to not conflict with their own drag gestures:
        // @ts-ignore
        if (event.target.isContentEditable) {
            return true;
        }
        // @ts-ignore
        const tagName = (event.target || event.srcElement).tagName;
        return tagName === "INPUT" || tagName === "SELECT" || tagName === "TEXTAREA";
    }

    _isTouchEvent(event: React.PointerEvent<HTMLElement>) {
        return event.pointerType === "touch";
    }
}
export type UseDragResult = (args: { clientId: string }) => {
    onPointerDown: React.PointerEventHandler<HTMLElement>;
    onPointerMove: React.PointerEventHandler<HTMLElement>;
    onPointerUp: React.PointerEventHandler<HTMLElement>;
    onPointerCancel: React.PointerEventHandler<HTMLElement>;
    onGotPointerCapture: React.PointerEventHandler<HTMLElement>;
    onLostPointerCapture: React.PointerEventHandler<HTMLElement>;
};
export default function useDrag<T>(callback: DragCallback = noop): UseDragResult {
    const ref = useRef(new DragRecognizer());
    // Gesture data is processed via callback: ({ isFirstEvent, isActive, xy, delta, args, event, cancelDrag }) => {}
    // draggable element.
    // Coordinates are pixels in window space.
    ref.current.callback = callback;

    // Returns a function intended to be spread:
    // const bind  = useDrag(callback);
    // <DraggableComponent {...bind({id})} />
    // The {args} parameter is intended to carry metadata to identify the source
    return (args: { clientId: string }) => ({
        onPointerDown: ref.current.onDragStart.bind(ref.current, args ?? {}),
        onPointerMove: ref.current.onDragChange.bind(ref.current, args ?? {}),
        onPointerUp: ref.current.onDragEnd.bind(ref.current, args ?? {}),
        onPointerCancel: ref.current.onDragEnd.bind(ref.current, args ?? {}),
        onGotPointerCapture: ref.current.onGotPointerCapture.bind(ref.current ?? {}),
        onLostPointerCapture: ref.current.onLostPointerCapture.bind(ref.current ?? {}),
    });
}
