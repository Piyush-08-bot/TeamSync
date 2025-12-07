# TeamSync Components Documentation

## 📁 Directory Structure

```
components/
├── StreamChatComponent.jsx  # Main chat component (direct messages only)
└── VideoCallComponent.jsx    # Video call component
```

## 🚀 Component Descriptions

### StreamChatComponent

Main chat interface for direct user-to-user messaging:

```jsx
import StreamChatComponent from "../components/StreamChatComponent";

// In your component
<StreamChatComponent />;
```

**Features:**

- Direct 1-on-1 messaging only
- Video call support for direct conversations
- Profile dropdown
- Notifications dropdown
- Search conversations

### VideoCallComponent

Video call component using Stream Video SDK:

```jsx
import VideoCallComponent from "../components/VideoCallComponent";

// In your component
<VideoCallComponent
  callId="call-id"
  onEndCall={() => console.log("Call ended")}
/>;
```

**Features:**

- Real-time video calling
- Screen sharing
- Video reactions
- End call functionality

## 🎨 Styling

All components use modern CSS with dark theme from `styles/chat.css`.

## 🔒 Security

All components require authentication and automatically handle:

- JWT token verification
- Stream token generation
- User session management

## 📝 Notes

- This is a simplified version focused on direct messaging only
- No channel/group functionality
- Video calls work only for direct conversations
