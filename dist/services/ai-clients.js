/**
 * Factories for third-party AI clients.
 *
 * Several services construct their clients in the constructor, and model
 * SDKs throw when credentials are absent. Since those modules are imported
 * while the server boots, a missing key would take the whole process down
 * before it ever listened on a port.
 *
 * These factories return a real client when the feature is configured, and
 * otherwise a stub that throws a descriptive error the moment a feature is
 * actually used. Boot stays safe; calling an unconfigured service fails
 * loudly and clearly.
 *
 * Open-source-first: every AI feature can run against a local, self-hosted
 * model server instead of a hosted API -
 *
 *   - `OLLAMA_BASE_URL` (e.g. http://localhost:11434) routes both the
 *     OpenAI-compatible client and text generation to a local Ollama server
 *     (MIT). vLLM / LiteLLM / llama.cpp servers work the same way through
 *     `OPENAI_BASE_URL` pointing at their `/v1` endpoint.
 *   - The data layer speaks PostgREST (`POSTGREST_URL`) to a self-hosted
 *     PostgREST / Supabase instance backed by PostgreSQL - no hosted
 *     database vendor required.
 */
import OpenAI from 'openai';
import { createPostgrestClient } from '../core/api/postgrest-client.js';
function hasEnv(name) {
    const value = process.env[name];
    return typeof value === 'string' && value.trim() !== '';
}
/** True when every named variable is set to a non-empty value. */
export function isConfigured(...names) {
    return names.every(hasEnv);
}
/**
 * True when any AI backend is configured: a hosted OpenAI key, an explicit
 * OpenAI-compatible base URL, or a local Ollama server.
 */
export function isAIConfigured() {
    return hasEnv('OPENAI_API_KEY') || hasEnv('OPENAI_BASE_URL') || hasEnv('OLLAMA_BASE_URL');
}
/**
 * Resolve the OpenAI-compatible base URL. Ollama's OpenAI-compatible
 * endpoint lives at `/v1`; add it when the user supplied the bare server URL.
 */
function resolveBaseURL() {
    if (hasEnv('OPENAI_BASE_URL')) {
        return process.env['OPENAI_BASE_URL'];
    }
    if (hasEnv('OLLAMA_BASE_URL')) {
        const base = process.env['OLLAMA_BASE_URL'].replace(/\/+$/, '');
        return base.endsWith('/v1') ? base : `${base}/v1`;
    }
    return undefined;
}
/**
 * Build a callable proxy that throws `message` when any property is invoked.
 * Property access returns another stub so deep paths such as
 * `client.chat.completions.create(...)` still reach the throwing call.
 */
function unavailableClient(service, envVars) {
    const build = () => {
        const target = function () {
            throw new Error(`${service} is not configured: set ${envVars} in the environment to use this feature.`);
        };
        return new Proxy(target, {
            get(_target, prop) {
                // Never answer symbol lookups (Symbol.toPrimitive, Symbol.iterator...)
                if (typeof prop === 'symbol') {
                    return undefined;
                }
                return build();
            },
            apply() {
                throw new Error(`${service} is not configured: set ${envVars} in the environment to use this feature.`);
            },
        });
    };
    return build();
}
/**
 * OpenAI-compatible chat client. Works with the hosted OpenAI API or any
 * self-hosted OpenAI-compatible server (Ollama, vLLM, LiteLLM, llama.cpp).
 */
export function createOpenAIClient() {
    if (!isAIConfigured()) {
        return unavailableClient('OpenAI', 'OPENAI_API_KEY, or OLLAMA_BASE_URL / OPENAI_BASE_URL for a self-hosted model server');
    }
    return new OpenAI({
        // Local servers do not check the key, but the SDK requires one.
        apiKey: process.env['OPENAI_API_KEY'] || 'local',
        baseURL: resolveBaseURL(),
    });
}
/**
 * Text-generation client with the `textGeneration({ model, inputs, parameters })`
 * shape used by the content pipeline. Runs against a local Ollama server
 * (FOSS) when `OLLAMA_BASE_URL` is set, otherwise against the Hugging Face
 * Inference API-compatible endpoint (`HF_INFERENCE_URL` + `HUGGINGFACE_API_KEY`).
 * Resolves to `{ generated_text }`.
 */
export function createHuggingFaceClient() {
    const local = hasEnv('OLLAMA_BASE_URL');
    const hosted = hasEnv('HUGGINGFACE_API_KEY');
    if (!local && !hosted) {
        return unavailableClient('Local/hosted text generation', 'OLLAMA_BASE_URL (self-hosted) or HUGGINGFACE_API_KEY');
    }
    return {
        async textGeneration({ model, inputs, parameters = {} } = {}) {
            if (local) {
                const base = process.env['OLLAMA_BASE_URL'].replace(/\/+$/, '');
                const response = await fetch(`${base}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model,
                        prompt: inputs,
                        stream: false,
                        options: {
                            temperature: parameters.temperature,
                            num_predict: parameters.max_new_tokens,
                        },
                    }),
                    signal: AbortSignal.timeout(60000),
                });
                if (!response.ok) {
                    throw new Error(`Ollama generate failed: HTTP ${response.status}`);
                }
                const data = await response.json();
                return { generated_text: data.response ?? '' };
            }
            // Hugging Face Inference API (or any compatible endpoint such as a
            // self-hosted text-generation-inference server).
            const endpoint = process.env['HF_INFERENCE_URL']?.replace(/\/+$/, '') ||
                'https://api-inference.huggingface.co';
            const response = await fetch(`${endpoint}/models/${model}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env['HUGGINGFACE_API_KEY']}`,
                },
                body: JSON.stringify({ inputs, parameters }),
                signal: AbortSignal.timeout(60000),
            });
            if (!response.ok) {
                throw new Error(`Inference request failed: HTTP ${response.status}`);
            }
            const data = await response.json();
            const first = Array.isArray(data) ? data[0] : data;
            return { generated_text: first?.generated_text ?? '' };
        },
    };
}
/**
 * PostgREST data client (supabase-js compatible subset). Point it at a
 * self-hosted PostgREST or Supabase instance backed by PostgreSQL.
 * `SUPABASE_URL` / `SUPABASE_ANON_KEY` are accepted as legacy aliases.
 */
export function createSupabaseClient() {
    const url = process.env['POSTGREST_URL'] || process.env['SUPABASE_URL'];
    const token = process.env['POSTGREST_TOKEN'] || process.env['SUPABASE_ANON_KEY'];
    if (!hasEnv('POSTGREST_URL') && !hasEnv('SUPABASE_URL')) {
        return unavailableClient('PostgREST data layer', 'POSTGREST_URL (or SUPABASE_URL)');
    }
    return createPostgrestClient(url, token);
}
//# sourceMappingURL=ai-clients.js.map