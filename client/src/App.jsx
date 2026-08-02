import { useState } from 'react';
import DocumentUpload from './components/DocumentUpload';
import ClassificationResult from './components/ClassificationResult';
import HealthStatus from './components/HealthStatus';

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">DocRoute</h1>
          <HealthStatus />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Classify a Document</h2>
          <DocumentUpload
            onClassificationResult={setResult}
            onError={setError}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <ClassificationResult result={result} />
      </main>
    </div>
  );
}

export default App;
