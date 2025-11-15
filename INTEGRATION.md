# Integration Guide for Tutoring Application

This guide explains how to integrate the LCCAV video calling application with your tutoring application's whiteboard.

## Integration Methods

### Method 1: Iframe Embedding (Easiest)

Embed the video call as an iframe in your whiteboard component:

```html
<iframe 
  src="https://khanapcalculus.github.io/lccav?room=ROOM_ID&name=USER_NAME"
  width="100%" 
  height="600px"
  allow="camera; microphone; display-capture"
  style="border: none; border-radius: 8px;"
></iframe>
```

**React Example:**
```tsx
import React from 'react';

const WhiteboardWithVideo = ({ roomId, userName }) => {
  return (
    <div className="whiteboard-container">
      <div className="whiteboard">
        {/* Your whiteboard component */}
      </div>
      <div className="video-call-panel">
        <iframe 
          src={`https://khanapcalculus.github.io/lccav?room=${roomId}&name=${userName}`}
          width="100%" 
          height="600px"
          allow="camera; microphone; display-capture"
          style={{ border: 'none', borderRadius: '8px' }}
        />
      </div>
    </div>
  );
};
```

### Method 2: Component Integration (More Control)

Copy the React components and integrate directly:

1. **Copy Components**:
   - Copy `client/src/components/VideoCall.tsx` and `VideoCall.css`
   - Copy `client/src/components/JoinRoom.tsx` and `JoinRoom.css`
   - Install dependencies: `socket.io-client`, `react`, `react-dom`

2. **Import and Use**:
```tsx
import VideoCall from './components/VideoCall';

const TutoringSession = ({ sessionId, studentName, tutorName }) => {
  const [showVideo, setShowVideo] = useState(false);
  
  return (
    <div className="tutoring-session">
      <Whiteboard sessionId={sessionId} />
      
      {showVideo && (
        <div className="video-overlay">
          <VideoCall 
            roomId={sessionId}
            userName={tutorName}
            onLeave={() => setShowVideo(false)}
          />
        </div>
      )}
      
      <button onClick={() => setShowVideo(!showVideo)}>
        {showVideo ? 'Hide Video' : 'Show Video'}
      </button>
    </div>
  );
};
```

### Method 3: Side-by-Side Layout

Create a split view with whiteboard and video:

```tsx
const TutoringLayout = ({ roomId, userName }) => {
  return (
    <div className="tutoring-layout">
      <div className="whiteboard-section">
        {/* Your whiteboard */}
        <Whiteboard />
      </div>
      <div className="video-section">
        <VideoCall 
          roomId={roomId}
          userName={userName}
          onLeave={() => {/* handle leave */}}
        />
      </div>
    </div>
  );
};
```

**CSS:**
```css
.tutoring-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  height: 100vh;
  gap: 20px;
  padding: 20px;
}

@media (max-width: 768px) {
  .tutoring-layout {
    grid-template-columns: 1fr;
  }
}
```

## API Integration

### Generate Room ID

Generate a unique room ID for each tutoring session:

```javascript
// In your tutoring app
const generateRoomId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Use session ID as room ID
const sessionId = generateRoomId();
```

### Share Room ID

Share the room ID with students:

```javascript
// Send room ID to student via your existing communication channel
const shareRoomLink = (sessionId, studentId) => {
  const link = `https://khanapcalculus.github.io/lccav?room=${sessionId}&name=Student`;
  // Send via your messaging system
  sendMessage(studentId, `Join video call: ${link}`);
};
```

## Customization

### Styling

Override CSS variables or styles:

```css
/* In your tutoring app CSS */
.video-call {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.controls {
  background: your-brand-color;
}
```

### Backend URL

If you deploy your own backend, update the server URL:

```javascript
// In VideoCall.tsx or via environment variable
const getServerUrl = () => {
  return process.env.REACT_APP_SERVER_URL || 'https://your-backend-url.com';
};
```

## Events and Callbacks

### Handle User Actions

```tsx
<VideoCall 
  roomId={roomId}
  userName={userName}
  onLeave={() => {
    // Handle user leaving
    console.log('User left video call');
    // Maybe show a message or redirect
  }}
/>
```

### Listen to Socket Events

If integrating components directly, you can listen to socket events:

```javascript
import { io } from 'socket.io-client';

const socket = io('YOUR_BACKEND_URL');

socket.on('user-joined', (user) => {
  console.log('User joined:', user);
  // Update your UI
});

socket.on('user-left', (user) => {
  console.log('User left:', user);
  // Update your UI
});
```

## Best Practices

1. **Room ID Management**: Use your session/tutoring ID as the room ID for consistency
2. **User Names**: Use actual user names from your tutoring app
3. **Permissions**: Ensure camera/microphone permissions are requested appropriately
4. **Error Handling**: Handle cases where video call fails to initialize
5. **Mobile Responsiveness**: Test on mobile devices for student access

## Example: Complete Integration

```tsx
import React, { useState, useEffect } from 'react';
import VideoCall from './components/VideoCall';
import Whiteboard from './Whiteboard'; // Your whiteboard component

const TutoringSession = ({ sessionId, tutorId, studentId }) => {
  const [tutorName, setTutorName] = useState('');
  const [showVideo, setShowVideo] = useState(true);
  
  useEffect(() => {
    // Fetch tutor name from your API
    fetchTutorName(tutorId).then(setTutorName);
  }, [tutorId]);
  
  return (
    <div className="tutoring-session-container">
      <div className="main-content">
        <Whiteboard sessionId={sessionId} />
      </div>
      
      {showVideo && (
        <div className="video-panel">
          <VideoCall 
            roomId={sessionId} // Use session ID as room ID
            userName={tutorName}
            onLeave={() => setShowVideo(false)}
          />
        </div>
      )}
      
      <button 
        className="toggle-video-btn"
        onClick={() => setShowVideo(!showVideo)}
      >
        {showVideo ? 'Hide Video' : 'Show Video'}
      </button>
    </div>
  );
};

export default TutoringSession;
```

## Troubleshooting

### CORS Issues
- Ensure backend `CLIENT_URL` includes your tutoring app domain
- Add your domain to allowed origins in backend

### Permission Issues
- Request permissions before initializing video call
- Show clear instructions to users

### Connection Issues
- Check backend server is running and accessible
- Verify WebRTC STUN servers are reachable
- Check browser console for errors

