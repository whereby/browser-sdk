import { extractJson, extractNullOrString, extractString } from "./extractUtils";
import { Json } from "./Response";

interface CredentialsOptions {
    uuid: string;
    hmac: string;
    userId?: string;
}

export default class Credentials {
    credentials: {
        uuid: CredentialsOptions["uuid"];
    };

    hmac: CredentialsOptions["hmac"];
    userId: CredentialsOptions["userId"];

    constructor(
        uuid: CredentialsOptions["uuid"],
        hmac: CredentialsOptions["hmac"],
        userId: CredentialsOptions["userId"] = undefined
    ) {
        this.credentials = {
            uuid,
        };
        this.hmac = hmac;
        this.userId = userId;
    }

    toJson(): Json {
        return {
            credentials: this.credentials,
            hmac: this.hmac,
            ...(this.userId && { userId: this.userId }),
        };
    }

    static fromJson(json: Json): Credentials {
        return new Credentials(
            extractString(extractJson(json, "credentials"), "uuid"),
            extractString(json, "hmac"),
            extractNullOrString(json, "userId") || undefined
        );
    }
}
