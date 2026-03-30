const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/chatapp")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const users = {}; // { socketId: username }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current users immediately
  socket.emit("user_list", users);

  // User joins
  socket.on("join", (username) => {
    users[socket.id] = username;

    console.log("Updated users:", users); // debug

    // Send updated list to everyone
    io.emit("user_list", users);
  });

  // Private message
  socket.on("private_message", ({ message, to }) => {
    if (!users[socket.id]) return; // safety check

    socket.to(to).emit("receive_message", {
      text: message,
      sender: socket.id,
      username: users[socket.id],
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    delete users[socket.id];

    io.emit("user_list", users);
  });
});

// Start server
server.listen(5000, () => {
  console.log("Server running on port 5000");
});
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});