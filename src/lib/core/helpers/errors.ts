export class AudioFetchError extends Error {
    details?: string;
    constructor({ message, stack }: { message: string; stack?: string }) {
        super(message);
        this.name = "AudioFetchError";
        this.details = stack;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AudioFetchError);
        }
    }
}

export class LocalizationFetchError extends Error {
    details?: string;
    constructor({ message, stack }: { message: string; stack?: string }) {
        super(message);
        this.name = "LocalizationFetchError";
        this.details = stack;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, LocalizationFetchError);
        }
    }
}

export class RoomFetchError extends Error {
    details?: string;
    constructor({ message, stack }: { message: string; stack?: string }) {
        super(message);
        this.name = "RoomFetchError";
        this.details = stack;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RoomFetchError);
        }
    }
}

export class RoomNotAllowedError extends Error {
    details?: string;
    constructor({ message, stack }: { message: string; stack?: string }) {
        super(message);
        this.name = "RoomNotAllowedError";
        this.details = stack;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RoomNotAllowedError);
        }
    }
}

export class RoomNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RoomNotFoundError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RoomNotFoundError);
        }
    }
}
