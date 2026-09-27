const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Connect to MongoDB via mongoose.config.js
require("./config/mongoose.config");

const appRoutes = require("./routes/Routes");

const app = express();
const PORT = process.env.PORT || 5000;

const { Message } = require("./models/Model"); // check relative path

io.on("connection", (socket) => {
  console.log("⚡ A user connected:", socket.id);

  // Client requests to join their campus room
  socket.on("join_campus_room", (campus) => {
    socket.join(campus);
    console.log(`Socket ${socket.id} joined campus room: ${campus}`);
  });

  // Client leaves a campus room (used when organizer switches tabs)
  socket.on("leave_campus_room", (campus) => {
    socket.leave(campus);
  });

  // Handle incoming message
  socket.on("send_message", async (msgData) => {
    try {
      const { senderName, senderRole, campus, text } = msgData;

      if (!text || !text.trim() || !campus) return;

      // Save to MongoDB
      const savedMessage = await Message.create({
        senderName,
        senderRole,
        campus,
        text: text.trim(),
      });

      // Emit strictly to users in that campus room
      io.to(campus).emit("receive_message", savedMessage);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all API endpoints under /api
app.use("/api", appRoutes);

app.get("/", (req, res) => {
  res.send("GDG AAU Unified Server is running...");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});