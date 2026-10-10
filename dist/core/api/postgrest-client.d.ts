/**
 * Minimal PostgREST client.
 *
 * Replaces `@supabase/supabase-js` with a dependency-free client covering the
 * PostgREST query-builder subset this application uses:
 *
 *   from(table).select(cols).eq().neq().gt().gte().lt().lte().in()
 *     .match(obj).order().limit().single()
 *   from(table).insert(row|rows)
 *   from(table).upsert(row|rows, { onConflict })
 *   from(table).update(patch).eq()...
 *   from(table).delete().eq()...
 *
 * Every builder is thenable and resolves to `{ data, error }` with the same
 * shape supabase-js uses, so call sites are unchanged. Point `POSTGREST_URL`
 * (or the legacy `SUPABASE_URL`) at any self-hosted PostgREST / Supabase
 * instance — it speaks plain HTTP to PostgreSQL and is fully open source
 * (Apache-2.0).
 */
/**
 * @param {string} url     Base URL of the PostgREST server (e.g. http://localhost:3001)
 * @param {string} [token] Bearer token (JWT or API key) sent as Authorization.
 */
export function createPostgrestClient(url: string, token?: string): {
    from(table: any): {
        select(columns: any): {
            select(columns?: string): /*elided*/ any;
            eq: (column: any, value: any) => /*elided*/ any;
            neq: (column: any, value: any) => /*elided*/ any;
            gt: (column: any, value: any) => /*elided*/ any;
            gte: (column: any, value: any) => /*elided*/ any;
            lt: (column: any, value: any) => /*elided*/ any;
            lte: (column: any, value: any) => /*elided*/ any;
            in(column: any, values: any): /*elided*/ any;
            match(filterObject: any): /*elided*/ any;
            order(column: any, options?: {}): /*elided*/ any;
            limit(count: any): /*elided*/ any;
            single(): /*elided*/ any;
            then(onFulfilled: any, onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
            catch(onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
        };
        insert(rows: any): {
            select(columns?: string): /*elided*/ any;
            eq: (column: any, value: any) => /*elided*/ any;
            neq: (column: any, value: any) => /*elided*/ any;
            gt: (column: any, value: any) => /*elided*/ any;
            gte: (column: any, value: any) => /*elided*/ any;
            lt: (column: any, value: any) => /*elided*/ any;
            lte: (column: any, value: any) => /*elided*/ any;
            in(column: any, values: any): /*elided*/ any;
            match(filterObject: any): /*elided*/ any;
            order(column: any, options?: {}): /*elided*/ any;
            limit(count: any): /*elided*/ any;
            single(): /*elided*/ any;
            then(onFulfilled: any, onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
            catch(onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
        };
        upsert(rows: any, options?: {}): {
            select(columns?: string): /*elided*/ any;
            eq: (column: any, value: any) => /*elided*/ any;
            neq: (column: any, value: any) => /*elided*/ any;
            gt: (column: any, value: any) => /*elided*/ any;
            gte: (column: any, value: any) => /*elided*/ any;
            lt: (column: any, value: any) => /*elided*/ any;
            lte: (column: any, value: any) => /*elided*/ any;
            in(column: any, values: any): /*elided*/ any;
            match(filterObject: any): /*elided*/ any;
            order(column: any, options?: {}): /*elided*/ any;
            limit(count: any): /*elided*/ any;
            single(): /*elided*/ any;
            then(onFulfilled: any, onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
            catch(onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
        };
        update(patch: any): {
            select(columns?: string): /*elided*/ any;
            eq: (column: any, value: any) => /*elided*/ any;
            neq: (column: any, value: any) => /*elided*/ any;
            gt: (column: any, value: any) => /*elided*/ any;
            gte: (column: any, value: any) => /*elided*/ any;
            lt: (column: any, value: any) => /*elided*/ any;
            lte: (column: any, value: any) => /*elided*/ any;
            in(column: any, values: any): /*elided*/ any;
            match(filterObject: any): /*elided*/ any;
            order(column: any, options?: {}): /*elided*/ any;
            limit(count: any): /*elided*/ any;
            single(): /*elided*/ any;
            then(onFulfilled: any, onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
            catch(onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
        };
        delete(): {
            select(columns?: string): /*elided*/ any;
            eq: (column: any, value: any) => /*elided*/ any;
            neq: (column: any, value: any) => /*elided*/ any;
            gt: (column: any, value: any) => /*elided*/ any;
            gte: (column: any, value: any) => /*elided*/ any;
            lt: (column: any, value: any) => /*elided*/ any;
            lte: (column: any, value: any) => /*elided*/ any;
            in(column: any, values: any): /*elided*/ any;
            match(filterObject: any): /*elided*/ any;
            order(column: any, options?: {}): /*elided*/ any;
            limit(count: any): /*elided*/ any;
            single(): /*elided*/ any;
            then(onFulfilled: any, onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
            catch(onRejected: any): Promise<{
                data: null;
                error: {
                    message: any;
                    code: any;
                    details: any;
                };
            } | {
                data: any;
                error: null;
            }>;
        };
    };
};
export default createPostgrestClient;
//# sourceMappingURL=postgrest-client.d.ts.map