'use client';

import { useState, useEffect } from 'react';
import { Client, Worker, Task, Rule, Priority, ValidationError, EntityType } from '@/types';
import { dataService } from '@/lib/dataService';
import { validationService } from '@/lib/validation';
import { aiService } from '@/lib/ai';
import DataGrid from '@/components/DataGrid';
import ValidationSummary from '@/components/ValidationSummary';
import RuleBuilder from '@/components/RuleBuilder';
import PriorityManager from '@/components/PriorityManager';
import SearchComponent from '@/components/SearchComponent';
import ApiKeyManager from '@/components/ApiKeyManager';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'data' | 'rules' | 'priorities' | 'settings'>('data');
  const [activeDataTab, setActiveDataTab] = useState<EntityType>('clients');
  
  // API Key Management
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // UI states
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchResults, setSearchResults] = useState<{ [key in EntityType]?: any[] }>({});

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    console.log('Loading API key from localStorage:', savedApiKey ? 'Found' : 'Not found'); // Debug log
    if (savedApiKey) {
      setApiKey(savedApiKey);
      aiService.initializeWithKey(savedApiKey);
      console.log('AI service initialized with saved key'); // Debug log
    } else {
      // Try to use environment variable
      const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      console.log('Checking environment API key:', envApiKey ? 'Found' : 'Not found'); // Debug log
      if (envApiKey) {
        setApiKey(envApiKey);
        aiService.initializeWithKey(envApiKey);
        console.log('AI service initialized with env key'); // Debug log
      }
    }
  }, []);

  // Load sample data on mount
  useEffect(() => {
    const sampleData = dataService.generateSampleData();
    setClients(sampleData.clients);
    setWorkers(sampleData.workers);
    setTasks(sampleData.tasks);
  }, []);

  // Run validation when data changes
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      const errors = validationService.validateAll(clients, workers, tasks);
      setValidationErrors(errors);
    }
  }, [clients, workers, tasks]);

  const handleApiKeySet = (newApiKey: string) => {
    if (newApiKey) {
      localStorage.setItem('gemini_api_key', newApiKey);
      setApiKey(newApiKey);
      aiService.initializeWithKey(newApiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
      setApiKey(null);
      aiService.initializeWithKey('');
    }
    setShowApiKeyModal(false);
  };

  const handleAIFeatureError = (featureName: string, error: any) => {
    if (error.message?.includes('requires a valid Gemini API key')) {
      alert(`${featureName} requires a Gemini API key. Please configure your API key in the Settings tab.`);
      setActiveTab('settings');
    } else {
      alert(`Error in ${featureName}: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (file: File, entityType: EntityType) => {
    setIsUploading(true);
    try {
      const parsedData = await dataService.parseFile(file, entityType);
      
      switch (entityType) {
        case 'clients':
          setClients(parsedData as Client[]);
          break;
        case 'workers':
          setWorkers(parsedData as Worker[]);
          break;
        case 'tasks':
          setTasks(parsedData as Task[]);
          break;
      }
      
      // Clear search results for this entity
      setSearchResults(prev => ({ ...prev, [entityType]: undefined }));
    } catch (error: any) {
      if (error.message?.includes('requires a valid Gemini API key')) {
        handleAIFeatureError('Intelligent Header Mapping', error);
      } else {
        alert(`Error uploading ${entityType}: ${error.message || error}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDataChange = (newData: any[], entityType: EntityType) => {
    switch (entityType) {
      case 'clients':
        setClients(newData as Client[]);
        break;
      case 'workers':
        setWorkers(newData as Worker[]);
        break;
      case 'tasks':
        setTasks(newData as Task[]);
        break;
    }
  };

  const handleSearch = (results: any[], entityType: EntityType, error?: any) => {
    if (error && error.message?.includes('requires a valid Gemini API key')) {
      handleAIFeatureError('Natural Language Search', error);
      return;
    }
    setSearchResults(prev => ({ ...prev, [entityType]: results }));
  };

  const clearSearch = (entityType: EntityType) => {
    setSearchResults(prev => ({ ...prev, [entityType]: undefined }));
  };

  const handleApplyFix = (entityType: string, rowIndex: number, field: string, newValue: any) => {
    let newData: any[];
    if (entityType === 'clients') {
      newData = [...clients];
      (newData[rowIndex] as any)[field] = newValue;
      setClients(newData);
    } else if (entityType === 'workers') {
      newData = [...workers];
      (newData[rowIndex] as any)[field] = newValue;
      setWorkers(newData);
    } else if (entityType === 'tasks') {
      newData = [...tasks];
      (newData[rowIndex] as any)[field] = newValue;
      setTasks(newData);
    }
  };

  const getCurrentData = (entityType: EntityType) => {
    const baseData = entityType === 'clients' ? clients : entityType === 'workers' ? workers : tasks;
    return searchResults[entityType] || baseData;
  };

  const canExport = () => {
    const hasData = clients.length > 0 && workers.length > 0 && tasks.length > 0;
    const hasNoErrors = validationErrors.filter(e => e.severity === 'error').length === 0;
    return hasData && hasNoErrors;
  };

  const handleExport = () => {
    if (!canExport()) {
      alert('Please fix all validation errors before exporting.');
      return;
    }

    // Export data files
    dataService.exportToCSV(clients, 'clients.csv');
    dataService.exportToCSV(workers, 'workers.csv');
    dataService.exportToCSV(tasks, 'tasks.csv');
    
    // Export rules configuration
    dataService.exportRulesToJSON(rules, priorities);
    
    alert('Files exported successfully! Check your downloads folder.');
  };

  const FileUploadSection = ({ entityType }: { entityType: EntityType }) => (
    <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 capitalize">{entityType} Data</h3>
          <p className="text-xs text-gray-500">Upload CSV or XLSX file</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
            <span>Upload File</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, entityType);
              }}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          <span className="text-xs text-gray-600">
            {getCurrentData(entityType).length} rows
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🚀 Data Alchemist</h1>
          <p className="text-gray-600 mt-2">AI-Enabled Resource Allocation Configurator</p>
        </div>

        {/* Main Navigation */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'data', label: 'Data Management', icon: '📊' },
              { key: 'rules', label: 'Business Rules', icon: '⚙️' },
              { key: 'priorities', label: 'Prioritization', icon: '📈' },
              { key: 'settings', label: 'Settings', icon: '🔧' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.key === 'settings' && !apiKey && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    ⚠️
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            {/* Entity Tabs */}
            <div className="border-b">
              <nav className="flex space-x-8">
                {(['clients', 'workers', 'tasks'] as EntityType[]).map((entityType) => (
                  <button
                    key={entityType}
                    onClick={() => setActiveDataTab(entityType)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeDataTab === entityType
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {entityType} ({getCurrentData(entityType).length})
                  </button>
                ))}
              </nav>
            </div>

            {/* File Upload */}
            <FileUploadSection entityType={activeDataTab} />

            {/* Search */}
            <SearchComponent
              onSearch={(results: any[]) => handleSearch(results, activeDataTab)}
              data={activeDataTab === 'clients' ? clients : activeDataTab === 'workers' ? workers : tasks}
              entityType={activeDataTab}
              onClearSearch={() => clearSearch(activeDataTab)}
              onError={(error) => handleAIFeatureError('Natural Language Search', error)}
            />

            {/* Data Grid */}
            <DataGrid
              data={getCurrentData(activeDataTab)}
              entityType={activeDataTab}
              onDataChange={(newData) => handleDataChange(newData, activeDataTab)}
              validationErrors={validationErrors}
            />

            {/* Validation Summary */}
            <ValidationSummary 
              errors={validationErrors} 
              data={{ clients, workers, tasks }}
              onApplyFix={handleApplyFix}
              onAIError={(error) => handleAIFeatureError('AI Correction Suggestions', error)}
            />
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <RuleBuilder
              rules={rules}
              onRulesChange={setRules}
              clients={clients}
              workers={workers}
              tasks={tasks}
              onAIError={(error) => handleAIFeatureError('Natural Language Rule Conversion', error)}
            />
          </div>
        )}

        {/* Priorities Tab */}
        {activeTab === 'priorities' && (
          <div className="space-y-6">
            <PriorityManager
              priorities={priorities}
              onPrioritiesChange={setPriorities}
            />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">🔧 API Configuration</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Google Gemini API Key</h4>
                    <p className="text-sm text-gray-600">
                      {apiKey ? 'API key is configured and AI features are enabled' : 'API key not configured - AI features disabled'}
                    </p>
                    {apiKey && (
                      <p className="text-xs text-gray-500 mt-1">
                        Key: {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded text-sm ${
                      apiKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {apiKey ? '✅ Configured' : '❌ Not Set'}
                    </span>
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      {apiKey ? 'Update' : 'Configure'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">✅ Available Features</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• File upload and data management</li>
                      <li>• Manual data validation</li>
                      <li>• UI-based rule builder</li>
                      <li>• Priority management</li>
                      <li>• Data export</li>
                      <li>• Basic text search</li>
                    </ul>
                  </div>

                  <div className={`p-4 border rounded-lg ${apiKey ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h5 className={`font-medium mb-2 ${apiKey ? 'text-green-800' : 'text-red-800'}`}>
                      {apiKey ? '🤖 AI Features Enabled' : '🤖 AI Features (Requires API Key)'}
                    </h5>
                    <ul className={`text-sm space-y-1 ${apiKey ? 'text-green-700' : 'text-red-700'}`}>
                      <li>• Intelligent header mapping</li>
                      <li>• Natural language search</li>
                      <li>• AI-powered validation suggestions</li>
                      <li>• Convert natural language to rules</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">📖 How to get your API key:</h5>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google AI Studio</a></li>
                    <li>Sign in with your Google account</li>
                    <li>Click "Create API Key"</li>
                    <li>Copy the key and paste it in the configuration above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div className="mt-12 p-6 bg-white rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Export Configuration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Download cleaned data and rules configuration
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs">
                <span className={`px-2 py-1 rounded ${
                  validationErrors.filter(e => e.severity === 'error').length === 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validationErrors.filter(e => e.severity === 'error').length} Errors
                </span>
                <span className="text-gray-600">
                  {rules.length} Rules • {priorities.filter(p => p.weight > 0).length} Priorities
                </span>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={!canExport()}
              className={`px-6 py-2 rounded-md font-medium ${
                canExport()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Export All Files
            </button>
          </div>
          
          {!canExport() && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              Please fix all validation errors and ensure you have data in all three categories before exporting.
            </div>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyManager
          onApiKeySet={handleApiKeySet}
          currentApiKey={apiKey}
        />
      )}
    </div>
  );
}