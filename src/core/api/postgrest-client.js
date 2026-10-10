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
export function createPostgrestClient(url, token) {
  const base = String(url).replace(/\/+$/, '');

  /**
   * Perform one PostgREST request and normalize the outcome to
   * `{ data, error }`. HTTP-level failures resolve to an error envelope
   * (supabase-js semantics) instead of throwing.
   */
  const request = async (method, table, { query = [], body, headers = {} } = {}) => {
    const search = query.length > 0 ? `?${query.join('&')}` : '';
    try {
      const response = await fetch(`${base}/${encodeURIComponent(table)}${search}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      });

      const text = await response.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      if (!response.ok) {
        const envelope =
          payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;
        return {
          data: null,
          error: {
            message: envelope?.message || `PostgREST HTTP ${response.status}`,
            code: envelope?.code || String(response.status),
            details: payload,
          },
        };
      }

      return { data: payload, error: null };
    } catch (networkError) {
      return {
        data: null,
        error: { message: networkError.message, code: 'NETWORK_ERROR', details: null },
      };
    }
  };

  const encodeFilterValue = (value) =>
    typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : String(value);

  /**
   * Build a chainable, thenable query for one table/method combination.
   *
   * @param {string} table
   * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
   * @param {unknown} [body]
   * @param {{ upsert?: boolean, onConflict?: string }} [writeOptions]
   */
  const builder = (table, method, body, writeOptions = {}) => {
    const filters = [];
    const state = {
      columns: null,
      single: false,
      // Writes default to `return=minimal`; `.select()` upgrades to
      // `return=representation` (supabase-js semantics).
      prefer: method === 'GET' ? null : 'return=minimal',
    };

    const addFilter = (op) => (column, value) => {
      filters.push(`${encodeURIComponent(column)}=${op}.${encodeURIComponent(String(value))}`);
      return api;
    };

    const run = () => {
      const headers = {};
      if (writeOptions.upsert) {
        // PostgREST upsert = POST + `resolution=merge-duplicates`.
        headers['Prefer'] = `resolution=merge-duplicates,${state.prefer || 'return=minimal'}`;
      } else if (state.prefer) {
        headers['Prefer'] = state.prefer;
      }
      if (state.single) {
        headers['Accept'] = 'application/vnd.pgrst.object+json';
      }
      const query = [...filters];
      if (writeOptions.onConflict) {
        query.push(`on_conflict=${encodeURIComponent(writeOptions.onConflict)}`);
      }
      if (state.columns) {
        query.unshift(`select=${encodeURIComponent(state.columns)}`);
      }
      return request(method, table, { query, body, headers });
    };

    const api = {
      select(columns = '*') {
        if (method === 'GET') {
          state.columns = columns;
        } else {
          state.prefer = 'return=representation';
        }
        return api;
      },
      eq: addFilter('eq'),
      neq: addFilter('neq'),
      gt: addFilter('gt'),
      gte: addFilter('gte'),
      lt: addFilter('lt'),
      lte: addFilter('lte'),
      in(column, values) {
        const list = (Array.isArray(values) ? values : [values])
          .map(encodeFilterValue)
          .join(',');
        filters.push(`${encodeURIComponent(column)}=in.(${list})`);
        return api;
      },
      match(filterObject) {
        for (const [column, value] of Object.entries(filterObject || {})) {
          filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(String(value))}`);
        }
        return api;
      },
      order(column, options = {}) {
        const direction = options.ascending === false ? 'desc' : 'asc';
        filters.push(`order=${encodeURIComponent(column)}.${direction}`);
        return api;
      },
      limit(count) {
        filters.push(`limit=${encodeURIComponent(String(count))}`);
        return api;
      },
      single() {
        state.single = true;
        return api;
      },
      then(onFulfilled, onRejected) {
        return run().then(onFulfilled, onRejected);
      },
      catch(onRejected) {
        return run().catch(onRejected);
      },
    };

    return api;
  };

  return {
    from(table) {
      return {
        select(columns) {
          return builder(table, 'GET').select(columns);
        },
        insert(rows) {
          return builder(table, 'POST', Array.isArray(rows) ? rows : [rows]);
        },
        upsert(rows, options = {}) {
          return builder(table, 'POST', Array.isArray(rows) ? rows : [rows], {
            upsert: true,
            onConflict: options.onConflict,
          });
        },
        update(patch) {
          return builder(table, 'PATCH', patch);
        },
        delete() {
          return builder(table, 'DELETE');
        },
      };
    },
  };
}

export default createPostgrestClient;
