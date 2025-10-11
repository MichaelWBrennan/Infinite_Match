export function asyncHandler(fn: Function): Function;
export function validateRequest(schema: Object): Function;
export function responseFormatter(req: Object, res: Object, next: Function): void;
export function performanceMonitor(req: Object, res: Object, next: Function): void;
export function errorHandler(err: Error, req: Object, res: Object): void;
declare namespace _default {
    export { asyncHandler };
    export { validateRequest };
    export { responseFormatter };
    export { performanceMonitor };
    export { errorHandler };
}
export default _default;
//# sourceMappingURL=index.d.ts.map