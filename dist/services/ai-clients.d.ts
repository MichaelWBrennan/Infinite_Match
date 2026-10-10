/** True when every named variable is set to a non-empty value. */
export function isConfigured(...names: any[]): boolean;
/**
 * True when any AI backend is configured: a hosted OpenAI key, an explicit
 * OpenAI-compatible base URL, or a local Ollama server.
 */
export function isAIConfigured(): boolean;
/**
 * OpenAI-compatible chat client. Works with the hosted OpenAI API or any
 * self-hosted OpenAI-compatible server (Ollama, vLLM, LiteLLM, llama.cpp).
 */
export function createOpenAIClient(): (() => never) | OpenAI;
/**
 * Text-generation client with the `textGeneration({ model, inputs, parameters })`
 * shape used by the content pipeline. Runs against a local Ollama server
 * (FOSS) when `OLLAMA_BASE_URL` is set, otherwise against the Hugging Face
 * Inference API-compatible endpoint (`HF_INFERENCE_URL` + `HUGGINGFACE_API_KEY`).
 * Resolves to `{ generated_text }`.
 */
export function createHuggingFaceClient(): (() => never) | {
    textGeneration({ model, inputs, parameters }?: {
        parameters?: {} | undefined;
    }): Promise<{
        generated_text: any;
    }>;
};
/**
 * PostgREST data client (supabase-js compatible subset). Point it at a
 * self-hosted PostgREST or Supabase instance backed by PostgreSQL.
 * `SUPABASE_URL` / `SUPABASE_ANON_KEY` are accepted as legacy aliases.
 */
export function createSupabaseClient(): {
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
} | (() => never);
import OpenAI from 'openai';
//# sourceMappingURL=ai-clients.d.ts.map