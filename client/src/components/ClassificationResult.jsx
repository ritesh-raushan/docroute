const confidenceColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

const departmentIcons = {
  finance: '💰',
  procurement: '📦',
  legal: '⚖️',
  operations: '⚙️',
  general: '📋',
};

export default function ClassificationResult({ result }) {
  if (!result) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Classification Result</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Document Type</p>
          <p className="font-medium text-gray-900 capitalize">{result.documentType?.replace('_', ' ')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Department</p>
          <p className="font-medium text-gray-900 capitalize">
            {departmentIcons[result.department]} {result.department}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Confidence</p>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{(result.confidence * 100).toFixed(1)}%</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceColors[result.confidenceLevel]}`}>
              {result.confidenceLevel}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Routing Confidence</p>
          <span className="font-medium text-gray-900">{(result.routingConfidence * 100).toFixed(1)}%</span>
        </div>
      </div>

      {result.reasoning && (
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Reasoning</p>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">{result.reasoning}</p>
        </div>
      )}

      {result.extractedData && Object.keys(result.extractedData).length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Extracted Data</p>
          <div className="bg-gray-50 p-3 rounded">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(result.extractedData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {result.suggestedActions?.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Suggested Actions</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {result.suggestedActions.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {result.routingRecommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800 font-medium">{result.routingRecommendation}</p>
        </div>
      )}
    </div>
  );
}
