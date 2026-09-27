const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Connect to MongoDB via mongoose.config.js
require("./config/mongoose.config");

const appRoutes = require("./routes/Routes");

const app = express();
const PORT = process.env.PORT || 5000;

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