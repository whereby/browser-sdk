import { fromLocation } from "@whereby/jslib-media/src/utils/urls";
import { ApiClient, CredentialsService, OrganizationService, OrganizationServiceCache } from "./api";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://api.whereby.dev";

export function createServices() {
    const credentialsService = CredentialsService.create({ baseUrl: API_BASE_URL });
    const apiClient = new ApiClient({
        fetchDeviceCredentials: credentialsService.getCredentials.bind(credentialsService),
        baseUrl: API_BASE_URL,
    });
    const organizationService = new OrganizationService({ apiClient });

    const fetchOrganizationFromRoomUrl = (roomUrl: string) => {
        const roomUrlObj = new URL(roomUrl);
        const urls = fromLocation({ host: roomUrlObj.host });

        const organizationServiceCache = new OrganizationServiceCache({
            organizationService,
            subdomain: urls.subdomain,
        });

        return organizationServiceCache.fetchOrganization();
    };

    return {
        credentialsService,
        apiClient,
        organizationService,
        fetchOrganizationFromRoomUrl,
    };
}
