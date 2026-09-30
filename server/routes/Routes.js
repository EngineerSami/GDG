const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  getCampusMessages,
} = require("../controllers/Controller");

// Authentication & Users
router.post("/users/login", loginUser);
router.post("/users/register", registerUser);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Events
router.get("/events", getEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

// Sponsors
router.post("/events/:id/sponsors", addSponsor);
router.put("/events/:eventId/sponsors/:sponsorId", updateSponsor);
router.delete("/events/:eventId/sponsors/:sponsorId", deleteSponsor);

// Chat Messages
router.get("/messages", getCampusMessages);

module.exports = router;