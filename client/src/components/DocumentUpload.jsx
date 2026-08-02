import { useState, useRef } from 'react';
import { uploadDocument, classifyText } from '../api/documentApi';

export default function DocumentUpload({ onClassificationResult, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileUpload = async (file) => {
    setIsProcessing(true);
    onError(null);
    try {
      const result = await uploadDocument(file);
      onClassificationResult(result.data);
    } catch (err) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    onError(null);
    try {
      const result = await classifyText(textInput);
      onClassificationResult(result.data);
    } catch (err) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'file'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'text'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Paste Text
        </button>
      </div>

      {activeTab === 'file' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-600">Processing document...</p>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-1">Drag and drop a document here, or click to select</p>
              <p className="text-sm text-gray-500">Supports PDF and TXT files up to 10MB</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your document text here..."
            rows={8}
            className={`w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isProcessing ? 'opacity-50' : ''
            }`}
            disabled={isProcessing}
          />
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isProcessing}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Classifying...' : 'Classify Text'}
          </button>
        </div>
      )}
    </div>
  );
}
