export function generateRandomString(length?: number, charset?: string): string;
export function generateUUID(): string;
export function hashString(input: string): string;
export function deepClone(obj: any): any;
export function isEmpty(value: any): boolean;
export function sanitizeString(input: string): string;
export function formatNumber(num: number): string;
export function formatDate(date: Date | string | number): string;
export function getTimeDifference(start: Date | string | number, end?: Date | string | number): number;
export function retryWithBackoff(fn: Function, maxRetries?: number, baseDelay?: number): Promise<any>;
export function debounce(func: Function, wait: number): Function;
export function throttle(func: Function, limit: number): Function;
export function sleep(ms: number): Promise<any>;
export function isValidEmail(email: string): boolean;
export function isValidURL(url: string): boolean;
export function safeJSONParse(jsonString: string, defaultValue?: any): any;
export function safeJSONStringify(obj: any, defaultValue?: string): string;
declare namespace _default {
    export { generateRandomString };
    export { generateUUID };
    export { hashString };
    export { deepClone };
    export { isEmpty };
    export { sanitizeString };
    export { formatNumber };
    export { formatDate };
    export { getTimeDifference };
    export { retryWithBackoff };
    export { debounce };
    export { throttle };
    export { sleep };
    export { isValidEmail };
    export { isValidURL };
    export { safeJSONParse };
    export { safeJSONStringify };
}
export default _default;
//# sourceMappingURL=index.d.ts.map