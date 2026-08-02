const API_BASE_URL = '/api/documents';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload document');
  }

  return response.json();
};

export const classifyText = async (content) => {
  const response = await fetch(`${API_BASE_URL}/classify-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to classify text');
  }

  return response.json();
};

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};

export const getSupportedTypes = async () => {
  const response = await fetch(`${API_BASE_URL}/supported-types`);
  return response.json();
};
