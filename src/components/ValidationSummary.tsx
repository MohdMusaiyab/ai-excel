'use client';

import { useState } from 'react';
import { ValidationError } from '@/types';
import { aiService } from '@/lib/ai';

interface ValidationSummaryProps {
  errors: ValidationError[];
  data: { clients: any[], workers: any[], tasks: any[] };
  onApplyFix: (entityType: string, rowIndex: number, field: string, newValue: any) => void;
  onAIError?: (error: any) => void;
}

export default function ValidationSummary({ errors, data, onApplyFix, onAIError }: ValidationSummaryProps) {
  const [isGettingSuggestion, setIsGettingSuggestion] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ [key: string]: any }>({});
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  const groupedErrors = errors.reduce((acc, error) => {
    const key = `${error.entity || 'general'}_${error.type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(error);
    return acc;
  }, {} as { [key: string]: ValidationError[] });

  const handleGetSuggestion = async (error: ValidationError) => {
    const errorKey = `${error.entity}_${error.row}_${error.column}`;
    console.log('AI Fix button clicked for error:', error); 
    console.log('Error key:', errorKey); 
    
    setIsGettingSuggestion(errorKey);
    
    try {
      let entityData: any[] = [];
      if (error.entity === 'clients') entityData = data.clients;
      else if (error.entity === 'workers') entityData = data.workers;
      else if (error.entity === 'tasks') entityData = data.tasks;

      console.log('Entity data for AI:', entityData.slice(0, 2));
      console.log('Calling AI service...'); 

      const suggestions = await aiService.suggestCorrections(entityData, [error], error.entity || 'unknown');
      console.log('AI Suggestions received:', suggestions);
      console.log('Error details:', { row: error.row, column: error.column, entity: error.entity }); 
      setSuggestions(prev => ({ ...prev, [errorKey]: suggestions }));
      setShowSuggestions(prev => ({ ...prev, [errorKey]: true }));
    } catch (err) {
      console.error('Failed to get AI suggestion:', err);
      
    
      if (err instanceof Error && err.message?.includes('requires a valid Gemini API key')) {
        if (onAIError) {
          onAIError(err);
          return;
        }
      }
      
      alert('Failed to get AI suggestion. Please try again.');
    } finally {
      setIsGettingSuggestion(null);
    }
  };

  const handleApplySuggestion = (error: ValidationError, suggestion: any) => {
    console.log('Applying suggestion:', { error, suggestion }); 
    
    if (error.row !== undefined && error.column && error.entity) {
      const field = error.column;
      const rowKey = error.row.toString();
      const rowSuggestions = suggestion[rowKey];
      
      console.log('Row suggestions:', rowSuggestions); 
      console.log('Looking for field:', field); 
      
      const value = rowSuggestions && rowSuggestions[field];
      console.log('Suggested value:', value); 
      
      if (value !== undefined) {
        console.log('Applying fix:', { entity: error.entity, row: error.row, field, value }); 
        onApplyFix(error.entity, error.row, field, value);
        const errorKey = `${error.entity}_${error.row}_${error.column}`;
        setShowSuggestions(prev => ({ ...prev, [errorKey]: false }));
      } else {
        console.log('No suggestion found for field:', field); 
        alert('No suggestion available for this field.');
      }
    }
  };

  if (errors.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">All validations passed!</h3>
            <p className="text-sm text-green-700">Your data is ready for export.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Validation Summary</h3>
        <div className="flex space-x-4 text-sm">
          <span className={`px-2 py-1 rounded ${errorCount > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
            {errorCount} Errors
          </span>
          <span className={`px-2 py-1 rounded ${warningCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
            {warningCount} Warnings
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedErrors).map(([key, groupErrors]) => {
          const firstError = groupErrors[0];
          const severity = firstError.severity;
          
          return (
            <div
              key={key}
              className={`p-3 rounded border-l-4 ${
                severity === 'error'
                  ? 'bg-red-50 border-red-400'
                  : 'bg-yellow-50 border-yellow-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${
                    severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {firstError.type.replace(/_/g, ' ').toUpperCase()}
                    {groupErrors.length > 1 && ` (${groupErrors.length} instances)`}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {firstError.message}
                  </p>
                  
                  {groupErrors.length > 1 && (
                    <details className="mt-2">
                      <summary className={`text-xs cursor-pointer ${
                        severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        Show all instances
                      </summary>
                      <ul className="mt-1 ml-4 text-xs space-y-2">
                        {groupErrors.map((error, index) => {
                          const errorKey = `${error.entity}_${error.row}_${error.column}`;
                          const suggestion = suggestions[errorKey];
                          const showingSuggestion = showSuggestions[errorKey];
                          const isGettingSuggestionForThis = isGettingSuggestion === errorKey;

                          return (
                            <li key={index} className={`p-2 border rounded ${
                              severity === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className={severity === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                                    {error.entity && `${error.entity.charAt(0).toUpperCase()}${error.entity.slice(1)}`}
                                    {error.row !== undefined && ` Row ${error.row + 1}`}
                                    {error.column && ` - ${error.column}`}
                                    : {error.message}
                                  </div>
                                  
                                  {showingSuggestion && suggestion && error.row !== undefined && suggestion[error.row.toString()] && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                      <div className="font-medium text-blue-800">AI Suggestion:</div>
                                      <div className="text-blue-700">
                                        Change <strong>{error.column}</strong> to: 
                                        <code className="ml-1 px-1 bg-blue-100 rounded">
                                          {error.row !== undefined && error.column ? 
                                            JSON.stringify(suggestion[error.row.toString()]?.[error.column]) : 
                                            'N/A'
                                          }
                                        </code>
                                      </div>
                                      <div className="mt-2 flex space-x-2">
                                        <button
                                          onClick={() => handleApplySuggestion(error, suggestion)}
                                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                        >
                                          Apply Fix
                                        </button>
                                        <button
                                          onClick={() => setShowSuggestions(prev => ({ ...prev, [errorKey]: false }))}
                                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {error.row !== undefined && error.column && error.entity && (
                                  <button
                                    onClick={() => handleGetSuggestion(error)}
                                    disabled={isGettingSuggestionForThis}
                                    className={`ml-2 px-2 py-1 text-xs rounded ${
                                      severity === 'error'
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {isGettingSuggestionForThis ? 'Getting AI Fix...' : '🤖 AI Fix'}
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                </div>
                
                {/* Main Fix button for the group */}
                {groupErrors[0].row !== undefined && groupErrors[0].column && groupErrors[0].entity && (
                  <button
                    onClick={() => handleGetSuggestion(groupErrors[0])}
                    disabled={isGettingSuggestion !== null}
                    className={`ml-4 px-3 py-1 text-xs rounded ${
                      severity === 'error'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isGettingSuggestion === `${groupErrors[0].entity}_${groupErrors[0].row}_${groupErrors[0].column}` ? 
                      'Getting AI Fix...' : '🤖 AI Fix'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {errorCount > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">
            <strong>Note:</strong> Please fix all errors before exporting your data.
          </p>
        </div>
      )}
    </div>
  );
}