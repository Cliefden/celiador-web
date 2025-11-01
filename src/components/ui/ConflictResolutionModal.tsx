'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Archive
} from 'lucide-react';
import { offlineActivityManager } from '../../lib/offline';

interface ConflictItem {
  id: string;
  type: 'activity_mismatch' | 'version_conflict' | 'data_inconsistency';
  localData: any;
  serverData: any;
  timestamp: string;
  resolved: boolean;
  resolution?: 'local_wins' | 'server_wins' | 'merge' | 'manual';
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictItem[];
  onConflictResolved: (conflictId: string, resolution: 'local_wins' | 'server_wins' | 'merge') => Promise<void>;
}

export function ConflictResolutionModal({ 
  isOpen, 
  onClose, 
  conflicts, 
  onConflictResolved 
}: ConflictResolutionModalProps) {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [resolvingConflicts, setResolvingConflicts] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const unresolvedConflicts = conflicts.filter(c => !c.resolved);

  const toggleExpanded = (conflictId: string) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId);
    } else {
      newExpanded.add(conflictId);
    }
    setExpandedConflicts(newExpanded);
  };

  const handleResolve = async (conflict: ConflictItem, resolution: 'local_wins' | 'server_wins' | 'merge') => {
    setResolvingConflicts(prev => new Set(prev).add(conflict.id));
    
    try {
      await onConflictResolved(conflict.id, resolution);
      console.log(`✅ Resolved conflict ${conflict.id} with resolution: ${resolution}`);
    } catch (error) {
      console.error('❌ Failed to resolve conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    } finally {
      setResolvingConflicts(prev => {
        const newSet = new Set(prev);
        newSet.delete(conflict.id);
        return newSet;
      });
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'activity_mismatch':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'version_conflict':
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
      case 'data_inconsistency':
        return <Archive className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConflictDescription = (conflict: ConflictItem) => {
    switch (conflict.type) {
      case 'activity_mismatch':
        return 'Activity status differs between local and server versions';
      case 'version_conflict':
        return 'Local changes conflict with server updates';
      case 'data_inconsistency':
        return 'Data exists locally but not on server, or vice versa';
      default:
        return 'Unknown conflict type';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const formatData = (data: any) => {
    if (!data) return 'No data';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Sync Conflicts Detected</h2>
                <p className="text-orange-100 text-sm">
                  {unresolvedConflicts.length} conflict{unresolvedConflicts.length !== 1 ? 's' : ''} need{unresolvedConflicts.length === 1 ? 's' : ''} your attention
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {unresolvedConflicts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">All conflicts resolved!</h3>
              <p className="text-gray-600">Your data is now synchronized with the server.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 mb-1">What are sync conflicts?</h4>
                    <p className="text-sm text-orange-700">
                      Conflicts occur when your offline changes differ from server updates. 
                      Choose how to resolve each conflict below.
                    </p>
                  </div>
                </div>
              </div>

              {unresolvedConflicts.map((conflict) => {
                const isExpanded = expandedConflicts.has(conflict.id);
                const isResolving = resolvingConflicts.has(conflict.id);

                return (
                  <div key={conflict.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Conflict Header */}
                    <div className="bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getConflictIcon(conflict.type)}
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {conflict.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h4>
                            <p className="text-sm text-gray-600">{getConflictDescription(conflict)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Detected {formatTimestamp(conflict.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleExpanded(conflict.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Conflict Details */}
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          {/* Local Version */}
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span>Your Version (Local)</span>
                            </h5>
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-32">
                                {formatData(conflict.localData)}
                              </pre>
                            </div>
                          </div>

                          {/* Server Version */}
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span>Server Version</span>
                            </h5>
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-32">
                                {formatData(conflict.serverData)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Resolution Options */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-800 mb-3">Choose Resolution:</h5>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleResolve(conflict, 'local_wins')}
                              disabled={isResolving}
                              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isResolving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                              )}
                              <span>Keep My Version</span>
                            </button>

                            <button
                              onClick={() => handleResolve(conflict, 'server_wins')}
                              disabled={isResolving}
                              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isResolving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                              )}
                              <span>Use Server Version</span>
                            </button>

                            <button
                              onClick={() => handleResolve(conflict, 'merge')}
                              disabled={isResolving}
                              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isResolving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              <span>Merge Both</span>
                            </button>
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-600 space-y-1">
                            <p><strong>Keep My Version:</strong> Your local changes will be preserved</p>
                            <p><strong>Use Server Version:</strong> Server data will overwrite local changes</p>
                            <p><strong>Merge Both:</strong> Attempt to combine both versions intelligently</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {unresolvedConflicts.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                Conflicts must be resolved before syncing can continue
              </p>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}