import React, { useState, useEffect } from 'react';
import { apiService, type ApiMonitor as ApiMonitorData, type ApiCall } from '@/services/api';

interface ApiMonitorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ApiMonitor: React.FC<ApiMonitorProps> = ({ isVisible, onClose }) => {
  const [monitor, setMonitor] = useState<ApiMonitorData>(apiService.getMonitor());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const handleMonitorUpdate = (newMonitor: ApiMonitorData) => {
      setMonitor(newMonitor);
    };

    apiService.addMonitorListener(handleMonitorUpdate);
    return () => apiService.removeMonitorListener(handleMonitorUpdate);
  }, [isVisible]);

  if (!isVisible) return null;

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: ApiCall['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: ApiCall['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${monitor.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="font-semibold text-sm">API Monitor</h3>
          <span className="text-xs text-gray-500">({monitor.totalCalls} calls)</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Success Rate</div>
            <div className="font-semibold">{monitor.successRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Status</div>
            <div className={`font-semibold ${monitor.isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {monitor.isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
        {monitor.lastError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            <strong>Last Error:</strong> {monitor.lastError}
          </div>
        )}
      </div>

      {/* API Calls List */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          {monitor.calls.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              No API calls yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {monitor.calls.map((call) => (
                <div key={call.id} className="p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(call.status)}</span>
                      <span className="font-mono text-xs">{call.method}</span>
                      <span className="text-gray-600">{call.endpoint}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(call.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={getStatusColor(call.status)}>
                      {call.status.toUpperCase()}
                    </span>
                    <span className="text-gray-500">
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                  {call.error && (
                    <div className="mt-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-1 rounded">
                      {call.error}
                    </div>
                  )}
                  {call.response && (
                    <details className="mt-1">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                        View Response
                      </summary>
                      <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(call.response, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => apiService.clearMonitor()}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear History
          </button>
          <div className="text-xs text-gray-500">
            {monitor.calls.length}/50 calls
          </div>
        </div>
      </div>
    </div>
  );
};
