export namespace ROLES {
    let GUEST: string;
    let USER: string;
    let PREMIUM_USER: string;
    let MODERATOR: string;
    let ADMIN: string;
    let SUPER_ADMIN: string;
}
export namespace PERMISSIONS {
    let READ_PROFILE: string;
    let UPDATE_PROFILE: string;
    let DELETE_ACCOUNT: string;
    let PLAY_GAME: string;
    let ACCESS_PREMIUM_FEATURES: string;
    let USE_BOOSTERS: string;
    let PURCHASE_ITEMS: string;
    let VIEW_LEADERBOARDS: string;
    let SEND_FRIEND_REQUESTS: string;
    let CHAT_WITH_FRIENDS: string;
    let CREATE_GUILDS: string;
    let MODERATE_CHAT: string;
    let BAN_USERS: string;
    let VIEW_REPORTS: string;
    let MANAGE_CONTENT: string;
    let MANAGE_USERS: string;
    let MANAGE_GAME_SETTINGS: string;
    let VIEW_ANALYTICS: string;
    let MANAGE_ECONOMY: string;
    let DEPLOY_UPDATES: string;
    let MANAGE_ADMINS: string;
    let SYSTEM_CONFIGURATION: string;
    let DATABASE_ACCESS: string;
    let SECURITY_OVERRIDE: string;
}
export class RBACProvider {
    userRoles: Map<any, any>;
    roleCache: Map<any, any>;
    /**
     * Assign a role to a user
     * @param {string} userId - User ID
     * @param {string} role - Role to assign
     * @param {string} assignedBy - ID of user who assigned the role
     */
    assignRole(userId: string, role: string, assignedBy: string): void;
    /**
     * Remove a role from a user
     * @param {string} userId - User ID
     * @param {string} removedBy - ID of user who removed the role
     */
    removeRole(userId: string, removedBy: string): void;
    /**
     * Get user's role
     * @param {string} userId - User ID
     * @returns {string|null} User's role or null if not found
     */
    getUserRole(userId: string): string | null;
    /**
     * Get permissions for a role
     * @param {string} role - Role name
     * @returns {string[]} Array of permissions
     */
    getRolePermissions(role: string): string[];
    /**
     * Get all permissions for a user (including inherited permissions)
     * @param {string} userId - User ID
     * @returns {string[]} Array of all permissions
     */
    getUserPermissions(userId: string): string[];
    /**
     * Check if user has a specific permission
     * @param {string} userId - User ID
     * @param {string} permission - Permission to check
     * @returns {boolean} Whether user has the permission
     */
    hasPermission(userId: string, permission: string): boolean;
    /**
     * Check if user has any of the specified permissions
     * @param {string} userId - User ID
     * @param {string[]} permissions - Permissions to check
     * @returns {boolean} Whether user has any of the permissions
     */
    hasAnyPermission(userId: string, permissions: string[]): boolean;
    /**
     * Check if user has all of the specified permissions
     * @param {string} userId - User ID
     * @param {string[]} permissions - Permissions to check
     * @returns {boolean} Whether user has all permissions
     */
    hasAllPermissions(userId: string, permissions: string[]): boolean;
    /**
     * Check if user can perform action on resource
     * @param {string} userId - User ID
     * @param {string} action - Action to perform
     * @param {string} resource - Resource to act on
     * @returns {boolean} Whether user can perform the action
     */
    canPerformAction(userId: string, action: string, resource: string): boolean;
    /**
     * Get users with a specific role
     * @param {string} role - Role to search for
     * @returns {string[]} Array of user IDs with the role
     */
    getUsersWithRole(role: string): string[];
    /**
     * Get role statistics
     * @returns {Object} Role distribution statistics
     */
    getRoleStatistics(): Object;
    /**
     * Validate role hierarchy
     * @param {string} assignerRole - Role of user assigning
     * @param {string} targetRole - Role being assigned
     * @returns {boolean} Whether assignment is allowed
     */
    canAssignRole(assignerRole: string, targetRole: string): boolean;
}
export const rbacProvider: RBACProvider;
export default rbacProvider;
//# sourceMappingURL=rbac.d.ts.map