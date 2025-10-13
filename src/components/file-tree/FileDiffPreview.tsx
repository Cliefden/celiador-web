'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Check, X, Eye, AlertTriangle } from 'lucide-react';

interface FileOperation {
  type: 'create_file' | 'update_file' | 'delete_file';
  path: string;
  content?: string;
  oldContent?: string;
}

interface FileDiffPreviewProps {
  operations: FileOperation[];
  projectId: string;
  onApprove: () => void;
  onReject: () => void;
  className?: string;
}

function DiffLine({ 
  line, 
  type, 
  lineNumber 
}: { 
  line: string; 
  type: 'added' | 'removed' | 'unchanged'; 
  lineNumber?: number;
}) {
  return (
    <div className={clsx(
      'flex font-mono text-sm',
      type === 'added' && 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      type === 'removed' && 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      type === 'unchanged' && 'bg-gray-50 dark:bg-gray-800/50'
    )}>
      <span className={clsx(
        'w-6 text-center text-xs opacity-50 mr-2 border-r',
        type === 'added' && 'border-green-200 dark:border-green-700',
        type === 'removed' && 'border-red-200 dark:border-red-700',
        type === 'unchanged' && 'border-gray-300 dark:border-gray-600'
      )}>
        {type === 'added' && '+'}
        {type === 'removed' && '-'}
        {type === 'unchanged' && lineNumber}
      </span>
      <span className="flex-1 px-2 py-1 whitespace-pre-wrap break-all">
        {line || ' '}
      </span>
    </div>
  );
}

function FileDiff({ operation }: { operation: FileOperation }) {
  const [diff, setDiff] = useState<Array<{
    line: string;
    type: 'added' | 'removed' | 'unchanged';
    lineNumber?: number;
  }>>([]);

  useEffect(() => {
    generateDiff();
  }, [operation]);

  const generateDiff = () => {
    if (operation.type === 'create_file') {
      const lines = (operation.content || '').split('\n');
      setDiff(lines.map((line, index) => ({
        line,
        type: 'added' as const,
        lineNumber: index + 1
      })));
    } else if (operation.type === 'delete_file') {
      const lines = (operation.oldContent || '').split('\n');
      setDiff(lines.map((line, index) => ({
        line,
        type: 'removed' as const,
        lineNumber: index + 1
      })));
    } else if (operation.type === 'update_file') {
      // Simple line-by-line diff
      const oldLines = (operation.oldContent || '').split('\n');
      const newLines = (operation.content || '').split('\n');
      const maxLines = Math.max(oldLines.length, newLines.length);
      
      const diffLines: Array<{
        line: string;
        type: 'added' | 'removed' | 'unchanged';
        lineNumber?: number;
      }> = [];

      for (let i = 0; i < maxLines; i++) {
        const oldLine = oldLines[i];
        const newLine = newLines[i];

        if (oldLine === newLine) {
          // Unchanged line
          if (oldLine !== undefined) {
            diffLines.push({
              line: oldLine,
              type: 'unchanged',
              lineNumber: i + 1
            });
          }
        } else {
          // Changed line
          if (oldLine !== undefined) {
            diffLines.push({
              line: oldLine,
              type: 'removed',
              lineNumber: i + 1
            });
          }
          if (newLine !== undefined) {
            diffLines.push({
              line: newLine,
              type: 'added',
              lineNumber: i + 1
            });
          }
        }
      }

      setDiff(diffLines);
    }
  };

  const getOperationIcon = () => {
    switch (operation.type) {
      case 'create_file': return '➕';
      case 'update_file': return '✏️';
      case 'delete_file': return '🗑️';
      default: return '📝';
    }
  };

  const getOperationLabel = () => {
    switch (operation.type) {
      case 'create_file': return 'Create';
      case 'update_file': return 'Update';
      case 'delete_file': return 'Delete';
      default: return 'Modify';
    }
  };

  const getOperationColor = () => {
    switch (operation.type) {
      case 'create_file': return 'text-green-600 dark:text-green-400';
      case 'update_file': return 'text-blue-600 dark:text-blue-400';
      case 'delete_file': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getOperationIcon()}</span>
          <span className={clsx('font-medium', getOperationColor())}>
            {getOperationLabel()}
          </span>
          <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {operation.path}
          </code>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {diff.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No content to preview
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {diff.map((line, index) => (
              <DiffLine
                key={index}
                line={line.line}
                type={line.type}
                lineNumber={line.lineNumber}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FileDiffPreview({ 
  operations, 
  projectId, 
  onApprove, 
  onReject,
  className 
}: FileDiffPreviewProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpanded(newExpanded);
  };

  if (operations.length === 0) {
    return null;
  }

  const createCount = operations.filter(op => op.type === 'create_file').length;
  const updateCount = operations.filter(op => op.type === 'update_file').length;
  const deleteCount = operations.filter(op => op.type === 'delete_file').length;

  return (
    <div className={clsx('bg-white dark:bg-gray-900 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-orange-200 dark:border-orange-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <div>
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
              File Changes Preview
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Review {operations.length} file operation{operations.length !== 1 ? 's' : ''} before applying
            </p>
          </div>
        </div>
        
        {/* Summary */}
        <div className="flex gap-4 mt-3 text-sm">
          {createCount > 0 && (
            <span className="text-green-600 dark:text-green-400">
              +{createCount} created
            </span>
          )}
          {updateCount > 0 && (
            <span className="text-blue-600 dark:text-blue-400">
              ~{updateCount} modified
            </span>
          )}
          {deleteCount > 0 && (
            <span className="text-red-600 dark:text-red-400">
              -{deleteCount} deleted
            </span>
          )}
        </div>
      </div>

      {/* Operations List */}
      <div className="p-6 space-y-4">
        {operations.map((operation, index) => (
          <div key={index}>
            <button
              onClick={() => toggleExpanded(index)}
              className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">{operation.path}</span>
                  <span className={clsx(
                    'text-xs px-2 py-1 rounded-full',
                    operation.type === 'create_file' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                    operation.type === 'update_file' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                    operation.type === 'delete_file' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  )}>
                    {operation.type.replace('_', ' ')}
                  </span>
                </div>
                <span className={clsx(
                  'text-sm transition-transform',
                  expanded.has(index) && 'rotate-90'
                )}>
                  ▶
                </span>
              </div>
            </button>

            {expanded.has(index) && (
              <div className="mt-2">
                <FileDiff operation={operation} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}