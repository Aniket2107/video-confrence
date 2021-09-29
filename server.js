const express = require("express");
// const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const app = express();

app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

const io = require("socket.io")(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/:room", (req, res) => {
  res.render("room", {
    roomId: req.params.room,
    port: process.env.NODE_ENV === "production" ? 443 : 3001,
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);

    socket.to(roomId).emit("user-connected", userId);

    socket.on("send-message", (message, username) => {
      socket.to(roomId).emit("chat-message", {
        message: message,
        userId: username,
      });
    });

    socket.on("shareScreen", (video) => {
      socket.to(roomId).emit("screenShare", video);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});
