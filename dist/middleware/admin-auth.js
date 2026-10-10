/**
 * Admin authentication for operator-only routes.
 *
 * Fails closed: if ADMIN_API_TOKEN (at least 32 characters) or ADMIN_IDS is not
 * configured, every admin request is refused. Callers send:
 *   x-admin-token: <ADMIN_API_TOKEN>
 *   x-admin-id:    <one of ADMIN_IDS, comma-separated>
 */
import crypto from 'crypto';
import { Logger } from '../core/logger/index.js';
import { logSecurityEvent } from '../core/security/index.js';
const logger = new Logger('AdminAuth');
const MIN_TOKEN_LENGTH = 32;
function constantTimeEqual(a, b) {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    if (left.length !== right.length) {
        // Compare against itself so the time taken does not depend on the mismatch point.
        crypto.timingSafeEqual(left, left);
        return false;
    }
    return crypto.timingSafeEqual(left, right);
}
function allowedAdminIds() {
    return (process.env.ADMIN_IDS || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
}
/**
 * Returns the admin identity if the credentials are valid, otherwise null.
 */
export function verifyAdminCredentials(token, adminId) {
    const expected = process.env.ADMIN_API_TOKEN || '';
    const allowed = allowedAdminIds();
    if (expected.length < MIN_TOKEN_LENGTH || allowed.length === 0)
        return null;
    if (!token || !adminId)
        return null;
    if (!allowed.includes(adminId))
        return null;
    if (!constantTimeEqual(token, expected))
        return null;
    return { id: adminId, permissions: ['admin'] };
}
export function adminAuth(req, res, next) {
    try {
        const admin = verifyAdminCredentials(req.headers['x-admin-token'], req.headers['x-admin-id']);
        if (!admin) {
            logSecurityEvent('admin_auth_failed', {
                adminId: req.headers['x-admin-id'] || null,
                ip: req.ip,
                endpoint: req.path,
            });
            return res.status(401).json({
                success: false,
                error: 'Admin credentials required',
                requestId: req.requestId,
            });
        }
        req.admin = { ...admin, lastActivity: new Date().toISOString() };
        logSecurityEvent('admin_access', { adminId: admin.id, ip: req.ip, endpoint: req.path });
        next();
    }
    catch (error) {
        logger.error('Admin authentication error', { error: error.message });
        res.status(500).json({ success: false, error: 'Authentication service error' });
    }
}
export default { adminAuth, verifyAdminCredentials };
//# sourceMappingURL=admin-auth.js.map