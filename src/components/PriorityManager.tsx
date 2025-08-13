'use client';

import { useState } from 'react';
import { Priority } from '@/types';

interface PriorityManagerProps {
  priorities: Priority[];
  onPrioritiesChange: (priorities: Priority[]) => void;
}

const defaultPriorities: Priority[] = [
  { name: 'Client Priority Level', weight: 30, description: 'Higher priority clients get preference' },
  { name: 'Task Duration', weight: 20, description: 'Shorter tasks may be prioritized' },
  { name: 'Worker Qualification', weight: 25, description: 'Higher qualified workers for complex tasks' },
  { name: 'Phase Preference', weight: 15, description: 'Tasks running in preferred phases' },
  { name: 'Load Distribution', weight: 10, description: 'Even distribution across workers' }
];

export default function PriorityManager({ priorities, onPrioritiesChange }: PriorityManagerProps) {
  const [activePreset, setActivePreset] = useState<string>('custom');

  
  if (priorities.length === 0) {
    onPrioritiesChange(defaultPriorities);
  }

  const presets = {
    'maximize-fulfillment': [
      { name: 'Client Priority Level', weight: 40, description: 'Higher priority clients get preference' },
      { name: 'Task Duration', weight: 30, description: 'Complete more tasks quickly' },
      { name: 'Worker Qualification', weight: 20, description: 'Match skills efficiently' },
      { name: 'Phase Preference', weight: 10, description: 'Phase timing consideration' },
      { name: 'Load Distribution', weight: 0, description: 'Fairness not prioritized' }
    ],
    'fair-distribution': [
      { name: 'Load Distribution', weight: 40, description: 'Even workload across all workers' },
      { name: 'Worker Qualification', weight: 20, description: 'Balanced skill utilization' },
      { name: 'Client Priority Level', weight: 20, description: 'Some priority consideration' },
      { name: 'Task Duration', weight: 10, description: 'Minor duration consideration' },
      { name: 'Phase Preference', weight: 10, description: 'Minor phase consideration' }
    ],
    'minimize-workload': [
      { name: 'Load Distribution', weight: 35, description: 'Minimize total workload' },
      { name: 'Task Duration', weight: 30, description: 'Prefer shorter tasks' },
      { name: 'Worker Qualification', weight: 15, description: 'Efficient skill matching' },
      { name: 'Phase Preference', weight: 15, description: 'Optimize phase scheduling' },
      { name: 'Client Priority Level', weight: 5, description: 'Lower priority consideration' }
    ]
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    const newPriorities = [...priorities];
    newPriorities[index].weight = Math.max(0, Math.min(100, newWeight));
    onPrioritiesChange(newPriorities);
    setActivePreset('custom');
  };

  const applyPreset = (presetName: string) => {
    if (presets[presetName as keyof typeof presets]) {
      onPrioritiesChange(presets[presetName as keyof typeof presets]);
      setActivePreset(presetName);
    }
  };

  const normalizeWeights = () => {
    const total = priorities.reduce((sum, p) => sum + p.weight, 0);
    if (total === 0) return;
    
    const normalized = priorities.map(p => ({
      ...p,
      weight: Math.round((p.weight / total) * 100)
    }));
    onPrioritiesChange(normalized);
  };

  const totalWeight = priorities.reduce((sum, p) => sum + p.weight, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Priority & Weight Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure how the resource allocator should prioritize different criteria. 
          Higher weights mean higher importance.
        </p>
      </div>

      {/* Presets */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          {Object.keys(presets).map(presetKey => (
            <button
              key={presetKey}
              onClick={() => applyPreset(presetKey)}
              className={`px-3 py-1 text-xs rounded border ${
                activePreset === presetKey
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {presetKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
          <button
            onClick={normalizeWeights}
            className="px-3 py-1 text-xs rounded border bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
          >
            Normalize to 100%
          </button>
        </div>
      </div>

      {/* Weight Configuration */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700">Criteria Weights</h4>
          <span className={`text-sm px-2 py-1 rounded ${
            Math.abs(totalWeight - 100) < 5
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            Total: {totalWeight}%
          </span>
        </div>

        {priorities.map((priority, index) => (
          <div key={priority.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                {priority.name}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={priority.weight}
                  onChange={(e) => handleWeightChange(index, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            
            {/* Visual slider */}
            <div className="flex items-center space-x-2">
              <input
                type="range"
                value={priority.weight}
                onChange={(e) => handleWeightChange(index, parseInt(e.target.value))}
                className="flex-1"
                min="0"
                max="100"
                step="5"
              />
            </div>
            
            <p className="text-xs text-gray-600">{priority.description}</p>
            
            {/* Visual weight bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(priority.weight, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Weight Distribution Visualization */}
      {totalWeight > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Weight Distribution</h4>
          <div className="flex w-full h-4 rounded-full overflow-hidden bg-gray-200">
            {priorities.map((priority, index) => {
              const percentage = (priority.weight / totalWeight) * 100;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
              
              return percentage > 0 ? (
                <div
                  key={index}
                  className={`${colors[index % colors.length]} transition-all duration-200`}
                  style={{ width: `${percentage}%` }}
                  title={`${priority.name}: ${priority.weight}% (${percentage.toFixed(1)}% of total)`}
                ></div>
              ) : null;
            })}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {priorities.map((priority, index) => {
              const percentage = totalWeight > 0 ? (priority.weight / totalWeight) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${colors[index % colors.length]}`}></div>
                  <span className="text-gray-700">
                    {priority.name}: {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Math.abs(totalWeight - 100) > 10 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> Total weight is {totalWeight}%. 
            Consider normalizing to 100% for optimal allocation results.
          </p>
        </div>
      )}
    </div>
  );
}