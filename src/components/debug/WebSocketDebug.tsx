'use client';

import { useState, useEffect } from 'react';
import { useWebSocketChannel } from '../../lib/websocket';

interface DebugMessage {
  timestamp: string;
  type: string;
  channel?: string;
  data: any;
}

export function WebSocketDebug() {
  const [messages, setMessages] = useState<DebugMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { subscribe, isConnected, connectionState } = useWebSocketChannel();

  useEffect(() => {
    if (!isConnected) return;

    console.log('🐛 [WebSocketDebug] Setting up debug listeners...');

    // Subscribe to all channels to see what messages are coming through
    const unsubscribeJobs = subscribe({
      channel: 'jobs',
      onMessage: (message) => {
        console.log('🐛 [WebSocketDebug] Jobs channel message:', message);
        setMessages(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          type: message.type || 'unknown',
          channel: 'jobs',
          data: message
        }, ...prev.slice(0, 19)]);
      },
      onError: (error) => console.error('🐛 [WebSocketDebug] Jobs channel error:', error),
      enabled: true
    });

    const unsubscribeSystem = subscribe({
      channel: 'system_notifications',
      onMessage: (message) => {
        console.log('🐛 [WebSocketDebug] System channel message:', message);
        setMessages(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          type: message.type || 'unknown',
          channel: 'system_notifications',
          data: message
        }, ...prev.slice(0, 19)]);
      },
      onError: (error) => console.error('🐛 [WebSocketDebug] System channel error:', error),
      enabled: true
    });

    return () => {
      unsubscribeJobs();
      unsubscribeSystem();
    };
  }, [isConnected, subscribe]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-md text-sm z-50"
      >
        Debug WS
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-80 bg-black text-green-400 p-4 rounded-md text-xs font-mono z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <div>WebSocket Debug</div>
        <div className="space-x-2">
          <button 
            onClick={() => {
              console.log('🐛 Test: Checking WebSocket connection...');
              setMessages(prev => [{
                timestamp: new Date().toLocaleTimeString(),
                type: 'test',
                channel: 'local',
                data: { message: 'Test message - connection active', isConnected }
              }, ...prev.slice(0, 19)]);
            }}
            className="text-blue-400 text-xs"
          >
            Test
          </button>
          <button onClick={() => setIsVisible(false)} className="text-red-400">×</button>
        </div>
      </div>
      <div className="mb-2 text-yellow-400">
        Status: {isConnected ? 'Connected' : 'Disconnected'} | {connectionState.connectionStatus}
      </div>
      <div className="space-y-1">
        {messages.length === 0 ? (
          <div className="text-gray-500">No messages received yet...</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="border-b border-gray-700 pb-1">
              <div className="text-blue-400">[{msg.timestamp}] {msg.channel}</div>
              <div className="text-yellow-400">Type: {msg.type}</div>
              <div className="text-gray-300 text-xs">{JSON.stringify(msg.data, null, 1)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}