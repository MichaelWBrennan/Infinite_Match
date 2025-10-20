/**
 * Standardized API Response Types
 * Ensures consistent response format across all endpoints
 */
export class ApiResponseBuilder {
    static success(data, meta) {
        return {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };
    }
    static error(code, message, type = 'unknown', recoverable = false, action = 'investigate', context) {
        return {
            success: false,
            error: {
                code,
                message,
                type,
                recoverable,
                action,
                timestamp: new Date().toISOString(),
                context: context || undefined,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }
    static paginated(data, page, limit, total, meta) {
        const totalPages = Math.ceil(total / limit);
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };
    }
}
//# sourceMappingURL=ApiResponse.js.map