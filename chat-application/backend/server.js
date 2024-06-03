require('dotenv').config(); // Load environment variables from .env file

const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");
const path = require("path");

app.use(cors());
app.use(express.json()); // To parse JSON bodies

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "../frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "../frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Connect to MongoDB with error handling
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    //credentials: true
  },
});

let users = {}; // To track users in rooms

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (data) => {
    try {
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
      await User.findOneAndUpdate(
        { username },
        { $addToSet: { rooms: room } },
        { upsert: true, new: true }
      );

      // Fetch previous messages for the room
      const messages = await Message.find({ room }).sort({ _id: 1 }).exec();
      socket.emit("previous_messages", messages);
    } catch (error) {
      console.error("Error in join_room event:", error);
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const messageData = {
        ...data,
        date: new Date().toISOString().split('T')[0] // Add the current date
      };
      const message = new Message(messageData);
      await message.save();
    
      socket.to(data.room).emit("receive_message", messageData);
    } catch (error) {
      console.error("Error in send_message event:", error);
    }
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING on port ${PORT}`);
});
