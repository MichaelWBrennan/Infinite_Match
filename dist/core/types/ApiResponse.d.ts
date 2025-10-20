/**
 * Standardized API Response Types
 * Ensures consistent response format across all endpoints
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        type: string;
        recoverable: boolean;
        action: string;
        timestamp: string;
        context?: Record<string, any> | undefined;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        version?: string;
    };
}
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface HealthCheckResponse {
    uptime: number;
    message: string;
    timestamp: string;
    services: {
        analytics: any;
        cloud: any;
    };
}
export declare class ApiResponseBuilder {
    static success<T>(data: T, meta?: Partial<ApiResponse['meta']>): ApiResponse<T>;
    static error(code: string, message: string, type?: string, recoverable?: boolean, action?: string, context?: Record<string, any>): ApiResponse;
    static paginated<T>(data: T[], page: number, limit: number, total: number, meta?: Partial<ApiResponse['meta']>): PaginatedResponse<T>;
}
//# sourceMappingURL=ApiResponse.d.ts.map