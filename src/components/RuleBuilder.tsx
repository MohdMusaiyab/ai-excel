'use client';

import { useState } from 'react';
import { Rule, Client, Worker, Task } from '@/types';
import { aiService } from '@/lib/ai';

interface RuleBuilderProps {
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onAIError?: (error: any) => void;
}

export default function RuleBuilder({ rules, onRulesChange, clients, workers, tasks, onAIError }: RuleBuilderProps) {
  const [activeTab, setActiveTab] = useState<'ui' | 'natural'>('ui');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // UI Rule Builder State
  const [ruleType, setRuleType] = useState<Rule['type']>('coRun');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [ruleParameters, setRuleParameters] = useState<any>({});

  const addRule = (rule: Rule) => {
    onRulesChange([...rules, rule]);
  };

  const removeRule = (ruleId: string) => {
    onRulesChange(rules.filter(r => r.id !== ruleId));
  };

  const handleUIRuleSubmit = () => {
    let rule: Rule;
    const id = `rule_${Date.now()}`;

    switch (ruleType) {
      case 'coRun':
        rule = {
          id,
          type: 'coRun',
          name: `Co-run Tasks: ${selectedTasks.join(', ')}`,
          parameters: { tasks: selectedTasks },
          description: `Tasks ${selectedTasks.join(', ')} must run together`
        };
        break;
      case 'loadLimit':
        rule = {
          id,
          type: 'loadLimit',
          name: `Load Limit: ${ruleParameters.workerGroup}`,
          parameters: { 
            workerGroup: ruleParameters.workerGroup,
            maxSlotsPerPhase: ruleParameters.maxSlotsPerPhase 
          },
          description: `Workers in ${ruleParameters.workerGroup} group limited to ${ruleParameters.maxSlotsPerPhase} slots per phase`
        };
        break;
      case 'phaseWindow':
        rule = {
          id,
          type: 'phaseWindow',
          name: `Phase Window: ${ruleParameters.taskId}`,
          parameters: { 
            taskId: ruleParameters.taskId,
            allowedPhases: ruleParameters.allowedPhases 
          },
          description: `Task ${ruleParameters.taskId} can only run in phases ${ruleParameters.allowedPhases}`
        };
        break;
      default:
        return;
    }

    addRule(rule);
    
    
    setSelectedTasks([]);
    setSelectedWorkers([]);
    setRuleParameters({});
  };

  const handleNaturalLanguageSubmit = async () => {
    if (!naturalLanguageInput.trim()) return;
    
    setIsProcessing(true);
    try {
      const rule = await aiService.convertToRule(naturalLanguageInput, { clients, workers, tasks });
      if (rule) {
        addRule(rule);
        setNaturalLanguageInput('');
      } else {
        alert('Could not convert the rule. Please try rephrasing or use the UI builder.');
      }
    } catch (error) {
      console.error('Error processing natural language rule:', error);
      
      
      if (error instanceof Error && error.message?.includes('requires a valid Gemini API key')) {
        if (onAIError) {
          onAIError(error);
          return;
        }
      }
      
      alert('Error processing rule. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('ui')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ui'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            UI Rule Builder
          </button>
          <button
            onClick={() => setActiveTab('natural')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'natural'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Natural Language
          </button>
        </nav>
      </div>

      {activeTab === 'ui' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rule Type</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as Rule['type'])}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="coRun">Co-run Tasks</option>
              <option value="loadLimit">Load Limit</option>
              <option value="phaseWindow">Phase Window</option>
            </select>
          </div>

          {ruleType === 'coRun' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Tasks to Co-run</label>
              <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {tasks.map(task => (
                  <label key={task.TaskID} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.TaskID)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks([...selectedTasks, task.TaskID]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task.TaskID));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{task.TaskID} - {task.TaskName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {ruleType === 'loadLimit' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Worker Group</label>
                <input
                  type="text"
                  value={ruleParameters.workerGroup || ''}
                  onChange={(e) => setRuleParameters({ ...ruleParameters, workerGroup: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Frontend, Backend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Slots Per Phase</label>
                <input
                  type="number"
                  value={ruleParameters.maxSlotsPerPhase || ''}
                  onChange={(e) => setRuleParameters({ ...ruleParameters, maxSlotsPerPhase: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>
          )}

          {ruleType === 'phaseWindow' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task ID</label>
                <select
                  value={ruleParameters.taskId || ''}
                  onChange={(e) => setRuleParameters({ ...ruleParameters, taskId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a task</option>
                  {tasks.map(task => (
                    <option key={task.TaskID} value={task.TaskID}>
                      {task.TaskID} - {task.TaskName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Allowed Phases (comma-separated)</label>
                <input
                  type="text"
                  value={ruleParameters.allowedPhases || ''}
                  onChange={(e) => setRuleParameters({ ...ruleParameters, allowedPhases: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1,2,3"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUIRuleSubmit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Rule
          </button>
        </div>
      )}

      {activeTab === 'natural' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Describe your rule in plain English</label>
            <textarea
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="e.g., Tasks T001 and T002 should always run together, or Workers in Frontend group should not exceed 2 tasks per phase"
            />
          </div>

          <button
            onClick={handleNaturalLanguageSubmit}
            disabled={isProcessing || !naturalLanguageInput.trim()}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Convert to Rule'}
          </button>

          <div className="text-xs text-gray-600">
            <p><strong>Examples:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>&quot;Tasks T001 and T002 must run together&quot;</li>
              <li>&quot;Frontend workers cannot work more than 2 tasks per phase&quot;</li>
              <li>&quot;Task T003 can only run in phases 1, 2, and 3&quot;</li>
            </ul>
          </div>
        </div>
      )}

      {/* Current Rules */}
      {rules.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Current Rules ({rules.length})</h4>
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div>
                  <h5 className="font-medium text-sm text-gray-900">{rule.name}</h5>
                  <p className="text-xs text-gray-600">{rule.description}</p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {rule.type}
                  </span>
                </div>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}