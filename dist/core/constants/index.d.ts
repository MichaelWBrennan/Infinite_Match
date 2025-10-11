export namespace HTTP_STATUS {
    let OK: number;
    let CREATED: number;
    let NO_CONTENT: number;
    let BAD_REQUEST: number;
    let UNAUTHORIZED: number;
    let FORBIDDEN: number;
    let NOT_FOUND: number;
    let CONFLICT: number;
    let UNPROCESSABLE_ENTITY: number;
    let TOO_MANY_REQUESTS: number;
    let INTERNAL_SERVER_ERROR: number;
    let SERVICE_UNAVAILABLE: number;
}
export namespace ERROR_CODES {
    let VALIDATION_ERROR: string;
    let NETWORK_ERROR: string;
    let CONFIGURATION_ERROR: string;
    let SERVICE_ERROR: string;
    let AUTHENTICATION_ERROR: string;
    let AUTHORIZATION_ERROR: string;
    let NOT_FOUND_ERROR: string;
    let CONFLICT_ERROR: string;
    let RATE_LIMIT_ERROR: string;
    let UNKNOWN_ERROR: string;
}
export namespace CACHE_KEYS {
    let ECONOMY_DATA: string;
    let USER_SESSION: string;
    let SEGMENTS: string;
    let RECEIPT: string;
    let UNITY_CONFIG: string;
}
export namespace CACHE_TTL {
    let ECONOMY_DATA_1: number;
    export { ECONOMY_DATA_1 as ECONOMY_DATA };
    let USER_SESSION_1: number;
    export { USER_SESSION_1 as USER_SESSION };
    let SEGMENTS_1: number;
    export { SEGMENTS_1 as SEGMENTS };
    let RECEIPT_1: number;
    export { RECEIPT_1 as RECEIPT };
    let UNITY_CONFIG_1: number;
    export { UNITY_CONFIG_1 as UNITY_CONFIG };
}
export namespace RATE_LIMITS {
    namespace GENERAL {
        let windowMs: number;
        let max: number;
    }
    namespace AUTH {
        let windowMs_1: number;
        export { windowMs_1 as windowMs };
        let max_1: number;
        export { max_1 as max };
    }
    namespace STRICT {
        let windowMs_2: number;
        export { windowMs_2 as windowMs };
        let max_2: number;
        export { max_2 as max };
    }
}
export namespace VALIDATION_RULES {
    namespace PLAYER_ID {
        let minLength: number;
        let maxLength: number;
        let pattern: RegExp;
    }
    namespace EMAIL {
        let pattern_1: RegExp;
        export { pattern_1 as pattern };
    }
    namespace PASSWORD {
        let minLength_1: number;
        export { minLength_1 as minLength };
        let maxLength_1: number;
        export { maxLength_1 as maxLength };
        let pattern_2: RegExp;
        export { pattern_2 as pattern };
    }
    namespace CURRENCY_CODE {
        let pattern_3: RegExp;
        export { pattern_3 as pattern };
    }
    namespace SKU {
        let pattern_4: RegExp;
        export { pattern_4 as pattern };
        let minLength_2: number;
        export { minLength_2 as minLength };
        let maxLength_2: number;
        export { maxLength_2 as maxLength };
    }
}
export namespace ECONOMY_TYPES {
    let CURRENCY: string;
    let INVENTORY: string;
    let CATALOG: string;
}
export namespace RARITY_LEVELS {
    let COMMON: string;
    let UNCOMMON: string;
    let RARE: string;
    let EPIC: string;
    let LEGENDARY: string;
}
export namespace PROMO_CODES {
    let WELCOME: string;
    let FREE100: string;
    let STARTER: string;
    let COMEBACK: string;
}
export namespace PROMO_REWARDS {
    export namespace WELCOME_1 {
        let coins: number;
        let gems: number;
    }
    export { WELCOME_1 as WELCOME };
    export namespace FREE100_1 {
        let coins_1: number;
        export { coins_1 as coins };
        let gems_1: number;
        export { gems_1 as gems };
    }
    export { FREE100_1 as FREE100 };
    export namespace STARTER_1 {
        let coins_2: number;
        export { coins_2 as coins };
        let gems_2: number;
        export { gems_2 as gems };
    }
    export { STARTER_1 as STARTER };
    export namespace COMEBACK_1 {
        let coins_3: number;
        export { coins_3 as coins };
        let gems_3: number;
        export { gems_3 as gems };
    }
    export { COMEBACK_1 as COMEBACK };
}
export namespace LOG_LEVELS {
    let ERROR: string;
    let WARN: string;
    let INFO: string;
    let DEBUG: string;
}
export namespace SECURITY_EVENTS {
    let LOGIN_SUCCESS: string;
    let LOGIN_FAILED: string;
    let RATE_LIMIT_EXCEEDED: string;
    let SUSPICIOUS_ACTIVITY: string;
    let PROMO_CODE_USED: string;
    let INVALID_PROMO_CODE: string;
}
declare namespace _default {
    export { HTTP_STATUS };
    export { ERROR_CODES };
    export { CACHE_KEYS };
    export { CACHE_TTL };
    export { RATE_LIMITS };
    export { VALIDATION_RULES };
    export { ECONOMY_TYPES };
    export { RARITY_LEVELS };
    export { PROMO_CODES };
    export { PROMO_REWARDS };
    export { LOG_LEVELS };
    export { SECURITY_EVENTS };
}
export default _default;
//# sourceMappingURL=index.d.ts.map