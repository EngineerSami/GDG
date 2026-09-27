const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

// Connect MongoDB Database
require("./config/mongoose.config");

// Models and Routes
const { Message } = require("./models/Model"); // Adjust relative path if Model.js is elsewhere
const appRoutes = require("./routes/Routes");   // Adjust relative path if Routes.js is elsewhere

const app = express();

// 1. Create the HTTP server using Express app
const server = http.createServer(app);

// 2. Initialize Socket.IO instance attached to the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Attach 'io' to req object so your controllers can emit socket events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 4. Socket.IO Connection & Events
io.on("connection", (socket) => {
  console.log("⚡ A user connected:", socket.id);

  // Client requests to join their campus room
  socket.on("join_campus_room", (campus) => {
    socket.join(campus);
    console.log(`Socket ${socket.id} joined campus room: ${campus}`);
  });

  // Client leaves a campus room (e.g. Organizer switching tabs)
  socket.on("leave_campus_room", (campus) => {
    socket.leave(campus);
  });

  // Handle incoming chat message
  socket.on("send_message", async (msgData) => {
    try {
      const { senderName, senderRole, campus, text } = msgData;

      if (!text || !text.trim() || !campus) return;

      // Save message in MongoDB
      const savedMessage = await Message.create({
        senderName: senderName || "Member",
        senderRole: senderRole || "Member",
        campus,
        text: text.trim(),
      });

      // Broadcast only to users joined to this campus room
      io.to(campus).emit("receive_message", savedMessage);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/api", appRoutes);

const PORT = process.env.PORT || 10000;

// NOTE: server.listen MUST be used instead of app.listen for WebSockets to work!
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});