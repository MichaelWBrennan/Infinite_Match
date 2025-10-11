#!/usr/bin/env node
export default UnityCloudSecrets;
/**
 * Unity Cloud Secrets Manager
 * Handles reading secrets from Cursor account or environment variables
 */
declare class UnityCloudSecrets {
    secrets: {};
    loaded: boolean;
    /**
     * Load secrets from Cursor account or environment variables
     */
    loadSecrets(): Promise<{}>;
    /**
     * Get a specific secret
     */
    getSecret(name: any): any;
    /**
     * Check if all required secrets are available
     */
    validateSecrets(): boolean;
    /**
     * Get project configuration
     */
    getProjectConfig(): {
        projectId: any;
        environmentId: any;
        organizationId: any;
    };
    /**
     * Get authentication credentials
     */
    getAuthCredentials(): {
        clientId: any;
        clientSecret: any;
        accessToken: any;
    };
}
//# sourceMappingURL=unity-cloud-secrets.d.ts.map