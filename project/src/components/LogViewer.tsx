import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { LogLevel } from '../utils/logger';

export function LogViewer() {
  const [logs, setLogs] = useState(logger.getLogs());
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');

  useEffect(() => {
    // Update logs every second
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter(log => log.level === filter);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-4">
        <h2 className="text-lg font-semibold">Application Logs</h2>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as LogLevel | 'ALL')}
          className="rounded border p-1"
        >
          <option value="ALL">All Logs</option>
          <option value={LogLevel.ERROR}>Errors</option>
          <option value={LogLevel.WARN}>Warnings</option>
          <option value={LogLevel.INFO}>Info</option>
          <option value={LogLevel.DEBUG}>Debug</option>
        </select>
        <button 
          onClick={() => logger.clearLogs()}
          className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
        >
          Clear Logs
        </button>
      </div>
      <div className="max-h-[600px] overflow-auto rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Timestamp</th>
              <th className="px-4 py-2 text-left">Level</th>
              <th className="px-4 py-2 text-left">Message</th>
              <th className="px-4 py-2 text-left">Component</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLogs.map((log, index) => (
              <tr key={index} className={
                log.level === LogLevel.ERROR ? 'bg-red-50' :
                log.level === LogLevel.WARN ? 'bg-yellow-50' :
                log.level === LogLevel.DEBUG ? 'bg-gray-50' :
                'bg-white'
              }>
                <td className="px-4 py-2 text-sm">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={
                    log.level === LogLevel.ERROR ? 'text-red-600' :
                    log.level === LogLevel.WARN ? 'text-yellow-600' :
                    log.level === LogLevel.DEBUG ? 'text-gray-600' :
                    'text-blue-600'
                  }>
                    {log.level}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <div>{log.message}</div>
                  {log.error && (
                    <pre className="mt-1 max-w-xl overflow-auto rounded bg-gray-100 p-2 text-xs">
                      {log.error.stack}
                    </pre>
                  )}
                  {log.data && (
                    <pre className="mt-1 max-w-xl overflow-auto rounded bg-gray-100 p-2 text-xs">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </td>
                <td className="px-4 py-2 text-sm">{log.component || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 