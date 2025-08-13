'use client';

import { useState } from 'react';
import { EntityType, ValidationError } from '@/types';

interface DataGridProps {
  data: any[];
  entityType: EntityType;
  onDataChange: (data: any[]) => void;
  validationErrors: ValidationError[];
}

export default function DataGrid({ data, entityType, onDataChange, validationErrors }: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  if (data.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-500">No data available. Please upload a file.</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  const getErrorsForCell = (rowIndex: number, column: string) => {
    return validationErrors.filter(
      error => error.row === rowIndex && error.column === column && error.entity === entityType
    );
  };

  const hasErrorsForCell = (rowIndex: number, column: string) => {
    return getErrorsForCell(rowIndex, column).length > 0;
  };

  const handleCellClick = (rowIndex: number, column: string) => {
    setEditingCell({ row: rowIndex, column });
    setEditValue(String(data[rowIndex][column] || ''));
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const newData = [...data];
    newData[editingCell.row][editingCell.column] = editValue;
    onDataChange(newData);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold capitalize">{entityType} Data</h3>
        <p className="text-sm text-gray-600">{data.length} rows</p>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column) => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.column === column;
                  const hasError = hasErrorsForCell(rowIndex, column);
                  const errors = getErrorsForCell(rowIndex, column);

                  return (
                    <td
                      key={column}
                      className={`px-4 py-2 text-sm border-r cursor-pointer relative ${
                        hasError 
                          ? errors.some(e => e.severity === 'error') 
                            ? 'bg-red-100 border-red-300 text-black' 
                            : 'bg-yellow-100 border-yellow-300 text-black'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => !isEditing && handleCellClick(rowIndex, column)}
                      title={hasError ? errors.map(e => e.message).join(', ') : ''}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className={hasError ? 'text-red-700' : 'text-gray-900'}>
                          {String(row[column] || '')}
                        </span>
                      )}
                      {hasError && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full transform translate-x-1 -translate-y-1"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCell && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <p>Editing: Row {editingCell.row + 1}, Column {editingCell.column}</p>
          <p>Press Enter to save, Escape to cancel</p>
        </div>
      )}
    </div>
  );
}