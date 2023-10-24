// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Json = string | number | boolean | null | Array<Json> | { [key: string]: Json };

export type ErrorResponseObject = {
    data?: Json;
    headers?: Record<string, unknown>;
    status?: number;
    statusText?: string;
    config?: { url?: string; baseURL?: string } | null;
};

interface ResponseOptions {
    data?: Json;
    headers?: Record<string, unknown>;
    status?: number;
    statusText?: string;
    url?: string | null;
}

export default class Response {
    data: Json;
    headers: Record<string, unknown>;
    status: number;
    statusText: string;
    url: string | null;

    constructor(initialValues: ResponseOptions = {}) {
        this.data = initialValues.data === undefined ? {} : initialValues.data;
        this.headers = initialValues.headers || {};
        this.status = initialValues.status || 200;
        this.statusText = initialValues.statusText || "OK";
        this.url = initialValues.url || null;
    }
}
