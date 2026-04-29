'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SQLEditor() {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SQL Editor</h1>
          <p className="text-purple-300 text-sm">
            Connected to: <span className="font-mono text-purple-200">{supabaseUrl}</span>
          </p>
        </div>

        {/* Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Query Panel */}
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg border border-purple-500/30 p-4 shadow-xl">
              <label className="block text-sm font-semibold text-purple-300 mb-3">
                SQL Query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="SELECT * FROM users LIMIT 10;"
                className="w-full h-64 bg-slate-900 text-white font-mono text-sm p-4 rounded border border-purple-500/20 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              />
              <div className="mt-4 flex gap-3 justify-between">
                <button
                  onClick={executeQuery}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                >
                  {loading ? 'Executing...' : 'Execute (Ctrl+Enter)'}
                </button>
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setError('');
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-slate-800 rounded-lg border border-purple-500/30 p-4 shadow-xl">
              <label className="block text-sm font-semibold text-purple-300 mb-3">
                Quick Templates
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setQuery('SELECT * FROM users LIMIT 10;')}
                  className="w-full text-left bg-slate-700 hover:bg-slate-600 text-purple-200 hover:text-purple-100 p-2 rounded text-sm transition-colors"
                >
                  → Select All Users
                </button>
                <button
                  onClick={() => setQuery('SELECT COUNT(*) as total FROM users;')}
                  className="w-full text-left bg-slate-700 hover:bg-slate-600 text-purple-200 hover:text-purple-100 p-2 rounded text-sm transition-colors"
                >
                  → Count Users
                </button>
                <button
                  onClick={() => setQuery('SELECT * FROM tasks LIMIT 10;')}
                  className="w-full text-left bg-slate-700 hover:bg-slate-600 text-purple-200 hover:text-purple-100 p-2 rounded text-sm transition-colors"
                >
                  → Select All Tasks
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg border border-purple-500/30 p-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-purple-300">
                  Results {results.length > 0 && `(${results.length} rows)`}
                </label>
                {executionTime > 0 && (
                  <span className="text-xs text-purple-400">
                    Executed in {executionTime.toFixed(2)}ms
                  </span>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {results.length > 0 && (
                <div className="overflow-x-auto max-h-96 bg-slate-900 rounded border border-purple-500/20">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700 sticky top-0">
                      <tr>
                        {Object.keys(results[0]).map((key) => (
                          <th
                            key={key}
                            className="text-left px-4 py-2 text-purple-300 font-semibold border-b border-purple-500/20"
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
                          className="hover:bg-slate-700/50 border-b border-purple-500/10 transition-colors"
                        >
                          {Object.values(row).map((value: any, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-4 py-2 text-purple-100 font-mono text-xs whitespace-nowrap overflow-hidden text-ellipsis"
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
                <div className="text-center py-12 text-purple-400">
                  <p className="text-sm">Execute a query to see results here</p>
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
