import { useState, useEffect } from 'react';
import { checkHealth } from '../api/documentApi';

export default function HealthStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const result = await checkHealth();
        setStatus(result.data);
      } catch {
        setStatus({ healthy: false, service: 'OpenRouter AI' });
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
        Checking AI service...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${status?.healthy ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span className="text-gray-600">
        {status?.service}: {status?.healthy ? 'Connected' : 'Offline'}
      </span>
    </div>
  );
}
