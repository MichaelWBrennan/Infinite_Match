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
    context?: Record<string, any>;
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

export class ApiResponseBuilder {
  static success<T>(data: T, meta?: Partial<ApiResponse['meta']>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    type: string = 'unknown',
    recoverable: boolean = false,
    action: string = 'investigate',
    context?: Record<string, any>
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        type,
        recoverable,
        action,
        timestamp: new Date().toISOString(),
        context,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    meta?: Partial<ApiResponse['meta']>
  ): PaginatedResponse<T> {
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