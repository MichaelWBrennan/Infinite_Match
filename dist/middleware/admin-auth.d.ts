/**
 * Returns the admin identity if the credentials are valid, otherwise null.
 */
export function verifyAdminCredentials(token: any, adminId: any): {
    id: any;
    permissions: string[];
} | null;
export function adminAuth(req: any, res: any, next: any): any;
declare namespace _default {
    export { adminAuth };
    export { verifyAdminCredentials };
}
export default _default;
//# sourceMappingURL=admin-auth.d.ts.map