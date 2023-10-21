import OrganizationService from "../organizationService/index";
import Organization from "../models/Organization";

export default class OrganizationServiceCache {
    private _organizationService: OrganizationService;
    private _subdomain: string;
    private _organizationPromise: Promise<Organization | null> | null;

    constructor({ organizationService, subdomain }: { organizationService: OrganizationService; subdomain: string }) {
        this._organizationService = organizationService;
        this._subdomain = subdomain;
        this._organizationPromise = null;
    }

    initOrganization(): Promise<void> {
        return this.fetchOrganization().then(() => undefined);
    }

    fetchOrganization(): Promise<Organization | null> {
        if (!this._organizationPromise) {
            this._organizationPromise = this._organizationService.getOrganizationBySubdomain(this._subdomain);
        }
        return this._organizationPromise;
    }
}
