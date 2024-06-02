const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");


app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Connect to MongoDB
mongoose.connect('mongodb+srv://root:root@books-store-mern.pl4k5pa.mongodb.net/chat-coll?retryWrites=true&w=majority&appName=Books-Store-MERN', {});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://real-time-chat-application-frontend-six.vercel.app",
    methods: ["GET", "POST"],
  },
});

let users = {}; // To track users in rooms

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (data) => {
    const { username, room } = data;
    socket.join(room);
    socket.username = username; 
    console.log(`User with ID: ${socket.id} joined room: ${room}`);

    // Add user to users object
    if (!users[room]) {
      users[room] = [];
    }
    if (!users[room].includes(username)) {
      users[room].push(username);
    }

    // Notify others in the room
    socket.to(room).emit("user_joined", username);

    // Notify all clients in the room of the current active users
    io.in(room).emit("active_users", users[room]);

    // Save user and room info to database
    const user = await User.findOneAndUpdate(
      { username },
      { $addToSet: { rooms: room } },
      { upsert: true, new: true }
    );

    // Fetch previous messages for the room
    const messages = await Message.find({ room }).sort({ _id: 1 }).exec();
    socket.emit("previous_messages", messages);
  });

  socket.on("send_message", async (data) => {
    const messageData = {
      ...data,
      date: new Date().toISOString().split('T')[0] // Add the current date
    };
    const message = new Message(messageData);
    await message.save();
  
    socket.to(data.room).emit("receive_message", messageData);
  });
  

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    // Remove user from users object and notify others in the room
    for (let room in users) {
      if (users[room]) {
        users[room] = users[room].filter((user) => user !== socket.username);
        if (users[room].length > 0) {
          io.in(room).emit("active_users", users[room]);
          socket.to(room).emit("user_left", socket.username);
        } else {
          delete users[room];
        }
      }
    }
  });

  socket.on("get_active_users", (room) => {
    if (users[room]) {
      socket.emit("active_users", users[room]);
    }
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
