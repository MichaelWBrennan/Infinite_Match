/**
 * Role-Based Access Control (RBAC) Implementation
 * Provides comprehensive authorization system
 */
import { Logger } from '../logger/index.js';
const logger = new Logger('RBAC');
// Define roles and their permissions
export const ROLES = {
    GUEST: 'guest',
    USER: 'user',
    PREMIUM_USER: 'premium_user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};
export const PERMISSIONS = {
    // User permissions
    READ_PROFILE: 'read_profile',
    UPDATE_PROFILE: 'update_profile',
    DELETE_ACCOUNT: 'delete_account',
    // Game permissions
    PLAY_GAME: 'play_game',
    ACCESS_PREMIUM_FEATURES: 'access_premium_features',
    USE_BOOSTERS: 'use_boosters',
    PURCHASE_ITEMS: 'purchase_items',
    // Social permissions
    VIEW_LEADERBOARDS: 'view_leaderboards',
    SEND_FRIEND_REQUESTS: 'send_friend_requests',
    CHAT_WITH_FRIENDS: 'chat_with_friends',
    CREATE_GUILDS: 'create_guilds',
    // Moderation permissions
    MODERATE_CHAT: 'moderate_chat',
    BAN_USERS: 'ban_users',
    VIEW_REPORTS: 'view_reports',
    MANAGE_CONTENT: 'manage_content',
    // Admin permissions
    MANAGE_USERS: 'manage_users',
    MANAGE_GAME_SETTINGS: 'manage_game_settings',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_ECONOMY: 'manage_economy',
    DEPLOY_UPDATES: 'deploy_updates',
    // Super admin permissions
    MANAGE_ADMINS: 'manage_admins',
    SYSTEM_CONFIGURATION: 'system_configuration',
    DATABASE_ACCESS: 'database_access',
    SECURITY_OVERRIDE: 'security_override'
};
// Role hierarchy (higher roles inherit lower role permissions)
const ROLE_HIERARCHY = {
    [ROLES.GUEST]: 0,
    [ROLES.USER]: 1,
    [ROLES.PREMIUM_USER]: 2,
    [ROLES.MODERATOR]: 3,
    [ROLES.ADMIN]: 4,
    [ROLES.SUPER_ADMIN]: 5
};
// Define permissions for each role
const ROLE_PERMISSIONS = {
    [ROLES.GUEST]: [
        PERMISSIONS.READ_PROFILE
    ],
    [ROLES.USER]: [
        PERMISSIONS.READ_PROFILE,
        PERMISSIONS.UPDATE_PROFILE,
        PERMISSIONS.DELETE_ACCOUNT,
        PERMISSIONS.PLAY_GAME,
        PERMISSIONS.USE_BOOSTERS,
        PERMISSIONS.PURCHASE_ITEMS,
        PERMISSIONS.VIEW_LEADERBOARDS,
        PERMISSIONS.SEND_FRIEND_REQUESTS,
        PERMISSIONS.CHAT_WITH_FRIENDS
    ],
    [ROLES.PREMIUM_USER]: [
        // Inherits all USER permissions
        ...Object.values(ROLE_PERMISSIONS[ROLES.USER]),
        PERMISSIONS.ACCESS_PREMIUM_FEATURES,
        PERMISSIONS.CREATE_GUILDS
    ],
    [ROLES.MODERATOR]: [
        // Inherits all PREMIUM_USER permissions
        ...Object.values(ROLE_PERMISSIONS[ROLES.PREMIUM_USER]),
        PERMISSIONS.MODERATE_CHAT,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.MANAGE_CONTENT
    ],
    [ROLES.ADMIN]: [
        // Inherits all MODERATOR permissions
        ...Object.values(ROLE_PERMISSIONS[ROLES.MODERATOR]),
        PERMISSIONS.BAN_USERS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_GAME_SETTINGS,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_ECONOMY,
        PERMISSIONS.DEPLOY_UPDATES
    ],
    [ROLES.SUPER_ADMIN]: [
        // Inherits all ADMIN permissions
        ...Object.values(ROLE_PERMISSIONS[ROLES.ADMIN]),
        PERMISSIONS.MANAGE_ADMINS,
        PERMISSIONS.SYSTEM_CONFIGURATION,
        PERMISSIONS.DATABASE_ACCESS,
        PERMISSIONS.SECURITY_OVERRIDE
    ]
};
export class RBACProvider {
    constructor() {
        this.userRoles = new Map(); // In production, this would be in a database
        this.roleCache = new Map();
    }
    /**
     * Assign a role to a user
     * @param {string} userId - User ID
     * @param {string} role - Role to assign
     * @param {string} assignedBy - ID of user who assigned the role
     */
    assignRole(userId, role, assignedBy) {
        if (!Object.values(ROLES).includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }
        this.userRoles.set(userId, {
            role,
            assignedBy,
            assignedAt: new Date().toISOString(),
            permissions: this.getRolePermissions(role)
        });
        logger.info('Role assigned', { userId, role, assignedBy });
    }
    /**
     * Remove a role from a user
     * @param {string} userId - User ID
     * @param {string} removedBy - ID of user who removed the role
     */
    removeRole(userId, removedBy) {
        const userRole = this.userRoles.get(userId);
        if (userRole) {
            this.userRoles.delete(userId);
            logger.info('Role removed', { userId, previousRole: userRole.role, removedBy });
        }
    }
    /**
     * Get user's role
     * @param {string} userId - User ID
     * @returns {string|null} User's role or null if not found
     */
    getUserRole(userId) {
        const userRole = this.userRoles.get(userId);
        return userRole ? userRole.role : ROLES.GUEST;
    }
    /**
     * Get permissions for a role
     * @param {string} role - Role name
     * @returns {string[]} Array of permissions
     */
    getRolePermissions(role) {
        if (this.roleCache.has(role)) {
            return this.roleCache.get(role);
        }
        const permissions = ROLE_PERMISSIONS[role] || [];
        this.roleCache.set(role, permissions);
        return permissions;
    }
    /**
     * Get all permissions for a user (including inherited permissions)
     * @param {string} userId - User ID
     * @returns {string[]} Array of all permissions
     */
    getUserPermissions(userId) {
        const userRole = this.userRoles.get(userId);
        if (!userRole) {
            return this.getRolePermissions(ROLES.GUEST);
        }
        const role = userRole.role;
        const permissions = new Set();
        // Add permissions from current role and all lower roles
        Object.keys(ROLE_HIERARCHY).forEach(roleName => {
            if (ROLE_HIERARCHY[roleName] <= ROLE_HIERARCHY[role]) {
                const rolePermissions = this.getRolePermissions(roleName);
                rolePermissions.forEach(permission => permissions.add(permission));
            }
        });
        return Array.from(permissions);
    }
    /**
     * Check if user has a specific permission
     * @param {string} userId - User ID
     * @param {string} permission - Permission to check
     * @returns {boolean} Whether user has the permission
     */
    hasPermission(userId, permission) {
        const permissions = this.getUserPermissions(userId);
        return permissions.includes(permission);
    }
    /**
     * Check if user has any of the specified permissions
     * @param {string} userId - User ID
     * @param {string[]} permissions - Permissions to check
     * @returns {boolean} Whether user has any of the permissions
     */
    hasAnyPermission(userId, permissions) {
        const userPermissions = this.getUserPermissions(userId);
        return permissions.some(permission => userPermissions.includes(permission));
    }
    /**
     * Check if user has all of the specified permissions
     * @param {string} userId - User ID
     * @param {string[]} permissions - Permissions to check
     * @returns {boolean} Whether user has all permissions
     */
    hasAllPermissions(userId, permissions) {
        const userPermissions = this.getUserPermissions(userId);
        return permissions.every(permission => userPermissions.includes(permission));
    }
    /**
     * Check if user can perform action on resource
     * @param {string} userId - User ID
     * @param {string} action - Action to perform
     * @param {string} resource - Resource to act on
     * @returns {boolean} Whether user can perform the action
     */
    canPerformAction(userId, action, resource) {
        const permission = `${action}_${resource}`.toLowerCase();
        return this.hasPermission(userId, permission);
    }
    /**
     * Get users with a specific role
     * @param {string} role - Role to search for
     * @returns {string[]} Array of user IDs with the role
     */
    getUsersWithRole(role) {
        const users = [];
        for (const [userId, userRole] of this.userRoles.entries()) {
            if (userRole.role === role) {
                users.push(userId);
            }
        }
        return users;
    }
    /**
     * Get role statistics
     * @returns {Object} Role distribution statistics
     */
    getRoleStatistics() {
        const stats = {};
        Object.values(ROLES).forEach(role => {
            stats[role] = 0;
        });
        for (const userRole of this.userRoles.values()) {
            stats[userRole.role]++;
        }
        return stats;
    }
    /**
     * Validate role hierarchy
     * @param {string} assignerRole - Role of user assigning
     * @param {string} targetRole - Role being assigned
     * @returns {boolean} Whether assignment is allowed
     */
    canAssignRole(assignerRole, targetRole) {
        const assignerLevel = ROLE_HIERARCHY[assignerRole] || 0;
        const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
        // Can only assign roles at or below your level
        return assignerLevel > targetLevel;
    }
}
export const rbacProvider = new RBACProvider();
export default rbacProvider;
//# sourceMappingURL=rbac.js.map