import { fromLocation } from "@whereby/jslib-media/src/utils/urls";
import {
    ApiClient,
    CredentialsService,
    OrganizationApiClient,
    OrganizationService,
    OrganizationServiceCache,
    RoomService,
} from "./api";

const API_BASE_URL = process.env["REACT_APP_API_BASE_URL"] || "https://api.whereby.dev";

export function createServices(roomUrl: string) {
    const roomUrlObj = new URL(roomUrl);
    const urls = fromLocation({ host: roomUrlObj.host });
    const credentialsService = CredentialsService.create({ baseUrl: API_BASE_URL });
    const apiClient = new ApiClient({
        fetchDeviceCredentials: credentialsService.getCredentials.bind(credentialsService),
        baseUrl: API_BASE_URL,
    });
    const organizationService = new OrganizationService({ apiClient });
    const organizationServiceCache = new OrganizationServiceCache({
        organizationService,
        subdomain: urls.subdomain,
    });
    const organizationApiClient = new OrganizationApiClient({
        apiClient,
        fetchOrganization: async () => {
            const organization = await organizationServiceCache.fetchOrganization();
            return organization || undefined;
        },
    });
    const roomService = new RoomService({ organizationApiClient });
    return {
        credentialsService,
        apiClient,
        organizationService,
        organizationServiceCache,
        organizationApiClient,
        roomService,
    };
}
