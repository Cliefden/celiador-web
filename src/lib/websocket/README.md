# WebSocket Channel System

A generic, reusable WebSocket system for managing real-time channels in the Celiador application.

## Overview

This system provides:

- **Single WebSocket Connection**: One global connection shared across all components
- **Channel-based Subscriptions**: Subscribe to specific channels (activities, conversations, jobs, etc.)
- **Automatic Reconnection**: Robust reconnection logic with exponential backoff
- **React Integration**: Easy-to-use hooks for different channel types
- **Error Handling**: Comprehensive error reporting and user-friendly status messages
- **TypeScript Support**: Full type safety for all channel data

## Architecture

```
WebSocketChannelManager (Singleton)
├── Connection Management
├── Channel Subscriptions
├── Message Routing
└── Error Handling

React Hooks
├── useWebSocketChannel (Base hook)
├── useActivitiesChannel (Activities-specific)
├── useConversationsChannel (Conversations-specific)
└── useJobsChannel (Jobs-specific)
```

## Basic Usage

### 1. Activities Channel

```tsx
import { useActivitiesChannel } from '../lib/websocket';

function ActivityFeed({ projectId }: { projectId: string }) {
  const {
    activities,
    lastActivity,
    isConnected,
    getUserFriendlyStatus
  } = useActivitiesChannel(projectId);

  return (
    <div>
      <div>Status: {getUserFriendlyStatus()}</div>
      {activities.map(activity => (
        <div key={activity.id}>{activity.title}</div>
      ))}
    </div>
  );
}
```

### 2. Conversations Channel

```tsx
import { useConversationsChannel } from '../lib/websocket';

function ConversationView({ conversationId }: { conversationId: string }) {
  const {
    messages,
    lastMessage,
    isConnected
  } = useConversationsChannel(conversationId);

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}
```

### 3. Jobs Channel

```tsx
import { useJobsChannel } from '../lib/websocket';

function JobMonitor({ projectId }: { projectId: string }) {
  const {
    jobs,
    lastJobUpdate,
    isConnected
  } = useJobsChannel(projectId);

  return (
    <div>
      {jobs.map(job => (
        <div key={job.id}>
          {job.title} - {job.status}
        </div>
      ))}
    </div>
  );
}
```

### 4. Custom Channel

```tsx
import { useWebSocketChannel } from '../lib/websocket';

function CustomChannelComponent() {
  const { subscribe, isConnected } = useWebSocketChannel();
  const [customData, setCustomData] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribe({
      channel: 'custom_channel',
      onMessage: (message) => {
        console.log('Custom message:', message);
        setCustomData(prev => [...prev, message.data]);
      },
      onError: (error) => {
        console.error('Custom channel error:', error);
      }
    });

    return unsubscribe;
  }, [subscribe]);

  return <div>{/* Your component JSX */}</div>;
}
```

## Message Format

All WebSocket messages follow this format:

```typescript
interface WebSocketMessage<TData = any> {
  type: string;           // Message type (e.g., 'activity_created', 'message_created')
  channel: string;        // Channel name (e.g., 'activities', 'conversations')
  data: TData;           // Channel-specific data
  userId?: string;       // User ID (optional)
  timestamp: string;     // ISO timestamp
}
```

## Channel Types

### Activities Channel

**Channel**: `activities`

**Message Types**:
- `activity_created` - New activity created
- `activity_updated` - Activity updated
- `activities_bulk` - Bulk activities data

**Data Format**:
```typescript
{
  id: string;
  type: 'job' | 'conversation' | 'file' | 'system' | 'user_activity' | 'message' | 'deployment';
  title: string;
  description: string;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  timestamp: string;
  projectId: string;
  metadata?: any;
}
```

### Conversations Channel

**Channel**: `conversations`

**Message Types**:
- `message_created` - New message in conversation
- `message_updated` - Message updated
- `conversation_created` - New conversation created
- `conversation_updated` - Conversation updated

**Data Format**:
```typescript
{
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversationId: string;
  timestamp: string;
  metadata?: any;
}
```

### Jobs Channel

**Channel**: `jobs`

**Message Types**:
- `job_created` - New job created
- `job_updated` - Job status/progress updated
- `job_completed` - Job finished successfully
- `job_failed` - Job failed

**Data Format**:
```typescript
{
  id: string;
  type: 'SCAFFOLD' | 'CODEGEN' | 'EDIT' | 'TEST' | 'AI_ACTION';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  projectId: string;
  progress?: number;
  result?: any;
  error?: string;
  timestamp: string;
}
```

## Error Handling

The system provides comprehensive error handling:

```typescript
interface WebSocketError {
  type: 'connection' | 'authentication' | 'network' | 'unknown';
  message: string;
  userMessage: string;        // User-friendly message
  code?: number;
  canRetry: boolean;
  isTokenExpired?: boolean;
  severity: 'low' | 'medium' | 'high';
  suggestedAction?: string;
}
```

## Connection States

- `Disconnected` - Not connected
- `Connecting...` - Attempting to connect
- `Authenticating...` - Connected, authenticating
- `Authenticated` - Ready to receive messages
- `Reconnecting in Xs...` - Reconnecting after failure
- `Connection failed` - Max retries exceeded

## Best Practices

### 1. Enable/Disable Subscriptions

```tsx
const { subscribe } = useWebSocketChannel({ enabled: !!session });
```

### 2. Handle Connection States

```tsx
const { isConnected, getUserFriendlyStatus } = useActivitiesChannel(projectId);

if (!isConnected) {
  return <div>Connecting... {getUserFriendlyStatus()}</div>;
}
```

### 3. Cleanup Subscriptions

```tsx
useEffect(() => {
  const unsubscribe = subscribe({
    channel: 'my_channel',
    onMessage: handleMessage
  });

  return unsubscribe; // Always return unsubscribe function
}, [subscribe]);
```

### 4. Error Boundaries

```tsx
const { subscribe } = useWebSocketChannel();

useEffect(() => {
  const unsubscribe = subscribe({
    channel: 'activities',
    onMessage: (message) => {
      try {
        // Handle message
      } catch (error) {
        console.error('Message handling error:', error);
      }
    },
    onError: (error) => {
      // Handle channel-specific errors
      if (error.severity === 'high') {
        // Show user notification
      }
    }
  });

  return unsubscribe;
}, [subscribe]);
```

## Migration from Old System

### Before (useSimpleWebSocket)
```tsx
const { isConnected, lastMessage } = useSimpleWebSocket({
  url: getWebSocketUrl(),
  token: session?.access_token || '',
  onMessage: (data) => {
    if (data.type === 'activity_created') {
      handleActivity(data);
    }
  }
});
```

### After (New Channel System)
```tsx
const { activities, isConnected } = useActivitiesChannel(projectId);
```

## Global Configuration

### Disable React Strict Mode (if needed)
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable for WebSocket stability
};
```

### Environment Variables
```bash
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:4000  # Backend WebSocket URL
```

## Troubleshooting

### 1. Connection Issues
- Check `NEXT_PUBLIC_ORCHESTRATOR_URL` environment variable
- Verify backend WebSocket server is running
- Check browser console for connection errors

### 2. Authentication Issues
- Ensure session token is valid
- Check token expiration
- Verify backend authentication handling

### 3. Message Not Received
- Check channel subscription is active
- Verify message routing in backend
- Check browser network tab for WebSocket frames

### 4. React Strict Mode Issues
- Consider disabling React Strict Mode in development
- Ensure cleanup functions are properly implemented
- Check for duplicate subscriptions

## Development Notes

- The system uses a singleton WebSocket manager to avoid multiple connections
- React Strict Mode can cause double effect invocation - the system handles this gracefully
- All subscriptions are automatically cleaned up when components unmount
- The global manager persists across component re-renders for better performance