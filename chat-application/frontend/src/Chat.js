import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function Chat({ socket, username, room, onLogout }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  


  const colors = [
    "#7289da", "#424549", "#99aab5", "#7da565", "#7e61ab", "#ff5733","#33ff57","#3357ff",
    "#f39c12","#8e44ad", "#e74c3c", "#2ecc71",  "#1abc9c", "#3498db",
    "#9b59b6","#e67e22",   "#ecf0f1", "#95a5a6", "#34495e", "#7f8c8d", 
  ];
  
  const userColors = {};

  const getColor = (user) => {
    if (!userColors[user]) {
      userColors[user] = colors[Object.keys(userColors).length % colors.length];
    }
    return userColors[user];
  };

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: formatTime(new Date(Date.now())),
        date: new Date().toISOString().split('T')[0] // Add the current date
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    socket.off("receive_message").on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
      if (data.author !== username) {
        toast.info(`${data.author} sent a message`);
      }
    });

    socket.on("previous_messages", (messages) => {
      setMessageList(messages);
    });

    socket.on("user_joined", (user) => {
      toast.success(`${user} has joined the chat`);
      setActiveUsers((users) => [...users, user]);
    });

    socket.on("user_left", (user) => {
      toast.warn(`${user} has left the chat`);
      setActiveUsers((users) => users.filter((u) => u !== user));
    });

    socket.on("active_users", (users) => {
      setActiveUsers(users.filter((user) => user !== username));
    });

    socket.emit("get_active_users", room);

    return () => {
      socket.off("receive_message");
      socket.off("previous_messages");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, [socket, username, room]);

  const renderMessages = () => {
    let lastDate = null;

    return messageList.map((messageContent, index) => {
      const messageDate = formatDate(messageContent.date);
      const showDate = lastDate !== messageDate;
      lastDate = messageDate;

      return (
        <React.Fragment key={index}>
          {showDate && <div className="date-divider">{messageDate}</div>}
          <div className="message" id={username === messageContent.author ? "you" : "other"}>
            <div>
              <div className="message-content" style={{ backgroundColor: getColor(messageContent.author) }}>
                <p>{messageContent.message}</p>
              </div>
              <div className="message-meta">
                <p id="time">{messageContent.time}</p>
                <p id="author">{username === messageContent.author ? "you" : messageContent.author}</p>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="chat-window">
      <ToastContainer />
      <div className="chat-header">
        <div className="user-circle" title={username}>
          {username.charAt(0).toUpperCase()}
          <div className="full-name">{username}</div>
        </div>
        <p>Live Chat - Room: {room}</p>
        <div className="active-users">
          {activeUsers.map((user, index) => (
            <div className="user-circle" key={index} title={user}>
              {user.charAt(0).toUpperCase()}
              <div className="full-name">{user}</div>
            </div>
          ))}
        </div>
        <button className="logout-button" onClick={onLogout}>Logout</button>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {renderMessages()}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>
      </div>
    </div>
  );
}

export default Chat;
