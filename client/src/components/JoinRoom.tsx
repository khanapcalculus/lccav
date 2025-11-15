import React, { useState } from 'react';
import './JoinRoom.css';

interface JoinRoomProps {
  onJoin: (roomId: string, userName: string) => void;
  initialRoomId?: string;
  initialUserName?: string;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin, initialRoomId = '', initialUserName = '' }) => {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [userName, setUserName] = useState(initialUserName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userName.trim()) {
      onJoin(roomId.trim(), userName.trim());
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 15);
    setRoomId(id);
  };

  return (
    <div className="join-room">
      <div className="join-room-container">
        <h1>LCCAV Video Call</h1>
        <p className="subtitle">Join or create a video call room</p>
        
        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <div className="input-group">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter or generate room ID"
                required
              />
              <button type="button" onClick={generateRoomId} className="generate-btn">
                Generate
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <button type="submit" className="join-btn">
            Join Room
          </button>
        </form>

        <div className="info">
          <p>💡 Share the Room ID with others to invite them</p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;

