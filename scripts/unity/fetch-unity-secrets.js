#!/usr/bin/env node
/**
 * Fetch Unity Cloud Secrets from Cursor Account
 * This script uses cursor.getSecret() to access secrets configured in Cursor settings
 */

// Prompt: Fetch all Unity secrets and display safely
(async () => {
    const unitySecrets = [
        "UNITY_EMAIL",
        "UNITY_PASSWORD",
        "UNITY_ORG_ID",
        "UNITY_PROJECT_ID",
        "UNITY_ENV_ID",
        "UNITY_API_TOKEN",
        "UNITY_CLIENT_SECRET",
        "UNITY_CLIENT_ID"
    ];

    const secrets = {};

    for (const name of unitySecrets) {
        try {
            secrets[name] = await cursor.getSecret(name);
        } catch (err) {
            console.error(`Failed to retrieve secret "${name}":`, err);
            secrets[name] = null;
        }
    }

    // Example: Use secrets securely
    // Do NOT log sensitive data in production
    console.log("Unity secrets fetched successfully.");

    // Return secrets object for further use in prompt scripts
    return secrets;
})();