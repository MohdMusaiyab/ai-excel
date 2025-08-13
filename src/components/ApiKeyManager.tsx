'use client';

import { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey: string | null;
}

export default function ApiKeyManager({ onApiKeySet, currentApiKey }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (currentApiKey) {
      setApiKey(currentApiKey);
    }
  }, [currentApiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    try {
      
      if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
        alert('Invalid API key format. Gemini API keys should start with "AIza" and be longer than 30 characters.');
        setIsValidating(false);
        return;
      }

      onApiKeySet(apiKey.trim());
      alert('API key set successfully! AI features are now enabled.');
    } catch (error) {
      console.error('Error setting API key:', error);
      alert('Error setting API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    onApiKeySet('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">🔑 Gemini API Key Required</h2>
          <p className="text-sm text-gray-600 mt-2">
            This application uses Google Gemini AI for intelligent data processing. 
            Please provide your API key to enable AI features.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              Google Gemini API Key
            </label>
            <div className="mt-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="AIza..."
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!apiKey.trim() || isValidating}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Set API Key'}
            </button>
            
            {currentApiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="text-sm font-medium text-yellow-800">⚠️ Features requiring API key:</h4>
          <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
            <li>Intelligent header mapping during file upload</li>
            <li>Natural language search</li>
            <li>AI-powered validation suggestions</li>
            <li>Convert natural language to business rules</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="text-sm font-medium text-green-800">✅ Features available without API key:</h4>
          <ul className="text-xs text-green-700 mt-1 list-disc list-inside">
            <li>File upload and data management</li>
            <li>Manual data validation</li>
            <li>UI-based rule builder</li>
            <li>Priority management</li>
            <li>Data export</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
