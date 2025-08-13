'use client';

import { useState } from 'react';
import { EntityType } from '@/types';
import { aiService } from '@/lib/ai';

interface SearchComponentProps {
  onSearch: (results: any[]) => void;
  data: any[];
  entityType: EntityType;
  onClearSearch: () => void;
  onError?: (error: any) => void;
}

export default function SearchComponent({ onSearch, data, entityType, onClearSearch, onError }: SearchComponentProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      onClearSearch();
      return;
    }

    setIsSearching(true);
    try {
      const results = await aiService.searchData(query, data, entityType);
      onSearch(results);
      setLastQuery(query);
    } catch (error) {
      console.error('Search error:', error);
      
      // Check if it's an API key error
      if (error instanceof Error && error.message?.includes('requires a valid Gemini API key')) {
        if (onError) {
          onError(error);
          return;
        }
      }
      
      // Fallback to simple text search
      const results = data.filter(item => 
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      );
      onSearch(results);
      setLastQuery(query);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setLastQuery('');
    onClearSearch();
  };

  const quickSearchExamples = {
    clients: [
      'high priority clients',
      'clients requesting task T001',
      'enterprise group clients'
    ],
    workers: [
      'workers with JavaScript skills',
      'backend group workers',
      'workers available in phase 1'
    ],
    tasks: [
      'tasks with duration more than 2',
      'development category tasks',
      'tasks requiring Python skills'
    ]
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Search ${entityType} using natural language...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        {lastQuery && (
          <button
            onClick={clearSearch}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Search Examples */}
      <div className="text-xs text-gray-600">
        <p className="font-medium mb-1">Try these examples:</p>
        <div className="flex flex-wrap gap-1">
          {quickSearchExamples[entityType].map((example, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(example);
                // Auto-search after setting example
                setTimeout(() => handleSearch(), 100);
              }}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs border"
            >
              &quot;{example}&quot;
            </button>
          ))}
        </div>
      </div>

      {lastQuery && (
        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
          <span>Showing results for: <strong>&quot;{lastQuery}&quot;</strong></span>
        </div>
      )}
    </div>
  );
}