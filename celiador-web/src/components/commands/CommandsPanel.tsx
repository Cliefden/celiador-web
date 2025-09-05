'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { 
  Send, 
  Mic, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Terminal,
  MessageCircle,
  Filter
} from 'lucide-react';
// Local types for commands
interface ProjectCommand {
  id: string;
  project_id: string;
  command_text: string;
  command_type: string;
  status: string;
  response?: string;
  created_at: string;
  updated_at: string;
}

interface CommandsPanelProps {
  projectId: string;
  className?: string;
  onCommandToConversation?: (commandText: string, commandType: 'text' | 'voice' | 'generated', commandId?: string) => void;
}

export function CommandsPanel({ projectId, className = '', onCommandToConversation }: CommandsPanelProps) {
  const [commands, setCommands] = useState<ProjectCommand[]>([]);
  const [commandText, setCommandText] = useState('');
  const [isSubmittingCommand, setIsSubmittingCommand] = useState(false);
  const [commandFilter, setCommandFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  
  console.log('CommandsPanel: onCommandToConversation callback present:', !!onCommandToConversation);

  // Fetch project commands
  const fetchCommands = async () => {
    try {
      console.log('CommandsPanel: Fetching commands for project:', projectId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('CommandsPanel: No session available');
        return;
      }

      console.log('CommandsPanel: Making API call...');
      const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${orchestratorUrl}/api/projects/${projectId}/commands`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('CommandsPanel: API response status:', response.status);
      if (response.ok) {
        const responseData = await response.json();
        console.log('CommandsPanel: API response data:', responseData);
        const { commands: commandsData } = responseData;
        setCommands(commandsData || []);
      } else {
        const errorText = await response.text();
        console.error('CommandsPanel: API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    }
  };

  // Submit a new command
  const submitCommand = async () => {
    if (!commandText.trim() || isSubmittingCommand) return;

    setIsSubmittingCommand(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${orchestratorUrl}/api/projects/${projectId}/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          command_text: commandText.trim(),
          command_type: 'text',
          status: 'pending'
        })
      });

      if (response.ok) {
        setCommandText('');
        fetchCommands(); // Refresh commands
      }
    } catch (error) {
      console.error('Failed to submit command:', error);
    } finally {
      setIsSubmittingCommand(false);
    }
  };

  // Mark command as completed
  const markCommandCompleted = async (commandId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${orchestratorUrl}/api/projects/${projectId}/commands`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          commandId,
          status: 'completed',
          response: 'Marked as completed'
        })
      });

      if (response.ok) {
        fetchCommands(); // Refresh commands
      }
    } catch (error) {
      console.error('Failed to mark command as completed:', error);
    }
  };

  // Fetch commands on mount and when project changes
  useEffect(() => {
    if (!projectId) return;
    
    // Register refresh function globally
    (window as any).globalCommandsRefresh = fetchCommands;
    
    fetchCommands();
    
    // Set up real-time subscription for commands
    const channel = supabase
      .channel(`project_commands:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_commands',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Command update:', payload);
          // Refresh commands when there are changes
          fetchCommands();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  // Filter commands based on selected filter
  const filteredCommands = commands.filter(command => {
    if (commandFilter === 'all') return true;
    return command.status === commandFilter;
  });

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Command Input */}
      <div className="p-4 border-b bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && submitCommand()}
            disabled={isSubmittingCommand}
          />
          <Button
            onClick={submitCommand}
            disabled={!commandText.trim() || isSubmittingCommand}
            size="sm"
            className="px-3 py-2"
          >
            {isSubmittingCommand ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Menu */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={commandFilter}
            onChange={(e) => setCommandFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="all">All Commands ({commands.length})</option>
            <option value="pending">Pending ({commands.filter(c => c.status === 'pending').length})</option>
            <option value="processing">Processing ({commands.filter(c => c.status === 'processing').length})</option>
            <option value="completed">Completed ({commands.filter(c => c.status === 'completed').length})</option>
            <option value="failed">Failed ({commands.filter(c => c.status === 'failed').length})</option>
          </select>
        </div>
      </div>

      {/* Commands List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredCommands.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Terminal className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">
                {commandFilter === 'all' ? 'No commands yet' : `No ${commandFilter} commands`}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {commandFilter === 'all' 
                  ? 'Type a command above or use voice commands from your iOS app'
                  : `Try changing the filter to see other commands`
                }
              </p>
            </div>
          </div>
        ) : (
          (() => {
            console.log('CommandsPanel: Rendering', filteredCommands.length, 'filtered commands, callback present:', !!onCommandToConversation);
            return filteredCommands.map((command) => (
            <div
              key={command.id}
              className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium break-words">
                    {command.command_text}
                  </p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(command.created_at).toLocaleString()}
                    </span>
                    <div className="flex items-center space-x-1">
                      {command.command_type === 'voice' && (
                        <Mic className="w-3 h-3 text-blue-500" />
                      )}
                      <span className="text-xs text-gray-400 capitalize">
                        {command.command_type}
                      </span>
                    </div>
                  </div>
                  {command.response && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <strong>Response:</strong> {command.response}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  {onCommandToConversation && command.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('CommandsPanel: Button clicked for command:', command.command_text);
                        onCommandToConversation?.(command.command_text, command.command_type as 'text' | 'voice' | 'generated', command.id);
                      }}
                      className="px-3 py-1 h-8 bg-blue-500 hover:bg-blue-600 border-blue-500 text-white text-xs font-medium"
                      title="Add to conversation"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  )}
                  {command.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markCommandCompleted(command.id)}
                      className="px-3 py-1 h-8 bg-green-500 hover:bg-green-600 border-green-500 text-white text-xs font-medium"
                      title="Mark as completed"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                  )}
                  {getStatusIcon(command.status)}
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(command.status)}`}
                  />
                </div>
              </div>
            </div>
            ))
          })()
        )}
      </div>
    </div>
  );
}