 'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SQLEditor() {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [supabase, setSupabase] = useState<any>(null);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && anonKey) {
      setSupabaseUrl(url);
      const client = createClient(url, anonKey);
      setSupabase(client);
    } else {
      setSupabase({
        rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        from: () => ({
          select: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
        }),
      });
    }
  }, []);

  if (!supabase) {
    return <div>Supabase loading...</div>;
  }

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    const startTime = performance.now();

    try {
      // Use RPC call or raw SQL execution
      const { data, error: dbError } = await supabase.rpc('sql', {
        query: query.trim(),
      });

      if (dbError) {
        // Fallback: try direct query execution
        const tableName = query.match(/FROM\s+(\w+)/i)?.[1];
        if (tableName) {
          const { data: tableData, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(10);

          if (tableError) {
            setError(`Error: ${tableError.message}`);
          } else {
            setResults(tableData || []);
          }
        } else {
          setError(`Database Error: ${dbError.message}`);
        }
      } else {
        setResults(data || []);
      }
    } catch (err: any) {
      setError(`Execution Error: ${err.message}`);
    } finally {
      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      executeQuery();
    }
  };

  return (
    <main className="studio-shell">
      <div className="space-y-4">
        {/* Header */}
        <div className="surface-card p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">Developer tools</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-4xl">SQL Editor</h1>
          <p className="mt-1 break-all text-sm text-slate-400">
            Connected to: <span className="font-mono text-slate-200">{supabaseUrl || 'local fallback'}</span>
          </p>
        </div>

        {/* Main Container */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Query Panel */}
          <div className="space-y-4">
            <div className="surface-card p-4">
              <label className="app-label">
                SQL Query
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="SELECT * FROM users LIMIT 10;"
                  className="app-textarea h-64 font-mono text-sm"
                />
              </label>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <button
                  onClick={executeQuery}
                  disabled={loading}
                  className="app-primary-button flex-1 px-4"
                >
                  {loading ? 'Executing...' : 'Execute (Ctrl+Enter)'}
                </button>
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setError('');
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="surface-card p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Quick templates</p>
              <div className="space-y-2">
                <button
                  onClick={() => setQuery('SELECT * FROM users LIMIT 10;')}
                  className="w-full rounded-[16px] border border-white/10 bg-white/[0.045] p-3 text-left text-sm text-slate-200 transition hover:bg-white/10"
                >
                  → Select All Users
                </button>
                <button
                  onClick={() => setQuery('SELECT COUNT(*) as total FROM users;')}
                  className="w-full rounded-[16px] border border-white/10 bg-white/[0.045] p-3 text-left text-sm text-slate-200 transition hover:bg-white/10"
                >
                  → Count Users
                </button>
                <button
                  onClick={() => setQuery('SELECT * FROM tasks LIMIT 10;')}
                  className="w-full rounded-[16px] border border-white/10 bg-white/[0.045] p-3 text-left text-sm text-slate-200 transition hover:bg-white/10"
                >
                  → Select All Tasks
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            <div className="surface-card p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-orange-200">
                  Results {results.length > 0 && `(${results.length} rows)`}
                </label>
                {executionTime > 0 && (
                  <span className="text-xs text-slate-400">
                    Executed in {executionTime.toFixed(2)}ms
                  </span>
                )}
              </div>

              {error && (
                <div className="mb-4 rounded-[16px] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {results.length > 0 && (
                <div className="max-h-96 overflow-x-auto rounded-[16px] border border-white/10 bg-slate-950/80">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-900">
                      <tr>
                        {Object.keys(results[0]).map((key) => (
                          <th
                            key={key}
                            className="border-b border-white/10 px-4 py-2 text-left font-semibold text-orange-200"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-white/5 transition-colors hover:bg-white/5"
                        >
                          {Object.values(row).map((value: any, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="overflow-hidden text-ellipsis whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-100"
                            >
                              {typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!error && results.length === 0 && !loading && (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm">Execute a query to see results here</p>
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
