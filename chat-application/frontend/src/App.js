import "./App.css";
import io from "socket.io-client";
import { useState, useEffect } from "react";
import Chat from "./Chat";

const socket = io.connect("https://real-time-chat-application-backend-eight.vercel.app", {
});

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Handling socket connection errors
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      alert('Failed to connect to the server. Please try again later.');
    });

    // Clean up on component unmount
    return () => {
      socket.off('connect_error');
      socket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", { username, room });
      setShowChat(true);
    } else {
      alert('Please enter both username and room ID');
    }
  };

  const handleLogout = () => {
    socket.emit('leave_room', { username, room }); // Optionally emit leave room event
    socket.disconnect();
    setShowChat(false);
    setUsername("");
    setRoom("");
    window.location.reload();
  };

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h3>Join A Chat</h3>
          <input
            type="text"
            placeholder="User Name..."
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            type="text"
            placeholder="Room ID..."
            onChange={(event) => setRoom(event.target.value)}
          />
          <button onClick={joinRoom}>Join A Room</button>
        </div>
      ) : (
        <Chat socket={socket} username={username} room={room} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
