import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import './VideoCall.css';

interface VideoCallProps {
  roomId: string;
  userName: string;
  onLeave: () => void;
}

interface PeerConnection {
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
}

const VideoCall: React.FC<VideoCallProps> = ({ roomId, userName, onLeave }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{userId: string, userName: string, message: string, timestamp: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState<Array<{userId: string, userName: string, socketId: string}>>([]);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const userIdRef = useRef<string>(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // STUN servers configuration (constant, moved outside component logic)
  const STUN_SERVERS = React.useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }), []);

  const getServerUrl = () => {
    // In production, use environment variable or default to a deployed backend
    return process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  };

  const getSocketOptions = () => {
    return {
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false,
      withCredentials: true
    };
  };

  const createPeerConnection = useCallback((socketId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(STUN_SERVERS);

    // Add local stream tracks (use ref to get current stream)
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, currentStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote track from', socketId, event.track.kind);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log('✅ Setting remote stream for', socketId, 'Tracks:', remoteStream.getTracks().map(t => t.kind));
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(socketId, remoteStream);
          return newMap;
        });
      }
    };

    // Log connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔗 Peer connection state for ${socketId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log('✅ Peer connection established with', socketId);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state for ${socketId}:`, peerConnection.iceConnectionState);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          target: socketId,
          candidate: event.candidate
        });
      }
    };

    return peerConnection;
  }, [STUN_SERVERS]); // Removed localStream dependency - use ref instead

  useEffect(() => {
    // Initialize socket connection (only once per room/user combination)
    const serverUrl = getServerUrl();
    console.log('Setting up socket for room:', roomId, 'user:', userName);
    
    // Clean up any existing socket
    if (socketRef.current) {
      console.log('Cleaning up existing socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }
    
    // Create new socket connection
    socketRef.current = io(serverUrl, getSocketOptions());

    const socket = socketRef.current;
    // Capture refs for cleanup
    const connectionsRef = peerConnectionsRef;

    // Add connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log('✅ Got user media, tracks:', stream.getTracks().map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'})`));
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Ensure all tracks are enabled
        stream.getTracks().forEach(track => {
          track.enabled = true;
          console.log(`  ✅ ${track.kind} track enabled:`, track.enabled);
        });
      })
      .catch(err => {
        console.error('Error accessing media devices:', err);
        alert('Could not access camera/microphone. Please check permissions.');
      });

    // Join room (wait for connection first)
    const joinRoom = () => {
      if (socket.connected) {
        socket.emit('join-room', roomId, userIdRef.current, userName);
        console.log('✅ Joined room:', roomId, 'as', userName);
      } else {
        console.log('⏳ Waiting for connection before joining room...');
        socket.once('connect', () => {
          socket.emit('join-room', roomId, userIdRef.current, userName);
          console.log('✅ Joined room after connect:', roomId);
        });
      }
    };

    // Try to join immediately or wait for connection
    joinRoom();

    // Handle existing users
    socket.on('existing-users', async (users: Array<{userId: string, userName: string, socketId: string}>) => {
      setParticipants(users);
      
      // Wait for stream if not ready (wait up to 3 seconds)
      let currentStream = localStreamRef.current;
      let attempts = 0;
      while (!currentStream && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        currentStream = localStreamRef.current;
        attempts++;
      }
      
      if (!currentStream) {
        console.error('❌ Local stream not available after waiting');
        return;
      }

      console.log('✅ Local stream ready, tracks:', currentStream.getTracks().map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'})`));
      
      for (const user of users) {
        const peerConnection = createPeerConnection(user.socketId);
        peerConnectionsRef.current.set(user.socketId, { peerConnection });

        // Add all tracks from local stream
        const tracks = currentStream.getTracks();
        console.log(`📤 Adding ${tracks.length} tracks to peer connection for ${user.socketId}`);
        tracks.forEach(track => {
          if (track.enabled) {
            peerConnection.addTrack(track, currentStream!);
            console.log(`  ✅ Added ${track.kind} track (enabled: ${track.enabled})`);
          } else {
            console.warn(`  ⚠️ Skipping disabled ${track.kind} track`);
          }
        });

        // Verify tracks were added
        const senders = peerConnection.getSenders();
        console.log(`📊 Peer connection has ${senders.length} senders:`, senders.map(s => s.track?.kind || 'no track'));

        // Create offer with audio/video
        try {
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await peerConnection.setLocalDescription(offer);
          console.log('📤 Sending offer to existing user', user.socketId);
          socket.emit('offer', {
            target: user.socketId,
            offer: offer
          });
        } catch (err) {
          console.error('Error creating offer for', user.socketId, err);
        }
      }
    });

    // Handle new user joined
    socket.on('user-joined', async (user: {userId: string, userName: string, socketId: string}) => {
      setParticipants(prev => [...prev, user]);
      
      // Wait for local stream
      let currentStream = localStreamRef.current;
      let attempts = 0;
      while (!currentStream && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        currentStream = localStreamRef.current;
        attempts++;
      }

      if (!currentStream) {
        console.error('❌ Local stream not available for new user');
        return;
      }

      const peerConnection = createPeerConnection(user.socketId);
      peerConnectionsRef.current.set(user.socketId, { peerConnection });

      // Add all tracks from local stream
      const tracks = currentStream.getTracks();
      console.log(`📤 Adding ${tracks.length} tracks to peer connection for new user ${user.socketId}`);
      tracks.forEach(track => {
        if (track.enabled) {
          peerConnection.addTrack(track, currentStream!);
          console.log(`  ✅ Added ${track.kind} track (enabled: ${track.enabled})`);
        } else {
          console.warn(`  ⚠️ Skipping disabled ${track.kind} track`);
        }
      });

      // Verify tracks were added
      const senders = peerConnection.getSenders();
      console.log(`📊 Peer connection has ${senders.length} senders:`, senders.map(s => s.track?.kind || 'no track'));

      // Create offer with audio/video
      try {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peerConnection.setLocalDescription(offer);
        console.log('📤 Sending offer to new user', user.socketId);
        socket.emit('offer', {
          target: user.socketId,
          offer: offer
        });
      } catch (err) {
        console.error('Error creating offer for', user.socketId, err);
      }
    });

    // Handle offer
    socket.on('offer', async (data: {offer: RTCSessionDescriptionInit, sender: string}) => {
      // Check if connection already exists
      if (peerConnectionsRef.current.has(data.sender)) {
        console.log('Peer connection already exists for', data.sender);
        return;
      }

      const peerConnection = createPeerConnection(data.sender);
      
      // Add local stream tracks if available
      const currentStream = localStreamRef.current;
      if (currentStream) {
        const tracks = currentStream.getTracks();
        console.log(`📤 Adding ${tracks.length} tracks to peer connection for ${data.sender}`);
        tracks.forEach(track => {
          if (track.enabled) {
            peerConnection.addTrack(track, currentStream);
            console.log(`  ✅ Added ${track.kind} track (enabled: ${track.enabled})`);
          } else {
            console.warn(`  ⚠️ Skipping disabled ${track.kind} track`);
          }
        });

        // Verify tracks were added
        const senders = peerConnection.getSenders();
        console.log(`📊 Peer connection has ${senders.length} senders:`, senders.map(s => s.track?.kind || 'no track'));
      } else {
        console.warn('⚠️ No local stream available when handling offer');
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peerConnection.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peerConnection.setLocalDescription(answer);
        console.log('📥 Sending answer to', data.sender);
        socket.emit('answer', {
          target: data.sender,
          answer: answer
        });

        peerConnectionsRef.current.set(data.sender, { peerConnection });
      } catch (err) {
        console.error('Error handling offer from', data.sender, err);
        peerConnection.close();
      }
    });

    // Handle answer
    socket.on('answer', async (data: {answer: RTCSessionDescriptionInit, sender: string}) => {
      const peerConnection = peerConnectionsRef.current.get(data.sender)?.peerConnection;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    // Handle ICE candidate
    socket.on('ice-candidate', async (data: {candidate: RTCIceCandidateInit, sender: string}) => {
      const peerConnection = peerConnectionsRef.current.get(data.sender)?.peerConnection;
      if (peerConnection && data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    // Handle chat messages
    socket.on('chat-message', (data: {userId: string, userName: string, message: string, timestamp: string}) => {
      setChatMessages(prev => [...prev, data]);
    });

    // Handle user toggle
    socket.on('user-toggle', (data: {socketId: string, video: boolean, audio: boolean}) => {
      // Update UI to reflect user's video/audio state
      console.log('User toggle:', data);
    });

    // Handle user left
    socket.on('user-left', (data: {socketId: string, userId: string, userName: string}) => {
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.socketId);
        return newMap;
      });
      peerConnectionsRef.current.delete(data.socketId);
    });

    return () => {
      // Cleanup - capture current values
      const currentStream = localStreamRef.current;
      const currentConnections = connectionsRef.current;
      
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      currentConnections.forEach(({ peerConnection }) => {
        peerConnection.close();
      });
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName]); // Removed createPeerConnection to prevent re-runs

  // Update peer connections when local stream becomes available
  useEffect(() => {
    if (localStream && !isScreenSharing) {
      // Add tracks to existing peer connections that don't have them
      peerConnectionsRef.current.forEach(({ peerConnection }, socketId) => {
        const senders = peerConnection.getSenders();
        const hasVideo = senders.some(s => s.track?.kind === 'video');
        const hasAudio = senders.some(s => s.track?.kind === 'audio');

        localStream.getTracks().forEach(track => {
          if (track.kind === 'video' && !hasVideo) {
            peerConnection.addTrack(track, localStream);
          } else if (track.kind === 'audio' && !hasAudio) {
            peerConnection.addTrack(track, localStream);
          }
        });
      });
    }
  }, [localStream, isScreenSharing]);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
        socketRef.current?.emit('user-toggle', { video: !isVideoOn, audio: isAudioOn });
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
        socketRef.current?.emit('user-toggle', { video: isVideoOn, audio: !isAudioOn });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        // Request screen share
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: 'always' } as MediaTrackConstraints,
          audio: true 
        });
        
        const videoTrack = screenStream.getVideoTracks()[0];
        const audioTrack = screenStream.getAudioTracks()[0];
        
        if (!videoTrack) {
          throw new Error('No video track in screen stream');
        }

        // Store screen stream reference
        screenStreamRef.current = screenStream;

        // Replace video track in all peer connections
        const replacePromises = Array.from(peerConnectionsRef.current.entries()).map(
          async ([socketId, { peerConnection }]) => {
            const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              try {
                await sender.replaceTrack(videoTrack);
                console.log(`Replaced video track for ${socketId}`);
              } catch (err) {
                console.error(`Error replacing track for ${socketId}:`, err);
              }
            } else {
              // Add track if sender doesn't exist
              peerConnection.addTrack(videoTrack, screenStream);
            }
          }
        );

        // Also replace/add audio track if available
        if (audioTrack) {
          Array.from(peerConnectionsRef.current.entries()).forEach(([socketId, { peerConnection }]) => {
            const sender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
            if (sender) {
              sender.replaceTrack(audioTrack).catch(err => 
                console.error(`Error replacing audio track for ${socketId}:`, err)
              );
            } else {
              peerConnection.addTrack(audioTrack, screenStream);
            }
          });
        }

        await Promise.all(replacePromises);

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Handle screen share end (user stops sharing)
        videoTrack.onended = () => {
          console.log('Screen share ended by user');
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
          }
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        console.log('Screen sharing started');
      } catch (err) {
        console.error('Error sharing screen:', err);
        alert('Could not share screen. Please check permissions and try again.');
        setIsScreenSharing(false);
      }
    } else {
      // Stop screen share and resume camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          // Replace video track back to camera in all peer connections
          const replacePromises = Array.from(peerConnectionsRef.current.entries()).map(
            async ([socketId, { peerConnection }]) => {
              const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
              if (sender) {
                try {
                  await sender.replaceTrack(videoTrack);
                  console.log(`Restored camera track for ${socketId}`);
                } catch (err) {
                  console.error(`Error restoring track for ${socketId}:`, err);
                }
              }
            }
          );

          await Promise.all(replacePromises);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }
      setIsScreenSharing(false);
      console.log('Screen sharing stopped, camera resumed');
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', { message: chatInput.trim() });
      setChatInput('');
    }
  };

  const handleLeave = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peerConnectionsRef.current.forEach(({ peerConnection }) => {
      peerConnection.close();
    });
    socketRef.current?.disconnect();
    onLeave();
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <div className="video-grid">
          {/* Local video */}
          <div className="video-item local-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-element"
            />
            <div className="video-label">
              {userName} (You)
            </div>
          </div>

          {/* Remote videos */}
          {Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
            const participant = participants.find(p => p.socketId === socketId);
            return (
              <div key={socketId} className="video-item">
                <video
                  autoPlay
                  playsInline
                  muted={false}
                  className="video-element"
                  ref={(videoElement) => {
                    if (videoElement) {
                      if (videoElement.srcObject !== stream) {
                        console.log('🎥 Setting remote video srcObject for', socketId);
                        videoElement.srcObject = stream;
                      }
                      // Ensure audio is enabled
                      videoElement.muted = false;
                      // Play the video
                      videoElement.play().catch(err => {
                        console.error('Error playing remote video:', err);
                      });
                    }
                  }}
                />
                <div className="video-label">
                  {participant?.userName || 'Unknown'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="control-group">
          <button
            onClick={toggleAudio}
            className={`control-btn ${!isAudioOn ? 'active' : ''}`}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? '🎤' : '🔇'}
          </button>
          <button
            onClick={toggleVideo}
            className={`control-btn ${!isVideoOn ? 'active' : ''}`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? '📹' : '📵'}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            title="Share screen"
          >
            📺
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`control-btn ${showChat ? 'active' : ''}`}
            title="Toggle chat"
          >
            💬
          </button>
          <button
            onClick={handleLeave}
            className="control-btn leave-btn"
            title="Leave call"
          >
            🚪 Leave
          </button>
        </div>
        <div className="room-info">
          <span>Room: {roomId}</span>
          <span>Participants: {participants.length + 1}</span>
        </div>
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Chat</h3>
            <button onClick={() => setShowChat(false)} className="close-chat">×</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <div className="chat-message-header">
                  <strong>{msg.userName}</strong>
                  <span className="chat-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="chat-message-text">{msg.message}</div>
              </div>
            ))}
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button onClick={sendChatMessage} className="chat-send-btn">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;

