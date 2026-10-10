export function httpsEnforcement(req: any, res: any, next: any): any;
export function httpsOnly(req: any, res: any, next: any): any;
export function httpsHeaders(req: any, res: any, next: any): void;
export function httpsHealthCheck(req: any, res: any): void;
export function getHttpsConfig(): {
    enabled: boolean;
    environment: string;
    enforcement: boolean;
    headers: {
        hsts: boolean;
        csp: boolean;
        referrerPolicy: boolean;
        permissionsPolicy: boolean;
    };
};
declare namespace _default {
    export { httpsEnforcement };
    export { httpsOnly };
    export { httpsHeaders };
    export { httpsHealthCheck };
    export { getHttpsConfig };
}
export default _default;
//# sourceMappingURL=https.d.ts.map