/**
 * Factories for third-party AI clients.
 *
 * Several services construct their clients in the constructor, and the OpenAI,
 * Hugging Face and Supabase SDKs all throw when credentials are absent. Since
 * those modules are imported while the server boots, a missing key would take
 * the whole process down before it ever listened on a port.
 *
 * These factories return a real client when credentials exist, and otherwise a
 * stub that throws a descriptive error the moment a feature is actually used.
 * Boot stays safe; calling an unconfigured service fails loudly and clearly.
 */

import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';
import { createClient } from '@supabase/supabase-js';

function hasEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '';
}

/** True when every named variable is set to a non-empty value. */
export function isConfigured(...names) {
  return names.every(hasEnv);
}

/**
 * Build a callable proxy that throws `message` when any property is invoked.
 * Property access returns another stub so deep paths such as
 * `client.chat.completions.create(...)` still reach the throwing call.
 */
function unavailableClient(service, envVars) {
  const build = () => {
    const target = function () {
      throw new Error(
        `${service} is not configured: set ${envVars} in the environment to use this feature.`,
      );
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
        throw new Error(
          `${service} is not configured: set ${envVars} in the environment to use this feature.`,
        );
      },
    });
  };
  return build();
}

export function createOpenAIClient() {
  return hasEnv('OPENAI_API_KEY')
    ? new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
    : unavailableClient('OpenAI', 'OPENAI_API_KEY');
}

export function createHuggingFaceClient() {
  return hasEnv('HUGGINGFACE_API_KEY')
    ? new HfInference(process.env['HUGGINGFACE_API_KEY'])
    : unavailableClient('Hugging Face', 'HUGGINGFACE_API_KEY');
}

export function createSupabaseClient() {
  return isConfigured('SUPABASE_URL', 'SUPABASE_ANON_KEY')
    ? createClient(process.env['SUPABASE_URL'], process.env['SUPABASE_ANON_KEY'])
    : unavailableClient('Supabase', 'SUPABASE_URL and SUPABASE_ANON_KEY');
}
