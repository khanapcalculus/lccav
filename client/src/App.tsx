import React, { useState, useEffect } from 'react';
import VideoCall from './components/VideoCall';
import JoinRoom from './components/JoinRoom';
import './App.css';

const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);

  useEffect(() => {
    // Check if room ID is in URL params
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room');
    const urlUserName = params.get('name');
    
    if (urlRoomId) {
      setRoomId(urlRoomId);
    }
    if (urlUserName) {
      setUserName(urlUserName);
    }
  }, []);

  const handleJoin = (room: string, name: string) => {
    setRoomId(room);
    setUserName(name);
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
    setRoomId('');
    setUserName('');
  };

  if (!joined) {
    return <JoinRoom onJoin={handleJoin} initialRoomId={roomId} initialUserName={userName} />;
  }

  return <VideoCall roomId={roomId} userName={userName} onLeave={handleLeave} />;
};

export default App;

