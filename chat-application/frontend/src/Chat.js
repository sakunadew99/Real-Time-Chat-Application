import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

function Chat({ socket, username, room, onLogout }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  const colors = ["#7289da", "#424549", "#99aab5", "#7da565", "#7e61ab"];
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

  const sendMessage = async () => {
    if (currentMessage !== "" || selectedImage) {
      let imageUrl = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        try {
          const response = await axios.post("http://localhost:3001/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          imageUrl = response.data.imageUrl;
        } catch (error) {
          console.error("Error uploading image", error);
        }
        setSelectedImage(null);
      }

      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        image: imageUrl,
        time: formatTime(new Date(Date.now())),
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
  }, [socket, username]);

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
          {messageList.map((messageContent, index) => {
            return (
              <div
                className="message"
                id={username === messageContent.author ? "you" : "other"}
                key={index}
              >
                <div>
                  <div
                    className="message-content"
                    style={{ backgroundColor: getColor(messageContent.author) }}
                  >
                    {messageContent.message && <p>{messageContent.message}</p>}
                    {messageContent.image && (
                      <img src={messageContent.image} alt="sent image" style={{ maxWidth: "100%" }} />
                    )}
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">
                      {username === messageContent.author ? "you" : messageContent.author}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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
        <input
          type="file"
          onChange={(event) => setSelectedImage(event.target.files[0])}
          style={{ display: "none" }}
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <button>&#128247;</button>
        </label>
        <button onClick={sendMessage}>&#9658;</button>
      </div>
    </div>
  );
}

export default Chat;
